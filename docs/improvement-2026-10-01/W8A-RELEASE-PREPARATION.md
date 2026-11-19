# W8-A — candidato isolato e preparazione al rilascio

17 ottobre 2026. [Implementazione e QA iniziale](AUTH-COMPATIBILITY-W8A.md) · [Distribuzione](../DEPLOYMENT.md) · [Workflow](WORKFLOW-MODELS.md).

## Piano corrente — security senza migrazioni

La ripresa successiva ad `a832119` separa il rilascio delle correzioni di sicurezza dall’espansione del DB. `db/schema.ts`, journal e SQL attivi 0000–0006 coincidono con Sites 39: **15 tabelle, 7 migrazioni, nessuna nuova migrazione**. 0007 e snapshot erano preservati byte per byte in `operations/w8a/deferred-expansion/`, fuori dal runner Sites. Nessuna 0008, cutover o provider. Dal 17 novembre 2026 sono in `drizzle/` sul branch `auth/w8b-cloudflare`, con il bootstrap 0008: [piano W8-B](W8B-PIANO-CLOUDFLARE.md).

`AuthRepository` riconosce lo schema non espanso tramite assenza degli otto oggetti auth e forma esatta delle sei colonne di accounts; le scritture finali, inclusa emissione sessione, ripetono la guardia per rifiutare un’espansione concorrente. Non è un fallback da uno stato espanso danneggiato: oggetti residui, colonna auth_operation_id, singleton assente/ignoto/paused restano chiusi. Le correzioni CAS, sessione, cancellazione, cleanup client e redazione log restano nel rilascio.

Questo piano elimina la necessità del bootstrap per il candidato corrente. Non dichiara disponibile il restore amministrativo Sites: il gate resta sulla futura espansione/contrazione. La prova gestita autorizzata riguarda HTTPS, account sintetici e rollback del Worker su DB invariato; non sostituisce né certifica backup o restore DB. I risultati effettivi della prova sono aggiunti sotto; le sezioni precedenti al cambio di piano restano storiche.

### Risultato effettivo della nuova prova gestita

**Candidato security verificato su Sites privato, produzione invariata.** Progetto nuovo `appgprj_6ad35e658c4c819182752ed1350b2521`, URL https://ipagell-w8a-private-20261017.produc-ch.chatgpt.site, solo proprietario (custom, un utente esplicito, nessun gruppo), nessun dominio personalizzato. Binding DB provisionato da Sites per il nuovo progetto; prima della fixture accounts vuota. L’ID fisico del D1 non è esposto dal connettore, quindi non è riportato come verificato direttamente.

Sequenza gestita con strumenti Sites ufficiali:

1. Versione privata **1**, sorgente `ccdd5c9d48e6f298dcbefb155924f60aa8c4db54`: codice Sites 39 con sola identità del nuovo Site; deployment `appgdep_6ad35ecf9d548191964b217f3699ef6a` succeeded. Registrazione/account/diario/nota sintetici attraverso le normali API HTTPS.
2. Versione privata **2**, sorgente `ee26a5c39da9daef43476bc93aa2741d28af4980`: candidato security senza nuove migrazioni; deployment `appgdep_6ad35fba453c8191becca1e959fcb9f6` succeeded. Login con account preesistente, cambio password e recupero con revoca delle vecchie sessioni passati. Cookie `__Host-`, Secure, HttpOnly, SameSite=Lax. ID, diario e nota preservati.
3. Rollback alla **1**, deployment `appgdep_6ad360025e408191aea123205d170333` succeeded: login con le credenziali aggiornate dalla 2, stesso ID, diario canonico e nota. Nessun ripristino o rewind del database.
4. Ritorno alla **2**, deployment `appgdep_6ad3602ca5d88191828f5c1a1a0facac` succeeded; nuova verifica degli stessi dati e login. Account sintetico infine cancellato via API, sessione rifiutata. Le pagine read-only di accounts/diaries/personal_notes risultano vuote e senza omissioni. Site lasciato privato sulla 2.

GET anonimo del Site privato rifiutato con 401. Il digest canonico del diario persistito rimane `a64c533235b768bc09a68ac51124e1d18947e1d385d798502411b4afdd0c5281` nei cinque punti della prova. I due tentativi iniziali del client di prova hanno corretto soltanto il nesting subjects e il checkpoint del diario normalizzato; account parziali rimossi, nessun difetto dell’app occultato. Credenziali native e di servizio soltanto in memoria/stdin nascosto.

