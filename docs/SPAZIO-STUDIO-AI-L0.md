# Spazio Studio locale — preparazione operativa L0

[Indice](README.md) · [Fattibilità](SPAZIO-STUDIO-AI-LOCALE.md) · [Prompt](SPAZIO-STUDIO-AI-PROMPTS.md) · [Considerazioni](SPAZIO-STUDIO-AI-CONSIDERAZIONI.md)

**7 ottobre 2026. Preparazione documentale eseguita; implementazione e benchmark non avviati.** Questo rapporto applica il passo L0 al checkout corrente. Registra evidenze, scelte tecniche iniziali e condizioni ancora aperte; non attesta che una combinazione modello/runtime funzioni già in iPagell.

**Riscontro successivo:** questo documento conserva preparazione e protocollo L0. Il
[rapporto L1](SPAZIO-STUDIO-AI-L1.md) descrive il laboratorio poi implementato, le versioni
effettivamente installate e le prove; le frasi «non ancora provato» sotto descrivono lo stato
al termine di L0, non annullano le evidenze successive.

## 1. Esito e perimetro

La base implementabile è uno spazio personale per materia con fonti consultabili, ricerca testuale e mappa manuale. Embedding e generazione sono capacità aggiuntive indipendenti: un fallimento mantiene il lavoro locale. Nessun fallback cloud, invio agli Appunti o condivisione implicita.

La prima prova usa testo incollato, TXT UTF-8 e PDF digitali. DOCX/PPTX, OCR, immagini, chat, quiz, collaborazione e sincronizzazione delle mappe restano fuori. La produzione Sites, il database, i domini e il sistema di account corrente non richiedono modifiche per questa preparazione.

| Consegna L0 | Stato osservato | Conseguenza |
|---|---|---|
| Confini nel codice e requisiti di protezione | Verificati in lettura, sezioni 2 e 6 | Disponibili per progettare L1/L2 |
| Artefatto embedding dedicato al testo | Individuato, sezione 3 | Un solo candidato iniziale, senza encoder visivi/audio |
| Versione npm/WASM effettiva, compatibilità web e prefissi | Non risolti completamente, sezioni 3–4 | Da chiudere prima del benchmark embedding |
| Protocollo, budget e scenari di errore | Definiti come parametri iniziali di progetto, sezione 7 | Da congelare nel report prima di misurare i candidati |
| Corpus annotato e dispositivi | Specificati; fixture e prove fisiche ancora da realizzare | Nessun punteggio, tempo o supporto mobile dichiarato |

**Può partire L1 nella parte estrazione/fonti/baseline.** La parte AI inizia con verifica della distribuzione runtime e prova minima del candidato testuale; se questa fallisce, L1 consegna la baseline. L2 resta indipendente dal successo degli embedding. L3 dipende dal contratto L2 e dalla qualificazione del generatore; L4 integra solo capacità verificate. Questo task non avvia tali passi.

## 2. Confini confermati nel codice

