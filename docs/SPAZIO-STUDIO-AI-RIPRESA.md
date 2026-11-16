# Spazio Studio — diagnosi e ripresa locale, 8 ottobre 2026

[Indice](README.md) · [L1](SPAZIO-STUDIO-AI-L1.md) · [L3](SPAZIO-STUDIO-AI-L3.md)

**Esito: il 270M mostra un vantaggio di recupero; E2B con questo runtime/adattatore non è qualificato per aggiornare la mappa.** Correzioni e inferenze reali eseguite; revisione umana ancora da fare. Mappa L2 e dati personali conservati.

## Protocollo congelato prima delle nuove misure

Challenge ricerca v2 separata dal corpus originale: 48 passaggi sintetici, 16 query positive
(it 8, de 2, fr 3, en 3) e 4 senza risposta. Parafrasi, negazioni, omonimi e distrattori
che riportano affermazioni errate esplicitamente marcate. Gold fissati in
[hard-corpus.ts](../experiments/study-local/src/hard-corpus.ts), da revisionare da una persona.
Non è un test cieco esterno: l'autore conosce i risultati precedenti, ma non quelli v2.

Prima del ranking: stesso estrattore/chunker per entrambi, profilo model-card L1 congelato,
768 dimensioni. Primarie Recall@5 e MRR@5, differenze appaiate con tutti i ranking;
secondaria Hit@1, conteggi separati sulle negative senza inventare una soglia di astensione.
Cinque ripetizioni query, mediana/p95; avvio/indice separati, byte artefatto noti,
picco RAM/GPU sconosciuto. Nessuna soglia di +5pp; confronto descrittivo, senza selezionare
prompt/profilo sui risultati di questo campione. Il 100% eventuale non prova correttezza universale.

Diagnosi generativa: fonte DNS fissa di 110 caratteri, nessun documento personale.
Una prova per variante, nessuna riparazione nel confronto diagnostico; tetto di 1024 token,
4096 contesto e watchdog 30s invariati. Prima riproduzione v1, poi richiesta minima
(titolo, sintesi, una fonte), cambio del solo trasporto preface/user, esempio JSON valido,
contratto completo e flag constrained solo come prova API, senza promettere JSON Schema.
Ogni confronto indica la variabile cambiata; nessun accumulo di retry o timeout.
Conservare soltanto risposta finale sintetica, forma del messaggio, lunghezze dei canali,
token e tempi; mai ragionamenti interni. La pagina diagnostica è esclusa dalla build.

Formato e qualità rimangono distinti. Con generazione valida e sostenibile si confrontano
le 43 sezioni leggibili L1 senza/con recupero 270M, in engine separati e sequenziali.
Tutte le sezioni entrano nei denominatori. Revisione umana richiesta su copertura,
supporto delle sintesi/relazioni, negazioni, istruzioni ostili, duplicati, stabilità
fra lezioni; esempi con fonti affiancate. Nessuna scrittura nella mappa L2 o integrazione L4.


## L1: criterio corretto e campione separato

I report originali sono conservati. Sul campione originale Recall@5 passa da 31/32
(96,875%) a 32/32 (100%): +3,125 punti, massimo matematicamente possibile. MRR@5 passa
da 0,9375 a 0,96875. Richiedere +5 punti era un difetto del criterio, non una prova
contro il 270M. Il vantaggio osservato è positivo ma piccolo, su un campione quasi saturo.
Artefatto 164.626.432 byte, indice circa 2,1 s, query p95 46,9 ms contro 0,5 ms BM25;
picco RAM/GPU non misurato. Non equivale a correttezza universale.

Nuova [baseline](../experiments/study-local/reports/retrieval-challenge-v2-baseline.json)
e [inferenza reale Chromium](../experiments/study-local/reports/retrieval-challenge-v2-browser.json):

| Misura | BM25 | EmbeddingGemma 270M |
|---|---:|---:|
| Recall@5, 16 positive | 37,5% | 93,75% |
| MRR@5 | 0,3333 | 0,6604 |
| Hit@1 | 31,25% | 50% |
| Mediana query a caldo | 0,2 ms | 39,1 ms |
| p95 query a caldo | 0,3 ms | 43,6 ms |
| Risultati sulle 4 senza risposta | 0 ciascuna | 5 ciascuna |

