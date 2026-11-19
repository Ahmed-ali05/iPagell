# iPagell — Approfondimento operativo delle buone pratiche

**17 ottobre 2026.** Continuazione dell’[analisi delle 18 aree](ANALISI-BUONE-PRATICHE-AZIENDALI-2026-10-15.md), collegata al [rapporto legale](ANALISI-CONFORMITA-LEGALE-2026-10-15.md).

## 1. Esito aggiornato

**La priorità è dimostrare che il servizio si possa recuperare e rilasciare in sicurezza, portando nelle verifiche ripetibili i percorsi già protetti dal codice.** Non serve ripartire da zero con autenticazione, backup personale o sincronizzazione.

La lettura del checkout il 17 ottobre evidenzia un avanzamento locale importante: W8-A corregge il percorso di cancellazione e la redazione degli errori, introduce un adattatore di autenticazione compatibile e dispone di una suite sul D1 locale. Questi progressi non dimostrano che la stessa versione sia pubblicata o che ripristino, monitoraggio e gestione degli accessi amministrativi siano già operativi.

L’approfondimento produce dieci attività pianificabili, non nuove funzionalità. **In questa continuazione sono stati scritti solo documenti e note di aggiornamento ai due rapporti precedenti.** Non sono stati eseguiti test applicativi, build, migrazioni, restore, modifiche GitHub/provider, scansioni o deploy. Non sono stati consultati database, account reali o pannelli amministrativi. I controlli documentali hanno uno scopo distinto dalla validazione del prodotto.

### Come leggere le prove

- **Codice riletto:** comportamento dell’implementazione presente nel checkout.
- **Prova registrata:** esito riportato nei documenti di altri interventi, non rieseguito qui.
- **Da accertare:** informazione che richiede configurazione, contratto o prova esterna.
- **Proposta:** attività e criteri formulati in questa analisi; nessuna esecuzione implicita.

Riletti [AGENTS.md](../AGENTS.md), [snapshot](REPO-SNAPSHOT.md), [architettura](ARCHITECTURE-CURRENT.md), [matrice](VERIFICATION-MATRIX.md), [sicurezza](../SECURITY.md), [manutenzione](MANUTENZIONE.md), workflow e codice pertinente. Le molte modifiche preesistenti sono state preservate. Il checkout non è stato dichiarato equivalente alla produzione.

## 2. Differenze concrete rispetto al 15 ottobre

| Area | Stato rilevato il 17 ottobre | Cosa non è ancora dimostrato |
|---|---|---|
| Cancellazione locale | `session.security()` cattura l’ID, fa flush prima della richiesta, invalida la generazione dopo successo e tenta pulizia diario/agenda e Appunti. Segnala fallimenti di pulizia. | Submit completo sul browser reale, storage fisicamente negato e pubblicazione della correzione. Gli ostacoli per owner/onboarding restano distinti. |
| Errori inattesi | `errorResponse()` registra `{name}` senza `message`; esiste una regressione dedicata. | Redazione dei log aggiunti dal provider e monitoraggio sufficiente a diagnosticare guasti. |
| Autenticazione | L’adattatore legge una sola fonte autorevole in funzione dello stato schema; stato assente/ignoto/paused fallisce chiuso. | Cutover operativo, migrazione 0008 distribuibile, provider esterni e rollout remoto. |
| Schema | Il sorgente comprende 23 tabelle e 8 migrazioni, con espansione auth 0007. | Che il database di produzione abbia questo schema. |
| Verifiche | Esistono suite controller, redazione errori e `test:auth-d1`; W8-A registra prove locali e API. | Esecuzione D1/API/browser nel workflow ordinario e comportamento su tutti i dispositivi. |

Evidenze: [controller](../lib/diary-session.ts), [collegamento nel workspace](../components/ipagell-app.tsx), [HTTP](../lib/server/http.ts), [test redazione](../tests/auth-http.test.ts), [adattatore](../lib/server/auth-repository.ts), [test D1](../tests/auth-d1.integration.ts), [rapporto W8-A](improvement-2026-10-01/AUTH-COMPATIBILITY-W8A.md).

La correzione nel sorgente, una prova locale e la verifica successiva alla pubblicazione sono tre stati diversi. Il rapporto W8-A registra esplicitamente nessun deploy: non si può chiudere un rilievo sulla produzione usando soltanto quel rapporto.

## 3. Dipendenze e ordine raccomandato

