# iPagell — Verification Matrix

> Aggiornamento del working tree: [intervento di affidabilità del 23 settembre 2026](RELIABILITY.md). Le sezioni sottostanti restano lo snapshot storico del commit indicato, non descrivono automaticamente le correzioni successive.


| Metadato | Valore |
|---|---|
| Repository | `Ahmed-ali05/iPagell` |
| Branch analizzato | `main` |
| Commit SHA | `c780569869a77d81db86cf1cd70d9a0e31d232bd` |
| Data commit | 18 settembre 2026, 07:17:44 UTC (09:17:44 CEST) |
| Data analisi | 23 settembre 2026 |

## Legenda

- **VERIFICATO** — direttamente dimostrabile dal codice/configurazione versionata o, per i test, da un run CI associato all'esatto SHA.
- **DEDOTTO** — conclusione ragionevole ottenuta incrociando codice/riferimenti, ma non espressa come proprietà esplicita o non dimostrabile in modo assoluto dal tree.
- **NON VERIFICABILE** — dipende da ambiente esterno, produzione, dati remoti, browser/dispositivo o processo non osservabile nella repository.

## Matrice

| # | Affermazione | Stato | Evidenza | Percorso file | Limitazioni |
|---:|---|---|---|---|---|
| 1 | Il branch analizzato è `main` e l'HEAD auditato è `c780569869a77d81db86cf1cd70d9a0e31d232bd`. | VERIFICATO | Ref GitHub `main` letto all'inizio e ricontrollato durante l'audit. | Git ref `refs/heads/main` | Vale al momento dell'analisi; un commit successivo renderebbe questo documento uno snapshot storico. |
| 2 | L'app usa sorgente Next App Router ma build/runtime Vinext + Vite. | VERIFICATO | `app/**`, dipendenze `next`, `vinext`, `vite`; script build richiama Vinext; Vite monta `vinext()`. | `package.json`, `vite.config.ts`, `scripts/run-framework.mjs` | Non implica equivalenza completa con un server Next standard. |
| 3 | Il Worker usa `vinext/server/fetch-handler` come main. | VERIFICATO | Campo `main` in configurazione runtime. | `wrangler.jsonc`, `vite.config.ts` | Lo stato del Worker realmente pubblicato non è provato. |
| 4 | Le sole pagine applicative principali sono `/` e `/app`; i moduli Voti/Agenda/Assenze/Statistiche/Classi sono tab client-side. | VERIFICATO | Due `page.tsx`; `TabId`/`activeTab` nel componente principale; route report CI. | `app/page.tsx`, `app/app/page.tsx`, `components/ipagell-app.tsx` | `robots` e `sitemap` sono route metadata generate, non pagine UI. |
| 5 | `/` reindirizza un utente già autenticato verso `/app`. | VERIFICATO | `identity()` + `redirect("/app")`. | `app/page.tsx` | Dipende da una sessione valida al runtime. |
| 6 | `?mode=register` apre `/app` in modalità registrazione. | VERIFICATO | `DiaryPage` passa `initialAccountMode`. | `app/app/page.tsx` | Nessun'altra modalità query è gestita qui. |
| 7 | `?view=agenda`, `?view=classes`, `?action=grade` e hash `join=` modificano la vista client. | VERIFICATO | Parsing `URLSearchParams` e hash in `DiaryWorkspace`. | `components/ipagell-app.tsx` | È routing UI interno, non route server separate. |
| 8 | Esistono route API per account, auth, diario, classi, eventi e agenda di classe. | VERIFICATO | 18 file `app/api/**/route.ts` e route report build. | `app/api/**` | La raggiungibilità delle classi dipende dal feature flag. |
| 9 | Le mutazioni same-origin richiedono JSON, Origin corretto e rifiutano `Sec-Fetch-Site: cross-site`. | VERIFICATO | `checkMutation()`. | `lib/server/http.ts` | Protezione applicativa osservata; non sostituisce un audit CSRF completo. |
| 10 | Il limite HTTP predefinito del corpo è 1.500.000 byte. | VERIFICATO | `MAX_BODY = 1_500_000`. | `lib/server/http.ts` | Alcune route usano limiti più piccoli. |
| 11 | Le risposte JSON applicative impostano `private, no-store`, `Vary: Cookie`, `nosniff` e referrer same-origin. | VERIFICATO | Helper `json()`. | `lib/server/http.ts` | Risposte generate fuori da questo helper potrebbero avere header diversi. |
| 12 | Gli account sono interni a iPagell, non OAuth/email. | VERIFICATO | Username/password/recovery code; nessuna route/provider OAuth/email. | `app/api/auth/**`, `lib/auth-validation.ts`, `lib/server/auth.ts` | L'assenza è riferita al repository; un servizio esterno non versionato non è osservabile. |
| 13 | Le password nuove accettate dallo schema sono 12–128 caratteri. | VERIFICATO | `passwordSchema.min(12).max(128)`. | `lib/auth-validation.ts` | Due messaggi API d'errore dicono ancora 15–128: copy incoerente. |
| 14 | I messaggi di errore recover/security sul minimo password sono obsoleti rispetto allo schema. | VERIFICATO | Testo “15–128” contro `min(12)`. | `app/api/auth/recover/route.ts`, `app/api/auth/security/route.ts`, `lib/auth-validation.ts` | È una contraddizione di messaggio, non una differenza della validazione effettiva. |
| 15 | L'hash password usa scrypt con N=16384, r=8, p=5 e salt casuale 16 byte. | VERIFICATO | Costanti e `randomBytes(16)`. | `lib/server/password.ts` | Non è una valutazione indipendente della robustezza dei parametri. |
| 16 | Le sessioni durano 14 giorni e il DB conserva il digest del token. | VERIFICATO | `TTL`, `tokenHash`, INSERT su `sessions`. | `lib/server/auth.ts` | Una sessione può essere invalidata prima da logout/auth_version. |
| 17 | In HTTPS il cookie è `__Host-ipagell-session`, HttpOnly, Secure, SameSite=Lax, Path=/. | VERIFICATO | `cookieName()` e `sessionCookie()`. | `lib/server/auth.ts` | Vale se la richiesta osservata dal server è HTTPS. |
| 18 | Cambio password e recupero invalidano le sessioni precedenti tramite `auth_version`. | VERIFICATO | Incremento `auth_version`; identity richiede match. | `app/api/auth/recover/route.ts`, `app/api/auth/security/route.ts`, `lib/server/auth.ts` | Le righe sessione possono restare finché pulite, ma non autenticare più. |
| 19 | Il recovery code è casuale, restituito in chiaro al client e memorizzato solo come SHA-256. | VERIFICATO | `randomToken()`, `tokenHash()`, colonne recovery hash. | `app/api/auth/register/route.ts`, `app/api/auth/recover/route.ts`, `lib/server/password.ts` | Non certifica come l'utente lo custodisca. |
| 20 | Il rate limiting usa finestre da 15 minuti con bucket IP/user/global. | VERIFICATO | `rateLimit()` e soglie 40/12/400. | `lib/server/auth.ts` | Dipende da `CF-Connecting-IP` fornito dall'edge; se assente usa `unknown`. |
| 21 | Il diario remoto è un singolo snapshot JSON per utente con revisione separata. | VERIFICATO | Schema `diaries` e `DiaryRepository`. | `db/schema.ts`, `lib/server/repository.ts` | Non c'è storico snapshot nel modello corrente. |
| 22 | `diaries.user_id` non ha una FK SQL verso `accounts`. | VERIFICATO | Definizione tabella senza `.references()`, migrazione 0000. | `db/schema.ts`, `drizzle/0000_glorious_crusher_hogan.sql` | L'integrità è gestita dal codice applicativo/cancellazione esplicita. |
| 23 | Le modifiche personali vengono validate e salvate localmente prima del sync remoto. | VERIFICATO | `commit()` → `saveLocal(next)` → `publish()` → `sync()`. | `hooks/use-diary.ts` | Un errore locale IndexedDB impedisce di proseguire quel commit. |
| 24 | La sincronizzazione del diario usa compare-and-swap sulla revisione. | VERIFICATO | `PUT /api/diary` con `revision`; SQL `WHERE ... revision=?`. | `app/api/diary/route.ts`, `lib/server/repository.ts` | Non è un merge di campi. |
| 25 | Un conflitto non sovrascrive automaticamente la versione server. | VERIFICATO | 409 su `changes !== 1`; client passa a `conflict`. | `app/api/diary/route.ts`, `hooks/use-diary.ts` | L'utente deve scegliere come recuperare. |
| 26 | Non esiste merge automatico/CRDT per il diario. | DEDOTTO | Nessuna struttura di merge o log operazioni; sync dell'intero snapshot. | `hooks/use-diary.ts`, `lib/server/repository.ts` | È una conclusione dal codice ispezionato; non esclude tooling esterno non versionato. |
| 27 | La coda di `useDiary` non coordina tab browser diverse. | DEDOTTO | Promise queue in memoria nell'istanza hook; nessun BroadcastChannel/lock cross-tab trovato. | `hooks/use-diary.ts` | Browser storage può comunque avere propria concorrenza; non c'è coordinamento applicativo esplicito. |
| 28 | La copia locale corrente del diario usa IndexedDB `ipagell-db` versione 2, store `accounts`. | VERIFICATO | `indexedDB.open("ipagell-db", 2)` e object store. | `lib/account-storage.ts` | Lo store `state` resta per legacy. |
| 29 | `ipagell-active-account-v2` è il puntatore localStorage dell'account offline attivo. | VERIFICATO | Costante `ACTIVE_KEY`, `activeAccountId()`. | `lib/account-storage.ts` | Non contiene credenziali. |
| 30 | Un fallback offline viene aperto solo per failure non classificata come errore API. | VERIFICATO | Branch `!(error instanceof ApiError)`. | `hooks/use-diary.ts` | Un errore server valido, come 503 JSON, non diventa login offline. |
| 31 | Il service worker non mette in cache API, auth o payload RSC. | VERIFICATO | Strict allowlist e ritorno immediato per RSC; API non in `ALLOWED`. | `public/sw.js` | La cache finale include asset aggiunti dalla build. |
| 32 | La shell `/` e `/app` usa network-first con fallback offline/cache. | VERIFICATO | Handler `navigate`. | `public/sw.js` | Valido quando il service worker è installato/controlla la pagina. |
| 33 | Il template service worker viene trasformato dal build con hash e lista asset. | VERIFICATO | Marker `__BUILD__`/`__ASSETS__` e script replace. | `public/sw.js`, `scripts/generate-precache.mjs` | Il contenuto esatto finale dipende dall'output build. |
| 34 | Il service worker non usa `skipWaiting()`. | VERIFICATO | Nessuna chiamata; commento esplicito in install. | `public/sw.js` | Il ciclo di aggiornamento reale dipende dal browser. |
| 35 | I promemoria sono generati dal codice dell'app aperta, non da push schedulato. | VERIFICATO | Effect UI usa `showNotification`; nessun `push`/scheduler nel SW. | `components/ipagell-app.tsx`, `public/sw.js` | Il browser può mostrare la notifica anche tramite SW, ma il trigger nasce dall'app in esecuzione. |
| 36 | Le classi sono protette da feature flag `IPAGELL_CLASSES=enabled`. | VERIFICATO | `classFeatureEnabled()` e `requireClassesEnabled()`. | `lib/classes/permissions.ts`, `lib/server/class-access.ts` | Il valore effettivo nell'ambiente Sites live non è nel repository. |
| 37 | Nel profilo Worker indipendente versionato le classi sono abilitate. | VERIFICATO | `vars.IPAGELL_CLASSES = "enabled"`. | `wrangler.jsonc` | Non prova che quel Worker sia pubblicato o sia la produzione. |
| 38 | Le classi sono effettivamente abilitate oggi su `ipagell.website`. | NON VERIFICABILE | Richiederebbe leggere l'ambiente/runtime Sites o provare la produzione. | `vite.config.ts`, `.openai/hosting.json` | Il repository non contiene il valore runtime Sites effettivo. |
| 39 | I ruoli effettivi sono owner, moderator, member. | VERIFICATO | Enum e check DB. | `lib/classes/permissions.ts`, `db/schema.ts` | Non esiste ruolo docente. |
| 40 | La matrice ruoli viene verificata server-side. | VERIFICATO | `requireClassPermission()` e condizioni SQL repository. | `lib/server/class-access.ts`, `lib/server/class-repository.ts`, `lib/server/class-event-repository.ts` | Non tutte le azioni usano lo stesso helper; alcune autorizzazioni sono incorporate nella query SQL. |
| 41 | Un proprietario può possedere al massimo 20 classi nel codice corrente. | VERIFICATO | COUNT `< 20` in INSERT. | `lib/server/class-repository.ts` | Non è il numero massimo di membership totali. |
| 42 | Creare una classe non crea automaticamente un invito. | VERIFICATO | `create()` inserisce solo classe+membro; inviti hanno metodo/API separata. | `lib/server/class-repository.ts`, `app/api/classes/[classId]/invites/route.ts` | Contraddice una frase narrativa di `docs/CLASSI.md`. |
| 43 | Gli inviti sono salvati come digest, con scadenza e limite usi. | VERIFICATO | `secret_hash`, `expires_at`, `max_uses`, `uses`; `tokenHash(normalized)`. | `db/schema.ts`, `lib/server/class-repository.ts` | Il codice in chiaro è disponibile solo al momento della creazione. |
| 44 | Esiste revoca del singolo invito ma non un endpoint di rotazione massiva. | VERIFICATO / DEDOTTO | DELETE per inviteId; nessuna route/metodo bulk trovato. | `app/api/classes/[classId]/invites/[inviteId]/route.ts`, `lib/server/class-repository.ts` | L'assenza del bulk è dedotta dal tree completo auditato. |
| 45 | Un ex membro necessita di un invito creato dopo la sua partenza per rientrare. | VERIFICATO | Condizione su `class_departures.departed_at >= invite.created_at`; trigger registra partenza. | `lib/server/class-repository.ts`, `drizzle/0004_glossy_stranger.sql` | Vale per il modello DB/migrazioni correnti. |
| 46 | Le attività condivise usano `class_events.subject` come stringa; non c'è `class_subjects`. | VERIFICATO | Colonna `subject` text; nessuna tabella `class_subjects` nello schema/migrazioni. | `db/schema.ts`, `drizzle/0003_melted_dark_phoenix.sql` | `docs/CLASSI.md` descrive `class_subjects` nel modello proposto, non implementato. |
| 47 | Qualsiasi membro della classe può creare un evento. | VERIFICATO | `create()` richiede solo EXISTS membership; permesso `content:create` disponibile anche a member. | `lib/server/class-event-repository.ts`, `lib/classes/permissions.ts` | Il feature flag deve essere attivo. |
| 48 | Eventi modificati/eliminati usano controllo revisione. | VERIFICATO | SQL `revision=?` e incremento. | `lib/server/class-event-repository.ts` | Il conflitto restituisce 409 e richiede refresh. |
| 49 | Owner/moderator possono moderare eventi altrui; un membro può modificare il proprio. | VERIFICATO | Predicato SQL `editor`. | `lib/server/class-event-repository.ts` | Non c'è workflow di approvazione contenuti. |
| 50 | Un account può avere al massimo 500 sottoscrizioni di classe e una classe massimo 500 eventi. | VERIFICATO | COUNT `<500` nelle query di insert. | `lib/server/class-event-repository.ts` | Sono limiti applicativi correnti, non benchmark di performance. |
| 51 | Le sottoscrizioni conservano uno snapshot dell'evento più campi personali separati. | VERIFICATO | Schema `class_event_subscriptions`. | `db/schema.ts`, `drizzle/0003_melted_dark_phoenix.sql` | Snapshot è JSON text nel DB. |
| 52 | Modifiche/cancellazioni di evento e perdita classe/membership preservano una copia scollegata tramite trigger. | VERIFICATO | Trigger update/delete/member/class. | `drizzle/0003_melted_dark_phoenix.sql` | Richiede che la migrazione sia effettivamente applicata nel DB usato: ciò non è verificabile per la produzione. |
| 53 | L'utente può scollegare volontariamente un'attività dalla classe. | VERIFICATO | `detach: true`, `event_id=NULL`, UI “Scollega dalla classe”. | `lib/classes/events.ts`, `lib/server/class-event-repository.ts`, `components/class-events-panel.tsx` | Dopo il detach non riceve più update della sorgente. |
| 54 | L'agenda di classe offline usa `localStorage`, non IndexedDB. | VERIFICATO | `classCacheKey` / `localStorage`; hook separato. | `hooks/use-class-agenda.ts`, `lib/classes/client.ts` | Il diario privato usa invece IndexedDB. |
| 55 | La cache agenda classe viene aggiornata ogni 30 secondi, al ritorno online e in foreground. | VERIFICATO | `setInterval(...,30000)`, listener online/visibility. | `hooks/use-class-agenda.ts` | Nessuna garanzia temporale quando tab sospesa dal browser. |
| 56 | Le mutazioni classi non hanno una outbox offline. | DEDOTTO | `ClassAgendaCoordinator.run()` effettua subito `classRequest()` e riconcilia con una lettura finale; nessuna queue/storage di scritture offline. | `hooks/use-class-agenda.ts`, `lib/classes/agenda-coordinator.ts` | È dedotto dall'implementazione ispezionata. |
| 57 | Non è presente realtime WebSocket/SSE per classi/eventi. | DEDOTTO | Aggiornamento tramite polling/fetch; nessun client/socket/SSE nel tree. | `hooks/use-class-agenda.ts`, `lib/classes/client.ts` | Un reverse proxy esterno non cambierebbe comunque il comportamento client versionato. |
| 58 | Il backup non include userId, session cookie o token. | VERIFICATO | `BackupPayload` e `createBackup()` contengono solo app/exportedAt/data/preferences. | `types/domain.ts`, `lib/account-storage.ts` | Non certifica file modificati manualmente fuori dall'app. |
| 59 | Le attività di classe nel backup diventano normali copie personali e non ricreano membership/inviti. | VERIFICATO | `backupWithClassAgenda()` converte in `AgendaItem`; schema backup non contiene dati classe. | `lib/classes/backup.ts`, `lib/account-storage.ts` | L'utente può poi importare il JSON come diario. |
| 60 | `document.modelContext` registra due tool opzionali: lettura riepilogo e creazione voto. | VERIFICATO | Due `register({...})` nel component. | `components/ipagell-app.tsx` | Funzionano solo se il browser espone `registerTool`. |
| 61 | La repository non implementa uno spazio studio AI/OCR/vector store. | VERIFICATO / DEDOTTO | Nessun modulo runtime/tabelle/API corrispondenti; solo documenti di progetto AI. | `docs/SPAZIO-STUDIO-AI.md`, `docs/SPAZIO-STUDIO-AI-CONSIDERAZIONI.md`, tree repository | L'assenza è dedotta dall'ispezione del tree completo e dalle ricerche nel codice. |
| 62 | Lo schema attivo contiene 10 tabelle. | VERIFICATO | Esportazioni `sqliteTable` in `db/schema.ts` e migrazioni. | `db/schema.ts` | Conta lo schema versionato, non eventuali tabelle extra già presenti in un DB remoto. |
| 63 | Esistono cinque migrazioni versionate `0000`–`0004`. | VERIFICATO | File SQL + journal idx 0–4. | `drizzle/`, `drizzle/meta/_journal.json` | Non prova che siano tutte applicate al DB di produzione. |
| 64 | `docs/MANUTENZIONE.md` è incompleto per il bootstrap schema HEAD perché cita solo `0000`–`0002`. | VERIFICATO | Confronto istruzioni con directory/journal. | `docs/MANUTENZIONE.md`, `drizzle/` | Non corregge automaticamente il documento. |
| 65 | `docs/ARCHITETTURA.md` è obsoleto quando tratta C2 come futuro. | VERIFICATO | Documento dice “Gli eventi C2 saranno”; codice contiene route/tabelle/UI C2/C3. | `docs/ARCHITETTURA.md`, `app/api/classes/[classId]/events/**`, `db/schema.ts` | Alcune altre sezioni del documento restano corrette. |
| 66 | `docs/API.md` non elenca tutte le API presenti. | VERIFICATO | Mancano class events/subscription/class agenda rispetto ai route file. | `docs/API.md`, `app/api/**` | La documentazione auth/diario può comunque essere valida in parte. |
| 67 | `docs/PRODOTTO.md` marca C02 Agenda condivisa come futura nonostante il codice la implementi. | VERIFICATO | Confronto roadmap con schema/API/UI. | `docs/PRODOTTO.md`, `docs/CLASSI.md`, `app/api/class-agenda/**`, `components/class-events-panel.tsx` | Il documento è anche una roadmap storica, quindi non ogni riga è intesa come snapshot runtime. |
| 68 | `SECURITY.md` è obsoleto nel dire che le classi non fanno parte dell'attuale superficie. | VERIFICATO per il codice; NON VERIFICABILE per il live | Class UI/API/schema esistono; feature gate production Sites ignoto. | `SECURITY.md`, `app/api/classes/**`, `components/classes-view.tsx`, `db/schema.ts` | Non si può affermare dalla repo che la feature sia effettivamente esposta sul sito live. |
| 69 | `docs/CLASSI.md` mescola entità implementate e proposte future. | VERIFICATO | “Modello dati proposto” contiene tabelle non presenti (`class_subjects`, announcements, materials, activity). | `docs/CLASSI.md`, `db/schema.ts` | Il documento segnala alcune fasi future, ma alcune frasi narrative possono sembrare comportamento già disponibile. |
| 70 | La configurazione `membersVisible` viene inizializzata ma non risulta applicata per nascondere membri. | DEDOTTO | `create()` scrive setting; `get()` restituisce sempre membri; nessuna lettura/update del setting trovata. | `lib/server/class-repository.ts`, `db/schema.ts` | Potrebbe essere preparazione per una funzione futura. |
| 71 | `db/schema 2.ts` non è lo schema attivo di Drizzle. | VERIFICATO | `drizzle.config.ts` punta a `./db/schema.ts`; il file “ 2” è vuoto. | `drizzle.config.ts`, `db/schema 2.ts` | Potrebbe essere aperto manualmente da un umano, ma non dal normale config path. |
| 72 | `drizzle.config 2.ts` è un duplicato non referenziato dal percorso standard. | DEDOTTO | Config equivalente; script/config convenzionale usa `drizzle.config.ts`; nessun riferimento trovato. | `drizzle.config.ts`, `drizzle.config 2.ts`, `package.json` | Non si può escludere un uso manuale esterno. |
| 73 | Il mock auth incluso nel plugin Sites vendorizzato è disattivato dalla config corrente. | VERIFICATO | `sites({ mockAuth: false })`. | `vite.config.ts`, `build/sites-vite-plugin.ts` | Il plugin contiene comunque il codice mock come ramo dormiente. |
| 74 | `.openai/hosting.json` configura D1 `DB` e nessun R2. | VERIFICATO | `d1: "DB"`, `r2: null`. | `.openai/hosting.json` | Project ID presente ma non riprodotto nell'audit. |
| 75 | Il codice applicativo corrente non usa R2. | VERIFICATO / DEDOTTO | Nessun flusso BUCKET/storage; hosting `r2:null`. | `.openai/hosting.json`, `cloudflare-env.d.ts`, codice `lib/**`, `app/**` | Il type `BUCKET?: R2Bucket` esiste, ma non rappresenta un binding attivo. |
| 76 | `npm run deploy:cloudflare` si rifiuta intenzionalmente di pubblicare senza `--sandbox`. | VERIFICATO | Check `process.argv.includes("--sandbox")`, exit 1. | `scripts/deploy-cloudflare.mjs`, `package.json` | Il nome script storico può essere fuorviante se letto senza lo script. |
| 77 | `npm run deploy:sandbox` applica migrazioni remote e poi esegue Wrangler deploy. | VERIFICATO | Sequenza build → dry-run → d1 migrations apply → deploy. | `scripts/deploy-cloudflare.mjs` | Non è stato eseguito durante questo audit. |
| 78 | La CI corrente non effettua deploy. | VERIFICATO | Workflow contiene solo install/release:prepare/summary. | `.github/workflows/check.yml` | Deploy manuali esterni a GitHub non sono osservabili. |
| 79 | Il commit auditato ha un run CI riuscito che ha eseguito lint, TypeScript, 13 unit test, docs check e build. | VERIFICATO | GitHub Actions run `35318742358`, job `105516175689`, checkout dello SHA esatto, conclusion success. | `.github/workflows/check.yml`, `tests/domain.test.ts`, log GitHub Actions | È evidenza specifica del commit, non del filesystem modificato dopo il commit. |
| 80 | I 13 unit test del run HEAD sono passati tutti. | VERIFICATO | TAP: 13 tests, 13 pass, 0 fail. | `tests/domain.test.ts`, log GitHub Actions del commit | Copertura limitata ai test presenti. |
| 81 | `tests/api-smoke.mjs` è passato sul commit HEAD. | NON VERIFICABILE | Lo script esiste ma `release:prepare`/workflow non lo esegue. | `tests/api-smoke.mjs`, `package.json`, `.github/workflows/check.yml` | Eventuali esecuzioni storiche/manuali non certificano automaticamente questo HEAD. |
| 82 | `npm audit` è passato sul commit HEAD. | NON VERIFICABILE | Non fa parte della CI; `.npmrc` ha `audit=false`. | `.npmrc`, `.github/workflows/check.yml` | Potrebbe essere stato eseguito manualmente, ma non c'è evidenza HEAD usata dall'audit. |
| 83 | Il build HEAD ha completato con un warning per chunk >500 kB. | VERIFICATO | Log Vite del run CI. | log GitHub Actions del commit | Il warning non equivale a failure. |
| 84 | `docs:check` verifica correttezza del contenuto dei documenti. | VERIFICATO come falso | Il log dichiara esplicitamente che esclude correttezza contenuto; lo script controlla link locali. | `scripts/check-docs.mjs`, log GitHub Actions | Un docs check verde non garantisce che la documentazione descriva il codice corrente. |
| 85 | `ipagell.website` sta servendo questo esatto commit. | NON VERIFICABILE | Richiederebbe interrogare il sito/deployment e confrontare l'artefatto. | `docs/DEPLOYMENT.md`, `AGENTS.md`, metadata app | La repository esprime l'intenzione di produzione, non l'identità del deploy live. |
| 86 | Il D1 di produzione ha applicate tutte le migrazioni 0000–0004. | NON VERIFICABILE | Repository contiene le migrazioni ma non lo stato remoto della tabella migrations/schema. | `drizzle/**`, `.openai/hosting.json`, `wrangler.jsonc` | Serve accesso/query al DB dell'ambiente specifico. |
| 87 | Il database del Worker indipendente è effettivamente separato dal database Sites. | NON VERIFICABILE dalla sola repo | I file descrivono due percorsi/configurazioni, ma l'identità dei binding remoti richiede interrogare le piattaforme. | `wrangler.jsonc`, `.openai/hosting.json`, `docs/DEPLOYMENT.md` | Non si deve certificare la separazione dei dati solo dal nome/config locale. |
| 88 | DNS, TLS e alias `www`/`chatgpt.site` sono configurati come documentato. | NON VERIFICABILE | Sono esterni al tree. | `next.config.ts`, `app/layout.tsx`, `docs/DEPLOYMENT.md` | Il codice contiene redirect per host, non prova la configurazione DNS/piattaforma. |
| 89 | La PWA è installabile e funziona correttamente su ogni browser supportato. | NON VERIFICABILE | Manifest/SW/icon asset esistono e builda; serve prova runtime/device. | `public/manifest.webmanifest`, `public/sw.js`, `app/layout.tsx` | Compatibilità/permission lifecycle varia per browser. |
| 90 | L'app è sicura in senso generale. | NON VERIFICABILE | Il codice contiene controlli concreti e unit test, ma manca una verifica completa indipendente. | `lib/server/**`, `tests/domain.test.ts` | Servirebbero threat model aggiornato, test API/E2E, dependency audit, penetration test, runtime review. |

