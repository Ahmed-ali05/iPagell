# iPagell — Riferimento UX, UI e contenuti

Aggiornato: 17 settembre 2026. Secondo passaggio UX sul commit `1436fad`.

Questo documento conserva contesto, evidenze e proposte. Non certifica un rilascio e non autorizza automaticamente l'implementazione. Nessun codice o dato scolastico è stato modificato durante questa analisi.

## Come mantenere questo riferimento

- **Principio documentato:** deriva dal prodotto o dalle istruzioni dell'utente; va preservato nelle proposte.
- **Osservato:** verificato nell'interfaccia locale.
- **Da implementazione:** dedotto dal codice attuale; gli scenari di errore non sono stati tutti riprodotti.
- **Proposta:** raccomandazione ancora da approvare o implementare.
- **Da validare:** ipotesi sul comportamento degli studenti, non risultato di ricerca.

Per ogni futura modifica annotare data, decisione, motivo, sezioni coinvolte ed esito della verifica. Non segnare come risolto un problema solo perché esiste un task. Prima di aggiornare questo documento rileggere il comportamento corrente: il prodotto evolve.

## Principi documentati da conservare

1. Diario personale per sapere cosa scade, come si sta andando e cosa è stato registrato; non registro ufficiale.
2. Scala attuale 1–6 e sufficienza a 4. Non promettere supporto ad altre scale senza verifica.
3. Voti, assenze e avanzamento personale restano privati. La classe condivide attività.
4. L'agenda della classe precede membri e amministrazione; questi ultimi rimangono secondari.
5. Le attività della classe entrano nel diario per scelta dell'utente, conservando il collegamento agli aggiornamenti. Non introdurre importazione automatica indiscriminata.
6. Salvataggio sul dispositivo e nell'account sono stati distinti. Gli avvisi attuali funzionano ad app aperta; non promettere notifiche programmate in background.
7. Materie iniziali facoltative; niente risultati inventati negli stati vuoti.
8. Interfaccia leggibile, focus visibile, movimento riducibile; target tattili di almeno 44 px come obiettivo già documentato.
9. Privilegiare interventi piccoli e coerenti. Nessun redesign, nuova sezione o nuova funzione solo per sembrare più moderni.

Fonti: `PRODOTTO.md`, `USABILITA.md`, `CLASSI.md` e istruzioni dell'utente in questa conversazione.

## Perché dovrebbe servire a uno studente

| Area | Domanda a cui deve rispondere | Primo risultato riconoscibile |
|---|---|---|
| Home | Cosa devo guardare o fare adesso? | Scadenza utile e accesso diretto all'azione |
| Agenda | Cosa devo preparare, e per quando? | Un compito visibile nel giorno giusto |
| Voti | Come sto andando in questa materia? | Un voto e una media comprensibile |
| Materie | Come organizzo i miei voti? | Una materia pronta senza dover studiare le formule |
| Classi | Perché riscrivere le scadenze che abbiamo tutti? | Un'attività comune aggiunta alla propria agenda, ancora aggiornata |
| Statistiche | Dove è cambiato il mio andamento? | Un confronto fondato su dati sufficienti |
| Assenze | Quante ore ho registrato e cosa devo aggiornare? | Durata e giustificazione leggibili, senza farle passare per dati ufficiali |

## Percorsi da progettare come un insieme

### Nuovo utente autonomo

Attuale, da implementazione: landing → accesso predefinito → cambio a registrazione → credenziali → conservazione codice → profilo/semestre → Home → impostazioni materie → prima materia → primo voto o compito.

Proposta minima: CTA di registrazione distinta da accesso; mantenere la conservazione del codice; presentare il semestre precompilato come un riepilogo modificabile; rendere secondari scuola e dettagli iniziali; guidare dalla Home al primo inserimento. Se manca la materia, crearla nello stesso percorso e riprendere il modulo originale con i dati già inseriti.

Il primo valore non è «account creato»: è vedere il proprio primo voto con la media, oppure il proprio compito nella scadenza giusta. Sono due ingressi validi; non aggiungere un questionario per scegliere tra i due.

### Nuovo utente invitato

Il codice attuale conserva l'invito nell'URL fino all'apertura di Classi. Va verificato end-to-end con un account sintetico nuovo prima di dichiarare il percorso completato.

