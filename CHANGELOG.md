# Registro modifiche

## Non rilasciato — 19 novembre 2026, revisione usabilità e accessibilità dei Voti

- Simulatore «Che voto mi serve?»: il peso della prossima prova si può cancellare e riscrivere (anche 0.5 o 0,5) e si normalizza solo all'uscita dal campo; l'obiettivo si salva poco dopo la modifica, al rilascio del cursore e cambiando vista, non più solo alla perdita del focus; il risultato è annunciato ai lettori di schermo.
- Elenco voti: la media grande usa il colore del testo con la tinta della materia come sottolineatura, per un contrasto indipendente dal colore scelto; note lunghe vanno a capo; senza nota il tipo di prova non è più ripetuto; il pulsante elimina indica voto e data; i pulsanti delle medie espongono la selezione (`aria-pressed`) e il riepilogo per periodo è un gruppo con nome.
- Inserimento voto: un valore non valido mostra l'errore sotto il campo, lo marca come non valido e vi riporta il focus; un clic fuori dalla finestra non scarta più i dati scritti (Esc e Annulla chiudono); pesi dei tipi formattati secondo la lingua.
- Francese: il pulsante appunti si chiama «Notes de {materia}», coerente con l'etichetta visibile. Nuova chiave `grades.deleteItem` in it/de/fr/en. Nessuna modifica a dati, API o schema.

## Non rilasciato — 19 novembre 2026, Classi e Voti più chiari

- Classi: il selettore Attività/Appunti ha due metà fisse e lo stesso peso del testo, quindi non cambia dimensione alla selezione; l'etichetta diventa «Appunti».
- Voti: tolte le spiegazioni ripetute (etichette sopra i filtri, «Registro voti», avviso sulla media, nota della simulazione). La scheda mostra materia, media e numero di voti; ogni voto ha una sola riga con data, peso solo se diverso da 1× e periodo solo se se ne vedono più di uno. L'avviso «Media indicativa, non voto ufficiale» resta in Statistiche.
- Intestazioni più brevi: «Privato» e «Condiviso con la classe». Testi aggiornati in it/de/fr/en; rimosse le chiavi non più usate. Nessuna modifica a dati, API o schema.

## Non rilasciato — 19 novembre 2026, controllo del ramo prima del deploy

- `npm run deploy:cloudflare` si ferma se il checkout non è `main`, ha modifiche non committate o non coincide con `origin/main`. Evita che un deploy da un ramo o worktree vecchio tolga funzioni già in produzione. `IPAGELL_DEPLOY_ANY_BRANCH=1` salta il controllo solo per emergenze.
- Allineati changelog, [snapshot](docs/REPO-SNAPSHOT.md) e [architettura](docs/ARCHITECTURE-CURRENT.md) ai rilasci Cloudflare di novembre. Nessuna modifica al runtime.

## 16–19 novembre 2026 — Produzione su Cloudflare, Google e nuova interfaccia

- **16 novembre.** La produzione lascia OpenAI Sites: https://ipagell.website e `www` sono Custom Domains del Worker `ipagell` con D1 `ipagell-live` (UE). Staging separato `ipagell-staging`, backup D1 e bozze legali riallineate all'hosting Cloudflare. I dati di Sites non sono trasferibili: ogni utente usa il backup JSON. [Deploy e verifiche](docs/DEPLOYMENT.md).
- **17–19 novembre.** Dipendenze aggiornate in tre fasi: toolchain nello stesso major, Zod 4.6.7, decisione su picomatch; Next 16.4.6 e React 19.3.1 per le RCE critiche dei Server Components. Audit a zero. [Piano e verifiche](docs/DEPENDENCY-UPGRADE-PLAN-2026-11-17.md).
- **18 novembre.** Ridisegno dell'interfaccia in stile Liquid Glass con accento blu e nuova home pubblica con testi più brevi. [Analisi](docs/UI-REDESIGN-2026-11-18.md).
- **19 novembre.** Migrazioni 0007+0008 applicate a `ipagell-live` (stato `7/legacy`), accesso con Google, conferma età e pagina `/legale` con informativa aggiornata. Le linee dipendenze e Google sono state unite e pubblicate come Worker `0c792282` (PR 16). [Piano W8-B](docs/improvement-2026-10-01/W8B-PIANO-CLOUDFLARE.md).

## Non rilasciato — 19 novembre 2026, presentazione GitHub in inglese