Verifiche locali sul codice cambiato: `release:prepare` passato con **137 test**, lint/tipi/i18n/inventario/documenti/build, 31 asset; **15 test D1** (inclusi contenitori) su schema invariato ed espanso/fail-closed; **146 controlli API** su build e nuovo DB locale con le sole 0000–0006, account rimossi. Rehearsal locale rinviata ancora eseguibile dopo lo spostamento dei file. Schema/journal/SQL attivi confrontati byte per byte con Sites 39; SQL 0007 e snapshot confrontati byte per byte con a832119; build contiene solo 7 migrazioni. Le prove locali verificano regressioni del nuovo codice e non sostituiscono restore gestito.

[Metadati, log, limiti e integrità](../../operations/w8a/evidence/security-no-migration-20261017/README.md). Versione produzione riconfermata **39**, pubblico, URL ipagell.website, domini/www/TLS active, 15 tabelle legacy visibili: nessuna chiamata di mutazione sul progetto pubblico. Il manifest di produzione resta identico. Nessuna 0008, cutover, provider o endpoint SQL.

**Prossimo incarico utile:** valutare il rilascio separato delle sole correzioni security già provate, con autorizzazione esplicita prima di pubblicare la produzione. Non ripetere la qualifica del canale inesistente come prerequisito di questo candidato. L’espansione 0007 e i provider rimangono in un ciclo distinto, ancora subordinato a un percorso reale di backup/restore gestito; il presente risultato non lo certifica.

## Snapshot storico del candidato con espansione, fino ad a832119

Ramo locale **`codex/w8a-release-sites39-20261017`**, nel worktree dedicato `/Users/ahmedali/.codex/worktrees/w8a-release/iPagell`. Riparte dalla sorgente Sites **39**, `a8cf046fe2cbe804cebdb80957e1ffa2c88893f1`, e porta soltanto W8-A, la sua documentazione/prerequisiti W7 e la preparazione CI. Nessun push, PR, salvataggio versione o deploy del candidato. W8 complessivo, W8-B e provider restano aperti.

Conservazione separata:

- Checkout originale: HEAD `fdd59f8`, branch `codex/identity-architecture-20261001`, modifiche e indice invariati. Verifica SHA-256 di 511 percorsi e confronto dei diff/stato iniziali; nessun checkout/reset/stash.
- `b4e3492c5a67b96c0a98288caa35b8c33bde8a52`, ramo `codex/w8a-preserved-baseline-20261017`: snapshot delle modifiche preesistenti, ricostruito con le copie precedenti a W8-A. Non è una revisione né un rilascio di quegli interventi.
- `eaeda2c46c495da05f0edb3160dbf48be005e723`: delta W8-A originale, 35 file rispetto alla baseline. `e5f1e1e807e037853b313fe928008881d68c0203`, ramo `codex/w8a-release-20261017`, conserva la prima verifica sullo snapshot completo. **È un ramo di conservazione, non il candidato da pubblicare.**
- Il ramo finale è basato direttamente su Sites 39: esclude la pulizia preesistente di componenti, dipendenze e documenti e i laboratori locali. Componenti rimossi e lockfile della produzione sono preservati nel candidato. `package.json` aggiunge solo il comando D1, senza nuove dipendenze; il lockfile coincide con Sites 39.

Nel candidato iniziale `77beff9`, il delta runtime W8-A era applicato senza cambiamenti rispetto al commit isolato già revisionato. La ripresa operativa sotto separa i due DML della 0007; nessuna route o adattatore auth viene modificato. La documentazione W7 necessaria, presente nel checkout originale ma assente nella sorgente Sites 39, accompagna il candidato. Inventario rigenerato dalla sua base effettiva. CI aggiunge `npm run test:auth-d1`; bootstrap locale include 0007. I vecchi SQL 0000–0006 coincidono con Sites 39.

## Verifica Sites iniziale in sola lettura

Connettore: progetto `appgprj_6aa9bf5f9a00819189df944bf2d51850` attivo, owner, accesso pubblico, URL live **https://ipagell.website**. Ultima versione 39, sorgente sopra; deployment `appgdep_6ad08724fce481919307c0600ae82d82` **succeeded**, concluso il 15 ottobre. Domini `ipagell.website` e `www.ipagell.website`: stato, provider e TLS active. Nessuna configurazione modificata.

Sorgente aperta dal helper Sites in una directory temporanea separata, senza push. Primo tentativo con Node di sistema 23 fallito genericamente prima di creare il checkout; ripetizione con Node 24 riuscita. Credenziale temporanea soltanto nella memoria della sessione e stdin del helper, mai salvata negli artefatti. Nessuna lettura dei diari, note o database remoti. I metadati della piattaforma non attestano l’applicazione remota di 0007.

