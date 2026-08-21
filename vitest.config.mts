import fs from "node:fs";
import path from "node:path";

import { defineConfig } from "vitest/config";

// Tests exercise real modules, some of which construct a database client on
// import. Load .env the same way the app does so they behave identically.
const envFile = path.join(process.cwd(), ".env");
if (fs.existsSync(envFile)) process.loadEnvFile(envFile);

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(process.cwd(), "src"),
      // "server-only" throws outside a React Server Component; stub it for tests.
      "server-only": path.resolve(process.cwd(), "tests/stubs/server-only.ts"),
    },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    globals: false,
  },
});
