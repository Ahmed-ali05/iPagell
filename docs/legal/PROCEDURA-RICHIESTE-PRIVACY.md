# iPagell — Procedura proposta per richieste sui dati

Versione documentale: **22 ottobre 2026**. Responsabile previsto: **Ahmed Ali**. Canale: **ipagell.service@gmail.com**. Documento interno da adottare e rendere operativo; non è una procedura già collaudata. Non contiene dati di richieste reali, comandi da eseguire o credenziali.

**Uso proporzionato:** il riferimento corrente è il [percorso minimo](ESSENZIALI-PRIVACY-2026-10-22.md). Le richieste possono essere gestite manualmente attraverso la casella esistente; non sono necessari per automatismo un portale, una nuova API, un sistema di ticket o una risposta personalizzata di Sites. I dettagli seguenti aiutano quando si presenta il caso concreto, mantenendo identificazione, riservatezza e termini pertinenti.

## Ambito e stato attuale

Il servizio usa account con nome utente e password e non associa attualmente un indirizzo email verificato a ogni account. La casella pubblica è quindi un canale di contatto, non una prova automatica di identità o titolarità dell’account. Il codice non comprende un flusso dedicato che colleghi una richiesta ricevuta via email a una conferma nell’account.

La risposta deve considerare dati dell’account, testi condivisi, informazioni riguardanti persone senza account e dati dei fornitori. Il backup esportato dall’utente è utile ma non coincide necessariamente con una risposta completa al diritto d’accesso. Informazioni, destinatari e tempi vanno verificati sul servizio effettivo.

## 1. Ricevere e classificare

Registrare un identificativo della pratica, data di ricezione, canale, oggetto della richiesta, persona incaricata e scadenza pertinente. Non richiedere una motivazione per il diritto d’accesso e non imporre un modello obbligatorio.

| Tipo di contatto | Prima azione |
|---|---|
| Domanda generale sul servizio o sulla privacy | Rispondere senza richiedere identificazione personale se non serve a fornire informazioni generali. |
| Accesso, correzione o cancellazione di dati dell’account | Individuare l’ambito della richiesta e una verifica proporzionata del richiedente prima di comunicare dati o apportare modifiche. |
| Dati su una persona inseriti da altri | Chiedere riferimenti minimi per individuare i dati. Non richiedere di iscriversi alla classe o creare un account per presentare la richiesta. |
| Richiesta di un rappresentante | Verificare identità, titolo e ambito della rappresentanza. La dichiarazione «sono il genitore/docente» non autorizza da sola la consegna dell’intero diario. |
| Segnalazione di esposizione, accesso abusivo o rischio urgente | Valutare subito contenimento e sicurezza attraverso il presidio incidenti da predisporre, conservando solo le evidenze necessarie. Non attendere la chiusura di una normale richiesta d’accesso per affrontare un’esposizione in corso. |

