import { build, defineConfig } from "vite";
import { fileURLToPath } from "node:url";
import { readdirSync, readFileSync, createReadStream, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { createHash } from "node:crypto";

const root = fileURLToPath(new URL(".", import.meta.url));
const wasmRoot = join(dirname(createRequire(import.meta.url).resolve("@litert-lm/core/package.json")), "wasm");
const files = readdirSync(wasmRoot).filter(name => /\.(js|wasm)$/.test(name));
const csp = "default-src 'none'; script-src 'self' 'wasm-unsafe-eval'; worker-src 'self' blob:; style-src 'self'; img-src 'self' blob: data:; connect-src 'self' ws://127.0.0.1:5174 https://huggingface.co https://us.aws.cdn.hf.co; object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'";
const headers = { "Content-Security-Policy": csp, "Referrer-Policy": "no-referrer", "X-Content-Type-Options": "nosniff" };
// The pinned SDK loader uses importScripts, which requires a classic worker.
// Build that worker identically in dev and production; source parsing remains a module worker.
async function classicWorker(kind: "embedding" | "generation" | "diagnostic"): Promise<string> {
  const result = await build({ configFile: false, root, logLevel: "error", publicDir: false,
    build: { write: false, target: "es2022", minify: false, lib: { entry: join(root, `src/${kind}.worker.ts`), formats: ["iife"], name: `Study${kind}Worker` } } });
  const output = Array.isArray(result) ? result[0] : result;
  if (!("output" in output)) throw new Error("Missing embedding worker output");
  const chunk = output.output.find(item => item.type === "chunk");
  if (!chunk || chunk.type !== "chunk") throw new Error("Missing embedding worker chunk");
  return chunk.code;
}

export default defineConfig({
  root,
  publicDir: false,
  cacheDir: "node_modules/.vite",
  plugins: [{
    name: "pinned-local-runtime",
    async configureServer(server) {
      // Development-only sink for fixed synthetic test pages. Never registered by
      // preview/build or called by the normal import/map UI. No arbitrary filename.
      server.middlewares.use("/__synthetic_report", (req,res) => {
        const names: Record<string,string> = {diagnostic:"l3-synthetic-variants-v2.json",challenge:"retrieval-challenge-v2-browser.json",corpus:"l3-corpus-v2.json"};
        if(req.method!=="POST" || req.headers.origin!=="http://127.0.0.1:5174") {res.statusCode=403;res.end();return;}
        req.setEncoding("utf8");let body=""; req.on("data",part=>{body+=part;if(body.length>4_000_000)req.destroy();});
        req.on("end",()=>{try {const data=JSON.parse(body);if(data.synthetic!==true || !Object.hasOwn(names,data.kind) || !data.report)throw Error();
          writeFileSync(join(root,"reports",names[data.kind]),JSON.stringify(data.report,null,2)+"\n");res.setHeader("Content-Type","application/json");res.end('{"saved":true}');
        }catch{res.statusCode=400;res.end();}});
      });
      server.middlewares.use("/runtime/", (req, res, next) => {
        const name = req.url?.split("?")[0].replace(/^\//, "");
        const kind = name === "embedding-worker.js" ? "embedding" : name === "generation-worker.js" ? "generation" : name === "diagnostic-worker.js" ? "diagnostic" : undefined;
        if (kind) {
          // In dev each new job must use current source, not a bundle frozen when
          // Vite started. Existing workers keep their version until terminated.
          res.setHeader("Content-Type", "application/javascript"); res.setHeader("Cache-Control", "no-store");
          void classicWorker(kind).then(code => res.end(code), () => { res.statusCode=500;res.end("Worker build failed"); }); return;
        }
        if (!name || !files.includes(name)) { next(); return; }
        res.setHeader("Content-Type", name.endsWith(".wasm") ? "application/wasm" : "application/javascript");
        createReadStream(join(wasmRoot, name)).pipe(res);
      });
    },
    async generateBundle() {
      for (const kind of ["embedding", "generation"] as const) this.emitFile({ type: "asset", fileName: `runtime/${kind}-worker.js`, source: await classicWorker(kind) });
      const manifest = files.map(name => {
        const source = readFileSync(join(wasmRoot, name));
        this.emitFile({ type: "asset", fileName: `runtime/${name}`, source });
        return { name, bytes: source.length, sha256: createHash("sha256").update(source).digest("hex") };
      });
      this.emitFile({ type: "asset", fileName: "runtime/manifest.json", source: JSON.stringify({ package: "@litert-lm/core@0.18.0", files: manifest }, null, 2) });
    },
  }],
  server: {
    host: "127.0.0.1",
    port: 5174,
    strictPort: true,
    watch: { ignored: ["**/reports/**"] },
    fs: { strict: true, allow: [root, fileURLToPath(new URL("../../node_modules", import.meta.url))] },
    headers,
  },
  preview: { host: "127.0.0.1", port: 5174, strictPort: true, headers },
  worker: { format: "es" },
  build: { outDir: "dist", target: "es2022", assetsInlineLimit: 0, emptyOutDir: true },
});
