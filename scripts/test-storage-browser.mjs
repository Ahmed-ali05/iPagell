import { createServer } from "vite";
import { randomInt } from "node:crypto";

// A separate origin avoids accessing the application's real browser storage.
const server = await createServer({
  configFile: false,
  cacheDir: "node_modules/.vite-storage-test",
  optimizeDeps: { entries: ["tests/storage-browser.html"] },
  server: { host: "127.0.0.1", port: randomInt(20000, 60000), strictPort: true },
});
await server.listen();
const address = server.httpServer.address();
console.log(`Open http://127.0.0.1:${address.port}/tests/storage-browser.html`);
