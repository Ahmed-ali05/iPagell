# iPagell — audit SEO e chiarezza dell'ingresso

Audit del 1 ottobre 2026. Specialista: SEO tecnico, contenuti e comprensione del prodotto. Analisi sola lettura del checkout: nessuna modifica applicativa e nessun deploy eseguiti da questo agente.

## Metodo ed evidenze

Letti `AGENTS.md`, `docs/REPO-SNAPSHOT.md`, `docs/ARCHITECTURE-CURRENT.md`, `docs/VERIFICATION-MATRIX.md`; verificati nel codice `app/layout.tsx`, `app/page.tsx`, `app/[locale]/page.tsx`, `app/calcolo-media-voti/page.tsx`, `app/[locale]/[tool]/page.tsx`, `app/app/page.tsx`, `app/robots.ts`, `app/sitemap.ts`, `proxy.ts`, `lib/i18n/public-page.ts`, `lib/i18n/public-routes.ts`, `components/landing-content.tsx`, `components/grade-average-calculator.tsx`, `app/marketing-page.module.css`, catalogo IT, manifest e test correlati.

Le valutazioni sulla gerarchia sono inferenze da DOM/CSS e copy; non una verifica visiva in browser. Il tool web non ha potuto accedere al dominio di produzione, robots o sitemap: questo limite del tool non prova un guasto del sito. Indicizzazione, ranking, query reali, Core Web Vitals e disponibilità dei flag di produzione restano da verificare esternamente. Non sono stati eseguiti test applicativi perché l'incarico è sola lettura.

## Cosa funziona già

- Landing italiana SSR su `/`, landing localizzate su `/de`, `/fr`, `/en`; metadati, canonical e hreflang con x-default.
- Tool reale e gratuito senza account per calcolare la media su quattro URL leggibili/localizzati; scala supportata 1–6, pesi facoltativi e formula dichiarata.
- Sitemap con otto URL pubblici e alternates lingue.
- `/app` ha noindex; API escluse da crawling in robots. Non aggiungere disallow a `/app`: impedirebbe al crawler di leggere il noindex.
- Alias di dominio noti reindirizzati 308 nel proxy; preview non canoniche noindex.
- JSON-LD WebSite sicuro con nome e URL canonici; nessuna valutazione o prezzo inventati.
- Test dedicati a metadata/hreflang/host di preview e JSON-LD.

## Problemi verificati e priorità

| Priorità | Problema | Evidenza nel codice | Conseguenza e rimedio |
|---|---|---|---|
| P1 | Titolo poco descrittivo per ricerca e primo accesso | `landing.title`: «Voti e scadenze, nel tuo diario.»; `publicLandingMetadata` lo usa anche come title SEO | Esplicitare «diario scolastico» e separare title SEO da H1 per un titolo di ricerca chiaro, senza allungare il titolo visivo |
| P1 | Target e valore immediato non sufficientemente espliciti | Hero non contiene «studente», «scolastico», appunti o descrizione di chi inserisce i dati | Aggiungere un contesto breve, il risultato atteso e un percorso iniziale in tre passaggi |
| P1 | Appunti quasi assenti dalla presentazione | Tre card coprono voti, agenda, classi; appunti appaiono soltanto come «note» nella privacy | Presentare appunti per materia come quarto beneficio reale, mantenendo testo breve |
| P1 | FAQ privacy non corrisponde più a tutte le capacità implementate | FAQ 2: «La classe vede solo le attività condivise»; architettura/codice prevedono anche appunti di classe pubblicati esplicitamente | Dire che voti, assenze e appunti personali restano privati; la classe vede attività e appunti che vengono condivisi esplicitamente. Prima confermare flag Classi in produzione |
| P1 | Registrazione non spiegata prima della CTA | «Crea il tuo diario» porta a `/app?mode=register`; implementazione attuale username/password e codice recupero | FAQ «Come inizio?» descrive account, materie e primo voto/scadenza. Non pubblicizzare Google/Apple/email prima di implementazione e configurazione effettive |
| P2 | Scala 1–6 principalmente nel mockup | `landing.previewScale` e caption preview; non nella spiegazione dei benefici | Portare la limitazione in FAQ o microcopy comprensibile: «Attualmente i voti usano la scala da 1 a 6» |
| P2 | Prova senza account lontana dal hero | `averageToolLink` dopo feature grid | Promuovere un secondo ingresso esplicito «Prova il calcolo della media» vicino alla CTA principale; mantenere accesso esistente in header |
| P2 | Home, statistiche e classi descritte per nomi interni | «Nella Home» nel lead; card «Classi» | Preferire risultato: «Vedi cosa scade e come stanno andando le materie», «Organizzati con i compagni» |
| P3 | Manifest IT e metadata pubblico usano copy distinto | Manifest IT statico; manifest DE/FR/EN generati dal lead | Ricontrollare coerenza dei claim dopo il rilascio; non serve renderli identici, serve mantenerli veritieri |

