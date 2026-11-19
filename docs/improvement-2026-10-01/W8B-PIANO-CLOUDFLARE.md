# W8-B — piano di passaggio auth sul Worker Cloudflare

17 novembre 2026. Bozza operativa. Sostituisce per la produzione le parti di [W8-A release](W8A-RELEASE-PREPARATION.md) e del [runbook](../../operations/w8a/RUNBOOK.md) che presuppongono Sites. Base: [audit account](AUTH-PRODUCT-AUDIT.md), [deploy](../DEPLOYMENT.md).

Nessun comando remoto di modifica è stato eseguito per redigere questo piano. Le uniche letture su produzione sono conteggi di sola lettura (vedi §1).

## 1. Stato verificato

- **Produzione:** Worker `ipagell`, D1 `ipagell-live` (binding `DB`, UE). Migrazioni del repo `drizzle/` 0000–0006. Lettura di sola lettura del 17 novembre: 1 account, 1 diario.
- **Nel repo (fino al 17 novembre):** 0007 era in `operations/w8a/deferred-expansion/`, fuori da `drizzle/`. Sul branch `auth/w8b-cloudflare` è ora in `drizzle/` con il bootstrap 0008 (vedi Fase A). Nessun codice Google/Apple/email e nessuna dipendenza OAuth.
- **Deploy:** `scripts/deploy-cloudflare.mjs` esegue `wrangler d1 migrations apply DB --remote` da `drizzle/` prima di `wrangler deploy`. **Qualsiasi file messo in `drizzle/` va in produzione al deploy successivo.**
- **Trigger di fence:** la 0007 crea trigger `auth_fence_*` su `accounts`, `sessions`, le tabelle auth e DELETE di `diaries` e `class_invites`. Senza riga in `auth_schema_state` con `(7,'legacy')` o `(8,'credentials')`, questi trigger bloccano le scritture con `AUTH_WRITES_PAUSED`. La 0007 da sola in produzione quindi **ferma l'app**.
- **Rilevazione legacy:** `AuthRepository` riconosce `legacy-unexpanded` solo con esattamente 6 colonne in `accounts`. Dopo la 0007 legge `auth_schema_state`: senza riga fallisce chiuso, con `(7,'legacy')` usa la modalità `legacy`. Il codice in produzione supporta quindi già lo schema 0007 + bootstrap (verificato dal test D1 «W8-B Cloudflare»).
- **Conseguenza:** 0007 e bootstrap devono essere applicati nella stessa esecuzione delle migrazioni. Non serve un Worker nuovo per tenere l'app funzionante dopo la migrazione.

## 2. Principi

1. Nessuna migrazione in `drizzle/` finché non è pronto il Worker che la usa e il bootstrap è testato.
2. Nessun dato reale in staging e nessun account sintetico in produzione senza autorizzazione esplicita del proprietario.
3. I dati degli utenti del vecchio Sites arrivano solo tramite backup JSON dell'app. Non c'è backfill da Sites.
4. Le credenziali restano nei secret Cloudflare (`wrangler secret put`), mai in repo, `wrangler.jsonc` o log.

## 3. Fasi

### Fase 0 — decisioni del proprietario (prima di tutto)

- Creare uno **staging separato** (Worker `ipagell-staging` e D1 `ipagell-staging`, via ambiente Wrangler). Serve per provare la sequenza senza toccare `ipagell-live`. Richiede approvazione: crea risorse nel suo account.
- Decidere cosa fare dell'account e del diario già presenti in produzione (probabilmente test). Serve approvazione prima di cancellarli.
- Confermare l'ordine: **Google prima, email dopo**, Apple in W9.

### Fase A — preparazione locale (nessun effetto su produzione)

**Stato 17 novembre 2026 — completata sul branch `auth/w8b-cloudflare`, non committata e non pubblicata:**

