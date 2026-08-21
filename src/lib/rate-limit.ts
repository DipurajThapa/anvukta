import "server-only";

import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

import { cookies, headers } from "next/headers";

import { prisma } from "@/lib/db";

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
};

/** Cleanup runs on a fraction of calls; every call would be a wasted write. */
const CLEANUP_EVERY = 50;
let callsSinceCleanup = 0;

/**
 * The salt behind every client identifier. Without it the fingerprints are
 * guessable, which would let someone forge another visitor's identity and
 * consume their allowance.
 */
function secret(): string {
  const value = process.env.SESSION_SECRET?.trim();

  if (!value || value.length < 32) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "SESSION_SECRET must be set to at least 32 characters in production. " +
          "Rate limiting and abuse control depend on it.",
      );
    }
    return "anvukta-development-only-salt";
  }

  return value;
}

/**
 * Fixed-window counter in the database, so limits survive a restart.
 *
 * The increment is a single conditional UPDATE rather than a read followed by a
 * write, because two requests arriving together would otherwise both read the
 * old count and both be let through.
 *
 * Single instance only. Behind more than one server, move this to a shared
 * store such as Redis.
 */
export async function rateLimit(
  key: string,
  limit: number,
  windowSeconds: number,
): Promise<RateLimitResult> {
  const now = new Date();

  if (++callsSinceCleanup >= CLEANUP_EVERY) {
    callsSinceCleanup = 0;
    await prisma.rateLimit.deleteMany({ where: { expiresAt: { lt: now } } });
  }

  // Take a slot only if the window is still live and has room left.
  const claimed = await prisma.rateLimit.updateMany({
    where: { key, expiresAt: { gt: now }, count: { lt: limit } },
    data: { count: { increment: 1 } },
  });

  if (claimed.count > 0) {
    const row = await prisma.rateLimit.findUnique({
      where: { key },
      select: { count: true },
    });
    return {
      allowed: true,
      remaining: Math.max(0, limit - (row?.count ?? limit)),
      retryAfterSeconds: 0,
    };
  }

  // Nothing claimed: either the window is full, or there is no live window.
  const existing = await prisma.rateLimit.findUnique({ where: { key } });

  if (existing && existing.expiresAt.getTime() > now.getTime()) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(
        1,
        Math.ceil((existing.expiresAt.getTime() - now.getTime()) / 1000),
      ),
    };
  }

  // Start a fresh window. Two requests arriving together at the rollover would
  // both find the old window expired, so the reset is conditional on it still
  // being expired: the first one wins and the second falls through to a plain
  // increment rather than resetting the counter a second time.
  const expiresAt = new Date(now.getTime() + windowSeconds * 1000);

  const reset = await prisma.rateLimit.updateMany({
    where: { key, expiresAt: { lte: now } },
    data: { count: 1, expiresAt },
  });

  if (reset.count > 0) {
    return { allowed: true, remaining: limit - 1, retryAfterSeconds: 0 };
  }

  try {
    await prisma.rateLimit.create({ data: { key, count: 1, expiresAt } });
    return { allowed: true, remaining: limit - 1, retryAfterSeconds: 0 };
  } catch {
    // Someone else created the row in the gap. Fall back to claiming a slot in
    // the window they just opened.
    const claimedAfterRace = await prisma.rateLimit.updateMany({
      where: { key, expiresAt: { gt: now }, count: { lt: limit } },
      data: { count: { increment: 1 } },
    });
    return {
      allowed: claimedAfterRace.count > 0,
      remaining: 0,
      retryAfterSeconds: claimedAfterRace.count > 0 ? 0 : windowSeconds,
    };
  }
}

/**
 * Clears a counter. Used after a successful sign-in so a few mistyped passwords
 * followed by the right one does not leave the account half locked.
 */
export async function resetRateLimit(key: string): Promise<void> {
  await prisma.rateLimit.deleteMany({ where: { key } });
}

/* --------------------------------------------------------------------------
   Identifying a client
   -------------------------------------------------------------------------- */

/**
 * Whether X-Forwarded-For can be believed.
 *
 * Anyone can put any value in that header. Read straight from the request it is
 * not an identity, it is a free choice of identity, and a spammer simply picks a
 * new one per request to reset every limit. Only a proxy we control, which
 * overwrites the header, makes it trustworthy. Off unless you say otherwise.
 */
function trustsProxyHeaders(): boolean {
  const value = process.env.TRUST_PROXY_HEADERS?.trim().toLowerCase();
  return value === "true" || value === "1" || value === "yes";
}

const CLIENT_COOKIE = "anvukta_cid";
/**
 * Long enough to recognise a returning visitor across a few sessions, short
 * enough to stay proportionate to what it is for. The privacy notice states
 * this figure, so the two move together.
 */
export const CLIENT_COOKIE_MAX_AGE_DAYS = 30;
const CLIENT_COOKIE_MAX_AGE = 60 * 60 * 24 * CLIENT_COOKIE_MAX_AGE_DAYS;

function sign(id: string): string {
  return createHmac("sha256", secret()).update(id).digest("base64url");
}

