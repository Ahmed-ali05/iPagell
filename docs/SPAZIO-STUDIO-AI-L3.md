# Spazio Studio — prova generativa locale L3

[Indice](README.md) · [Protocollo L0](SPAZIO-STUDIO-AI-L0.md) · [L2](SPAZIO-STUDIO-AI-L2.md) · [Prompt](SPAZIO-STUDIO-AI-PROMPTS.md) · `experiments/study-local/README.md`

**8 ottobre 2026. Banco L3 implementato nel laboratorio separato; generatore non qualificato. Nessuna pubblicazione.**
La mappa L2 conserva il contratto manuale. Le proposte generative sono effimere e non hanno
un comando per scrivere nell’archivio: l’accettazione del diff richiede prima il superamento
delle soglie semantiche e di risorse del protocollo L0. L4 non è avviato.

> Questo documento conserva la prova iniziale v1 e i suoi esiti storici. La diagnosi delle
> risposte effettive, le correzioni e le nuove misure sono nel [rapporto di ripresa](SPAZIO-STUDIO-AI-RIPRESA.md).
> Il rifiuto JSON iniziale non basta a giudicare E2B indipendentemente da prompt e adattatore.

## Artefatto e risorse

Primo candidato: `gemma-4-E2B-it-gpu.litertlm`, runtime `@litert-lm/core@0.18.0` già fissato
dal laboratorio L1. Il [runtime ufficiale](https://developers.google.com/edge/litert-lm/js)
elenca questa variante GPU fra i modelli supportati. Nessuna nuova dipendenza npm.

| Campo | Valore fissato |
|---|---|
| Repository | `litert-community/gemma-4-E2B-it-litert-lm` |
| Revisione | `b3ca0d2f076785a8f4b2219ddbd2bdb99954eae1` |
| Byte | 2.008.432.640 |
| SHA-256 LFS | `a53a59001894c58e6bdb5b9b227709f91a2e3e556baa7d85acf9c55402ba5cf5` |
| Licenza dichiarata | Apache-2.0 |
| Spazio libero minimo | 4.083.974.144 byte: due copie dei pesi più 64 MiB |

Dimensione e hash derivano dal [puntatore LFS fissato](https://huggingface.co/litert-community/gemma-4-E2B-it-litert-lm/raw/b3ca0d2f076785a8f4b2219ddbd2bdb99954eae1/gemma-4-E2B-it-gpu.litertlm),
distinto dall’hash Xet. [Repository e licenza](https://huggingface.co/litert-community/gemma-4-E2B-it-litert-lm/tree/b3ca0d2f076785a8f4b2219ddbd2bdb99954eae1).
Non è stato selezionato E4B: il candidato più piccolo deve essere prima misurato.

La verifica iniziale richiede WebGPU in worker, contesto sicuro, OPFS e quota/uso noti.
Il download ha un comando dedicato con byte e origine visibili; non parte all’apertura.
I byte vengono scritti e verificati incrementalmente in OPFS, evitando una seconda copia
integrale in un array JavaScript. Un errore/annullamento elimina il file parziale. Una copia
preesistente viene sempre riverificata prima di essere passata al motore come stream.
L’hash cede esplicitamente il thread ogni 4 MiB, anche se lo stream del file è già
leggibile, per mantenere reattivi input, annullamento e cambio profilo. Il confronto
richiede il file già presente: soltanto il comando dedicato può avviare il download.
“Rimuovi file del generatore” elimina soltanto questo artefatto ricostruibile.

La riserva su disco non è una misura della RAM o della memoria GPU. Il runtime può usare
ulteriori buffer; il browser di prova non espone una misura attendibile del picco CPU/GPU.
Non dichiarare il dispositivo qualificato dopo il solo controllo di ammissione.

## Contratto delle proposte

`experiments/study-local/src/proposals.ts`: `study-proposals-v1`.
Una sezione corrisponde a ciascun chunk canonico L1, senza filtro di rilevanza sui nuovi
argomenti. I paragrafi lunghi rimangono segmentati dal chunker L1; nessun troncamento nuovo.

Ogni risposta è un oggetto JSON chiuso con `version`, `nodes`, `edges`. Massimo 5 concetti,
6 relazioni, 16.000 unità UTF-16 di risposta; titolo 120 e sintesi 600 unità. Gli ID dei
concetti sono temporanei `p1`–`p5`. Sono obbligatorie 1–3 citazioni ammesse, compreso il
passaggio corrente. Le citazioni risolvono chunk/pagina/intervalli UTF-16 già verificati.
Una proposta `merge`, `deepen` o `possible-contradiction` deve indicare un candidato esatto
e una sua fonte oltre alla fonte nuova. Non si deduce un’unione dalla sola similarità.

Relazioni: `hierarchy`, `related`, `prerequisite`, `contrast`. Endpoint presenti, nessun
autocollegamento, duplicato, ciclo gerarchico o doppio genitore. Niente campi operativi,
tool call, HTML, Mermaid o fence Markdown. L’anteprima usa soltanto `textContent`.
Schema e riferimenti validi non attestano la correttezza della sintesi o della relazione.

Il diff è di sola lettura, conserva l’ID candidato e non include note/stato personale.
Il contratto persistente `study-graph-v1` resta manuale: nessun contenuto AI viene marcato
falsamente come manuale. Scrittura dei diff, provenienza delle sintesi AI e idempotenza
di accettazione sono esplicitamente rinviate alla qualificazione del generatore.

## Budget, isolamento e confronto iniziali (v1)

Engine: backend `GPU_ARTISAN`, contesto massimo 4.096 token, benchmark abilitato. Il codice
SDK fissato usa questo backend per il caricamento in streaming; il backend `GPU` di L1
resta separato e non viene riutilizzato per i pesi generativi. Conversation:
thinking disabilitato, `TOP_K`, `k=1`, temperatura 0, seed 42, output massimo 1.024 token.
Non è dichiarata deterministica la numerica GPU.

Il tokenizer e il template sono quelli incorporati nel file. Prima di generare, il prefill
della sola sorgente deve contare al massimo 1.024 token, **incluso** l’overhead del template
(ammissione conservativa). Il prefill del prompt completo deve restare entro 3.000 token;
si lasciano 1.024 token di output e 72 per il breve turno finale `JSON`/delimitatori.
Il limite rigido engine resta 4.096; conteggio totale e decode sono ricontrollati a fine
risposta. Nelle prime tre sezioni del corpus il tokenizer ha misurato 31/34/32 token sorgente,
prefill 393/398/396 e ultimo decode 479/522/347. Il percorso è eseguito nel runtime reale;
la qualificazione completa su sezioni/dispositivi diversi rimane aperta.

Un worker classic separato carica solo WASM same-origin. Avvio massimo 120 s, poi watchdog
nel thread principale di 30 s **per sezione**, inclusa una sola riparazione. La riparazione
ricrea dal testo, non reinserisce la risposta invalida. Un timeout termina il worker;
il report conserva le sezioni già completate e non qualifica la prova incompleta.
Cancel, cambio profilo, aggiornamento mappa, purge e cambio fonti invalidano la prova,
l’anteprima e gli URL export. Eventuali risposte con job ID scaduto vengono ignorate.
Gli errori SDK non vengono riportati integralmente perché potrebbero contenere input.

Sequenza del confronto: generatore senza recupero → worker terminato → embedding → worker
terminato → generatore con candidati. Nessun secondo download implicito: l’embedding deve
essere già stato ottenuto con il comando esplicito L1. Sul corpus i candidati manuali sono
i passaggi delle lezioni precedenti, esclusi documento corrente e lezioni future **prima**
del ranking. Per materiale custom si usano solo concetti con fonti della mappa L2 aperta.
Massimo due candidati nel prompt; tutte le sezioni nuove sono comunque analizzate.

Fetch ammette soltanto gli URL fissati dei due artefatti, asset/runtime/fixture locali e
GET/HEAD senza body. CSP del laboratorio invariata; niente query costruite dai documenti,
account/API iPagell, tools, sincronizzazione o fallback cloud. La guardia fetch non è una
sandbox contro codice same-origin malevolo e non cattura tutto il traffico del browser.

## Valutazione ed evidenze

`experiments/study-local/src/generation-eval.ts`: 40 concetti essenziali,
uno per ciascun passaggio annotato L1, con riferimento esatto verificato sull’estrazione reale,
negazioni e istruzioni ostili. Nessun modello è giudice unico di sé stesso.
Il report conta tutte le sezioni, anche vuote o invalide, concetti/relazioni proposti,
tentativi, token, tempi e output invalidi prima della selezione dell’utente. Le misure
semantiche sono `null` finché non avviene la revisione umana dell’intera proposta; nessun
numero di concetti viene presentato come numero di affermazioni supportate.

| Prova | Esito |
|---|---|
| `npm run study:check` | Tipi e 47 test passati: 15 L1 + 18 L2 + 14 L3 |
| Nuovi test L3 | Copertura di tutte le sezioni, schema/limiti/citazioni, markup/tool/ID inventati, negazioni nel prompt, candidato/fonti di entrambe le lezioni, relazioni/cicli, diff senza note personali, quota, stream/hash/abort, rete, annotazioni reali PDF/TXT, denominatori e watchdog/risultati tardivi |
| Ammissione browser | Chromium 154/macOS, 8 thread dichiarati, WebGPU worker e shader-f16 disponibili; contesto sicuro senza cross-origin isolation; quota circa 10,9 GB, uso iniziale circa 164,7 MB |
| Download annullato reale | Avanzamento osservato a 8.441.328 byte; annullamento riportato dall’interfaccia e stato L3 azzerato |
| File completo e avvio | File locale verificato; `GPU_ARTISAN` avviato in 3.073 ms. `experiments/study-local/reports/l3-runtime-probe.json`. Nessun documento passato al motore in questa prova |
| Annullamento riverifica | File locale letto parzialmente, comando Annulla ricevuto e stato azzerato. Round trip del comando di automazione 965 ms; non è una qualificazione universale del tempo UI/GPU |
| Tentativo sul corpus | 43 sezioni previste; prime 3 completate senza proposte valide, 6 output rifiutati dopo massimo una riparazione. Tempi 20.324,7 / 27.281 / 20.619,9 ms. La quarta sezione raggiunge il watchdog di 30 s: worker terminato, 40 sezioni non completate. `experiments/study-local/reports/l3-corpus-attempt.json` |
| Diagnosi su una sezione breve | Ulteriore prova sintetica sul DNS, 2 risposte rifiutate con `JSON_SYNTAX`, 27.692,7 ms inclusa riparazione. `experiments/study-local/reports/l3-diagnostic.json`. Non è il corpus completo; non attribuire metriche semantiche a questo campione |
| Ripetizione diagnostica finale | Stessa sezione breve, 2 risposte rifiutate con `JSON_SYNTAX`, 22.283,5 ms inclusa riparazione; avvio 2.312,3 ms. Stato UI `no-valid-proposals` verificato. `experiments/study-local/reports/l3-diagnostic-final.json` |
| Recupero e stato personale | Il ramo embedding non è raggiunto dopo l’interruzione della baseline. Verificata riapertura del profilo A con due concetti, fonte, nota e stato personale conservati |
| App e build | `npm run check`: lint/tipi, 114 test, i18n 758 chiavi, documentazione. Build principale e laboratorio riuscite, 31 asset shell; nessun identificativo/asset studio o modello nel client/precache dell’app |

| Modalità | Proposte valide | Copertura/supporto/duplicati/stabilità | Decisione |
|---|---|---|---|
| E2B senza recupero, corpus | 0 nelle 3 sezioni completate; prova interrotta alla quarta | Non misurabili sul corpus incompleto e senza JSON valido | Non qualificato |
| E2B con embedding | Non eseguito: baseline interrotta | Non disponibili | Nessuna conclusione sul beneficio del recupero |
| E4B | Non scaricato/provato; confronto facoltativo L0 | Non disponibili | Nessun modello selezionato |

La diagnosi non attribuisce al modello errori di contenuto: le risposte osservate non
superano neppure il formato JSON richiesto. I messaggi diagnostici riportano categorie
fisse, senza copiare risposte invalide o input in errori/console. Il report originale della
diagnosi usa lo stato `human-review-required`, ma `validSections=0` e `passed=false`;
l’interfaccia corrente distingue esplicitamente `no-valid-proposals`, verificato nella
ripetizione diagnostica finale, e non dichiara il contratto verificato quando tutte le
risposte sono rifiutate.

Per riprodurre: `npm run study:dev`; verificare dispositivo/spazio; comando download/avvio;
caricare il corpus L1; ottenere esplicitamente l’embedding L1; rifare l’ammissione se un
cambio contesto l’ha azzerata; confrontare tutte le sezioni; preparare/scaricare report
oppure conservare il JSON. L’export può includere testo delle proposte e riferimenti: è
una copia locale da gestire come il materiale di studio. Non viene caricato su un servizio.

## Decisione e residui

**Esito storico v1 negativo con quel prompt/adattatore/dispositivo.**
Per la decisione corrente vedere il [rapporto di ripresa](SPAZIO-STUDIO-AI-RIPRESA.md).
Avvio riuscito e contratto protetto, ma nessuna proposta valida nel tentativo e deadline
superata. Nessun modello è selezionato per l’uso reale. Le soglie L0 restano: copertura ≥90%,
supporto semantico di affermazioni e relazioni ≥95%, duplicati ≤5%, nessuna contraddizione
grave come fatto certo, tempo per sezione ≤30 s desktop/60 s mobile. Non sono sostituite
dai test del contratto. Restano miglioramento e nuova versione del prompt/trasporto JSON,
confronto completo, revisione semantica,
tre avvii e ripetizioni, stabilità fra lezioni, perdita GPU reale, picco RAM/GPU, dispositivi
fisici/mobile, offline, rete completa e UX/accessibilità/localizzazione. L’accettazione e
L4 restano sospesi; ricerca e mappa manuale rimangono disponibili.
