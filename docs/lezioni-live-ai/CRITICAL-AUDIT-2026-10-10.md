# Audit critico di prodotto e strategia — Appunti da lezione

**Data:** 10 ottobre 2026. **Oggetto:** la nuova funzione di ascolto live e produzione di appunti, nel contesto reale di iPagell. **Raccomandazione:** sospendere lo sviluppo della funzione in attesa di una prima validazione comportamentale; eseguire le cinque prove descritte sotto. Non è una raccomandazione di sospendere il diario esistente.

[Analisi iniziale](../LEZIONI-LIVE-AI.md) · [Piano precedente](PLAN.md) · [Protocollo tecnico](EVALUATION.md) · [Snapshot](../REPO-SNAPSHOT.md) · [Matrice delle evidenze](../VERIFICATION-MATRIX.md)

## Mandato, metodo e limiti

Questo rapporto applica il mandato di revisore critico: non assume che l’idea meriti sviluppo perché tecnicamente possibile, già documentata o proposta dal fondatore. L’indipendenza è di giudizio, non di terza parte: i documenti iniziali sono stati prodotti nella stessa conversazione. Non è una revisione esterna cieca e non include interviste indipendenti.

Sono stati riletti AGENTS.md, snapshot, architettura, matrice, proposta Lezioni live, piano/protocollo/fonti, roadmap e analisi del posizionamento. Nel codice sono stati esaminati workspace e ingresso agli Appunti, writer/outbox, storage, validazione/formato delle note, pubblicazione di classe, tipi del diario, scala voti, landing e generazione del precache. È un esame delle aree pertinenti, non una certificazione dell’intera repository. Il checkout ha modifiche locali preesistenti; il commit di partenza `fdd59f8` non identifica da solo tutto il contenuto esaminato.

È stata utilizzata la ricerca online, con documentazione ufficiale dei prodotti, autorità privacy e pubblicazioni scientifiche. Le pagine commerciali confermano ciò che un fornitore dichiara di offrire; non provano accuratezza, soddisfazione o superiorità. Nessun concorrente è stato provato sul campo. Per alcuni studi è stato consultato l’abstract; l’articolo Elsevier citato sotto non è stato accessibile integralmente e il mirror PMC ha richiesto un controllo anti-bot.

Non sono stati consultati dati di utenti, analytics, fatturazione o database. Non sono stati eseguiti ASR, ascolto, test di apprendimento o verifiche live del sito. È stato creato soltanto questo rapporto, senza modificare codice o documenti esistenti.

Nel rapporto **verificato nel codice** indica un riscontro statico; **documentato** indica una dichiarazione o proposta leggibile; **inferenza** indica una conseguenza ragionata; **ipotesi** richiede una prova. Le probabilità delle obiezioni sono qualitative e spesso non stimabili: non esistono dati sufficienti per assegnare percentuali.

## Fase 1 — Comprensione indipendente

### Il prodotto esistente e l’idea nuova risolvono problemi differenti

iPagell oggi vuole aiutare uno studente a seguire scadenze, voti e appunti personali, mantenendo separati i dati della classe. Richiede di inserire e aggiornare informazioni; non sostituisce il registro della scuola. Il valore atteso è organizzativo: ritrovare materiale e capire cosa preparare e come stanno andando i voti. [Roadmap](../PRODOTTO.md), [workspace](../../components/ipagell-app.tsx).

La nuova funzione vuole risolvere un altro problema: perdere contenuti utili mentre si ascolta una spiegazione, oppure spendere troppo tempo a trasformare il parlato in materiale utilizzabile. Il risultato dovrebbe essere un appunto per materia, con meno digressioni e senza audio conservato. L’oggetto di valore è l’appunto affidabile e riutilizzato; la trascrizione è soltanto un mezzo.

| Elemento | Stato riscontrato | Cosa non dimostra |
|---|---|---|
| Voti, agenda, assenze e organizzazione per materia | Implementati nel workspace e nei tipi del diario | Domanda, frequenza d’uso o vantaggio rispetto alle abitudini esistenti |
| Note personali e di classe | Implementate; sync personale, bozza/anteprima/conferma per classe | Che gli utenti prendano già appunti in iPagell durante le lezioni |
| Editor ed export | Formato chiuso `plain`/`md-lite-v1`, limiti, lettura ed export documentati e implementati | Che il formato basti a rappresentare una lezione con lavagna, diagrammi e formule |
| Audio live, ASR e filtro delle digressioni | Proposti; la cartella `lecture-notes` contiene README e .gitignore | Funzionamento, qualità, privacy applicativa o compatibilità Chrome |
| Generazione di appunti live | Proposta, nessun generatore qualificato per questo compito | Risparmio di lavoro, fedeltà o miglioramento dell’apprendimento |
| Altro laboratorio AI | Sperimentazione separata, con limiti generativi documentati | Prontezza del nuovo caso d’uso o impossibilità generale di realizzarlo |

Riscontri: [tipi](../../types/domain.ts), [controller note](../../hooks/use-notes.ts), [formato](../../lib/notes/format.ts), [validazione](../../lib/notes/validation.ts), [note di classe](../../components/class-notes-panel.tsx), `experiments/lecture-notes/README.md`, [diagnosi Studio](../SPAZIO-STUDIO-AI-RIPRESA.md). La ricerca nei percorsi applicativi e nel manifest non ha trovato una pipeline di acquisizione/trascrizione.

### Per chi esisterebbe realmente

