# Guida utente

[Indice della documentazione](../README.md)

## Primo accesso

1. Apri [iPagell](https://ipagell.website) e scegli **Crea il tuo diario**. Se hai già un account, scegli **Accedi**.
2. Scegli un nome utente di 3–32 caratteri: lettere, numeri, punto, trattino o underscore; il primo carattere deve essere una lettera o un numero. Maiuscole e minuscole non distinguono account diversi.
3. Usa una password unica di 12–128 caratteri. Puoi usare il gestore password del dispositivo.
4. Conserva il codice di recupero mostrato dopo la registrazione. È una chiave d’accesso: non inviarlo a nessuno e non inserirlo nelle segnalazioni di problemi.
5. Indica il nome da mostrare e scegli se partire senza materie o con le materie di base personalizzabili. **Personalizza semestre e date** apre i valori già compilati; la scuola resta facoltativa. Puoi cambiare queste impostazioni anche dopo.

La registrazione mostra tre passi: Account, Recupero e Diario. **Mostra password** permette di controllare quello che hai scritto; non cambia né salva la password. Prima di registrarti puoi anche provare il calcolo pubblico della media dalla landing.

Non viene richiesta un’email. Non esiste recupero via email. Nome utente, password e codice di recupero non sono intercambiabili.

## Installare su iPhone

Da Safari apri il sito, usa **Condividi → Aggiungi alla schermata Home** e apri la nuova icona online. Accedi e verifica il tuo diario anche dalla versione installata: non presumere che una sessione aperta in un altro browser sia condivisa.

La prima apertura online serve a preparare la copia offline. L’installazione su iPhone fisico è ancora da verificare sistematicamente: se il menu differisce, usa l’app da Safari e segnala modello/versione iOS, senza dati personali.

## Uso quotidiano

| Sezione | Cosa fare |
|---|---|
| Home | Controllare attività aperte, media e avvisi; una scadenza passata resta da completare |
| Agenda | Creare compiti/verifiche, consultare mese o elenco, selezionare un giorno e segnare attività svolte |
| Voti | Registrare risultati, selezionare materia e simulare il voto necessario |
| Assenze | Registrare data, ore e tipo di assenza; impostare una soglia personale |
| Statistiche | Confrontare materie, andamento e periodi presenti |
| Classi | Consultare attività e appunti condivisi; creare o raggiungere un gruppo privato |
| Impostazioni | Gestire materie e semestri, tema, movimento, backup e account |

Il periodo del diario resta il contesto di Home, Agenda, Assenze e della registrazione dei nuovi dati. Voti e Statistiche hanno un filtro di consultazione condiviso **Periodo / Anno scolastico / Tutto lo storico**, inizialmente sull’anno del periodo corrente. Le materie sono condivise fra periodi: non occorre ricrearle. Anni con etichette diverse restano separati; le etichette si possono correggere nelle impostazioni. I periodi archiviati restano consultabili e non sono immutabili.

Il nuovo voto mostra **Registra nel periodo**: puoi scegliere un periodo reale senza cambiare quello del diario. La data non riassegna il voto. Il filtro e la materia restano selezionati tornando dalle statistiche o annullando il form; il filtro è stato di questa sessione, non una preferenza sincronizzata. Il registro mostra provenienza e medie per periodo; la media annuale usa tutti i singoli voti con i loro pesi, non la media delle medie dei periodi. L’andamento è la media generale cumulativa dei risultati visualizzati; il simulatore usa lo stesso ambito ed è disponibile in Periodo/Anno, non nello storico multiennale.

### Come leggere le medie

La sufficienza è 4 su 6. Puoi scrivere `4.5`, `4,5` oppure `4-5`.

Ogni voto pesa **peso del voto × peso del tipo di prova**. Esempio: uno scritto da 4 con peso effettivo 2 e un orale da 6 con peso 1 danno `(4×2 + 6×1) / 3 = 4,67`. La media generale considera anche il peso di ogni materia; le materie senza voti non contribuiscono.

Le cifre visualizzate possono essere arrotondate; non sono un voto ufficiale di pagella. Cambiare pesi o coefficienti ricalcola anche i periodi passati. Non sono implementate medie separate teoria/pratica a percentuale fissa.

Nel simulatore scegli obiettivo, tipo e peso della prossima prova. Il risultato è arrotondato al mezzo voto superiore. Se una sola prova con quel peso non basta, il simulatore lo indica esplicitamente.

### Assenze e avvisi

Registra la durata in ore; una voce senza materia può rappresentare più lezioni, non necessariamente una giornata intera. La soglia è personale e non certifica i limiti della tua scuola. Ritardi e uscite sono conteggiati in base alle ore inserite.

Gli avvisi attuali funzionano ad app aperta, previo consenso. Non sono una sveglia affidabile ad app chiusa: per scadenze importanti usa anche il calendario del dispositivo.

## Classi private

Apri **Classi** e scegli **Nuova classe** per creare un gruppo. Diventi proprietario e puoi generare un link o un codice con scadenza e numero massimo di ingressi. Chi riceve il link accede al proprio account iPagell e sceglie il nome da mostrare nella classe.

Il proprietario può nominare o revocare moderatori, rimuovere membri, modificare la classe, trasferire la proprietà ed eliminarla. I moderatori possono creare o revocare inviti e rimuovere membri ordinari. Un membro può cambiare il proprio nome visibile o uscire. Il proprietario deve prima trasferire la proprietà oppure eliminare la classe.

Voti, assenze, medie, preferenze e completamento personale non vengono mostrati alla classe. I membri possono condividere compiti e verifiche; ciascuno sceglie quali aggiungere alla propria agenda. Titolo e data delle attività collegate seguono gli aggiornamenti della classe, mentre completamento, materia personale e avvisi restano privati. **Scollega dalla classe** conserva l’attività nell’agenda ma interrompe gli aggiornamenti.

## Appunti personali e di classe

In Home puoi riprendere gli appunti recenti oppure scegliere **Tutti gli appunti** e **Nuovo appunto**. **Appunti di {materia}** nella prossima scadenza, nell’Agenda e in Voti apre l’elenco personale filtrato. **Torna a…** riporta al contesto di partenza; nell’Agenda restano calendario/elenco e filtri scelti durante la sessione.

I tuoi appunti sono privati e indipendenti dal semestre. Puoi iniziare a scrivere prima di scegliere la materia e aggiungerla dall’editor senza perdere il testo. Titolo e materia servono per sincronizzare nell’account; **Salvato sul dispositivo** conferma solo la copia locale. Gli appunti personali già disponibili sul dispositivo restano utilizzabili senza rete.

Dentro una classe scegli **Appunti della classe → Scrivi un appunto**. Le materie di classe sono separate da quelle del diario: puoi aggiungerne una direttamente nell’editor. **Salva bozza e chiudi** mantiene il testo privato sul dispositivo; lo ritrovi in **Le tue bozze**. **Controlla e condividi** apre un’anteprima: solo confermando **Pubblica nella classe** il testo diventa visibile ai membri. Per leggere o condividere in classe serve la connessione.

Le copie fra spazio personale e classe sono indipendenti. Da un appunto personale scegli la classe e **Prepara una copia in…**, poi la materia della classe e la conferma di condivisione. **Ritira dalla classe** rimuove il testo condiviso; eliminare una bozza privata non ritira un appunto già condiviso. Copie, gestione materie e **Bozze e classi passate** si aprono solo quando ti servono.

La barra dell'editor offre **Grassetto**, **Titolo di sezione**, elenchi puntati o numerati e **Annulla/Ripeti**. Seleziona il testo o posiziona il cursore nel blocco da cambiare; non occorre scrivere Markdown. Il limite include i marcatori del formato: una formattazione può raggiungerlo anche se il testo visibile sembra più corto. Il comando viene rifiutato conservando il testo.

Dal lettore scegli **Esporta PDF**, poi **Salva PDF**, **Apri PDF** o **Condividi** se il dispositivo lo consente. **Altri formati** offre Markdown e copia del testo; per note semplici anche `.txt`. Il PDF è una copia leggibile della nota; il backup JSON serve a ripristinare i dati nell'app.

Se compare **Salvataggio non riuscito**, il testo ancora aperto permette **Riprova**, **Copia testo** e download di recupero. Conservalo prima di chiudere o aggiornare l'app. Un conflitto vero richiede di confrontare le copie; la riconnessione non deve pubblicare da sola una bozza di classe.

## Salvataggio, offline e conflitti

- **Diario personale salvato:** il server ha confermato la copia del diario. Un backup indipendente resta utile.
- **Copia sul dispositivo / offline:** ci sono dati disponibili localmente; non è una conferma di sincronizzazione.
- **Sincronizzazione non riuscita:** controlla connessione e messaggio; esporta prima di fare tentativi distruttivi.
- **Accedi di nuovo:** rientra nello stesso account. Le modifiche in attesa non vanno attribuite a un altro utente.
- **Modifiche da confrontare:** un altro dispositivo ha aggiornato il diario. Non esiste fusione automatica.

Per un conflitto: esporta la copia locale; carica la copia account solo dopo aver salvato il backup; confronta i dati e reinserisci le differenze necessarie. Importare un backup intero sostituisce il diario: non unisce le due versioni. Evita modifiche contemporanee in più schede.

Offline puoi usare la copia dell’ultimo account attivo, se già presente. Primo accesso, registrazione, recupero, sincronizzazione e logout server richiedono rete. La copia locale non è protetta dalla password iPagell: usa il blocco schermo e non lasciare aperto il diario su un dispositivo condiviso.

## Backup e vecchi dati

In **Impostazioni → Preferenze**, scegli **Esporta**. Il backup V3 contiene diario e preferenze, appunti personali, bozze e conflitti, bozze di classe e copie delle note condivise scritte da te. Le attività collegate diventano copie personali. Non include password, sessione, codice di recupero o inviti. Non pubblicarlo: non è cifrato. Se l'archivio remoto non è completamente leggibile, l'app chiede conferma per esportare una copia limitata al dispositivo.

Prima di **Importa**, esporta la situazione corrente e controlla account e file. L'app valida il contenuto e richiede conferma: sostituisce diario e preferenze, mentre aggiunge copie degli appunti con nuovi identificativi. Le note di classe importate diventano personali e possono richiedere una materia; non vengono pubblicate nella classe. Un'importazione interrotta può essere ripresa. I vecchi backup V1 riguardano solo il diario e mantengono gli appunti già presenti; V2 conserva i testi semplici, V3 anche il formato. Limite file: 24 MiB per V2/V3, 1.500.000 byte per V1. Restano i limiti del diario e delle note: un file valido può superare lo spazio disponibile nell'account. Per tornare indietro serve il backup precedente; non esiste un cestino.

**Recupera vecchio diario** cerca la versione precedente nello stesso browser e sullo stesso sito. Non recupera dati già cancellati né quelli di un altro dispositivo. Esporta il vecchio archivio, controllalo e importalo esplicitamente: non viene associato automaticamente al nuovo account.

Non cancellare dati del sito o disinstallare l’app per risolvere un errore prima di aver esportato le modifiche non sincronizzate.

## Password e uscita

**Password dimenticata?** richiede nome utente e codice di recupero. Dopo il ripristino conserva il nuovo codice: il precedente non funziona più. Le vecchie sessioni vengono invalidate. Senza password e codice non è disponibile un recupero assistito.

In **Impostazioni → Preferenze → Sicurezza e gestione account** puoi cambiare password o eliminare l’account, confermando la password attuale. Il cambio password mantiene valido il codice di recupero e chiude le sessioni.

L'uscita rimuove la copia attiva del diario su quel browser. Se ci sono note o bozze pendenti, l'app lo segnala e offre l'uscita conservandole sul dispositivo per lo stesso account; esportale prima, soprattutto su un dispositivo condiviso. Non vengono rimosse le esportazioni scaricate o necessariamente ogni archivio storico. L'eliminazione dell'account cancella i dati correnti dal database applicativo, ma non può cancellare file esportati o copie offline su altri dispositivi.

## Segnalare un problema

Descrivi cosa volevi fare, i passaggi, il risultato atteso e quello ottenuto. Aggiungi versione browser/iOS, uso da Safari o icona Home e stato di sincronizzazione. Oscura nomi, voti e identificativi negli screenshot. Non allegare password, codici, cookie o backup completi. I problemi di sicurezza vanno comunicati privatamente: [Sicurezza](../SECURITY.md).
