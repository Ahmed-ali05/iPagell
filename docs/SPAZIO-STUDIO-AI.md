# Spazio studio AI per materia

[Indice](../README.md) · [Classi](CLASSI.md) · [Piano prodotto](PRODOTTO.md) · [Sicurezza](../SECURITY.md)

Visione funzionale e architetturale per una fase futura. **Non è implementata né promessa nella versione corrente.** L'obiettivo è trasformare dispense e documenti delle lezioni in una mappa progressiva e verificabile del corso, non aggiungere un chatbot generico.

## Proposta di valore

Ogni materia può avere uno spazio personale. Dopo una lezione, lo studente carica la nuova dispensa; iPagell estrae i concetti, li collega a quelli già presenti e mostra cosa è nuovo, approfondito o in conflitto.

L'interfaccia principale è un albero esplorabile:

```text
Materia
├── Macro-argomento
│   ├── Concetto
│   │   ├── definizione breve
│   │   ├── prerequisiti e collegamenti
│   │   └── fonti: documento, pagina e lezione
│   └── Concetto
└── Macro-argomento
```

Il modello interno è in realtà un grafo: un concetto può dipendere da più rami. L'albero è una proiezione leggibile, mentre i collegamenti trasversali evitano duplicazioni artificiali.

## Esperienza del prodotto

1. L'utente apre una materia e crea lo spazio studio.
2. Carica una dispensa indicando facoltativamente titolo e data della lezione.
3. L'app mostra estrazione in corso, eventuali pagine illeggibili e costo/quota prima dell'analisi.
4. L'AI propone un aggiornamento incrementale: nuovi nodi, nodi ampliati, collegamenti e possibili conflitti.
5. L'albero si aggiorna conservando versione precedente e comando di annullamento. Le novità sono evidenziate.
6. Aprendo un nodo si vedono spiegazione sintetica, fonti esatte, cronologia e stato personale di apprendimento.

Gli stati “da rivedere”, “in studio” e “acquisito” sono scelti dall'utente. Il caricamento di un file non prova che un concetto sia stato imparato. Eventuali quiz futuri suggeriscono progressi, ma non modificano lo stato in modo opaco.

## Regole di fiducia

- Ogni affermazione generata deve puntare ad almeno un passaggio del materiale con documento e pagina/sezione.
- Per impostazione predefinita il sistema risponde solo dalle fonti caricate; conoscenza esterna deve essere una modalità separata e dichiarata.
- Testo non supportato, fonti contraddittorie e bassa confidenza sono mostrati come tali, non colmati con invenzioni.
- Il documento originale, il testo estratto e le versioni dell'albero restano consultabili e cancellabili.
- L'AI può proporre unione, separazione o rinomina dei concetti; gli identificatori stabili preservano note, stato e cronologia.
- Ogni importazione produce un diff annullabile, non una riscrittura irreversibile dell'intero corso.

## Formati e confini iniziali

Prima versione candidata: PDF nativi, DOCX, PPTX, TXT e Markdown. OCR per scansioni e immagini viene dopo una prova di qualità separata. Ogni formato ha limiti espliciti di dimensione, pagine e quota mensile; archivi, eseguibili, macro e contenuti attivi sono rifiutati.

Lo spazio nasce personale. La condivisione è selettiva: l'utente può pubblicare nella classe un materiale o una versione esportata della mappa, ma non espone automaticamente documenti, annotazioni o stato di apprendimento. Un unico albero collaborativo della classe è escluso finché versionamento, attribuzione e moderazione non saranno maturi.

## Modello concettuale

| Entità | Responsabilità |
|---|---|
| `study_spaces` | Un ambiente per utente e materia, con lingua e impostazioni |
| `study_documents` | Metadati, storage key, hash, stato elaborazione, data lezione e cancellazione |
| `document_chunks` | Testo estratto, posizione, embedding e riferimenti alla fonte |
| `concept_nodes` | Concetto stabile, titolo, sintesi e stato personale |
| `concept_edges` | Relazioni gerarchiche, prerequisiti e collegamenti trasversali |
| `concept_evidence` | Collegamento tra nodo e passaggi/pagine che lo sostengono |
| `graph_versions` | Snapshot/diff per importazione, autore del processo e rollback |
| `ingestion_jobs` | Stato, avanzamento, errori minimizzati, consumo e idempotenza |

I file non entrano in D1: servono object storage privato e URL firmati di breve durata. D1 conserva metadati, autorizzazioni e versioni; un indice vettoriale contiene rappresentazioni derivate, sempre isolate per utente/spazio. Una coda elabora i documenti fuori dalla richiesta HTTP.

## Pipeline proposta

```text
caricamento diretto protetto
  → verifica tipo/dimensione/hash e scansione
  → estrazione testo/OCR
  → segmentazione con coordinate di pagina
  → indicizzazione per spazio e utente
  → estrazione strutturata di concetti e relazioni
  → confronto con il grafo esistente
  → validazione fonti e vincoli
  → nuova versione + diff visibile
```

