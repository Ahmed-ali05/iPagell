# Sviluppo e pubblicazione

[Indice](../README.md) · [Manutenzione](MANUTENZIONE.md)

## Una produzione: ipagell.website

La produzione è **https://ipagell.website**, ospitata da Sites con il database esistente. Il progetto da aggiornare è quello in `.openai/hosting.json`. `www.ipagell.website` è collegato allo stesso sito e `ipagell.produc-ch.chatgpt.site` è l'alias generato corrente. L'alias storico `ipagell.ahmed-2005-taverbe.chatgpt.site` non risulta più instradato al progetto Sites nella verifica post-deploy della versione 17: restituisce un 404 di piattaforma prima di raggiungere l'app e va considerato dismesso. `proxy.ts` reindirizza solo gli host ancora collegati con HTTP 308 al dominio principale, conservando percorso e query. La protezione nel browser in `app/layout.tsx` copre il proxy Sites quando non espone il nome originale al redirect server e conserva anche il frammento dell'invito. Gli alias tecnici restano gestiti da Sites e non costituiscono produzioni separate. Per ripristinare l'alias storico occorre un intervento esplicito nella configurazione domini di Sites, non una modifica al proxy.

## Indicizzazione e landing pubblica

Le landing `/`, `/de`, `/fr`, `/en` e le rispettive utility pubbliche per il calcolo della media sono destinate all'indicizzazione, ciascuna con canonical, titolo, descrizione e anteprime social localizzati. La sitemap pubblica contiene questi otto URL. `robots.txt` lascia consultabili `/app` e `/offline.html`, così i motori possono leggere i rispettivi `noindex, nofollow`; le API restano escluse. Le landing dichiarano dati strutturati coerenti con il testo visibile: non aggiungere prezzi, valutazioni o recensioni senza un'offerta e prove reali.

Prima di pubblicare modifiche alla landing, verificare i metadati nel bundle, la sitemap, `robots.txt`, i redirect degli alias con query string e la corrispondenza dei dati strutturati con i contenuti visibili. Controllare la resa desktop e mobile e assicurarsi che il link GitHub punti al repository pubblico corretto.

Il Worker indipendente configurato in `wrangler.jsonc` ha un **database separato**. Il suo nome storico `ipagell-production` non significa che contenga i dati di ipagell.website. Pubblicarlo non aggiorna il sito pubblico. Non cambiare DNS o database per un normale rilascio.

## Quando modifichi tu il codice

1. Crea un ramo dal `main` aggiornato e modifica il progetto.
2. Da un clone pulito esegui `npm run install:ci`. Per l'anteprima usa `npm run dev`; inizializza il database locale come indicato in [Manutenzione](MANUTENZIONE.md).
3. Esegui `npm run release:prepare`: controlla codice, tipi, test, documentazione e genera la build.
4. Salva le modifiche con un commit, invia il ramo su GitHub e apri una pull request. Il workflow **Controlli iPagell** esegue gli stessi controlli; puoi avviarlo anche da GitHub → Actions → Controlli iPagell → Run workflow. Unisci quando è verde.
5. Apri il progetto aggiornato in Codex e chiedi: **«Pubblica questo codice su ipagell.website usando il progetto Sites esistente»**.

GitHub verifica il codice ma non pubblica la produzione. Il deploy Sites richiede il collegamento Sites autenticato di Codex: in questo repository non è configurata un'integrazione CI per pubblicare su Sites. `release:prepare` prepara il rilascio, non lo pubblica.

## Procedura di pubblicazione per Codex

Usare la skill Sites hosting: verificare il progetto e i domini esistenti, compilare per Sites con `npm run build` (senza `IPAGELL_DEPLOY_TARGET=cloudflare`), salvare e inviare l'esatto sorgente al repository restituito dal connettore, preparare il pacchetto e pubblicare la versione con Sites. Attendere lo stato `succeeded` e confermare l'URL **https://ipagell.website**. Il push del sorgente Sites è distinto da GitHub.

Preservare accesso pubblico e binding esistenti. Le migrazioni incluse nel pacchetto devono essere compatibili con i dati correnti; un rollback del codice non annulla le migrazioni. Nessun token, backup, database locale o `.env` nel pacchetto o nel repository.

Il rilascio Appunti è stato pubblicato come versione Sites 24 il 30 settembre 2026. Il deployment è riuscito su `https://ipagell.website`; i domini `ipagell.website` e `www.ipagell.website` risultano attivi. Dopo il deploy il D1 Sites espone `content_format` sia in `personal_notes` sia in `class_notes`. Le prove locali verificano la migrazione legacy a `plain`, API con contratto 2, backup V1/V2/V3, conflitti e limiti. Restano da verificare su dispositivi fisici l'editing mobile e la resa visiva del PDF aperto dal browser; nessuna nota reale è stata modificata durante il rilascio. Non usare il D1 del Worker sperimentale come prova dello schema Sites.

Il 1 ottobre 2026 è stata pubblicata la versione Sites **26**, con sorgente `26c10606aaec54b17e44f94244714a1ad1fefedf` e deployment `appgdep_6abe0a69171c819198a8548fb90519c3`, concluso con stato `succeeded`. Include il percorso UX Appunti e la correzione di focus/selezione della barra di formattazione. Il connettore conferma `https://ipagell.website` come URL live, accesso pubblico e i due domini con TLS attivo. Il binding `DB` e le migrazioni esistenti sono stati conservati; nessuna nuova migrazione, cambio di accesso o modifica a note reali. Prima del rilascio: 87 test, 130 controlli API locali e build completata. La prova su smartphone fisico resta da eseguire.

## Worker sperimentale separato

Solo per prove esplicitamente richieste, dopo `npx wrangler login`:

```bash
npm run deploy:sandbox
```

Questo compila, verifica e pubblica il Worker `workers.dev`, applicando le migrazioni al suo D1 separato. Il vecchio `npm run deploy:cloudflare` si ferma con un messaggio per evitare pubblicazioni nel posto sbagliato. Il workflow GitHub di deploy Cloudflare è stato sostituito dai controlli.

Un'eventuale migrazione futura fuori da Sites richiede trasferimento verificato dei dati e del dominio come attività dedicata.
