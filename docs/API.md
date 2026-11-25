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
| `GET /api/auth/security` | Nessuno; sessione richiesta | 200: `method` (`password`/`google`), `reauthUntil` (scadenza della conferma Google o `null`) |
| `POST /api/auth/security` | Vedi sotto; sessione richiesta | 200: `ok: true`; cookie scaduto |
| `POST /api/auth/oauth/google/start` | `{ ageConfirmed: true }` senza sessione, oppure `{ purpose: "reauth", expectedUserId }` con sessione | 200: `url` di Google; cookie del browser per la transazione |
| `GET /api/auth/oauth/google/callback` | Ritorno da Google | 303 a `/app`, con `?accesso=` in caso di errore o conferma |
| `GET /api/auth/sessions` | Nessuno; sessione richiesta | 200: `sessions` (al massimo 20, corrente per prima) |
| `POST /api/auth/sessions` | `revoke` o `revoke-others`, vedi sotto; sessione richiesta | 200: `revoked` (numero di sessioni chiuse) |
| `GET /api/account` | Nessuno; sessione richiesta | 200: `user`, `diary` oppure `null` |
| `POST /api/account` | Profilo iniziale; sessione richiesta | 201: `user`, `diary` con revisione 1 |
| `PUT /api/diary` | Snapshot e revisione; sessione richiesta | 200: `revision` incrementata |
| `GET, POST /api/classes` | GET senza corpo; POST con nome, descrizione e nome visibile | Elenco classi oppure 201: classe creata |
| `GET, PATCH, DELETE /api/classes/:classId` | PATCH con nome e descrizione; DELETE con `{}` | Dettaglio, modifica o eliminazione della classe |
| `POST /api/classes/join` | `code`, `displayName` | 201: ingresso nella classe |
| `GET, POST /api/classes/:classId/invites` | POST con `expiresInDays`, `maxUses` | Metadati inviti oppure 201 con codice mostrato una volta |
| `DELETE /api/classes/:classId/invites/:inviteId` | `{}` | Revoca immediata dell’invito |
| `GET, PATCH, DELETE /api/classes/:classId/members/:userId` | PATCH con operazione nome, ruolo o trasferimento | Lettura, modifica ruolo/nome, uscita o rimozione |
| `GET, POST /api/classes/:classId/events` | POST con dati evento; GET senza corpo | Elenco oppure 201: evento condiviso |
| `PATCH, DELETE /api/classes/:classId/events/:eventId` | PATCH con revisione e campi evento; DELETE con revisione | Modifica o eliminazione con controllo concorrenza |
| `POST /api/class-events/:eventId/subscription` | `semesterId`, facoltativo `subjectId` e `reminder` | 201: sottoscrizione dell'evento all'agenda personale |
| `GET /api/class-agenda` | Nessuno | Sottoscrizioni personali alle attività di classe |
| `PATCH, DELETE /api/class-agenda/:subscriptionId` | Revisione e campi personali; `detach: true` per scollegare | Modifica, scollegamento o rimozione della copia personale |
| `GET, POST /api/notes` | GET: cursore numerico `after`; POST: nota personale con ID e `baseRevision: 0` | Pagina di modifiche oppure 201: `{note}` |
| `GET, PATCH, DELETE /api/notes/:noteId` | PATCH/DELETE con revisione, mutazione e formato atteso | `{note}`, anche tombstone dopo cancellazione |
| `GET, POST /api/classes/:classId/subjects` | POST: `{name}` | `{subjects}` oppure 201: `{subject}` |
| `PATCH, DELETE /api/classes/:classId/subjects/:subjectId` | PATCH: `baseRevision`, `name` e/o `archived`; DELETE: `{baseRevision}` | `{subject}` oppure `{ok: true}` |
| `GET, POST /api/classes/:classId/notes` | GET: cursore UUID `after`; POST: nota di classe | Pagina oppure 201: `{note}` |
| `GET, PATCH, DELETE /api/classes/:classId/notes/:noteId` | PATCH/DELETE con revisione, mutazione e formato atteso | `{note}`; modifica autore, ritiro anche per moderazione |
| `PUT, DELETE /api/classes/:classId/notes/:noteId/pin` | `{}` | `{ok: true}`; preferenza del membro corrente |
| `GET /api/my-class-notes` | Cursore UUID `after` | Pagina dei testi del solo autore autenticato |
| `DELETE /api/my-class-notes/:noteId` | Account atteso, revisione, mutazione e formato atteso | `{note}` ritirata, anche senza membership corrente |