| ID | Attività | Responsabile da assegnare | Dipendenze principali | Priorità |
|---|---|---|---|---|
| OP-01 | Identificare risorse, accessi e responsabilità | Gestore | Nessuna | Prima |
| OP-02 | Definire ambiente rappresentativo e recupero disponibile | Gestore + tecnico | OP-01 | Prima |
| OP-03 | Preparare e qualificare la prova di ripristino | Tecnico + gestore dati | OP-02, decisioni retention del rapporto legale | Prima delle migrazioni distruttive |
| OP-04 | Progettare segnali, avvisi e diagnosi senza dati scolastici | Tecnico + referente operativo | OP-01, inventario capacità del provider | Prima |
| OP-05 | Portare verifiche D1/API/browser nei gate appropriati | Sviluppo | Ambiente isolato, baseline W8-A | Consolidamento |
| OP-06 | Qualificare candidato e sequenza di rilascio auth | Responsabile rilascio | OP-02/03/05, piano W8 esistente | Prima del rollout auth |
| OP-07 | Completare la verifica della cancellazione e delle copie | Sviluppo + privacy | Correzione W8-A, decisioni legali sul ciclo dati | Consolidamento |
| OP-08 | Misurare capacità, reti scolastiche e costi | Tecnico + gestore | OP-02/04, dati contrattuali | Consolidamento |
| OP-09 | Rendere utilizzabile il processo incidenti/supporto | Gestore + referente tecnico | OP-01, poi OP-03/04 | Prima, poi simulazione |
| OP-10 | Collegare le prove in una decisione di prontezza | Gestore + responsabile rilascio | Esiti pertinenti precedenti | Prima di dichiarazioni/accordi più impegnativi |

“Prima” indica l’ordine di lavoro proposto, non un incidente già in corso. Le attività non sostituiscono i gate specifici del [piano account](improvement-2026-10-01/PLAN.md) e non autorizzano a eseguirlo. Nessuna stima in giorni o prezzo di strumenti è attendibile senza conoscere accessi e capacità disponibili.

## 4. Specifiche delle attività

### OP-01 — Inventario essenziale, accessi e responsabilità

**Problema da risolvere:** sapere chi controlla il servizio e chi può recuperarlo, anche se il gestore abituale non è disponibile. Non è accertata qui la configurazione degli accessi esterni.

**Consegna proposta:** scheda privata di dominio/DNS, progetto Sites, database gestito, repository, CI, eventuali log/backup e contatti di supporto. Per ogni voce: titolare, persone abilitate, livello di accesso, autenticazione forte disponibile/attiva, recupero, rinnovo e referente. Nel repository pubblico conservare soltanto la procedura depurata da segreti e informazioni riservate.

**Criteri di completamento:** nessun accesso amministrativo necessario dipende da una credenziale condivisa senza controllo; il gestore sa recuperare dominio e hosting; le autorizzazioni non necessarie sono identificate. Se una seconda persona non esiste, registrare il rischio e una modalità sostenibile di continuità, senza inventare reperibilità.

**Decisione prima degli strumenti:** scegliere custodia e recupero delle credenziali; non acquistare un sistema di gestione accessi prima di aver contato persone e risorse.

### OP-02 — Ambiente rappresentativo e capacità reali del provider

**Problema da risolvere:** il D1 locale verifica SQL, ma non dimostra origini HTTPS, cookie di produzione, migrazioni gestite o restore su Sites. Il Worker sperimentale usa un DB diverso e non è automaticamente uno staging qualificato.

**Consegna proposta:** matrice locale / ambiente di verifica remoto eventuale / produzione, con schema, runtime, origine, binding, dati ammessi, accessi e differenze note. Prima di creare risorse, accertare le capacità disponibili nel progetto/piano esistente e i relativi costi.

**Criteri di completamento:** prova senza dati reali di HTTPS/cookie e percorso delle migrazioni, database isolato identificabile senza ambiguità, nessun test che possa puntare per errore al DB pubblico. Se Sites non consente una caratteristica necessaria, documentare alternativa e limite; non dichiarare parità solo perché il codice compila.

**Confine:** nessuna richiesta di creare un nuovo progetto, cambiare dominio o migrare la produzione è contenuta in questo rapporto.

### OP-03 — Ripristino completo, compreso lo stato di sicurezza

**Problema da risolvere:** il JSON V3 permette il recupero personale, ma non ricrea identità, sessioni, membership e l’intero servizio. Anche un backup del database non recupera le bozze mai sincronizzate presenti solo sul dispositivo.

