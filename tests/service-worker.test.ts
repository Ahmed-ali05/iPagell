import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { runInNewContext } from "node:vm";

type FetchEvent = {
  request: object;
  respondWith: (result: Promise<Response>) => void;
};

test("an existing worker defers full precache on calculator visits and keeps it for app entry", async () => {
  const source = await readFile(new URL("../public/sw.js", import.meta.url), "utf8");
  for (const [path, shouldCache] of [["/calcolo-media-voti", false], ["/de/notendurchschnitt", false], ["/app", true], ["/de", true]] as const) {
    let install: ((event: { waitUntil: (task: Promise<unknown>) => void }) => void) | undefined;
    let opened = 0;
    let assets: Request[] = [];
    runInNewContext(source, {
      self: {
        clients: { matchAll: async () => [{ url: `https://ipagell.website${path}` }] },
        addEventListener(name: string, handler: typeof install) {
          if (name === "install") install = handler;
        },
      },
      caches: { open: async () => {
        opened++;
        return { addAll: async (requests: Request[]) => { assets = requests; } };
      } },
      Request: class extends Request {
        constructor(path: string, init?: RequestInit) {
          super(new URL(path, "https://ipagell.website"), init);
        }
      },
      URL,
    });
    let task: Promise<unknown> | undefined;
    install!({ waitUntil(promise) { task = promise; } });
    assert.ok(task);
    if (shouldCache) {
      await task;
      assert.equal(opened, 1);
      assert.ok(assets.some((request) => new URL(request.url).pathname === "/app"));
    } else {
      await assert.rejects(task, /Defer diary shell update/);
      assert.equal(opened, 0);
    }
  }
});

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

  for (const path of ["/", "/app", "/it", "/de", "/fr", "/en"]) {
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

  for (const path of ["/api/account", "/calcolo-media-voti", "/de/notendurchschnitt", "/fr/calcul-moyenne-notes", "/en/grade-average-calculator"]) {
    let intercepted = false;
    handlers.get("fetch")!({
      request: {
        url: `https://ipagell.website${path}`,
        method: "GET",
        mode: "navigate",
        headers: new Headers(),
      },
      respondWith() { intercepted = true; },
    });
    assert.equal(intercepted, false, `${path} must bypass an existing worker`);
  }
});