Proposta: conservare l'intenzione di unirsi durante registrazione/configurazione; non obbligare a creare materie personali per vedere la classe; dopo l'adesione mostrare attività e «Aggiungi alla mia agenda». Spiegare una volta che aggiungere mantiene il collegamento con la classe e che il completamento rimane privato.

### Ritorno quotidiano

Home → attività imminente o voto da registrare → azione breve → conferma coerente con il salvataggio → ritorno al contesto iniziale. Cambiare sezione non dovrebbe far perdere materia, vista agenda o giorno selezionato senza motivo.

## CRITICO

### C1 — Il contesto della materia si perde

**Osservato:** dalla Home «Inglese» apre il registro di Matematica; selezionando Inglese in Voti e premendo «Registra voto», il modulo propone Matematica. La prima materia dell'elenco viene usata al posto di quella scelta.

**Conseguenza probabile:** inserimento nella materia sbagliata, medie inattese e sfiducia. Non è soltanto un clic aggiuntivo.

**Proposta minima:** trasmettere la materia scelta da Home a Voti e da Voti al modulo. Mostrare anche il semestre di destinazione nel modulo. Per un accesso generico senza contesto, chiedere una scelta esplicita quando ci sono più materie; se ce n'è una sola, precompilarla.

Estendere il principio ad attività e giorni: toccare una specifica scadenza deve aprirla o evidenziarla, non portare soltanto al calendario generico. La card «Voti registrati» attualmente porta a Statistiche: riallinearne destinazione o titolo.

Evidenza: `components/ipagell-app.tsx` (Dashboard, GradesView), `components/entry-dialog.tsx` (EntryForm).

### C2 — Correggere ciò che si è registrato non è un percorso completo

**Da implementazione e prima analisi:** voti, attività personali originarie e assenze permettono di eliminare, ma non hanno un editor equivalente a quello degli eventi di classe.

**Conseguenza probabile:** cancellare e ricreare un voto errato o una scadenza modificata; un'assenza non giustificata non può diventare giustificata con una correzione semplice.

**Proposta minima:** riutilizzare i moduli esistenti con dati precompilati e «Salva modifiche». Rendere titolo/riga apribili e offrire «Modifica» esplicito. Tenere cancellazione e completamento separati. La modifica personale di un'attività collegata non deve cambiare quella di tutta la classe.

### C3 — La gestione dei conflitti delega il recupero all'utente

**Da implementazione:** il conflitto chiede esportazione locale e caricamento della copia account. La guida chiarisce che poi occorre confrontare e reinserire manualmente le differenze.

**Conseguenza probabile:** l'utente conserva un file ma non sa come tornare ai propri dati; può pensare che importarlo unisca le versioni, mentre sostituisce il diario.

**Intervento minimo prima di un confronto avanzato:** nel flusso di conflitto offrire «Scarica la copia di questo dispositivo» e «Carica la versione dell'account», con spiegazione persistente della sostituzione e del recupero. Conservare entrambe le versioni recuperabili prima di scartare modifiche. Non presentare il download come prova che l'utente abbia effettivamente conservato il file.

Un confronto assistito campo per campo è un'evoluzione successiva: richiede specifica tecnica e prova con due dispositivi, non è un intervento di solo copy.

## IMPORTANTE

### I1 — Il primo valore arriva dopo troppa configurazione

La landing enumera molte funzioni, ma non dichiara subito la scala 1–6. La CTA per iniziare apre un accesso con «Bentornato». La prima materia introduce colore, docente, coefficiente, tipologie e formula prima del primo voto.

**Proposta:** rendere espliciti uso personale, scala e due risultati principali; separare registrazione e accesso; mostrare inizialmente nome materia e riepilogo dei valori standard. «Personalizza il calcolo» espande pesi e coefficiente. Colore e docente restano facoltativi e secondari. Non spostare altrove l'avviso di ricalcolo storico quando l'utente modifica effettivamente i pesi.

Vantaggio: meno decisioni iniziali. Costo: un clic in più per chi ha un calcolo particolare. Per questa persona rendere il riepilogo dei pesi leggibile, non invisibile.

