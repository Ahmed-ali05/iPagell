# Contratto API interno

[Indice](../README.md) · [Architettura](ARCHITETTURA.md)

Endpoint same-origin destinati al client iPagell, non un’API pubblica stabile per terze parti. JSON; cookie inviati con `credentials: "same-origin"`. Non inviare password o token negli URL.

Ogni mutazione richiede `Origin` uguale all’origine della richiesta e `Content-Type: application/json`; `Sec-Fetch-Site: cross-site` viene rifiutato. La produzione richiede HTTPS. Gli header di identità ChatGPT non autenticano l’utente.

## Endpoint

| Metodo e percorso | Corpo richiesto | Esito normale |
|---|---|---|
| `POST /api/auth/register` | `username`, `password` | 201: `user`, `recoveryCode`; cookie sessione |
| `POST /api/auth/login` | `username`, `password` | 200: `user`; nuovo cookie |
| `POST /api/auth/logout` | `{}` | 200: `ok: true`; revoca sessione corrente, scadenza cookie |
| `POST /api/auth/recover` | `username`, `recoveryCode`, `password` nuova | 200: nuovo `recoveryCode`; vecchie sessioni invalidate, login da rifare |
| `POST /api/auth/security` | Vedi sotto; sessione richiesta | 200: `ok: true`; cookie scaduto |
| `GET /api/account` | Nessuno; sessione richiesta | 200: `user`, `diary` oppure `null` |
| `POST /api/account` | Profilo iniziale; sessione richiesta | 201: `user`, `diary` con revisione 1 |
| `PUT /api/diary` | Snapshot e revisione; sessione richiesta | 200: `revision` incrementata |
| `GET, POST /api/classes` | GET senza corpo; POST con nome, descrizione e nome visibile | Elenco classi oppure 201: classe creata |
| `GET, PATCH, DELETE /api/classes/:classId` | PATCH con nome e descrizione; DELETE con `{}` | Dettaglio, modifica o eliminazione della classe |
| `POST /api/classes/join` | `code`, `displayName` | 201: ingresso nella classe |
| `GET, POST /api/classes/:classId/invites` | POST con `expiresInDays`, `maxUses` | Metadati inviti oppure 201 con codice mostrato una volta |
| `DELETE /api/classes/:classId/invites/:inviteId` | `{}` | Revoca immediata dell’invito |
| `GET, PATCH, DELETE /api/classes/:classId/members/:userId` | PATCH con operazione nome, ruolo o trasferimento | Lettura, modifica ruolo/nome, uscita o rimozione |

`user = { id, username }`. Registrazione account e creazione diario sono due passaggi distinti: dopo la prima, `GET /api/account` può restituire `diary: null`. Un username duplicato restituisce 409; non esiste idempotency key per registrazione o recupero.

### Profilo iniziale

```json
{
  "name": "Studente di esempio",
  "school": "",
  "semester": "Semestre 1",
  "schoolYear": "2026/27",
  "startDate": "2026-08-24",
  "endDate": "2027-01-31",
  "preset": "empty"
}
```

`preset`: `empty` oppure `basic` (materie generiche personalizzabili). Il precedente identificatore resta accettato per compatibilità con client già installati. Un secondo tentativo sullo stesso diario restituisce 409, non sostituisce i dati.

### Aggiornamento diario

Schema della busta (notazione descrittiva, non un JSON da inviare):

```text
{
  expectedUserId: user.id ottenuto dalla sessione,
  revision: revisione dell’ultimo snapshot letto,
  diary: { data: SchoolData, preferences: Preferences }
}
```

`expectedUserId` serve a rilevare cambi account nella scheda, non ad autorizzare l’accesso. Il proprietario viene sempre ricavato dal cookie. Nessun endpoint accetta un ID per leggere il diario di un altro account. Per i campi completi, vedere [tipi](../types/domain.ts) e [schemi runtime](../lib/validation.ts).

Un 409 conserva il server invariato per quella richiesta. Non incrementare artificialmente la revisione per forzare una scrittura: leggere, confrontare e chiedere una decisione esplicita all’utente.

### Classi e inviti

Tutti gli endpoint Classi richiedono la sessione iPagell. Un identificativo valido non concede accesso: il server verifica l’appartenenza e il ruolo per ogni oggetto. I membri vedono soltanto il nome visualizzato scelto nella classe, non username o credenziali.

Il codice invito contiene 12 caratteri non ambigui e può essere scritto con o senza trattini. Il server conserva solo SHA-256 del codice. Il codice in chiaro compare soltanto nella risposta di creazione; i successivi `GET` restituiscono scadenza, utilizzi e stato. I link inseriscono il codice nel frammento `#join=`, che non viene inviato nella richiesta HTTP.

Operazioni membro:

- `{ operation: "display-name", displayName }`: soltanto sul proprio profilo nella classe;
- `{ operation: "role", role: "moderator" | "member" }`: soltanto il proprietario;
- `{ operation: "transfer" }`: trasferisce la proprietà al membro indicato e rende membro il proprietario precedente.

Un moderatore può rimuovere membri ordinari, non proprietario o altri moderatori. Il proprietario non può uscire o eliminare il proprio account finché non trasferisce o elimina le classi possedute.

### Operazioni sensibili

- Cambio password: `{ operation: "password", expectedUserId, currentPassword, newPassword }`.
- Eliminazione: `{ operation: "delete", expectedUserId, currentPassword, confirmation }`, dove `confirmation` è lo username esatto normalizzato.

Il cambio password incrementa `auth_version`, mantiene il codice di recupero e invalida le sessioni. Il recupero ruota invece anche il codice. La cancellazione elimina diario e account in una transazione; le sessioni sono eliminate tramite FK. Queste API non cancellano i file scaricati né gli archivi del browser: il client gestisce separatamente la propria copia.

## Errori e limiti

| Stato | Significato / comportamento del client |
|---|---|
| 400 | Input o JSON non valido; correggere, non ritentare in ciclo |
| 401 | Sessione/credenziali mancanti, scadute o account diverso; richiedere accesso |
| 403 | Origine non consentita; non aggirare i controlli CSRF |
| 409 | Username/profilo già presente, revisione o credenziali cambiate; distinguere per endpoint |
| 413 | Corpo oltre limite: 4.096 byte per login/registrazione/recupero/sicurezza; 1.500.000 per profilo/diario |
| 415 | Tipo di contenuto non supportato |
| 429 | Limite tentativi; attendere, non generare retry automatici |
| 503 | Errore operativo o hashing già occupato; mostrare errore senza perdere il draft |

Le risposte applicative usano `{ error: "messaggio" }`; `GET /api/account` anonimo è l’eccezione: `{ user: null }` con 401. Gateway e runtime possono produrre altri formati: il client deve controllare stato e Content-Type, non assumere sempre JSON.

Limiti autenticazione: finestre fisse di 15 minuti, separatamente per azione, 40 tentativi per indirizzo edge, 12 per username, 400 globali. Contano anche tentativi validi; non è un blocco permanente né un limite su ogni endpoint del diario. In assenza di indirizzo edge si usa un bucket condiviso `unknown`.

Le risposte applicative sono `private, no-store`, `Vary: Cookie`. Non salvare mai `Set-Cookie`, password o codici di recupero nei log dei client o nei fixture versionati. I codici sono mostrati una sola volta: una risposta persa dopo un recupero riuscito richiede attenzione operativa, non un retry cieco.