## Proposta di contenuti italiani

### Hero

Contesto breve: «Diario scolastico personale».

H1: **Il tuo diario scolastico, tutto in ordine.**

Lead: «Organizza compiti e verifiche, registra i voti e ritrova gli appunti per materia. iPagell ti mostra le prossime scadenze e le medie, dal telefono o dal computer.»

CTA primaria: «Crea il tuo diario». CTA secondaria: «Prova il calcolo della media». Accesso esistente: «Accedi» in header.

Microcopy breve: «Voti da 1 a 6 · Diario personale · Funziona nel browser». Evitare «senza email» se l'autenticazione email è in roadmap; evitare claim offline assoluti.

Title SEO: **Diario scolastico online: voti, agenda e appunti**. Il template di layout aggiunge « | iPagell» una sola volta.

Meta description: «Organizza compiti e verifiche, registra voti e assenze e raccogli appunti per materia. Prova il calcolo della media da 1 a 6 senza account.»

### Benefici

1. «Voti e medie per materia» — «Registra i voti da 1 a 6 e segui la media e l'andamento di ogni materia.»
2. «Compiti e verifiche in agenda» — «Tieni le scadenze nel calendario e vedi cosa preparare nei prossimi giorni.»
3. «Appunti sempre per materia» — «Raccogli i tuoi appunti, formattali ed esportali quando ti servono.»
4. «Attività della classe» — «Condividi le attività con i compagni e scegli quali aggiungere alla tua agenda.» Solo dopo conferma feature flag.

### Come iniziare

1. «Crea il tuo account» — «Scegli le credenziali e conserva il codice di recupero.» Questo testo riflette il sistema attuale: da aggiornare quando autenticazione cambia.
2. «Aggiungi le materie» — «Prepara il tuo semestre con le materie che studi.»
3. «Registra il primo voto o impegno» — «Le medie e le prossime scadenze prendono forma con i dati che inserisci.»

### Privacy e FAQ

Titolo privacy: «Il tuo diario resta personale.»

Testo: «Voti, assenze e appunti personali restano nel tuo account. Nella classe condividi soltanto attività e appunti che scegli di pubblicare.» Confermare disponibilità classi/appunti in produzione prima di usare il secondo periodo.

FAQ aggiuntive utili: «Per chi è iPagell?», «Come comincio?», «Posso provarlo senza registrarmi?», «Quale scala di voti supporta?». Tenere quelle esistenti su telefono, registro ufficiale e offline; la risposta offline corrente è prudente e va preservata.

## Piano semantico naturale

| Intento | Concetti da trattare nel contenuto | Dove |
|---|---|---|
| Capire il prodotto | diario scolastico online, diario personale per studenti, organizzazione dello studio | title, H1/contesto, lead |
| Gestire scadenze | agenda scolastica, compiti, verifiche, calendario, scadenze | beneficio agenda, esempio concreto |
| Seguire risultati | voti per materia, media dei voti, media ponderata, andamento, scala da 1 a 6 | beneficio voti, FAQ scala, pagina calcolatore |
| Conservare studio | appunti per materia, appunti scolastici, esportazione PDF e Markdown | beneficio appunti, FAQ e future guide reali |
| Collaborare | attività di classe, compagni, agenda condivisa, appunti condivisi | beneficio classi e privacy, dopo verifica disponibilità |
| Prova immediata | calcolo media voti senza account, calcolatore media voti | link hero, tool pubblico |

Questa tabella descrive temi, non una lista da incollare nella pagina. Non ripetere sinonimi in blocchi artificiali e non aggiungere meta keywords: Google non li usa. Usare «Svizzera» o «scala svizzera» solo in un contesto realmente utile e preciso; la scala 1–6 è il limite tecnico certo, non un'identità geografica da inferire. Non promettere scala 1–10, registro elettronico ufficiale, AI, OCR, notifiche ad app chiusa o accesso Google/Apple/email prima che esistano.

