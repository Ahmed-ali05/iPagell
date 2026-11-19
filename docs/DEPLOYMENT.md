# Sviluppo e pubblicazione

[Indice](../README.md) · [Manutenzione](MANUTENZIONE.md)

## Migrazione a Cloudflare — 16 novembre 2026

L'abbonamento OpenAI non è più attivo, quindi i rilasci via Sites/Codex non sono più possibili. La nuova produzione è sull'account Cloudflare del proprietario:

- Worker **`ipagell`**, configurato in `wrangler.jsonc`, versione `25189828-de20-44da-b04f-fbf5f7e32ee2` pubblicata dal ramo `sync/checkout-20261116`.
- D1 **`ipagell-live`** (`588e7605-60a5-4bdf-8b1f-b1f8ce2df28b`, giurisdizione UE), binding `DB`, migrazioni `0000`–`0006` applicate. Database nuovo e vuoto.
- Indirizzo provvisorio: https://ipagell.ahmedbasto59.workers.dev.
- Il vecchio D1 di prova `ipagell-production` (2 account sintetici, migrazioni fino a `0004`) non è più collegato al Worker; si può eliminare.

Prima della pubblicazione: `npm run check` con 147 test, lint/tipi/i18n/documentazione superati (Node 24.22.3) e 146 controlli API superati in locale sulla stessa build compilata, con account sintetici rimossi. Dopo: homepage, `/de`, `/app`, sitemap, robots e service worker rispondono 200; `/api/account` senza sessione risponde 401. Nessun account creato sul D1 remoto.

**Dati.** Il D1 di Sites si trova sull'account Cloudflare di OpenAI e l'app non ha un export di massa, per cui i dati non sono stati trasferiti. Ogni utente esporta il backup JSON da Impostazioni sul vecchio sito, si registra di nuovo sul nuovo sito e importa il file. Password, classi, membri e inviti non vengono trasferiti; gli appunti di classe scritti dall'utente sono nel suo backup.

**Dominio (completato il 16 novembre 2026).** `ipagell.website` resta registrato su GoDaddy, ma i nameserver ora sono quelli di Cloudflare (`mark`/`saanvi.ns.cloudflare.com`, zona Free, DNSSEC non attivo). `ipagell.website` e `www.ipagell.website` sono Custom Domains del Worker (`routes` in `wrangler.jsonc`), versione `f78d7a92-3106-461e-b485-c6d2f999ee9e`, con certificato TLS valido. Verificato con `wrangler tail` che le richieste di entrambi gli host arrivano al Worker. Homepage, `/de`, `/app`, sitemap, robots e service worker rispondono 200, `/api/account` senza sessione risponde 401, e `www` reindirizza con 308 a `ipagell.website` mantenendo percorso e query. Nei primi minuti dopo il collegamento il dominio era ancora servito da Sites. Finché le cache DNS pubbliche non scadono, alcuni utenti possono ancora vedere il vecchio sito. Restano invariati i record TXT di Google e `_dmarc`. Gli alias `*.chatgpt.site` in `proxy.ts` e `app/layout.tsx` non servono più e si possono rimuovere in un rilascio successivo.

### Pubblicare un aggiornamento

```bash
npx wrangler login
npm run release:prepare
npm run deploy:cloudflare
```

`deploy:cloudflare` compila con `IPAGELL_DEPLOY_TARGET=cloudflare`, verifica che la config generata in `dist/server/wrangler.json` sia quella di produzione (Worker `ipagell`, D1 `ipagell-live`), esegue un dry run, applica al D1 remoto le migrazioni non ancora applicate e pubblica il Worker con quella config. `wrangler.jsonc` dalla radice non si usa per il deploy: la sua `main` punta all'entry del binding locale. Lo staging si pubblica con `CLOUDFLARE_ENV=staging npm run build:cloudflare` seguito da `npx wrangler deploy -c dist/server/wrangler.json`, senza il passo di migrazione di produzione. Una migrazione applicata non si annulla con un rollback del codice. Richiede Node 22.23.4+ / 24.22.1+ / 26.12.1+; su questo Mac si usa `/opt/homebrew/opt/node@24/bin`.

### Ridisegno UI — 18 novembre 2026

