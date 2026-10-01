# Classi autogestite

[Indice](../README.md) · [Piano prodotto](PRODOTTO.md) · [Sicurezza](../SECURITY.md)

Aggiornamento: **1 ottobre 2026**. C1 (gruppi), C2 (eventi), C3 (agenda personale collegata), materie e appunti della classe sono implementati. Annunci, materiali e le estensioni C4/C5 restano pianificati. [Appunti correnti](APPUNTI-SPEC.md) e [matrice di verifica](VERIFICATION-MATRIX.md).

## Obiettivo

Una classe iPagell è un gruppo privato di studenti che si autogestisce. Serve a mantenere un'agenda comune, condividere appunti e permettere a ogni membro di riportare gli eventi utili nella propria agenda. Annunci e materiali sono sviluppi futuri. Non è un registro scolastico, non richiede la presenza di un docente e non rende pubblici voti, assenze, medie o note personali.

Principi:

- entra soltanto chi possiede un invito valido;
- nessun ruolo “docente”: i ruoli sono proprietario, moderatore e membro;
- tutti possono contribuire per impostazione predefinita;
- le azioni amministrative sono poche, comprensibili e revocabili;
- il diario personale e lo spazio condiviso rimangono due confini di dati distinti.

## Esperienza essenziale

1. Un utente crea una classe e ne diventa proprietario. Poi crea separatamente un invito per ottenere il codice e il link da condividere.
2. Condivide l'invito fuori da iPagell. Chi lo apre accede o crea un account e si unisce.
3. I membri pubblicano attività comuni. Ognuno può aggiungerle alla propria agenda.
4. Titolo, descrizione, materia e data dell'attività seguono gli aggiornamenti della classe. Avvisi e stato completato rimangono personali.
5. Se l'evento è annullato, importato o la persona lascia la classe, la copia non scompare: diventa annullata o non più sincronizzata.

La schermata separa Attività e Appunti della classe con un selettore. Membri e amministrazione sono sezioni secondarie; le bozze private precedono le note pubblicate. Il prodotto deve funzionare bene anche con una sola classe.

## Ruoli e permessi

| Azione | Proprietario | Moderatore | Membro |
|---|---:|---:|---:|
| Vedere contenuti e membri consentiti | sì | sì | sì |
| Creare eventi, materie e propri appunti | sì | sì | sì |
| Modificare/eliminare i propri contenuti | sì | sì | sì |
| Moderare contenuti altrui | sì | sì | no |
| Creare/revocare inviti e rimuovere membri | sì | sì | no |
| Nominare/revocare moderatori | sì | no | no |
| Cambiare impostazioni o eliminare la classe | sì | no | no |
| Trasferire la proprietà | sì | no | no |

Una modalità “contenuti approvati” è soltanto proposta e non è attivabile nel prodotto corrente. Non sono previste votazioni, gerarchie aggiuntive o verifica dei docenti.

Il proprietario deve trasferire la proprietà prima di uscire. Una rimozione invalida subito l'accesso. L'elenco membri è visibile ai membri della classe; l'impostazione `membersVisible` non viene attualmente applicata per nasconderlo. Username, email eventuali e credenziali non vengono mai mostrati: nella classe si usa un nome visualizzato modificabile.

## Inviti

Link e codice rappresentano lo stesso invito. L'invito è revocabile; scadenza e numero massimo di ingressi sono configurabili. Impostazione iniziale consigliata: scadenza dopo sette giorni, massimo 50 ingressi, adesione immediata senza coda di approvazione.

Il segreto deve essere casuale e non enumerabile; nel database si conserva soltanto il digest. Il codice digitabile usa un alfabeto senza caratteri ambigui e sufficiente entropia. Creazione e tentativi di utilizzo sono limitati per account, classe e indirizzo edge. Il link non deve finire in analytics, referrer verso terzi o log applicativi.

Il proprietario o un moderatore può:

- revocare un singolo invito senza interrompere gli altri;
- rimuovere un membro;

La revoca massiva o rotazione di tutti gli inviti non è implementata. Un membro rimosso può rientrare soltanto tramite un invito valido creato dopo la sua partenza.

## Agenda collegata

Gli eventi condivisi non vengono incorporati nel payload privato del diario. Una sottoscrizione collega l'utente all'evento e conserva soltanto i campi personali, per esempio completato e promemoria. L'interfaccia unisce agenda personale ed eventi sottoscritti.

Questo modello evita copie divergenti e rende esplicite le responsabilità:

- campi della classe: titolo, descrizione, tipo, materia condivisa, data, stato e revisione;
- campi personali: completamento, promemoria, preferenze di visualizzazione;
- cache offline: ultima versione visibile, origine e stato di sincronizzazione.