Il pubblico «studenti» è troppo ampio. Il segmento iniziale coerente con il progetto è: **persone che seguono lezioni orali in italiano, possono usare un notebook e il microfono, perdono informazioni utili non recuperabili facilmente e sono disposte a rivedere un appunto senza riascolto**. Questo segmento non è stato identificato sul campo.

Gli utenti attuali o potenziali del diario non coincidono automaticamente con questo segmento. La scala 1–6 rende plausibile un contesto svizzero, mentre la nuova preferenza notebook/italiano identifica un ambiente tecnico, non un mercato. La roadmap include anche un uso rapido su iPhone: è una tensione di abitudini da verificare, non una contraddizione inevitabile. [Scala](../../lib/grading.ts), [posizionamento](../PRODOTTO-NOME-POSIZIONAMENTO-2026-10-10.md), [roadmap](../PRODOTTO.md).

Esigenze di accessibilità o difficoltà nel prendere appunti possono rendere il problema più intenso per alcune persone, ma non sono un pubblico già validato per iPagell. Non va presentato come strumento compensativo senza prove e contesto appropriati.

### Ipotesi implicite e comportamento richiesto

Per funzionare come prodotto devono essere vere, insieme, queste condizioni: il problema è ricorrente; il parlato contiene la parte importante della lezione; il microfono la cattura; la selezione non elimina contenuti utili; la revisione costa meno del lavoro sostituito; lo studente può e vuole attivare il dispositivo; docenti e compagni accettano il trattamento; l’assenza di replay è tollerabile; l’appunto viene usato dopo la lezione; tenerlo in iPagell vale più che lasciarlo nello strumento abituale.

Il piano presume una sequenza precisa: aprire il notebook, entrare nella webapp, scegliere la materia, consentire il microfono, ricordarsi di avviare e terminare, riconoscere le lacune, correggere il testo e confermarne la conservazione. Ciascun passaggio può essere ragionevole; la sequenza complessiva deve essere osservata, non dedotta da una demo riuscita.

### Essenziale e accessorio

| Essenziale per dimostrare il valore | Accessorio nel primo ciclo |
|---|---|
| Informazioni utili recuperate correttamente; lacune esplicite | Effetto visivo della trascrizione in tempo reale |
| Riduzione del lavoro totale a parità di qualità | Aggiornamento della sintesi a ogni breve intervallo |
| Avvio/stop affidabili e uso concretamente consentito | Classificazione automatica della materia e identificazione delle voci |
| Compromesso di conservazione compreso e accettato | Embedding, mappe, chat, quiz e continuità automatica del corso |
| Appunto realmente riutilizzato nel luogo scelto dall’utente | Condivisione di classe e rollout in quattro lingue |

Il filtraggio è essenziale soltanto se le digressioni creano un costo osservabile. La generazione AI è essenziale soltanto se supera una selezione estrattiva o un aiuto manuale. L’integrazione nel diario è essenziale soltanto se modifica favorevolmente il comportamento: non lo diventa perché l’editor esiste già.

## Fase 2 — Attacco intelligente all’idea

La gravità indica quanto l’obiezione comprometterebbe la promessa se confermata. La probabilità riguarda il suo verificarsi nel segmento scelto; non misura quanto suoni convincente. «Non stimabile» non significa bassa.

### O1 — Il dolore potrebbe essere sporadico o già risolto

- **Ipotesi sotto attacco:** perdere o riordinare contenuti orali è un problema frequente e importante per abbastanza persone raggiungibili.
- **Ragionamento:** se dispense, appunti del docente, compagni o una normale nota risolvono il bisogno, il prodotto aggiunge preparazione e revisione senza rimuovere un costo significativo. Una funzione desiderabile non è necessariamente una funzione usata.
- **Evidenze:** i documenti non riportano osservazioni di lezioni degli utenti, tentativi di recupero, tempi persi o utilizzo ripetuto; l’analisi del posizionamento segnala esplicitamente l’assenza di evidenze di retention. Non prova che il problema non esista.
- **Gravità:** critica. **Probabilità:** non stimabile.
- **Come smentirla:** casi ripetuti documentati da materiali e azioni reali, con tentativi di soluzione già costosi; successivo uso spontaneo del risultato.

### O2 — La funzione di base è già disponibile altrove

- **Ipotesi sotto attacco:** trascrizione e appunti AI danno un motivo sufficiente per scegliere iPagell.
- **Ragionamento:** uno strumento noto o fornito dall’istituto può essere sufficiente. Integrazione per materia e privacy sono possibili differenze, ma devono compensare cambio di abitudine e compromessi.
- **Evidenze:** Genio e Jamworks documentano appunti/sintesi da lezioni; Notta documenta italiano; Apple Notes documenta trascrizione italiana su Mac compatibili. Dettagli e fonti sono nella fase 4. Nessuna prova comparativa è stata eseguita.
- **Gravità:** alta, critica per una proposta basata sulla sola novità. **Probabilità:** l’esistenza di alternative è verificata; esposizione e preferenza degli utenti target non sono stimabili.
- **Come smentirla:** confronto sullo stesso compito in cui persone scelgono e riusano iPagell per un vantaggio concreto, non per il marchio AI.

### O3 — L’assenza di audio può eliminare il valore che si cerca

