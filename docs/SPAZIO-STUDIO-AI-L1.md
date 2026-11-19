# Spazio Studio — laboratorio locale L1

[Indice](README.md) · [Preparazione L0](SPAZIO-STUDIO-AI-L0.md) · [Fattibilità](SPAZIO-STUDIO-AI-LOCALE.md) · [Prompt](SPAZIO-STUDIO-AI-PROMPTS.md)

**7 ottobre 2026. Prototipo isolato implementato e provato; nessuna pubblicazione.**
Il laboratorio rende verificabili importazione, fonti e ricerca, senza modificare le viste
quotidiane. L'embedding funziona nel browser di prova ma resta sperimentale: il beneficio
sul piccolo corpus è positivo; il criterio di +5 punti di L0 era irraggiungibile e viene rettificato sotto.

## Perimetro consegnato

Sorgente e istruzioni in `experiments/study-local/README.md`.
`npm run study:dev` apre un Vite separato su `127.0.0.1:5174`; nessun import dall'app,
account, outbox, endpoint, binding Sites o service worker. Dipendenze/lockfile e build
separati; la shell principale non carica parser, runtime o pesi. Le esclusioni di lint/tipi
comprendono anche le directory di output già ignorate da Git, che contenevano copie di
build analizzate erroneamente come sorgenti.

Testo incollato, TXT UTF-8 e PDF digitali producono pagine immutabili e chunk verificabili.
ID composto da SHA-256 dell'originale, estrattore e chunker; pagina a base 1, intervalli
`[start,end)` in unità UTF-16 **del testo estratto della pagina**. Questo precisa il riferimento
proposto in L0: gli offset non sono coordinate grafiche PDF né indici in byte. Il visualizzatore
evidenzia il passaggio esatto con `textContent`, anche per markup ostile; l'originale si può
riscaricare dalla copia in memoria per confrontare ordine, simboli e impaginazione.

PDF senza testo: errore esplicito e incolla; PDF misti: pagine escluse dichiarate.
Nessun OCR, JavaScript/annotazione PDF eseguita, allegato aperto o URL tratto dai materiali
richiesto. Il parser PDF.js 6.4.299 non espone più l'opzione `isEvalSupported`: non è stata
aggiunta un'opzione inesistente; il parsing usa testo soltanto, XFA/WASM/font di sistema
disabilitati e CSP senza `unsafe-eval` generale.

Limiti implementati: 10 MiB/50 pagine/100.000 code point per fonte, 24 fonti/200.000 code
point/50 MiB di originali nella scheda. Chunk fino a 600 unità UTF-16 con preservazione
delle coppie surrogate. Per embedding limite effettivo 512 token con prefisso, verificato
dal motore, errore su overflow/troncamento. Non si dichiara che 600 caratteri equivalgano
a 512 token per ogni lingua. Materiale non supportato conserva la via testuale.

Originali/estratti/vettori sono temporanei. La sola cache persistente contiene pesi verificati,
non fonti, query o dati dell'account. Quota negata mantiene il modello in memoria; nessuna
copia parziale è pronta. Questa non è la persistenza dello studio L2 né un backup del lavoro.

## Artefatti e runtime effettivi

| Componente | Artefatto fissato / verifica |
|---|---|
| Runtime JS | `@litert-lm/core@0.18.0`, Apache-2.0; `@litertjs/wasm-utils@2.5.3` risolto dal lockfile |
| Parser | `pdfjs-dist@6.4.299`, Apache-2.0; worker locale, niente CDN |
| Hash a flusso | `@noble/hashes@2.4.0`, MIT; evita un ulteriore buffer integrale per `subtle.digest` dei pesi |
| Modello | EmbeddingGemma 2 **Text 270M**, revisione `9be6e8b90982095dc05c2bd162e4b954ee4dbac7`; nessun encoder visivo/audio richiesto |
| Pesi | GET anonimo completato, **164.626.432 byte**, SHA-256 `2d079ee2f6f066b1f368e8d7c819f55214eaef1d0513b312321901f30ab286fb` verificato nel browser |
| CORS | HEAD pubblico 200, `Access-Control-Allow-Origin: *`, redirect osservato verso `us.aws.cdn.hf.co`; GET browser e verifica hash riusciti |
| WASM | Varianti locali da 21,73 a 34,42 MB, scelta del loader secondo JSPI/SIMD; nomi, byte e hash in manifest di build e report dipendenze |
| Budget | Anche tutte le varianti WASM/JS del pacchetto, più pesi, restano sotto 300 MB di artefatti. Non è una misura della memoria del browser/GPU |
| Backend | `Backend.GPU` esplicito, worker classico: il loader usa `importScripts`, incompatibile con un module worker. Parser separato in module worker |
| Input/output | Stringa passata dal wrapper senza prefisso aggiunto nel JS; output 768 dimensioni, normalizzazione richiesta e ricontrollata, vettori finiti/non nulli, overflow in errore |

