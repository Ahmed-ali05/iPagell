# Piano di sperimentazione — Appunti da lezione

[Analisi iniziale](../LEZIONI-LIVE-AI.md) · [Protocollo](EVALUATION.md) · [Fonti](SOURCES.md) · [Modello rapporto](REPORT-TEMPLATE.md)

**10 ottobre 2026.** Unità di lavoro distinte dal programma Spazio Studio L0–L4. Stato: **LN-00 completato come preparazione; LN-01–LN-05 non avviati**. Questo piano non costituisce un risultato di efficacia né un ordine di pubblicazione.

## Organizzazione

- **Responsabile prodotto:** utente, conferma problema, priorità e decisione di proseguire.
- **Responsabile tecnico delle prove:** da assegnare prima di LN-01; conserva configurazioni, misure e limiti.
- **Revisore didattico:** docente o persona competente nella materia, distinto dall’autore del prompt quando possibile.
- **Referente del pilota:** scuola e referente privacy, da identificare prima di coinvolgere una classe reale.

Una persona può coprire più ruoli nel banco iniziale; dichiarare quando manca una revisione indipendente. Il piano non avvia agenti, chat, automazioni o contatti con la scuola.

| Fase | Consegna verificabile | Condizione per proseguire |
|---|---|---|
| **LN-00 — inquadramento** | Brief, fonti primarie, confini dati, area documentale, protocollo e modello rapporto | Completato solo sul piano documentale; controlli registrati nella matrice |
| **LN-01 — banco e distribuzione** | Ambiente locale indipendente; prova minima dei candidati; artefatti/licenze/versioni; corpus e annotazioni congelati | Runtime utilizzabile in Chrome, contenuti locali, isolamento controllato, corpus non contaminato dalla selezione del modello |
| **LN-02 — ascolto e ASR** | Confronto appaiato Whisper/Vosk, prima corto poi 45–60 min; errori, tempi, lacune e privacy | Un candidato supera i criteri ASR e operativi. Esito negativo rimane un risultato valido |
| **LN-03 — utilità degli appunti** | Baseline estrattiva e possibile generatore locale; prove su testo corretto e ASR reale; giudizi umani | Miglioramento utile con fedeltà/contaminazione entro soglia, senza compromettere LN-02 |
| **LN-04 — pilota controllato** | Prima sessioni simulate, poi eventuale aula autorizzata; confronto con appunti manuali e rapporto su utilità, attenzione, accettabilità e ostacoli | Trattamento e regole scolastiche verificati prima della classe reale; criteri concordati e nessun problema critico aperto |
| **LN-05 — proposta di integrazione** | Decisione motivata, flusso di revisione/copia, piano di rollout e regressioni | Evidenze sufficienti, limiti comunicabili, approvazione del percorso prodotto; implementazione/rilascio come task successivi |

Non accorpare LN-02 e LN-03 in un unico punteggio: una sintesi può sembrare fluida pur nascondendo una trascrizione sbagliata.

## LN-01: predisposizione del banco futuro

1. Rileggere `AGENTS.md`, snapshot, architettura e matrice; registrare commit **e differenze locali rilevanti**. Il checkout corrente contiene lavoro preesistente: non ripulirlo o portarlo automaticamente nell’esperimento.
2. Usare `experiments/lecture-notes`, manifest/lockfile e output propri. Nessun import da app, hook/storage iPagell o `study-local`; niente modifiche alle dipendenze principali per avviare la prova.
3. Origine proposta `http://127.0.0.1:5175`, porta fissa da verificare, loopback e profilo Chrome di prova senza login iPagell. Non è un server avviato o una porta già riservata. Le porte separano lo storage per origine, **non i cookie per host**: evitare credenziali, richieste all’app e cookie nel banco.
4. Nessun Sites/Worker/D1/R2, service worker o telemetria. Prima prova con asset locali; download dei pesi solo su comando, origine e byte visibili, versione/hash verificati. Runtime servito localmente; niente JavaScript CDN a versione mobile.
5. Se WASM multithread richiede header di isolamento, applicarli e provarli soltanto nel banco. Non modificare globalmente gli header dell’app. Il microfono richiede un contesto sicuro: verificare localhost o HTTPS secondo il browser. [MDN](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia).
6. Qualificare per primo Whisper `base` multilingue; misurare `tiny` sulla parte di sviluppo. Qualificare poi Vosk piccolo italiano nel port browser prescelto, verificandone manutenzione, licenza, caricamenti e cancellazione. Supporto nativo non certifica il port.
7. Fissare identità del candidato: checkpoint, conversione, precisione, tokenizer, runtime/commit, byte completi, hash, licenze e configurazione audio. Le dimensioni del modello non sono la RAM né il download totale.
8. Preparare corpus e annotazioni descritti nel protocollo; revisionare i gold umani e congelare split/soglie prima del test finale. Nessun corpus è stato già consegnato in LN-00.