## Contraddizioni documentali da considerare prioritarie

Questa matrice identifica come particolarmente rilevanti perché possono far descrivere come “future” funzioni già nel codice, o viceversa:

1. `docs/ARCHITETTURA.md`: C2/eventi ancora presentati come futuro.
2. `docs/API.md`: contratto API incompleto rispetto a eventi e agenda di classe.
3. `docs/PRODOTTO.md`: C02 Agenda condivisa ancora in roadmap benché implementata.
4. `SECURITY.md`: classi definite future rispetto al codice presente; l'esposizione live resta però non verificabile.
5. `docs/MANUTENZIONE.md`: bootstrap migrazioni fermo a `0002` mentre HEAD contiene `0003` e `0004`.
6. `docs/CLASSI.md`: distingue C1/C2/C3 implementati, ma include anche tabelle e comportamenti solo proposti (`class_subjects`, annunci, materiali, activity log, visibilità membri, rotazione bulk inviti).
7. Copy API password: schema 12–128, messaggi recover/security 15–128.

## Limiti dell'audit

La matrice certifica soltanto ciò che può essere ancorato al commit e, per CI, al run GitHub associato a quello SHA. Non certifica:

- deploy live e identità del codice servito;
- configurazione effettiva di Sites/Cloudflare fuori dal repository;
- variabili/segreti runtime non versionati;
- schema e dati reali di D1 remoto;
- correttezza di DNS/TLS/alias;
- disponibilità effettiva di `document.modelContext` nei browser degli utenti;
- comportamento PWA/notifiche su tutti i device;
- performance, resilienza o sicurezza sotto carico reale;
- esito di test non eseguiti dal run CI HEAD (`test:api`, audit dipendenze, E2E browser, accessibilità completa, load/penetration test);
- processi manuali esterni o servizi non rappresentati nel repository.

Per le proprietà che dipendono da uno di questi fattori lo stato è deliberatamente **NON VERIFICABILE**, anziché trasformare configurazione/intenzione in un'affermazione sul runtime reale.
