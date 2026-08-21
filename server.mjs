/**
 * Production entry point.
 *
 * `next start` is the usual way to run a built Next.js app, and it is still what
 * runs underneath here. This wrapper exists because the host requires a real
 * `main` file in package.json and requires the app to listen on the port it
 * hands over in PORT rather than a port of our choosing. Binding it here makes
 * that explicit instead of relying on the CLI reading the same variable.
 *
 * Nothing is intercepted: every request goes straight to Next's own handler, so
 * routing, caching and prerendered pages behave exactly as they do under
 * `next start`.
 *
 * Local development still uses `next dev`. This file is only for production.
 */
import { createServer } from "node:http";

import next from "next";

const port = Number.parseInt(process.env.PORT ?? "3000", 10);
const hostname = process.env.HOSTNAME ?? "0.0.0.0";

const app = next({ dev: false, hostname, port });
const handle = app.getRequestHandler();

await app.prepare();

const server = createServer((request, response) => {
  handle(request, response);
});

server.listen(port, hostname, () => {
  console.info(`Ready on http://${hostname}:${port}`);
});

// The host stops a container by signalling it. Closing the server first lets
// requests already in flight finish instead of being cut off mid-response.
for (const signal of ["SIGTERM", "SIGINT"]) {
  process.on(signal, () => {
    server.close(() => process.exit(0));
  });
}