Prima consegna: un rapporto LN-01 con **procedere / non procedere / evidenza insufficiente**, più elenco delle combinazioni effettivamente avviate. Un’interfaccia vuota o una build riuscita non qualificano ASR e privacy.

## LN-02 e LN-03: ordine delle prove

**LN-02:** prima una frase italiana e un silenzio, poi clip fisse e prove microfono realistiche. Separare risultati provvisori da segmenti consolidati; verificare duplicazioni ai confini, ritardi e perdita di acquisizione. Lingua italiana impostata esplicitamente, niente traduzione automatica. Provare 45–60 minuti solo dopo il controllo dei buffer e della rete.

**LN-03:** iniziare dal testo corretto annotato per isolare selezione e appunto. Confrontare selezione manuale, baseline estrattiva e generazione locale; ripetere quindi sul risultato ASR congelato. Valutare infine la pipeline continua con competizione CPU/GPU. Non cambiare il trascritto per favorire un generatore.

Per ogni frase dell’appunto devono essere disponibili durante la revisione i passaggi testuali che la supportano. I tempi servono a localizzarli nella sessione, non a offrire replay audio. Le citazioni sono temporanee; il salvataggio finale non conserva una trascrizione nascosta.

Conservare un registro delle decisioni nel rapporto: domanda, alternative, evidenza, scelta, limiti e condizione di riesame. Una nuova variante nasce da un errore osservato nella parte di sviluppo. Timebox iniziale: massimo due runtime ASR e una variante generativa nel primo ciclo; aprire un ciclo nuovo per altri candidati, senza retry indefiniti sul test finale.

## Rischi che cambiano la direzione

| Riscontro | Decisione prevista |
|---|---|
| Solo il microfono vicino funziona | Restringere il caso d’uso e provarne l’accettabilità; non dichiarare supportata una normale posizione in aula |
| ASR utile, generatore poco fedele | Conservare modalità estrattiva/modificabile, senza promettere appunti automatici completi |
| La selezione cancella esempi o domande rilevanti | Rendere più conservativo il filtro e riprovarlo; non compensare con un testo inventato |
| Modello leggero insufficiente ma variante più grande utile | Rapporto esplicito sul compromesso; eventuale modalità notebook, senza estensione implicita ai telefoni |
| La pipeline non sostiene il ritmo | Pausa e lacuna visibile; ridurre frequenza della sintesi o fermare la prova, senza conservare audio arretrato |
| Invio di contenuto, audio persistito o risultato di altra sessione | Arresto del ciclo, conservazione di sole evidenze non sensibili, correzione e nuova verifica prima di continuare |
| Il risultato non riduce il lavoro di revisione | Non procedere all’integrazione; il riconoscimento riuscito non basta a giustificare la funzione |

## Condizioni della futura integrazione

LN-05 produce una proposta; non modifica ancora l’app. La proposta deve specificare:

- Ingresso dalla materia/Appunti; stati pronto, ascolto, pausa, problema, conclusione, revisione. Stato microfono sempre comprensibile; nessuna ripresa silenziosa dopo sospensione.
- Default personale; salvataggio del solo appunto approvato, con sincronizzazione nell’account spiegata prima della copia. Condivisione in classe separata.
- Formato `plain` o `md-lite-v1` canonico, titolo/materia, quote attuali, gestione del testo lungo senza perdita. Preservare CAS/outbox, conferme locale/remota e recupero.
- Invalidazione dei job su cambio account/vista, logout, stop e cancellazione; nessun risultato tardivo in un contesto diverso. Gestione distinta della bozza e della cache dei modelli.
- Nessun runtime/peso AI nel precache ordinario senza una decisione dedicata; download/rimozione espliciti e verifica dell’uso offline completo.
- Disponibilità progressiva per browser/dispositivi provati, possibilità di disattivazione e ritorno al flusso manuale. L’interruttore di rollout impedisce nuovi ascolti senza cancellare note confermate.
- Regressioni su Appunti, backup, account e PWA; verifica privacy e operativa, evidenze umane. Produzione e domini verificati tramite Sites secondo [Deployment](../DEPLOYMENT.md).

## Ripresa del lavoro

Aprire l’[area di lavoro](../../experiments/lecture-notes/README.md), completare LN-01 e compilare un nuovo rapporto dal [modello](REPORT-TEMPLATE.md). Prima di ogni fase rileggere la precedente decisione; aggiornare soltanto sezioni e documenti coinvolti. Mantenere «proposto», «eseguito» e «verificato» distinti, riportando anche fallimenti e misure mancanti.
