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

/** Single shared client — avoids exhausting handles during dev hot-reload. */
export const prisma: PrismaClient = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