### I2 — La Home non distingue abbastanza urgenza, arretrati e mancanza di dati

**Osservato:** media senza voti, badge verde «Nessun voto», «Tutto bene» e assenza di una CTA nella card che invita al primo voto.

**Da implementazione:** la card principale sceglie la prima attività non completata in ordine cronologico, incluse le scadute. Una vecchia attività dimenticata può occupare stabilmente «Prossima verifica/consegna». Il countdown è ripetuto. Le attività nella Home aprono solo l'Agenda.

**Proposta minima:** card principale sulla prossima scadenza futura/odierna; arretrati separati in un richiamo «2 attività scadute da controllare», apribile e non nascosto. Se ci sono solo arretrati, mostrarli come tali. Conservare una sola indicazione del tempo restante. Nel diario vuoto privilegiare «Aggiungi un'attività» o «Registra il primo voto» invece di metriche senza dati.

La media deve dire su quanti voti e materie è calcolata; «Nessuna media sotto il 4 tra le materie con voti» è più affidabile di «Tutto bene» quando i dati sono parziali. Non occorre trasformare la Home in un report più lungo.

### I3 — Agenda e Classi mostrano la struttura del software prima del beneficio

**Osservato:** la toolbar Agenda ha navigazione alle classi, promemoria, creazione, filtri di origine e scelta Calendario/Elenco. «Dalle classi» identifica sia un filtro sia un comando di navigazione. Nella classe, creazione di gruppi, selettore, ruolo e grande intestazione precedono gli eventi.

**Proposta minima:** preservare tutte le destinazioni, ridurre altezza e ripetizioni dell'intestazione; «Nuova attività» resta l'azione principale dell'agenda. Rinominare il collegamento «Apri le classi». Ricordare vista agenda e contesto. Nella classe rendere compatto il selettore quando il gruppo è uno solo, mantenendo accessibile aggiunta/adesione; spostare «Modifica classe» nella gestione già esistente.

**Beneficio da rendere esplicito:** «Condividete compiti e verifiche senza riscriverli ognuno nel proprio diario». Lo stato vuoto attuale spiega come creare un gruppo, non perché.

Mantenere la scelta esplicita delle attività da aggiungere. Nel modulo di aggiunta precompilare il semestre corrente, lasciare facoltativa l'associazione alla propria materia e raccogliere queste opzioni sotto «Personalizza». La CTA resta «Aggiungi alla mia agenda».

Per l'attività già aggiunta, «Nella tua agenda» può diventare un accesso al dettaglio anziché un pulsante disabilitato. «Rendi personale» è ambiguo perché anche l'agenda collegata è privata: proporre «Scollega dalla classe», con conseguenza «L'attività resta nella tua agenda, ma non riceverà più gli aggiornamenti della classe».

Rimuovere «revisione 1» dalla lettura ordinaria. Non è un'indicazione utile della freschezza dei dati. Usare eventuale data di aggiornamento solo se serve ed è attendibile.

### I4 — Calcoli e simulazione possono generare aspettative sbagliate

**Da implementazione:** il peso mostrato nel registro è il peso del singolo voto, mentre il calcolo moltiplica anche quello della tipologia. Il simulatore salva il suo obiettivo nella preferenza condivisa con Home e Statistiche al termine dell'interazione. Cambiare coefficienti/pesi modifica anche medie di semestri passati; «Archiviato» non le congela.

**Proposta minima:** mostrare «Peso nel calcolo: 2×» con dettaglio espandibile dei fattori; rendere la simulazione temporanea e separarla dalla modifica esplicita dell'obiettivo generale. Non introdurre di nascosto obiettivi diversi per materia o semestre: sarebbe una modifica al modello di prodotto.

Quando si cambiano pesi che interessano voti esistenti, spiegare l'effetto sui periodi coinvolti prima del salvataggio. Conservare l'attuale formula; il congelamento storico è un progetto successivo.

«> 6.0» diventa «Una sola prova non basta per raggiungere questa media». Il titolo «Che voto mi serve?» va mantenuto: esprime già un motivo d'uso chiaro.

### I5 — Le statistiche diventano utili solo dopo che esistono abbastanza dati

