import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

import { PrismaClient } from "@/generated/prisma/client";

/**
 * Prisma 7 uses driver adapters. The SQLite adapter needs a plain file path,
 * so the `file:` prefix from DATABASE_URL is stripped here.
 */
function resolveDatabaseFile(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. Copy .env.example to .env and set it (see README).",
    );
  }
  return url.startsWith("file:") ? url.slice("file:".length) : url;
}

function createPrismaClient(): PrismaClient {
  const adapter = new PrismaBetterSqlite3({ url: `file:${resolveDatabaseFile()}` });
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function client(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient();
  }
  return globalForPrisma.prisma;
}

/**
 * The shared client, built on first use rather than on import.
 *
 * Importing this file used to construct the client immediately, which meant a
 * missing DATABASE_URL crashed at import. During a build that is fatal: Next
 * loads every route to work out what it can prerender, and a host that supplies
 * its secrets at run time rather than build time has no URL yet.
 *
 * Waiting until a query is actually made moves that error to the moment it
 * means something. Nothing is hidden: the same message is still thrown, and a
 * page that genuinely needs the database still fails loudly.
 *
 * One instance either way, which also stops dev hot-reload exhausting handles.
 */
export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, property, receiver) {
    return Reflect.get(client(), property, receiver);
  },
  has(_target, property) {
    return Reflect.has(client(), property);
  },
});
