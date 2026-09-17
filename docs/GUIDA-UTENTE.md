# Guida utente

[Indice della documentazione](../README.md)

## Primo accesso

1. Apri [iPagell](https://ipagell.website) e scegli **Crea un account**.
2. Scegli un nome utente di 3–32 caratteri: lettere, numeri, punto, trattino o underscore; il primo carattere deve essere una lettera o un numero. Maiuscole e minuscole non distinguono account diversi.
3. Usa una password unica di 15–128 caratteri. Puoi usare il gestore password del dispositivo.
4. Conserva il codice di recupero mostrato dopo la registrazione. È una chiave d’accesso: non inviarlo a nessuno e non inserirlo nelle segnalazioni di problemi.
5. Indica il nome da mostrare, scuola facoltativa, anno e date del semestre. Parti senza materie oppure scegli le materie di base personalizzabili.

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
| Assenze | Registrare data, ore e tipologia; impostare una soglia personale |
| Statistiche | Confrontare materie, andamento e periodi presenti |
| Classi | Creare o raggiungere un gruppo privato, gestire membri e inviti |
| Impostazioni | Gestire materie e semestri, tema, movimento, backup e account |

Il selettore del periodo cambia i voti, le attività e le assenze visualizzati. Le materie sono condivise tra i periodi dello stesso diario. Archiviare un semestre non lo rende immutabile.

### Come leggere le medie

La sufficienza è 4 su 6. Puoi scrivere `4.5`, `4,5` oppure `4-5`.

Ogni voto pesa **peso del voto × peso della tipologia**. Esempio: uno scritto da 4 con peso effettivo 2 e un orale da 6 con peso 1 danno `(4×2 + 6×1) / 3 = 4,67`. La media generale considera anche il coefficiente di ogni materia; le materie senza voti non contribuiscono.

Le cifre visualizzate possono essere arrotondate; non sono un voto ufficiale di pagella. Cambiare pesi o coefficienti ricalcola anche i periodi passati. Non sono implementate medie separate teoria/pratica a percentuale fissa.

Nel simulatore scegli obiettivo, tipologia e peso della prossima prova. Il risultato è arrotondato al mezzo voto superiore. `> 6.0` significa che una sola prova con quel peso non basta. Lo “scenario senza nuovi voti” è la media attuale, non una previsione.

### Assenze e promemoria

Registra la durata in ore; una voce senza materia può rappresentare più lezioni, non necessariamente una giornata intera. La soglia è personale e non certifica i limiti della tua scuola. Ritardi e uscite sono conteggiati in base alle ore inserite.

I promemoria attuali sono avvisi ad app aperta, previo consenso. Non sono una sveglia affidabile ad app chiusa: per scadenze importanti usa anche il calendario del dispositivo.

## Classi private

Apri **Classi** e scegli **Nuova classe** per creare un gruppo. Diventi proprietario e puoi generare un link o un codice con scadenza e numero massimo di ingressi. Chi riceve il link accede al proprio account iPagell e sceglie il nome da mostrare nella classe.

Il proprietario può nominare o revocare moderatori, rimuovere membri, modificare la classe, trasferire la proprietà ed eliminarla. I moderatori possono creare o revocare inviti e rimuovere membri ordinari. Un membro può cambiare il proprio nome visibile o uscire. Il proprietario deve prima trasferire la proprietà oppure eliminare la classe.

Voti, assenze, medie, preferenze e diario personale non vengono mostrati alla classe. La prima versione condivisa gestisce gruppo e accessi; eventi e agenda condivisa arriveranno nella fase C2.

## Salvataggio, offline e conflitti

- **Salvato nell’account:** il server ha confermato la copia. Un backup indipendente resta utile.
- **Copia sul dispositivo / offline:** ci sono dati disponibili localmente; non è una conferma di sincronizzazione.
- **Sincronizzazione non riuscita:** controlla connessione e messaggio; esporta prima di fare tentativi distruttivi.
- **Accedi di nuovo:** rientra nello stesso account. Le modifiche in attesa non vanno attribuite a un altro utente.
- **Modifiche da confrontare:** un altro dispositivo ha aggiornato il diario. Non esiste fusione automatica.

Per un conflitto: esporta la copia locale; carica la copia account solo dopo aver salvato il backup; confronta i dati e reinserisci le differenze necessarie. Importare un backup intero sostituisce il diario: non unisce le due versioni. Evita modifiche contemporanee in più schede.

Offline puoi usare la copia dell’ultimo account attivo, se già presente. Primo accesso, registrazione, recupero, sincronizzazione e logout server richiedono rete. La copia locale non è protetta dalla password iPagell: usa il blocco schermo e non lasciare aperto il diario su un dispositivo condiviso.

## Backup e vecchi dati

In **Impostazioni → Preferenze**, scegli **Esporta**. Il JSON contiene dati scolastici e preferenze, non password, sessione o codice di recupero. Non pubblicarlo: non è cifrato.

Prima di **Importa**, esporta la situazione corrente e controlla account e file. L’app valida il contenuto e richiede conferma della sostituzione. Limite del file: 1.500.000 byte. Per tornare indietro serve il backup precedente; non esiste un cestino.

**Recupera vecchio diario** cerca la versione precedente nello stesso browser e sullo stesso sito. Non recupera dati già cancellati né quelli di un altro dispositivo. Esporta il vecchio archivio, controllalo e importalo esplicitamente: non viene associato automaticamente al nuovo account.

Non cancellare dati del sito o disinstallare l’app per risolvere un errore prima di aver esportato le modifiche non sincronizzate.

## Password e uscita

**Password dimenticata?** richiede nome utente e codice di recupero. Dopo il ripristino conserva il nuovo codice: il precedente non funziona più. Le vecchie sessioni vengono invalidate. Senza password e codice non è disponibile un recupero assistito.

In **Impostazioni → Preferenze → Sicurezza e gestione account** puoi cambiare password o eliminare l’account, confermando la password attuale. Il cambio password mantiene valido il codice di recupero e chiude le sessioni.

**Esci e rimuovi la copia locale** rimuove la copia attiva su quel browser, non i backup scaricati o ogni archivio storico del dispositivo. Esporta prima le modifiche in attesa: confermando l’uscita puoi perderle. L’eliminazione dell’account cancella il diario dal database applicativo, ma non può cancellare file esportati o copie offline su altri dispositivi.

## Segnalare un problema

Descrivi cosa volevi fare, i passaggi, il risultato atteso e quello ottenuto. Aggiungi versione browser/iOS, uso da Safari o icona Home e stato di sincronizzazione. Oscura nomi, voti e identificativi negli screenshot. Non allegare password, codici, cookie o backup completi. I problemi di sicurezza vanno comunicati privatamente: [Sicurezza](../SECURITY.md).