Pubblicata la versione Worker **`7b26524e-f3e0-4b27-8326-d006ff16b713`** su `ipagell.website`, `www.ipagell.website` e `ipagell.ahmedbasto59.workers.dev`. Sorgente: commit `60cac90` del ramo `ui/liquid-glass-redesign-sync` ([PR 12](https://github.com/Ahmed-ali05/iPagell/pull/12)), cioè la produzione di `sync/checkout-20261116` più il solo [ridisegno UI](UI-REDESIGN-2026-11-18.md). Versione precedente, per un eventuale rollback: `f78d7a92-3106-461e-b485-c6d2f999ee9e`.

Eccezione al flusso «solo da `main`», decisa dal proprietario: la CI di tutte le PR aperte (#9–#12) si ferma all'audit delle dipendenze (avvisi su `wrangler`/`miniflare` e su `zod`, correzione nelle PR #10 e #11). Il rilascio non cambia dipendenze né schema: l'unico avviso runtime (`zod`) era già nella versione precedente. Pubblicato da una copia separata con installazione pulita (`npm run install:ci`, Node 24.22.3), non dal working tree locale con modifiche auth in corso.

Prima: `npm run release:prepare` superato (147 test). `wrangler d1 migrations list` sul D1 remoto: nessuna migrazione da applicare; il deploy lo ha confermato. Dopo: `/`, `/de`, `/fr`, `/en`, `/app`, le tre utility pubbliche, sitemap, robots, service worker e manifest rispondono 200; `/api/account` senza sessione 401; `www` reindirizza con 308 mantenendo percorso e query. Il CSS servito contiene i nuovi token. Nessun account o dato remoto modificato. Il service worker non usa `skipWaiting()`: chi ha l'app aperta vede la nuova interfaccia dopo aver chiuso e riaperto le schede.

### Nuova home pubblica — 18 novembre 2026

Pubblicata la versione Worker **`7a07b2ec-712d-4fcd-8717-74ae8f66ea85`** (20:32 UTC) su `ipagell.website`, `www.ipagell.website` e `ipagell.ahmedbasto59.workers.dev`. Sorgente: commit `941dfc3` del ramo `release/home-20261118`, cioè la versione precedente (`d39609f` di `ui/liquid-glass-redesign-sync`) più il solo commit della nuova home: hero con il marchio, testi brevi di home e pagina «Il diario», schermate di prodotto rigenerate in blu ([fase 4](UI-REDESIGN-2026-11-18.md#fase-4--home-pubblica-marchio-e-testi-brevi-richiesta-del-proprietario)). Versione precedente, per un eventuale rollback: `7b26524e-f3e0-4b27-8326-d006ff16b713`.

Stessa eccezione al flusso «solo da `main`» del rilascio precedente, decisa dal proprietario: escluse le migrazioni 0007/0008 e l'accesso Google del ramo `auth/w8b-cloudflare` (Fase D del piano W8-B non ancora eseguita). Nessun cambio a dipendenze, schema o binding. Pubblicato da un worktree separato con installazione pulita (`npm run install:ci`, Node 24.22.3).

Prima: `npm run check` (147 test, 865 chiavi, inventario e link) e `npm run build` superati sul ramo di rilascio; `wrangler d1 migrations list` sul D1 remoto: nessuna migrazione da applicare, confermato dal deploy. Dopo: `/`, `/de`, `/fr`, `/en`, `/scopri-ipagell`, `/app`, sitemap, robots, service worker e una delle nuove immagini rispondono 200; `/api/account` senza sessione 401; `www` reindirizza con 308. HTML della home: un H1, i quattro nuovi H2, canonical e `index, follow`. Nessun account o dato remoto modificato. Come prima, chi ha l'app aperta vede la nuova versione dopo aver chiuso e riaperto le schede.

### Dipendenze senza vulnerabilità — 19 novembre 2026

Pubblicata la versione Worker **`41dfaad0-e1dc-42a5-930b-24646013a7e0`** su `ipagell.website`, `www.ipagell.website` e `ipagell.ahmedbasto59.workers.dev`. Sorgente: commit `af33682` del ramo `release/deps-20261119` ([PR 14](https://github.com/Ahmed-ali05/iPagell/pull/14)), cioè la versione precedente più le Fasi 1 e 2 del [piano dipendenze](DEPENDENCY-UPGRADE-PLAN-2026-11-17.md): vinext 1.4.6, vite 8.3.8, wrangler 4.164.0, zod 4.6.7. Chiude l'advisory zod GHSA-mrhx-c7xc-m3w5, presente nel bundle del Worker. Versione precedente, per un eventuale rollback: `7a07b2ec-712d-4fcd-8717-74ae8f66ea85`.

Pubblicata su decisione del proprietario prima dell'esito della CI della PR 14; la CI della PR 11, con lo stesso lockfile, era verde. Nessuna migrazione (confermato da `wrangler d1 migrations list` e dal deploy), nessun cambio a schema, binding o domini.

Prima: in locale con installazione pulita audit a zero, `npm run check` (147 test), `test:auth-d1`, `test:auth-restore`, build e 146 controlli API sul Worker compilato ([prove](DEPENDENCY-UPGRADE-PLAN-2026-11-17.md#fase-3-chiusa--19-novembre-2026)). Dopo: le quattro home, `/scopri-ipagell`, le utility pubbliche, `/app`, sitemap, robots, service worker, manifest e immagini 200; `/api/account` 401; `www` 308 con query conservata; login con credenziali inesistenti 401 `AUTH_INVALID_CREDENTIALS`, registrazione invalida 400 `AUTH_INVALID_SIGNUP`; `/app` si avvia nel browser con il solo 401 atteso in console. Il testo grezzo di alcuni errori di validazione è ora quello di zod 4 (l'interfaccia usa il codice). Nessun account o dato remoto creato o modificato.

### Backup e ripristino del D1 di produzione

Il JSON di backup scaricato dagli utenti non sostituisce un backup operativo del database. Procedura manuale, da ripetere almeno una volta al mese e prima di ogni migrazione:

```bash
npx wrangler d1 export ipagell-live --remote --output ~/Backup/ipagell/ipagell-live-AAAA-MM-GG.sql
```

- Il file contiene i dati degli utenti: conservalo fuori dal repository e fuori da cartelle sincronizzate (iCloud, Dropbox), cifrato o su un supporto controllato.
- Ripristino di prova: importa il dump in un D1 separato e di prova (mai in `ipagell-live`), poi confronta i conteggi delle tabelle. Registra data ed esito.
- Verifica nel dashboard Cloudflare se Time Travel è disponibile per il piano e per quanti giorni; non è documentato come verificato.
- Responsabile del backup, frequenza e conservazione: da assegnare; finché non c'è un nome, il responsabile è il proprietario del repository.

Le sezioni seguenti descrivono il periodo Sites e restano come registro storico.

## Una produzione: ipagell.website (periodo Sites, fino al 16 novembre 2026)

La produzione è **https://ipagell.website**, ospitata da Sites con il database esistente. Il progetto da aggiornare è quello in `.openai/hosting.json`. `www.ipagell.website` è collegato allo stesso sito e `ipagell.produc-ch.chatgpt.site` è l'alias generato corrente. L'alias storico `ipagell.ahmed-2005-taverbe.chatgpt.site` non risulta più instradato al progetto Sites nella verifica post-deploy della versione 17: restituisce un 404 di piattaforma prima di raggiungere l'app e va considerato dismesso. `proxy.ts` reindirizza solo gli host ancora collegati con HTTP 308 al dominio principale, conservando percorso e query. La protezione nel browser in `app/layout.tsx` copre il proxy Sites quando non espone il nome originale al redirect server e conserva anche il frammento dell'invito. Gli alias tecnici restano gestiti da Sites e non costituiscono produzioni separate. Per ripristinare l'alias storico occorre un intervento esplicito nella configurazione domini di Sites, non una modifica al proxy.

## Indicizzazione e landing pubblica

Le landing `/`, `/de`, `/fr`, `/en` e le rispettive utility pubbliche per il calcolo della media sono destinate all'indicizzazione, ciascuna con canonical, titolo, descrizione e anteprime social localizzati. La sitemap pubblica contiene questi otto URL. `robots.txt` lascia consultabili `/app` e `/offline.html`, così i motori possono leggere i rispettivi `noindex, nofollow`; le API restano escluse. I titoli e le descrizioni SEO sono distinti dall’H1 e dal lead visivo nei quattro cataloghi; gli otto URL e le alternates restano invariati. Le landing dichiarano dati strutturati coerenti con il testo visibile: non aggiungere prezzi, valutazioni o recensioni senza un'offerta e prove reali.

Prima di pubblicare modifiche alla landing, verificare i metadati nel bundle, la sitemap, `robots.txt`, i redirect degli alias con query string e la corrispondenza dei dati strutturati con i contenuti visibili. Controllare la resa desktop e mobile e assicurarsi che il link GitHub punti al repository pubblico corretto.

Il Worker indipendente configurato in `wrangler.jsonc` ha un **database separato**. Il suo nome storico `ipagell-production` non significa che contenga i dati di ipagell.website. Pubblicarlo non aggiorna il sito pubblico. Non cambiare DNS o database per un normale rilascio.

## Candidato W8-A — 17 ottobre 2026

[Preparazione al rilascio](improvement-2026-10-01/W8A-RELEASE-PREPARATION.md): ramo isolato dalla sorgente Sites 39, gate CI D1 e verifiche locali. Nessuna pubblicazione del candidato. Il candidato corrente pubblica soltanto le correzioni security sullo schema Sites 39 invariato. La 0007 mai pubblicata e il suo snapshot sono rinviati in `operations/w8a/deferred-expansion/`, fuori dal runner Sites; bootstrap/backfill non sono necessari per questo candidato. Il [runbook](../operations/w8a/RUNBOOK.md) riguarda la futura espansione, ancora bloccata sul canale amministrativo e restore gestito. Il rollback del Worker sul medesimo DB è una prova distinta dal restore DB. Nessuna 0008 o provider inclusi.

## Quando modifichi il codice (flusso attuale, Cloudflare)

1. Crea un ramo dal `main` aggiornato e modifica il progetto.
2. Da un clone pulito esegui `npm run install:ci`. Per l'anteprima usa `npm run dev`; inizializza il database locale come indicato in [Manutenzione](MANUTENZIONE.md).
3. Esegui `npm run release:prepare`: controlla codice, tipi, test, documentazione e genera la build.
4. Salva le modifiche con un commit, invia il ramo su GitHub e apri una pull request. Il workflow **Controlli iPagell** esegue gli stessi controlli; puoi avviarlo anche da GitHub → Actions → Controlli iPagell → Run workflow. Unisci quando è verde.
5. Pubblica solo da `main` allineato a `origin/main`, con working tree pulito (`git status` vuoto per i file del rilascio), seguendo la sezione «Pubblicare un aggiornamento». Dopo il rilascio verifica https://ipagell.website (homepage, `/app`, `/api/account` senza sessione → 401).

Il deploy non viene eseguito dalla CI: va lanciato a mano dal Mac con il login Wrangler dell'account del proprietario.

GitHub verifica il codice ma non pubblica la produzione. Il deploy Sites richiede il collegamento Sites autenticato di Codex: in questo repository non è configurata un'integrazione CI per pubblicare su Sites. `release:prepare` prepara il rilascio, non lo pubblica.

## Procedura di pubblicazione per Codex (storica, non più valida dal 16 novembre 2026)

Non seguire questa procedura: il flusso Sites non è più disponibile. Per i rilasci vedi «Pubblicare un aggiornamento». Testo storico:

Usare la skill Sites hosting: verificare il progetto e i domini esistenti, compilare per Sites con `npm run build` (senza `IPAGELL_DEPLOY_TARGET=cloudflare`), salvare e inviare l'esatto sorgente al repository restituito dal connettore, preparare il pacchetto e pubblicare la versione con Sites. Attendere lo stato `succeeded` e confermare l'URL **https://ipagell.website**. Il push del sorgente Sites è distinto da GitHub.

Preservare accesso pubblico e binding esistenti. Le migrazioni incluse nel pacchetto devono essere compatibili con i dati correnti; un rollback del codice non annulla le migrazioni. Nessun token, backup, database locale o `.env` nel pacchetto o nel repository.

Il rilascio Appunti è stato pubblicato come versione Sites 24 il 30 settembre 2026. Il deployment è riuscito su `https://ipagell.website`; i domini `ipagell.website` e `www.ipagell.website` risultano attivi. Dopo il deploy il D1 Sites espone `content_format` sia in `personal_notes` sia in `class_notes`. Le prove locali verificano la migrazione legacy a `plain`, API con contratto 2, backup V1/V2/V3, conflitti e limiti. Restano da verificare su dispositivi fisici l'editing mobile e la resa visiva del PDF aperto dal browser; nessuna nota reale è stata modificata durante il rilascio. Non usare il D1 del Worker sperimentale come prova dello schema Sites.

Il 1 ottobre 2026 è stata pubblicata la versione Sites **26**, con sorgente `26c10606aaec54b17e44f94244714a1ad1fefedf` e deployment `appgdep_6abe0a69171c819198a8548fb90519c3`, concluso con stato `succeeded`. Include il percorso UX Appunti e la correzione di focus/selezione della barra di formattazione. Il connettore conferma `https://ipagell.website` come URL live, accesso pubblico e i due domini con TLS attivo. Il binding `DB` e le migrazioni esistenti sono stati conservati; nessuna nuova migrazione, cambio di accesso o modifica a note reali. Prima del rilascio: 87 test, 130 controlli API locali e build completata. La prova su smartphone fisico resta da eseguire.

Sempre il 1 ottobre è stata pubblicata la versione Sites **27**, sorgente `9535676a53a75f9ff52cf90a501435e1bcee40db`, deployment `appgdep_6abe17938bf48191938483d415de60bf` con stato `succeeded`. Corregge la persistenza concorrente degli appunti personali, conserva il risultato del commit se fallisce un aggiornamento della vista, condivide la coda di autosave fra i due editor e rende canonici gli a-capo formattati. Conserva la revisione iniziale delle bozze di classe e il testo dopo comandi rifiutati. Prima del rilascio: `npm run check` con 103 test, 146 controlli API locali, prova browser con account sintetico ripulito e build Sites completata. Rimane l'avviso sui chunk oltre 500 kB. Nessuna nuova migrazione o modifica ai binding, accesso, domini e dati utente.

Il 1 ottobre 2026 è stata pubblicata la versione Sites **28**, sorgente `8fee251e1b942d3392ca92ab9381be4c0a6ae1c8`, deployment `appgdep_6abe63d2394c8191a6ee91547a4e3008` con stato `succeeded`. Include ingresso e metadati in quattro lingue, registrazione/setup progressivi, recovery resistente al retry e le dipendenze corrette nell’audit. Prima del rilascio: 106 test, 146 controlli API locali, SSR delle otto route pubbliche e prove browser mobile/desktop con utenti sintetici ripuliti. Il connettore restituisce l’alias corrente `https://ipagell.produc-ch.chatgpt.site`; il dominio canonico resta **https://ipagell.website**, verificato attivo con www e TLS prima della pubblicazione. Nessuna nuova migrazione o modifica a binding, audience e domini. Google/Apple/email e consultazione annuale sono pianificati. [Rapporto dettagliato](improvement-2026-10-01/VERIFICATION.md).


Il 1 ottobre 2026 è stata pubblicata la versione Sites **29**, sorgente `02cb8843867987dbb3552e049fd1aecd5f755352`, deployment `appgdep_6abe8ea156008191bdddc2141ffb5162` con stato **succeeded** alle 18:47 Europe/Zurich. Include la consultazione Voti/Statistiche Periodo/Anno/Storico e il periodo esplicito nel nuovo voto. Prima: 114 test, 146 controlli API locali, SSR e browser desktop/320/390 px chiaro/scuro. Dopo: sito canonico https://ipagell.website attivo/pubblico, versione 29, domini/www/TLS active; DB, binding, accesso, runtime e domini preservati. Nessuna nuova migrazione. Durante la sessione il helper Sites è temporaneamente scomparso dalla cache e poi tornato dopo riattivazione del plugin dall’utente; rilascio concluso col workflow prescritto. [Rapporto](improvement-2026-10-01/VERIFICATION.md).

Il 2 ottobre 2026 è stata pubblicata la versione Sites **30**, sorgente `4205a7418c3e76851e1b63917175dfabf3e32f94`, deployment `appgdep_6ac0078a2fa881918d9f0e3dd44087cf` con stato **succeeded** alle 21:36 Europe/Zurich. La homepage sostituisce l’anteprima disegnata con catture reali Home, Voti e Appunti, dati dimostrativi e Home dedicata al mobile. Le tre immagini desktop WebP totalizzano 169.596 byte, la variante mobile 41.734 byte; Voti e Appunti sono caricati in modo differito. Testi alternativi, didascalia e link di ingrandimento sono localizzati; le immagini mostrano l’interfaccia italiana dichiarata.

Prima del rilascio: lint, TypeScript, **114 test**, cataloghi, inventario, documentazione e build Sites superati; immagini caricate, ingrandimento e assenza di overflow verificati a 320/390/768/1440 px e sulle quattro landing. Canonical/metadata delle otto route, sitemap e robots verificati localmente; redirect alias verificato direttamente nel proxy. Dopo: connettore Sites conferma versione 30, `https://ipagell.website`, accesso pubblico e domini/www/TLS attivi. Rilascio preparato dal sorgente Sites 29 in una copia separata per escludere le modifiche locali pregresse. Nessuna modifica a schema, binding, accesso, domini o account reali.

Il 2 ottobre 2026 è stata pubblicata la versione Sites **31**, sorgente `64a75e23b02e8ea6b39dc6343440d31c4a6bb16b`, deployment `appgdep_6ac00d27c47c81918fd237eeacc31609` con stato **succeeded** alle 21:59 Europe/Zurich. La homepage presenta una sola dimostrazione con schede Scadenze → Voti → Appunti, testi brevi e inquadrature dei componenti effettivi, anche in variante mobile. Le immagini si ingrandiscono in una finestra interna: i link diretti ai file, che sul servizio venivano scaricati per il tipo generico, sono stati rimossi. Nessun controllo dell’immagine richiede installazione o download.

Prima: `npm run check` (114 test), build Sites e prove browser su sette combinazioni di lingua/viewport; 21 ingrandimenti con focus e chiusura verificati, nessun download, popup, navigazione involontaria, errore JavaScript o overflow. Dopo: Sites conferma versione 31, `https://ipagell.website`, accesso pubblico e domini/www/TLS attivi. Sorgente preparato nella copia separata Sites per escludere le modifiche pregresse del working tree. Nessuna nuova migrazione o modifica a dati, binding, accesso e domini. Il criterio progettuale e i limiti delle verifiche sono descritti in [Riferimento UX](UX-REFERENCE.md).

Il 3 ottobre 2026 è stata pubblicata la versione Sites **32**, sorgente `1df2f42fed0d0c7f615d63883109d8cfb8ccd8cf`, deployment `appgdep_6ac0dca546488191ad05c6c185e6dc3d` con stato **succeeded** alle 12:45 Europe/Zurich. La homepage ha una composizione unitaria: apertura centrata, schermate essenziali di scadenze/medie/appunti, due righe di presentazione alternate, blocco classe/privacy più semplice e footer compatto. Le catture reali con dati dimostrativi, inclusi materie e appunto, seguono il locale it/de/fr/en. Il comando di ingrandimento sta fuori dall’immagine e apre una finestra interna senza download.

Prima: lint e TypeScript, 114 test esistenti, cataloghi (758 chiavi), inventario/documentazione e build Sites superati. Verifica browser: 12 combinazioni di lingua/viewport/font, 36 ingrandimenti con focus e chiusura, cambio lingua tramite selettore; nessun download, popup, navigazione involontaria, errore JavaScript o overflow. Dopo: Sites conferma versione 32, `https://ipagell.website`, audience pubblica e domini/www/TLS attivi. Sorgente preparato dalla versione 31 nella copia Sites separata per escludere le modifiche locali pregresse. Nessuna modifica a schema, binding, accesso, domini o account reali. La scelta visiva è documentata nel [Riferimento UX](UX-REFERENCE.md); non è uno studio con utenti né una misura di conversione.

Il 10 ottobre 2026 è stata pubblicata la versione Sites **33**, sorgente `0288de5aa0419f8d7a1d59a69f5cb728c95dda55`, deployment `appgdep_6aca102fca3081918ea6c6cd6c4ab082`, concluso con stato **succeeded** alle 12:15 Europe/Zurich. Include la semplificazione delle viste e gli altri appunti della materia sotto il lettore. Sorgente preparato dalla versione live 32 in una copia separata; esperimenti e altre modifiche locali pregresse esclusi. Prima del rilascio: 114 test generali già superati durante la semplificazione; per l’aggiunta finale, lint dei componenti modificati, TypeScript, i18n (759 chiavi), documentazione, prove sintetiche del cambio nota/focus/movimento ridotto a 1440/390 px e build Sites. La suite generale e quella API non sono state ripetute. Dopo: Sites conferma versione 33, https://ipagell.website, audience pubblica e domini/www/TLS attivi. Nessuna nuova migrazione o modifica a database, binding, accesso e domini. I dati reali non sono stati modificati. La route sintetica temporanea è esclusa dal pacchetto. Restano non verificati telefono fisico, tastiera virtuale e lettore di schermo. [Decisioni e limiti](UX-SIMPLIFICATION-2026-10-10.md).

Il sorgente del rilascio 33 e la registrazione del deployment sono salvati nella [PR GitHub 5](https://github.com/Ahmed-ali05/iPagell/pull/5). Il primo controllo automatico del 10 ottobre si è fermato all’audit delle dipendenze: 13 segnalazioni high nelle catene braces, sharp e source-map-js. La pubblicazione Sites 33 è già riuscita. La correzione successiva aggiorna sharp/source-map-js e introduce una patch locale braces verificata prima dell’audit: [analisi e prove](DEPENDENCY-SECURITY-2026-10-10.md). La [nuova CI](https://github.com/Ahmed-ali05/iPagell/actions/runs/38073051270) sul commit `f2200a94f72ce7c7d49081ea4229b9af0a5ac386` è riuscita: installazione pulita Node 22, sette prove della patch, audit completo a zero, lint/tipi, 121 test, i18n, documentazione e build. I controlli restano attivi; nessun downgrade o aggiornamento forzato della toolchain.

Il 10 ottobre 2026 è stata pubblicata la versione Sites **34**, sorgente `f2200a94f72ce7c7d49081ea4229b9af0a5ac386`, deployment `appgdep_6aca7a42f8bc819184aaa0f9b87e7436`, concluso **succeeded** alle 19:48 Europe/Zurich. Contiene la correzione delle dipendenze e mantiene la UI di Sites 33. Build e pacchetto preparati dall’esatto commit inviato al repository Sites; CI GitHub verde prima del deploy. Dopo la pubblicazione, Sites conferma https://ipagell.website, audience pubblica, domini canonico/www e TLS attivi. Homepage e `/app` rispondono con HTML e HTTP 200. Nessuna nuova migrazione o modifica a database, binding, domini, accesso e dati utente. Le prove browser della UI non sono state ripetute. [Analisi e manutenzione della patch locale](DEPENDENCY-SECURITY-2026-10-10.md).

Il 10 ottobre 2026 è stata pubblicata la versione Sites **35**, sorgente `140c56f6d2dcfbed9d8413c6e5bcd81f7379f6af`, deployment `appgdep_6aca7e78142c81918098b14a342fd8ba`, concluso **succeeded** alle 20:06 Europe/Zurich. Corregge la visibilità del toggle Riduci movimento con colori del tema, focus visibile, etichetta associata e area cliccabile 52×44 px. Prima del rilascio: prove mirate sulla finestra Impostazioni reale con dati sintetici, acceso/spento chiaro/scuro, mouse/etichetta/Space, focus, movimento ridotto e layout desktop/390 px; lint del componente modificato, TypeScript, documentazione e build Sites. Route ed export temporanei di prova rimossi prima della build. Non sono state ripetute manualmente le suite generali/API; la CI resta quella ordinaria. Sites conferma https://ipagell.website, versione 35 e accesso pubblico. Nessuna nuova migrazione o modifica a binding, dati e preferenze dell’account reale. [Causa e soluzione](UX-SIMPLIFICATION-2026-10-10.md#correzione-riduci-movimento--10-ottobre).

Il 10 ottobre 2026 è stata pubblicata la versione Sites **36**, sorgente `84abbf943b3c55c815aded00e545f7de12f28acb`, deployment `appgdep_6aca8811d9948191ba63063a489d5099`, concluso **succeeded** alle 20:47 Europe/Zurich. Elimina il doppio spostamento del cursore Riduci movimento nella build compilata, applica la preferenza ai grafici e rimuove il dataset all’uscita dal diario. Corregge inoltre il taglio dei controlli delle Impostazioni su telefono. Prima del rilascio: prove mirate sulla build compilata e sul workspace reale con dati sintetici, due nuove regressioni di persistenza/backup, lint/tipi/cataloghi/documentazione; [CI sul sorgente pubblicato](https://github.com/Ahmed-ali05/iPagell/actions/runs/38077027637) verde, incluse installazione pulita, audit, suite ordinaria e build. Fixture ed export temporanei esclusi dal pacchetto. Dopo: Sites conferma https://ipagell.website, versione 36, audience pubblica e domini canonico/www con TLS attivo. Nessuna nuova migrazione o modifica a database, binding, domini e preferenze reali. [Analisi, casi e limiti](UX-SIMPLIFICATION-2026-10-10.md#regressione-del-toggle-e-copertura-del-movimento--10-ottobre).

Il 10 ottobre 2026 è stata pubblicata la versione Sites **37**, sorgente `bf295652402cc3018fba46a5b8ec91ed55cfcdb5`, deployment `appgdep_6aca90049350819189acde5a20f974a2`, concluso **succeeded** alle 21:20 Europe/Zurich. Riorganizza l’elenco Agenda con lavoro aperto in testa, storico richiudibile e righe compatte; dettaglio calendario mobile e ingresso all’elenco completo. [CI sul sorgente](https://github.com/Ahmed-ali05/iPagell/actions/runs/38079164366) riuscita: audit a zero, 128 test, tipi/lint, 768 chiavi i18n, documentazione e build. Pacchetto senza fixture costruito dal medesimo commit inviato a Sites; il riferimento iniziale del workflow è stato riaperto e riallineato prima del confezionamento. Dopo: URL live https://ipagell.website, pubblico, domini canonico/www e TLS attivi. Browser autenticato in sola lettura a 390/1440 px: unica aperta in testa, sette completate chiuse, nessun overflow; prima aperta mobile a 406,2 px contro 2.110,8 px prima. Nessuna migrazione, modifica a database/binding/accesso o attività reali. [Analisi e limiti](AGENDA-LIST-2026-10-10.md).

## Worker sperimentale separato (storico)

Fino al 16 novembre 2026 `wrangler.jsonc` indicava un Worker sperimentale con il D1 di prova `ipagell-production`, pubblicato con `npm run deploy:sandbox`. Lo stesso Worker è ora la produzione con il D1 `ipagell-live`, e lo script sandbox è stato rimosso.



## Rifinitura delle interazioni — Sites 38, 15 ottobre 2026

Pubblicata alle 09:18 Europe/Zurich la versione Sites **38**, sorgente `2a946daea00a3b069a25809c52af3abc0875a061`, deployment `appgdep_6ad07e3bcdbc8191a3edac8c9e3fceb2` con stato **succeeded**. Pacchetto prodotto dal workflow Sites con build e sorgente identici; 128 test, lint, tipi, cataloghi, inventario e documentazione superati. Dopo il deploy: https://ipagell.website confermato live e pubblico, dominio principale/www e TLS attivi; `/app` HTTP 200 e nuovo CSS delle interazioni presente. Progetto e binding DB esistenti conservati, nessuna nuova migrazione. [Analisi, prove e limiti](APPLE-DESIGN-2026-10-15.md).


## Campi data iOS — Sites 39, 15 ottobre 2026

Pubblicata alle 09:56 Europe/Zurich la versione Sites **39**, sorgente `a8cf046fe2cbe804cebdb80957e1ffa2c88893f1`, deployment `appgdep_6ad08724fce481919307c0600ae82d82` **succeeded**. Corregge il dimensionamento dei campi data/ora tramite contenitore esterno e minimi Grid espliciti. Prima: 128 test, lint/tipi, cataloghi, inventario/documentazione e build superati; prove browser locali a 320/390/402/1440 px, quattro lingue, data vuota/data-ora e invio voto sintetico con data conservata. Dopo: https://ipagell.website live/pubblico, HTTP 200 e nuovo CSS presente. Domini/www/TLS attivi verificati prima del deploy; nessuna nuova migrazione o modifica a binding/accesso. Conferma su iPhone fisico ancora da ottenere. [Analisi, fonte WebKit e limiti](IOS-DATE-OVERFLOW-2026-10-15.md).


## Spazio pubblico multipagina — Sites 40, 20 ottobre 2026

Pubblicata alle 11:33 Europe/Zurich la versione Sites **40**, sorgente `482e550c2541d8bf1994e53f29f49ae8441bbfa5`, deployment `appgdep_6ad7356203dc8191969eda982e40eae2` con stato **succeeded**. Include panoramica editoriale, scoperta del diario per capitoli, appunti senza account con bozza locale ed export PDF/Markdown, e media con input conservati nella sessione. Navigazione condivisa e sedici URL canonici nelle quattro lingue.

Rilascio preparato dal sorgente Sites 39 in una copia separata: trasferiti gli interventi pubblici, esclusi gli esperimenti e il lavoro auth W8-A del workspace. API, schema, migrazioni, dipendenze e manifest hosting identici alla versione 39. Prima: controlli e prove browser già conclusi nel workspace (140 test, lint/tipi, i18n e documentazione); su richiesta dell’utente non sono stati ripetuti. Eseguita soltanto la build del pacchetto isolato e controllata la sua composizione. Restano gli avvisi noti sui chunk e classificazione route.

Sites ha concluso la pubblicazione con successo; l’URL restituito dal deploy è l’alias della stessa pubblicazione `https://ipagell.produc-ch.chatgpt.site`, con dominio canonico **https://ipagell.website**. Accesso pubblico, domini principale/www e TLS attivi verificati prima del rilascio; binding preservati. Nessuna modifica a dati reali o nuove migrazioni. Limiti delle prove locali nel [rapporto dello spazio pubblico](PUBLIC-SPACE-2026-10-19.md).


## Ritorno dall’accesso — Sites 41, 20 ottobre 2026

Pubblicata alle 12:15 Europe/Zurich la versione Sites **41**, sorgente `c4c27361049abf78d8cc80963e7f4f8bcb445a98`, deployment `appgdep_6ad73f2fad9c8191a5db1c849121843f` **succeeded**. Accedi, Crea account e Recupera password hanno un link esplicito alla panoramica pubblica nella lingua scelta. Il collegamento non dipende dalla cronologia; durante richieste pendenti è disabilitato. Il passaggio di custodia del codice recupero e il setup autenticato restano quelli esistenti.

Verifiche incrementali: lint del componente, diff senza errori, build del pacchetto Sites, ritorno con Enter da registrazione, presenza in accesso/recupero e quattro traduzioni/destinazioni a 320 px senza overflow. Le suite già eseguite non sono state ripetute. Sorgente preparato dalla versione 40 nella copia isolata, senza nuove dipendenze o migrazioni; accesso pubblico, domini e binding preservati. Nessuna credenziale inviata o account reale modificato.


## Revisione copy e SEO — Sites 42, 21 ottobre 2026

Pubblicata alle 11:24 Europe/Zurich la versione Sites **42**, sorgente `61523824055b62149f8396c197470d507c623072`, deployment `appgdep_6ad884a903208191b44d6d94a51a4f6e` **succeeded**. Include posizionamento svizzero sobrio, revisione editoriale nelle quattro lingue, strumenti senza account riconoscibili, metadati per sezione, alternate CH, contenuti dei pannelli nel primo HTML e ritorno canonico all’italiano. [Audit e verifiche](PUBLIC-COPY-SEO-REVIEW.md).

Deploy semplificato richiesto dall’utente: riutilizzate le verifiche già concluse nel workspace (141 test, lint/tipi/i18n, controlli HTTP e browser), senza ripetere l’intera suite. Pacchetto compilato in una copia isolata dalla versione 41, con sorgente esatto inviato a Sites e archivio locale verificato. Trasferite solo le chiavi editoriali e i file pubblici pertinenti; backend, schema, migrazioni, dipendenze e manifest hosting identici alla versione 41. Esperimenti e auth W8-A esclusi. Nessun commit o push sul repository GitHub di lavoro.

Sites conferma versione 42, dominio live **https://ipagell.website**, accesso pubblico e stato active. Domini canonico/www e TLS attivi verificati prima del deploy; una richiesta HTTP al dominio canonico dopo il rilascio restituisce 200 con titolo e nuovi contenuti attesi. Nessun dato utente modificato.


## 22 ottobre 2026 — Sicurezza runtime e toolchain

Pubblicata **Sites 44**, sorgente `098331e7a9b8cfe7ca957de8f1c10884b35e5759`, deployment `appgdep_6ada321440e081918802629637f18797` **succeeded** su **https://ipagell.website**, con alias restituito `https://ipagell.produc-ch.chatgpt.site`. Accesso pubblico, domini canonico/www e TLS attivi riconfermati. Vite 8.1.6, selezione Node 22.23.4 e blocco dei runtime vulnerabili/fuori supporto. [Analisi e prove](RUNTIME-SECURITY-2026-10-22.md).

Rilascio costruito dal sorgente Sites 42 in checkout isolato: non include le modifiche locali auth/schema/UI o il laboratorio. Nessuna nuova migrazione, cambio binding/accesso/domino o modifica a dati reali. Prima del deploy: installazione da lockfile, audit completo a zero, 138 test, lint/tipi/cataloghi/documentazione e build, più 146 controlli API locali con account sintetici ripuliti. Sul checkout di lavoro separato: 145 test e build; sul laboratorio 52 test e audit a zero. Versione 43 intermedia soltanto salvata, non distribuita. Nessuna CI remota o push GitHub eseguiti da questo task. Le evidenze non certificano le patch interne gestite da Cloudflare.

Verifica HTTP post-deploy con curl: homepage e `/app` **200** sul dominio canonico; riferimenti agli asset della homepage coerenti con la build corretta. Il primo controllo con urllib aveva ricevuto 403: l'esito dipende dal client e non è stato trattato come prova di indisponibilità del sito. Non è stata svolta una nuova revisione visuale o autenticata in produzione.