Avvio embedding 907,5 ms, indice 1.912,6 ms; cinque ranking a caldo identici per tutte
le 20 query. Le 100 misure includono positive e negative. I distrattori falsi dimostrano
che similarità e supporto fattuale sono distinti: il primo risultato è corretto soltanto
in 8/16 query. Nessuna soglia di astensione è stata ottimizzata su questo campione.
Gold sintetici preparati prima dell'inferenza, revisione indipendente ancora da fare.
Non è un campione rappresentativo di documenti personali o di tutti gli argomenti.

## L3: runtime e diagnosi del formato

Versione realmente installata: `@litert-lm/core@0.18.0`, lockfile separato, backend
`GPU_ARTISAN` per stream dei pesi. Sono stati letti README, tipi e implementazione
JavaScript installati, confrontandoli con la [documentazione ufficiale JavaScript](https://developers.google.com/edge/litert-lm/js).
L'API documenta preface di sistema e invio del messaggio utente effettivo; la risposta
ha `content` separato dai `channels`. Thinking disabilitato via
`preface.extra_context.enable_thinking=false`; i canali non sono concatenati al JSON.
Il booleano `enableConstrainedDecoding` non espone un JSON Schema arbitrario nella
firma JS installata. L'[API C++ per constrained decoding](https://github.com/google-ai-edge/LiteRT-LM/blob/main/docs/api/cpp/constrained-decoding.md)
è distinta: non si presume disponibile in JS.

[Risposte finali sintetiche e tempi](../experiments/study-local/reports/l3-synthetic-variants-v2-initial.json).
Ogni riga è una prova reale, stesso file E2B già presente e verificato, seed 42, greedy,
nessuna riparazione; non una media o un confronto causale di prestazioni.

| Variante | Cambiamento | Formato | Send ms / decode token |
|---|---|---|---:|
| legacy | controllo: prompt nella preface, poi turno `JSON` | fence + radice `study-proposals-v1` annidata errata | 8.339 / 385 |
| minimal-legacy | solo contratto ridotto a titolo/sintesi/fonte | valido minimo | 713 / 29 |
| minimal-direct | solo trasporto: richiesta nel vero messaggio utente | valido minimo | 828 / 29 |
| minimal-example | aggiunta esempio valido | valido minimo | 653 / 25 |
| full-example | contratto completo, esempio sulla stessa fonte | valido completo | 4.436 / 201 |
| full-constrained | solo booleano constrained | valido, risposta identica al controllo | 4.315 / 201 |
| production-example | esempio estraneo, identificatore breve `s1` | valido completo | 4.944 / 202 |

La risposta legacy non era troncata: 385/1.024 token, fence chiusa, JSON interno
parsabile ma senza la chiave `version` richiesta. Togliere le fence non avrebbe risolto
il contratto; nessuna tolleranza è stata aggiunta al validatore. I canali erano assenti:
nessuna prova che thinking o estrazione dei canali causassero questo errore. Il modello
ha anche prodotto obiettivi (“Esplorare…”) al posto di sintesi fattuali. L'esempio sulla
stessa fonte è solo diagnostico, non una prova di qualità/generalizzazione.

Avvii di queste prove: runtime 82–124 ms, modello 1.800–2.239 ms; prefill preface
340–1.625 ms. `sendMs` comprende prefill utente e decode, quindi non va chiamato
“solo generazione”. I benchmark SDK riportano separatamente token/rate prefill e decode;
le durate ricavate dai rate sono stime, non misure indipendenti. La verifica SHA dei
2 GB è separata dall'avvio e rimane un costo pratico. Picco RAM/GPU sconosciuto.

Prima correzione v2: richiesta utente reale, esempio estraneo e schema esplicito;
**non sufficiente** sui riferimenti canonici del corpus. Il
[tentativo conservato](../experiments/study-local/reports/l3-corpus-v2-before-alias.json)
conclude 10/43 sezioni, 2 valide; timeout sulla sezione 11. Le altre 33 sezioni non sono
valutate, il confronto con recupero non è raggiunto. I metadati distinguono forma,
cap token, possibile troncamento, validazione e costo della riparazione. Il watchdog
rimane 30 s e una sola riparazione. Questo esito riguarda la combinazione concreta
prompt/identificatori/runtime/dispositivo e non dimostra incapacità universale di E2B.


### Identificatori lunghi: errore riprodotto, conversione circoscritta

La variante `production-canonical` cambia solo l'identificatore della stessa fonte DNS:
`s1` diventa il vero identificatore hash/parser/pagina/intervallo della fonte di 110 caratteri. E2B produce 374 token
in 9.192,5 ms (`sendMs`), senza cap o canali thinking, ma la relazione termina con
`"sources":["…p1:0-110"}]} `: manca la chiusura dell'array. È JSON malformato completo,
non semplice fence o limite di output. Questo isola un carico di copia/strutturazione
sensibile alla rappresentazione; non prova che tutti gli errori del corpus abbiano quella causa.

La variante `production-alias` usa lo stesso prompt v2 con alias locali `s1…` e `c1…`.
Non aggiunge né cerca fonti: una tabella per richiesta rimappa esclusivamente i riferimenti
ammessi, mantenendo sintesi, testo, azioni ed endpoint. Il JSON intermedio deve superare
lo stesso schema chiuso; dopo la conversione, `parseProposal` verifica nuovamente ID
canonici, candidato esatto e fonti di entrambe le lezioni. Alias sconosciuti o sorgente
corrente assente falliscono, senza correzioni euristiche. Contratto finale
`study-proposals-v1` invariato; prompt `study-proposals-prompt-v3-alias`.

La prova alias sulla fonte DNS è valida: 202 token, 4.518,7 ms send, tre concetti e due
relazioni, riferimenti finali canonici. Una ripetizione senza cambiamenti è conservata
nel [report completo delle varianti](../experiments/study-local/reports/l3-synthetic-variants-v2.json).
La validità strutturale non giudica l'aggiunta dell'espansione “Time To Live”, assente
nella fonte: anche una risposta valida può introdurre conoscenza esterna.

Corretto anche un difetto del laboratorio di sviluppo: il bundle del worker classic
veniva costruito solo all'avvio Vite. Ora ciascun nuovo worker di sviluppo usa il codice
corrente, senza cache HTTP. I worker già in corso mantengono la propria versione.
Questa correzione evita confronti con codice obsoleto; non attribuisce retroattivamente
a quel difetto i risultati storici. Le pagine diagnostiche sintetiche e il sink locale
POST a nomi fissi esistono solo in sviluppo, esclusi da preview/build; nessuna mappa
personale è letta o esportata da queste pagine.


## Alternative locali: compromessi prima di altri download

Nessun modello nuovo è stato scaricato. Due opzioni concrete, da confrontare con gli
stessi campioni e revisione umana, senza dichiararne in anticipo la qualità:

- **E4B nello stesso LiteRT-LM**: la [documentazione Google](https://developers.google.com/edge/litert-lm/js)
  lo elenca fra i modelli Web supportati; [artefatto GPU](https://huggingface.co/litert-community/gemma-4-E4B-it-litert-lm/tree/main)
  circa 2,97 GB. Minore lavoro di adattamento, più spazio/caricamento e memoria da misurare;
  non risolve per definizione l'assenza di JSON Schema nell'API JS né garantisce semantica migliore.
- **WebLLM con un modello piccolo compilato MLC**: il [progetto ufficiale](https://github.com/mlc-ai/web-llm)
  documenta generazione strutturata con schema, inferenza WebGPU nel browser e worker;
  [esempio JSON](https://github.com/mlc-ai/web-llm/tree/main/examples/json-mode) e
  [worker](https://webllm.mlc.ai/docs/user/advanced_usage.html#using-workers).
  È l'alternativa più direttamente rivolta al difetto di formato osservato, ma richiede
  nuovo runtime, pesi in formato diverso, lock/versioni/hash, guardia rete, licenza e memoria
  da qualificare. I file `.litertlm` presenti non si riusano direttamente. Lo schema
  vincola la forma, non il supporto delle affermazioni, delle relazioni o dei merge.

Un candidato concreto del [catalogo ufficiale MLC](https://github.com/mlc-ai/web-llm/blob/main/src/config.ts)
consultato l’8 ottobre è `Qwen3-1.7B-q4f16_1-MLC`: il catalogo dichiara
2.036,66 MB VRAM e contesto 4.096 (stima del catalogo, non picco misurato su questo
dispositivo). `Qwen3-4B-q4f16_1-MLC` dichiara 3.431,59 MB. Per iniziare sceglierei
il più piccolo con schema vincolato e template/thinking verificati; compatibilità
e qualità it/de/fr/en restano da provare.

La selezione definitiva MLC richiede fissare revisione/hash/licenza e
budget del dispositivo prima del download. Un servizio nativo locale avrebbe ulteriori
requisiti di installazione e un confine diverso dal solo browser; non è stato introdotto.


## Qualità: osservazioni preliminari dell'agente, non revisione umana

Le metriche semantiche restano `null`. Già nelle proposte senza recupero validate
strutturalmente emergono casi da sottoporre alla persona:

| Fonte | Proposta osservata | Punto da verificare |
|---|---|---|
| TCP ritrasmette e mantiene ordine; UDP non garantisce consegna/ordine | tre nodi: TCP, UDP, confronto TCP/UDP | Negazione conservata, ma forte sovrapposizione delle sintesi; relazione gerarchica fra TCP e confronto non dichiarata dalla fonte |
| Glicolisi prima delle fasi mitocondriali; conoscere glucosio necessario per descriverla | “Il glucosio è un prerequisito per poter descrivere le fasi mitocondriali” | Spostamento del referente rispetto a “descriverla”; sequenza temporale trasformata in relazione prerequisite |
| Retta/tabella e dominio di 1/x nello stesso estratto PDF | tabella → dominio marcato prerequisite | Co-presenza nell'estratto non prova prerequisito educativo |
| Indice può accelerare letture selettive, costa sulle scritture, non garantisce scan più veloce | quattro nodi, uno ricapitola gli altri | Negazione conservata; “improves” meno prudente di “can”; duplicazione e prerequisite da verificare |

Sono esempi reali con riferimenti nel report, non una valutazione completa o percentuali
prodotte dal modello. Il numero di nodi non misura copertura; il numero di citazioni
non misura supporto. Anche una fonte esatta può essere usata per una relazione che
il testo non giustifica. Nessuna proposta viene accettata nella mappa per questo task.


## Confine dell'aggiornamento progressivo

Il confronto del corpus recupera al massimo due passaggi delle lezioni precedenti;
documento corrente e futuro sono esclusi **prima** del ranking. Sono candidati con
fonti esatte, un surrogato controllato dei concetti manuali, non una mappa generata
approvata. Nel percorso custom L3 i candidati derivano dai concetti L2 con fonti, ma
questa prova sintetica non accetta né applica diff. Il diff conserva il target stabile;
non inventa un'unione dalla similarità. Formato valido e target esistente non provano
che `merge`, `deepen` o `possible-contradiction` siano semanticamente giustificati.

Finché il generatore non supera formato e revisione semantica, non è dimostrato un
aggiornamento progressivo utile della mappa. Restano da qualificare correttezza delle
fusioni, stabilità delle definizioni fra lezioni, accettazione/idempotenza e provenienza
AI persistente. Quest'ultimo flusso non è stato implementato né abilitato nel task.
L2, note e stato personale non entrano nei prompt o nelle pagine di valutazione.

Il nuovo campione L1 usa il profilo model-card congelato, che include il titolo nel
prefisso documento; BM25 usa il testo del chunk. I titoli sintetici contengono tema e
codice T/F/D. Questa differenza di metadati limita l'attribuzione del vantaggio alla
sola rappresentazione del testo: il confronto misura le configurazioni effettive,
non due motori con input necessariamente identici. Non ottimizzare il profilo su
questi esiti; serve un ulteriore campione indipendente con titoli neutrali e annotazioni
umane prima di generalizzare.


## Confronto completo disponibile: esiti e parti non osservabili

[Report integrale](../experiments/study-local/reports/l3-corpus-v2.json),
[conteggi ricavati](../experiments/study-local/reports/l3-analysis-v3.json),
[scheda con fonti affiancate](../experiments/study-local/reports/l3-human-review.html).
Il nome del file v2 identifica il protocollo di confronto; il prompt registrato è v3-alias.
15 documenti leggibili, 43 sezioni; PDF D15 senza testo escluso, pagina 2 di D16 esclusa.

| Esito sulle 43 sezioni previste | Senza recupero | Con 270M |
|---|---:|---:|
| Proposte valide e non vuote | 10 | 2 |
| Sezioni concluse senza proposta valida | 29 | 33 |
| Watchdog 30 s | 4 | 7 |
| Interruzione sessione browser, output non disponibile | 0 | 1 |
| Valide al primo tentativo / recuperate dalla riparazione | 9 / 1 | 2 / 0 |
| Output invalidi osservati, prima della selezione utente | 59 | 66 |
| Concetti / relazioni proposti | 30 / 22 | 4 / 2 |
| Mediana / p95 sezioni concluse | 7.592,8 / 18.346,1 ms | 20.099,9 / 27.967,4 ms |

Le statistiche di latenza **escludono** i worker terminati e la sezione non osservabile;
non dimostrano il rispetto del budget per tutte le sezioni. I contatori dei worker
terminati non sono recuperabili: 59/66 sono conteggi osservati, non totali completi.
Tutte le 43 sezioni sono contabilizzate per modalità; nel ramo con recupero soltanto
42 hanno un esito inferenziale osservabile, la restante resta esplicitamente indisponibile.
Non viene marcata come errore di contenuto del modello né come sezione corretta.

La sessione browser è stata trovata ricaricata, con pagina vuota e job assente, mentre
il file locale conservava 17 sezioni concluse con recupero. Causa del ricaricamento non
identificata. Una lettura UI ha anche incontrato un timeout del controllo automatico
dello strumento, risolto dal solo ritentativo consentito: nessun aggiramento, nessun
verdetto di sicurezza o del modello. Lo [snapshot dell'interruzione](../experiments/study-local/reports/l3-corpus-v3-browser-interruption.json)
e il [primo passaggio v3](../experiments/study-local/reports/l3-corpus-v3-first-pass.json)
sono conservati. La continuazione salta la sezione scaduta/interrotta, non la ritenta,
e prosegue le successive con un nuovo worker e gli stessi budget. Nessun aumento
di timeout, token o numero di riparazioni. Una sessione interrotta non qualifica il modello.

Sulle 42 sezioni confrontabili: 2 valide in entrambe le modalità, 8 soltanto senza
recupero, nessuna soltanto con recupero, 32 senza proposta valida entro i limiti.
Le due valide del ramo embedding appartengono alla prima lezione, che non ha candidati
precedenti. Nessuna proposta valida è osservata nelle 40 sezioni previste con candidati
recuperati (39 con esito inferenziale, 1 interruzione ambientale).
È un confronto descrittivo di questa esecuzione, non una stima universale o una prova
che il recupero sia sempre dannoso. Gli avvii/ripristini del motore e la contesa del
dispositivo non sono stati controllati come in un benchmark di prestazioni isolato.

Gli alias sulle prime 10 sezioni condivise con il tentativo v2 passano da 2 a 4 valide;
mediana osservata 9.774,8 → 6.714,4 ms. È un miglioramento limitato in una sola esecuzione,
non una soluzione completa. Il validatore finale resta chiuso e conserva tutti i rifiuti.

### Categorie osservate e tempi

Senza recupero: 50 errori JSON, 5 riferimenti fonte, 2 chiavi schema, 1 target, 1 markup.
Con recupero: 40 JSON, **19 mancanze della fonte corrente**, 3 chiavi schema,
3 riferimenti fonte, 1 target. Sono categorie di tentativi, non sezioni distinte.
Le 19 mancanze indicano che candidati precedenti possono sostituirsi alla nuova fonte
nell'output: un riferimento esistente non basta ad autorizzare l'aggiornamento progressivo.
Nessuna risposta completata raggiunge il cap di 1.024 token; per i timeout non si conosce
il decode finale. Non attribuire anche questi ultimi a JSON_SYNTAX o troncamento.

Costo misurato delle riparazioni (prefill di ammissione/sistema + send + validazione):
114.791,2 ms senza recupero, 315.155,4 ms con recupero, esclusi i worker interrotti.
Dai rate/token SDK, stime aggregate prefill utente 22.006,2 / 52.145,1 ms e decode
257.117,9 / 522.961,7 ms. Queste stime non includono ogni preflight, avvio, cleanup,
riverifica pesi o pause della sessione e non sono il tempo end-to-end del lavoro.
I campi originali permettono di separare ammissione/prefill, send, validazione e tentativo
di riparazione senza registrare testo personale. `loadMs` del confronto accumula solo
worker conclusi: startup dei worker abortiti e del passaggio iniziale interrotto non
sono disponibili; non presentarli come consumo totale. Picco RAM/GPU ancora sconosciuto.

### Formato, qualità e revisione umana

Tutte le azioni accettate strutturalmente sono `new`; nessun merge/deepen/contradiction
valido osservato. Non è dimostrata stabilità di una mappa fra lezioni. Il ramo 270M
fornisce sempre fino a due vicini disponibili, anche se irrilevanti; non ha una soglia
di astensione calibrata. Il confronto non prova che il contesto recuperato sia utile
per generazione o che i candidati rappresentino lo stesso concetto.

Le negazioni sono conservate in alcuni esempi validi (UDP, dominio di 1/x, scansione
completa dell'indice), ma le sezioni ostili D14 non producono proposte valide. Questo
non certifica resistenza generale alle istruzioni ostili. Nei registri fetch disponibili
non compare la destinazione ostile; il runtime non dispone di tool e la guardia rete
è separata dal comportamento linguistico. I registri non coprono tutta la rete browser
né tutti i worker abortiti. Nessun fallback cloud è implementato.

La scheda HTML comprende **86 sezioni/modalità**, con tutte le sintesi e relazioni
validate accanto alle fonti, pagine e intervalli; per rifiuti/interruzioni mostra fonte
e categoria. Checklist per copertura, supporto, negazioni, ostilità, duplicati e stabilità
fra lezioni. La revisione umana è **da eseguire**; tutti i punteggi semantici sono null,
`passed=false`. Le osservazioni dell'agente sopra non sostituiscono quella revisione.

## Decisione fondata sulle prove

Continuare con ricerca BM25 + 270M opzionale e mappa manuale L2. Il guadagno L1 non va
respinto con il criterio impossibile dei cinque punti; il campione difficile ne mostra
un vantaggio, con costo e limiti di astensione espliciti. Ulteriori gold neutrali e
revisione umana servono prima di una qualificazione generale.

Non investire altri timeout/retry indiscriminati in questa combinazione E2B/LiteRT-LM
JS. La fonte minima funziona e le correzioni sono utili, ma formato, riferimenti alla
nuova lezione, relazioni e duplicazione restano insufficienti. Se si prosegue la
ricerca generativa, preferirei un confronto separato con schema realmente vincolato
(WebLLM + candidato piccolo), prima di scaricare un E4B più pesante nello stesso
adattatore. È una raccomandazione inferita dai difetti osservati, non un risultato
sperimentale su quei candidati. Nessun nuovo modello scaricato in questo task.

Non abilitare scrittura AI nella mappa. Revisione umana, picco memoria, ulteriori avvii,
stabilità fra lezioni, dispositivi fisici/mobile, perdita GPU e offline restano incerti.
Nessuna integrazione L4, pubblicazione, cloud o modifica alle note/stato L2.


## Verifiche finali e conservazione

- **Automatiche**: `npm run study:check` passa tipi e 52 test; `study:build` riuscita;
  `docs:check` passa inventario e 524 collegamenti locali; `git diff --check` pulito.
  `npm run check` principale era passato durante il task (lint/tipi, 114 test, 758 chiavi i18n).
- **Report dell'inferenza**: verifica indipendente tramite
  `scripts/verify-generation-report.ts`: 12 proposte canoniche rilette dal validatore,
  43 ID distinti contabilizzati per modalità, tutti i ranking limitati a lezioni precedenti,
  campi semantici/revisione ancora pendenti. Non è un test della verità del contenuto.
- **UI L2 reale, sola lettura**: profilo A riaperto, due concetti salvati presenti;
  nota presente e stato `review` leggibili senza copiarne il contenuto. Nessun comando
  Salva, ripristino, purge o modifica personale usato. Pagine sintetiche prive di accesso
  allo store L2; test di isolamento, transazioni, undo e stato personale passati.
- **Conservazione**: hash dei sei report storici L1/L3 ricontrollati e invariati;
  snapshot dei tentativi nuovi conservati prima delle continuazioni. Nessun reset Git,
  commit o sovrascrittura delle modifiche preesistenti estranee al laboratorio.
- **Build**: pagine challenge/diagnosi/evaluation, worker diagnostico e sink di scrittura
  non sono artefatti della build laboratorio. Nessuna integrazione nel client/precache
  principale e nessuna pubblicazione eseguita.

Per riprodurre usare le istruzioni del [laboratorio](../experiments/study-local/README.md).
I report sintetici sono copiabili; conservarli prima di ripetere una prova che usa lo
stesso nome file. La scheda di revisione va compilata da una persona e le annotazioni
vanno salvate separatamente: non dichiara la revisione già completata.
