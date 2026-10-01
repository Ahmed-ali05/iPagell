# Registro modifiche

[Documentazione](docs/README.md) · [Pubblicazione](docs/DEPLOYMENT.md) · [Verifiche](docs/VERIFICATION-MATRIX.md)

Versione npm, formato del diario, backup, revisione dati e numero Sites sono contatori distinti. Le voci di rilascio riportano solo pubblicazioni documentate; il [registro precedente](docs/CHANGELOG-HISTORY.md) conserva i passaggi storici.

## Non rilasciato — documentazione, repository e dipendenze

- Allineate le guide correnti al codice applicativo Sites 27: architettura, API, appunti/editor, backup V3, materie di classe, sicurezza, lingua e flussi utente.
- Aggiunto indice con guide, specifiche future e storico; conservati gli audit e design iniziali con riferimenti espliciti alla loro versione.
- Inventario generato di route/metodi, schema/migrazioni, script npm e versioni da lockfile; docs:check rileva il disallineamento e include i link di AGENTS.md.
- Output della ricerca e bytecode Python ignorati, sorgenti conservati.
- Aggiornati Next ed eslint-config-next a 16.3.8, plugin Cloudflare a 1.62.3, Wrangler a 4.145.0 e workers-types a 5.20261001.1; lockfile aggiornato anche per fast-uri. L'audit completo passa da sei pacchetti segnalati a zero nel controllo del 1 ottobre. Questo esito non equivale a un audit di sicurezza dell'app.

Queste modifiche aggiornano la repository, gli strumenti di verifica e le dipendenze. La versione applicativa pubblicata resta Sites 27; le correzioni successive delle dipendenze richiedono un nuovo rilascio Sites e il push GitHub non costituisce un deploy.

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
