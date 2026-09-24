# Verifiche SEO tecniche — follow-up

**Data:** 24 settembre 2026<br>
**Ambito:** controllo durante il lavoro sulla landing; non è una revisione SEO completa. Nessuna verifica o pubblicazione sul sito live.

## Stato verificato nel codice e nel runtime compilato

- `/` e `/:locale` hanno metadata generati dai cataloghi: title, description, canonical, Open Graph, Twitter card, hreflang e JSON-LD. La descrizione, il titolo e le FAQ seguono i testi della landing; il grafo contiene `SoftwareApplication` e `FAQPage`.
- Il JSON-LD SSR per `/` e `/de` è stato analizzato come JSON valido nel browser. `/de` usa `html lang="de"`, canonical `https://ipagell.website/de` e alternate `it`, `de`, `fr`, `en`, `x-default` sugli URL canonici. Le altre route localizzate sono generate dallo stesso helper.
- Sul dominio locale di prova le landing mostrano `noindex, nofollow`, come previsto per host non canonici. Il codice abilita l’indicizzazione solo sull’host esatto `ipagell.website`; l’effettiva risposta del dominio pubblico non è stata verificata.
- `app/robots.ts` consente `/` e disabilita `/api/`. `/app` restituisce `noindex, nofollow` tramite i metadata di `app/app/page.tsx`, ma resta raggiungibile al crawler. Decidere nel task SEO se aggiungere `/app` a `Disallow`: così com’è il crawler può leggerne il `noindex`, mentre il blocco ridurrebbe le richieste alla route.
- `app/sitemap.ts` elenca le quattro landing canoniche e i rispettivi alternate; non include `/it`, che è un alias con canonical su `/`.
- Il build include root, route localizzate, `/app` e route API. La route `/app` è stata aperta nel runtime compilato e presenta il login; non è stato fatto un crawl esterno.

## Da decidere o verificare nel task SEO

1. `lib/i18n/public-page.ts` assegna `it_CH`, `de_CH`, `fr_CH`, `en_GB` in Open Graph e `lib/i18n/locale.ts` formatta con `it-CH`, `de-CH`, `fr-CH`, `en-GB`. Questi valori sono plausibili per il pubblico e le traduzioni attuali, ma fissano un mercato per lingua. Confermare la scelta prima di ampliare i mercati o introdurre varianti regionali; lingua, paese e sistema di valutazione restano dimensioni separate.
2. Verificare sul dominio Sites canonico status HTTP, redirect degli host alternativi, robots, sitemap, canonical/hreflang, cache e anteprime Open Graph. Il rendering locale non certifica configurazione o stato live.
3. Valutare l’anteprima Open Graph esistente (`public/og.png`): la landing ora mostra un esempio prodotto più concreto, ma l’immagine social non è stata aggiornata né verificata visualmente in questa attività.
4. Mantenere la sitemap limitata alle pagine pubbliche finché le viste dell’app restano sotto `/app`; valutare nuove URL solo quando esisteranno pagine pubbliche autonome con contenuto stabile.

## Rimasto fuori da questo intervento

Non sono state modificate regole SEO, struttura del JSON-LD, sitemap, robots, redirect, hosting o metadata globali. Il copy della landing aggiorna title, description, Open Graph e JSON-LD attraverso i cataloghi esistenti.