L'[inventario generato](REPO-INVENTORY.md#api-esportate) verifica i metodi esportati da tutti i file route. Le tabelle qui descrivono il contratto applicativo.

`user = { id, username }`. Registrazione account e creazione diario sono due passaggi distinti: dopo la prima, `GET /api/account` può restituire `diary: null`. Un username duplicato restituisce 409; non esiste idempotency key per registrazione o recupero.

Il candidato security W8-A supporta lo schema invariato Sites 39 senza bootstrap. Il server riconosce esattamente le sei colonne legacy di accounts e l’assenza di tutti gli oggetti auth dell’espansione; ripete questa verifica nelle scritture finali. Schema parziale, stato espanso assente/ignoto o paused falliscono chiusi, senza fallback. La 0007 resta fuori dal pacchetto attivo. In un futuro schema espanso la fonte delle credenziali è scelta soltanto dallo stato schema server, senza fallback sulla copia iniziale. Pausa/stato non supportato impediscono nuove autenticazioni e operazioni security; gli errori inattesi restano 503 generici. Nessun endpoint Google/Apple/email è disponibile. [Stato locale e rollout](improvement-2026-10-01/AUTH-COMPATIBILITY-W8A.md).

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

Il client invia `X-IPagell-Account` anche su creazione del primo diario e logout: quando presente, un account diverso viene rifiutato con 401. L’header resta facoltativo su questi due endpoint per i client precedenti; non autorizza mai un account al posto del cookie.

Un 409 conserva il server invariato per quella richiesta. Il client può confermare una scrittura con risposta persa solo dopo avere riletto lo stesso account e verificato che l’intero snapshot coincida; in caso contrario conserva il draft e il conflitto. Non incrementare artificialmente la revisione per forzare una scrittura: leggere, confrontare e chiedere una decisione esplicita all’utente.

### Classi e inviti

Tutti gli endpoint Classi richiedono la sessione iPagell. Un identificativo valido non concede accesso: il server verifica l’appartenenza e il ruolo per ogni oggetto. I membri vedono soltanto il nome visualizzato scelto nella classe, non username o credenziali.

Il codice invito contiene 12 caratteri non ambigui e può essere scritto con o senza trattini. Il server conserva solo SHA-256 del codice. Il codice in chiaro compare soltanto nella risposta di creazione; i successivi `GET` restituiscono scadenza, utilizzi e stato. I link inseriscono il codice nel frammento `#join=`, che non viene inviato nella richiesta HTTP.

Operazioni membro:

- `{ operation: "display-name", displayName }`: soltanto sul proprio profilo nella classe;
- `{ operation: "role", role: "moderator" | "member" }`: soltanto il proprietario;
- `{ operation: "transfer" }`: trasferisce la proprietà al membro indicato e rende membro il proprietario precedente.

Un moderatore può rimuovere membri ordinari, non proprietario o altri moderatori. Il proprietario non può uscire o eliminare il proprio account finché non trasferisce o elimina le classi possedute.

### Appunti

Le route `/api/notes/**`, `/api/classes/:classId/notes/**` (pin incluso) e `/api/my-class-notes/**` richiedono sempre `X-IPagell-Notes-Contract: 2`. Senza header o con altra versione rispondono 426 con `{ "code": "NOTES_CLIENT_UPGRADE_REQUIRED", "error": "..." }` e `Cache-Control: private, no-store`. L'identità continua a provenire dal cookie; `X-IPagell-Account` e `expectedUserId` rilevano un cambio di account, senza autorizzare accessi. Le materie di classe hanno route separate.

Ogni nota include `contentFormat: "plain" | "md-lite-v1"` nelle liste, nel dettaglio e nelle risposte di scrittura. `plain` conserva il testo preesistente; `md-lite-v1` è un Markdown limitato a titoli di sezione, grassetto, elenchi e paragrafi, validato e canonico. `POST` richiede `contentFormat`. `PATCH` richiede il nuovo `contentFormat`, `expectedContentFormat`, `baseRevision` e `mutationId`; `DELETE` richiede `expectedContentFormat`, `baseRevision` e `mutationId`. Il server confronta revisione e formato precedente nella stessa `UPDATE`. Il pin personale passa da `PATCH` della nota, quello di classe ha una route distinta ma richiede comunque l'header 2. Formati mancanti/sconosciuti danno 426, una revisione o un formato precedente diverso dà 409. Il limite per nota è 20.000 code point serializzati e 64 KiB del record; il corpo di scrittura è limitato a 64 KiB.

