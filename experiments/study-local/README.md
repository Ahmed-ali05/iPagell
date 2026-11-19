# Laboratorio locale dello Spazio Studio (L1 + L2 + L3)

Prova separata dall'app iPagell. Non è una route applicativa né una funzione pubblicata.
Decisioni e risultati: [rapporto L1](../../docs/SPAZIO-STUDIO-AI-L1.md) e [rapporto L2](../../docs/SPAZIO-STUDIO-AI-L2.md).

Con Node >= 22.13 e le dipendenze principali già installate:

```sh
npm ci --prefix experiments/study-local --ignore-scripts
npm run study:check
npm run study:dev
```

Aprire `http://127.0.0.1:5174`. Il parser PDF e il runtime hanno un lockfile separato;
non usare il laboratorio sulla stessa origine dell'app. Nessun account o accesso agli Appunti.
La UI è italiana; le fixture coprono it/de/fr/en, senza attestare una localizzazione dell'interfaccia.

Testo incollato/TXT UTF-8 e PDF digitali producono testo immutabile per pagina e chunk con
intervalli UTF-16 `[start,end)`. La ricerca BM25 funziona senza modello. L’area di import conserva originali ed estratti in memoria. Per salvarli, aprire un profilo
L2 e usare “Copia le fonti temporanee nella mappa”. Solo l’area temporanea viene persa
ricaricando. Non importare lavoro insostituibile come unica copia.

Limiti: 10 MiB/50 pagine/100.000 code point per fonte; 24 fonti, 200.000 code point e 50 MiB
di originali nella scheda. Chunk massimo 600 unità UTF-16; per embedding è il tokenizer del
motore a verificare il limite di 512 token, incluso il prefisso. Un input non supportato fa
fallire esplicitamente la prova, senza troncamenti o perdita del testo sorgente.

## Riproduzione

```sh
npm --prefix experiments/study-local run fixtures
npm run study:evaluate
npm run study:build
```

Le fixture sono sintetiche, distribuite secondo la licenza MIT della repository e generate
con `pdf-lib` già presente nel progetto. D15 è un PDF con sola immagine, non una prova della
qualità OCR; D16 ha una pagina digitale e una senza testo. D13 contiene cinque pagine a
colonne. Formule e dati tabellari sono elementari e testuali: matematica complessa, font e
tabelle reali richiedono altri documenti e revisione umana. Non cambiare corpus/annotazioni
in base ai risultati di valutazione; nuove prove richiedono una versione distinta.

Il report CLI `reports/baseline.json` contiene tutti i ranking. Nel browser, “Carica e valuta”
sostituisce le fonti temporanee con il corpus. Il comando embedding usa esclusivamente quel
corpus e autorizza un download fissato da 164.626.432 byte. Non invia i testi a Hugging Face.
L'hash SHA-256 viene verificato a flusso; un Blob completo può poi essere salvato nell'IndexedDB
`ipagell-study-lab-model-v1`. Questa cache contiene solo pesi ricostruibili ed è separata dall’archivio L2. La rimozione del modello non elimina le fonti in memoria. Il modello è verificato
nuovamente quando riletto. Per rimuoverlo usare il comando dedicato; nessun token HF richiesto.

I profili vengono confrontati sulle 40 query di sviluppo (32 positive, 8 negative); scelta per
Recall@5, poi MRR@5, con spareggio deterministico. Il profilo è congelato prima delle 40 query
di valutazione: una ripetizione iniziale e cinque a caldo, più tre avvii con lo stesso profilo.
Scaricare il report JSON (oppure aprire “Mostra JSON completo” se il browser blocca il download)
per conservare risultati, tempi, riferimenti, configurazione e rete
osservata. I report versionati descrivono prove storiche; i tempi cambiano col dispositivo.

## Confini e limiti

- Parsing in module worker; embedding in classic worker perché il loader fissato usa `importScripts`.
- Un solo job; deadline e annullamento terminano il worker e invalidano risposte tardive.
- Modello, parser e WASM non entrano nella build/precache principale. `dist/` del laboratorio
  è separato e ignorato; niente service worker, manifest PWA o CDN JavaScript automatico.
- CSP solo sul laboratorio, senza COOP/COEP globali o `unsafe-eval` generale. Fetch anonimo,
  solo GET/HEAD agli asset locali e all'URL preciso dei pesi; niente body/query da documenti.
- Il registro fetch non cattura ogni caricamento nativo di script o tutto il traffico del browser.
  Un worker e una guardia JavaScript non costituiscono una sandbox contro dipendenze malevole.
- Generazione sperimentale L3 separata dalle mappe e dai backup manuali L2. Nessun tool calling, sync, OCR o fallback cloud.
- Supporto numerico, memoria/GPU, offline, browser/dispositivi fisici e interfaccia nelle quattro
  lingue restano da qualificare prima dell'uso reale. Il benchmark non certifica verità delle fonti.

