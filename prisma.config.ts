import fs from "node:fs";
import path from "node:path";
import { defineConfig, env } from "prisma/config";

// Prisma 7 does not auto-load .env files. Load it here so CLI commands
// (migrate / generate / seed) see DATABASE_URL the same way the app does.
const envFile = path.join(process.cwd(), ".env");
if (fs.existsSync(envFile)) {
  process.loadEnvFile(envFile);
}

export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  migrations: {
    path: path.join("prisma", "migrations"),
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