**Consegna proposta:** piano con perdita temporale accettabile dei dati (RPO), tempo obiettivo di recupero (RTO), capacità effettiva del provider e prova su ambiente isolato. Nessuna durata viene fissata qui senza una decisione del gestore. Cloudflare documenta il recupero nel tempo di D1; ciò non dimostra che il gestore di questo progetto Sites abbia lo stesso accesso operativo. [D1 — Time Travel e backup](https://developers.cloudflare.com/d1/reference/time-travel/).

**Campione sintetico da preparare:** due account, sessioni revocate e valide, cambio password dopo il punto di recupero, diario, note, bozza locale, classe con ruoli e invito revocato, evento sottoscritto e dati cancellati. Includere lo stato auth effettivamente supportato dal candidato, senza trasformare la fixture credentials in una migrazione di produzione.

**Criteri di completamento:** identità, relazioni, revisioni, contenuti e permessi confrontati con il campione; nessun orfano inatteso; durata e punto recuperato registrati. Verificare specificamente che il recupero non riattivi senza controllo sessioni, vecchie credenziali o inviti revocati e non ripubblichi dati già cancellati: un restore riporta indietro anche questo stato. Definire prima revoche/riconciliazione e modalità di riapertura.

**Limite della prova:** un semplice conteggio delle righe non dimostra né integrità semantica né recupero del servizio. Nessun restore di prova deve sovrascrivere la produzione.

### OP-04 — Monitoraggio utile e registrazione minima degli eventi

**Problema da risolvere:** la riduzione dei messaggi nei log limita l’esposizione di dati, ma un generico `{name:"Error"}` da solo può non distinguere un problema di DB, schema o dipendenza. L’estensione proposta deve aggiungere contesto controllato, senza ripristinare messaggi SQL o contenuti utente.

**Consegna proposta:** catalogo di eventi con nome ammesso, fase dell’operazione, categoria di errore, versione applicativa, durata e identificatore di richiesta non derivato da dati scolastici. Per route dinamiche usare un modello, ad esempio `/api/notes/:id`, evitando ID come etichette metriche. Definire accesso ai log, campionamento e conservazione prima dell’attivazione.

**Dati esclusi dal normale evento diagnostico:** password/digest, cookie, codice recupero/invito, query, payload, titoli/testi di note o attività, nome studente/scuola e dettagli sanitari. Anche URL/query string e messaggi liberi vanno trattati come potenziali contenitori di dati, non aggiunti automaticamente.

**Criteri di completamento:** un guasto sintetico di DB, un rifiuto di contratto e una sessione scaduta sono distinguibili senza cercare dati reali. Gli avvisi hanno destinatario, istruzione e criterio di chiusura; una persona li può effettivamente gestire. Google SRE propone di collegare gli avvisi a impatto e obiettivi misurabili, valutando anche rumore e rapidità di rilevamento. [Google SRE — avvisi sugli SLO](https://sre.google/workbook/alerting-on-slos/).

**Controlli distinti:** homepage raggiungibile; lettura autenticata con account sintetico; ciclo sintetico scrittura/lettura/pulizia. L’ultimo muta dati e richiede una progettazione dedicata: non attivarlo sul pubblico come un semplice ping. Un `200` della landing non dimostra salvataggio funzionante.

### OP-05 — Rendere ripetibili le verifiche già disponibili

**Problema confermato:** [package.json](../package.json) esegue ordinariamente `tests/*.test.ts`. `tests/auth-d1.integration.ts` è richiamato da `test:auth-d1`, separato. Il [workflow](../.github/workflows/check.yml) lancia audit e `release:prepare`, ma non richiama quella suite, `test:api` o i percorsi browser. Non vanno descritti come controlli CI già automatici.

**Consegna proposta:** disegno di un job D1 effimero, un gate API sulla build e pochi test browser critici. Riutilizzare i test esistenti; non crearne copie equivalenti né rendere necessario un DB remoto per ogni PR. Definire avvio/prontezza del runtime, timeout, pulizia e diagnostica depurata dai segreti.

**Criteri di completamento:** una regressione sintetica su autenticazione, autorizzazione o salvataggio fa fallire il gate; nessuna connessione può raggiungere produzione; i processi terminano anche dopo un errore. I retry distinguono errori ambientali da test instabili e non mascherano fallimenti.

**Catena di fornitura:** valutare riferimenti immutabili delle Actions e aggiornamento gestito. Il workflow corrente usa tag `@v4`; GitHub documenta lockfile dei workflow ove adottabili e, in alternativa, SHA completi verificati. [GitHub — uso sicuro](https://docs.github.com/en/actions/reference/security/secure-use). Nessuna modifica del workflow è stata eseguita qui.

### OP-06 — Compatibilità e rilasci dell’autenticazione

**Problema confermato nel codice:** [AuthRepository.mode()](../lib/server/auth-repository.ts) richiede `auth_schema_state`; schema assente o modalità ignota non aprono un percorso legacy permissivo. È una difesa voluta, ma rende necessario coordinare codice e migrazione 0007. Pubblicare il nuovo runtime su uno schema precedente non è una sequenza qualificata.

**Consegna proposta:** scheda candidato con sorgente, lockfile, schema richiesto, versione dei contratti, sequenza di migrazione/runtime, controlli successivi e versione compatibile di recupero. Riusare il piano W8 esistente; non introdurre un piano concorrente di cutover.

| Combinazione | Indicazione ricavata dal codice/piano |
|---|---|
| Nuovo adattatore senza 0007 | Non considerare compatibile: manca lo stato schema richiesto. |
| W8-A + 0007 legacy | Configurazione intermedia prevista e provata localmente, da qualificare nel percorso Sites. |
| Modalità paused | Scritture auth respinte; i trigger interessano anche cancellazioni di inviti/diari. Considerare l’impatto nel piano di manutenzione. |
| Futuro schema credentials senza colonne legacy | Solo runtime compatibile; non tornare al vecchio codice che interroga le colonne rimosse. |

**Criteri di completamento:** gate di restore e ambiente soddisfatti, candidato identificato senza includere modifiche altrui per errore, sequenza provata, controlli post-rilascio e recupero documentati. La contrazione nelle [fixture D1](../tests/auth-d1.integration.ts) resta una prova dell’adattatore, non una 0008 pronta da pubblicare. La transazionalità D1 aiuta a evitare effetti parziali in un batch fallito, ma non sostituisce l’ordine operativo di un intero rollout. [D1 — batch](https://developers.cloudflare.com/d1/worker-api/d1-database/).

### OP-07 — Verifica completa della cancellazione e dei residui

**Avanzamento:** la precedente assenza della chiamata di pulizia del diario non è più il comportamento del checkout. L’implementazione ora tenta entrambe le pulizie sullo stesso ID catturato e segnala l’errore parziale. Non è corretto assegnare di nuovo quella correzione come se mancasse.

**Consegna proposta:** completare le prove al confine fra controller, browser e server, quindi collegarle ai requisiti LEG-05/06. Coprire cancellazione valida, flush fallito prima della richiesta, risposta remota persa, storage negato dopo successo, cambio account durante la richiesta, altra scheda, proprietario di classe e onboarding incompleto.

**Criteri di completamento:** il nuovo account non viene pulito da una risposta tardiva del vecchio; dopo successo remoto il vecchio workspace non si riapre; un errore di pulizia espone un percorso di recupero senza fingere che i dati server siano ancora presenti. Separare copie di questo browser, altri dispositivi, snapshot controllati dal servizio e download indipendenti.

**Da decidere prima del codice:** trattamento dei residui nei backup/snapshot e percorso assistito per chi non completa il flusso ordinario. Non risolvere tali decisioni eliminando indiscriminatamente contenuti di altri utenti.

### OP-08 — Capacità, reti condivise e costo reale

**Fatti nel sorgente:** rate limit per IP, username e azione, più bucket globale; un KDF concorrente per isolate; polling agenda ogni 30 secondi con documento visibile; timeout HTTP client ordinario di 10 secondi in [requestJson](../lib/client-http.ts). Nessuno di questi fatti dimostra da solo che il servizio sia lento o sovraccarico.

**Consegna proposta:** scenari sintetici parametrizzati con utenti simultanei dietro la stessa rete, ritorno collettivo online, ripresa dopo pausa auth, note nei limiti di quota ed export lungo. Misurare code/errori, tentativi, query, memoria e durata, distinguendo comportamento client, runtime e limiti del piano Sites.

**Criteri di completamento:** carico atteso dichiarato, baseline riproducibile, limiti chiari, decisione motivata su eventuali quote/backoff. Un timeout su una scrittura non prova che il server non l’abbia applicata: verificare riconciliazione e idempotenza prima di introdurre retry automatici.

**Costo:** nessun importo o costo per utente è calcolato senza contratto e misure. La prima attività è identificare risorse incluse, metriche accessibili e soglie sostenibili; non abbassare il rate limit o cambiare DB solo per una stima teorica.

### OP-09 — Incidenti e assistenza che non chiedono dati eccessivi

**Consegna proposta:** contatto presidiato e procedura breve per indisponibilità, mancato salvataggio, compromissione account e richiesta privacy. Per ciascuna: responsabile, primo controllo, dati minimi da raccogliere, operazioni da evitare, criterio di escalation e aggiornamento all’utente. I tempi di risposta devono riflettere la disponibilità reale.

**Dati utili di un ticket:** versione, browser/sistema, ora con fuso, operazione, stato rete/sync e identificatore diagnostico se disponibile. Non chiedere automaticamente backup interi, password, codice recupero o screenshot pieni di voti e nomi.

**Criteri di completamento:** una simulazione documentale identifica responsabile e procedura; una successiva simulazione tecnica in ambiente isolato collega avviso, diagnosi e recupero. La gestione incidenti privacy resta soggetta al percorso del rapporto legale; questo documento non sostituisce quella valutazione.

### OP-10 — Evidenze e decisione di prontezza

**Problema da risolvere:** impedire che “codice presente”, “test passato altrove” e “pubblicato” diventino sinonimi.

**Consegna proposta:** per ogni attività registrare stato, sorgente/versione, ambiente, prova, data, responsabile, limiti e prossima azione. Stati sufficienti: da accertare; pianificata; implementata locale; verificata locale; verificata su ambiente rappresentativo; pubblicata e verificata; chiusa rispetto al criterio dichiarato.

**Criteri di completamento:** ogni affermazione di disponibilità, recuperabilità o completamento richiama una prova pertinente. Nessun totale percentuale di “maturità aziendale” senza un modello e pesi giustificati; nessuna chiusura globale della conformità legale con il passaggio dei test.

## 5. Specifica minima delle misure operative

Proposta da raffinare dopo l’inventario. Sono definizioni, non misurazioni effettuate né soglie contrattuali.

| Misura | Numeratore / tempo | Denominatore / contesto | Attenzione |
|---|---|---|---|
| Lettura autenticata | Risposte valide entro la durata concordata | Richieste ammesse a identità valida | Un `401` atteso non è un guasto server; errori di schema lo sono per il percorso interessato. |
| Salvataggio locale | Commit IndexedDB riusciti e relativa durata | Scritture valide tentate sul dispositivo | Separare quota/storage negato da errore remoto; nessun testo nel campione. |
| Sincronizzazione | Mutazioni confermate/riconciliate e tempo dalla messa in coda | Mutazioni valide in attesa, classificate per rete | Offline volontario non equivale a indisponibilità server; non eliminare però dal dato gli errori reali. |
| Conflitto | Conflitti che richiedono azione dell’utente | Scritture con revisioni concorrenti | Un `409` previsto non è automaticamente perdita dati o errore interno. |
| Limitazione richieste | Rifiuti `429`, distinti per percorso | Tentativi del percorso nella finestra | Non usare IP/username grezzi come etichette; separare abuso e carico legittimo. |
| Recuperabilità | Età dell’ultima prova, dati verificati e tempo misurato | Scenario/schema/versione qualificati | “Backup creato” non basta; una prova vecchia può non coprire nuovo schema. |

Per volumi piccoli mostrare conteggi e finestre oltre alle percentuali. Una pausa pianificata può incidere sulla disponibilità reale: non rimuoverla dai denominatori a posteriori per abbellire gli esiti. Prima di un SLO scegliere percorso, finestra, esclusioni motivate e decisione da prendere quando non è rispettato.

## 6. Tre scenari da non confondere

| Scenario | Risposta organizzativa proposta | Prova che manca prima di dichiararlo coperto |
|---|---|---|
| Nuova pubblicazione guasta, DB integro | Tornare a un runtime compatibile seguendo il piano | Artefatto recuperabile e compatibilità schema/client verificate. |
| Cancellazione o corruzione dei dati | Ripristino/riconciliazione secondo piano, con finestra di perdita scelta | Recupero isolato completo e gestione degli stati di sicurezza ripristinati. |
| Browser offline con bozza non sincronizzata | Recuperare la copia locale prima di pulizie o reinstallazioni | Prova del percorso su browser/dispositivo pertinente e gestione storage bloccato. |

Il primo non dimostra il secondo; il backup server non recupera automaticamente il terzo. È questa distinzione a rendere concrete le buone pratiche di continuità nel caso iPagell.

## 7. Prossime decisioni utili

1. Assegnare responsabile e raccogliere capacità/accessi del provider in OP-01/02.
2. Definire RPO/RTO e disegno della prova OP-03 prima di una migrazione distruttiva.
3. Scegliere pochi segnali e gate ripetibili in OP-04/05, riutilizzando quanto già implementato.
4. Mantenere il rollout W8 nel piano esistente e completare le prove mancanti della cancellazione.
5. Registrare gli esiti con il modello OP-10 e riesaminare le priorità sulle evidenze raccolte.

L’analisi aggiorna e rende pianificabile il lavoro. **Nessuno dei pacchetti OP è stato implementato o dichiarato completato con questo documento.**