- README principale in inglese con screenshot, badge CI e sito, struttura del progetto e deploy; versione italiana in `README.it.md`.
- CONTRIBUTING e SECURITY tradotti in inglese; SECURITY indica ora un canale di segnalazione privato. Aggiunti codice di condotta, modelli di issue e di pull request; nomi del workflow CI in inglese.
- `docs:check` controlla anche `README.it.md` e `CODE_OF_CONDUCT.md`. Solo documentazione e metadati: nessuna modifica al runtime, nessun deploy necessario.

## 22 ottobre 2026 — Sicurezza runtime e toolchain

- Node minimo aggiornato alle release corrette del 21 ottobre; `.nvmrc`, CI e controllo preventivo bloccano runtime vulnerabili, fuori supporto o non ancora verificati.
- Vite 8.0.16 → 8.1.6 e lockfile aggiornato per cinque advisory del server di sviluppo; preservate le correzioni precedenti.
- [Analisi, fonti e verifiche](docs/RUNTIME-SECURITY-2026-10-22.md). Nessuna modifica a dati, autenticazione, schema o domini.

## W8-A security — candidato privato, 17 ottobre 2026

Correzioni security compatibili con lo schema Sites 39 senza bootstrap; espansione 0007 rinviata fuori dalle migrazioni attive. Nessuna modifica alla produzione. Prova HTTPS e rollback del Worker nel solo ambiente privato sintetico; [rapporto](docs/improvement-2026-10-01/W8A-RELEASE-PREPARATION.md). Restore DB gestito e provider restano fuori dal risultato.

## 17 ottobre 2026 — W8-A, operazioni e prova di recupero locale

0007 solo schema; bootstrap esplicito e backfill opzionale limitato fuori dalle migrazioni. Verificati export/restore sintetici locali prima/dopo espansione, preservando dati, FK, sequenze e fencing. [Runbook e limiti gestiti](operations/w8a/RUNBOOK.md). Nessun deploy o dato remoto modificato.


## 17 ottobre 2026 — W8-A, preparazione locale account

Espansione auth 0007, adattatore legacy/credenziali e guardie DB per sospendere le scritture durante un futuro cutover. Cancellazione account con versione/sessione ricontrollate su tutti gli effetti; flush appunti prima della richiesta e pulizia locale limitata all’ID catturato. Eccezioni server senza testo sensibile nei log. [Evidenze e gate](docs/improvement-2026-10-01/AUTH-COMPATIBILITY-W8A.md). Verificato soltanto in ambiente locale sintetico; nessuna migrazione remota, provider o pubblicazione.


## 15 ottobre 2026 — Campi data su iOS

- Separati padding e bordo dai campi data/ora nativi per evitare l’allargamento del pannello su iOS. Colonne dei moduli restringibili; selettore nativo e dati invariati.
- Correzione condivisa fra voto, agenda, assenza, semestri, setup e attività di classe. [Analisi e verifiche](docs/IOS-DATE-OVERFLOW-2026-10-15.md).

## 15 ottobre 2026 — Rifinitura delle interazioni

- Feedback mirati, finestre e menu coerenti, chiusura accessibile e ripristino del focus dopo il passaggio dalle Impostazioni agli editor.
- Titoli mobili completi, navigazione selezionata più chiara e schede delle Impostazioni adattive al testo ingrandito.
- [Analisi e verifiche](docs/APPLE-DESIGN-2026-10-15.md); pubblicazione registrata nel [registro](docs/DEPLOYMENT.md).


## Non rilasciato — 10 ottobre 2026, preparazione Appunti da lezione

- Predisposta una nuova sperimentazione documentale per ascolto locale, trascrizione italiana e appunto per materia, con notebook Chrome come primo dispositivo confermato.
- Aggiunti [analisi](docs/LEZIONI-LIVE-AI.md), piano LN-00–LN-05, fonti primarie, protocollo di efficacia e modello rapporto; area separata `experiments/lecture-notes` con esclusioni Git per audio, pesi e tracce locali.
- Definiti confini di conservazione, prova del filtro delle digressioni e verifiche prima del pilota scolastico. Nessun codice, dipendenza, modello scaricato, benchmark o deploy; verifiche documentali nella [matrice](docs/VERIFICATION-MATRIX.md).

## Agenda — 10 ottobre 2026 (Sites 37)

- Elenco con attività da fare in testa, gruppi per giorno locale e storico Completate/Annullate richiudibile; scadenze passate mai completate automaticamente.
- Righe con titolo e data leggibili, descrizioni nei Dettagli, Appunti diretto e menu contestuale per comandi secondari. Focus conservato dopo completamento/riapertura.
- Riepilogo calendario con conteggio parziale e ingresso all’elenco completo; dettaglio del giorno visibile mobile, annullate escluse dalle aperte.
- Pubblicata in Sites 37, confermata in produzione desktop/mobile. Cinque regressioni mirate e prove sulla build compilata; [analisi e limiti](docs/AGENDA-LIST-2026-10-10.md). Nessuna nuova API, migrazione o preferenza persistente.