Il confronto ha rilevato 221 differenze tra sorgente live e baseline di conservazione: fuori da documenti/laboratori erano pulizia di componenti e hook inutilizzati, manifest/lockfile e configurazioni locali. Queste differenze non sono confluite nel ramo finale. Riconciliazione sorgente completata; prima di un futuro deploy verificare nuovamente che la versione live non sia cambiata.

## Verifiche storiche sul candidato iniziale `77beff9`

Installazione pulita da lockfile della produzione tramite `npm run install:ci`; controlli con Node **24.19.0**. La CI configurata usa Node 22; nessuna esecuzione GitHub in questo task.

| Controllo | Esito |
|---|---|
| `npm run release:prepare` | Passato: lint, tipi, 135 test, 769 chiavi nelle quattro lingue, inventario, link, build Sites e precache con 31 asset |
| `npm run test:auth-d1` | 8 test passati (contenitore incluso); D1 effimero reale locale, nessun dato remoto |
| `npm audit --audit-level=low` | Zero vulnerabilità segnalate dal registro al momento della prova |
| Bootstrap build/API | SQL identico a quello già applicato 0000–0007 su un nuovo D1 locale sintetico; Worker ricompilato dalla base Sites 39 |
| `TEST_BASE_URL=http://127.0.0.1:5183 npm run test:api` | 146 controlli passati sulla build finale; account sintetici rimossi dalla suite |
| Integrità | SQL storici e runtime W8-A confrontati con i riferimenti; doc/link e YAML CI verificati, diff senza errori; sorgente originale preservato |

La verifica completa sul primo snapshot di conservazione era anch’essa passata (135 app, 8 D1, 146 API, audit zero); è stata ripetuta dopo il cambio di base. Il database della prova API è esclusivamente locale in `/private/tmp/ipagell-w8a-release-db-20261017`, escluso dagli artefatti; il server viene arrestato alla fine. La precedente prova browser resta quella del rapporto iniziale, non ripetuta qui. Avvisi build invariati su chunk oltre 500 kB e classificazione statica Vinext. Nessun risultato locale attesta restore gestito, provider, device fisici o sicurezza indipendente.

## Ripresa operativa da `77beff9` — 17 ottobre 2026

Questa sezione registra il vincolo storico senza deploy; l’autorizzazione successiva per il solo ambiente privato e il gate corrente sono nella qualifica da `cd38d40` sotto.

**Parte sorgente e prova locale completate; gate amministrativo/HTTPS gestito ancora aperto.** Nessun deploy, push, salvataggio Sites, progetto creato, migrazione remota o contenuto utente letto. Nessuna 0008, cutover o abilitazione provider.

### Evidenze esterne rinnovate

Metadati Sites riconfermano versione **39**, sorgente **`a8cf046fe2cbe804cebdb80957e1ffa2c88893f1`**, deployment sopra succeeded, progetto attivo/pubblico e dominio canonico/www/TLS active: nessun cambiamento live rispetto alla base. `read_database_overview` sul binding **DB** restituisce le sole **15 tabelle legacy**, senza nomi omessi o troncamenti; tutte le otto strutture introdotte da 0007 sono assenti. Non sono state lette righe, credenziali o dati personali. Il connettore non espone il journal interno migrazioni né le colonne: questa è evidenza di schema visibile, non una certificazione di backup o ogni possibile stato parziale. Versioni salvate e stato locale precedente non attestavano 0007 remota; la modifica riguarda l’espansione locale mai pubblicata, lasciando 0000–0006 immutate.

Ricerca nell’elenco completo dei Site posseduti: nessun ambiente di prova iPagell distinto disponibile. Gli altri progetti non sono stati usati. Gli strumenti Sites esposti consentono overview/lettura righe, gestione del sito e pubblicazione; **non espongono SQL amministrativo parametrizzato, export/import o restore D1**. Creare un Site non pubblicato non dimostra binding D1 o HTTPS funzionante; un deploy di prova richiederebbe una nuova autorizzazione, esclusa dal vincolo corrente.

### Correzione di schema e operazioni

La skill Sites richiede in `references/storage.md`, “Schema Changes”, punto 2: «Keep migrations schema-only and bounded. Backfills and seed datasets belong outside migrations.» Il riferimento operativo locale completo della skill è `/Users/ahmedali/.codex/plugins/cache/openai-curated-remote/sites/1.0.1/skills/sites/SKILL.md` (risorsa dell’ambiente, non parte del repository).

