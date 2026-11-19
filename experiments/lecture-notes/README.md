# Laboratorio Appunti da lezione

**Stato al 10 ottobre 2026: area documentale predisposta; nessun prototipo eseguibile.** Prima prova prevista su notebook Chrome, in italiano. Non ci sono manifest, dipendenze installate, comandi di avvio, pesi, corpus audio o registrazioni.

## Dove iniziare

1. Leggere [AGENTS.md](../../AGENTS.md), [snapshot](../../docs/REPO-SNAPSHOT.md), [architettura](../../docs/ARCHITECTURE-CURRENT.md) e [matrice](../../docs/VERIFICATION-MATRIX.md).
2. Aprire l’[analisi iniziale](../../docs/LEZIONI-LIVE-AI.md): obiettivo, confini dei dati e rapporto con iPagell.
3. Seguire [LN-01 nel piano](../../docs/lezioni-live-ai/PLAN.md), qualificare i candidati del [registro fonti](../../docs/lezioni-live-ai/SOURCES.md) e congelare il [protocollo](../../docs/lezioni-live-ai/EVALUATION.md).
4. Compilare un rapporto dal [modello](../../docs/lezioni-live-ai/REPORT-TEMPLATE.md); riportare anche esiti negativi e verifiche mancanti.

## Confini per l’implementazione successiva

Build, manifest/lockfile, origine e cache propri; nessun import di hook, account/storage o API dell’app né dipendenza dal laboratorio `study-local`. Origine proposta `127.0.0.1:5175`, da verificare e configurare, con profilo Chrome di prova senza credenziali. Il solo cambio di porta non isola i cookie per host.

Il banco è locale: nessuna pubblicazione Sites/Worker o modifica ai database. Audio del microfono e trascrizione sono temporanei; niente upload, telemetria o salvataggio nascosto. Persistenza/export ammessi soltanto per l’appunto finale esplicitamente confermato. Cache dei modelli distinta e rimovibile, download su richiesta con integrità verificata.

Fixture audio di test sintetiche/autorizzate possono essere predisposte in `data-local/`, esclusa da Git: sono input del benchmark e non registrazioni prodotte dal flusso live. Il controllo della mancata registrazione richiede prove separate di rete/storage/stop.

Versionare istruzioni, futuri sorgenti, lockfile, manifest delle fixture, annotazioni sintetiche e rapporti ripuliti. Tenere pesi, audio, tracce grezze e credenziali nei percorsi locali esclusi. Le regole Git limitano aggiunte accidentali; non impediscono `git add -f` né sostituiscono la verifica dei file da consegnare.

L’area è separata per organizzare il lavoro. La separazione del futuro runtime sarà un esito di LN-01, non una capacità già verificata.
