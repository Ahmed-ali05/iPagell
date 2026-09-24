import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { runInNewContext } from "node:vm";

type FetchEvent = {
  request: object;
  respondWith: (result: Promise<Response>) => void;
};

test("offline navigation uses a fresh response when Sites redirects the shared shell", async () => {
  const handlers = new Map<string, (event: FetchEvent) => void>();
  const cache = {
    async match(path: string) {
      if (path !== "/offline.html") return undefined;
      const shell = new Response("<html>offline shell</html>", {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
      return {
        body: shell.body,
        status: shell.status,
        statusText: shell.statusText,
        headers: shell.headers,
        redirected: true,
        url: "https://ipagell.website/offline",
      };
    },
  };
  const source = await readFile(new URL("../public/sw.js", import.meta.url), "utf8");
  runInNewContext(source, {
    self: {
      location: { origin: "https://ipagell.website" },
      addEventListener(name: string, handler: (event: FetchEvent) => void) {
        handlers.set(name, handler);
      },
    },
    caches: { open: async () => cache },
    fetch: async () => { throw new TypeError("offline"); },
    Response,
    URL,
  });

  for (const path of ["/it", "/de", "/fr", "/en"]) {
    let response: Promise<Response> | undefined;
    handlers.get("fetch")!({
      request: {
        url: `https://ipagell.website${path}`,
        method: "GET",
        mode: "navigate",
        headers: new Headers(),
      },
      respondWith(result) { response = result; },
    });
    assert.ok(response, `${path} must be handled`);
    const result = await response;
    assert.equal(result.status, 200);
    assert.equal(result.redirected, false, `${path} cannot return a redirected response`);
    assert.match(result.headers.get("Content-Type") ?? "", /text\/html/);
    assert.equal(await result.text(), "<html>offline shell</html>");
  }

  let apiIntercepted = false;
  handlers.get("fetch")!({
    request: {
      url: "https://ipagell.website/api/account",
      method: "GET",
      mode: "navigate",
      headers: new Headers(),
    },
    respondWith() { apiIntercepted = true; },
  });
  assert.equal(apiIntercepted, false);
});