- **0007 ora solo DDL:** tabelle/indici, colonna nullable e trigger, senza copia dati né inizializzazione del singleton. Snapshot Drizzle invariato perché lo schema non cambia. Guardie e fonte autorevole rimangono quelle W8-A.
- [initialize-legacy.sql](../../operations/w8a/initialize-legacy.sql) è una fase amministrativa separata, obbligatoria prima del traffico. Non sovrascrive stato esistente e non riapre paused/ignoto. Senza inizializzazione la nuova auth restituisce 503 e anche il vecchio writer è fenced dai trigger: **non eseguire il deploy ordinario della sola 0007**. Occorre qualificare la finestra schema/bootstrap e il canale ufficiale prima del rollout.
- [backfill-legacy.sql](../../operations/w8a/backfill-legacy.sql) è opzionale, esplicito, solo legacy, con cursore e limite massimo 100. I replay non sovrascrivono copie obsolete. La pagina scansionata, non il numero di insert, determina il cursore. Il backfill non serve a login/register/recovery/security W8-A e non autorizza il futuro cutover.
- Nessun endpoint amministrativo inserito nell’app, nessun accesso Cloudflare diretto o uso del Worker sperimentale. Il pacchetto di build contiene soltanto la 0007 schema-only; gli SQL operativi restano nel sorgente, fuori dal runner migrazioni Sites.

### Prove della ripresa

| Prova | Risultato e perimetro |
|---|---|
| `npm run release:prepare` | Passato con Node 24.19.0: lint/tipi, **136 test**, cataloghi 769 chiavi × quattro lingue, inventario/link, build Sites e precache 31 asset |
| `npm run test:auth-d1` | **10 test passati**, contenitore incluso: schema-only fenced, bootstrap esplicito, legacy senza copia, init ripetuta/paused, backfill limitato/replay, oltre alle regressioni precedenti |
| `npm run test:auth-restore` | Due restore D1 locali: **15/23 tabelle**, **45/89 oggetti schema**, tutte le righe confrontate; FK valide, password verificabile, trigger sequenze e fence funzionanti, sorgente invariata |
| Integrità backup | Tre file effettivi schema/dati/trigger salvati su disco, manifest con hash dei byte, rifiuto di data.sql corrotto, restore dagli stessi file riletti; file temporanei poi rimossi |
| HTTP prima del bootstrap | Login e register sulla build compilata rispondono **503 AUTH_UNAVAILABLE**, senza creare account o aprire implicitamente lo stato |
| HTTP dopo bootstrap senza backfill | **146 controlli API passati**, account sintetici rimossi; prova su nuovo DB locale con 0000–0007 più init esplicita, nessun backfill |
| Verifica finale | Lint/tipi ripetuti sui file finali della rehearsal dopo la revisione, documenti e YAML CI validati; CI ora include anche `test:auth-restore` |
| Revisione separata | Sola lettura, nessun override modello o tool remoto. Corretto il rilievo sulla differenza tra dump hashato e file realmente importati; manifest ora hashato dai byte su disco. Nessun ulteriore blocco locale individuato |