- `drizzle/0007_auth_compatibility.sql` e `drizzle/meta/0007_snapshot.json` spostati da `operations/w8a/deferred-expansion/`, senza modifiche al contenuto.
- `drizzle/0008_auth_bootstrap_legacy.sql`: solo `INSERT INTO auth_schema_state … VALUES(1,7,'legacy')`, non idempotente per scelta. Journal e snapshot 0008 aggiunti; `drizzle-kit generate` non rileva differenze rispetto a `db/schema.ts`, che ora include le otto tabelle auth.
- `AuthRepository` **non modificato**: `legacy-unexpanded` resta, così il Worker può tornare a funzionare su uno schema 0000–0006 (rollback o ambienti non migrati). La semplificazione prevista in A3 è rinviata al cutover `credentials`.
- Test: `tests/auth-operations.test.ts` ora verifica che la 0007 sia solo schema, che la 0008 contenga solo il bootstrap e che journal e file coincidano (il blocco hash su Sites 39 è rimosso). Nuovo test D1 «W8-B Cloudflare» su dati esistenti.
- Risultati con Node 24: `npm test` 148/148, `test:auth-d1` 19/19, `test:auth-restore` passato, `tsc` pulito. `wrangler d1 migrations apply --local` su D1 vuoto: 0000–0008 applicate, stato `7/legacy`, 27 trigger. `test:api` contro il Worker di staging servito in locale su quel D1: 146 controlli passati, account sintetici rimossi.
- La numerazione 0008 è ora il bootstrap: la futura contrazione `credentials` userà la prima migrazione libera (0009 o successiva).

A1. Portare 0007 in `drizzle/` solo in un branch di lavoro, come migrazione Wrangler con numerazione corrente. La numerazione 0007/0008 della W7 è una prenotazione: ricontrollarla contro `drizzle/meta/_journal.json`.

A2. Aggiungere una migrazione di bootstrap separata, con `INSERT INTO auth_schema_state(id,schema_version,write_mode) VALUES(1,7,'legacy')`. Su un D1 nuovo non c'è stato legacy da preservare, quindi il bootstrap può essere una migrazione normale invece dell'operazione manuale di `initialize-legacy.sql`. Questo va confermato, perché serve un dato che non è più presente solo sul vecchio Sites.

A3. Semplificare `AuthRepository`: rimuovere `legacy-unexpanded` per Cloudflare, perché la pausa per schema non espanso non serve più. Verificare che lo stato assente o ignoto continui a fallire chiuso.

A4. Provare localmente con `npm run test:auth-d1` e `npm run test:auth-restore`, adattati al D1 Cloudflare. Riprovare la sequenza su un D1 locale con 0000–0006 e dati sintetici.

A5. Verificare `npm run check`, `npm test`, `npm run test:api` sul branch.

### Fase B — verifica del correttivo di sicurezza già in HEAD

Le correzioni W8-A (commit `891ca63` e successivi, incluso `51f80bc`) sono in `sync/checkout-20261116`. Prima di ripubblicarle, confrontare la versione del Worker in produzione con HEAD. Se sono già live, saltare; altrimenti rilasciare con autorizzazione esplicita. Non serve nessuna migrazione per questo passo.

### Fase C — staging

C1. **Stato 17 novembre 2026:** D1 `ipagell-staging` (id `64346ec7-f2aa-4926-8a98-c0f2f487634e`, UE) creato e migrato 0000–0006 con `wrangler d1 migrations apply DB --remote --env staging`. In `wrangler.jsonc` è presente `env.staging` con `routes: []`: senza questa riga Wrangler riassegnerebbe `ipagell.website` al Worker di staging. **Worker di staging pubblicato** (17 novembre 2026, versione `4a96c2ae-9003-44e0-a09a-5d8d8cf38477`, URL `https://ipagell-staging.ahmedbasto59.workers.dev`), con binding `DB` su `ipagell-staging`. Procedura: `CLOUDFLARE_ENV=staging IPAGELL_DEPLOY_TARGET=cloudflare npm run build:cloudflare`, poi `npx wrangler deploy -c dist/server/wrangler.json` (il config generato, non `wrangler.jsonc` dalla radice). Serve Node 22 o 24 (`engines`); il Node di sistema 23 non è supportato. Smoke test non autenticato: `/` e `/app` 200, `/api/account` 401. Ripubblicato il 17 novembre con `invocation_logs: false` (versione `8830e81e-397d-4bf5-a5c9-0926d637bcee`). Baseline locale con Node 24: `npm test` 147/147, `npm run test:auth-d1` 15/15. Non ancora fatto: sequenza 0007 + bootstrap.

