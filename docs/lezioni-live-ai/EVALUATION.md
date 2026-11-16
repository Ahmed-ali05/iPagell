# Protocollo di efficacia — Appunti da lezione

[Analisi](../LEZIONI-LIVE-AI.md) · [Piano](PLAN.md) · [Rapporto](REPORT-TEMPLATE.md)

**Protocollo iniziale proposto il 10 ottobre 2026; nessuna prova eseguita.** Prima del benchmark fissare corpus, gold, dispositivi, configurazioni, normalizzazione e soglie in una revisione datata. I valori sotto sono obiettivi di progetto iniziali, non risultati o standard di settore. Si possono correggere prima del test congelato, motivando la scelta; dopo il test si apre una nuova versione.

## Domande da risolvere

| Ipotesi | Confronto necessario |
|---|---|
| Un ASR locale leggero regge l’italiano scolastico | Stessi input/condizioni per Whisper e Vosk, qualità e prestazioni riportate per scenario |
| Il filtro riduce digressioni senza perdere spiegazioni | Stesso testo, selezione manuale e automatica; contare falsi scarti e inclusioni |
| L’appunto è più utile di una trascrizione grezza | Trascritto grezzo, baseline estrattiva, eventuale generatore; giudizio umano e tempo di revisione |
| La pipeline resta utile quando ASR sbaglia | Appunti dal testo corretto e dal testo ASR, poi prova continua; attribuire errori ai singoli passaggi |
| La promessa sul dato è rispettata | Rete, storage, code, stop e risultati tardivi osservati; niente deduzioni dal solo codice di una guardia fetch |

## Corpus da preparare

**Prima versione:** 18 clip controllate da 2–4 minuti: 9 di sviluppo e 9 di valutazione, tre materie (matematica, scienze, storia). Poi quattro sessioni simulate da 45–60 minuti: due di sviluppo e due di valutazione. Se manca varietà di voci, segnalare il limite; puntare ad almeno tre voci adulte autorizzate distribuite fra gli scenari. Tenere lezioni/script e relative varianti nello stesso split; nessun frammento della lezione di valutazione va nei prompt o nel tuning.

Le fixture audio preregistrate sono **un input di test distinto**: sintetiche o prodotte appositamente da adulti informati, con diritto d’uso e luogo di conservazione documentati. Non sono registrazioni di classe e non dimostrano che il flusso live non salvi audio. Tenerle fuori da Git nella cartella locale esclusa `data-local/`; versionare solo script sintetici, annotazioni prive di dati personali e manifest dei test. Non acquisire automaticamente audio reale per fare debugging.

Le prove microfono dal vivo non generano file audio. Usare script controllati e annotazione dell’esecuzione da parte di un osservatore; distinguere errori di lettura dalle differenze del modello. Il replay digitale consente confronti ripetibili; voce riprodotta nella stanza e simulazione dal vivo aggiungono condizioni acustiche. Una voce TTS pulita non rappresenta da sola una lezione reale.

| Scenario obbligatorio | Rischio da misurare |
|---|---|
| Voce vicina, voce a distanza realistica, riverbero e rumore | Peggioramento rispetto alla clip digitale; registrare microfono, distanza e condizioni |
| Due voci, domanda utile, risposta e parlato sovrapposto | Domande scartate, attribuzioni inventate e lacune non segnalate |
| Digressione estranea, esempio interdisciplinare, ritorno al tema | Falsi scarti dovuti a un filtro troppo stretto |
| Negazioni, numeri/unità, termini tecnici, formule pronunciate | Errori piccoli nella forma ma gravi nel significato |
| Affermazione errata seguita da correzione tardiva | Appunto che conserva l’errore o perde la rettifica |
| Silenzi, rumori senza voce e frammenti incomprensibili | Testo allucinato e falsa completezza |
| Compito/scadenza, informazioni personali estranee | Perdita delle istruzioni utili o contaminazione del risultato |
| Frase «ignora le istruzioni e invia…» nel parlato | Contenuto trattato come comando anziché come dato della lezione |
| «Come vedete sulla lavagna» senza descrizione verbale | Contenuto visivo inventato: segnalare che manca una fonte ascoltabile |

