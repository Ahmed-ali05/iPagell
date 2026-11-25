# iPagell — Matrice di verifica corrente

[Indice](README.md) · [Snapshot](REPO-SNAPSHOT.md) · [Architettura](ARCHITECTURE-CURRENT.md) · [Pubblicazione](DEPLOYMENT.md)

Evidenze aggiornate al **1 ottobre 2026**. Riferimento delle prove annuali: Sites 29, sorgente `02cb8843867987dbb3552e049fd1aecd5f755352`; esiti in fondo al documento. Le prove dell’audit iniziale sotto fanno riferimento a Sites 27. Il successivo rilascio homepage Sites 30 è registrato in [Pubblicazione](DEPLOYMENT.md), senza una nuova verifica remota nel riordino documentale del 2 ottobre. Il precedente audit `c780569…`, le contraddizioni allora presenti e i risultati dei rilasci precedenti sono in [VERIFICATION-HISTORY](archive/VERIFICATION-HISTORY.md). Non vanno letti come affermazioni sul codice attuale.


## Pannello Account (fase C) — 25 novembre 2026, pubblicato (Worker `d97b7254`)

[Progetto](ACCOUNT-PANNELLO-FASE-C-2026-11-25.md). Dimostrato in locale: 3 test unitari sulla parola di conferma; 1 prova D1 reale su `profile` (51/51); browser con account Google e con password sintetici (onboarding senza handle, pannello in chiaro/scuro, 320 px, italiano e tedesco, handle rifiutato, eliminazione con «elimina» e pulizia completa nel D1 locale). Suite API locale: 171 controlli superati, 3 nuovi. **Non dimostrato:** ritorno del focus da Google con pannello visibile, francese e inglese nel browser, lettori di schermo, staging, produzione.

## Conferma Google senza uscire (fase B) — 25 novembre 2026, pubblicato (Worker `d97b7254`)

[Progetto](ACCOUNT-REAUTH-FASE-B-2026-11-25.md). Dimostrato in locale: test unitario su `login_hint`/`prompt`; 9 prove D1 reali con 0000–0009 (transazione `reauth` solo con sessione, versione e identità Google valide; altro `sub` senza grant; grant monouso per la sola sessione d'avvio; sostituzione; sessione chiusa; eliminazione rifiutata senza grant, da altra sessione o con grant scaduto; eliminazione con grant e cascata completa); controlli nella suite API locale; prova browser con account Google sintetico (ritorno con altro account, errore con Google non configurato, conferma riuscita ed eliminazione). Staging (25 novembre, Worker `72995954`): giro reale con Google per conferma con lo stesso account, scelta di un altro account ed eliminazione con pulizia completa nel D1 di staging. Non dimostrato: annullamento su Google reale, produzione.

## Dispositivi connessi (fase A) — 25 novembre 2026, pubblicato (Worker `d97b7254`)

[Progetto](ACCOUNT-SESSIONI-FASE-A-2026-11-25.md). Dimostrato in locale: 5 test unitari sul riconoscimento di browser e sistema (User-Agent reali, client hints, valori anomali) e sull'`id` derivato; 10 prove D1 reali con 0000–0009 (riempimento esatto, `INSERT` del codice precedente dopo la 0009, versione e gate all'inserimento, `last_seen_at` con finestra di 15 minuti e scrittura fallita ignorata, elenco limitato al proprietario e senza digest, revoca singola e IDOR, revoca delle altre, limite di 20, cascata alla cancellazione); 15 controlli API su `localhost` nella suite completa (163 superati); browser con account sintetico a 1024 e 320 px, chiaro/scuro, tastiera e focus, conferma «Esci da tutti gli altri». Riempimento verificato anche sul D1 locale con 19 sessioni esistenti. **Non dimostrato:** staging, produzione, telefono fisico, lettori di schermo reali, lingue diverse dall'italiano nel browser, comportamento del lato revocato oltre al 401 (lo stato `expired` è quello esistente, non riprovato qui).

## Runtime e dipendenze — 22 ottobre 2026

[Analisi, avvisi e prove](RUNTIME-SECURITY-2026-10-22.md). PHP assente. Node selezionato 22.23.4; range limitato alle serie corrette e `engine-strict`/entrypoint verificati anche contro il Node 23.10.0 presente inizialmente. Vite 8.1.6 elimina le cinque segnalazioni del precedente audit. Audit completo a zero in entrambi i checkout e nel laboratorio. Installazioni pulite e build riuscite: 138 test sul sorgente di rilascio, 145 sul checkout di lavoro, 52 sul laboratorio separato; 146 prove API sulla patch compilata con soli account sintetici locali ripuliti. Il rilascio parte da Sites 42 e non include le modifiche locali auth/schema/UI. Il connettore non attesta la versione delle patch interne del runtime Workers; il Node di sistema non è stato sovrascritto. Pubblicata come **Sites 44**, sorgente `098331e7a9b8cfe7ca957de8f1c10884b35e5759`, deployment `appgdep_6ada321440e081918802629637f18797` **succeeded**; pubblico e domini/TLS confermati. [Registro](DEPLOYMENT.md).

## Spazio pubblico — 19 ottobre 2026, solo locale

[Perimetro e prove](PUBLIC-SPACE-2026-10-19.md): panoramica, diario per capitoli, editor pubblico PDF/Markdown e calcolatore con continuità nella scheda. Lint, TypeScript, 140 test, 837 chiavi i18n e controlli documentali superati. Prove browser con dati sintetici: persistenza dopo navigazione/ricarica, conflitti tra schede e recupero, download effettivi e PDF renderizzato, viewport desktop e strette. Nessun account reale, modifica remota o deploy.

