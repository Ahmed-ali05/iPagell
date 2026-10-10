# Sviluppo e pubblicazione

[Indice](../README.md) · [Manutenzione](MANUTENZIONE.md)

## Una produzione: ipagell.website

La produzione è **https://ipagell.website**, ospitata da Sites con il database esistente. Il progetto da aggiornare è quello in `.openai/hosting.json`. `www.ipagell.website` è collegato allo stesso sito e `ipagell.produc-ch.chatgpt.site` è l'alias generato corrente. L'alias storico `ipagell.ahmed-2005-taverbe.chatgpt.site` non risulta più instradato al progetto Sites nella verifica post-deploy della versione 17: restituisce un 404 di piattaforma prima di raggiungere l'app e va considerato dismesso. `proxy.ts` reindirizza solo gli host ancora collegati con HTTP 308 al dominio principale, conservando percorso e query. La protezione nel browser in `app/layout.tsx` copre il proxy Sites quando non espone il nome originale al redirect server e conserva anche il frammento dell'invito. Gli alias tecnici restano gestiti da Sites e non costituiscono produzioni separate. Per ripristinare l'alias storico occorre un intervento esplicito nella configurazione domini di Sites, non una modifica al proxy.

## Indicizzazione e landing pubblica

Le landing `/`, `/de`, `/fr`, `/en` e le rispettive utility pubbliche per il calcolo della media sono destinate all'indicizzazione, ciascuna con canonical, titolo, descrizione e anteprime social localizzati. La sitemap pubblica contiene questi otto URL. `robots.txt` lascia consultabili `/app` e `/offline.html`, così i motori possono leggere i rispettivi `noindex, nofollow`; le API restano escluse. I titoli e le descrizioni SEO sono distinti dall’H1 e dal lead visivo nei quattro cataloghi; gli otto URL e le alternates restano invariati. Le landing dichiarano dati strutturati coerenti con il testo visibile: non aggiungere prezzi, valutazioni o recensioni senza un'offerta e prove reali.

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

Sempre il 1 ottobre è stata pubblicata la versione Sites **27**, sorgente `9535676a53a75f9ff52cf90a501435e1bcee40db`, deployment `appgdep_6abe17938bf48191938483d415de60bf` con stato `succeeded`. Corregge la persistenza concorrente degli appunti personali, conserva il risultato del commit se fallisce un aggiornamento della vista, condivide la coda di autosave fra i due editor e rende canonici gli a-capo formattati. Conserva la revisione iniziale delle bozze di classe e il testo dopo comandi rifiutati. Prima del rilascio: `npm run check` con 103 test, 146 controlli API locali, prova browser con account sintetico ripulito e build Sites completata. Rimane l'avviso sui chunk oltre 500 kB. Nessuna nuova migrazione o modifica ai binding, accesso, domini e dati utente.

Il 1 ottobre 2026 è stata pubblicata la versione Sites **28**, sorgente `8fee251e1b942d3392ca92ab9381be4c0a6ae1c8`, deployment `appgdep_6abe63d2394c8191a6ee91547a4e3008` con stato `succeeded`. Include ingresso e metadati in quattro lingue, registrazione/setup progressivi, recovery resistente al retry e le dipendenze corrette nell’audit. Prima del rilascio: 106 test, 146 controlli API locali, SSR delle otto route pubbliche e prove browser mobile/desktop con utenti sintetici ripuliti. Il connettore restituisce l’alias corrente `https://ipagell.produc-ch.chatgpt.site`; il dominio canonico resta **https://ipagell.website**, verificato attivo con www e TLS prima della pubblicazione. Nessuna nuova migrazione o modifica a binding, audience e domini. Google/Apple/email e consultazione annuale sono pianificati. [Rapporto dettagliato](improvement-2026-10-01/VERIFICATION.md).

Il 10 ottobre 2026 è stata pubblicata la versione Sites **33**, sorgente `0288de5aa0419f8d7a1d59a69f5cb728c95dda55`, deployment `appgdep_6aca102fca3081918ea6c6cd6c4ab082`, concluso con stato **succeeded** alle 12:15 Europe/Zurich. Include la semplificazione delle viste e gli altri appunti della materia sotto il lettore. Sorgente preparato dalla versione live 32 in una copia separata; esperimenti e altre modifiche locali pregresse esclusi. Prima del rilascio: 114 test generali già superati durante la semplificazione; per l’aggiunta finale, lint dei componenti modificati, TypeScript, i18n (759 chiavi), documentazione, prove sintetiche del cambio nota/focus/movimento ridotto a 1440/390 px e build Sites. La suite generale e quella API non sono state ripetute. Dopo: Sites conferma versione 33, https://ipagell.website, audience pubblica e domini/www/TLS attivi. Nessuna nuova migrazione o modifica a database, binding, accesso e domini. I dati reali non sono stati modificati. La route sintetica temporanea è esclusa dal pacchetto. Restano non verificati telefono fisico, tastiera virtuale e lettore di schermo. [Decisioni e limiti](UX-SIMPLIFICATION-2026-10-10.md).

Il sorgente del rilascio 33 e la registrazione del deployment sono salvati nella [PR GitHub 5](https://github.com/Ahmed-ali05/iPagell/pull/5). Il primo controllo automatico del 10 ottobre si è fermato all’audit delle dipendenze: 13 segnalazioni high nelle catene braces, sharp e source-map-js. La pubblicazione Sites 33 è già riuscita. La correzione successiva aggiorna sharp/source-map-js e introduce una patch locale braces verificata prima dell’audit: [analisi e prove](DEPENDENCY-SECURITY-2026-10-10.md). La [nuova CI](https://github.com/Ahmed-ali05/iPagell/actions/runs/38073051270) sul commit `f2200a94f72ce7c7d49081ea4229b9af0a5ac386` è riuscita: installazione pulita Node 22, sette prove della patch, audit completo a zero, lint/tipi, 121 test, i18n, documentazione e build. I controlli restano attivi; nessun downgrade o aggiornamento forzato della toolchain.

Il 10 ottobre 2026 è stata pubblicata la versione Sites **34**, sorgente `f2200a94f72ce7c7d49081ea4229b9af0a5ac386`, deployment `appgdep_6aca7a42f8bc819184aaa0f9b87e7436`, concluso **succeeded** alle 19:48 Europe/Zurich. Contiene la correzione delle dipendenze e mantiene la UI di Sites 33. Build e pacchetto preparati dall’esatto commit inviato al repository Sites; CI GitHub verde prima del deploy. Dopo la pubblicazione, Sites conferma https://ipagell.website, audience pubblica, domini canonico/www e TLS attivi. Homepage e `/app` rispondono con HTML e HTTP 200. Nessuna nuova migrazione o modifica a database, binding, domini, accesso e dati utente. Le prove browser della UI non sono state ripetute. [Analisi e manutenzione della patch locale](DEPENDENCY-SECURITY-2026-10-10.md).

## Worker sperimentale separato

Solo per prove esplicitamente richieste, dopo `npx wrangler login`:

```bash
npm run deploy:sandbox
```

Questo compila, verifica e pubblica il Worker `workers.dev`, applicando le migrazioni al suo D1 separato. Il vecchio `npm run deploy:cloudflare` si ferma con un messaggio per evitare pubblicazioni nel posto sbagliato. Il workflow GitHub di deploy Cloudflare è stato sostituito dai controlli.

Un'eventuale migrazione futura fuori da Sites richiede trasferimento verificato dei dati e del dominio come attività dedicata.
