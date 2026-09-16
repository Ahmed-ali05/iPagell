# Classi autogestite

[Indice](../README.md) · [Piano prodotto](PRODOTTO.md) · [Sicurezza](../SECURITY.md)

Specifica di prodotto e tecnica. C1 (gruppi), C2 (eventi) e C3 (agenda personale collegata) sono implementati. Annunci, materiali e le estensioni C4/C5 restano pianificati.

## Obiettivo

Una classe iPagell è un gruppo privato di studenti che si autogestisce. Serve a mantenere un'agenda comune, distribuire annunci e materiali e permettere a ogni membro di riportare gli eventi utili nella propria agenda. Non è un registro scolastico, non richiede la presenza di un docente e non rende pubblici voti, assenze, medie o note personali.

Principi:

- entra soltanto chi possiede un invito valido;
- nessun ruolo “docente”: i ruoli sono proprietario, moderatore e membro;
- tutti possono contribuire per impostazione predefinita;
- le azioni amministrative sono poche, comprensibili e revocabili;
- il diario personale e lo spazio condiviso rimangono due confini di dati distinti.

## Esperienza essenziale

1. Un utente crea una classe, ne diventa proprietario e riceve un codice e un link.
2. Condivide l'invito fuori da iPagell. Chi lo apre accede o crea un account e si unisce.
3. I membri pubblicano eventi comuni. Ognuno può aggiungerli alla propria agenda.
4. Titolo, descrizione, materia e data dell'evento seguono gli aggiornamenti della classe. Promemoria e stato completato rimangono personali.
5. Se l'evento è annullato, importato o la persona lascia la classe, la copia non scompare: diventa annullata o non più sincronizzata.

La schermata della classe privilegia “Prossimi eventi”, non chat e funzioni social. Annunci e materiali sono sezioni secondarie. Il prodotto deve funzionare bene anche con una sola classe.

## Ruoli e permessi

| Azione | Proprietario | Moderatore | Membro |
|---|---:|---:|---:|
| Vedere contenuti e membri consentiti | sì | sì | sì |
| Creare eventi, annunci e materiali | sì | sì | sì |
| Modificare/eliminare i propri contenuti | sì | sì | sì |
| Moderare contenuti altrui | sì | sì | no |
| Creare/revocare inviti e rimuovere membri | sì | sì | no |
| Nominare/revocare moderatori | sì | no | no |
| Cambiare impostazioni o eliminare la classe | sì | no | no |
| Trasferire la proprietà | sì | no | no |

Il proprietario può attivare la modalità opzionale “contenuti approvati”; non fa parte del primo MVP. Non sono previste votazioni, gerarchie aggiuntive o verifica dei docenti.

Il proprietario deve trasferire la proprietà prima di uscire. Una rimozione invalida subito l'accesso. L'elenco membri è visibile solo alla classe; il proprietario può nasconderlo ai membri ordinari. Username, email eventuali e credenziali non vengono mai mostrati: nella classe si usa un nome visualizzato modificabile.

## Inviti

Link e codice rappresentano lo stesso invito. L'invito è revocabile; scadenza e numero massimo di ingressi sono configurabili. Impostazione iniziale consigliata: scadenza dopo sette giorni, massimo 50 ingressi, adesione immediata senza coda di approvazione.

Il segreto deve essere casuale e non enumerabile; nel database si conserva soltanto il digest. Il codice digitabile usa un alfabeto senza caratteri ambigui e sufficiente entropia. Creazione e tentativi di utilizzo sono limitati per account, classe e indirizzo edge. Il link non deve finire in analytics, referrer verso terzi o log applicativi.

Il proprietario o un moderatore può:

- revocare un singolo invito senza interrompere gli altri;
- rimuovere un membro;
- ruotare tutti gli inviti in caso di condivisione indesiderata.

Possedere un vecchio link non permette di rientrare dopo la revoca. Un membro rimosso può rientrare soltanto tramite un nuovo invito valido.

## Agenda collegata

Gli eventi condivisi non vengono incorporati nel payload privato del diario. Una sottoscrizione collega l'utente all'evento e conserva soltanto i campi personali, per esempio completato e promemoria. L'interfaccia unisce agenda personale ed eventi sottoscritti.

Questo modello evita copie divergenti e rende esplicite le responsabilità:

- campi della classe: titolo, descrizione, tipo, materia condivisa, data, stato e revisione;
- campi personali: completamento, promemoria, preferenze di visualizzazione;
- cache offline: ultima versione visibile, origine e stato di sincronizzazione.