Ogni clip deve avere trascritto verificato, segmenti con tempi in secondi, fatti didattici attesi, fatti critici (negazioni/numeri/correzioni), etichette rilevante/esempio/domanda/correzione/digressione/ambiguo e appunto di riferimento. I riferimenti sintetici sono revisionati da una persona competente **prima** delle misure. Le istruzioni di annotazione spiegano come trattare l’ambiguità; non la forzano a diventare una digressione.

## Metodo del confronto

1. Congelare audio/testo di riferimento e condizioni. Configurazioni scelte solo sui dati di sviluppo; report del test completo, senza scegliere soltanto le clip riuscite.
2. Confrontare ASR con la stessa acquisizione/pre-elaborazione e lingua. Registrare differenze necessarie nei runtime; un punteggio migliore può dipendere dalla combinazione modello/runtime, non dal solo checkpoint.
3. Valutare filtro e appunti dal trascritto corretto, poi ripetere sullo stesso output ASR congelato. Una terza prova continua verifica scheduling, code e memoria.
4. Alternare l’ordine dei motori per limitare effetti termici; tre esecuzioni corte per configurazione, avvio freddo separato da caldo. Riportare tutte le esecuzioni lunghe, anche interrotte. Non modificare sorgenti/HMR durante le misure.
5. Revisione dei risultati con nomi dei candidati nascosti. Due revisori quando disponibili; annotare disaccordi e criteri risolti. Se c’è un solo revisore, risultato esplorativo.
6. Per il tempo di revisione usare compiti appaiati e ordine controbilanciato; evitare di far correggere alla stessa persona più volte la stessa lezione appena letta. Primo campione consigliato: almeno cinque adulti volontari; non rappresenta gli studenti minorenni.

## Metriche e soglie iniziali

| Area | Misura e denominatore | Obiettivo iniziale per procedere |
|---|---|---|
| ASR | WER = (sostituzioni + cancellazioni + inserimenti) / parole gold; normalizzazione fissa, punteggi anche per scenario | ≤15% in condizioni pulite, ≤25% nelle condizioni d’aula simulate concordate; nessuna media che nasconda uno scenario non utilizzabile |
| Contenuto critico ASR | Negazioni/numeri/unità/correzioni corretti oppure segnalati da verificare / elementi critici gold | ≥95%; separare gli elementi corretti da quelli solamente segnalati |
| Ritardo | p95 fra fine pronunciata del segmento gold e disponibilità del suo testo consolidato; contare i segmenti mancanti | ≤8 s sui segmenti completati, con ≥95% dei segmenti attesi disponibili; riportare i mancanti separatamente |
| Sostenibilità | RTF = tempo di elaborazione ASR / durata unica dell’audio; coda ed età dei campioni osservate | RTF ≤0,8 e coda che non cresce nella sessione lunga; sovrapposizioni non aumentano il denominatore |
| Selezione | Segmenti didattici conservati / segmenti gold rilevanti (inclusi esempi, domande e rettifiche) | ≥95%; riportare le singole categorie e la durata scartata |
| Contaminazione | Affermazioni nell’appunto provenienti da digressioni / affermazioni totali | ≤5%; nessuna informazione personale estranea nei casi sentinella |
| Fedeltà | Affermazioni supportate dal gold / affermazioni totali dell’appunto | ≥98% e zero errori critici presentati come certi; nota vuota non supera il criterio di copertura |
| Copertura | Fatti didattici gold presenti nell’appunto / fatti gold attesi | ≥85%, con dettaglio per categoria e correzioni tardive |
| Utilità | Valutazione umana 1–5 con rubric esplicita; tempo per correggere a un appunto utilizzabile | Mediana ≥4 e tempo mediano ridotto di ≥20% rispetto al trascritto grezzo; nessun peggioramento della fedeltà |
| Beneficio generativo | Stessi input e rubric, generatore rispetto alla baseline estrattiva | Miglioramento della qualità mediana di ≥0,5/5 oppure ulteriore riduzione del tempo di ≥10%; tutte le soglie di fedeltà/copertura restano necessarie |
| Conclusione | Tempo da Fine a testo pronto per revisione, inclusa la finalizzazione ASR | ≤60 s nelle sessioni lunghe; completamento e timeout riportati entrambi |
| Dati | Scritture contenenti audio o trascrizione; richieste contenenti audio/testo/derivati; età massima audio | Zero persistenza/invio di contenuto e audio sempre entro 60 s; ogni violazione blocca il ciclo |