| Punto letto | Comportamento corrente | Vincolo per lo Spazio Studio |
|---|---|---|
| [Workspace](../components/ipagell-app.tsx), `DiaryWorkspace`, `navigate`, `openNotes` | Workspace montato con chiave `user.id`; navigazione attende `flushOpenNotes()`; cinque voci principali | Ingresso per materia e ritorno al contesto; nuovo flush dello studio prima di uscire, senza aggirare quello Appunti |
| [Tipi](../types/domain.ts), [schema D1](../db/schema.ts), [manifest](../package.json) | `SchoolData` non contiene materiali/grafi; nessun runtime AI o parser PDF di importazione | Archivio e contratti nuovi, nessuna migrazione del diario/D1 per il prototipo |
| [Controller Appunti](../hooks/use-notes.ts), `savePersonalDraft` e `queueSync` | Una bozza personale valida viene messa in sincronizzazione dopo il salvataggio locale | Non riutilizzare questo writer per conservare mappe/estratti locali |
| [Storage note](../lib/notes/storage.ts), `updatePersonal` | CAS nella transazione IndexedDB; chiavi per account; BroadcastChannel notifica | Riutilizzare il principio di transazione, non l'outbox o il database delle note; il canale non sostituisce CAS |
| [Formato note](../lib/notes/format.ts), [validazione](../lib/notes/validation.ts) | `plain`/`md-lite-v1`, 20.000 code point e limite byte separato | Contratto del grafo distinto; testo e output AI trattati come dati non fidati |
| [Backup](../lib/notes/backup.ts), `remapDiaryForImport` | V3 strict, senza mappe; import rimappa anche gli ID delle materie | Export studio dedicato; materia come riferimento recuperabile, mai cancellazione implicita dopo import del diario |
| [Sessione](../lib/diary-session.ts), [sicurezza account](../components/account-security.tsx), callback nel workspace | Invalidazione per generazione; logout e cancellazione hanno percorsi distinti; la callback di cancellazione segue il successo server | Job vincolati ad account/generazione; pulizia locale dello studio esplicita e riprovabile dopo cancellazione server |
| [Precache](../scripts/generate-precache.mjs), [service worker](../public/sw.js) | Tutti i JS/CSS/font nei percorsi client ammessi sono precached; API/RSC esclusi; vecchie cache shell rimosse all'attivazione | Lazy import da solo insufficiente; runtime/pesi fuori dalla shell e namespace cache separato |
| [Proxy](../proxy.ts), [layout](../app/layout.tsx), [build](../vite.config.ts) | Vinext/Vite/Workers, host canonico e gestione lingua; non individuata una policy CSP/COOP/COEP applicativa in questi punti | Nessuna deduzione sugli header live della piattaforma; verificarli nell'ambiente di prova prima di introdurre policy globali |

La materia è indipendente dal semestre. Rinomina/archiviazione non crea un nuovo spazio; cancellazione o rimappatura del diario lascia lo spazio recuperabile con etichetta storica e ricollegamento esplicito. Il nome uguale non autorizza una fusione.

## 3. Registro dei candidati e della distribuzione

Fonti primarie consultate il 7 ottobre; nessun peso scaricato. Le dimensioni sotto sono **valori pubblicati arrotondati**, non RAM, byte verificati o dimensione dell'intero runtime.