Se un evento cambia, la nuova revisione appare automaticamente. Se viene annullato, resta visibile come annullato. Se l'accesso alla classe termina, l'ultima versione importata diventa una voce personale scollegata. L'utente può anche scegliere “Rendi personale” in anticipo.

Le materie condivise sono etichette della classe, non riferimenti diretti alle materie private. Ogni persona può associare un'etichetta condivisa a una propria materia senza rivelare il proprio piano di studi.

## Modello dati proposto

Le tabelle sono nuove e normalizzate; non vanno inserite dentro `diaries.payload`.

| Entità | Campi principali | Note |
|---|---|---|
| `classes` | id, nome, descrizione, owner_id, impostazioni, created_at | Gruppo privato; nome non globalmente univoco |
| `class_members` | class_id, user_id, ruolo, display_name, joined_at | Chiave composta; un solo proprietario |
| `class_invites` | id, class_id, secret_hash, created_by, expires_at, max_uses, uses, revoked_at | Mai conservare il segreto in chiaro |
| `class_subjects` | id, class_id, nome, colore, archived_at | Tassonomia condivisa minimale |
| `class_events` | id, class_id, author_id, subject_id, tipo, titolo, descrizione, due_at, status, revision, timestamps | Modifica con controllo revisione |
| `class_event_subscriptions` | user_id, event_id, completed, reminder_at, cached_snapshot, detached_at | Campi personali e continuità dopo l'uscita |
| `class_announcements` | id, class_id, author_id, testo, timestamps | Fase successiva all'agenda |
| `class_materials` | id, class_id, author_id, tipo, titolo, url/storage_key, timestamps | I file richiedono storage e scansione dedicati |
| `class_activity` | id, class_id, actor_id, action, target_id, created_at | Traccia minimale delle azioni amministrative |

Le foreign key eliminano le dipendenze interne quando una classe viene cancellata. Prima di rimuovere accesso o classe, le sottoscrizioni dell'utente vengono rese autonome usando lo snapshot già memorizzato. L'attività amministrativa non contiene il testo dei contenuti e viene conservata al massimo 90 giorni.

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

Gli ID sono opachi. Un ID valido non concede accesso. Gli aggiornamenti di eventi e campi personali richiedono una revisione attesa. Le scritture condivise verificano il permesso nella stessa query; le richieste C2/C3 verificano anche l'account atteso. Limiti: 500 eventi per classe, 500 sottoscrizioni per account. La paginazione completa rientra in C4.

### Integrazione attuale

- Home, calendario, elenco e riepilogo WebMCP includono gli eventi scelti dall'utente. Voti, assenze e statistiche non vengono condivisi.
- Le materie di classe sono etichette suggerite dagli eventi esistenti; non esiste ancora una tassonomia con archiviazione. L'associazione alla materia del diario è privata.
- Completamento, promemoria e periodo personale hanno persistenza separata dal diario e sono accessibili solo al titolare. I promemoria funzionano ad app aperta, non sono notifiche push programmate.
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
| C4 — cura | Pianificata | Attività minima, segnalazioni, liste grandi, accessibilità e notifiche in-app | Prova con più classi e dataset realistico |
| C5 — materiali | Pianificata | Annunci, link e poi file con storage/scansione | Politica dati e infrastruttura file approvate |

L'interruttore server permette di disattivare l'area Classi in caso di incidente. C1 è pubblicata come prima versione controllata; non ampliarne la promozione prima di chiudere i P0 di affidabilità applicabili nella [roadmap](PRODOTTO.md). Ogni fase ha test API e UI, documentazione e rilascio separato.

### Avvio C0

- Responsabile iniziale: manutentore del progetto iPagell.
- Criterio d'accettazione: migrazione D1 ispezionata, matrice completa dei tre ruoli coperta da test automatici e nessuna rotta classi raggiungibile finché `IPAGELL_CLASSES` non vale esattamente `enabled`.
- Rollback: mantenere l'interruttore spento; prima che esistano dati reali, le tre nuove tabelle possono essere rimosse in ordine `class_invites`, `class_members`, `classes`. Dopo l'apertura C1 si useranno solo migrazioni in avanti e procedure di conservazione dati.

## Cose volutamente escluse dal primo rilascio

Chat, classi pubbliche, feed social, votazioni obbligatorie, ruoli scolastici ufficiali, condivisione dei voti, calendario bidirezionale esterno, file senza scansione e albero AI collaborativo. Potranno essere rivalutati soltanto dopo dati reali d'uso.
