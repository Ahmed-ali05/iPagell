# Verifica tecnica di discovery — 24 settembre 2026

**Ambito:** metadata, crawler, sitemap, canonical/hreflang, JSON-LD, Open Graph, route pubbliche e dipendenza tra lingua e valutazioni. Nessuna pubblicazione è stata eseguita.

## Stato iniziale

- Repository su `main`, HEAD `a48a9dc79b466903dbb2c4ccc076567ec1898e8a`, allineato con `origin/main`; working tree pulito.
- Il dominio live rispondeva 200 sulle landing `/`, `/de`, `/fr`, `/en`. Titoli, descrizioni e headline live erano ancora quelli della landing precedente al commit locale corrente.
- `/app` rispondeva 200 con `noindex, nofollow`; `/offline` rispondeva 200 con `noindex, nofollow`; `/api/account` rispondeva 401. `robots.txt` consentiva le pagine e disabilitava `/api/`; la sitemap includeva le quattro landing.
- `www.ipagell.website` e `ipagell.produc-ch.chatgpt.site` reindirizzavano con 308 al dominio canonico. `/offline.html` reindirizzava con 307 a `/offline`.
- Il live aveva una sitemap valida e JSON-LD sintatticamente valido (`SoftwareApplication` + `FAQPage`), ma la landing in produzione risultava non aggiornata rispetto a `main`. Ricontrollare dopo la prossima pubblicazione.

## Decisioni applicate

- Centralizzata la mappa delle route pubbliche per fare usare gli stessi path ai canonical, hreflang e sitemap. Le pagine elencate sono `/`, `/de`, `/fr`, `/en` e le quattro route canoniche del calcolatore; `/it` è un alias noindex con canonical alla root.
- La sitemap resta limitata alle otto pagine pubbliche canoniche. `/app` e `/offline` restano raggiungibili ai crawler e dichiarano `noindex`; in questo modo il crawler può leggere la direttiva. L'API resta esclusa in `robots.txt` e richiede autenticazione.
- Rimosso il JSON-LD `SoftwareApplication`: per il rich result Google documenta prezzo/offerta e recensione o rating, dati che iPagell non espone e che non vanno inventati. Rimosso `FAQPage`: Google ha ritirato quel rich result nel maggio 2026. Le FAQ restano contenuto visibile della landing.
- La sola home canonica ora dichiara `WebSite` con nome `iPagell` e URL canonico. Google usa questo tipo per indicare la preferenza sul nome del sito; non viene duplicato sulle landing in sottodirectory.
- I metadata globali di riserva sono stati resi neutri e non impostano più Open Graph/Twitter in italiano sulle route secondarie. Ogni landing pubblica continua a generare i propri title, description, canonical, hreflang, Open Graph e Twitter metadata dal catalogo della lingua.
- Le lingue URL restano generiche (`it`, `de`, `fr`, `en`). Le impostazioni regionali `it-CH`, `de-CH`, `fr-CH` ed `en-GB` descrivono formattazione e contenuti delle edizioni attuali; non determinano lo schema di valutazione, che resta un asse prodotto separato.

## Open Graph

La grafica precedente è stata sostituita con screenshot 1200×630 della hero e della preview effettiva della landing. I quattro asset sono separati per lingua e derivano dal rendering locale con gli stessi dati sintetici esposti nella pagina; il peso è circa 63–70 KB ciascuno. Open Graph e Twitter metadata selezionano l'immagine della lingua corrispondente. Le anteprime grafiche sono state ispezionate prima di essere salvate.

## Fondamenta per altri sistemi di valutazione

La lingua, i codici regionali e le route pubbliche non codificano la scala 1–6. L'implementazione applicativa usa però ancora validazione, tipi e calcoli centrati su voti numerici 1–6. L'estensione va affrontata in un task prodotto/dati dedicato: configurazione esplicita del grading system, indipendente da lingua e paese, e migrazione compatibile dei dati salvati. Questo task non modifica la valutazione corrente.

## Verifiche eseguite

- `npm run check`: lint, TypeScript, 64 test, check i18n e documenti completati senza errori.
- `npm run build`: completata. Il rendering locale ha dato status 200 per le quattro landing, le quattro route del calcolatore, `/app`, `robots.txt`, `sitemap.xml` e i quattro asset OG; `/api/account` ha risposto 401.
- JSON-LD SSR analizzato come JSON valido: solo `WebSite` sulla home; nessun JSON-LD sulle route lingua in sottodirectory. Le landing locali hanno canonical e hreflang dalle stesse route usate nella sitemap; sul preview locale sono `noindex` come previsto.
- Layout verificato con screenshot a 390, 768 e 1440 px e con immagine social a 1200×630. La scroll width coincide col viewport ai tre breakpoint misurati.
- Il build segnala un chunk app da circa 660 KiB oltre la soglia di 500 KiB. L'asset specifico dell'app non compare negli script dichiarati nell'HTML iniziale SSR della landing.
- Il controllo live ha confermato che la produzione continua a servire titoli e JSON-LD precedenti. Nessuna modifica è stata pubblicata.

## Riferimenti primari Google

- [Site names in Google Search](https://developers.google.com/search/docs/appearance/site-names): `WebSite` sulla home, campi `name` e `url`, un solo nome a livello dominio.
- [Software App structured data](https://developers.google.com/search/docs/appearance/structured-data/software-app): proprietà necessarie al rich result Software App.
- [Google Search documentation updates](https://developers.google.com/search/updates): ritiro del FAQ rich result annunciato a maggio 2026 e rimozione della relativa documentazione a giugno 2026.