**Osservato:** Statistiche occupa una voce propria nella navigazione anche quando il diario contiene pochi o nessun voto. In queste condizioni grafici, confronti e indicatori hanno poco valore e alcuni stati vuoti possono sembrare risultati reali.

**Problema UX:** la navigazione principale contiene già molte destinazioni. Dare alle Statistiche lo stesso peso di Home, Agenda o Voti fin dal primo giorno aumenta la densità senza offrire subito un beneficio concreto.

**Proposta:** non mantenere Statistiche come voce principale permanente della navigazione.

Le statistiche possono diventare progressive:

* con pochi dati non vengono enfatizzate;
* quando iniziano a esserci abbastanza voti, Home o Voti possono mostrare piccoli insight utili come andamento della media o variazione recente;
* da questi elementi l'utente può aprire la vista completa delle statistiche;
* la sezione completa può inoltre rimanere raggiungibile da Voti o da una voce secondaria, invece di occupare sempre uno spazio nella navigazione principale.

L'obiettivo non è nascondere una funzione, ma mostrarla quando ha qualcosa di significativo da dire.

Evitare soglie arbitrarie troppo rigide: la quantità minima di dati necessaria dipende dal tipo di indicatore. Una media può essere mostrata presto, mentre trend, confronti tra materie e grafici evolutivi richiedono più dati.

Quando i dati non sono sufficienti, non mostrare classifiche o grafici vuoti soltanto per riempire la schermata.

**Beneficio:** navigazione più semplice all'inizio e maggiore valore percepito quando le statistiche iniziano effettivamente a raccontare qualcosa sul percorso dello studente.


**Osservato:** Statistiche presenta grafici senza dati e indicatori «Più forte/Da rinforzare» vuoti. «Scenario senza nuovi voti» ripete la media attuale. Assenze mostra «Ottimo» senza registrazioni e una soglia iniziale di 24 ore.

**Da implementazione:** una sola materia può essere simultaneamente la più forte e quella da rinforzare. La lista assenze chiama «Intera giornata» ogni voce senza materia, anche se dura un'ora. Ritardo/uscita sono automaticamente considerati giustificati nel modulo. Oltre la soglia il messaggio rimane «Sei vicino».

**Proposta minima:** eliminare la card «Scenario senza nuovi voti»; senza voti mostrare una spiegazione del futuro beneficio e CTA al primo inserimento; con una sola materia non usare una classifica comparativa. Distinguere nessun dato, nessun risultato del filtro, caricamento ed errore.

Assenze: «Nessuna assenza registrata»; «Più lezioni / materia non indicata» al posto di «Intera giornata»; tipo di assenza e giustificazione come scelte distinte. «Soglia personale di riferimento: non è il limite ufficiale della scuola», con messaggi distinti prima, al raggiungimento e oltre. Non chiamarla avviso programmato. In futuro si può rendere la soglia facoltativa, ma non serve cambiare ora il modello dati per chiarirne il significato.

### I6 — Errori e conferme non sempre aiutano a decidere

**Da implementazione:** errori generici o messaggi grezzi di validazione possono arrivare al form; gli errori dei moduli di classe sono spesso toast; alcune conferme usano «Questa operazione modifica il tuo diario» e «Conferma» per azioni diverse. I due sistemi di sincronizzazione hanno stati separati, ma «Salvato nell'account» non ne dichiara l'ambito.

**Proposta minima:** errore vicino al campo, valori conservati, azione di recupero concreta. Toast come rinforzo, non unica sede di un errore da correggere. Conferma con oggetto, ambito, conseguenze e verbo esplicito: «Elimina voto», «Rimuovi dalla mia agenda», «Carica versione dell'account».

Specificare che eliminare una materia riguarda tutti i semestri e mostrarne l'impatto. Le copie provenienti da classi hanno una persistenza distinta: il riepilogo deve descrivere anche il loro comportamento effettivo, senza promettere una cancellazione indiscriminata.

Il diario privato salvato non implica classi aggiornate. Conservare stati distinti, chiamandoli «Diario personale salvato» e «Attività della classe non aggiornate» nei contesti misti.

## RIFINITURA: lessico e densità