**Scadenze:** per il diritto d’accesso svizzero le informazioni sono in linea di principio gratuite entro 30 giorni. Eventuali limitazioni, differimenti o costi richiedono i presupposti e le comunicazioni pertinenti; non applicarli automaticamente. Per altre richieste verificare il termine del caso concreto. Chiedere chiarimenti non va trattato come un azzeramento automatico di ogni termine. Fonte: [IFPDT — diritto d’accesso](https://www.edoeb.admin.ch/it/diritto-daccesso).

## 2. Verificare l’identità senza chiedere credenziali

- Non chiedere di inviare password, codice di recupero, cookie o token di sessione via email, moduli di assistenza o issue GitHub.
- Il solo nome utente, una schermata o la conoscenza di alcuni voti non costituiscono una prova sufficiente per consegnare l’intero archivio. Un’email non precedentemente associata all’account non dimostra il suo controllo.
- Per richieste dell’utente autenticato, predisporre un metodo che colleghi la pratica a una conferma sul sito, con autenticazione adeguata all’operazione. Una possibile soluzione è una conferma monouso legata alla pratica e verificata dal server: è una proposta tecnica, non una funzione esistente.
- Se l’utente non può accedere, valutare elementi alternativi proporzionati e attendibili rispetto ai dati richiesti. Non chiedere sistematicamente un documento d’identità e non assumere che un documento identifichi un account pseudonimo.
- Le richieste su dati inseriti da terzi richiedono la verifica pertinente alla persona e al contenuto, non il possesso dell’account dell’autore. Limitare l’accesso alle sole informazioni che possono essere legittimamente comunicate.
- In caso di rappresentanza di un minorenne, valutare anche la posizione e i diritti del minore nel caso concreto; non presumere una consegna indiscriminata ai genitori.

Se mancano elementi sufficienti, spiegare quali informazioni o percorso sono necessari. Fornire intanto le informazioni generali comunicabili; l’incertezza non autorizza a ignorare il contatto. Una decisione che limita o differisce l’accesso va motivata secondo il diritto applicabile.

## 3. Individuare i dati pertinenti

Mappa basata sullo schema e sui repository del checkout. È una guida per una futura ricerca autorizzata e circoscritta, non un’autorizzazione a consultare tutti i dati degli utenti. Prima dell’uso verificare schema e release effettivi.

| Area | Dove cercare | Attenzione nella risposta |
|---|---|---|
| Identità account | `accounts`; eventuale archivio credenziali attivo secondo `auth_schema_state` | Restituire le informazioni pertinenti su identificativo, nome utente, creazione e stato. Non allegare un dump contenente hash di password/recupero o segreti; descrivere i dati di sicurezza e valutare separatamente eventuali limitazioni di accesso. |
| Sessioni e protezione dagli abusi | `sessions`, `auth_limits` | Distinguere dati associabili alla persona, contatori globali e chiavi hash. Non trasformare contatori hash in un’identificazione che il servizio non possiede; non consegnare token o dati di altre persone. |
| Diario | `diaries.payload` e revisione | Comprende dati scolastici e preferenze; verificare eventuali informazioni di terzi nei campi liberi. |
| Appunti personali | `personal_notes`, `personal_note_sequences` | Considerare anche metadati e marcatori di eliminazione, non solo le note visibili. Il backup V3 esclude le note remote eliminate. |
| Appartenenze e inviti | `classes`, `class_members`, `class_departures`, `class_invites` | Considerare proprietà, ruoli, nome visualizzato, date, inviti creati e metadati pertinenti. Non consegnare indiscriminatamente elenco completo dei compagni, loro dati o segreti d’invito. |
| Attività e copie nell’agenda | `class_events`, `class_event_subscriptions` | Considerare autoria, contenuti riguardanti la persona e snapshot indipendenti; il semplice filtro sul suo account non trova necessariamente testi scritti da altri che la riguardano. |
| Appunti di classe | `class_notes`, `class_subjects`, `class_note_pins` | Verificare contenuti, nomi storici e note ritirate o staccate dalla classe. Distinguere dati dell’autore e dati della persona citata. |
| Archivi sul dispositivo | IndexedDB del diario/appunti, bozze, metadati di sincronizzazione e archivi degli strumenti pubblici | Non sono tutti presenti sul server. Non chiedere per default un export completo del dispositivo; spiegare come individuare o esportare localmente ciò che serve. |
| Assistenza e infrastruttura | Email, eventuali allegati, log, statistiche e backup del provider | Includere nella verifica i dati effettivamente pertinenti e chiedere assistenza al fornitore quando necessaria; durata, Paesi e controlli restano da accertare. |

Le otto tabelle aggiunte da W8-A sono `auth_schema_state`, `account_credentials`, `account_identities`, `account_emails`, `auth_browser_epochs`, `auth_transactions`, `auth_challenges`, `auth_grants`. La loro presenza nello schema sorgente non prova che login Google/Apple o verifica email siano in uso. Consultare soltanto gli archivi effettivamente attivi e pertinenti; non attribuire agli utenti email o identità provider che il runtime non raccoglie. Lo stato locale W8-A non attesta la sua pubblicazione.

## 4. Preparare e controllare il riscontro

Per l’accesso, predisporre una risposta comprensibile con dati personali pertinenti, finalità, provenienza disponibile, destinatari, Paesi e garanzie, conservazione o relativi criteri e altre informazioni dovute. Distinguere accesso e diritto alla consegna/trasmissione dei dati: quest’ultimo ha propri presupposti.

Non limitarsi a inoltrare il backup del diario come se contenesse tutto. Non inviare un dump del database: può contenere credenziali, dati di compagni, appunti riservati e informazioni non pertinenti. Verificare destinatario e allegati, rimuovere dati di terzi non comunicabili e motivare eventuali omissioni quando richiesto.

Per una correzione, individuare il dato errato e la fonte; valutare propagazione in copie e contenuti condivisi. Per una cancellazione, distinguere almeno:

1. Rimozione del dato dal servizio corrente e gestione delle copie sotto il suo controllo.
2. Metadati o residui necessari, finalità e termine applicabile.
3. Copie indipendenti di altri utenti e richieste pertinenti a questi destinatari.
4. Copie offline ed esportazioni fuori dal controllo remoto del gestore.
5. Backup e impedimento del riutilizzo dei dati eliminati in caso di ripristino.

Il blocco della cancellazione ordinaria quando l’utente possiede una classe non è una risposta sufficiente a ogni richiesta privacy. Valutare trasferimento della classe, rimozione dei dati personali o altre soluzioni appropriate proteggendo i dati degli altri membri; predisporre un percorso del gestore se quello ordinario non basta. Non cancellare un’intera classe sulla sola email di una persona non verificata.

## 5. Consegnare e chiudere

Scegliere il canale in base al contenuto e all’identità verificata. Prima di spedire un archivio scolastico via email, valutare un canale protetto o una modalità di consegna adeguata; non pubblicare allegati su link aperti e non inviare nello stesso messaggio tutti gli elementi che proteggono un eventuale archivio cifrato.

Registrare data, ambito del riscontro, operazioni effettuate, limiti spiegati e seguito previsto. Rimuovere file temporanei e allegati superflui secondo una regola di conservazione da adottare. Il registro minimo delle pratiche deve rimanere fuori dal repository pubblico e accessibile soltanto a chi ne ha necessità.

Modello di registro **vuoto**:

| ID pratica | Ricevuta il | Tipo/ambito | Verifica identità o rappresentanza | Scadenza pertinente | Stato/incaricato | Riscontro/esito e data | Riesame conservazione |
|---|---|---|---|---|---|---|---|

## Modelli di risposta, non inviati

### Presa in carico senza confermare l’esistenza dell’account

> Ho ricevuto la tua richiesta relativa a iPagell e ne verifico l’ambito. Per proteggere le informazioni personali, prima di comunicare dati o modificare un account può essere necessario verificare che la richiesta provenga dalla persona autorizzata. Non inviare password, codice di recupero o cookie. Se servono chiarimenti o una verifica, ti indicherò un percorso adeguato.

### Richiesta relativa a un contenuto inserito da altri

> Per individuare il contenuto, indica il riferimento o il contesto minimo che conosci e quale informazione ti riguarda. Puoi presentare la richiesta anche senza appartenere alla classe. Evita di inviare dati o appunti degli altri membri che non servono a capire la segnalazione.

Non inviare il primo modello come sostituto del riscontro dovuto entro il termine. Non indicare un inesistente link di verifica e non dichiarare completata una cancellazione finché non è stato verificato ciò che è effettivamente rimosso e ciò che resta.

## Criteri per dichiarare operativa la procedura

- [ ] Casella controllata, ricezione verificata, accessi protetti e incaricato definito.
- [ ] Modalità sicura di collegamento fra pratica e account, o percorso alternativo adeguato; nessuna richiesta di credenziali in assistenza.
- [ ] Strumenti e autorizzazioni per reperire dati, proteggere quelli dei terzi e compiere gli interventi necessari; assenza di un pannello dedicato non sostituita con promesse di operazioni ineseguibili.
- [ ] Informazioni attendibili su dati, Paesi, log, backup, conservazione e assistenza per i diritti, ricavate anzitutto da documentazione pubblica, DPA e impostazioni disponibili. Una risposta personalizzata del provider non è un requisito autonomo.
- [ ] Conservazione di pratiche, allegati ed evidenze definita, compresa la gestione dei dati già eliminati dopo ripristino.
- [ ] Verifica mirata del percorso adottato con dati sintetici. I casi particolari descritti nel documento vanno affrontati quando pertinenti; non richiedono ciascuno una nuova funzione. Nessuna prova applicativa è stata eseguita in questo task documentale.

Fonti: [IFPDT — accesso](https://www.edoeb.admin.ch/it/diritto-daccesso), [IFPDT — informazioni da fornire](https://www.edoeb.admin.ch/it/obbligo-di-informare). Evidenze: [schema](../../db/schema.ts), [API account](../../app/api/account/route.ts), [cancellazione](../../app/api/auth/security/route.ts), [repository auth](../../lib/server/auth-repository.ts), [note](../../lib/server/note-repository.ts), [classi](../../lib/server/class-repository.ts), [backup](../../lib/notes/backup.ts), [storage appunti](../../lib/notes/storage.ts), [compatibilità W8-A](../improvement-2026-10-01/AUTH-COMPATIBILITY-W8A.md).