L'esportazione del backup usa `backupVersion: 3` e include il formato in note personali, bozze, conflitti e snapshot di classe. L'import V1 riguarda soltanto il diario; V2 viene interpretato come testo `plain`; V3 preserva il formato. Le copie importate ricevono nuovi ID e non vengono pubblicate automaticamente nella classe. La dimensione massima del file V2/V3 resta 24 MiB.

Payload di creazione personale: `id`, `expectedUserId`, `mutationId`, `baseRevision: 0`, `subjectId`, `subjectName`, `title`, `content`, `contentFormat` e `pinned` (default false). L'update usa l'ID nel percorso, richiede `pinned` e aggiunge `expectedContentFormat`. Il DELETE contiene solo `expectedUserId`, `mutationId`, `baseRevision`, `expectedContentFormat`. La nota di classe usa gli stessi campi senza `subjectName` e `pinned`: nome materia e identità dell'autore vengono ricavati dal server. I corpi sono strict. [Schemi](../lib/notes/validation.ts) e [costruttori dei payload](../lib/notes/request-body.ts) sono la fonte eseguibile.

Le mutazioni richiedono `X-IPagell-Account` uguale all'utente del cookie; le letture lo verificano se presente. Il contratto 2 è richiesto anche senza mutazione. L'archivio autore non richiede membership attuale; restituisce esclusivamente i testi scritti dall'utente. Per la classe, solo l'autore modifica testo/materia; autore e moderatori autorizzati possono ritirare. Le materie della classe non richiedono il contratto note: i membri possono crearle, owner/moderator possono aggiornarle o eliminarle con revisione.

Le risposte paginate sono `{notes, nextAfter, hasMore}`: il personale usa `changeSeq` numerico e include tombstone; classe e archivio autore usano ID. Limiti: fino a 50 righe e 512 KiB per pagina; quote attive 500 note/8 MiB personali e 200 note/4 MiB per classe. Il limite di creazione è 60 nuove materie attive della classe, escludendo dal conteggio le etichette legacy seminate. Una quota può produrre 413; conflitto di revisione/formato 409; accesso negato 403/404 secondo l'operazione.

Il retry conserva ID e payload della mutazione in volo. Ripetere la medesima scrittura può restituire la nota già accettata; non riutilizzare l'ID di mutazione per contenuti diversi. Una conferma viene riconosciuta solo confrontando anche il contenuto previsto. Il client conserva la bozza dopo rete/409 e distingue commit locale da conferma server. Metadati locali come `inFlight`, `localVersion` e conflitto non vanno inviati nei corpi strict.

### Operazioni sensibili

- Cambio password: `{ operation: "password", expectedUserId, currentPassword, newPassword }`.
- Eliminazione: `{ operation: "delete", expectedUserId, currentPassword, confirmation }`, dove `confirmation` è lo username esatto normalizzato. Gli account Google omettono `currentPassword` e devono avere una conferma Google valida per la sessione corrente, altrimenti 403 `SECURITY_REAUTH_REQUIRED`.

**Conferma Google senza uscire (fase B).** `POST /api/auth/oauth/google/start` con `{ purpose: "reauth", expectedUserId }` richiede una sessione di un account con identità Google attiva (401 `SECURITY_SESSION_REQUIRED`, 401 `ACCOUNT_CHANGED`, 400 `SECURITY_NOT_GOOGLE`) e crea una transazione `purpose='reauth'` legata ad account, sessione e `auth_version`. L'URL di Google include `login_hint` con il `sub` dell'account e `prompt=select_account`. Il callback verifica l'ID token come per l'accesso, poi controlla che la sessione del browser sia la stessa che ha avviato la conferma e che il `sub` coincida con l'identità collegata. L'esito è una riga `auth_grants` monouso (`operation='reauth'`, 10 minuti, legata a sessione e `auth_version`), mai una nuova sessione. Una nuova conferma sostituisce quella aperta. Ritorno a `/app?accesso=` con `reauth-ok`, `reauth-cancelled`, `reauth-mismatch` (altro account Google) o `reauth-error`; il client apre Impostazioni → Preferenze e toglie il parametro. L'eliminazione consuma la conferma nello stesso batch che cancella inviti, diario e account.