| Attuale | Proposta | Motivo |
|---|---|---|
| Inizia con iPagell | Crea il tuo diario | Anticipa la registrazione; mantenere Accedi separato |
| Tu decidi cosa resta privato e cosa condividere | I tuoi voti e le assenze restano privati. Con la classe condividi le attività. | Non suggerisce la condivisione dei voti |
| Conserva la tua chiave | Salva il codice di recupero | Stesso nome lungo tutto il recupero |
| Tutte le sessioni verranno revocate | Dovrai accedere di nuovo su tutti i dispositivi | Conseguenza comprensibile |
| Colori, docenti e ponderazioni | Gestisci le materie e il calcolo delle medie | Parte dal compito dell'utente |
| Coefficiente generale | Peso della materia nella media generale | Distingue il livello del peso |
| Tipologia | Tipo di prova | Per scritto/orale; non sostituire indiscriminatamente altri usi |
| Dalle classi, pulsante | Apri le classi | Distingue navigazione e filtro |
| Nuovo evento, nella classe | Nuova attività | Stesso oggetto di compito/verifica nell'agenda personale |
| Alla mia agenda / Aggiungi solo per me | Aggiungi alla mia agenda | Destinazione esplicita |
| Rendi personale | Scollega dalla classe | Esprime la perdita di aggiornamenti, non di privacy |
| Promemoria | Avvisi ad app aperta | Evita aspettative da sveglia; prima del consenso spiegare limite |
| Eventi, nel conteggio assenze | Assenze registrate | Non confonde con le attività della classe |
| Salva, creazione | Registra voto / Aggiungi attività / Aggiungi materia | Conferma cosa viene creato |

Mantenere «Semestre» come termine corrente coerente con il prodotto documentato; nei campi oggi detti «Periodo personale» usare «Semestre della tua agenda». Un eventuale passaggio a «Periodo» per trimestri/quadrimestri va deciso trasversalmente, non cambiando singole etichette.

Ridurre descrizioni tecniche ripetute nei moduli: lo stato di salvataggio ha una sede dedicata. Rendere espliciti solo contesto, istruzioni necessarie ed eccezioni. Nascondere «Nessun docente» quando il dato facoltativo non serve. Rendere secondario «Recupera vecchio diario» per chi non proviene dalla versione precedente.

## Navigazione e qualità visiva

Mantenere sidebar, palette, card, icone con etichette e distinzione personale/classe. Sul mobile la densità verticale viene prima di un nuovo menu: compattare selettore materie, intestazioni e toolbar. Sei voci inferiori sono affollate, ma spostare subito Assenze o Statistiche sotto «Altro» ne ridurrebbe la reperibilità: prima verificare dimensioni, testi ingranditi e uso effettivo.

Le sezioni cambiano tramite stato interno: la cronologia del browser non registra ogni navigazione. Valutare continuità di Indietro e ricaricamento insieme alla conservazione del contesto, senza introdurre un secondo schema di navigazione.

La guida utente descrive ancora eventi condivisi come futuri; `CLASSI.md` e il prodotto li indicano già implementati. Aggiornare la guida e il piano prodotto con lo stato reale. Non usare tale disallineamento come motivo per rimuovere capacità già presenti.

## DA PASSARE A CODEX

Questi sono task proposti; non sono già implementati. Ordine consigliato: UX01–03, poi UX04–09. UX10 richiede una specifica di recupero più dettagliata.

### UX01 — Conservare il contesto degli inserimenti

- Problema: materia persa tra Home, Voti e modulo; attività e conteggi aprono destinazioni generiche.
- Comportamento: mantenere materia, semestre e attività di origine; precompilare la data quando si crea da un giorno selezionato.
- Schermate: Home, Voti, Agenda, moduli.
- Completato quando: Home → Inglese → Registra voto mostra Inglese; la data segue il giorno scelto; «Voti registrati» porta ai voti; una specifica attività si apre o viene evidenziata. Annullare torna al contesto precedente.

### UX02 — Modificare elementi personali

- Problema: correzione disponibile soltanto tramite cancellazione/ricreazione.
- Comportamento: riutilizzare moduli precompilati per voti, attività personali e assenze.
- Copy: «Modifica», «Salva modifiche»; distinguere «Modifica per la classe» quando autorizzato.
- Completato quando: la modifica non duplica l'elemento, aggiorna i riepiloghi, conserva l'originale in caso di errore e non altera dati di altri utenti.