Integrità npm, licenze dichiarate e hash WASM sono nel `experiments/study-local/reports/dependencies.json`.
`npm audit` sul lockfile del laboratorio: zero vulnerabilità segnalate. Questo non dimostra
assenza di difetti né sostituisce la revisione dei termini prima della distribuzione.
La precisione delle attivazioni, il pooling interno e la revisione esatta del tokenizer nei
metadati nativi non sono stati certificati indipendentemente: il tokenizer resta quello
incorporato nell'artefatto fissato da hash. Nessuna opzione float16 è stata impostata.

## Corpus, protocollo e risultati

16 documenti sintetici generati con `pdf-lib`: 15 leggibili, 43 chunk; D15 senza testo
rifiutato, pagina 2 di D16 esclusa. D13 ha cinque pagine a colonne. Le formule e i dati
tabellari sono elementari e in forma testuale: servono prove ulteriori su matematica,
tabelle reali, font e ordine grafico. Le annotazioni hanno ancore esatte verificate sul testo
estratto, ma non una revisione linguistica/didattica umana indipendente.

64 query positive (40 it, 8 de/fr/en) e 16 negative, metà sviluppo e metà valutazione per
lingua. Parafrasi dello stesso passaggio nello stesso split; corpus comune. BM25 Unicode
NFKD, stop list esplicita, `k1=1.2`, `b=0.75`. Stessi chunk e filtri per entrambi i metodi.
Hash corpus: `4e0b7fade9b5518b516942f2f214f6cac547bcb9b38986bc42db2894e39d5bb8`.
Ranking completi della baseline nel `experiments/study-local/reports/baseline.json`.

Confrontati sul solo sviluppo i profili model card e guida LiteRT: scelta per Recall@5,
poi MRR@5; il profilo scelto è congelato prima della valutazione. Entrambi i profili ottengono Recall 1 e MRR 0,96875 sullo sviluppo; lo spareggio
deterministico sceglie la model card. Questa scelta empirica non risolve universalmente la discrepanza delle fonti e non prova l'assenza di
trasformazioni nel WASM. Non è un'autorizzazione a portare il prefisso in altri runtime.

| Valutazione, 32 query con risposta | BM25 | Embedding |
|---|---:|---:|
| Recall@5 globale | 0,96875 | 1,00000 |
| MRR@5 globale | 0,93750 | 0,96875 |
| Recall@5 italiano (20) | 1,00 | 1,00 |
| Recall@5 tedesco (4) | 0,75 | 1,00 |
| Recall@5 francese (4) | 1,00 | 1,00 |
| Recall@5 inglese (4) | 1,00 | 1,00 |

**Rettifica dell’8 ottobre: vantaggio osservato positivo, generalizzazione aperta.**
Recall@5 passa da 31/32 a 32/32: +3,125 punti percentuali, eliminando l’unico mancato
recupero nei primi cinque risultati. MRR@5 passa da 0,93750 a 0,96875 (+0,03125),
indicando anche un miglioramento medio della posizione. Il requisito L0 di +5 punti
aveva un massimo disponibile di 3,125: usarlo per dichiarare il risultato insufficiente
era un difetto del criterio, non una prova contro il modello. Risultati e report originali
rimangono invariati; non si ricalcolano i punteggi né si finge che il protocollo fosse corretto.

Il vantaggio va pesato contro 164,6 MB di pesi, circa 2,1 s per indicizzare 43 chunk e
p95 query 46,9 ms contro 0,5 ms di BM25. Entrambi sono veloci nel browser osservato;
il picco RAM/GPU non è misurato. Il 100% su 32 query non equivale a correttezza universale.
Un [campione challenge separato](SPAZIO-STUDIO-AI-RIPRESA.md) congela metriche prima delle
nuove misure, con parafrasi e distrattori più difficili. Non si ottimizza su questa valutazione.
Sulle negative l'embedding restituisce comunque
cinque vicini: nessuna soglia di astensione calibrata e nessuna similarità presentata come verità.