- **Ipotesi sotto attacco:** conservare soltanto il risultato è preferibile a conservare anche la possibilità di recuperare il parlato.
- **Ragionamento:** se lo studente vuole soprattutto tornare a una spiegazione difficile, il prodotto elimina proprio quella possibilità. L’errore può emergere giorni dopo, quando anche la trascrizione temporanea è stata scartata. La scelta privacy è un compromesso di prodotto, non un vantaggio universale.
- **Evidenze:** la proposta prevede eliminazione di audio e trascrizione; nessuno ha ancora scelto questa limitazione durante un compito reale. Alcune alternative mantengono registrazione e collegamento al testo.
- **Gravità:** critica per il segmento che cerca recupero. **Probabilità:** plausibile, frequenza ignota.
- **Come smentirla:** utenti informati rinunciano realmente al riascolto, correggono dubbi senza costi sproporzionati e scelgono di nuovo la stessa modalità.

### O4 — Gli errori possono diventare irreversibili attraverso due trasformazioni

- **Ipotesi sotto attacco:** ASR e riscrittura producono un appunto affidabile con una revisione sostenibile.
- **Ragionamento:** il riconoscimento può alterare una negazione; la sintesi può renderla fluida e quindi meno visibile. Dopo l’eliminazione della fonte la verifica si sposta su memoria, libri o terzi. La qualità apparente può aumentare proprio mentre diminuisce la verificabilità.
- **Evidenze:** ASR e generazione Lezioni non sono stati provati. Il precedente laboratorio generativo ha risultati insufficienti nella combinazione testata, ma non è evidenza diretta contro questa nuova pipeline.
- **Gravità:** critica. **Probabilità:** plausibile; frequenza e costo degli errori non misurati.
- **Come smentirla:** prove cieche su negazioni, numeri e rettifiche; pochi errori critici, dubbi riconoscibili e tempo totale inferiore al metodo abituale.

### O5 — Lo studente non controlla tutte le condizioni d’uso

- **Ipotesi sotto attacco:** chi desidera il prodotto può attivarlo nelle lezioni che contano.
- **Ragionamento:** l’uso dipende da regole dell’istituto, persone ascoltate e contesto. Anche una pipeline perfetta può non avere un luogo di utilizzo accettabile. L’assenza di file audio non elimina automaticamente il trattamento o le obiezioni sociali.
- **Evidenze:** istituto e giurisdizione non indicati; IFPDT e Garante distinguono condizioni e contesti dell’ascolto/registrazione. Non esiste una verifica della particolare funzione effimera o un’autorizzazione scolastica. Fonti nella fase 4.
- **Gravità:** critica. **Probabilità:** non stimabile per gli istituti target.
- **Come smentirla:** condizioni d’uso chiare e concretamente percorribili in istituti raggiungibili, con adesione osservata e senza dover aggirare regole.

### O6 — Il sensore scelto può non vedere la parte importante della lezione

- **Ipotesi sotto attacco:** il solo audio basta a produrre un appunto adeguato alla materia.
- **Ragionamento:** una dimostrazione alla lavagna, un grafico indicato o un esercizio svolto senza verbalizzare i passaggi non sono recuperabili dal suono. Rumore e distanza aggiungono perdite. Nessuna sintesi può ricostruire in modo fedele dati mai acquisiti.
- **Evidenze:** OCR, lavagna e immagini sono esclusi esplicitamente dal perimetro. Il formato note non rappresenta liberamente immagini/tabelle. Nessun test acustico in aula.
- **Gravità:** critica per lezioni prevalentemente visive; alta negli altri casi. **Probabilità:** alta sotto quella condizione; prevalenza delle condizioni target ignota.
- **Come smentirla:** un segmento prevalentemente orale con prove realistiche; limiti compresi e appunto comunque sufficiente al compito. Aggiungere telecamere non è una confutazione economica: cambierebbe il progetto.

### O7 — Decidere cosa è una digressione può distruggere il significato

- **Ipotesi sotto attacco:** la pertinenza è identificabile con errori e costo inferiori al semplice mantenere il parlato utile.
- **Ragionamento:** esempi, battute mnemoniche e domande possono sembrare fuori tema ma spiegare il concetto. Eliminare contenuti è spesso una decisione didattica. Un filtro aggressivo può produrre un appunto ordinato ma meno comprensibile.
- **Evidenze:** il piano riconosce il rischio, ma non ci sono corpus annotato, disaccordi tra revisori o risultati. La materia selezionata non fornisce da sola il contesto pedagogico.
- **Gravità:** critica per la promessa di appunti utili. **Probabilità:** plausibile, non quantificata.
- **Come smentirla:** confronto con revisori competenti su esempi ambigui; vantaggio rispetto alla baseline senza omissioni che richiedano ricostruzione.

### O8 — La routine può costare più del bisogno

- **Ipotesi sotto attacco:** notebook, permessi, avvio, stop e revisione entrano naturalmente nella lezione.
- **Ragionamento:** un beneficio disponibile soltanto quando ci si ricorda di preparare tutto può mancare nei momenti importanti. Un notebook aperto e una scheda attiva possono essere un costo per chi oggi usa carta o telefono. Non basta ridurre i clic se l’intera routine è fuori posto.
- **Evidenze:** notebook Chrome è una preferenza del fondatore per la prima prova; la roadmap comprende uso rapido mobile. Non abbiamo osservazioni di studenti nel contesto previsto.
- **Gravità:** alta. **Probabilità:** non stimabile; cresce per chi non usa già un notebook in classe.
- **Come smentirla:** attivazione e ritorno ripetuti senza promemoria, su occasioni eleggibili reali, con costo totale accettabile.