### UX03 — Separare simulazione e impostazioni delle medie

- Problema: obiettivo di simulazione persistito implicitamente; peso mostrato incompleto.
- Comportamento: simulazione temporanea; obiettivo generale modificato solo con azione esplicita separata; peso effettivo con dettaglio dei fattori; avviso di ricalcolo storico quando pertinente.
- Schermate: Voti, Home, Statistiche, modifica materia.
- Copy: «Media da raggiungere» nel simulatore, «Peso nel calcolo», «Una sola prova non basta».
- Completato quando: simulare un obiettivo diverso non cambia Home/Statistiche; un voto peso 1 e tipo peso 2 mostra peso effettivo 2; cambi di coefficiente/peso con dati esistenti dichiarano l'effetto sui semestri passati.

### UX04 — Accorciare l'ingresso senza cambiare il sistema account

- Problema: CTA di avvio porta al login e configurazione lunga prima del primo risultato.
- Comportamento: registrazione/accesso separati; semestre precompilato riassunto e modificabile; dettagli facoltativi secondari; creare una materia senza perdere l'inserimento in corso; preservare inviti durante l'ingresso.
- Schermate: landing, account, profilo, Home, nuova materia.
- Copy: «Crea il tuo diario», «Accedi», «Salva il codice di recupero»; indicare scala 1–6.
- Completato quando: si arriva al primo voto/compito senza configurare pesi o scuola; un nuovo invitato raggiunge la classe senza materie personali obbligatorie. Conservazione del codice e protezioni account restano intatte.

### UX05 — Ridurre i campi al necessario

- Problema: parametri di voto anche nei compiti; materia e nuovo evento espongono opzioni premature.
- Comportamento: materia con nome iniziale e personalizzazione espandibile; tipo/peso di prova solo quando pertinenti; stato Attivo implicito nella creazione dell'attività condivisa; descrizioni e opzioni secondarie espandibili.
- Schermate: moduli voto, attività personale/condivisa, materia, aggiunta da classe.
- Completato quando: aggiungere un compito non richiede interpretare pesi; una materia standard si crea indicando solo il nome; i valori personalizzati già esistenti non vengono sovrascritti chiudendo opzioni; l'ambito personale/classe resta esplicito prima del salvataggio.

### UX06 — Home e stati vuoti utili

- Problema: arretrati dominano la prossima scadenza; successi senza dati; statistiche vuote e ridondanti.
- Comportamento: separare scadenze future e arretrati; CTA al primo inserimento; eliminare Scenario senza nuovi voti; stati diversi per zero dati, filtro vuoto, completato, caricamento ed errore.
- Schermate: Home, Agenda, Voti, Statistiche, Assenze, Classi.
- Copy: «Nessun voto registrato», «Nessuna attività per questo giorno», «Nessuna assenza registrata», «Attività scadute da controllare».
- Completato quando: vecchio compito aperto e verifica futura sono entrambi reperibili con titoli corretti; zero voti non produce successo o classifica; un giorno vuoto non dichiara vuota tutta l'agenda; un errore di caricamento non invita a creare una classe come se nessuna esistesse.

### UX07 — Rendere chiaro il beneficio delle classi e ridurre la densità

- Problema: amministrazione prima delle attività; lessico e pulsanti non coerenti; troppi elementi prima del contenuto su mobile.
- Comportamento: compattare intestazione e selettore singola classe; gestione secondaria; preservare scelta esplicita delle attività; rendere accessibile il dettaglio di quelle già aggiunte; ricordare vista e filtri Agenda; selettore materie compatto in Voti su mobile.
- Copy: «Condividete compiti e verifiche senza riscriverli ognuno nel proprio diario», «Apri le classi», «Aggiungi alla mia agenda», «Scollega dalla classe».
- Completato quando: appartenenza alla classe non implica aggiunta automatica di tutto; titolo/data collegati seguono aggiornamenti, completamento resta personale; sparisce il numero di revisione; si ritrova il contesto tornando da altre sezioni. Nessuna voce di navigazione viene rimossa senza una decisione separata.

### UX08 — Assenze comprensibili e correggibili