## Mappa manuale L2

Aprire Profilo A oppure B (sintetici, non account iPagell). Un archivio/materia per profilo;
creazione/rinomina concetti, sintesi, note, stato personale, gerarchie e legami trasversali.
Collegare uno dei passaggi copiati dalle fonti e aprirlo per verificarlo. I comandi Salva
persistono in IndexedDB `ipagell-study-lab-archive-v1`, separato dall’app e dal modello.

Ultime 20 modifiche del grafo annullabili; revisioni confrontate atomicamente fra schede.
In conflitto conservare la bozza con export prima di riaprire. “Esci e conserva nel browser”
svuota la memoria e mantiene il salvato. I profili non proteggono da altri utilizzatori
del browser. Nessun account dell’app viene letto.

“Prepara export” crea un backup `study-backup-v1` con originali, estratti, mappa e cronologia.
Scaricare dal link o copiare il JSON; ripristinare da file oppure incolla con conferma,
scelta nome materia e rimappatura degli ID. Backup massimo 96 MiB; nessun peso AI incluso.
“Elimina fonte” rimuove la copia salvata e tutta la cronologia, conservando fonti alternative,
concetti, sintesi e note manuali correnti. “Elimina archivio” rimuove tutti i contenuti del
profilo. Le copie già esportate non sono cancellabili dal laboratorio.

Schema, limiti, test e residui nel rapporto L2. Il download del browser integrato non è
stato acquisito dallo strumento: verificato il recupero alternativo tramite JSON.

## Banco generativo L3

[Rapporto e residui](../../docs/SPAZIO-STUDIO-AI-L3.md). Verificare dispositivo/spazio, poi
comando esplicito per 2.008.432.640 byte E2B da Hugging Face (revisione/hash fissati).
OPFS con riserva 4.083.974.144 byte e verifica incrementale, senza buffer JS integrale.
Nessun download all’apertura; rimozione pesi separata dall’archivio delle mappe.

Prompt/contratto `study-proposals-v1`, sezioni complete e citazioni canoniche, una sola
riparazione dentro il watchdog per sezione. Per il confronto caricare corpus L1 e pesi
embedding con il loro comando esplicito. Engine separati e sequenziali. Le proposte
restano temporanee e il report indica le metriche semantiche da revisionare. Nessun
generatore qualificato, accettazione nella mappa e L4 sospesi.


## Diagnosi sintetica e ripresa (8 ottobre)

[Rapporto aggiornato](../../docs/SPAZIO-STUDIO-AI-RIPRESA.md): criterio L1 rettificato,
risposte effettive E2B, varianti motivate e confronto v3. I report storici sono conservati.
Prompt corrente `study-proposals-prompt-v3-alias`; contratto finale `study-proposals-v1`
invariato. Alias per richiesta riconvertiti e sottoposti a validazione canonica finale.
Nessuna accettazione nella mappa; revisione semantica umana ancora da eseguire.

Con `study:dev`, pagine **solo sviluppo**:

- `/challenge.html`: campione distinto, 48 passaggi/16 positive/4 negative, profilo congelato;
- `/diagnostic.html`: solo fonte DNS fissa, variante esplicita, risposta finale visibile, niente canali interni;
- `/evaluation.html`: corpus sintetico completo, senza/con 270M, tutte le sezioni nei denominatori.

Richiedono pesi già presenti e verificati; non scaricano nuovi modelli e non aprono L2.
Il comando di continuazione registra il timeout e procede alle sezioni successive in
un nuovo worker, senza riprovare la sezione scaduta. Le interruzioni del browser sono
separate e non costituiscono un verdetto sul modello. I contatori non osservati restano
indisponibili. Evitare modifiche ai sorgenti/HMR durante l'inferenza.

Le sole pagine sintetiche usano un POST same-origin al sink di sviluppo
`/__synthetic_report`, con nomi di report fissi e dimensione limitata. Questa eccezione
locale alla guardia GET/HEAD non esiste in preview/build né nel percorso mappa/import.
I report possono sovrascrivere le corrispondenti nuove misure: copiarli prima di una
ripetizione da conservare. Worker di sviluppo ricostruiti per ogni nuovo job.

Dalla radice della repository:

```sh
node --import tsx experiments/study-local/scripts/evaluate-hard.ts
python3 experiments/study-local/scripts/analyze-generation.py
node experiments/study-local/scripts/review-generation.mjs
node --import tsx experiments/study-local/scripts/verify-generation-report.ts
```

L'analisi ricava solo conteggi/tempi, non punteggi semantici. La scheda
`reports/l3-human-review.html` affianca ogni proposta valida alle fonti e include anche
le sezioni mancanti o rifiutate: campi umani vuoti, da compilare e conservare separatamente.
I tempi osservati non qualificano RAM/GPU, dispositivi mobili o funzionamento offline.