function verify(value: string): string | null {
  const [id, signature] = value.split(".");
  if (!id || !signature) return null;

  const expected = Buffer.from(sign(id));
  const given = Buffer.from(signature);
  if (expected.length !== given.length) return null;

  return timingSafeEqual(expected, given) ? id : null;
}

/**
 * A stable, non-reversible client identifier.
 *
 * Behind a trusted proxy this is the real IP. Otherwise it is a signed cookie
 * this server issued, which an ordinary visitor keeps and a script can throw
 * away. Discarding it is not a way through: the caller pairs this with a
 * site-wide ceiling that no rotation can escape.
 *
 * The raw IP is never stored, only a hash, so submissions stay useful for abuse
 * control without holding a direct personal identifier.
 */
export type Client = {
  fingerprint: string;
  /**
   * True when the caller proved continuity: a real address behind a trusted
   * proxy, or a cookie we issued and signed earlier. False for a caller that
   * arrived with nothing, which is what a script that discards cookies looks
   * like, and also what a genuine first-time visitor looks like.
   */
  identified: boolean;
};

async function identifyClient(): Promise<Client> {
  if (trustsProxyHeaders()) {
    const headerList = await headers();
    const ip =
      headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      headerList.get("x-real-ip")?.trim() ||
      headerList.get("cf-connecting-ip")?.trim();

    if (ip) {
      return {
        fingerprint: createHash("sha256").update(`${secret()}:ip:${ip}`).digest("hex").slice(0, 32),
        identified: true,
      };
    }
  }

  const jar = await cookies();
  const existing = jar.get(CLIENT_COOKIE)?.value;
  const known = existing ? verify(existing) : null;

  if (known) {
    return {
      fingerprint: createHash("sha256").update(`${secret()}:cid:${known}`).digest("hex").slice(0, 32),
      identified: true,
    };
  }

  const id = randomBytes(16).toString("base64url");
  try {
    jar.set(CLIENT_COOKIE, `${id}.${sign(id)}`, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: CLIENT_COOKIE_MAX_AGE,
    });
  } catch {
    // Read-only context, such as a server component. The caller still has the
    // site-wide ceiling, so falling through here cannot open the door.
  }

  return {
    fingerprint: createHash("sha256").update(`${secret()}:cid:${id}`).digest("hex").slice(0, 32),
    identified: false,
  };
}

/** The identifier alone, for callers that do not care how it was obtained. */
export async function clientFingerprint(): Promise<string> {
  return (await identifyClient()).fingerprint;
}

/* --------------------------------------------------------------------------
   The guard used by every public action
   -------------------------------------------------------------------------- */

export type Guard = {
  /** What one visitor may do. */
  perClient: { limit: number; windowSeconds: number };
  /**
   * What callers who arrive with no identity may do between them.
   *
   * A script that throws away its cookie looks new every time, so its own
   * allowance never bites. This pool is what actually stops it. Because only
   * unidentified traffic is counted here, filling it cannot shut out a visitor
   * whose browser keeps the cookie, which is the ordinary case.
   */
  anonymous: { limit: number; windowSeconds: number };
  /**
   * The last resort, counting everybody. Set it far above real demand: reaching
   * it turns work away from genuine visitors too, so it should only ever happen
   * during an attack large enough that turning work away is the right answer.
   */
  global: { limit: number; windowSeconds: number };
};

export type GuardResult = RateLimitResult & {
  fingerprint: string;
  /** Which allowance ran out, for logging. Absent when the caller was allowed. */
  blockedBy?: "anonymous" | "global" | "client";
};

/**
 * Decides whether this caller may proceed.
 *
 * The order matters. Unidentified callers are checked against their own pool
 * first, so a flood of cookie-less requests is absorbed there and never reaches
 * the counter that everyone shares. Identified callers skip that pool entirely
 * and are judged on their own record, which is why one attacker cannot lock the
 * rest of the world, or the site's own administrator, out of the site.
 */
export async function guard(action: string, limits: Guard): Promise<GuardResult> {
  const client = await identifyClient();
  const { fingerprint } = client;

  if (!client.identified) {
    const anonymous = await rateLimit(
      `anon:${action}`,
      limits.anonymous.limit,
      limits.anonymous.windowSeconds,
    );

    if (!anonymous.allowed) {
      console.warn("[rate-limit] pool for unidentified callers is full", { action });
      return { ...anonymous, fingerprint, blockedBy: "anonymous" };
    }
  }

  const overall = await rateLimit(
    `global:${action}`,
    limits.global.limit,
    limits.global.windowSeconds,
  );

  if (!overall.allowed) {
    console.warn("[rate-limit] site-wide ceiling reached", { action });
    return { ...overall, fingerprint, blockedBy: "global" };
  }

  const mine = await rateLimit(
    `${action}:${fingerprint}`,
    limits.perClient.limit,
    limits.perClient.windowSeconds,
  );

  return { ...mine, fingerprint, blockedBy: mine.allowed ? undefined : "client" };
}