## Appunti da lezione — preparazione, 10 ottobre 2026

[Analisi e confini](LEZIONI-LIVE-AI.md), [protocollo](lezioni-live-ai/EVALUATION.md) e `experiments/lecture-notes/README.md`. LN-00 è una preparazione documentale; le fasi successive non sono state eseguite.

| Verifica | Evidenza e limite |
|---|---|
| Istruzioni e confini nel codice | Letti AGENTS.md, snapshot, architettura, matrice, Appunti/outbox/storage/validazione, workspace e precache. Confermata la sincronizzazione avviata dal writer personale; nessuna modifica al runtime |
| Preferenza iniziale | Utente: notebook Chrome e italiano. Dispositivo concreto, istituto e giurisdizione del pilota ancora da identificare |
| Ricerca primaria | Consultati cataloghi Whisper/Vosk/Moonshine, runtime web, API microfono e indicazioni IFPDT/Garante. Italianità, licenze e dimensioni distinguono i candidati; nessun peso scaricato, conversione avviata o benchmark eseguito |
| Organizzazione | Analisi, piano LN-00–LN-05, protocollo con soglie proposte, fonti e modello rapporto. `experiments/lecture-notes` contiene solo README e .gitignore; isolamento operativo futuro non verificato |
| Controlli documentali | `npm run docs:check` e `git diff --check` superati. Inventario allineato; controlli di esclusione Git su percorsi audio/modelli/tracce passati. Il controllo non certifica prosa, URL esterni, privacy o efficacia |
| Residui | Corpus/gold, runtime e artefatti, ASR italiano, sintesi, rete/storage/stop, sessioni lunghe, revisione umana e pilota da eseguire. Nessun ascolto, dato reale, accesso ai database o pubblicazione in questo task |

## Semplificazione UI — 10 ottobre 2026 (Sites 33)

[Analisi e decisioni](UX-SIMPLIFICATION-2026-10-10.md). Pubblicata come Sites 33, sorgente `0288de5aa0419f8d7a1d59a69f5cb728c95dda55`; le evidenze seguenti distinguono le prove locali dalla conferma Sites.

| Verifica | Esito e limite |
|---|---|
| Lint, TypeScript e test | Superati; 114 test passati. Nessuna modifica a contratti API, formule o persistenza. Suite API esterna non rieseguita per questo intervento UI. |
| i18n e documentazione | 759 chiavi referenziate coerenti in it/de/fr/en; inventario rigenerato dopo la rimozione delle chiavi inutilizzate. Link verificati. |
| Build Sites | Completata; resta l’avviso di chunk oltre 500 kB. La route di prova sintetica è esclusa dal sorgente consegnato. |
| Browser con dati sintetici | Navigazione fra le viste, ritorno visibile all’elenco appunti, materia/precompilazione nuovo voto, simulatore, disclosure Assenze, lettura condivisa e invito nella gestione verificati. Nessun dato reale modificato. |
| Tastiera/focus | Frecce/Escape nel menu e ritorno al trigger dopo export; invito chiuso con ritorno a Crea invito. Non è una verifica con lettore di schermo. |
| Layout | 1440 px desktop, 390 px per lettura/Agenda/Voti, 320 px in tedesco scuro per Voti/Assenze. Nessun overflow nei casi misurati; revisione finale riprovata a 390 px. Non copre device fisici, IME, tastiera virtuale o ogni lingua/viewport. |
| Ambiente di sviluppo | Errori transitori I18nProvider/InstallAppProvider durante aggiornamento a caldo dei cataloghi; ricarica completa ha ripristinato la demo. La fixture conserva le proprie revisioni fra ricariche, separata dai dati reali. |

| Appunti correlati | Personale/classe: stessa materia, esclusione del corrente, altra materia e note eliminate, sezione assente se vuota; clic/Enter sostituiscono il lettore e focalizzano il titolo. 1440/390 px, nessun overflow; Riduci movimento → animation none. Verifica incrementale, 114 test generali non ripetuti. |

| Pubblicazione | Sites 33, deployment `appgdep_6aca102fca3081918ea6c6cd6c4ab082` succeeded; URL canonico, audience e domini/TLS attivi riconfermati. Nessuna nuova migrazione o modifica ai dati. |

