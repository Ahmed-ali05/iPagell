# iPagell — Matrice di verifica corrente

[Indice](README.md) · [Snapshot](REPO-SNAPSHOT.md) · [Architettura](ARCHITECTURE-CURRENT.md) · [Pubblicazione](DEPLOYMENT.md)

Aggiornamento: **1 ottobre 2026**. Riferimento applicativo corrente: Sites 28, sorgente `8fee251e1b942d3392ca92ab9381be4c0a6ae1c8`. Le prove dell’audit iniziale sotto fanno riferimento a Sites 27. Il precedente audit `c780569…`, le contraddizioni allora presenti e i risultati dei rilasci precedenti sono in [VERIFICATION-HISTORY](VERIFICATION-HISTORY.md). Non vanno letti come affermazioni sul codice attuale.

## Semplificazione UI — 10 ottobre 2026


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

| GitHub | Sorgente e documenti nella [PR 5](https://github.com/Ahmed-ali05/iPagell/pull/5). CI del 10 ottobre ferma prima di release:prepare: audit npm segnala 13 vulnerabilità high nelle catene braces, sharp e source-map-js. Main non integrato; dipendenze non cambiate in questo intervento UI. |

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
| Schema versionato contiene 15 tabelle e 7 migrazioni, non duplicati “schema 2”. | [Inventario generato](REPO-INVENTORY.md), AST schema e confronto journal/SQL | Non prova che un DB remoto contenga soltanto queste tabelle. |
| Appunti personali e di classe hanno formati espliciti, quote, revisioni e ID di mutazione. | `lib/notes/validation.ts`, `note-repository.ts`, 0005/0006, test notes/API | Non c'è storico completo o cestino. |
| Il confronto della bozza personale tollera metadati aggiornati dalla propria conferma, conserva nuove modifiche e protegge altri writer. | `reconcile.ts`, transazione `updatePersonal`, `tests/note-storage.test.ts` | Nessuna co-scrittura o fusione automatica. |
| Una risposta persa ritenta il payload persistito inFlight; pagine vecchie non fanno regredire nota/cursore. | `use-notes.ts`, `storage.ts`, test di outbox/ack/pagine | Dipende dall'accessibilità dello storage locale; inFlight non è un backup. |
| Il commit locale riuscito resta riconosciuto se fallisce il refresh UI; errore reale permette retry. | `persistAndNotify`, `DraftAutosaver`, `tests/note-autosave.test.ts` | Non promette persistenza se IndexedDB abortisce o il browser viene terminato. |
| I due editor condividono autosave/flush; bozza classe conserva la base aperta e richiede conferma. | `use-note-autosave.ts`, entrambi i componenti, test e prova browser | Una riconnessione non pubblica la bozza. |
| md-lite-v1 round-trip gestisce a-capo in paragrafi, titoli e liste; lettura/anteprima usano AST chiuso. | `format.ts`, `NoteContent`, `tests/note-format.test.ts`, API | Solo grammatica ammessa, non Markdown generale. |
| Backup V3 preserva formato; importa V1/V2; copie classe diventano personali con piano riprendibile. | `backup.ts`, `types/notes.ts`, test notes e UI import | Restore di backup reale utente non eseguito; nessun restore infrastrutturale verificato. |
| Lingua interfaccia è separata da scala voti e payload; calcolatore pubblico non persiste input. | `lib/i18n/**`, `grading.ts`, calcolatore e relativi test | Revisione linguistica umana e altre scale restano aperte. |
| PWA esclude API/RSC dalla cache e non forza skipWaiting; reminder richiede app aperta. | `public/sw.js`, generatore, `install-app.tsx`, test service worker | Non garantisce installazione/aggiornamento su ogni browser. |
| CI installa da lockfile, esegue audit e release:prepare; non pubblica e non lancia suite API/browser. | `.github/workflows/check.yml`, `package.json` | Il singolo esito CI deve essere letto sul relativo commit. |

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

Google/Apple/email e la vista della materia per anno/storico restano pianificati nel [programma e prompt](improvement-2026-10-01/PLAN.md), non sono nuove capacità runtime. La revisione dei semestri verifica che le materie sono già comuni ai periodi: il limite corrente è il filtro di Voti/Statistiche. Nessun dato migrato né voto ufficiale annuale inferito.


## Pianificazione multi-sistema — 1 ottobre 2026

Aggiunta l’[analisi dedicata](improvement-2026-10-01/GRADING-EXTENSION-AUDIT.md), riutilizzando le ricerche iniziali e verificando tipi, calcoli, UI, schema strict, persistenza e backup. Fonti scolastiche primarie consultate per le famiglie candidate; cinque prompt (10–14) aggiunti al programma. Controlli documentali nel rapporto del ciclo. Non sono stati implementati nuovi preset, contratti o migrazioni; la produzione resta Sites 28 e `numeric-1-6`.


## PERIODS-01 — consultazione annuale e storico

Il [rapporto del programma](improvement-2026-10-01/VERIFICATION.md) distingue la nuova patch da Sites 28: 114 test, 146 verifiche API locali, journey annuale/storico con corrente vuoto, omonimi/archiviati, destinazione esplicita e annullamento, quattro lingue, desktop e 320/390 px chiaro/scuro. Nessuna migrazione o nuova scala. Stato pubblicazione nel rapporto; non dedurlo dalla build. Residui device fisici e verifica utenti restano aperti.
