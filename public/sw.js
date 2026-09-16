// Build replaces these markers with a content hash and the exact static assets.
const CACHE = "ipagell-shell-__BUILD__";
const ASSETS = /*__ASSETS__*/ [];
const CORE = ["/", "/app", "/offline.html", "/manifest.webmanifest", "/favicon.svg", "/icons/icon-192.png", "/icons/icon-512.png", "/icons/apple-touch-icon-180.png"];
const ALLOWED = new Set([...CORE, ...ASSETS]);

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE).then(async cache => {
    // Public landing and app shell never contain an account snapshot.
    await cache.addAll([...new Set([...CORE, ...ASSETS])].map(path=>new Request(path,{credentials:"omit",cache:"reload"})));
    // Activate on next app launch to avoid replacing assets under an open editor.
  }));
});
self.addEventListener("activate", event => {
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith("ipagell-shell-")&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));
});
self.addEventListener("fetch", event => {
  const url=new URL(event.request.url);
  if(event.request.method!=="GET"||url.origin!==self.location.origin)return;
  // Strict allowlist: APIs, authentication, RSC payloads and arbitrary navigations
  // are network-only. Cache API does not enforce HTTP no-store on our behalf.
  if(event.request.headers.has("RSC")||event.request.headers.has("Next-Router-State-Tree"))return;
  if(event.request.mode==="navigate"){
    if(url.pathname!=="/"&&url.pathname!=="/app")return;
    event.respondWith(fetch(event.request).catch(async()=> {
      const cache=await caches.open(CACHE);
      return (await cache.match(url.pathname))||(await cache.match("/offline.html"))||Response.error();
    }));
    return;
  }
  if(!ALLOWED.has(url.pathname)||url.pathname==="/"||url.pathname==="/app"||url.search)return;
  event.respondWith(caches.open(CACHE).then(async cache=>(await cache.match(event.request))||fetch(event.request)));
});
self.addEventListener("notificationclick",event=>{
  event.notification.close();
  event.waitUntil(clients.matchAll({type:"window",includeUncontrolled:true}).then(windows=>{
    const existing=windows.find(client=>"focus" in client);
    return existing?existing.focus():clients.openWindow("/app?view=agenda");
  }));
});