- Problema: senza materia equivale erroneamente a Intera giornata; ritardi/uscite sono implicitamente giustificati; soglia personale sembra un limite disponibile.
- Comportamento: etichetta neutra senza materia, tipo e giustificazione distinti, soglia esplicitamente personale con stati prima/al raggiungimento/oltre.
- Schermate: Assenze, relativo modulo e riepilogo Home.
- Completato quando: un'ora senza materia non viene descritta come giornata intera; un ritardo può essere non giustificato e poi aggiornato; superare 24 ore con soglia 24 non mostra «Sei vicino»; non è suggerita una soglia ufficiale né un avviso in background. Non riclassificare automaticamente i dati storici.

### UX09 — Errori, conferme e lessico coerenti

- Problema: messaggi generici/tecnici, azioni «Conferma», ambito di salvataggio poco esplicito, guida obsoleta.
- Comportamento: errori persistenti accanto ai campi e valori conservati; verbi specifici; conseguenze e semestri coinvolti nelle cancellazioni; stato diario distinto da stato classi; applicare glossario e aggiornare guida.
- Completato quando: campi invalidi, assenza di rete, sessione scaduta e invito non valido indicano un passo utile senza messaggi tecnici grezzi; nessun errore è affidato soltanto a un toast; operazioni distruttive nominano oggetto e ambito; guida coerente con gli eventi condivisi disponibili.

### UX10 — Sincronizzazione semplice e invisibile

- Problema: eventuali differenze tra dispositivi non devono trasformarsi in una scelta tecnica per lo studente.
- Esperienza desiderata: iPagell sincronizza automaticamente i dati e mantiene in modo trasparente la versione più recente.
- Se qualcosa non può essere risolto automaticamente, mostrare un messaggio semplice come: «Abbiamo trovato modifiche più recenti su un altro dispositivo. Vuoi aggiornare i tuoi dati?»
- Evitare termini come conflitto, versione locale, backup, merge o ripristino.
- Obiettivo: lo studente deve percepire la sincronizzazione come qualcosa che funziona da sola, non come una funzione da gestire.

## Verifica proposta prima di considerare risolti i task

Con dati sintetici: nuovo diario senza materie; ingresso tramite invito; una sola materia con voti; più materie con pesi diversi; vecchia attività incompleta e verifica futura; attività condivisa modificata/annullata; assenza non giustificata; diario non aggiornato per rete o sessione; due versioni in conflitto.

Percorsi con studenti, senza anticipare i comandi: registra il primo voto; correggi la materia; trova cosa preparare per domani; aggiungi un'attività della classe e spiega chi vede il completamento; prova un obiettivo e controlla se ritieni di aver cambiato un'impostazione. Osservare esitazioni, errori e comprensione del beneficio. Non sono test già svolti.

Accessibilità da verificare al rilascio: tastiera, nomi accessibili, annuncio degli errori, focus dopo dialoghi, testo 200%, CTA raggiungibile con tastiera mobile, contrasto misurato, assenza di contenuti coperti dalla barra inferiore. Non dedurre conformità dagli screenshot.

## Copertura e limiti dell'analisi

- Anteprima locale autenticata «Studente demo»: Home, Voti, inserimento voto, Classi, adesione senza invio, creazione evento senza invio, Statistiche, Assenze, Impostazioni e nuova materia senza invio.
- Verificati direttamente i due passaggi che perdono Inglese e selezionano Matematica.
- Landing, registrazione, recupero, conflitti e casi senza dataset disponibile analizzati nel codice/documentazione; nessun nuovo account, permesso notifiche, errore remoto o cancellazione provocato.
- Secondo passaggio: layout desktop iniziale e layout stretto con larghezza DOM verificata di 569 px. Il tentativo di override a 390 px non ha modificato la larghezza effettiva; non è contato come nuova verifica a 390 px. La precedente analisi includeva una vista a 390 px. Nessuna prova su telefono fisico.
- La seconda apertura locale senza sessione tramite 127.0.0.1 non era raggiungibile; nessun logout della sessione esistente per forzare l'onboarding.
- Nessuna misura di conversione, nessun test con studenti e nessuna certificazione di accessibilità. I rischi comportamentali descritti sono ipotesi motivate da verificare.