Se un evento cambia, la nuova revisione viene applicata automaticamente senza mostrare dettagli tecnici nell'interfaccia. Se viene annullato, resta visibile come annullato. Se l'accesso alla classe termina, l'ultima versione importata diventa una voce personale scollegata. L'utente può anche scegliere “Scollega dalla classe” in anticipo.

Le materie condivise sono etichette della classe, non riferimenti diretti alle materie private. Ogni persona può associare un'etichetta condivisa a una propria materia senza rivelare il proprio piano di studi.

## Modello dati implementato

Le tabelle sono separate da `diaries.payload`. Il riferimento completo è [db/schema.ts](../db/schema.ts); le migrazioni sono nell'[inventario](REPO-INVENTORY.md).

| Entità | Contenuto corrente |
|---|---|
| `classes`, `class_members` | Identità, proprietà, appartenenza, ruoli e nome visibile |
| `class_invites`, `class_departures` | Digest inviti, limiti/revoca e data di partenza per il rientro |
| `class_events` | Autore, etichetta `subject` testuale, tipo, titolo, descrizione, data/stato e revisione |
| `class_event_subscriptions` | Utente, riferimento evento, snapshot, semestre/materia privati, completamento, avviso, revisione e detach |
| `class_subjects` | Nome/chiave normalizzata, revisione e archiviazione; nessun colore nel modello corrente |
| `class_notes` | Classe/nome storico, autore/nome storico, materia, titolo/testo/formato, revisione, mutazione, quota e cancellazione |
| `class_note_pins` | Nota e utente: il pin non è comune alla classe |

Gli eventi conservano etichette compatibili con i client precedenti. Migrazione 0005 e trigger alimentano le materie normalizzate; gli appunti referenziano quelle della classe. Il limite di creazione è 60 nuove materie attive, con le etichette legacy seminate escluse dal conteggio. Rinomina/archiviazione/eliminazione non cancella il testo degli appunti.

I trigger preservano gli snapshot delle sottoscrizioni su uscita o cancellazione. Le note della classe cancellata conservano il testo per l'autore con `classId` staccato; dopo uscita l'autore può recuperare o ritirare solo le proprie note tramite l'archivio autore. Nessun accesso residuo alle note altrui.

`class_announcements`, `class_materials` e `class_activity` restano proposte: non ci sono tabelle/runtime relativi né una retention operativa di 90 giorni già attiva. File richiederebbero storage e gestione dedicati.

## Appunti e bozze

Un membro scrive una bozza privata sul dispositivo; **Controlla e condividi** apre l'anteprima e una seconda conferma pubblica online. Una riconnessione non pubblica automaticamente. La revisione base resta quella del testo aperto, anche se un refresh riceve una versione successiva.

Solo l'autore può modificare il testo condiviso; proprietario/moderatore possono ritirarlo. Copie personale↔classe hanno nuovi ID e richiedono una materia nel contesto di destinazione. Eliminare una bozza non ritira il testo già pubblicato. Il backup V3 include bozze e snapshot dei testi dell'autore, mai una copia indiscriminata dell'archivio altrui. [Contratto Appunti](APPUNTI-SPEC.md).

## Contratto API

Gli endpoint sono same-origin e autenticati con la sessione esistente. Il server ricava sempre l'identità dal cookie e verifica l'appartenenza alla classe per ogni oggetto.

Disponibili in C1:

```text
GET, POST       /api/classes
GET, PATCH      /api/classes/:classId
DELETE          /api/classes/:classId
GET, POST       /api/classes/:classId/invites
DELETE          /api/classes/:classId/invites/:inviteId
POST             /api/classes/join
GET, PATCH, DELETE /api/classes/:classId/members/:userId
```

Disponibili per C2/C3:

```text
GET, POST       /api/classes/:classId/events
PATCH, DELETE   /api/classes/:classId/events/:eventId
POST            /api/class-events/:eventId/subscription
GET             /api/class-agenda
PATCH, DELETE   /api/class-agenda/:subscriptionId
```

Disponibili per materie e appunti:

```text
GET, POST          /api/classes/:classId/subjects
PATCH, DELETE      /api/classes/:classId/subjects/:subjectId
GET, POST          /api/classes/:classId/notes
GET, PATCH, DELETE /api/classes/:classId/notes/:noteId
PUT, DELETE        /api/classes/:classId/notes/:noteId/pin
GET                /api/my-class-notes
DELETE             /api/my-class-notes/:noteId
```

Le route dei testi/pin/archivio richiedono contratto Appunti 2, anche in lettura; corpi, revisioni e formati in [API](API.md). Le liste note sono paginate, a differenza delle attuali liste eventi limitate a 500.

Gli ID sono opachi. Un ID valido non concede accesso. Gli aggiornamenti di eventi e campi personali richiedono una revisione attesa. Le scritture condivise verificano il permesso nella stessa query; le richieste C2/C3 verificano anche l'account atteso. Limiti: 500 eventi per classe, 500 sottoscrizioni per account. La paginazione completa rientra in C4.