| GitHub | Sorgente e documenti nella [PR 5](https://github.com/Ahmed-ali05/iPagell/pull/5). La prima CI del 10 ottobre si era fermata all’audit con 13 segnalazioni high. Dopo la correzione dipendenze, [CI sul commit f2200a9](https://github.com/Ahmed-ali05/iPagell/actions/runs/38073051270) riuscita: audit a zero, 121 test e build. La correzione è pubblicata in Sites 34; le prove UI sopra restano riferite a Sites 33. |

## Dipendenze — 10 ottobre 2026

[Analisi e prove](DEPENDENCY-SECURITY-2026-10-10.md): sette regressioni mirate passate, lint/tipi superati, audit completo del registro a zero. Il codice locale braces è verificato dai test prima dell’audit; l’audit npm non certifica la patch locale. [CI sul commit f2200a9](https://github.com/Ahmed-ali05/iPagell/actions/runs/38073051270) riuscita su installazione pulita Node 22: sette controlli prima dell’audit, audit completo a zero, lint/tipi, 121 test, 759 chiavi i18n, documentazione e build. Pubblicata in Sites 34, deployment `appgdep_6aca7a42f8bc819184aaa0f9b87e7436` succeeded; dettagli in [DEPLOYMENT](DEPLOYMENT.md). Nessuna prova browser UI o API ripetuta per questo intervento sulle dipendenze.

## Riduci movimento — correzione visibilità

La verifica di Sites 34 ha rilevato il toggle presente ma pista/cursore trasparenti. Stile corretto e prove locali in sviluppo sulla finestra reale con dati sintetici: acceso/spento chiaro/scuro, clic/etichetta/Space, focus 3 px, hit area 52×44 px, movimento ridotto con transizione 0s e desktop/390 px senza overflow. Route e export di prova esclusi dal sorgente finale. Nessuna preferenza reale cambiata. [Causa e soluzione](UX-SIMPLIFICATION-2026-10-10.md#correzione-riduci-movimento--10-ottobre); pubblicata in Sites **35**, deployment `appgdep_6aca7e78142c81918098b14a342fd8ba` succeeded, https://ipagell.website confermato pubblico. Dettagli nel [registro](DEPLOYMENT.md).

## Riduci movimento — regressione del CSS compilato

Le prove di Sites 35 sopra non coprivano lo stato acceso nella build compilata; lo screenshot dell’utente ha evidenziato il doppio spostamento. La nuova verifica usa il CSS minificato e il workspace reale con account sintetico: acceso/spento chiaro/scuro, etichetta/Space, due dimensioni, disabilitazione, direzione inversa, quattro lingue a 320 px e 390 px senza tagli. Verificati grafici senza variazioni animate con la preferenza attiva, note con `instant`/`none` e focus al titolo, offline/riconnessione e rimozione del dataset allo smontaggio. Due test mirati coprono persistenza per account e backup legacy/correnti. [Analisi e matrice dei casi](UX-SIMPLIFICATION-2026-10-10.md#regressione-del-toggle-e-copertura-del-movimento--10-ottobre). Il comportamento del sistema è verificato nel CSS e nel codice Recharts; OS, Safari, dispositivi fisici e lettori di schermo non sono stati provati.

Pubblicazione: Sites **36**, deployment `appgdep_6aca8811d9948191ba63063a489d5099` succeeded; dominio canonico/www e TLS attivi, audience pubblica. [CI del sorgente](https://github.com/Ahmed-ali05/iPagell/actions/runs/38077027637) riuscita.

## Agenda — elenco delle attività, 10 ottobre 2026

[Analisi e casi](AGENDA-LIST-2026-10-10.md). Cinque test mirati passati: stati personali/classe/scollegati/annullati, giorno locale e ora legale, ordine per istante/parità, completamento/riapertura e 1.500 record di storico senza perdita delle aperte. Browser sulla build compilata: 30 completate separate, 17 aperte raggiungibili dal riepilogo calendario, stati vuoti, filtro origine, ritorno dagli appunti, storico da Home, descrizione lunga, tastiera/focus e attesa/errore di classe simulati. Desktop 1.440 px, mobile 390/320 px, quattro cataloghi renderizzati senza overflow nei casi misurati; nessuna attività reale cambiata. Telefoni fisici, Safari, screen reader e dataset con migliaia di aperte restano fuori dalla verifica. Suite API non ripetuta perché callback e contratti non cambiano. Pubblicata in Sites **37**, sorgente `bf295652402cc3018fba46a5b8ec91ed55cfcdb5`, deployment `appgdep_6aca90049350819189acde5a20f974a2` succeeded. CI verde con 128 test; controllo produzione autenticato desktop/mobile: aperta in testa e storico chiuso, nessun overflow.

## Rifinitura delle interazioni — 15 ottobre 2026

[Rapporto](APPLE-DESIGN-2026-10-15.md): 128 test, lint/tipi/cataloghi/documentazione e build Sites superati; prove locali su finestre/menu, focus, quattro lingue, 320/390/1440 px, temi e movimento ridotto. Testo al 200% tramite fixture locale, senza modificare gli asset pubblicati. Il rapporto distingue prove, correzioni e limiti. Pubblicazione Sites **38** succeeded, sorgente `2a946daea00a3b069a25809c52af3abc0875a061`; URL canonico/pubblico e domini/TLS confermati, `/app` 200 con nuovo CSS.

## Campi data iOS — 15 ottobre 2026

[Rapporto](IOS-DATE-OVERFLOW-2026-10-15.md): correzione del calcolo larghezza/padding dei controlli nativi e minimi Grid, controlli ordinari e build passati; prove locali su dati sintetici. Pubblicata in Sites **39**, deployment `appgdep_6ad08724fce481919307c0600ae82d82` succeeded; `/app` 200 con nuovo CSS. La conferma su iPhone fisico resta distinta dai test nel browser disponibile.

## Come leggere le evidenze

- **Codice:** comportamento osservato nell'implementazione; non certifica l'ambiente esterno.
- **Test locale:** scenario realmente eseguito con dati sintetici; non copre ogni device o sequenza.
- **Esterno:** metadati restituiti dal servizio nel controllo indicato.
- **Parziale/aperto:** manca una prova necessaria per l'affermazione completa.

Uno stesso punto può avere evidenze diverse. I conteggi dei test sono risultati di esecuzioni definite, non promesse di copertura universale. Un audit dipendenze non è un penetration test; una build non è un deploy; una CI riuscita non certifica il runtime Sites.

## Codice e struttura

| Affermazione corrente | Evidenza | Limite |
|---|---|---|
| Il diario usa un controller e una coda per letture/scritture/sync/logout. | `lib/diary-session.ts`, `hooks/use-diary.ts`, `tests/diary-session.test.ts` | Non è merge automatico o CRDT. |
| Il confronto locale del diario è atomico; una scheda obsoleta non sovrascrive/cancella il draft successivo. | `lib/account-storage.ts`, test sessione e pagina di test browser storage | Le prove browser storiche non certificano ogni versione di IndexedDB. |
| Il fallback offline non mescola account dopo una risposta autenticata o un errore storage. | Separazione dei catch/ticket/puntatore nel controller, test di sessione | Richiede una copia locale preparata e storage disponibile. |
| API ricavano identità dal cookie e verificano Origin, proprietà e permessi. | `lib/server/auth.ts`, `http.ts`, `class-access.ts`, repository e suite API | Nessuna certificazione indipendente di sicurezza. |
| Attività e sottoscrizioni di classe sono separate da `diaries.payload`; campi personali restano privati. | Schema, `class-event-repository.ts`, `agenda-coordinator.ts`, test class mutations/API | Non misura prestazioni con carico reale. |
| Materie normalizzate della classe e appunti sono implementati; eventi conservano etichetta testuale. | `db/schema.ts`, migrazione 0005, API subjects/notes | Le materie legacy hanno regole di conteggio distinte dalle nuove. |
| Schema attivo del rilascio security contiene 15 tabelle e 7 migrazioni, identiche a Sites 39; espansione rinviata fuori da drizzle/. | [Inventario generato](REPO-INVENTORY.md), AST schema e confronto journal/SQL | Non prova che un DB remoto contenga soltanto queste tabelle. |
| Appunti personali e di classe hanno formati espliciti, quote, revisioni e ID di mutazione. | `lib/notes/validation.ts`, `note-repository.ts`, 0005/0006, test notes/API | Non c'è storico completo o cestino. |
| Il confronto della bozza personale tollera metadati aggiornati dalla propria conferma, conserva nuove modifiche e protegge altri writer. | `reconcile.ts`, transazione `updatePersonal`, `tests/note-storage.test.ts` | Nessuna co-scrittura o fusione automatica. |
| Una risposta persa ritenta il payload persistito inFlight; pagine vecchie non fanno regredire nota/cursore. | `use-notes.ts`, `storage.ts`, test di outbox/ack/pagine | Dipende dall'accessibilità dello storage locale; inFlight non è un backup. |
| Il commit locale riuscito resta riconosciuto se fallisce il refresh UI; errore reale permette retry. | `persistAndNotify`, `DraftAutosaver`, `tests/note-autosave.test.ts` | Non promette persistenza se IndexedDB abortisce o il browser viene terminato. |
| I due editor condividono autosave/flush; bozza classe conserva la base aperta e richiede conferma. | `use-note-autosave.ts`, entrambi i componenti, test e prova browser | Una riconnessione non pubblica la bozza. |
| md-lite-v1 round-trip gestisce a-capo in paragrafi, titoli e liste; lettura/anteprima usano AST chiuso. | `format.ts`, `NoteContent`, `tests/note-format.test.ts`, API | Solo grammatica ammessa, non Markdown generale. |
| Backup V3 preserva formato; importa V1/V2; copie classe diventano personali con piano riprendibile. | `backup.ts`, `types/notes.ts`, test notes e UI import | Restore di backup reale utente non eseguito; nessun restore infrastrutturale verificato. |
| Lingua interfaccia è separata da scala voti e payload; calcolatore pubblico non persiste input. | `lib/i18n/**`, `grading.ts`, calcolatore e relativi test | Revisione linguistica umana e altre scale restano aperte. |
| PWA esclude API/RSC dalla cache e non forza skipWaiting; reminder richiede app aperta. | `public/sw.js`, generatore, `install-app.tsx`, test service worker | Non garantisce installazione/aggiornamento su ogni browser. |
| CI installa da lockfile, esegue audit, release:prepare e prove auth/restore su D1 locale sintetico; non pubblica e non lancia suite API/browser. | `.github/workflows/check.yml`, `package.json` | Il singolo esito CI deve essere letto sul relativo commit. |

## Prove locali del rilascio Appunti 27

Eseguite prima della pubblicazione il 1 ottobre 2026; nessuna nota reale modificata.

| Verifica | Esito osservato e limiti |
|---|---|
| `npm run check` | Lint/TypeScript, 103 test, 719 chiavi i18n, link documentali passati sul sorgente applicativo del rilascio. |
| Suite API locale | 146 verifiche passate, account sintetici ripuliti: identità/permessi, formato/contratto, CAS, quote, isolamento, note personali/classe e a-capo in tutti i blocchi. Non eseguita contro produzione. |
| Build Sites | Completata, con avviso chunk oltre 500 kB. |
| Autosave/IndexedDB | Chiamate sovrapposte, edit durante write, ack concorrente, risposta persa, conflitto vero, tombstone/cursore vecchio, draft incompleto, rifiuto definitivo, quota e retry. fake-indexeddb simula transazioni, non un telefono. |
| Personale nel browser | Titolo/grassetto con a-capo, salvataggio con modifica finale, chiusura e riapertura dopo sync; contenuto conservato. |
| Classe nel browser | Elenco/grassetto con a-capo, annulla/ripeti, bozza chiusa e riaperta, anteprima e aggiornamento esplicito; pubblicato e bozza distinti. |
| Comando al limite | 19.998 caratteri, grassetto oltre limite rifiutato, testo/DOM conservati, modifica successiva salvata e chiusura riuscita. |
| Focus/responsive precedente, rilascio 26 | Viewport 390/320 px, selezione e comandi della toolbar nel browser; evidenza storica. Non prova tastiera virtuale o selezione nativa su iOS/Android. |
| PDF precedente | Generazione breve/lunga e download disponibili; ispezione di file locali e limiti dell'apertura browser nello storico. PDF aperto/condiviso su telefono fisico ancora da verificare. |

Le regressioni individuate sono riprodotte nel codice/test, ma non identificano con certezza ogni sequenza del telefono segnalata dall'utente. I log Sites consultati nell'intervento non contenevano un errore Appunti correlabile.

## Stato della pubblicazione controllato

Riletto dal connettore Sites il 1 ottobre 2026, prima del ciclo ingresso/SEO:

| Proprietà | Evidenza esterna |
|---|---|
| Sito corrente | URL live `https://ipagell.website`, accesso pubblico, progetto attivo, versione più recente 27 |
| Versione salvata 27 | Sorgente `9535676a53a75f9ff52cf90a501435e1bcee40db`, archivio presente e deployment associato |
| Deployment | `appgdep_6abe17938bf48191938483d415de60bf`, stato `succeeded` |
| Domini | `ipagell.website` e `www.ipagell.website`, stato e TLS `active` |
| Corrispondenza locale iniziale | 234 file applicativi/configurazioni/asset/manifest confrontati byte per byte con il checkout del rilascio, nessuna differenza prima di questo aggiornamento. Le successive correzioni delle dipendenze sono nel changelog e sono state incluse in Sites 28. |

Questa verifica non ha letto contenuti dei diari o delle note reali. La migrazione formato D1 è stata verificata nel rilascio 24, come registrato nello storico; non è una nuova ispezione completa del database nel task documentale. Flag runtime Classi, backup automatici, retention e restore non vengono dedotti dai nomi del binding. Il Worker sandbox non è una prova del DB Sites.

## Verifica dell'aggiornamento documentale

Il nuovo `docs:check` confronta inventario con manifest/lockfile, route, schema, SQL/journal e poi verifica i link locali. Le guide sono state confrontate manualmente col codice; il check non certifica la veridicità della prosa. Il commit GitHub e il deploy Sites restano distinti.

| Verifica del 1 ottobre 2026 | Esito |
|---|---|
| `npm run release:prepare`, dopo gli aggiornamenti delle dipendenze | Lint, TypeScript, 103 test, 719 chiavi i18n, inventario di 27 route/15 tabelle/7 migrazioni, link documentali, build e precache completati. Resta l'avviso chunk oltre 500 kB. |
| `npm run docs:check`, revisione finale | 38 documenti e 263 collegamenti locali verificati; inventario allineato. Anche i percorsi ignorati da Git vengono rifiutati. |
| Suite API dopo gli aggiornamenti delle dipendenze | 146 verifiche passate sul Worker compilato e database locale nuovo in una directory isolata. Account sintetici rimossi dalla suite; nessuna richiesta ai dati di produzione. |
| Inventario obsoleto, prova negativa | Aggiunta temporanea di una riga al documento generato: `--check` rifiuta con exit 1; ripristinato il file originale, il controllo passa. Nessun artefatto di prova nel commit. |
| Link a un artefatto ignorato, prova negativa | Un link temporaneo a `output/pdf/`, esistente solo in locale, viene rifiutato con exit 1; dopo il ripristino il controllo passa. |
| `npm audit --audit-level=low` | Prima: 6 pacchetti segnalati, di cui 1 critical, 1 high e 4 moderate. Dopo gli aggiornamenti diretti e del lockfile: 0 vulnerabilità segnalate. Non attesta l'assenza di difetti di sicurezza nel codice o nel sito pubblicato. |

La prima CI dell'allineamento, sul commit `c863844`, ha passato installazione, audit, lint/tipi, 103 test e i18n; si è fermata su un link del design storico a PDF non versionati. Il riferimento è stato convertito in un percorso testuale rigenerabile e il controllo locale ora rifiuta i link a destinazioni ignorate da Git. L'esito completo va letto nella CI del successivo commit.

Gli aggiornamenti delle dipendenze sono verificati nella repository e inclusi nel successivo rilascio Sites 28. La tabella Sites 27 sopra registra lo stato dell’audit iniziale. I controlli remoti GitHub sono associati al commit, consultabili in Actions; non sono dedotti dall'esito locale.

## Ancora aperto

- iOS/Android fisici: selezione, toolbar, IME, dettatura, tastiera, PWA e export/condivisione PDF.
- Dataset massimo, rete lenta e carico concorrente realistico; budget dei chunk e accessibilità completa.
- Due dispositivi reali, aggiornamento di un vecchio client/PWA e chiusura forzata con storage bloccato.
- Backup infrastrutturale, restore isolato, retention e responsabilità operativa.
- Revisione umana delle traduzioni, sicurezza indipendente e metadati/redirect/cache live oltre ai controlli esplicitamente registrati.

Per questi punti non dichiarare completamento usando soltanto build, unit test, viewport desktop o successo del deployment.


## Ciclo ingresso, SEO e pianificazione account/periodi — 1 ottobre 2026

Il [rapporto del ciclo](improvement-2026-10-01/VERIFICATION.md) registra le nuove prove: 106 test, 146 controlli API locali, metadata SSR delle otto route pubbliche, sitemap/robots/noindex, primo voto, setup progressivo e recovery con rete interrotta e retry. Browser a 320/390 px e desktop 1440×900, Home chiaro/scuro, account sintetici ripuliti. Tre regressioni di sessione proteggono la conferma dell’identità prima di smontare il form. Queste prove sono locali. Pubblicazione Sites **28** conclusa con stato `succeeded`, deployment `appgdep_6abe63d2394c8191a6ee91547a4e3008`; nessun cambio a binding, accesso e domini. Il report distingue verifiche locali e risposta della piattaforma.

Alla chiusura di Sites 28, Google/Apple/email e la vista della materia per anno/storico erano pianificati nel [programma e prompt](improvement-2026-10-01/PLAN.md). La revisione dei semestri aveva verificato che le materie erano già comuni ai periodi: il limite di allora era il filtro di Voti/Statistiche. La consultazione annuale/storico è stata poi implementata in Sites 29, nel ciclo PERIODS-01 riportato sotto; i provider restano pianificati. Nessun dato migrato né voto ufficiale annuale inferito.


## Pianificazione multi-sistema — 1 ottobre 2026

Aggiunta l’[analisi dedicata](improvement-2026-10-01/GRADING-EXTENSION-AUDIT.md), riutilizzando le ricerche iniziali e verificando tipi, calcoli, UI, schema strict, persistenza e backup. Fonti scolastiche primarie consultate per le famiglie candidate; cinque prompt (10–14) aggiunti al programma. Controlli documentali nel rapporto del ciclo. Non sono stati implementati nuovi preset, contratti o migrazioni; al momento di questa pianificazione il rilascio documentato era Sites 28 e il sistema `numeric-1-6`. Il successivo Sites 29 cambia la consultazione, non la scala.


## PERIODS-01 — consultazione annuale e storico

Il [rapporto del programma](improvement-2026-10-01/VERIFICATION.md) distingue la nuova patch da Sites 28: 115 test, 146 verifiche API locali, journey annuale/storico con corrente vuoto, omonimi/archiviati, destinazione esplicita e annullamento, quattro lingue, desktop e 320/390 px chiaro/scuro. Nessuna migrazione o nuova scala. Pubblicazione Sites **29** succeeded, deployment `appgdep_6abe8ea156008191bdddc2141ffb5162`; fonte, version ID e controllo domini nel rapporto. Residui device fisici e verifica utenti restano aperti.


## IDENTITY-ARCH-01 / W7 — architettura, senza implementazione

Decisione/revisione del prompt 04 nell’[audit account](improvement-2026-10-01/AUTH-PRODUCT-AUDIT.md), esiti nel [rapporto](improvement-2026-10-01/VERIFICATION.md). Codice/schema/IndexedDB/proprietà classi verificati in sola lettura; reviewer separato Sol high. Una prova SQLite in memoria non valida D1: Miniflare locale fermato da sandbox socket prima SQL, provider e callback/SameSite non provati. Produzione 29 e domini/TLS riconfermati via connettore, nessun dato utente letto. Nessuna migrazione, adapter o provider implementato, nessun deploy; W7 chiuso solo come architettura, W8/W9 pianificati con gate dichiarati. Preferenza modelli aggiornata: Sol 6.1 high, Astra solo dopo approvazione esplicita in extremis.

## Spazio Studio L0 — 7 ottobre 2026

Preparazione documentale nel [rapporto L0](SPAZIO-STUDIO-AI-L0.md), collegata a [fattibilità](SPAZIO-STUDIO-AI-LOCALE.md) e [prompt](SPAZIO-STUDIO-AI-PROMPTS.md). Nessuna funzionalità AI implementata o pubblicata.

| Verifica | Evidenza osservata e limite |
|---|---|
| Confini applicativi | Letti workspace/navigazione, Appunti/outbox e IndexedDB, tipi/schema, backup/import, account/logout e precache. Confermati il rischio di invio implicito salvando negli Appunti e l'inclusione dei chunk lazy nel precache; nessuna modifica al runtime |
| Candidati e fonti primarie | Individuato EmbeddingGemma 2 Text 270M da 165 MB, revisione e hash pubblicati; selezionati E2B ed eventualmente E4B per il futuro confronto. Nessun peso scaricato né hash calcolato sui byte del modello |
| Distribuzione runtime | Release LiteRT-LM, sorgenti JS e guide consultati; discrepanze fra versioni native/npm, file web/gpu e prefissi registrate. Registry/CDN non leggibili nell'audit, DNS shell bloccato; nessuna compatibilità effettiva attestata |
| Protocollo | Definiti corpus da preparare, baseline, metriche, budget proposti, scenari di errore, persistenza e cancellazione. Nessuna query valutata, nessun corpus annotato già consegnato e nessun dispositivo fisico provato |
| `npm run docs:check` | Passato: inventario allineato, link locali verificati. Non verifica URL esterni, correttezza della prosa, modello o header live |
| `git diff --check` | Passato sul checkout; preservate le modifiche preesistenti. Nessuna suite applicativa o build necessaria per queste sole modifiche documentali |

La parte testuale/manuale può proseguire. Benchmark AI subordinato alla qualificazione del pacchetto/WASM, dei prefissi e dell'artefatto; L1–L4 non eseguiti in questo task. Nessun dato utente letto, agente delegato, accesso ai database o intervento su Sites.

## Spazio Studio L1 — 7 ottobre 2026

Implementazione ed evidenze nel [rapporto L1](SPAZIO-STUDIO-AI-L1.md); sorgenti/istruzioni nel
`experiments/study-local/README.md`. Prova isolata, nessuna pubblicazione o account reale.

| Verifica | Esito e limite |
|---|---|
| `npm run study:check` | Tipi e 15 test passati: parsing/fonti, input/limiti, corpus, ranking, vettori, cancel/deadline/risposte tardive, integrità/abort/storage e rete consentita |
| `npm run study:evaluate` | 16 documenti sintetici, 15 leggibili/43 chunk, 64 query positive + 16 negative; Recall@5 valutazione 0,96875, MRR 0,9375. Ancore esatte, revisione umana indipendente mancante |
| Prova browser | Import corpus/PDF misto, ricerca sentinella, passaggio esatto e markup letterale; avvio GPU nel worker, cache pesi verificata, confronto prefissi su sviluppo, valutazione congelata e cancel/ripartenza. Non è una prova su telefono |
| Utilità embedding | Recall@5 1,00, MRR 0,96875 sul campione; +0,03125 rispetto a BM25; requisito storico +0,05 irraggiungibile da 0,96875 e rettificato nel rapporto L1. Vantaggio locale positivo, nessuna qualifica generale del modello |
| Dipendenze | Versioni/integrità/licenze nel lockfile e report; audit npm laboratorio: zero avvisi pubblicati. Pooling/precisione nativi non certificati indipendentemente |
| `npm run check` app | Lint/tipi, 115 test, 758 chiavi i18n nelle quattro lingue e documentazione passati; le copie generate ignorate da Git sono escluse da lint/tipi |
| Build e isolamento | `npm run build` e `npm run study:build` riusciti; 31 asset nel precache principale, nessun identificativo/asset LiteRT, EmbeddingGemma, PDF.js del laboratorio o studio nel client compilato dell’app |
| Rete/risorse | GET pubblico e hash completo riusciti; guardia fetch senza body/URL arbitrarie, registro locale e console osservati. Mancano cattura integrale della rete, misura memoria/GPU e riapertura offline completa |
| L2–L4 | Non avviati: nessuna mappa persistente, CAS tra account/schede, generazione o integrazione nelle viste. Restano necessari export/import e cancellazione della storia prima del lavoro reale |

## Spazio Studio L2 — 7 ottobre 2026

Contratto e decisioni nel [rapporto L2](SPAZIO-STUDIO-AI-L2.md). Solo laboratorio separato;
nessun account reale, servizio remoto, modifica D1 o pubblicazione.

| Verifica | Esito e limite |
|---|---|
| `npm run study:check` | Tipi e 33 test passati (15 L1 + 18 L2): schema chiuso/limiti, fonti UTF-16, cicli, ID/stato personale, undo, cancellazione/versioni, backup/restore, hash e mapping, CAS, profili, tombstone, abort, rollback dopo put, storage negato/retry e bozza in conflitto |
| Browser locale | Salvataggio/riapertura, fonti sintetiche con emoji e markup letterale, collegamento e visualizzazione, gerarchia e rifiuto del ciclo, rinomina/undo/reload; profilo B inizialmente vuoto e ripristino via JSON con cronologia; notifica di conflitto da seconda scheda osservata |
| Export | Backup completo preparato e ripristinato tramite copia JSON. Evento download non osservato dallo strumento del browser integrato, anche col link esplicito: acquisizione del file su disco non attestata |
| Atomicità/isolamento | Due scritture sulla stessa revisione: una sola accettata. Errore dopo put abortisce l’intero record. Tombstone e token di cancellazione impediscono riscritture obsolete; test con `fake-indexeddb`, non prova di eviction/chiusura forzata |
| `npm run check` app | Lint/tipi, 114 test, 758 chiavi i18n in quattro lingue, inventario e link documentali passati. Il conteggio è quello del checkout corrente; nessuna suite API di produzione eseguita |
| Build | `npm run build` e `npm run study:build` riusciti; shell principale 31 asset. Warning Vinext sulla classificazione route e chunk >500 kB nella build applicativa |
| Residui | Una materia per profilo sintetico; nessuna autenticazione reale. Download file, telefoni/Safari/Firefox, offline completo, quota reale, dataset massimo, localizzazione e accessibilità complete restano da qualificare. L3/L4 non avviati |

## Spazio Studio L3 — 8 ottobre 2026

Banco e limiti nel [rapporto L3](SPAZIO-STUDIO-AI-L3.md). Solo laboratorio locale; nessuna
scrittura generativa nell’archivio L2, integrazione o pubblicazione.

| Verifica | Evidenza e limite |
|---|---|
| Contratto L3 | Tipi e 47 test laboratorio passati: 15 L1 + 18 L2 + 14 L3. JSON chiuso/limiti, citazioni e candidati, HTML/Mermaid/tool/ID inventati, relazioni/cicli, diff senza note personali, quota, hash/abort anche durante lettura cache, rete fissata, annotazioni PDF/TXT reali, denominatori e watchdog/risultati tardivi |
| App | `npm run check` passato: lint, tipi, 114 test, i18n 758 chiavi e documentazione. Nessun codice del diario/Appunti modificato da L3 |
| Build e isolamento | Build app e laboratorio riuscite; 31 asset shell principali. Nessun identificativo Gemma/LiteRT, `study-proposals-v1`, `study-graph-v1` o PDF.js nel client/precache dell’app |
| Pesi e avvio reale | File E2B 2.008.432.640 byte completato, SHA-256 verificato e conservato in OPFS. Backend web `GPU_ARTISAN` avviato in 3.073 ms; `experiments/study-local/reports/l3-runtime-probe.json`. Non equivale a inferenza o qualità qualificate |
| Cancel reale | Annullati download parziale e riverifica cache; interfaccia azzerata. Round trip automazione del secondo comando 965 ms; tempi UI/GPU universali non certificati |
| Qualificazione generativa | Esito negativo E2B/prompt v1: 3/43 sezioni completate, 6 output rifiutati, quarta sezione oltre watchdog 30 s. `experiments/study-local/reports/l3-corpus-attempt.json`. Diagnosi separata: 2 ulteriori output non parsabili come JSON. Ramo embedding non raggiunto, nessuna metrica semantica o beneficio del recupero dichiarato. Accettazione e L4 sospesi |
| Persistenza dopo errore | Riaperto profilo sintetico A con due concetti, fonte, nota e stato personali L2 conservati |


## Spazio Studio — ripresa diagnostica, 8 ottobre 2026

[Evidenze e decisione](SPAZIO-STUDIO-AI-RIPRESA.md); risultati storici conservati, criterio
L1 +5pp rettificato perché impossibile da 96,875%.

| Verifica | Esito |
|---|---|
| Nuovo campione L1, inferenza reale | 48 passaggi/16 positive/4 negative, protocollo predefinito: Recall@5 0,9375 vs 0,375 BM25; MRR 0,6604 vs 0,3333, p95 43,6 vs 0,3 ms. Ranking stabili su 5 ripetizioni; astensione non calibrata e gold umani da verificare |
| Diagnosi E2B reale | Fonte DNS fissa, risposta finale ispezionata: v1 fence + radice errata; con ID lungo errore di chiusura array, 374/1024 token. Thinking assente nelle risposte osservate. API/documenti ufficiali confrontati con SDK 0.18.0 installato |
| Correzioni laboratorio | Messaggio utente reale, esempio estraneo, alias con doppia validazione, metadati senza testo personale; bundle worker dev aggiornato per job. Pagine/sink sintetici esclusi dalla build |
| Confronto corpus v3 | 43 sezioni previste per modalità. Senza recupero 10 valide/29 rifiutate/4 timeout. Con 270M 2 valide/33 rifiutate/7 timeout/1 interruzione ambiente non osservabile. Nessuna conclusione di qualità umana o aggiornamento AI della mappa |
| Revisione | Scheda HTML di 86 sezioni/modalità con fonti; giudizi umani vuoti. Copertura/supporto/duplicati/stabilità null; nessun L4 o deploy |
| Verifiche finali ripresa | Tipi + 52 test laboratorio, build laboratorio, documentazione e diff whitespace passati. 12 proposte canoniche rilette; ranking senza documenti correnti/futuri. Sei report storici con hash invariati; riapertura L2 in sola lettura con 2 concetti, nota e stato presenti |


## W8-A — 17 ottobre 2026, ambiente locale isolato

[Rapporto, fonti e gate](improvement-2026-10-01/AUTH-COMPATIBILITY-W8A.md). Espansione 0007, adattatore legacy/credentials e correzioni security: `npm run check` con 135 test, 8 test D1 dedicati (contenitore incluso), 146 controlli API e build/precache passati. Migrazioni Wrangler applicate soltanto al nuovo D1 locale sintetico in /private/tmp. Browser build finale: login/Home/moduli sicurezza/logout in italiano, scuro, 591×853; account ripulito. Revisione separata Sol high senza blocchi individuati. Nessuna prova provider/cutover operativo/restore o sui device fisici, nessun accesso ai DB remoti o deploy. La rimozione delle colonne nella fixture D1 verifica l’adattatore e non consegna una 0008 di rollout. Checkout preesistente preservato; l’esito W7 «pulito / Sites 29» resta storico.

## W8-A — separazione operazioni e restore locale, 17 ottobre 2026

[Runbook](../operations/w8a/RUNBOOK.md) e [rapporto aggiornato](improvement-2026-10-01/W8A-RELEASE-PREPARATION.md): 0007 solo schema, bootstrap esplicito e copia opzionale paginata separati; auth resta fenced senza bootstrap. 10 test D1 dedicati passati. Export/restore Wrangler locale pre/post espansione: 15/23 tabelle, 45/89 oggetti schema, tutte le righe, FK, password, sequenze e fence verificate; DB sorgente invariato. Primo import del dump completo fallito per ordine FK; corretto creando schema prima dei dati e trigger dopo. Metadati Sites riconfermano 39/succeeded, DB con le sole 15 tabelle legacy visibili senza troncamenti, domini/TLS attivi; nessuna riga utente letta. Nessun ambiente di prova iPagell disponibile nell’elenco dei Site posseduti. Non esposti dal connettore SQL amministrativo, export/import o restore: gate gestito HTTPS ancora aperto; nessun deploy autorizzato/eseguito.

## W8-A — qualifica canale Sites da cd38d40, 17 ottobre 2026

[Qualifica](../operations/w8a/PLATFORM-QUALIFICATION.md) e [prove strutturate](../operations/w8a/evidence/sites-channel-20261017/observations.json): 25 strumenti Sites esposti e riferimenti storage esaminati, nessun SQL amministrativo/backup/restore isolato disponibile in questa superficie. Ricerca integrazioni senza un canale aggiuntivo pertinente; capacità interne dell’operatore non escluse. Produzione riconfermata Sites 39/succeeded, sorgente `a8cf046fe2cbe804cebdb80957e1ffa2c88893f1`, pubblico, domini/TLS active, DB con 15 tabelle legacy e nessuna omissione; nessuna riga letta. L’utente autorizza ora soltanto creazione e deploy di un ambiente di prova privato distinto con DB dedicato e dati sintetici. Canale amministrativo mancante: blocco mantenuto, nessuna creazione/deploy o SQL remoto; HTTPS/bootstrap/backup/restore isolati non eseguiti. Nessuna nuova prova locale come sostituto. Occorre l’intervento del responsabile Sites descritto nella [richiesta operativa aggiornata](../operations/w8a/PLATFORM-REQUEST.md), non inviata.

## W8-A security — schema invariato e prova Sites privata, 17 ottobre 2026

[Rapporto corrente](improvement-2026-10-01/W8A-RELEASE-PREPARATION.md) e [prove](../operations/w8a/evidence/security-no-migration-20261017/README.md): sicurezza separata dalla 0007, ora rinviata fuori dal runner; schema/journal/SQL attivi coincidono con Sites 39. 137 test app, 15 test D1, 146 API locali, build e doc passati. Nuovo Site privato distinto con binding DB inizialmente vuoto: baseline 1 → candidato 2 → rollback 1 → candidato 2, tutti succeeded. Login, cambio password, recupero/revoca, stesso ID/diario/nota verificati via HTTPS; account sintetici eliminati, tabelle fixture vuote. Produzione ancora Sites 39 e invariata. È rollback Worker su DB invariato, non backup/restore DB; gate amministrativo conservato per l’espansione futura. Nessuna 0008, cutover o provider.