### O9 — Il testo ricevuto potrebbe non diventare apprendimento

- **Ipotesi sotto attacco:** ricevere appunti ordinati lascia più attenzione alla spiegazione e rende il lavoro di studio almeno altrettanto efficace.
- **Ragionamento:** è possibile ascoltare meglio, ma anche delegare la selezione e rinviare la comprensione. Correggere dopo può spostare il carico anziché ridurlo. Il risparmio nella produzione del testo non equivale a apprendimento.
- **Evidenze:** nessun dato iPagell. La letteratura su modalità di note-taking e lecture capture non consente una condanna o una promozione generale dell’automazione; i risultati non riguardano questa funzione. Fonti e limiti nella fase 4.
- **Gravità:** alta; critica se si promettesse miglioramento scolastico. **Probabilità:** non stimabile.
- **Come smentirla:** compiti di comprensione e riutilizzo, tempo totale e controllo differito confrontati con il metodo abituale, senza affidarsi alla sensazione di chiarezza.

### O10 — Il costo di mantenere la funzione può superarne il valore

- **Ipotesi sotto attacco:** il vantaggio giustifica dipendenze, modelli, compatibilità, supporto e gestione degli errori.
- **Ragionamento:** eseguire localmente riduce alcune spese server ma trasferisce vincoli ai dispositivi. Rimangono aggiornamenti, download, memoria, incompatibilità e casi di perdita. Il costo opportunità può essere affidabilità del diario e QA ancora aperta.
- **Evidenze:** il piano tecnico richiede runtime e ciclo di vita separati; matrice/roadmap riportano verifiche fisiche e operative aperte. Mancano costi misurati, disponibilità di manutentori e modello economico. Non si assume che iPagell debba diventare un abbonamento.
- **Gravità:** alta. **Probabilità:** non stimabile; l’aggiunta di oneri tecnici è certa, la loro sostenibilità no.
- **Come smentirla:** utilità ripetuta e costo operativo misurato compatibile con tempo e finalità del progetto. Se l’obiettivo fosse ricerca personale, andrebbe dichiarato e valutato separatamente dal prodotto.

### O11 — La funzione potrebbe non appartenere al prodotto scelto

- **Ipotesi sotto attacco:** chi usa voti/agenda vuole fare di iPagell il luogo principale dei propri appunti di lezione.
- **Ragionamento:** organizzazione del semestre e cattura della lezione sono attività diverse. La base installata, che non è quantificata, non prova distribuzione per questo nuovo bisogno. Una buona funzione autonoma può non migliorare il diario.
- **Evidenze:** la proposta di posizionamento non ha risolto con dati la scelta fra diario e spazio studio; gli Appunti sono implementati, ma l’uso durante lezioni e il riutilizzo non sono documentati.
- **Gravità:** alta per l’integrazione, inferiore per una ricerca isolata. **Probabilità:** non stimabile.
- **Come smentirla:** persone collocano e ritrovano spontaneamente i risultati in iPagell e lo preferiscono a un’app di note già usata.

### O12 — Conservare solo il finale contrasta con la promessa di non perdere lavoro

- **Ipotesi sotto attacco:** la perdita potenziale prima della conferma è un costo accettabile.
- **Ragionamento:** il diario corrente protegge bozze e scritture incerte; il nuovo piano lascia il lavoro progressivo in memoria. Ricarica o chiusura possono rendere inutile un’ora di ascolto. Salvare bozze testuali cambierebbe il contratto di conservazione; non risolve il problema dichiarando semplicemente «è tutto temporaneo».
- **Evidenze:** il rischio è esplicito nella proposta. Il writer attuale salva in IndexedDB e avvia la sync: riutilizzarlo introdurrebbe un invio del testo. [Writer](../../hooks/use-notes.ts), [storage](../../lib/notes/storage.ts).
- **Gravità:** alta, potenzialmente critica per l’uso ricorrente. **Probabilità:** perdita certa se la sessione termina prima della conservazione; frequenza di quel caso ignota.
- **Come smentirla:** tolleranza osservata e affidabilità sufficiente nelle condizioni reali; oppure una revisione esplicita del contratto accettata dagli utenti. Non suggerisco di cambiare ora il codice.

### O13 — Il piano può qualificare il motore prima di scoprire che nessuno ne ha bisogno

- **Ipotesi sotto attacco:** partire da runtime, corpus e soglie tecniche è il modo meno costoso per decidere se investire.
- **Ragionamento:** WER, copertura e vantaggio rispetto al trascritto grezzo sono necessari per un sistema affidabile, ma non identificano domanda, sostituzione delle abitudini o ritorno spontaneo. Un candidato può superarli e restare una demo.
- **Evidenze:** LN-01/LN-02 precedono le prove utenti. Il protocollo include correttamente revisione umana e confronto con note manuali: la critica riguarda l’ordine e il costo delle prime decisioni, non l’assenza totale di validazione. Le soglie proposte non derivano da preferenze misurate.
- **Gravità:** alta per l’investimento, non per l’idea in sé. **Probabilità:** rischio concreto se il successo tecnico viene scambiato per segnale di prodotto.
- **Come smentirla:** validazione del bisogno e di un risultato ideale prima del banco completo; poi soglie collegate agli errori e costi che gli utenti realmente tollerano.

## Fase 3 — Difesa rigorosa e contraddittorio

Le difese seguenti non trasformano possibilità in dati. Indicano dove lo scetticismo deve essere ristretto e dove rimane un ostacolo reale.