## Cambiamenti tecnici suggeriti

- `lib/i18n/messages/{it,de,fr,en}.json`: aggiungere title/description SEO distinti, benefici appunti, contesto e percorso iniziale; tradurre il significato, senza forzare keyword italiane nelle altre lingue.
- `lib/i18n/public-page.ts`: usare `landing.metaTitle`/`landing.metaDescription`; preservare template e tutte le alternates, OG, Twitter, canonical, noindex preview.
- `components/landing-content.tsx`: gerarchia di hero e CTA, quarto beneficio, percorso iniziale, FAQ coerenti. Le FAQ in `details` sono contenuto utile, non testo nascosto per SEO.
- `app/marketing-page.module.css`: layout pulito e leggibile per quattro benefici, tre passaggi e CTA mobile; evitare spazio verticale eccessivo prima di spiegare il prodotto.
- `tests/i18n-public.test.ts`: aggiornare l'origine del title/description; mantenere test di URL, lingue, host e JSON-LD. Questi controlli proteggono routing/metadati reali, non misurano posizionamento.
- `public/manifest.webmanifest`, `scripts/localized-manifest.mjs`, `scripts/generate-precache.mjs`: verificare i claim e preparare i manifest localizzati con il rilascio.
- Non cambiare route esistenti, canonical, sitemap, robots o redirect senza un problema osservato. La base SEO tecnica già esiste.
- JSON-LD SoftwareApplication opzionale solo con dati verificati; non inventare rating, recensioni, prezzi e offerte per inseguire rich results. WebSite esistente sufficiente per questa iterazione.

## Verifica del rilascio e successo

1. `npm run check` e `npm run release:prepare` nel flusso di repository. Verificare test metadata su tutte e quattro le lingue.
2. Risposte HTML anonime delle otto route pubbliche: status 200, title coerente, descrizione specifica, canonical canonico, lingua corretta, alternates reciproche; `/it` non deve generare una nuova pagina indicizzabile concorrente.
3. Alias esistenti: 308 verso `https://ipagell.website`, preservando path/query. Anteprima non canonica: noindex. `/app`: noindex. API: private/no-store e robots invariati.
4. Robots e sitemap restituiti effettivamente dalla produzione; sitemap senza pagine private. Non aggiungere lastmod inventati.
5. Browser desktop/mobile: comprensione del prodotto prima dello scroll lungo, CTA funzionanti, tool senza account, registrazione in lingua corretta, nessun overflow, FAQ accessibili da tastiera.
6. Search Console, se disponibile per il proprietario: ispezione URL live, invio sitemap e richiesta indicizzazione delle pagine aggiornate. Non dichiarare crescita SEO o indicizzazione avvenuta sulla base di un deploy.
7. Valutare nei successivi dati reali query non di marca pertinenti, impression/click organici, ingresso al calcolatore e conversione verso creazione account. Nessun numero va inventato come baseline.

## Fonti primarie consultate

- [Google Search Central: SEO Starter Guide](https://developers.google.com/search/docs/fundamentals/seo-starter-guide): contenuti utili e naturali, parole dei lettori, nessun valore SEO per meta keywords e nessuna garanzia di ranking.
- [Google Search Central: Spam policies, keyword stuffing](https://developers.google.com/search/docs/essentials/spam-policies#keyword-stuffing): ripetizioni innaturali e liste fuori contesto finalizzate a manipolare ranking sono una pratica di spam.
- [Google Search Central: title links](https://developers.google.com/search/docs/appearance/title-link): titoli descrittivi, concisi e coerenti con lingua e contenuto.
- [Google Search Central: snippets](https://developers.google.com/search/docs/appearance/snippet): descrizioni pertinenti e specifiche aiutano l'utente a scegliere il risultato; Google può scegliere uno snippet diverso.
- [Google Search Central: JavaScript SEO](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics): title/description e canonical accessibili, preferibilmente già nell'HTML.

Le proposte di copy e priorità sono valutazioni professionali basate sul codice osservato, non risultati di una ricerca quantitativa sulle keyword o di un test con nuovi utenti.
