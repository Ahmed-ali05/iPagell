# iPagell

iPagell è una PWA offline-first per gestire voti, compiti, verifiche, assenze e statistiche scolastiche sulla scala ticinese 1–6.

## Sviluppo locale

```bash
npm install
npm run dev
```

I dati strutturati sono salvati in IndexedDB, mentre preferenze e impostazioni leggere usano localStorage. L’app non richiede un backend.

## Build

```bash
npm run build
```

Il manifest, il service worker, le icone e gli splash screen iOS si trovano in `public/`.