| Obiezione | Miglior difesa sostenibile | Esito del contraddittorio |
|---|---|---|
| O1, bisogno | La presenza di prodotti specifici e ricerca sul note-taking rende plausibile un problema per alcuni segmenti | Resiste la mancanza di domanda nel segmento iPagell; si indebolisce l’affermazione assoluta «il problema non esiste» |
| O2, alternative | Locale, browser e appunto per materia possono dare un vantaggio combinato; non serve una categoria nuova | Resiste l’onere del confronto. «Ci sono concorrenti, quindi non c’è spazio» sarebbe una critica debole |
| O3, audio eliminato | Ridurre le copie della voce può essere un beneficio per chi valuta molto riservatezza e minimizzazione | Resiste il compromesso col riascolto. La superiorità per tutti non è difendibile |
| O4, errori | Baseline estrattiva, dubbi visibili e revisione possono limitare la propagazione | Riduce il rischio, ma non restituisce la fonte persa né prova costi sostenibili |
| O5, condizioni d’uso | Simulazioni informate sono praticabili; alcuni istituti e contesti possono consentire l’uso | Si indebolisce un divieto universale. Rimane da identificare un contesto reale accessibile |
| O6, solo audio | Una lezione prevalentemente verbale può essere un segmento sufficiente | Critica ridimensionabile scegliendo il segmento; la promessa generale per ogni materia resta insostenibile |
| O7, filtro | Il filtro può essere conservativo e mantenere gli ambigui, anziché eliminarli | Difesa valida da testare, con possibile aumento del lavoro di revisione |
| O8, routine | Chi usa già notebook e note digitali può avere pochi passaggi aggiuntivi | Critica più debole in quel segmento; nessun dato dimostra quanto sia raggiungibile |
| O9, apprendimento | Alleggerire la produzione del testo può permettere ad alcune persone di ascoltare e rielaborare meglio | È un meccanismo plausibile. La letteratura non dimostra né beneficio né danno per questa funzione |
| O10, sostenibilità | Un caso limitato e senza inferenza remota può contenere alcune spese | Non elimina manutenzione e supporto. La sostenibilità resta aperta |
| O11, appartenenza | Materie, editor ed export costituiscono un luogo concreto per il risultato | È un vantaggio architetturale verificato; il vantaggio comportamentale è ancora un’ipotesi |
| O12, perdita | Non conservare dati intermedi semplifica il confine della privacy | Difesa comprensibile ma non sufficiente rispetto al costo del lavoro perso |
| O13, ordine delle prove | Il piano è già isolato e prevede verifiche umane, non un rilascio immediato | Critica attenuata. Restano prove economiche che possono invalidare l’idea prima di qualificare modelli |

**Critiche che resistono maggiormente:** bisogno non validato, compromesso senza replay, costo della correzione, condizioni d’uso e mancanza di riutilizzo osservato. **Critiche deboli se formulate in modo assoluto:** l’esistenza di concorrenti chiude il mercato; usare AI peggiora necessariamente lo studio; il fallimento di un precedente modello prova l’impossibilità della nuova funzione.

## Fase 4 — Confronto con la realtà

### Prodotti e alternative verificati nelle fonti

