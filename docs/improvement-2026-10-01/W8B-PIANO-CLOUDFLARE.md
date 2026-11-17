# W8-B — piano di passaggio auth sul Worker Cloudflare

17 novembre 2026. Bozza operativa. Sostituisce per la produzione le parti di [W8-A release](W8A-RELEASE-PREPARATION.md) e del [runbook](../../operations/w8a/RUNBOOK.md) che presuppongono Sites. Base: [audit account](AUTH-PRODUCT-AUDIT.md), [deploy](../DEPLOYMENT.md).

Nessun comando remoto di modifica è stato eseguito per redigere questo piano. Le uniche letture su produzione sono conteggi di sola lettura (vedi §1).

## 1. Stato verificato

- **Produzione:** Worker `ipagell`, D1 `ipagell-live` (binding `DB`, UE). Migrazioni del repo `drizzle/` 0000–0006. Lettura di sola lettura del 17 novembre: 1 account, 1 diario.
- **Nel repo:** 0007 è in `operations/w8a/deferred-expansion/`, fuori da `drizzle/`. Nessun codice Google/Apple/email e nessuna dipendenza OAuth.
- **Deploy:** `scripts/deploy-cloudflare.mjs` esegue `wrangler d1 migrations apply DB --remote` da `drizzle/` prima di `wrangler deploy`. **Qualsiasi file messo in `drizzle/` va in produzione al deploy successivo.**
- **Trigger di fence:** la 0007 crea trigger `auth_fence_*` su `accounts`, `sessions`, le tabelle auth e DELETE di `diaries` e `class_invites`. Senza riga in `auth_schema_state` con `(7,'legacy')` o `(8,'credentials')`, questi trigger bloccano le scritture con `AUTH_WRITES_PAUSED`. La 0007 da sola in produzione quindi **ferma l'app**.
- **Rilevazione legacy:** `AuthRepository` riconosce `legacy-unexpanded` solo con esattamente 6 colonne in `accounts`. La 0007 aggiunge `auth_operation_id`, quindi il Worker attuale fallisce chiuso dopo la 0007.
- **Conseguenza:** 0007, bootstrap dello stato e Worker nuovo devono arrivare insieme, oppure la produzione va in pausa.

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

A1. Portare 0007 in `drizzle/` solo in un branch di lavoro, come migrazione Wrangler con numerazione corrente. La numerazione 0007/0008 della W7 è una prenotazione: ricontrollarla contro `drizzle/meta/_journal.json`.

A2. Aggiungere una migrazione di bootstrap separata, con `INSERT INTO auth_schema_state(id,schema_version,write_mode) VALUES(1,7,'legacy')`. Su un D1 nuovo non c'è stato legacy da preservare, quindi il bootstrap può essere una migrazione normale invece dell'operazione manuale di `initialize-legacy.sql`. Questo va confermato, perché serve un dato che non è più presente solo sul vecchio Sites.

A3. Semplificare `AuthRepository`: rimuovere `legacy-unexpanded` per Cloudflare, perché la pausa per schema non espanso non serve più. Verificare che lo stato assente o ignoto continui a fallire chiuso.

A4. Provare localmente con `npm run test:auth-d1` e `npm run test:auth-restore`, adattati al D1 Cloudflare. Riprovare la sequenza su un D1 locale con 0000–0006 e dati sintetici.

A5. Verificare `npm run check`, `npm test`, `npm run test:api` sul branch.

### Fase B — verifica del correttivo di sicurezza già in HEAD

Le correzioni W8-A (commit `891ca63` e successivi, incluso `51f80bc`) sono in `sync/checkout-20261116`. Prima di ripubblicarle, confrontare la versione del Worker in produzione con HEAD. Se sono già live, saltare; altrimenti rilasciare con autorizzazione esplicita. Non serve nessuna migrazione per questo passo.

### Fase C — staging

C1. **Stato 17 novembre 2026:** D1 `ipagell-staging` (id `64346ec7-f2aa-4926-8a98-c0f2f487634e`, UE) creato e migrato 0000–0006 con `wrangler d1 migrations apply DB --remote --env staging`. In `wrangler.jsonc` è presente `env.staging` con `routes: []`: senza questa riga Wrangler riassegnerebbe `ipagell.website` al Worker di staging. **Worker di staging pubblicato** (17 novembre 2026, versione `4a96c2ae-9003-44e0-a09a-5d8d8cf38477`, URL `https://ipagell-staging.ahmedbasto59.workers.dev`), con binding `DB` su `ipagell-staging`. Procedura: `CLOUDFLARE_ENV=staging IPAGELL_DEPLOY_TARGET=cloudflare npm run build:cloudflare`, poi `npx wrangler deploy -c dist/server/wrangler.json` (il config generato, non `wrangler.jsonc` dalla radice). Serve Node 22 o 24 (`engines`); il Node di sistema 23 non è supportato. Smoke test non autenticato: `/` e `/app` 200, `/api/account` 401. Non ancora fatto: sequenza 0007 + bootstrap.

**Problema noto di `deploy:cloudflare`:** `scripts/deploy-cloudflare.mjs` esegue `wrangler deploy` dalla radice con `wrangler.jsonc`, la cui `main` è l'entry del binding locale (`vinext/server/fetch-handler`). Il dry run fallisce, quindi la produzione non si pubblica con lo script attuale. Va corretto prima del prossimo rilascio, usando `dist/server/wrangler.json`.

C2. Deploy del Worker su staging e prove:
- registrazione, login, cambio password, recupero, cancellazione con account sintetici;
- verifica che le scritture siano aperte dopo il bootstrap e bloccate prima (fence);
- import di un backup JSON di prova.

C3. Usare un account sintetico creato e cancellato da me solo dopo l'autorizzazione.

### Fase D — rilascio produzione (una sola finestra)

1. **Backup:** esportare `ipagell-live` con Wrangler (`wrangler d1 export`, da verificare sul proprio account) in una posizione fuori dal repo e protetta. Il dump contiene dati personali: non va in `docs/`, `scratchpad` o Git. Registrare il bookmark di Time Travel D1 se disponibile.
2. Verificare che nessun utente stia scrivendo; avvisare prima se serve.
3. `npm run release:prepare`, poi `npm run deploy:cloudflare`. Lo script applica le migrazioni (0007 + bootstrap) e poi il Worker. Tra i due passi la produzione resta in pausa per fence: fallire chiuso è voluto.
4. Smoke test su produzione senza creare account: homepage, `/app`, `/api/auth/*` con richieste negative, sitemap, service worker.
5. Rollback: il Worker precedente **non funziona** con 0007 già applicata (vedi §1). Il rollback è il Worker nuovo con restore del dump, non il ritorno al vecchio Worker. Ogni rollback va deciso per iscritto dal proprietario.

### Fase E — Google (W8)

Gate esterni, da fornire dal proprietario:
- progetto Google Cloud, client OAuth web per staging e produzione;
- redirect esatto `https://ipagell.website/api/auth/oauth/google/callback` e quello di staging;
- consent screen, privacy e supporto reali, dominio verificato (DNS ora su Cloudflare).

Lavoro di codice dopo i gate: tabelle `auth_transactions` e `auth_grants`, coordinatore epoch browser, adapter `oauth4webapi` con verifica di `iss`, `aud`, `nonce`, `state` e PKCE, test di replay e mix-up, rifiuto del linking implicito. Versione esatta delle librerie da fissare e verificare in audit.

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