Il primo tentativo di importare il dump completo è fallito con `no such table: main.classes`: ordine di creazione/dati con FK. La prova corretta crea tutte le tabelle/indici, importa l’export dati Wrangler con FK differite, poi ricrea i trigger, evitando anche di rigenerare le sequenze delle note. Il backup verificato è il bundle in tre file, non il dump completo del tentativo fallito. Il [runbook](../../operations/w8a/RUNBOOK.md) descrive acquisizione, integrità, ordine e controlli. La [guida primaria D1](https://developers.cloudflare.com/d1/best-practices/import-export-data/) descrive import/export e vincoli FK. Il [Time Travel D1](https://developers.cloudflare.com/d1/reference/time-travel/) è un ripristino in-place: non è stato eseguito e non dimostra una copia isolata del DB gestito.

Prove solo locali sintetiche: nessuna attestazione HTTPS gestita, journal Sites, carico massimo, RPO/RTO operativo, snapshot concorrente, rollback Worker gestito o retention. I warning build preesistenti restano; nessuna nuova prova browser o CI GitHub. La nuova suite completa è stata eseguita; l’audit dipendenze a zero resta l’evidenza della preparazione precedente, con dipendenze/lockfile invariati in questa ripresa.

### Gate rimasto, requisito concreto

Serve **un canale amministrativo ufficiale Sites** per applicare l’inizializzazione tra schema e riapertura del traffico e per backup/restore, più un ambiente di prova privato con DB dedicato e HTTPS. Non si può qualificare tale percorso con i soli strumenti disponibili e il divieto di deploy corrente. La separazione dei file risolve il contenuto schema-only della migrazione, **non** certifica l’esecuzione gestita delle fasi.

La [richiesta di capacità alla piattaforma](../../operations/w8a/PLATFORM-REQUEST.md) è pronta, senza invio a terzi. Il successivo incarico deve qualificare il canale e autorizzare eventualmente **solo un deploy di prova distinto**, mantenendo ipagell.website invariato. Se la piattaforma non offre il canale, il rollout resta bloccato; non ripetere test locali come sostituto e non aggiungere route SQL temporanee al sito pubblico. Pubblicazione intermedia W8-A e W8-B richiedono cicli successivi separati.

## Qualifica del canale Sites da `cd38d40` — 17 ottobre 2026

**BLOCCATO: manca il canale amministrativo nella superficie ufficiale disponibile.** L’utente ha autorizzato creazione e deploy esclusivamente di un ambiente Sites privato distinto, con DB dedicato e dati sintetici, per HTTPS e recupero. Il consenso al deploy di prova non è più un gate; la produzione ipagell.website resta esclusa.

[Qualifica e prove](../../operations/w8a/PLATFORM-QUALIFICATION.md): esaminati i 25 strumenti Sites esposti, i contratti DB e la skill Sites 1.0.1. La piattaforma documenta provisioning del binding D1 e migrazioni solo schema prima dell’upload Worker; la superficie verificata non espone SQL amministrativo separato, finestra coordinata, backup coerente con journal Sites, export/import o restore isolato. Ricerca delle integrazioni `Sites SQL backup restore`: Sites già installato, nessuna integrazione restituita che offra tali operazioni sul D1 gestito. Non si conclude che gli operatori della piattaforma siano privi di capacità interne.

Controlli Sites in sola lettura riconfermano versione **39**, sorgente **`a8cf046fe2cbe804cebdb80957e1ffa2c88893f1`**, deployment **succeeded**, URL canonico/pubblico, domini/www/provider/TLS active e le sole **15 tabelle legacy** senza omissioni. Nessuna riga letta, nessuna credenziale o URL firmato nelle prove versionate.

Nessun Site creato, source push, versione salvata, deploy o SQL remoto: il vincolo esplicito richiede di mantenere il blocco se manca il canale. Bootstrap, backup, restore e HTTPS isolati restano **non eseguiti**, nessun RPO/RTO attestato. Nessuna 0008, cutover, provider, endpoint SQL temporaneo o uso del Worker sperimentale. Nessuna nuova prova localhost/D1 locale: i risultati storici sopra restano storici. Questa ripresa modifica soltanto documentazione e prove; verificati integrità e collegamenti documentali.

Il tentativo di allegare il worktree alla chat è stato rifiutato dall’app perché appartiene a un’altra chat; nessuna riassegnazione forzata. Il percorso e il ramo richiesti sono stati ripresi direttamente, senza ricrearli.

**Incarico esterno necessario:** il responsabile Sites deve fornire un percorso ufficiale con SQL circoscritto al progetto, coordinamento schema/bootstrap/traffico, snapshot coerente, restore in altro DB vuoto e riconciliazione journal; indicare operatore, conservazione e criteri RPO/RTO. Quindi eseguire la prova sintetica nel solo ambiente privato già autorizzato. [Richiesta aggiornata](../../operations/w8a/PLATFORM-REQUEST.md), pronta ma non inviata; nessun contatto a terzi.

## Recupero e prossima ripresa

Nel checkout originale `outputs/w8a/` conserva manifest, bundle Git verificato, patch del candidato rispetto a Sites 39, patch del delta originale, sorgente archiviato, confronto live e log. Il manifest identifica il commit finale e gli hash, evitando SHA autoreferenziali in questo documento. Artefatti locali ignorati da Git, senza credenziali, database, cookie, file ambiente o backup utenti. Il bundle iniziale includeva anche i rami di conservazione ed era verificato importandolo in un repository Git vuoto. La ripresa operativa salva un nuovo bundle e manifest in `outputs/w8a-operations/`, separati da quelli storici di `outputs/w8a/`.

Usare **`codex/w8a-release-sites39-20261017`** nel worktree isolato; il ramo `codex/w8a-release-20261017` conserva il primo snapshot e non va pubblicato. Il checkout originale resta modificato come trovato. Non applicargli automaticamente patch o `git add -A`; riprendere dal gate amministrativo/HTTPS gestito sopra, mantenendo distinti preparazione, autorizzazione e pubblicazione.