| Alternativa | Fatto documentato al 10 ottobre 2026 | Implicazione e limite |
|---|---|---|
| **Genio Notes — Study Notes** | La guida descrive appunti strutturati a partire da registrazione/trascritto, formati Bullet/Cornell e disponibilità della funzione tramite istituto. Pagina aggiornata il 6 ottobre 2026. [Guida ufficiale](https://help.genio.co/article/427-study-notes) | Il problema scolastico è già servito da un prodotto specializzato. Le affermazioni di efficacia/assenza di invenzioni sono del fornitore; non sono state validate qui |
| **Jamworks** | La guida descrive registrazione della lezione, sintesi dal trascritto, player e download del riassunto. [Guida ufficiale](https://help.jamworks.com/en/articles/6744008-how-do-i-summarise-my-lecture) | Trasformare una lezione in testo utile non è una novità di categoria. Non sono stati verificati italiano, qualità o condizioni economiche |
| **Notta** | La pagina italiana descrive input audio e registrazione dal vivo con italiano selezionato; disponibilità via browser/app. [Pagina ufficiale](https://www.notta.ai/en/transcribe-italian) | Un generico bisogno di trascrizione italiana ha alternative. Non si assumono qualità, conservazione o privacy equivalenti a quelle proposte da iPagell |
| **Apple Notes su Mac** | La guida descrive registrazione, trascritto live, copia e riascolto; italiano fra le lingue supportate su Mac M1 o successivi, con vincoli di lingua/regione. [Supporto Apple](https://support.apple.com/en-ie/guide/notes/apdb5106e334/mac) | Parte della funzione può essere già nel dispositivo di alcuni utenti. Non copre ogni notebook e non offre automaticamente il contratto effimero proposto |
| **Metodo abituale** | Carta, editor, materiali della lezione e aiuto dei compagni sono alternative da osservare nel segmento; non è verificato quali siano disponibili in ciascun istituto | La concorrenza decisiva può essere continuare come prima, con nessun nuovo avvio, account o revisione |

Non sono stati verificati prezzi, quote, numero di clienti o percentuali commerciali di accuratezza; non entrano nel giudizio. Non è stata eseguita una ricerca esaustiva delle policy di conservazione di tutti i fornitori. Quindi **non è dimostrato che «nessun audio salvato» sia esclusivo**, né che queste alternative rispettino lo stesso requisito.

La differenziazione candidata è un insieme di condizioni: trattamento locale verificabile, minimo contenuto conservato, appunto utile senza replay e collocazione per materia. È una tesi da testare. Il modello open source scelto non costituirebbe da solo un vantaggio difficilmente replicabile.

### Comportamenti e apprendimento: che cosa dicono le fonti

**Studio di replica sul note-taking, Urry e colleghi, 2021.** L’abstract descrive una replica del confronto laptop/manoscritto: differenze nella quantità/verbatim delle note, senza sostenere un vantaggio generale della scrittura a mano nell’apprendimento immediato. È una ragione per evitare lo slogan «automatizzare o digitare distrugge l’apprendimento». Non studia appunti generati da AI, conservazione effimera, studenti di iPagell o risultati a lungo termine. [Pubblicazione APS](https://www.psychologicalscience.org/journals/psychological-science/0956797620965541/).

**Ebbert e Dutke, 2020.** Lo studio sul servizio di registrazioni a Münster distingue modalità differenti di utilizzo: frequenza, visione completa/parziale, ripetizione e lezioni perse. Sono dati autoriferiti, non una prova di riutilizzo nel nostro prodotto. L’inferenza utile è che non esiste un solo «comportamento dello studente»: chi vuole riascoltare selettivamente potrebbe non essere il pubblico di un appunto finale senza fonte. [Articolo](https://journal.alt.ac.uk/index.php/rlt/article/view/2258).

**Revisione sul lecture capture, 2020.** L’abstract della revisione di 71 articoli segnala predominanza di studi descrittivi/esplorativi e limitata evidenza causale. È stato letto tramite indicizzazione; il testo integrale non è stato accessibile in questa sessione. Non viene usato per affermare un effetto causale su voti o frequenza. [Articolo originale](https://www.sciencedirect.com/science/article/pii/S036013152030230X).

La ricerca consultata riguarda soprattutto università e registrazioni disponibili, mentre il progetto iniziale riguarda lezioni italiane e scarto dell’audio. È trasferibile come fonte di domande e rischi, non come prova di domanda o efficacia. Non ci sono in questo audit comportamenti osservati di utenti iPagell.

### Vincoli dell’ambiente reale

L’IFPDT richiama protezione dei dati e norme penali per ascolto/registrazione di conversazioni non pubbliche, con attenzione al consenso preventivo. Il Garante italiano distingue studio personale, disposizioni scolastiche e altri usi/diffusione. Sono condizioni da esaminare nel luogo d’uso, non una conclusione legale sul prodotto. Il permesso microfono del browser non risolve la questione. [IFPDT](https://www.edoeb.admin.ch/it/registrazione-di-conversazioni), [Garante](https://www.garanteprivacy.it/it/temi/scuola).

**Fatti verificati:** esistenza delle funzioni documentate dei concorrenti e stato statico della repository. **Inferenze ragionevoli:** concorrenza alla promessa di base, perdita di verificabilità senza fonte, necessità di restringere contesti. **Ipotesi aperte:** preferenza per privacy effimera, bisogno del segmento, superiorità del risultato, disponibilità a cambiare routine e sostenibilità.

## Fase 5 — Cinque esperimenti economici di falsificazione

Questi esperimenti sono proposti, non eseguiti. Non richiedono una nuova integrazione né l’intero corpus tecnico. Usare contenuti sintetici e adulti informati nelle simulazioni; un coinvolgimento successivo di minori o un’aula reale richiede condizioni appropriate. Non è autorizzato da questo rapporto l’invio di messaggi, la raccolta di registrazioni o il contatto con scuole.

I piccoli numeri sotto sono regole operative per decidere il prossimo investimento, da fissare prima della prova, **non stime del mercato o percentuali di confidenza**. Un fallimento si interpreta nel segmento/contesto provato. Separare mancata partecipazione, assenza di occasioni e rifiuto del prodotto.

### E1 — Dimostrare il dolore dai comportamenti e dai materiali

- **Ipotesi:** esiste un bisogno ricorrente che il metodo abituale non risolve.
- **Procedura:** con sei persone del segmento candidato, esaminare sul posto il lavoro delle ultime tre lezioni: materiali disponibili, note, dubbi rimasti e azioni di recupero già compiute. Far completare un piccolo compito che richieda quei contenuti. Non copiare dati personali e non chiedere «ti piacerebbe un’app AI?».
- **Metrica:** casi di informazione utile non recuperata, minuti e passaggi necessari a ricostruirla, ripetizione del problema nelle tre occasioni, alternative effettivamente utilizzate.
- **Successo:** almeno quattro persone mostrano un costo concreto e ripetuto in almeno due occasioni, non risolto da materiale già disponibile.
- **Esito di modifica/abbandono:** casi isolati o bisogno già soddisfatto per la grande maggioranza: abbandonare la promessa generalista oppure cercare un segmento più preciso prima di sviluppo.
- **Costo e limite:** circa mezza giornata di sessioni, oltre al reclutamento; non misura domanda su larga scala.

### E2 — Provare il beneficio nel caso migliore, senza costruire ASR

- **Ipotesi:** un appunto fedele e pronto dopo la lezione migliora il compito rispetto al metodo abituale.
- **Procedura:** sei persone seguono due brevi lezioni equivalenti, con ordine alternato. In una usano il metodo ordinario; nell’altra ascoltano e ricevono un appunto preparato e verificato manualmente, dichiarando che il servizio è simulato. Nessun replay audio. Far correggere/riutilizzare il risultato e risolvere compiti immediati e il giorno seguente.
- **Metrica:** tempo totale di presa/riordino/revisione/recupero, correttezza dei compiti, fatti mancanti, riutilizzo spontaneo del testo.
- **Successo:** almeno quattro persone riducono il lavoro senza perdere elementi critici o peggiorare nei compiti comparabili; il vantaggio non si riduce al testo più gradevole.
- **Esito di modifica/abbandono:** anche il risultato ideale non migliora il lavoro, viene ignorato o aumenta l’onere: fermare lo sviluppo live per quel segmento. Se aiuta soltanto una categoria, restringere il caso d’uso.
- **Costo e limite:** una giornata breve più il controllo differito. È un limite superiore del valore: un risultato umano perfetto non dimostra che il modello lo raggiunga.

### E3 — Fare scegliere il compromesso senza audio quando conta

- **Ipotesi:** il beneficio della mancata conservazione compensa la perdita di riascolto/verifica.
- **Procedura:** con gli stessi partecipanti, usare lezioni sintetiche e fonti preparate per il test. Offrire due flussi con appunto di qualità comparabile: finale senza fonte accessibile dopo la conferma, oppure risultato con fonte locale consultabile. Spiegare conservazione e conseguenze in modo neutro. Introdurre un compito ambiguo o un dato da verificare; osservare la soluzione. In entrambe le occasioni far scegliere liberamente il flusso, verificando se la scelta cambia dopo il primo dubbio.
- **Metrica:** scelta concreta e ripetuta, richieste di recupero, costo del dubbio, rinuncia o richiesta di conservare la fonte.
- **Successo:** un sottogruppo identificabile — almeno tre delle sei persone in questo campione — sceglie due volte la modalità effimera e completa il compito senza costi sproporzionati.
- **Esito di modifica/abbandono:** preferenza prevalentemente per replay/fonte, o accettazione dichiarata che scompare al primo dubbio: rivedere la promessa di conservazione o il segmento. Non interpretare il risultato come autorizzazione a cambiare automaticamente la policy.
- **Costo e limite:** una sessione aggiuntiva breve e una ripetizione; confronto iniziale, non valutazione completa di fiducia o privacy.

### E4 — Cercare presto un contesto di utilizzo praticabile

- **Ipotesi:** ambiente, regole e acquisizione consentono l’uso nel segmento raggiungibile.
- **Procedura:** verificare con i referenti competenti le condizioni in due istituti pertinenti, senza presumere che la sola autorizzazione di un docente basti. In ambienti consentiti, simulare una breve lezione con adulti informati, notebook e microfono in posizione realistica. Usare un ASR locale esistente, senza costruire la pipeline iPagell e senza conservare il flusso live. Un osservatore ha lo script e conta lacune/elementi critici.
- **Metrica:** contesti eleggibili, condizioni richieste, distanza tollerabile, parole/fatti critici recuperati e interventi necessari. Separare fattibilità istituzionale e tecnica.
- **Successo:** almeno un contesto concretamente accessibile e una configurazione ordinaria che recupera il contenuto utile senza ripetere artificialmente ogni frase, spostare il microfono fuori dalla routine o usare un servizio remoto.
- **Esito di modifica/abbandono:** nessun contesto percorribile nell’accesso attuale, oppure funziona solo vicino alla bocca/in condizioni da studio: sospendere il caso aula ordinaria; valutare separatamente un uso autorizzato vicino alla fonte.
- **Costo e limite:** pochi giorni per ottenere risposte, più una sessione; non è una certificazione legale né un benchmark definitivo. Se i contesti mancano, non compensare registrando comunque.

### E5 — Verificare ritorno e appartenenza a iPagell con un servizio manuale

- **Ipotesi:** gli appunti vengono riutilizzati e tenerli in iPagell è un vantaggio reale.
- **Procedura:** offrire per una settimana appunti controllati di brevi sessioni autorizzate/sintetiche, dichiarando la preparazione manuale. Lasciare scelta libera fra copia negli Appunti esistenti di iPagell e strumento abituale; nessun obbligo di registrarsi per ricevere il testo, nessun promemoria continuo. Osservare almeno tre occasioni eleggibili e un successivo compito di studio. Non leggere dati personali dell’account né introdurre analytics.
- **Metrica:** richieste successive spontanee, apertura e uso del risultato nel compito, luogo scelto per conservarlo, passaggi necessari a ritrovarlo.
- **Successo:** almeno quattro delle sei persone tornano in più occasioni e usano realmente il risultato; per giustificare l’integrazione, un sottogruppo deve anche scegliere e ritrovare il testo in iPagell senza incentivo.
- **Esito di modifica/abbandono:** zero o una persona ritorna nonostante occasioni reali: fermare il servizio nel segmento. Riutilizzo del testo ma preferenza stabile per altri strumenti: non è un fallimento degli appunti, è evidenza contro l’integrazione nel diario.
- **Costo e limite:** una settimana di calendario e lavoro manuale limitato; ritorno breve, non retention di un semestre né disponibilità a pagare.

**Ordine raccomandato:** E1 ed E2 per primi; E3 prima di cristallizzare il contratto; E4 prima di prove in aula; E5 prima dell’integrazione. Solo dopo segnali coerenti ha senso pagare la qualificazione tecnica completa LN-01–LN-03. Il protocollo tecnico precedente resta utile per quell’obiettivo, ma non sostituisce questi esperimenti.

## Fase 6 — Verdetto indipendente

### 1. Il miglior argomento a favore

Per una persona che perde spiegazioni orali utili e dispone di un contesto autorizzato, ottenere un appunto fedele già organizzato nella materia potrebbe ridurre un lavoro ricorrente. Elaborarlo localmente e minimizzare la voce conservata può essere un compromesso apprezzato. iPagell possiede già materia, editor e percorso di conservazione del risultato: l’integrazione eventuale ha un punto d’arrivo concreto. La combinazione è plausibile; il suo valore per un segmento raggiungibile non è ancora dimostrato.

### 2. Il miglior argomento contro

Il prodotto potrebbe eliminare la fonte che serve per correggere gli errori, offrendo una sintesi meno verificabile di alternative già disponibili, mentre chiede notebook, condizioni di ascolto e revisione. Se il bisogno è recuperare la spiegazione anziché ricevere un testo breve, il compromesso fondante è sbagliato. Questa possibilità non si risolve con un modello più grande o un’interfaccia migliore.

### 3. Le tre ipotesi più fragili

1. Esiste un segmento accessibile con dolore abbastanza frequente da cambiare abitudine e ritornare.
2. Le persone preferiscono davvero un appunto senza audio/trascrizione recuperabili, anche dopo un dubbio concreto.
3. Il costo complessivo di revisione resta inferiore al metodo abituale quando si sommano ASR, selezione, contenuti visivi mancanti e condizioni d’aula.

### 4. Le tre caratteristiche più promettenti

1. **Risultato organizzato per materia:** destinazione concreta già presente nell’app, da verificare sul comportamento.
2. **Trattamento locale e conservazione minima:** possibile scelta distintiva per un segmento preciso, subordinata a verifica tecnica e accettazione.
3. **Perimetro iniziale limitato e revisione esplicita:** permettono di falsificare le ipotesi senza trasformare subito il diario o promettere apprendimento automatico.

La terza è un pregio del metodo di sperimentazione, non una ragione autonoma per cui gli utenti dovrebbero desiderare il prodotto.

### 5. Le complessità che eliminerei dal primo investimento

Toglierei l’obbligo di dimostrare subito sintesi continuamente aggiornata, embedding, molti runtime, supporto a ogni materia, ruoli di classe, mappe/chat/quiz e rollout multi-dispositivo. Non amplierei lo schema dell’app per adattarlo a output generativi prima di verificare il valore del semplice testo. Queste sono riduzioni di scope della ricerca, non modifiche da applicare ora al codice.

Non eliminerei verifica dei dati, stato del microfono, limiti espliciti e controllo della qualità: senza questi si testa una promessa diversa. Non aggiungerei registrazione permanente come correzione automatica: prima va verificato se il requisito originario è apprezzato o confligge con il bisogno.

### 6. Evidenze mancanti

Mancano osservazioni nel segmento, uso ripetuto degli Appunti correnti, alternative effettivamente disponibili, valore dopo la revisione, preferenza comportamentale sul replay, regole dei contesti target, acquisizione realistica, errori critici della pipeline completa, apprendimento/riutilizzo, costo di supporto e responsabilità operative. Non sono noti dimensione del segmento, capacità di raggiungerlo o volontà di finanziare il servizio. Un’interfaccia ordinata, test del codice e disponibilità di modelli non colmano queste lacune.

### 7. Il più piccolo esperimento che può cambiare il verdetto

**E2, preceduto da una verifica minima del bisogno in E1:** due lezioni brevi equivalenti, sei persone, metodo abituale contro appunto umano fedele senza replay, compito immediato e differito. Non richiede sviluppo del motore. Se anche il caso migliore non riduce lavoro o non viene usato, è un segnale forte per fermare il caso d’uso. Se aiuta in modo ripetibile e le persone chiedono di riaverlo, il verdetto può passare a un investimento tecnico limitato. Non dimostrerebbe ancora che l’AI raggiunga quella qualità.

### Raccomandazione: SOSPENDERE IN ATTESA DI VALIDAZIONE

Sospendere **sviluppo della nuova funzione e integrazione nel prodotto**, continuando le prove economiche di bisogno, beneficio ideale e compromesso di conservazione. La ricerca attuale dimostra che il problema è plausibile e già servito da altri; non dimostra che questa soluzione specifica sia desiderata, migliore o sostenibile per iPagell. Non ci sono basi sufficienti per abbandonare definitivamente l’idea, né per continuare automaticamente col banco completo solo perché il piano è pronto.

La confidenza è **alta sulla carenza di evidenze di validazione nei materiali esaminati**, **moderata sulla convenienza di fermare l’investimento tecnico più ampio finché non emergono segnali comportamentali**, e **bassa sul destino commerciale o sull’utilità finale dell’idea**. Sono giudizi sulla forza delle evidenze, non probabilità numeriche di successo.

La condizione per cambiare raccomandazione è concreta: bisogno ricorrente dimostrato, beneficio del risultato dopo revisione, accettazione ripetuta della modalità senza fonte e un contesto d’uso percorribile. La condizione per abbandonare il segmento è altrettanto concreta: il risultato ideale non migliora il lavoro, gli utenti necessitano del replay che il prodotto esclude, oppure il contesto reale non permette l’uso. Se il testo è utile ma non viene portato in iPagell, va riesaminata l’integrazione, non dichiarata automaticamente fallita l’intera idea.
