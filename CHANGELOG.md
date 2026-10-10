# Registro modifiche

## 10 ottobre 2026 — Toggle Riduci movimento

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

Versione npm, formato del diario, backup, revisione dati e numero Sites sono contatori distinti. Le voci di rilascio riportano solo pubblicazioni documentate; il [registro precedente](docs/CHANGELOG-HISTORY.md) conserva i passaggi storici.

## 2026-10-01 — Materie continue, anno e storico (in verifica/pubblicazione)

- Voti/Statistiche condividono Periodo, Anno scolastico e Tutto lo storico, con anno iniziale e materia conservata al ritorno. Conteggi, provenienza, dettaglio periodi, trend cumulativo con anno e accesso allo storico anche dal periodo vuoto.
- Media dei singoli voti ponderati fra periodi, inclusi archiviati, senza fusioni di etichette o materie omonime. Scritture separate: nuovo voto con materia selezionata e periodo reale esplicito, Home/Agenda/Assenze invariati. Nessuna migrazione.
- Simulatore riferito al filtro Periodo/Anno, storico senza previsione; corretto il prodotto positivo dei pesi futuri 0,01. Quattro lingue, CSS per nomi lunghi e otto test semantici. Stato effettivo nel [rapporto](docs/improvement-2026-10-01/VERIFICATION.md).

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

Evidenze riferite a quel rilascio: [REVIEW](docs/REVIEW.md). Non attestano automaticamente la versione corrente.