### Integrazione attuale

- Home, calendario, elenco e riepilogo WebMCP includono gli eventi scelti dall'utente. Voti, assenze e statistiche non vengono condivisi.
- Gli appunti usano materie di classe normalizzate con archiviazione; gli eventi conservano etichette testuali compatibili. L'associazione alla materia del diario è privata.
- Completamento, avvisi e periodo personale hanno persistenza separata dal diario e sono accessibili solo al titolare. Gli avvisi funzionano ad app aperta, non sono notifiche push programmate.
- L'ultima agenda collegata è disponibile senza rete nella cache locale separata per account. Le modifiche condivise e delle sottoscrizioni richiedono connessione. La cache viene rimossa su logout o sessione non valida.
- Aggiornamenti attivi ogni 30 secondi, al ritorno nell'app e alla riconnessione; nessuna promessa di aggiornamento istantaneo.
- Trigger transazionali conservano le copie su uscita, rimozione, eliminazione evento o classe. Le copie scollegate sono modificabili dal solo titolare; un evento eliminato rimane annullato nella copia.
- Il backup esporta gli eventi scelti come copie personali senza collegamenti o identità dei compagni. Importare quel backup non ricrea appartenenze o inviti. Una copia già importata non viene duplicata dall'agenda collegata.
- Uscita/rimozione richiedono un invito emesso successivamente per rientrare.

## Sicurezza, privacy e abuso

- Voti, assenze, medie, obiettivi e note personali non hanno endpoint di classe.
- Controllo autorizzazioni centralizzato e testato per ogni coppia ruolo/azione; niente controlli affidati solo alla UI.
- Test obbligatori contro IDOR, escalation di ruolo, riutilizzo di inviti, enumeration e accesso dopo la rimozione.
- Testo trattato come testo; nessun HTML arbitrario. URL consentiti solo con protocolli sicuri e visualizzati con destinazione chiara.
- Limiti per creazione classe, inviti, join e contenuti; dimensioni massime e paginazione.
- Segnalazione e blocco leggero prima di introdurre directory pubbliche o chat. Le classi non sono ricercabili sul web.
- Cancellazione con conferma esplicita. Nessuna cancellazione silenziosa delle copie personali importate.

## Consegna incrementale

| Fase | Stato | Contenuto | Criterio di uscita |
|---|---|---|---|
| C0 — fondazioni | Completata | Migrazioni, autorizzazioni riusabili, feature flag e test ruoli | Nessuna rotta visibile; matrice permessi coperta dai test |
| C1 — gruppo | Completata | Creazione classe, membri, link/codice, revoca, uscita e trasferimento | Due account possono completare il ciclo senza accessi residui |
| C2 — agenda | Implementata | Etichette materia, eventi, aggiornamenti e annullamenti | Concorrenza e autorizzazioni verificate |
| C3 — personale | Implementata | Sottoscrizione, campi personali, scollegamento e cache offline | Snapshot conservato dopo uscita e cancellazione; lettura offline |
| Appunti e materie | Implementati | Editor condiviso, bozze private, conferma di pubblicazione, archivio autore e copie | Formato, permessi, conflitti e backup verificati localmente; QA su telefoni fisici aperta |
| C4 — cura | Pianificata | Attività minima, segnalazioni, liste grandi, accessibilità e notifiche in-app | Prova con più classi e dataset realistico |
| C5 — materiali | Pianificata | Annunci, link e poi file con storage/scansione | Politica dati e infrastruttura file approvate |

L'interruttore server permette di disattivare l'area Classi in caso di incidente. C1/C2/C3 sono implementate nel codice; l'attivazione del flag nell'ambiente Sites pubblicato non è verificabile dalla repository. Non ampliare la promozione prima di chiudere i P0 di affidabilità applicabili nella [roadmap](PRODOTTO.md). Ogni fase ha test API e UI, documentazione e rilascio separato.

### Avvio C0

- Responsabile iniziale: manutentore del progetto iPagell.
- Criterio d'accettazione: migrazione D1 ispezionata, matrice completa dei tre ruoli coperta da test automatici e nessuna rotta classi raggiungibile finché `IPAGELL_CLASSES` non vale esattamente `enabled`.
- Rollback: mantenere l'interruttore spento; prima che esistano dati reali, le tre nuove tabelle possono essere rimosse in ordine `class_invites`, `class_members`, `classes`. Dopo l'apertura C1 si useranno solo migrazioni in avanti e procedure di conservazione dati.

## Cose volutamente escluse dal primo rilascio

Chat, classi pubbliche, feed social, votazioni obbligatorie, ruoli scolastici ufficiali, condivisione dei voti, calendario bidirezionale esterno, file senza scansione e albero AI collaborativo. Potranno essere rivalutati soltanto dopo dati reali d'uso.
