# Candidati e fonti primarie

[Analisi](../LEZIONI-LIVE-AI.md) · [Piano](PLAN.md) · [Protocollo](EVALUATION.md)

**Consultate il 10 ottobre 2026.** Le pagine documentano capacità o dati pubblicati; nessun artefatto è stato scaricato, avviato o misurato in questa preparazione. Fissare revisioni/versioni/hash in LN-01: i link a `main`/`latest` non identificano un benchmark riproducibile.

## Speech-to-text

| Candidato | Evidenza primaria | Valutazione per la prima prova |
|---|---|---|
| **Whisper `base` / `tiny` multilingue** | Il progetto distingue varianti multilingue e `.en` solo inglese. [Repository OpenAI](https://github.com/openai/whisper); limiti e chunking nella [model card base](https://huggingface.co/openai/whisper-base) | Riferimento iniziale per italiano; impostare trascrizione, non traduzione. Confrontare leggerezza e perdita di termini/numeri; non scegliere `.en` |
| **Vosk `vosk-model-small-it-0.22`** | Catalogo ufficiale: 48M, Apache-2.0; italiano grande 1,2G. [Modelli](https://alphacephei.com/vosk/models). API streaming/offline nella [presentazione ufficiale](https://alphacephei.com/vosk/) | Alternativa leggera da qualificare, con port browser da scegliere. I punteggi del catalogo su dataset diversi non sono un confronto diretto con Whisper né una prova in aula |
| **Moonshine** | API locali/WASM e streaming documentati; nel catalogo attuale non compare l’italiano. Licenze MIT per molti modelli e Community non commerciale per alcune varianti legacy. [Catalogo](https://moonshine-voice.readthedocs.io/en/latest/models/available-models/), [Quickstart](https://moonshine-voice.readthedocs.io/en/latest/quickstart/) | Escluso dal confronto italiano iniziale. Riesaminare se compare un checkpoint italiano utilizzabile; non attribuire al riconoscimento italiano la disponibilità di voci TTS italiane |

Nessun vincitore è già deciso. «Leggero» richiede almeno quattro misure distinte: download completo, memoria in esecuzione, ritardo e consumo nella sessione lunga. Non confrontare WER pubblicati su corpus/lingue differenti.

## Runtime e acquisizione

| Opzione | Evidenza e limite | Decisione |
|---|---|---|
| **Transformers.js, ONNX/WASM/WebGPU** | La guida mostra ASR Whisper su WebGPU e descrive il backend WASM e i limiti del supporto GPU. L’esempio Whisper è inglese. [Guida ufficiale](https://huggingface.co/docs/transformers.js/guides/webgpu) | Primo percorso browser da qualificare per il checkpoint italiano multilingue. Conversione, precisione, tokenizer e download completi da fissare; supporto GPU non garantito dal nome Chrome |
| **whisper.cpp** | Il progetto offre WebAssembly e `stream.wasm`; definisce il proprio esempio streaming come semplice elaborazione continua di finestre. Tabella pubblicata ggml: tiny 75 MiB, base 142 MiB su disco; memoria indicativa circa 273/388 MB. [Repository](https://github.com/ggml-org/whisper.cpp) | Secondo percorso o riferimento nativo se necessario per diagnosi. Questi valori non descrivono ONNX, quantizzazioni, memoria browser/GPU o latenza sul notebook scelto |
| **Web Speech API** | `SpeechRecognition` può usare servizi remoti; MDN documenta anche capacità locali da verificare. [API](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition) | Non usare il riconoscimento predefinito come scorciatoia per la promessa locale. Un eventuale percorso locale italiano richiede prova esplicita e nessun ripiego remoto |
| **Microfono browser** | `getUserMedia` richiede contesto sicuro e permesso utente. [MDN](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia) | Avvio esplicito, stato visibile e stop delle track. Permesso browser distinto dal trattamento delle persone ascoltate |

Whisper lavora su finestre audio e può essere usato su audio lungo tramite chunking; «live» è quindi una proprietà della pipeline e del ritardo misurato, non una garanzia di streaming nativo parola per parola. [Model card](https://huggingface.co/openai/whisper-base).

Non è stato scelto un VAD: rilevare voce/silenzio è un componente operativo da provare, con attenzione alla perdita di parole e alle pause. Non risolve selezione della materia, riconoscimento del docente o separazione delle voci.

## Appunti e precedenti interni

- **Baseline estrattiva prima della generazione:** decisione di progetto per attribuire gli errori e misurare il beneficio della riscrittura. Non è una capacità promessa dai modelli ASR.
- **Generatore locale:** candidato non selezionato. Lo [Spazio Studio L3](../SPAZIO-STUDIO-AI-RIPRESA.md) conserva prove negative della specifica combinazione E2B/runtime/prompt, con revisione umana ancora aperta. Non trasferire la qualifica del recupero embedding alla generazione di appunti.
- **Embedding:** aggiunta eventuale per confronto semantico, da giustificare con un confronto sulla selezione. Non usare la sola similarità per eliminare una digressione apparente o attestare un fatto.

## Fonti per il successivo uso scolastico

| Fonte | Riscontro | Limite per questa iniziativa |
|---|---|---|
| [IFPDT — registrazione di conversazioni](https://www.edoeb.admin.ch/it/registrazione-di-conversazioni) | Richiama LPD e CP, ascolto/registrazione di conversazioni non pubbliche e consenso preventivo informato | Non è un parere sul buffer effimero del prodotto o sulle regole di uno specifico istituto/cantone |
| [Garante — scuola](https://www.garanteprivacy.it/it/temi/scuola) | Distingue registrazione per studio personale, disposizioni scolastiche e altri usi/diffusione; tratta anche minori e strumenti didattici | Non autorizza automaticamente un servizio commerciale, sincronizzazione o pilota scolastico. Le eccezioni per strumenti compensativi richiedono contesto specifico |

La lingua italiana e il fuso Europe/Zurich non identificano la legge applicabile alla scuola. Questi riscontri motivano la verifica preliminare di LN-04; non impediscono la preparazione con dati sintetici. Le scelte su minimizzazione, mancato invio, assenza di audio persistente e revisione della nota sono requisiti proposti, ancora da verificare.

## Registro artefatti da completare in LN-01

Per ogni combinazione annotare: fonte e revisione immutabile; licenze codice/pesi/conversione e condizioni dell’host; nomi e byte di tutti i file; SHA-256 verificati; runtime/commit; precisione e tokenizer; lingua e campionamento; configurazione finestra/VAD/overlap; backend; URL e redirect consentiti; esito avvio/offline/cancellazione. Lasciare «non verificato» ciò che non è stato provato.