Il cambio password incrementa `auth_version`, mantiene il codice di recupero e invalida le sessioni. Il recupero ruota invece anche il codice. La cancellazione elimina inviti creati, diario e account in una transazione; ogni effetto ricontrolla la medesima sessione ancora valida e auth_version dopo la verifica della password o, per Google, il consumo della conferma. Le sessioni sono eliminate tramite FK. Queste API non cancellano i file scaricati né gli archivi del browser: il client gestisce separatamente la propria copia.

### Dispositivi connessi

`GET /api/auth/sessions` elenca le sessioni valide dell'account (non scadute e con `auth_version` corrente), la corrente per prima:

```ts
type SessionSummary = {
  id: string;            // 32 hex, SHA-256 derivato dal digest del token; mai il digest stesso
  current: boolean;
  method: "password" | "google" | null;
  client: string | null; // "browser.sistema" da elenco chiuso, per esempio "chrome.android"
  createdAt: number | null;
  lastSeenAt: number | null; // aggiornato al massimo ogni 15 minuti
  expiresAt: number;
};
```

Le sessioni aperte prima della migrazione 0009 hanno `client` e `lastSeenAt` nulli finché non vengono usate. La lettura ripulisce prima le righe scadute o invalidate dello stesso account.

`POST /api/auth/sessions`, corpo strict di massimo 1 KiB:

- `{ operation: "revoke", expectedUserId, id }`: chiude un'altra sessione. Un `id` sconosciuto, già chiuso o di un altro account restituisce `{ revoked: 0 }` (idempotente, nessuna informazione su altri account). L'`id` della sessione corrente restituisce 400 `SESSIONS_CURRENT`: si esce con `POST /api/auth/logout`.
- `{ operation: "revoke-others", expectedUserId }`: chiude tutte le altre sessioni valide e restituisce quante.

Ordine dei controlli: Origin e Fetch Metadata, sessione (401 `SECURITY_SESSION_REQUIRED`), schema (400 `SESSIONS_INVALID_INPUT`), `expectedUserId` (401 `ACCOUNT_CHANGED`), limite per azione `sessions` (12 ogni 15 minuti per account). Non serve riautenticazione e `auth_version` non cambia: le righe vengono cancellate. Un dispositivo chiuso riceve 401 alla richiesta successiva.

Ogni account mantiene al massimo 20 sessioni: all'emissione di una nuova (login, registrazione, Google) vengono cancellate quelle con `auth_version` superato e le più vicine alla scadenza oltre il limite.

## Errori e limiti

| Stato | Significato / comportamento del client |
|---|---|
| 400 | Input o JSON non valido; correggere, non ritentare in ciclo |
| 401 | Sessione/credenziali mancanti, scadute o account diverso; richiedere accesso |
| 403 | Origine non consentita; non aggirare i controlli CSRF |
| 409 | Username/profilo già presente, revisione o credenziali cambiate; distinguere per endpoint |
| 413 | Corpo oltre limite: 4.096 byte per login/registrazione/recupero/sicurezza; 1.024 per sessioni; 1.500.000 per profilo/diario |
| 415 | Tipo di contenuto non supportato |
| 426 | Client note da aggiornare; conservare la bozza locale e ricaricare l'app |
| 429 | Limite tentativi; attendere, non generare retry automatici |
| 503 | Errore operativo o hashing già occupato; mostrare errore senza perdere il draft |

Le risposte applicative usano `{ error: "messaggio" }`, con `code` aggiuntivo per l'upgrade obbligatorio delle note; `GET /api/account` anonimo è l’eccezione: `{ user: null }` con 401. Gateway e runtime possono produrre altri formati: il client deve controllare stato e Content-Type, non assumere sempre JSON.

Limiti autenticazione: finestre fisse di 15 minuti, separatamente per azione, 40 tentativi per indirizzo edge, 12 per username, 400 globali. Contano anche tentativi validi; non è un blocco permanente né un limite su ogni endpoint del diario. In assenza di indirizzo edge si usa un bucket condiviso `unknown`.

Le risposte applicative sono `private, no-store`, `Vary: Cookie`. Non salvare mai `Set-Cookie`, password o codici di recupero nei log dei client o nei fixture versionati. I codici sono mostrati una sola volta: una risposta persa dopo un recupero riuscito richiede attenzione operativa, non un retry cieco.