| Combinazione candidata | Artefatto e dimensione pubblicata | Evidenza e stato |
|---|---|---|
| **EmbeddingGemma 2 Text 270M + LiteRT-LM JS** | `embeddinggemma-2-text-270m.litertlm`, **165 MB** | Artefatto dedicato al testo e licenza Apache-2.0 elencati nel [repository della conversione](https://huggingface.co/litert-community/embeddinggemma-2-text-270m-litert-lm/tree/main). Compatibilità con il pacchetto JS effettivamente distribuito: **da provare** |
| EmbeddingGemma 2 740M + LiteRT-LM JS | `embeddinggemma-2-740m.litertlm`, 485 MB | È l'esempio della [guida embedding web](https://developers.google.com/edge/litert-lm/embedding_models); [conversione multimodale](https://huggingface.co/litert-community/embeddinggemma-2-740m-litert-lm). **Escluso dalla prima prova** per il download non necessario al solo testo |
| **Gemma 4 E2B instruction-tuned + LiteRT-LM JS** | `gemma-4-E2B-it-gpu.litertlm` oppure `gemma-4-E2B-it-web.litertlm`, entrambi elencati a 2,01 GB | [File del modello](https://huggingface.co/litert-community/gemma-4-E2B-it-litert-lm/tree/main). Primo generatore candidato per L3, file esatto da qualificare |
| Gemma 4 E4B instruction-tuned + LiteRT-LM JS | `gemma-4-E4B-it-gpu.litertlm` oppure `gemma-4-E4B-it-web.litertlm`, entrambi elencati a 2,97 GB | [File del modello](https://huggingface.co/litert-community/gemma-4-E4B-it-litert-lm/tree/main). Secondo confronto facoltativo in L3 se E2B è insufficiente e il dispositivo sostiene il carico |

I repository dei due generatori dichiarano Apache-2.0. Non trasferire automaticamente condizioni di vecchie famiglie Gemma a questi file; prima della distribuzione conservare licenze/NOTICE e verificare condizioni del singolo artefatto e dell'host. Le pagine pubbliche non dimostrano ancora un download browser anonimo con CORS corretto lungo tutti i redirect.

L'artefatto testuale elimina dal file scelto gli encoder multimodali. Il [sorgente delle impostazioni embedding](https://github.com/google-ai-edge/LiteRT-LM/blob/main/js/packages/core/src/embedding_engine_settings.ts) consente inoltre di lasciare disabilitati i backend vision/audio. Questo non prova ancora l'impronta del browser né la compatibilità della conversione 270M con il WASM distribuito.

### Identità riproducibile dell'embedding

- Repository: `litert-community/embeddinggemma-2-text-270m-litert-lm`.
- Revisione osservata: [`9be6e8b90982095dc05c2bd162e4b954ee4dbac7`](https://huggingface.co/litert-community/embeddinggemma-2-text-270m-litert-lm/commit/9be6e8b90982095dc05c2bd162e4b954ee4dbac7).
- Nome: `embeddinggemma-2-text-270m.litertlm`.
- SHA-256 **pubblicato**, da verificare sui byte prima dell'uso: `2d079ee2f6f066b1f368e8d7c819f55214eaef1d0513b312321901f30ab286fb`. [Metadati del file](https://huggingface.co/litert-community/embeddinggemma-2-text-270m-litert-lm/blob/main/embeddinggemma-2-text-270m.litertlm)
- URL di distribuzione da fissare alla revisione: `https://huggingface.co/litert-community/embeddinggemma-2-text-270m-litert-lm/resolve/9be6e8b90982095dc05c2bd162e4b954ee4dbac7/embeddinggemma-2-text-270m.litertlm`. Non ancora provato come download.
- Byte esatti, tokenizer interno, metadati della conversione e precisione delle attivazioni: da verificare; il nome del file e int4 non bastano.

### Versioni e discrepanze da risolvere

La [release LiteRT-LM v0.18.0](https://github.com/google-ai-edge/LiteRT-LM/releases/tag/v0.18.0) annuncia EmbeddingGemma 2 anche su web. Il [manifest JS consultato su main](https://raw.githubusercontent.com/google-ai-edge/LiteRT-LM/main/js/packages/core/package.json) riporta invece `@litert-lm/core` **0.12.1**, Apache-2.0 e dipendenza `@litertjs/wasm-utils`. **Non sono versioni da considerare equivalenti:** il manifest main non certifica il contenuto del pacchetto npm pubblicato.

La [guida web aggiornata](https://developers.google.com/edge/litert-lm/js) usa i file `-gpu`, mentre il [README JS](https://raw.githubusercontent.com/google-ai-edge/LiteRT-LM/main/js/packages/core/README.md) indica `-web` e descrive l'API come anteprima. Non dedurre che i file siano intercambiabili perché hanno dimensioni simili.

Prima dell'adattatore L1: risolvere una versione npm esatta, integrità del pacchetto, export `EmbeddingEngine`, binari WASM e relativi hash; provare quel pacchetto con l'artefatto 270M. Registry/CDN non sono stati leggibili nelle richieste di questo audit; la richiesta shell ai metadati è fallita per risoluzione DNS nella sandbox. Nessuna installazione o escalation eseguita. La verifica resta un'attività tecnica del passo successivo, senza richiedere un nuovo incarico documentale.

Il formato [LiteRT-LM](https://github.com/google-ai-edge/LiteRT-LM/blob/main/schema/core/litertlm_header_schema.fbs) prevede sezioni tokenizer e metadati. In L1 verificare quelle effettive del file scelto: non abbinare un tokenizer esterno soltanto perché porta il nome della stessa famiglia. Per L3 fissare anche template conversazione e artefatto generativo alla versione qualificata.

## 4. Contratto embedding da qualificare

La [model card Google](https://huggingface.co/google/embeddinggemma-2) descrive pooling medio, proiezione a 768 dimensioni, troncamento seguito da rinormalizzazione e problemi numerici con float16. La [conversione testuale](https://huggingface.co/litert-community/embeddinggemma-2-text-270m-litert-lm) dichiara pesi transformer/embedding int4 QAT. Quantizzazione dei pesi e precisione delle attivazioni sono proprietà diverse: non promettere compatibilità numerica dalla sola sigla int4.

Le fonti non concordano sulla preparazione della ricerca:

| Fonte | Query | Documento |
|---|---|---|
| [Model card Google](https://huggingface.co/google/embeddinggemma-2) | `task: search result \| query: {query}` | `title: {title} \| text: {content}`, titolo assente `none` |
| [Guida LiteRT-LM](https://developers.google.com/edge/litert-lm/embedding_models) | `task: search query \| text: {query}` | `task: search result \| text: {content}` |

Il [wrapper JS consultato](https://github.com/google-ai-edge/LiteRT-LM/blob/main/js/packages/core/src/embedding_engine.ts) passa l'input al motore dopo normalizzazione del tipo; non espone qui una selezione del task di ricerca. Questo non esclude trasformazioni nel WASM o nei metadati. **La discrepanza resta aperta**, non corretta per intuizione.

L1 deve leggere i metadati/il percorso effettivo del pacchetto fissato e confrontare i due profili sul solo insieme di sviluppo annotato. Prima risolvere eventuale doppio prefisso; poi congelare il profilo e valutare sul campione separato. Una variante migliore sul piccolo corpus è evidenza empirica locale, non una conferma universale del contratto del produttore. Se non si ottiene un profilo verificabile, consegnare ricerca testuale e segnalare il limite.

Prima configurazione sperimentale: 768 dimensioni, input brevi con limite verificato dal tokenizer, output finito/non nullo e norma controllata. Riduzione a 256 solo come secondo confronto con nuova normalizzazione. Registrare sempre modello/hash, runtime/WASM, tokenizer, profilo query/documento, dimensione, pooling e normalizzazione nella chiave dell'indice. Cambiarli invalida soltanto i vettori ricostruibili. Rifiutare NaN, vettori nulli, dimensioni diverse e troncamenti silenziosi; preservare tutte le sezioni analizzabili mediante segmentazione.

## 5. Worker, rete e PWA

**Scelta di progetto:** un Dedicated Worker per parsing/inferenza, una sola elaborazione per scheda e nessun motore avviato nelle visite ordinarie. La disponibilità di WebGPU nel worker è documentata ma limitata e richiede un contesto sicuro; supporto API e supporto del pacchetto sono prove distinte. [WebGPU nel worker](https://developer.mozilla.org/en-US/docs/Web/API/WorkerNavigator/gpu)

Il worker riceve solo chunk e richieste del job, non oggetti sessione né accesso applicativo agli altri archivi. Un worker della stessa origine **può comunque usare rete e IndexedDB**: non è un confine di sicurezza contro codice malevolo. Limitare le dipendenze, nessun tool/AutoToolChat, nessuna URL ricavata dai documenti e traffico osservato con stringhe sentinella sintetiche. [API worker](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers)

Il controller assegna `jobId`, account e generazione; cancel, cambio account, documento eliminato o smontaggio invalidano risultati pendenti anche se il motore risponde in ritardo. Abort del download interrompe il flusso; file parziale mai marcato pronto. La guida JS documenta `conversation.cancel()` e `engine.delete()`; il wrapper embedding serializza anche `delete()` dietro la mutex, quindi non garantisce di interrompere una chiamata bloccata. Prevedere deadline e terminazione del worker, poi verificare recupero/rilascio nel browser. [Guida ciclo di vita](https://developers.google.com/edge/litert-lm/js), [wrapper embedding](https://github.com/google-ai-edge/LiteRT-LM/blob/main/js/packages/core/src/embedding_engine.ts)

| Requisito | Preparazione per L1/L4 |
|---|---|
| HTTPS e capacità | HTTPS o localhost attendibile; prova nel worker di `requestAdapter`, inizializzazione e calcolo. Segnali di memoria mancanti non diventano capacità negativa/positiva |
| CSP | JS/WASM da sorgenti fissate e preferibilmente stessa origine; verificare `script-src`, `worker-src`, `connect-src` e necessità di `wasm-unsafe-eval` sul runtime effettivo. Non aggiungere wildcard o `unsafe-eval` generale per far passare la demo. [Worker CSP](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/worker-src) |
| CORS/download | Provare GET anonimo con credenziali omesse, redirect/CDN finali e conteggio dei byte. Niente token Hugging Face nel client; se l'host richiede credenziali, quella distribuzione resta non utilizzabile dal prototipo |
| COOP/COEP | Nessuna attivazione globale preventiva. Se il WASM richiede memoria condivisa, qualificare un ambiente isolato e verificare asset, navigazioni e PWA prima di proporre gli header. [Isolamento](https://developer.mozilla.org/en-US/docs/Web/API/Window/crossOriginIsolated) |
| Memoria | Misure disponibili con nome/ambito dello strumento; `measureUserAgentSpecificMemory` ha requisiti propri. La sua assenza non giustifica header globali; heap JS non è memoria totale/GPU. [API memoria](https://developer.mozilla.org/en-US/docs/Web/API/Performance/measureUserAgentSpecificMemory) |
| Precache | Prova L1 fuori dal bundle ordinario oppure esclusione verificata degli asset AI prima di aggiungerli. Il manifest di build deve dimostrare zero pesi e zero runtime AI nella shell ordinaria |
| Cache | Pesi/runtime in cache versionata dedicata; dati per account in archivio studio. Nessun dato utente in Cache Storage condivisa. Rimozione delle vecchie cache shell non elimina le mappe |
| Offline | Dichiarare pronto solo dopo verifica di app/worker/WASM/tokenizer/pesi e riapertura senza rete; manuale disponibile anche senza modelli. Download incompleto, hash errato o asset mancante hanno stato esplicito |

La verifica dello spazio deve includere file temporanei e copia finale; la misura di memoria deve includere i buffer di download/hash/caricamento quando osservabili. Evitare copie integrali aggiuntive di pesi da gigabyte per la sola verifica. File incompleti in staging separato, pronti soltanto dopo integrità e commit dei metadati; invalidazione/eliminazione coordinata fra schede, senza rimuovere un modello ancora in uso o dati dello studio.

## 6. Persistenza, fonti e recupero da portare in L2

Contratto proposto `study-graph-v1` e archivio proposto `ipagell-study-db`, entrambi ancora assenti dal codice. Separare spazi, originali, testo/chunk immutabili, evidenze, concetti, archi, versioni e stato personale. I pesi comuni sono ricostruibili; i vettori hanno identità della pipeline e restano isolati per account/spazio.

Le evidenze puntano a `documentId`, versione di estrazione, pagina PDF a base 1 o sezione testuale, `chunkId` e intervallo `[start,end)` in **unità UTF-16 del testo immutabile del chunk**. Nessuna normalizzazione dopo il calcolo degli offset. L2 verifica emoji, caratteri combinati, accenti e citazioni ripetute; una nuova estrazione crea nuovi riferimenti, non sposta in silenzio quelli esistenti. Una fonte risolvibile non certifica che la sintesi la rappresenti correttamente.

ID permanenti assegnati dall'app, ID temporanei nella proposta AI; gerarchia senza cicli, legami trasversali tipizzati. Schema chiuso e limiti prima dell'anteprima; revisione attesa e commit atomico per accettare un diff. Nessun lavoro AI/network dentro una transazione IndexedDB aperta. Rollback come nuova revisione, evitando sovrascritture di modifiche successive o dello stato di apprendimento.

| Evento | Decisione iniziale per l'implementazione |
|---|---|
| Storage non disponibile/quota esaurita | Non mostrare «salvato»; conservare il risultato in memoria quando possibile e offrire export/copia. Mai cancellare mappe per liberare spazio ai pesi |
| Due schede | CAS nello storage e notifica per account; un risultato basato su revisione vecchia richiede nuova anteprima. Un messaggio BroadcastChannel non autorizza una scrittura |
| Logout | Flush del lavoro, invalidazione job e rilascio motori. Conservazione locale dichiarata e scelta esplicita di export/rimozione; non applicare allo studio la pulizia automatica delle note sincronizzate. Dati conservati accessibili dall'app solo tornando nello stesso account |
| Dispositivo condiviso | Informare che separazione per account non significa cifratura; lo storage della stessa origine e i backup in chiaro non sono protetti dalla password di accesso. Prevedere rimozione esplicita locale |
| Cancellazione account | Eliminare l'archivio dell'account su questo dispositivo dopo successo server; se fallisce, stato di pulizia pendente riprovabile, senza dichiarare cancellazione completa. Non promettere pulizia di altri dispositivi offline o export esterni |
| Fonte eliminata | Invalidare job e indice; eliminare originale, estratti, vettori, citazioni e loro copie storiche. Conservare nodi sostenuti da altre fonti; nodi senza fonti conservati e segnalati per revisione. Sintesi dipendenti dalla fonte marcate da rivedere |
| Versioni e cancellazione | Compattare/sanificare le versioni affinché rollback non resusciti la fonte cancellata; contenuti personali rimossi esplicitamente non ritornano tramite una proposta tardiva |
| Export/import | Archivio studio separato, versione/hash/limiti validati, restore su archivio vuoto e rimappatura ID. Originali e testo necessari alla verifica inclusi; pesi esclusi, embedding ricostruibili. Nessun import che attiva `/api/notes` |

L2 deve precisare come rimuovere o ricostruire le sintesi derivate che contengono testo della fonte eliminata: preservare automaticamente tutto il testo del nodo renderebbe falsa la promessa di cancellazione. Le annotazioni personali restano distinte. La scelta di eliminare i documenti non elimina esportazioni già scaricate.

## 7. Protocollo di valutazione iniziale `study-local-eval-v1`

I numeri seguenti sono **budget e criteri tecnici proposti in questo task**, non preferenze già approvate dall'utente, prestazioni osservate o soglie del produttore. Fissarli nel report prima dei confronti; ogni variazione successiva richiede nuova versione del protocollo e ripetizione delle misure coinvolte.

### Corpus e annotazione

Preparare **16 documenti sintetici o con autorizzazione registrata**, conservando fonti/licenze senza dati di studenti. Il corpus non è ancora creato da questo audit.

| ID pianificati | Contenuto | Caso da verificare |
|---|---|---|
| D01–D02, italiano | Reti, due lezioni successive, TXT + PDF digitale | Stesso concetto approfondito, nuovo argomento e negazione |
| D03–D04, italiano | Biologia, due lezioni | Omonimi, prerequisito esplicito e relazione soltanto apparente |
| D05–D06, italiano | Matematica, formule e tabella in PDF | Limiti di estrazione, simboli e ordine di lettura |
| D07–D08, tedesco | Due lezioni tecniche brevi | Citazioni e recupero in de |
| D09–D10, francese | Due lezioni di fisica | Citazioni e recupero in fr |
| D11–D12, inglese | Due lezioni su basi di dati | Citazioni e recupero in en |
| D13–D14, italiano | Documento lungo a colonne; testo con istruzioni ostili e link esterni | Segmentazione completa, timeout, nessuna esecuzione/fetch del link |
| D15–D16, italiano | PDF scansione senza testo; PDF con pagine miste | Segnalazione dei limiti; incolla e sezioni escluse esplicite |

Annotare **64 query con risposta** (40 it, 8 per de/fr/en) e **16 senza risposta** (10 it, 2 per altra lingua), con 1–3 passaggi rilevanti per query nel materiale leggibile. Metà delle query per sviluppo e metà per valutazione, stratificate per lingua; parafrasi della stessa domanda appartengono al medesimo gruppo. Il corpus di recupero è comune: non ottimizzare i profili sui risultati delle query di valutazione. Il campione è una prova iniziale, non una stima statistica della platea.

Ogni annotazione: `queryId`, lingua, testo query, documenti/pagine ammessi, estratti esatti e rilevanza, oppure elenco vuoto per assenza di risposta. Dopo aver fissato estrattore/segmentazione associare i passaggi ai chunk; annotazione verificata su originale e testo estratto prima del ranking. Per L3 aggiungere concetti essenziali, relazioni supportate, possibili contraddizioni e legami non supportati; un modello non è l'unico valutatore del proprio risultato.

### Baseline e misure

- Baseline: ricerca lessicale locale con tokenizzazione Unicode, normalizzazione dichiarata e punteggio deterministico. Stessi chunk, query e filtri del candidato embedding; vietato confrontare corpus diversi.
- Confronto: Recall@5 sui passaggi rilevanti e MRR@5 sulle query con risposta; query senza risposta riportate separatamente. Similarità cosine non diventa percentuale di verità; qualsiasi soglia di astensione si calibra sul gruppo di sviluppo.
- Riproducibilità: ordine, hash corpus, versioni estrattore/chunker, configurazione completa dell'indice; generazione con impostazioni/prompt e ordine delle lezioni registrati. Nessun contenuto reale nei log.
- Risorse: un download completo misurato, un tentativo interrotto, 3 avvii motore con pesi già in cache e 5 ripetizioni a caldo delle query. Separare rete, verifica hash, inizializzazione, indicizzazione, query e generazione; mediana/p95 e numero di osservazioni, non solo esempio migliore.

Per L3 contare affermazioni, relazioni e duplicati sull'intera proposta prima della selezione dell'utente; riportare a parte output invalidi e sezioni senza proposta. Misurare la copertura rispetto ai concetti annotati, evitando di migliorare artificialmente il supporto semantico mostrando solo poche risposte riuscite.

| Criterio | Obiettivo iniziale / esito richiesto |
|---|---|
| Riservatezza | Zero contenuti/sentinelle in richieste, URL, log o telemetria; riportare traffico normale dell'app separatamente dai download |
| Fonti e schema | 100% evidenze accettate risolvibili al passaggio esatto; zero output fuori schema applicato; zero riferimenti incrociati fra account |
| Utilità embedding | Recall@5 ≥ 0,90 globale e ≥ 0,80 per lingua; miglioramento globale ≥ 0,05 assoluto sulla baseline, MRR@5 senza regressione > 0,02. Criterio storico rettificato l’8 ottobre: con baseline 0,96875 il +0,05 è impossibile; non usarlo per respingere il risultato. Valutare delta, posizione, latenza e risorse, poi campione separato |
| Query a caldo | p95 ≤ 100 ms baseline, ≤ 1.500 ms embedding sul dispositivo dichiarato idoneo |
| Avvio e indice | Motore con pesi presenti ≤ 30 s desktop / 60 s mobile; PDF digitale rappresentativo di 5 pagine indicizzato ≤ 60 s / 120 s. Prova al limite separata, nessuna promessa sui PDF massimi dedotta da 5 pagine |
| Download | Candidato embedding ≤ 250 MB e insieme runtime/tokenizer/pesi ≤ 300 MB. E2B ≤ 2,2 GB, E4B ≤ 3,2 GB per la sola prova L3; scaricamento solo su scelta esplicita, spazio e byte reali mostrati prima |
| Interazione/cancel | Risposta visibile al comando annulla ≤ 1 s; stop del worker entro 2 s se il cancel cooperativo non termina. Nessun commit tardivo; verificare separatamente il rilascio effettivo delle risorse |
| Generazione L3 | Copertura concetti essenziali ≥ 90%; affermazioni e relazioni semanticamente supportate ≥ 95%; duplicati ≤ 5%; nessuna contraddizione grave presentata come fatto certo |
| Tempo generazione L3 | Per sezione di prova da massimo 1.024 token sorgente: proposta validata ≤ 30 s desktop / 60 s mobile. Inizio con contesto totale ≤ 4.096 e output ≤ 1.024 token, verificati sul tokenizer; massimo una riparazione |
| Recupero | Tutti gli scenari sotto senza perdita dello stato personale o sovrascrittura silenziosa; export/import ricostruisce mappa e fonti su archivio vuoto |

Limiti iniziali del banco di prova: PDF ≤ 10 MiB/50 pagine, testo estratto ≤ 100.000 code point, massimo un job per scheda. Per embedding partire da chunk ≤ 512 token complessivi incluso prefisso, riducendo la lunghezza se l'artefatto lo richiede. Limiti superati o pagine escluse devono essere dichiarati; nessuna elaborazione parziale presentata come completa. Nomi di file sanitizzati e tipo reale verificato; niente JavaScript, allegati attivi, URL esterni o macro eseguiti dal parser. PDF cifrati/non supportati offrono incolla.

**Dispositivi da qualificare:** desktop Chromium/WebGPU come primo banco; Android di fascia intermedia con Chrome; iPhone/iPad con Safari e PWA; desktop Safari/Firefox per disponibilità o percorso manuale. Registrare modello fisico, OS/browser/versione, API/backend disponibili e stato alimentazione. Nessun dispositivo o versione è stato provato qui. La qualifica è per combinazione reale; la mancata idoneità AI mantiene manuale/testuale.

**Scenari obbligatori:** rete assente; download interrotto/hash errato; quota e persistenza negata; riapertura offline; PDF vuoto/scansione/misto/oltre limite; vettori invalidi; worker/GPU persi; tab in background; doppia scheda; cambio account durante elaborazione; fonte eliminata durante job; revisione obsoleta; commit abortito; rollback dopo altri edit; cancellazione con storia; restore/export; UI da tastiera, focus, riduzione movimento e quattro lingue. Per il prototipo usare account sintetici e sentinelle, senza materiali o traffico ai dati di produzione.

## 8. Copertura delle considerazioni e condizioni di rilascio

Le [41 considerazioni](SPAZIO-STUDIO-AI-CONSIDERAZIONI.md) restano la lista di riferimento; questa tabella ne assegna l'applicazione senza attestare conformità legale.

| Considerazioni | Applicazione locale / fase responsabile |
|---|---|
| 1–8, 18–19, 30–32, 40–41: scopo, fonti, ID, stato, versioni, idempotenza | L2 contratto/manuale e L3 proposte; identità documento/hash/pipeline nello spazio, stato personale separato e nessun voto automatico |
| 9–13, 20–24: dati, provider, minimizzazione, input ostile, file e permessi | L1 parser/worker/rete; L2 isolamento; L4 informativa del comportamento reale. Upload/IDOR/URL firmati restano requisiti dell'eventuale variante remota |
| 6, 25–28: cancellazione, account, backup e incidenti | L2 export/restore e cancellazione della storia; L4 uscita/account, contatto, disattivazione e procedura di recupero |
| 29, 33–35: risorse, qualità, usabilità e progressione | Protocollo L0, misure L1/L3 e journey L4; disponibilità locale non sostituisce prove semantiche e fisiche |
| 14–17, 36–39: informative, copyright, minori, mercati, responsabilità e condivisione | Prima dell'uso reale: titolare/contatto, utenti/età/Paesi, condizioni dei materiali e della distribuzione, conservazione locale, supporto e verifica professionale pertinente; uso scolastico istituzionale e condivisione sono progetti separati |

Prima di L4 con lavoro reale: export/restore, isolamento e concorrenza, cancellazione completa nell'archivio locale, conservazione su logout e comprensione degli stati devono essere verificati. Prima di pubblicare: informative e responsabilità definite, dipendenze/licenze controllate, dispositivi dichiarati provati, quattro lingue e percorso manuale utilizzabile. Nessuna inferenza di prontezza da build o benchmark del produttore.

Una futura copia negli Appunti deve mostrare prima della conferma che il testo andrà al server e sarà una copia indipendente; non è inclusa nel primo prototipo. Qualunque variante cloud richiede un nuovo perimetro con provider, regione, retention, costi e cancellazione definiti; non si attiva per errore del modello locale.

## 9. Verifiche realmente eseguite e residui

- Letti `AGENTS.md`, snapshot, architettura, matrice, sicurezza, documenti AI e codice dei confini elencati; conservate le modifiche preesistenti.
- Consultate documentazione Google AI Edge, repository Google del runtime, model card/conversioni indicate dalle guide ufficiali e documentazione API Mozilla. Verificati metadati pubblicati, senza caricare pesi o eseguire modelli.
- Nessuna modifica a runtime, dipendenze, endpoint, database, hosting o domini; nessun accesso a materiali utente, agente delegato o deploy.
- Controlli documentali e whitespace: esiti registrati nella [matrice di verifica](VERIFICATION-MATRIX.md#spazio-studio-l0--7-ottobre-2026).

Residui tecnici prima del benchmark AI: pacchetto npm/WASM fissato, tokenizer/metadati, profilo prefissi e precisione, prova 270M nel worker, CORS e dimensioni effettive. Corpus e dispositivi ancora da preparare/provare. Questi residui limitano la qualifica dei modelli, senza impedire la base manuale/testuale.