## 10 ottobre 2026 — Riduci movimento: geometria e comportamento (Sites 36)

- Eliminato il doppio spostamento del cursore nel CSS compilato; controllate dimensioni, stati, tastiera, temi e layout mobile nelle quattro lingue.
- La preferenza ora disattiva anche le animazioni dei grafici e non resta sulla pagina dopo l’uscita dal diario. Note e sistema conservano il movimento ridotto previsto.
- Corretti i tagli della finestra Impostazioni su schermi piccoli; aggiunta una descrizione operativa breve e due prove di persistenza/backup. [Evidenze e limiti](docs/UX-SIMPLIFICATION-2026-10-10.md#regressione-del-toggle-e-copertura-del-movimento--10-ottobre).

## 10 ottobre 2026 — Toggle Riduci movimento (Sites 35)

- Ripristinata la visibilità dell’interruttore in Impostazioni: colori collegati ai token dell’app, focus visibile, etichetta cliccabile e area 52×44 px, affiancata al testo anche su mobile.
- Prove mirate in chiaro/scuro con mouse e tastiera; [causa e soluzione](docs/UX-SIMPLIFICATION-2026-10-10.md#correzione-riduci-movimento--10-ottobre). Pubblicazione nel [registro](docs/DEPLOYMENT.md).

## 10 ottobre 2026 — Correzione audit dipendenze (Sites 34)

- Corrette le tre cause delle 13 segnalazioni high che bloccavano la CI: sharp 0.35.5, source-map-js 1.2.2 e patch locale braces a profondità limitata, con licenza/provenienza conservate.
- Sette regressioni sulle dipendenze eseguite prima dell’audit completo; mantenute toolchain e soglia audit. [Analisi, verifiche e manutenzione](docs/DEPENDENCY-SECURITY-2026-10-10.md). CI verde con 121 test e audit del registro a zero; pubblicazione Sites 34 succeeded il 10 ottobre, sorgente `f2200a94f72ce7c7d49081ea4229b9af0a5ac386`. [Registro](docs/DEPLOYMENT.md).

## 10 ottobre 2026 — Lettura e gerarchia dell’app (Sites 33)

- Lettore appunti con ritorno all’elenco visibile e operazioni occasionali nei tre punti; export in finestra dedicata.
- Altri appunti della stessa materia sotto il testo, in riquadri discreti; sostituzione del lettore, focus al titolo e transizione breve con movimento ridotto rispettato.
- Semplificati controlli e testi di Home, Agenda, Voti, Assenze, Classi e Impostazioni.
- Nessuna modifica a schema, contratti API, formule o permessi. Verifiche incrementali e limiti in [analisi UX](docs/UX-SIMPLIFICATION-2026-10-10.md).

[Documentazione](docs/README.md) · [Pubblicazione](docs/DEPLOYMENT.md) · [Verifiche](docs/VERIFICATION-MATRIX.md)

Versione npm, formato del diario, backup, revisione dati e numero Sites sono contatori distinti. Le voci di rilascio riportano solo pubblicazioni documentate; il [registro precedente](docs/archive/CHANGELOG-HISTORY.md) conserva i passaggi storici.

## Non rilasciato — 7 ottobre 2026, laboratorio Spazio Studio L1

- Aggiunto laboratorio Vite separato per testo/TXT/PDF, originali temporanei, citazioni precise, BM25 e annullamento dei worker; nessun accesso agli Appunti o ai dati dell’account.
- Fissati runtime/parser/hash in lockfile proprio; download modello esplicito con controllo byte/SHA-256 e cache dei soli pesi. Confronto EmbeddingGemma Text 270M su corpus sintetico; beneficio sotto la soglia di utilità fissata, AI ancora sperimentale.
- Aggiunti 16 fixture, protocollo/rapporti e 15 test mirati; controllata esclusione degli asset dal bundle/precache dell’app. Escluse dai controlli le copie di output già ignorate da Git. Nessuna pubblicazione.

## Non rilasciato — 7 ottobre 2026, preparazione Spazio Studio L0

- Verificati nel codice workspace, Appunti/outbox, materia/import, account/logout, backup e precache; definito un percorso studio locale distinto da diario e note sincronizzate.
- Aggiunto il [rapporto operativo L0](docs/SPAZIO-STUDIO-AI-L0.md): candidato EmbeddingGemma 2 solo testo da 165 MB, generatori da confrontare, fonti primarie, protocollo quantitativo iniziale e copertura delle considerazioni su fonti, cancellazione, privacy e recupero.
- Registrate le discrepanze runtime/file/prefissi e i residui prima del benchmark; aggiornati fattibilità e prompt. Nessun runtime, dipendenza, migrazione, modello scaricato o deploy; L1–L4 non avviati.

## 2026-10-01 — Sites 29 — Materie continue, anno e storico

- Voti/Statistiche condividono Periodo, Anno scolastico e Tutto lo storico, con anno iniziale e materia conservata al ritorno. Conteggi, provenienza, dettaglio periodi, trend cumulativo con anno e accesso allo storico anche dal periodo vuoto.
- Media dei singoli voti ponderati fra periodi, inclusi archiviati, senza fusioni di etichette o materie omonime. Scritture separate: nuovo voto con materia selezionata e periodo reale esplicito, Home/Agenda/Assenze invariati. Nessuna migrazione.
- Simulatore riferito al filtro Periodo/Anno, storico senza previsione; corretto il prodotto positivo dei pesi futuri 0,01. Quattro lingue, CSS per nomi lunghi e otto test semantici. Stato effettivo nel [rapporto](docs/improvement-2026-10-01/VERIFICATION.md).
- Pubblicato in Sites 29: sorgente `02cb8843867987dbb3552e049fd1aecd5f755352`, deployment `appgdep_6abe8ea156008191bdddc2141ffb5162` succeeded; 115 test, 146 controlli API locali e prove browser, domini/TLS preservati.


## Non rilasciato — workflow e modelli

- Assegnati modelli ed effort consigliati ai 14 prompt, con revisione delle attività critiche e workflow completo W0–W15.
- Aggiunti dipendenze, criteri di chiusura, stime dichiarate delle sessioni e scenari API distinti dall’uso in Codex. Fonti ufficiali OpenAI verificate il 1 ottobre 2026.
- Documento operativo; nessuna configurazione globale di modello o modifica alla produzione.

## Non rilasciato — analisi dei sistemi di valutazione

- Collegati GRADING-SYSTEM e ricerche iniziali multilingua/SEO/prodotto alla nuova analisi multi-sistema, con fonti primarie e vincoli verificati nel codice.
- Aggiunti cinque prompt (10–14) per ricerca, modello/compatibilità, primo rilascio numerico, metodi qualitativi/complessi e QA; programma ora comprende 14 prompt.
- Integrata la futura compatibilità dei sistemi nel piano annuale: registro continuo, aggregati separati se le scale non sono comparabili. Nessuna modifica a runtime, payload, database o produzione.

## 2026-10-01 — Sites 28, ingresso, SEO e programma di miglioramento

- Landing localizzata: diario scolastico esplicito, quattro benefici compresi Appunti, scala 1–6, prova del calcolatore, tre passi e privacy aggiornata. Titoli/descrizioni SEO dedicati.
- Registrazione con progressione, aiuto username, mostra/nascondi password e setup progressivo; recupero conservato in caso di errore durante la continuazione. Home spiega la prima azione e riconosce appunti già presenti.
- Contrasti e focus migliorati nell’ingresso e nei token di tema; audit specialistici, piano e nove prompt di lavoro riutilizzabili. Google/Apple/email restano pianificati.
- Conferma identità prima di lasciare il form, senza fallback a un altro account offline; tre test di regressione. Token testo/fondo separati nel tema scuro per mantenere contrasto dei pulsanti. Verifica link documentali estesa anche alle sottocartelle dei prompt.
- Nessuna nuova API o migrazione database. Verifiche e stato della pubblicazione nel [rapporto del ciclo](docs/improvement-2026-10-01/VERIFICATION.md).

## 2026-10-01 — Sites 28, documentazione, repository e dipendenze

- Allineate le guide correnti al codice applicativo Sites 27: architettura, API, appunti/editor, backup V3, materie di classe, sicurezza, lingua e flussi utente.
- Aggiunto indice con guide, specifiche future e storico; conservati gli audit e design iniziali con riferimenti espliciti alla loro versione.
- Inventario generato di route/metodi, schema/migrazioni, script npm e versioni da lockfile; docs:check rileva il disallineamento, include i link di AGENTS.md e rifiuta destinazioni ignorate da Git che mancherebbero nel clone CI.
- Output della ricerca e bytecode Python ignorati, sorgenti conservati.
- Aggiornati Next ed eslint-config-next a 16.3.8, plugin Cloudflare a 1.62.3, Wrangler a 4.145.0 e workers-types a 5.20261001.1; lockfile aggiornato anche per fast-uri. L'audit completo passa da sei pacchetti segnalati a zero nel controllo del 1 ottobre. Questo esito non equivale a un audit di sicurezza dell'app.

Queste modifiche e le dipendenze aggiornate sono incluse nella versione Sites 28. Sorgente `8fee251e1b942d3392ca92ab9381be4c0a6ae1c8`, deployment `appgdep_6abe63d2394c8191a6ee91547a4e3008` con stato `succeeded`. Preparazione: 106 test, 146 controlli API locali e build; prove browser con account sintetici ripuliti. Google/Apple/email e vista annuale restano pianificati. Nessuna nuova migrazione o modifica a binding, accesso e domini.

## 2026-10-01 — Sites 27, affidabilità Appunti

- Confronto e transizioni IndexedDB atomici: le conferme della propria sincronizzazione non generano falsi conflitti e non scartano modifiche successive.
- Payload in volo persistito per retry dopo risposta persa, protezione di veri conflitti e pagine vecchie, correzione dopo rifiuto definitivo.
- Coda autosave comune per personale/classe: flush sovrapposti e modifiche durante salvataggio; un refresh UI fallito non invalida il commit locale.
- A-capo canonici anche in titoli ed elementi di elenco, con grassetto e testo multilinea.
- Comandi rifiutati conservano testo/stato; bozza di classe mantiene la revisione iniziale, con retry/copia/download dopo errore.

Sorgente Sites `9535676a53a75f9ff52cf90a501435e1bcee40db`, deployment `appgdep_6abe17938bf48191938483d415de60bf` riuscito. Prima del rilascio: 103 test, 146 verifiche API locali, build e prove browser con dati sintetici. Nessuna nuova migrazione. QA su telefoni fisici aperta.

## 2026-10-01 — Sites 26, percorso e focus Appunti

- Ingressi da Home, Agenda e materia in Voti; ritorno al contesto e conservazione della vista Agenda nello stesso workspace.
- Aggiunta materia nell'editor senza perdere il testo, gerarchia delle bozze/copie e separazione Attività/Appunti della classe.
- Toolbar persistente e bookmark di selezione; comandi di titolo/lista reversibili senza perdere i blocchi selezionati.

Sorgente Sites `26c10606aaec54b17e44f94244714a1ad1fefedf`, deployment `appgdep_6abe0a69171c819198a8548fb90519c3` riuscito. Prima del rilascio: 87 test, 130 verifiche API locali e build; responsive/focus nel browser, senza certificazione fisica.

## 2026-09-30 — Sites 24, appunti e editor visivo

- Appunti personali per materia con persistenza separata dal diario, outbox, revisioni/cursore e bozze sul dispositivo.
- Materie e note della classe con permessi, pin per membro, archivio autore, copie indipendenti e anteprima prima di pubblicare.
- Editor ProseMirror condiviso; formati plain/md-lite-v1, lettore sicuro ed export PDF/Markdown con font locali.
- Contratto API Appunti 2, migrazioni additive 0005/0006 e formato esplicito; vecchi testi restano plain.
- Backup V3 con import V1/V2 e piano riprendibile; note di classe importate come copie personali.

Pubblicazione e verifica delle colonne content_format del D1 registrate in [DEPLOYMENT](docs/DEPLOYMENT.md). I limiti delle prove PDF/mobile sono conservati nella matrice.

## Evoluzione precedente presente nel sorgente

- Lingue it/de/fr/en, route pubbliche localizzate, metadata, manifest e calcolatore pubblico della media.
- Controller diary-session, CAS IndexedDB, protezione cambio account e riconciliazione delle risposte perse del diario.
- Gruppi privati C1, attività C2 e sottoscrizioni personali C3, cache separata e coordinamento delle mutazioni.
- Evoluzione UX/copy, componenti Assenze/Statistiche estratti, scala numeric-1-6 centralizzata senza modifica delle formule.
- Produzione Sites sul dominio canonico; Worker indipendente riservato a sandbox, CI di controlli/audit/build e preparazione distinta dal deploy.

Questa sezione descrive codice esistente senza assegnare numeri o date di pubblicazione non accertati. Analisi e prove precedenti sono nell'[indice storico](docs/README.md#materiale-di-progetto-e-storico).

## 2026-09-16 — Sites 2, storico

- Account interni, password scrypt, sessioni cookie, codice recupero e limiti ai tentativi.
- Snapshot D1 per account, copia locale e conflitti; dati demo personali rimossi.
- Tipi voto con ID stabili, notazione 4-5, simulatore con pesi e service worker con API escluse dalla cache.

Evidenze riferite a quel rilascio: [REVIEW](docs/archive/REVIEW.md). Non attestano automaticamente la versione corrente.