Il job è idempotente: lo stesso file e la stessa richiesta non duplicano nodi o costi. Fallimenti parziali non pubblicano un grafo incompleto. Prompt, modello, versione dell'estrattore e schema di output sono registrati per riprodurre il risultato, senza conservare segreti o ragionamenti interni del modello.

Il fornitore AI resta dietro un adattatore. La scelta finale dipenderà da qualità su italiano, trattamento dei dati, disponibilità regionale, costi, output strutturati e contratto che escluda l'addestramento sui documenti. Cambiare fornitore non deve richiedere migrazioni del prodotto.

## API funzionale prevista

```text
GET, POST       /api/study-spaces
GET, PATCH, DELETE /api/study-spaces/:spaceId
POST             /api/study-spaces/:spaceId/uploads
POST             /api/study-spaces/:spaceId/documents/:documentId/process
GET, DELETE      /api/study-spaces/:spaceId/documents/:documentId
GET              /api/study-spaces/:spaceId/jobs/:jobId
GET              /api/study-spaces/:spaceId/graph
GET              /api/study-spaces/:spaceId/graph/versions
POST             /api/study-spaces/:spaceId/graph/rollback
PATCH            /api/study-spaces/:spaceId/concepts/:conceptId
```

Il caricamento usa URL firmati e una finalizzazione server, non attraversa il payload JSON del diario. Tutti gli endpoint verificano proprietario e spazio; i job non accettano identificatori utente forniti come autorità dal browser.

## Rischi specifici e difese

| Rischio | Difesa di progetto |
|---|---|
| Allucinazioni o riassunti errati | Citazioni obbligatorie, soglia di supporto, diff e rollback |
| Prompt injection dentro le dispense | Il documento è dato non istruzione; tool e rete disabilitati nel job; output vincolato a schema |
| File malevoli | Allowlist reale del tipo, limiti, parsing isolato, scansione e rifiuto contenuto attivo |
| Accesso incrociato | Namespace per utente/spazio, autorizzazione a ogni lettura e test IDOR su file, chunk e vettori |
| Esfiltrazione al fornitore | Minimizzazione, accordo no-training, segreti server-side, provider e regione documentati |
| Costi incontrollati | Quote, stima prima del processo, deduplicazione per hash, timeout e budget per job |
| Copyright e dati di terzi | Conferma del diritto d'uso, condivisione disattivata di default, rimozione completa verificabile |
| Dati di minori | Informativa comprensibile, raccolta minima, nessuna pubblicità/profilazione, verifica legale prima del lancio |

Il testo estratto, gli embedding e le mappe derivate sono dati dell'utente tanto quanto il file originale: la cancellazione deve coprirli tutti. Va definito e provato un tempo di eliminazione anche per code, cache e copie infrastrutturali.

## Misure di qualità

Una demo gradevole non basta. Il prototipo deve usare un corpus autorizzato e rappresentativo di almeno più materie, PDF digitali e documenti con tabelle/formule. La valutazione controlla:

- percentuale di nodi con citazione valida e pagina corretta;
- concetti importanti mancanti o duplicati;
- stabilità dell'albero dopo caricamenti successivi;
- capacità di riconoscere contraddizioni e pagine non leggibili;
- tempo e costo per documento;
- comprensione dell'interfaccia da parte di studenti reali;
- cancellazione completa di file, estratti, vettori e versioni.

I risultati vanno conservati come report di valutazione versionato. Non scegliere modello o prompt sulla base di pochi esempi riusciti.

## Realizzazione senza eccessi

| Fase | Contenuto | Esclusioni |
|---|---|---|
| A0 — prova tecnica | 10–20 documenti autorizzati, estrazione, citazioni e albero statico | Nessun dato utente in produzione |
| A1 — spazio personale | Upload PDF/DOCX/PPTX, job asincrono, albero incrementale, fonti, versioni, cancellazione e quote | Niente chat o condivisione |
| A2 — studio | Ricerca e domande solo sulle fonti, cronologia lezioni, stati personali e ripasso | Niente valutazione scolastica automatica |
| A3 — condivisione scelta | Pubblicazione esplicita di materiali o mappe nella classe con attribuzione | Niente modifica collaborativa simultanea |
| A4 — evoluzione | OCR, quiz e grafo collaborativo soltanto se qualità e domanda lo giustificano | Nessuna automazione opaca |

Prerequisiti per A1: classi affidabili non sono tecnicamente obbligatorie, ma lo sono informativa privacy, cancellazione dati, object storage, code, monitoraggio costi, canale sicurezza e valutazione A0 superata.

## Decisioni da prendere prima del prototipo

Non servono per costruire classi, ma vanno chiuse prima di inviare documenti reali a un modello: fornitore e regione, budget e quote, tempi di conservazione, formati/limiti definitivi, policy per minori, materiali protetti da copyright, responsabilità operativa e soglie quantitative dell'evaluation.