**Problema noto di `deploy:cloudflare`:** `scripts/deploy-cloudflare.mjs` esegue `wrangler deploy` dalla radice con `wrangler.jsonc`, la cui `main` è l'entry del binding locale (`vinext/server/fetch-handler`). Il dry run fallisce, quindi la produzione non si pubblica con lo script attuale. Va corretto prima del prossimo rilascio, usando `dist/server/wrangler.json`.

**Stato 17 novembre 2026, sera:** 0007 e 0008 applicate al D1 remoto `ipagell-staging` con `wrangler d1 migrations apply DB --remote --env staging`. Stato `7/legacy`, 27 trigger `auth_fence_*`, 23 tabelle, 0 account. Worker di staging ripubblicato dal branch `auth/w8b-cloudflare` (versione `1030ed4a-3b68-4d5e-bb2c-d9d734fac88e`). Smoke test: `/` e `/app` 200, `/api/account` 401, login con credenziali inesistenti 401 `AUTH_INVALID_CREDENTIALS` (la modalità auth viene risolta, nessun blocco). Produzione: 0007 e 0008 ancora in attesa, homepage 200. Non ancora fatte: le prove con account sintetici di C2.

**Prove con account sintetici, 17 novembre 2026 — bloccante trovato.** Una esecuzione completa è passata (21 controlli: registrazione, duplicato 409, primo diario, logout, login, cambio password con revoca sessioni, recupero con rotazione codice, cancellazione). Altre tre esecuzioni sono fallite con 503 intermittenti. Dai log (`wrangler tail`):

- l'hashing scrypt (N=16384, r=8, p=5) usa circa 140–170 ms di CPU per richiesta; una richiesta `/api/auth/security` è stata interrotta con `exceededCpu` («Worker exceeded CPU time limit»);
- dopo l'interruzione, le richieste successive nello stesso isolate falliscono subito (5–7 ms CPU) con 503 generico: il flag `hashing` di `lib/server/password.ts` resta `true` perché il `finally` non viene eseguito quando il Worker è fermato, e `HashBusyError` non è un `HttpError`.

Il problema non dipende da 0007/0008: lo stesso codice è in produzione. Il limite di CPU dipende dal piano Workers dell'account (da verificare nella dashboard). Gli account sintetici rimasti sono stati rimossi dal D1 di staging; anche `auth_limits` è stato svuotato. Il D1 di staging resta `7/legacy` senza account.

**Correzione del codice (17 novembre 2026, branch `auth/w8b-cloudflare`):** `lib/server/password.ts` usa una richiesta di slot con scadenza (`HASH_CLAIM_STALE_MS` = 10 s) e un rilascio che libera solo la propria richiesta. `HashBusyError` è ora un `HttpError` 503 con codice `AUTH_BUSY`; `AUTH_BUSY` e `AUTH_UNAVAILABLE` hanno messaggi nelle quattro lingue. Test: `tests/password-slot.test.ts`; `npm run check` 152/152, `test:auth-d1` 19/19. Staging ripubblicato (versione `1dcd9235-a687-47c6-b857-a84799c04acf`).

**Esito dopo la correzione:** un isolate interrotto ora resta occupato al massimo 10 s, con un messaggio chiaro invece di un 503 generico permanente. Il limite CPU però resta: nei log l'hashing usa 180–385 ms di CPU per richiesta, e alcune richieste vengono ancora interrotte (pagina di errore Cloudflare 503). Su quattro esecuzioni nessuna è arrivata in fondo. Account sintetici e `auth_limits` di staging di nuovo ripuliti.

**Decisione aperta del proprietario:** passare a un piano Workers con limite CPU per richiesta adeguato (la causa di fondo), oppure ridurre il costo di scrypt (riduce la protezione delle password, da valutare con cautela). Finché non si decide, il rilascio in produzione di W8-B non migliora né peggiora questo problema, che è già presente.

C2. Deploy del Worker su staging e prove:
- registrazione, login, cambio password, recupero, cancellazione con account sintetici;
- verifica che le scritture siano aperte dopo il bootstrap e bloccate prima (fence);
- import di un backup JSON di prova.