La prova reale usa il browser integrato Chromium 154, contesto localhost sicuro, API GPU
presente, 8 thread dichiarati, `crossOriginIsolated=false`. La user agent dichiara macOS;
modello fisico, versione OS effettiva e alimentazione non sono stati inventariati. Tempi
locali osservati nella `experiments/study-local/reports/browser-chromium-summary.json`:
BM25 p95 0,5 ms (400 query), embedding p95 46,9 ms (200 query a caldo); tre avvii con pesi
presenti 679,4/667,3/843,2 ms e indice dei 43 chunk 2.082,5/2.085,6/2.038,7 ms. WASM effettivo
`litertlm_wasm_internal`, massimo 188 token osservati, norme restituite fra 0,99999927 e
1,00000023. Non è una verifica indipendente della precisione. Nessuna estrapolazione a telefoni o Safari.

Il report JSON completo è consultabile nella UI; è presente un download e un comando per
mostrare il JSON se il browser lo blocca. Nel browser integrato l'acquisizione automatica del
file finale non è stata verificata: la sintesi versionata è trascritta dal DOM. Mancano anche
tempi separati del primo download e della verifica hash; il loro completamento e i byte sono
stati osservati, senza inventare una durata.

## Riservatezza, recupero e verifiche

Download solo da comando esplicito con dimensioni/origine; credenziali omesse. Hash a flusso,
byte esatti prima del commit, nuova verifica alla lettura. Nessun fallback remoto. CSP
limitata al laboratorio: script/WASM locali, `wasm-unsafe-eval`, nessun `unsafe-eval` generale,
nessun header globale COOP/COEP. La CSP autorizza solo Hugging Face e il CDN osservato per
i pesi; cambi di host falliscono e richiedono una nuova verifica.

Guardia fetch: solo GET/HEAD senza body, query o URL arbitrarie, asset locali e URL dei pesi
fissata. Il registro nel report copre questi fetch e le risorse WASM osservate dal worker;
**non è una cattura esaustiva del traffico browser**, dei caricamenti nativi o dei redirect.
La sentinella ostile viene resa come testo; nessun errore/warning di console nella prova
osservata. I worker sopprimono i log del runtime/parser per evitare messaggi con input.
Un worker e una guardia JS non sono una sandbox contro codice malevolo della stessa origine.

Una verifica leggera di adattatore WebGPU nel worker precede il download; non equivale a qualifica del motore.
Una sola elaborazione per scheda, ticket/generazione invalidati su annullamento/rimozione,
`terminate()` immediato e deadline; download annullabile con timeout. Provati cancel/ripartenza
nel browser e risposte tardive/deadline nei test. Il rilascio immediato della memoria GPU
non è stato misurato e non viene dedotto dal solo `terminate()`.

15 test mirati del laboratorio: riferimenti UTF-16, magic/UTF-8/limiti, PDF digitali/misti/senza
testo/malformati/51 pagine/abortiti, ancore, ranking Unicode, vettori invalidi, split senza
parafrasi incrociate, cancel/deadline/risultati tardivi, hash/dimensione/download interrotto,
commit cache abortito/storage negato e restrizioni fetch. Controlli app principale, build e
isolamento nella [matrice](VERIFICATION-MATRIX.md#spazio-studio-l1--7-ottobre-2026).

## Residui e passaggio a L2

Aggiornamento successivo: la mappa manuale e il recupero dedicato sono descritti nel
[rapporto L2](SPAZIO-STUDIO-AI-L2.md). Il resto di questo rapporto registra le prove L1.

La prova L1 rende disponibile la base testuale e un confronto AI ripetibile; non chiude tutti
i requisiti di distribuzione di L0. Restano: revisione umana delle fonti/annotazioni, corpus
più discriminante, precisione/pooling/metadati, rete catturata integralmente, memoria/GPU,
PDF difficili, quota esaurita reale, riapertura offline completa, perdita GPU, background,
dispositivi fisici/browser multipli e accessibilità/localizzazione completa.

L2 può partire indipendentemente dall'embedding: contratto della mappa manuale, archivio
per account, CAS tra schede, originali/fonti/versioni, export/import dedicato e cancellazione
delle copie derivate. Nessun uso con lavoro reale prima di recupero e isolamento verificati.
L3 generazione e L4 integrazione nell'app rimangono non avviati.
