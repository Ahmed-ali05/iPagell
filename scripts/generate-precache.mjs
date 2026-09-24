import { readdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { localizedManifest } from "./localized-manifest.mjs";
const root=new URL("../dist/client/",import.meta.url);
const offlineKeys=["offline.title","offline.description","offline.openApp"];
const offlineCopy={};
const intlLocales={it:"it-CH",de:"de-CH",fr:"fr-CH",en:"en-GB"};
const manifestTemplate=JSON.parse(await readFile(new URL("../public/manifest.webmanifest",import.meta.url),"utf8"));
for(const locale of ["it","de","fr","en"]){
  const messages=JSON.parse(await readFile(new URL(`../lib/i18n/messages/${locale}.json`,import.meta.url),"utf8"));
  offlineCopy[locale]=Object.fromEntries(offlineKeys.map(key=>[key,messages[key]]));
  if(locale!=="it"){
    const manifest=localizedManifest(manifestTemplate,messages,locale,intlLocales[locale]);
    await writeFile(new URL(`manifest-${locale}.webmanifest`,root),JSON.stringify(manifest,null,2)+"\n");
  }
}
const offlinePath=new URL("offline.html",root);
const offlineHtml=await readFile(offlinePath,"utf8");
if(!offlineHtml.includes("__OFFLINE_COPY__"))throw new Error("Offline copy marker missing");
await writeFile(offlinePath,offlineHtml.replace("__OFFLINE_COPY__",JSON.stringify(offlineCopy).replaceAll("<","\\u003c")));
const files=await readdir(root,{recursive:true});
const assets=files.filter(path=>(path.startsWith("assets/")||path.startsWith("_next/static/"))&&/\.(js|css|woff2?)$/.test(path)).sort().map(path=>"/"+path);
if(!assets.length)throw new Error("No client assets to precache");
const source=await readFile(new URL("sw.js",root),"utf8");
const version=createHash("sha256").update(source+assets.join("\n")).digest("hex").slice(0,16);
await writeFile(new URL("sw.js",root),source.replace("__BUILD__",version).replace("/*__ASSETS__*/ []",JSON.stringify(assets)));
console.log("Offline shell prepared:",assets.length,"hashed assets");