C3. Usare un account sintetico creato e cancellato da me solo dopo l'autorizzazione.

### Fase D — rilascio produzione (una sola finestra)

1. **Backup:** esportare `ipagell-live` con Wrangler (`wrangler d1 export`, da verificare sul proprio account) in una posizione fuori dal repo e protetta. Il dump contiene dati personali: non va in `docs/`, `scratchpad` o Git. Registrare il bookmark di Time Travel D1 se disponibile.
2. Verificare che nessun utente stia scrivendo; avvisare prima se serve.
3. `npm run release:prepare`, poi `npm run deploy:cloudflare`. Lo script applica le migrazioni (0007 + bootstrap) e poi il Worker. Le scritture restano bloccate solo tra la 0007 e la 0008 della stessa esecuzione; se la 0008 fallisce, l'app resta in pausa (fallire chiuso è voluto) finché lo stato non viene inizializzato.
4. Smoke test su produzione senza creare account: homepage, `/app`, `/api/auth/*` con richieste negative, sitemap, service worker.
5. Rollback: il Worker attuale funziona anche dopo 0007 + 0008 (modalità `legacy`), quindi un rollback del solo codice è possibile. Le migrazioni non si annullano: tornare allo schema 0000–0006 richiede il restore del dump. Ogni rollback va deciso per iscritto dal proprietario.

**Eseguita il 19 novembre 2026.** Backup `wrangler d1 export` di `ipagell-live` fuori dal repo, in una cartella con permessi solo per il proprietario (non in Git né in `docs/`), ricaricato in SQLite: 1 account, 1 diario, 17 tabelle. Segnalibro Time Travel prima delle migrazioni: `00000050-00000000-00005128-37705c29cef7e7f68941354c81761f8a`. `npm run deploy:cloudflare` dal commit `9f94d51` ha applicato 0007+0008 e pubblicato la versione `8e2c7f3d-2bea-423b-b01f-b6334a8b13cb`. Dopo: stato `7/legacy`, 27 trigger fence, 1 account e 1 diario intatti, nessuna migrazione in sospeso. Smoke test: `/`, `/de`, `/app`, `/legale`, sitemap, robots e `sw.js` 200; `www` 308 verso l'apex; `/api/account` senza sessione 401; login non valido 400 con codice; Origin estraneo 403; Google 404 e `providers` `{"google":false}` finché mancano i secret di produzione; callback senza stato 303 verso `/app?accesso=google-error`. Il rilascio include anche il ridisegno UI e la conferma età.

### Fase E — Google (W8)

Gate esterni, da fornire dal proprietario:
- progetto Google Cloud, client OAuth web per staging e produzione;
- redirect esatto `https://ipagell.website/api/auth/oauth/google/callback` e quello di staging;
- consent screen, privacy e supporto reali, dominio verificato (DNS ora su Cloudflare).

Lavoro di codice dopo i gate: tabelle `auth_transactions` e `auth_grants`, coordinatore epoch browser, adapter `oauth4webapi` con verifica di `iss`, `aud`, `nonce`, `state` e PKCE, test di replay e mix-up, rifiuto del linking implicito. Versione esatta delle librerie da fissare e verificare in audit.

**Stato al 18 novembre 2026 — codice pronto, gate esterni aperti.** Decisioni del proprietario: (1) gli account Google usano il marcatore esplicito `none$google` in `password_hash`/`recovery_hash` invece di ricostruire `accounts` (la ricostruzione su D1 cancellerebbe a cascata i dati delle 17 tabelle figlie); (2) il primo rilascio crea solo account nuovi o accede a quelli già creati con Google, senza collegamento agli account con nome utente, che richiederebbe scrypt e quindi il piano Workers Paid.

Implementato: `lib/server/google-oidc.ts` (protocollo), `lib/server/google-auth.ts` (cookie di binding, config), route `providers`, `oauth/google/start` e `oauth/google/callback`, metodi `createOAuthTransaction`, `claimOAuthTransaction`, `finishGoogleLogin` in `AuthRepository`, pulsante in `account-gate.tsx`, eliminazione account con sessione recente in `security`. Libreria `jose` 6.2.15 al posto di `oauth4webapi`: un solo adapter, scambio del code con `fetch` diretto. Scope solo `openid`.