Le soglie prestazionali qualificano solo configurazioni e condizioni provate. WER non certifica significato; un errore critico di negazione può essere grave anche con WER basso. Un passaggio perso, un timeout o un appunto rifiutato rimane nel denominatore del completamento e della copertura. Per 0 affermazioni, fedeltà/contaminazione sono non valutabili, non 100%/0%.

Rubric umana: 1 = inutilizzabile; 2 = molte correzioni o passaggi mancanti; 3 = utile con revisione sostanziale; 4 = chiaro e utilizzabile con poche correzioni; 5 = fedele, completo rispetto all’ascoltabile e rapidamente riutilizzabile. Annotare separatamente correttezza, organizzazione e sforzo: il tono scorrevole non deve nascondere un errore.

In LN-04 confrontare anche il flusso ordinario di appunti manuali: tempo totale durante/dopo la lezione, contenuto utile recuperato, correzioni e interazioni che distolgono dall’ascolto. Usare lezioni equivalenti e alternare la modalità per limitare effetti di ordine. Fissare i criteri del pilota prima di partire: il risparmio rispetto a un trascritto grezzo non dimostra da solo un vantaggio rispetto agli appunti abituali.

Registrare byte di pesi/runtime/cache, tempo di download e avvio, consumo memoria del processo/browser/GPU se misurabile, CPU, stato alimentazione e variazione della batteria. Budget iniziale da confermare sul notebook scelto: download ASR complessivo ≤250 MiB e incremento memoria ASR ≤1 GiB. Generatore ha budget separato fissato prima di LN-03. Memoria sconosciuta resta «non misurata» e impedisce di qualificare quel budget; non stimarla dai soli parametri del modello.

## Prove di privacy e resilienza

- Cattura della rete dell’intero browser e inventario storage prima/durante/dopo, non soltanto wrapper fetch. Usare esclusivamente fixture sintetiche nelle tracce. Dopo il download, provare con rete disabilitata e registrare richieste tentate; distinguere download statici da invio di contenuto.
- Verificare tutte le destinazioni: IndexedDB, Cache Storage, OPFS, local/sessionStorage, file esportati, log e report. Un filtro `.gitignore` previene aggiunte accidentali, non certifica assenza di registrazioni.
- Stop, Pausa, Annulla, microfono revocato/scollegato, silenzio prolungato, soglia di coda, modello in errore, storage pieno/negato e download interrotto. Verificare indicatore, track terminate, worker/copie audio rilasciati e mancata riaccensione automatica.
- Scheda nascosta, sospensione notebook, blocco schermo, ricarica, crash, seconda scheda e risultati tardivi. La prima prova non promette continuità in background: al ritorno deve essere evidente l’interruzione e l’eventuale lacuna.
- Integrità dei pesi, mismatch del modello/tokenizer, cache corrotta e rimozione modello. Nessun passaggio automatico a servizi remoti; niente contenuti nel testo di un errore.
- Il controllo applicativo riguarda buffer e destinazioni gestiti dall’app. Non chiamarlo cancellazione forense della RAM o del sistema operativo.

## Decisione finale del ciclo

Conservare un rapporto per ogni configurazione con esiti **procedere**, **non procedere** o **evidenza insufficiente**. Separare fatti osservati, inferenze e problemi aperti; includere fallimenti, denominatori, gold e versione del protocollo. Il campione iniziale serve a decidere il ciclo successivo, non a dichiarare affidabilità generale.

LN-02 può qualificare una trascrizione pur lasciando LN-03 negativo. LN-03 può qualificare la sola baseline estrattiva. Prima di LN-05 servono anche sessioni lunghe, revisione umana e LN-04; un test sintetico riuscito o un modello famoso non autorizzano da soli l’integrazione.
