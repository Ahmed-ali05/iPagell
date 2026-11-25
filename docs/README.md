# Documentazione di iPagell

[Repository](../README.md) · [Software pubblicato](https://ipagell.website)

Indice riordinato il **2 ottobre 2026**. Ingresso/SEO è stato consegnato in Sites **28**, consultazione Periodo/Anno/Storico in **29**; esiti e limiti sono nel [changelog](../CHANGELOG.md) e nel [rapporto del ciclo](improvement-2026-10-01/VERIFICATION.md). Il [registro di pubblicazione](DEPLOYMENT.md) riporta ora Sites **30** del 2 ottobre, con catture reali sulla homepage. Questo riordino non è una nuova verifica della produzione: le modifiche locali successive non sono automaticamente pubblicate. Codice, test locali, CI GitHub e produzione sono evidenze distinte; una build o un push non attestano un deploy.

## Fonti correnti per argomento

Le guide restano direttamente in `docs/`, nei percorsi richiesti da `AGENTS.md`. La fonte principale descrive l'argomento; sintesi, piani e rapporti rimandano a essa. In caso di divergenza prevale il codice corrente, da leggere prima di una modifica.

| Esigenza | Documento |
|---|---|
| Usare il diario, gli appunti o le classi | [Guida utente](GUIDA-UTENTE.md) |
| Orientarsi prima di modificare il codice | [Snapshot corrente](REPO-SNAPSHOT.md), [Architettura corrente](ARCHITECTURE-CURRENT.md) |
| Runtime, componenti e persistenza | [Architettura corrente](ARCHITECTURE-CURRENT.md); [Architettura e dati](ARCHITETTURA.md) è una sintesi |
| Appunti personali/classe, copie, sincronizzazione e backup V3 | [Specifica Appunti](APPUNTI-SPEC.md) |
| Formato, selezione, comandi, salvataggio ed export delle note | [Specifica Editor](APPUNTI-EDITOR-SPEC.md) |
| Gruppi, attività, ruoli e inviti | [Classi](CLASSI.md), con contratti e permessi nel documento API |
| Cataloghi, lingua, route pubbliche e PWA localizzata | [Internazionalizzazione](I18N.md) |
| Scala 1–6, formule, utility pubblica e limiti dei metodi alternativi | [Sistema voti](GRADING-SYSTEM.md) |
| Endpoint, payload, autorizzazioni ed errori | [Contratto API](API.md) |
| Installazione, D1 locale, verifiche e incidenti | [Manutenzione](MANUTENZIONE.md) |
| Pubblicare e distinguere GitHub da Sites | [Sviluppo e pubblicazione](DEPLOYMENT.md) |
| Capire quali affermazioni sono dimostrate | [Matrice di verifica corrente](VERIFICATION-MATRIX.md) |
| Route, tabelle, migrazioni, script e versioni esatte | [Inventario generato](REPO-INVENTORY.md) |
| Protezione dati e segnalazioni | [Sicurezza](../SECURITY.md) |
| Evoluzione e rilasci | [Changelog](../CHANGELOG.md) |

## Riferimenti complementari

| Documento | Ambito |
|---|---|
| [Prestazioni Classi](CLASSI-PERFORMANCE.md) | Diagnosi della cache e misure locali registrate; comportamento in Architettura corrente, limiti nella matrice |
| [Elenco Agenda](AGENDA-LIST-2026-10-10.md) | Analisi, stati, ordinamento e limiti della revisione del 10 ottobre |
| [Reference UX](UX-REFERENCE.md) | Direzione di progetto e resoconti cronologici; non è una lista di funzioni già consegnate |
| [Semplificazione UI del 10 ottobre](UX-SIMPLIFICATION-2026-10-10.md) | Analisi delle viste, decisioni applicate localmente e limiti della verifica |
| [Ridisegno UI del 18 novembre](UI-REDESIGN-2026-11-18.md) | Analisi preliminare, sistema visivo blu/Liquid Glass e interventi su spazio pubblico e app |
| [Contribuire](../CONTRIBUTING.md) | Procedura per modifiche, verifiche e documentazione |

## Piani e proposte

Questi documenti contengono lavoro aperto o decisioni da implementare. Le parti concluse rimangono datate; per sapere cosa esiste oggi usare le fonti correnti sopra.

| Documento | Ruolo |
|---|---|
| [Piano prodotto](PRODOTTO.md) | Lavoro aperto e criteri di rilascio |
| [Percorso minimo privacy](legal/ESSENZIALI-PRIVACY-2026-10-22.md), [bozza informativa](legal/INFORMATIVA-PRIVACY-IT-BOZZA.md), [bozza cookie/storage](legal/COOKIE-STORAGE-IT-BOZZA.md) | Scelte proporzionate per il gestore in Ticino, confronto con servizi pertinenti e fonti standard Sites; nessuna email al provider o nuova pagina pubblicata da questo lavoro |
| [Bozza regole d’uso](legal/REGOLE-USO-IT-BOZZA.md), [procedura richieste privacy](legal/PROCEDURA-RICHIESTE-PRIVACY.md) | Proposte su account, classi, contenuti, adesione e gestione dei diritti; verifica del richiedente e mappa dei dati, senza nuove funzioni o pratiche reali |
| [Visibilità e posizionamento SEO](SEO-POSIZIONAMENTO-2026-10-10.md) | Analisi del 10 ottobre: verifiche HTTP pubbliche, limiti sull'indicizzazione e interventi soltanto teorici |
| [Prodotto, nome e promessa](PRODOTTO-NOME-POSIZIONAMENTO-2026-10-10.md) | Ragionamento sul marchio iPagell, categoria, pubblico e alternative da validare; nessuna rinomina decisa |
| [Direzione e sessioni di posizionamento](posizionamento-2026-10-15/PLAN.md), [prompt pronti](posizionamento-2026-10-15/PROMPTS.md) | Sequenza del 15 ottobre: diagnosi, promessa, calcolatore, home, candidato, pubblicazione esplicita e valutazione; sessioni non avviate |
| [Programma next gen](NEXTGEN-2026-10-02.md) | Nuovo volto deciso e grafico, piacere d'uso e accessibilità; pianificazione del 2 ottobre, senza implementazione |
| [Piano UX completo](IPAGELL-PRODUCT-UX-UI-MASTER-PLAN.md) | Journey, vincoli e fasi; il programma next gen guida il nuovo mandato |
| [Spazio studio AI](SPAZIO-STUDIO-AI.md), [considerazioni AI](SPAZIO-STUDIO-AI-CONSIDERAZIONI.md) | Proposte future; non attestano un servizio AI, upload o annunci implementati |
| [Appunti da lezione live](LEZIONI-LIVE-AI.md), [piano](lezioni-live-ai/PLAN.md), [protocollo](lezioni-live-ai/EVALUATION.md), [fonti](lezioni-live-ai/SOURCES.md) | Nuova sperimentazione: notebook Chrome, italiano, audio temporaneo e solo appunto finale conservato. Area documentale separata, senza codice, modelli o prove eseguite |
| [Studio locale: fattibilità](SPAZIO-STUDIO-AI-LOCALE.md), [preparazione L0](SPAZIO-STUDIO-AI-L0.md), [laboratorio L1](SPAZIO-STUDIO-AI-L1.md), [mappa L2](SPAZIO-STUDIO-AI-L2.md), [prova L3](SPAZIO-STUDIO-AI-L3.md), [diagnosi e nuove misure](SPAZIO-STUDIO-AI-RIPRESA.md), [prompt operativi](SPAZIO-STUDIO-AI-PROMPTS.md) | Prototipo separato: testo/PDF, fonti, ricerca, mappa manuale e recupero L2. Banco generativo L3 implementato, modello non qualificato; nessuna integrazione/pubblicazione |
| [Programma ingresso, SEO e account standard](improvement-2026-10-01/PLAN.md) | Programma misto: primo ciclo consegnato in Sites 28, annuale/storico in 29, account standard e altri sistemi ancora da implementare |
| [Altri sistemi di valutazione](improvement-2026-10-01/GRADING-EXTENSION-AUDIT.md) | Ricerca e piano dei prompt 10–14; il contratto implementato resta nel Sistema voti |
| [Più scale di voto — 19 novembre](MULTI-SCALA-VOTI-2026-11-19.md) | Analisi di prodotto: scale prioritarie, modello leggero con scala per voto, UX del setup e fasi; nessuna implementazione |
| [Account standard](improvement-2026-10-01/AUTH-PRODUCT-AUDIT.md) | Audit iniziale e decisione W7; provider e nuovo schema non sono nel runtime |
| [Conferma Google senza uscire (fase B) — 25 novembre](ACCOUNT-REAUTH-FASE-B-2026-11-25.md) | Transazione `reauth`, conferma monouso in `auth_grants`, eliminazione dell'account Google senza logout; implementata e pubblicata il 25 novembre |
| [Gestione e controllo dell'account — 25 novembre](ANALISI-GESTIONE-ACCOUNT-2026-11-25.md) | Lacune su sessioni, riautenticazione Google, collegamento metodi e registro attività; fasi A–C implementate e pubblicate il 25 novembre, D ed E da fare |
| [Fase C — pannello Account chiaro](ACCOUNT-PANNELLO-FASE-C-2026-11-25.md) | Metodi d'accesso e data di creazione nelle Impostazioni, niente handle `u_…`, conferma di eliminazione Google con parola fissa, avviso sul doppio account; implementata e pubblicata il 25 novembre |
| [Fase A — sessioni visibili e revocabili](ACCOUNT-SESSIONI-FASE-A-2026-11-25.md) | Progetto ed esito: migrazione 0009, API `/api/auth/sessions`, «Dispositivi connessi», prove e testi legali; implementato e pubblicato il 25 novembre |
| [Prompt operativi](improvement-2026-10-01/PROMPTS.md), [workflow e modelli](improvement-2026-10-01/WORKFLOW-MODELS.md) | Sequenza, dipendenze e stime per i cicli successivi; non istruzioni da eseguire automaticamente |

La cartella `improvement-2026-10-01/` resta insieme perché il programma ancora aperto collega le proprie analisi iniziali: [SEO](improvement-2026-10-01/SEO-AUDIT.md), [UX visiva](improvement-2026-10-01/UX-VISUAL-AUDIT.md), [periodi](improvement-2026-10-01/PERIODS-AUDIT.md). Questi audit fotografano il punto di partenza; il [rapporto](improvement-2026-10-01/VERIFICATION.md) registra le verifiche e i rilasci successivi.

## Archivio storico

L'[indice dell'archivio](archive/README.md) elenca dodici snapshot, audit, resoconti e progetti conclusi, con il riferimento corrente per ciascuno. I contenuti storici conservano date, versioni e limiti originari; i collegamenti sono aggiornati alla nuova sede. I vecchi prompt editor non vanno rieseguiti assumendo che la funzione manchi ancora.

## Mantenere i documenti in pari

1. Leggere `AGENTS.md` e il codice coinvolto: il sorgente prevale sulla documentazione.
2. Aggiornare la fonte corrente insieme alla funzionalità, senza duplicarne il contratto nei piani. Archiviare analisi o risultati conclusi solo dopo averne verificato ruolo e riferimenti; ricalcolare i collegamenti relativi e aggiornare questo indice.
3. Se cambiano route, schema, migrazioni, script npm o dipendenze, eseguire `npm run docs:generate` e includere l'inventario nel commit.
4. Eseguire `npm run docs:check` e `git diff --check`. Il controllo verifica inventario e collegamenti locali, rifiutando anche destinazioni ignorate da Git; non certifica prosa, infrastruttura o compatibilità su telefono.
5. Registrare l'esito reale in changelog e matrice; aggiornare i riferimenti di pubblicazione soltanto dopo un deploy riuscito.

- [Correzione del blocco CI delle dipendenze, 10 ottobre 2026](DEPENDENCY-SECURITY-2026-10-10.md): tre cause, patch verificata e manutenzione.

Ultimo aggiornamento delle dipendenze: **Sites 34**, 10 ottobre 2026; [analisi e manutenzione](DEPENDENCY-SECURITY-2026-10-10.md), [CI e registro di pubblicazione](DEPLOYMENT.md).

- [Sicurezza runtime e dipendenze — 22 ottobre 2026](RUNTIME-SECURITY-2026-10-22.md): avvisi PHP/Node/Vite, perimetro applicabile, correzioni e prove.