Prove: `tests/google-oidc.test.ts` (config, PKCE, firma, alg none/HS256, issuer, audience, `azp`, nonce, scadenza, kid sconosciuto, errori del token endpoint), 10 casi D1 in `tests/auth-d1.integration.ts` (vincitore unico, replay dello state, browser diverso, scadenza, limite 3, creazione atomica, riaccesso allo stesso account, collisione handle, identità disabilitata, cancellazione a cascata). `npm run check` 158/158, `test:auth-d1` 29/29, `test:api` 146/146 sul server locale. Pulsante verificato nel browser locale con configurazione fittizia. **Non provato con Google reale:** serve il client OAuth.

Scoperti e non coperti in questo rilascio: coordinatore epoch del browser (una callback arrivata dopo un logout nello stesso browser accede comunque all'account Google appena autorizzato), riautenticazione Google con `auth_time`, collegamento e scollegamento, informativa privacy (va aggiunto il trattamento dell'identificativo Google `sub`).

**Staging, 18 novembre 2026 — prova reale riuscita.** Progetto Google Cloud `ipagell`, client web «iPagell web» con i tre redirect (produzione, staging, localhost), app in stato «Test». Secret `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET` inseriti dal proprietario sullo staging. Worker staging ripubblicato; `/api/auth/providers` → `{"google":true}`. Il proprietario ha fatto accesso con Google: sul D1 staging risultano 1 identità Google attiva, 1 account con marcatore, 1 transazione consumata e 0 fallite. Da fare prima della produzione: pagina Branding completa (home, privacy, dominio autorizzato) per poter pubblicare l'app oltre gli utenti di prova.

Prossimi passi (storici): client Google (vedi [DEPLOYMENT.md](../DEPLOYMENT.md#accesso-con-google-configurazione)), secret su staging, prova reale con un account Google di test, poi Fase D in produzione e secret di produzione.

### Fase F — email (W8)

- Scegliere il servizio transazionale. Valutare Cloudflare Email Sending, dato che la zona è su Cloudflare; verificare disponibilità e limiti prima di decidere.
- Sender verificato, SPF, DKIM, DMARC su zona Cloudflare, gestione bounce, indirizzo di supporto reale.
- Token monouso con digest, TTL, POST di conferma (non consumo con GET, per gli scanner email).

### Fase G — Apple (W9)

Rinviata. Richiede app App Store esistente con Sign in with Apple, Services ID, chiave `.p8`, relay Hide My Email. Non iniziare prima dei gate.

## 4. Rischi

| Rischio | Mitigazione |
|---|---|
| 0007 in `drizzle/` applicata in produzione senza Worker | Non committare in `drizzle/` finché Fase C non passa |
| Pausa totale delle scritture dopo migrazione | Bootstrap nella stessa finestra; smoke test subito dopo |
| Dump con dati personali esposto | Posizione fuori repo, permessi restrittivi, nessuna copia in docs o scratchpad |
| Backfill da Sites impossibile | Utenti trasferiscono con backup JSON (procedura già documentata) |
| Secret nel repo o nei log | Solo `wrangler secret put`; redazione dei log, come da W8-A |

## 5. Documenti da aggiornare nello stesso task

- [docs/DEPLOYMENT.md](../DEPLOYMENT.md): riferimenti a Sites nelle sezioni W8-A.
- [operations/w8a/RUNBOOK.md](../../operations/w8a/RUNBOOK.md): procedura Sites da marcare come superata.
- [W8A-RELEASE-PREPARATION.md](W8A-RELEASE-PREPARATION.md): il piano corrente va riferito a questo documento.
- [docs/VERIFICATION-MATRIX.md](../VERIFICATION-MATRIX.md): nuove prove di staging e di produzione.

## 6. Decisioni aperte

1. Staging separato: sì o no?
2. Cosa fare dell'account e del diario già presenti in produzione?
3. Ordine Google → email confermato?
4. Email: provider da scegliere (Cloudflare Email Sending o altro).
