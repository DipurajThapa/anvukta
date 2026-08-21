import "server-only";

import { randomBytes, scrypt, timingSafeEqual, createHash } from "node:crypto";
import { promisify } from "node:util";

import { cookies } from "next/headers";

import { prisma } from "@/lib/db";

const scryptAsync = promisify(scrypt) as (
  password: string | Buffer,
  salt: string | Buffer,
  keylen: number,
  options: { N: number; r: number; p: number; maxmem: number },
) => Promise<Buffer>;

/* --------------------------------------------------------------------------
   Password hashing — scrypt from Node's own crypto module.
   No third-party hashing dependency, no native build step.
   -------------------------------------------------------------------------- */

const SCRYPT = { N: 2 ** 15, r: 8, p: 1, maxmem: 96 * 1024 * 1024 } as const;
const KEY_LENGTH = 64;

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const derived = await scryptAsync(password.normalize("NFKC"), salt, KEY_LENGTH, SCRYPT);
  return `scrypt$${SCRYPT.N}$${SCRYPT.r}$${SCRYPT.p}$${salt.toString("base64")}$${derived.toString("base64")}`;
}

export async function verifyPassword(
  password: string,
  stored: string,
): Promise<boolean> {
  const parts = stored.split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;

  const N = Number(parts[1]);
  const r = Number(parts[2]);
  const p = Number(parts[3]);
  const salt = Buffer.from(parts[4] ?? "", "base64");
  const expected = Buffer.from(parts[5] ?? "", "base64");

  if (!Number.isInteger(N) || !Number.isInteger(r) || !Number.isInteger(p)) {
    return false;
  }

  const derived = await scryptAsync(password.normalize("NFKC"), salt, expected.length, {
    N,
    r,
    p,
    maxmem: SCRYPT.maxmem,
  });

  return derived.length === expected.length && timingSafeEqual(derived, expected);
}

/* --------------------------------------------------------------------------
   Sessions — opaque random token in an HttpOnly cookie; only its SHA-256
   hash is stored, so a database read cannot be replayed as a login.
   -------------------------------------------------------------------------- */

export const SESSION_COOKIE = "anvukta_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 8; // 8 hours

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: string;
};

export async function createSession(userId: string): Promise<void> {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  await prisma.session.create({
    data: { tokenHash: hashToken(token), userId, expiresAt },
  });

  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    expires: expiresAt,
  });

  // Opportunistic cleanup keeps the table from growing without a cron job.
  await prisma.session.deleteMany({ where: { expiresAt: { lt: new Date() } } });
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;

  if (token) {
    await prisma.session.deleteMany({ where: { tokenHash: hashToken(token) } });
  }

  jar.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });
}

/** Current signed-in admin, or null. Safe to call from any server component. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { tokenHash: hashToken(token) },
    select: {
      expiresAt: true,
      user: { select: { id: true, email: true, name: true, role: true } },
    },
  });

  if (!session || session.expiresAt.getTime() < Date.now()) return null;

  return session.user;
}

export async function authenticate(
  email: string,
  password: string,
): Promise<SessionUser | null> {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  // Always run a hash comparison so a missing account and a wrong password
  // take the same amount of time and return the same message.
  const stored =
    user?.passwordHash ??
    "scrypt$32768$8$1$AAAAAAAAAAAAAAAAAAAAAA==$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==";

  const ok = await verifyPassword(password, stored);
  if (!user || !ok) return null;

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  return { id: user.id, email: user.email, name: user.name, role: user.role };
}
