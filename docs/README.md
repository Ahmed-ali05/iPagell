# Documentazione di iPagell

[Repository](../README.md) · [Software pubblicato](https://ipagell.website)

Aggiornamento: **1 ottobre 2026**. Le guide correnti descrivono la pubblicazione Sites **28**, compresi ingresso/SEO, documentazione, inventario e correzioni delle dipendenze. Esiti e limiti sono nel [changelog](../CHANGELOG.md) e nel [rapporto del ciclo](improvement-2026-10-01/VERIFICATION.md). Codice, test locali, CI GitHub e produzione sono evidenze distinte; una build o un push non attestano un deploy.

## Da dove iniziare

| Esigenza | Documento |
|---|---|
| Usare il diario, gli appunti o le classi | [Guida utente](GUIDA-UTENTE.md) |
| Orientarsi prima di modificare il codice | [Snapshot corrente](REPO-SNAPSHOT.md), [Architettura corrente](ARCHITECTURE-CURRENT.md) |
| Componenti, formule e persistenza in sintesi | [Architettura e dati](ARCHITETTURA.md) |
| Endpoint, payload, autorizzazioni ed errori | [Contratto API](API.md) |
| Installazione, D1 locale, verifiche e incidenti | [Manutenzione](MANUTENZIONE.md) |
| Pubblicare e distinguere GitHub da Sites | [Sviluppo e pubblicazione](DEPLOYMENT.md) |
| Capire quali affermazioni sono dimostrate | [Matrice di verifica corrente](VERIFICATION-MATRIX.md) |
| Route, tabelle, migrazioni, script e versioni esatte | [Inventario generato](REPO-INVENTORY.md) |
| Protezione dati e segnalazioni | [Sicurezza](../SECURITY.md) |
| Evoluzione e rilasci | [Changelog](../CHANGELOG.md) |

## Funzioni e manutenzione del prodotto

| Documento | Ambito |
|---|---|
| [Appunti](APPUNTI-SPEC.md) | Comportamento attuale, materie, copie, sincronizzazione e backup V3 |
| [Editor Appunti](APPUNTI-EDITOR-SPEC.md) | Formato, selezione, comandi, salvataggio ed export |
| [Classi](CLASSI.md) | Gruppi, attività, appunti e confini delle estensioni future |
| [Internazionalizzazione](I18N.md) | Cataloghi, lingua, route pubbliche e PWA |
| [Sistema voti](GRADING-SYSTEM.md) | Scala implementata, calcoli e utility pubblica; sistemi alternativi proposti |
| [Affidabilità diario](RELIABILITY.md) | Analisi e correzioni della sessione del 23 settembre |
| [Prestazioni Classi](CLASSI-PERFORMANCE.md) | Cache della vista e misure locali con relativi limiti |
| [Altri sistemi di valutazione](improvement-2026-10-01/GRADING-EXTENSION-AUDIT.md) | Analisi aggiornata, fonti e prompt 10–14; estensione pianificata |
| [Programma ingresso, SEO e account standard](improvement-2026-10-01/PLAN.md) | Audit specialistici, primo ciclo e prompt per i cicli successivi |
| [Workflow completo e modelli](improvement-2026-10-01/WORKFLOW-MODELS.md) | Modello per ogni prompt, sequenza, dipendenze, stime e costi API distinti da Codex |
| [Piano prodotto](PRODOTTO.md) | Lavoro aperto e criteri di rilascio |
| [Reference UX](UX-REFERENCE.md) | Direzione di progetto, non lista di funzioni già consegnate |

## Materiale di progetto e storico

[Spazio studio AI](SPAZIO-STUDIO-AI.md), [considerazioni AI](SPAZIO-STUDIO-AI-CONSIDERAZIONI.md) e [piano UX completo](IPAGELL-PRODUCT-UX-UI-MASTER-PLAN.md) restano proposte. Non attestano un servizio AI, file o annunci in produzione.

Sono conservati lo [snapshot storico](REPO-SNAPSHOT-HISTORY.md), l'[architettura storica](ARCHITECTURE-HISTORY.md), le [verifiche precedenti](VERIFICATION-HISTORY.md), la [revisione del 16 settembre](REVIEW.md), l'[usabilità del 16 settembre](USABILITA.md), il [design iniziale Appunti](APPUNTI-DESIGN-2026-09-30.md) e il [design iniziale editor](APPUNTI-EDITOR-DESIGN-2026-09-30.md). Il [piano editor](APPUNTI-EDITOR-PIANO.md) e i [prompt editor](APPUNTI-EDITOR-PROMPT.md) spiegano il percorso iniziale; non vanno rieseguiti assumendo che la funzione manchi ancora.

## Mantenere i documenti in pari

1. Leggere `AGENTS.md` e il codice coinvolto: il sorgente prevale sulla documentazione.
2. Aggiornare le guide che cambiano insieme alla funzionalità; conservare come storico analisi o risultati riferiti a un'altra versione.
3. Se cambiano route, schema, migrazioni, script npm o dipendenze, eseguire `npm run docs:generate` e includere l'inventario nel commit.
4. Eseguire `npm run docs:check` e `git diff --check`. Il controllo verifica inventario e collegamenti locali, rifiutando anche destinazioni ignorate da Git; non certifica prosa, infrastruttura o compatibilità su telefono.
5. Registrare l'esito reale in changelog e matrice; aggiornare i riferimenti di pubblicazione soltanto dopo un deploy riuscito.

- [Semplificazione dell’interfaccia, 10 ottobre 2026](UX-SIMPLIFICATION-2026-10-10.md): gerarchia delle viste, lettura e appunti della stessa materia.
