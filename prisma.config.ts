import fs from "node:fs";
import path from "node:path";
import { defineConfig, env } from "prisma/config";

// Prisma 7 does not auto-load .env files. Load it here so CLI commands
// (migrate / generate / seed) see DATABASE_URL the same way the app does.
const envFile = path.join(process.cwd(), ".env");
if (fs.existsSync(envFile)) {
  process.loadEnvFile(envFile);
}

/**
 * The database URL, or a stand-in when generating the client.
 *
 * `prisma generate` only reads the schema and writes TypeScript; it never opens
 * a connection. Some hosts hand secrets to the app when it starts but not while
 * it builds, so demanding a real URL at generate time fails the build for no
 * reason.
 *
 * The stand-in is returned for `generate` alone. Every other command, including
 * anything that migrates or seeds, still insists on a real URL and says so.
 */
function datasourceUrl(): string {
  const configured = process.env.DATABASE_URL?.trim();
  if (configured) return configured;

  const generatingOnly = process.argv.includes("generate");
  if (generatingOnly) return "file:./.prisma-generate-placeholder.db";

  return env("DATABASE_URL");
}

export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  migrations: {
    path: path.join("prisma", "migrations"),
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: datasourceUrl(),
  },
});
