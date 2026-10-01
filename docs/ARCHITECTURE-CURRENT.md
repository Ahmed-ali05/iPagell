# iPagell — Architettura corrente

> Aggiornamento del working tree: [intervento di affidabilità del 23 settembre 2026](RELIABILITY.md). Le sezioni sottostanti restano lo snapshot storico del commit indicato, non descrivono automaticamente le correzioni successive.


| Metadato | Valore |
|---|---|
| Repository | `Ahmed-ali05/iPagell` |
| Branch analizzato | `main` |
| Commit SHA | `c780569869a77d81db86cf1cd70d9a0e31d232bd` |
| Data commit | 18 settembre 2026, 07:17:44 UTC (09:17:44 CEST) |
| Data analisi | 23 settembre 2026 |

> Questo documento descrive l'architettura **effettivamente implementata** nel commit indicato. Specifiche future e documenti di roadmap non vengono trattati come runtime esistente.

## Vista d'insieme

L'architettura corrente ha due flussi persistenti distinti:

1. **diario personale**: snapshot completo, locale in IndexedDB e remoto in D1;
2. **classi/attività condivise**: dati normalizzati in D1 con cache di lettura separata in `localStorage` per l'agenda sottoscritta.

Il percorso principale del diario è:

```text
Browser
  ↓
UI React / IPagellApp
  ↓
hooks/use-diary.ts
  ↓
IndexedDB (ipagell-db / accounts)
  ↓
/api/account + /api/diary
  ↓
lib/server/*
  ↓
Cloudflare D1 / diaries
```

Per le attività di classe il percorso è diverso:

```text
Browser
  ↓
ClassesView / ClassEventsPanel / DiaryWorkspace
  ↓
hooks/use-class-agenda.ts + lib/classes/client.ts
  ├─ localStorage cache: ipagell-class-agenda-v1:<userId>
  ↓
/api/classes/* + /api/class-events/* + /api/class-agenda/*
  ↓
lib/server/class-*.ts
  ↓
Cloudflare D1
  ├─ classes
  ├─ class_members
  ├─ class_invites
  ├─ class_events
  ├─ class_event_subscriptions
  └─ class_departures
```

## 1. Browser e shell applicativa

### Entry point

- `app/layout.tsx`: layout globale, metadata, manifest, favicon, splash iOS e redirect client-side da alias noti al dominio canonico.
- `app/page.tsx`: landing italiana canonical `/`; usa `identity()` server-side e reindirizza utenti autenticati a `/app`.
- `app/[locale]/page.tsx`: landing SSR per `/it`, `/de`, `/fr`, `/en`; `/it` canonicalizza `/`. Riusa `lib/i18n/messages`, metadata e dati JSON-LD localizzati.
- `proxy.ts`: inoltra la lingua URL pubblica o il parametro ponte `uiLocale` come header interno per il primo SSR; non la salva lato server.
- `app/app/page.tsx`: pagina applicativa; monta `IPagellApp` e seleziona registrazione se `?mode=register`.
- `components/ipagell-app.tsx`: applicazione client vera e propria.

### Routing interno

Non esiste una route per ogni modulo del diario. Dentro `/app`, `DiaryWorkspace` mantiene lo stato `activeTab` con:

- `home`;
- `agenda`;
- `grades`;
- `absences`;
- `stats`;
- `classes`.

I parametri URL sono interpretati lato client:

- `view=agenda`;
- `view=classes`;
- `action=grade`;
- hash `join=`.

File:

- `components/ipagell-app.tsx`;
- `components/legacy-entry-redirect.tsx`.

## 2. Autenticazione

### 2.1 Registrazione

```text
AccountGate
  → POST /api/auth/register
  → signupSchema
  → rateLimit
  → scrypt(password)
  → INSERT accounts
  → issueSession()
  → INSERT sessions
  → Set-Cookie
  → AccountGate avvia onboarding diario
  → POST /api/account
  → createDiary()
  → INSERT diaries revision=1
```

Implementazione:

- UI: `components/account-gate.tsx`;
- validazione: `lib/auth-validation.ts`;
- endpoint registrazione: `app/api/auth/register/route.ts`;
- endpoint primo diario: `app/api/account/route.ts`;
- creazione struttura iniziale: `lib/new-diary.ts`;
- password/token: `lib/server/password.ts`;
- sessioni/rate-limit: `lib/server/auth.ts`;
- DB: `lib/server/db.ts`, `lib/server/repository.ts`.

L'account e il diario sono due operazioni separate: l'account può esistere senza ancora avere una riga `diaries`, stato che l'UI tratta come onboarding.

### 2.2 Login

```text
AccountGate
  → POST /api/auth/login
  → normalize/validate username
  → rateLimit
  → SELECT account
  → verifyPassword()
  → issueSession()
  → Set-Cookie
  → useDiary.reload()
  → GET /api/account
```

File:

- `components/account-gate.tsx`;
- `app/api/auth/login/route.ts`;
- `lib/server/auth.ts`;
- `lib/server/password.ts`.

### 2.3 Identità e cookie

`lib/server/auth.ts` è l'autorità per la sessione applicativa.

`identity(request)`:

1. legge il cookie atteso in base a HTTP/HTTPS;
2. accetta un solo token hex di 64 caratteri;
3. calcola SHA-256;
4. unisce `sessions` e `accounts`;
5. richiede sessione non scaduta e `auth_version` uguale.

Il token in chiaro non viene conservato in D1.

### 2.4 Recupero e cambio password

Recupero:

- `app/api/auth/recover/route.ts`;
- verifica username + digest del recovery code;
- genera nuova password hash;
- genera nuovo recovery code;
- incrementa `auth_version`;
- scade il cookie corrente.

Cambio password/cancellazione:

- UI `components/account-security.tsx`;
- API `app/api/auth/security/route.ts`;
- richiede password corrente e `expectedUserId`;
- cambio password incrementa `auth_version`;
- cancellazione rifiutata se l'account possiede ancora una classe.

### 2.5 Logout

- UI: `useDiary.logout()` in `hooks/use-diary.ts`;
- server: `app/api/auth/logout/route.ts`;
- locale: `forgetLocal()` in `lib/account-storage.ts`.

Se il diario locale è `dirty`, il logout viene bloccato salvo richiesta esplicita di scarto.

## 3. Diario personale

### 3.1 Modello

Il diario è un singolo snapshot remoto per utente:

```ts
{
  data: SchoolData,
  preferences: Preferences,
  revision: number
}
```

Il payload persistito in `diaries.payload` contiene `{ data, preferences }`; `revision` è una colonna SQL separata.

Definizioni:

- `types/domain.ts`;
- `lib/validation.ts`;
- `db/schema.ts`;
- `lib/server/repository.ts`.

### 3.2 Lettura iniziale

```text
IPagellApp
  → useDiary()
  → GET /api/account
  → identity()
  → DiaryRepository.get()
  → SELECT diaries
```

Poi `useDiary.load()` confronta il risultato con IndexedDB:

- se il server non ha diario → `onboarding`;
- se esiste una copia locale `dirty` con stessa revisione → la pubblica e tenta sync;
- se esiste una copia locale `dirty` con revisione diversa → `conflict`;
- altrimenti copia lo snapshot server in IndexedDB e passa a `saved`.

File:

- `hooks/use-diary.ts`;
- `lib/account-storage.ts`;
- `app/api/account/route.ts`;
- `lib/server/repository.ts`.

### 3.3 Mutazione del diario

Tutte le modifiche personali passano da `session.commit()` / `useDiary.commit()`.

```text
UI action
  → recipe(SchoolData)
  → aggiorna data.updatedAt
  → merge Preferences patch
  → diarySchema.safeParse()
  → LocalDiary dirty=true
  → saveLocal() / IndexedDB transaction commit
  → publish UI
  → sync()
```

Il salvataggio locale precede la richiesta remota. Questo rende possibile continuare a mutare un diario già aperto offline.

I punti UI che alimentano questo flusso si trovano principalmente in:

- `components/ipagell-app.tsx`;
- `components/entry-dialog.tsx`;
- `components/absences-view.tsx`;
- `components/stats-view.tsx` per lettura/calcolo;
- `lib/calculations.ts` per medie/simulatore/trend.

## 4. Sincronizzazione del diario

### 4.1 Protocollo compare-and-swap

Client (`hooks/use-diary.ts`):

```json
{
  "expectedUserId": "...",
  "revision": 7,
  "diary": {
    "data": {},
    "preferences": {}
  }
}
```

Server (`app/api/diary/route.ts`):

1. verifica identità;
2. applica `checkMutation()`;
3. valida `expectedUserId`, `revision`, `diary`;
4. confronta `expectedUserId` con la sessione;
5. chiama `DiaryRepository.update()`.

Repository (`lib/server/repository.ts`):

```sql
UPDATE diaries
SET payload = ?, revision = revision + 1, updated_at = ?
WHERE user_id = ? AND revision = ?
```

Se `changes !== 1`, l'API restituisce 409 e nessun overwrite forzato viene eseguito.

### 4.2 Stati client

`hooks/use-diary.ts`:

- `saved`: server e locale allineati;
- `saving`: richiesta in corso;
- `offline`: rete assente/fallimento di rete;
- `conflict`: revisione divergente;
- `error`: errore API diverso da 401/409;
- `expired`: sessione scaduta.

### 4.3 Risoluzione conflitto

Non esiste merge. L'utente può:

- preservare/esportare la copia locale;
- scegliere la copia server tramite `useServer()`.

L'architettura non conserva una cronologia degli snapshot precedenti.

### 4.4 Retry

`useDiary` ascolta:

- evento browser `online`;
- `visibilitychange` quando la pagina torna visibile.

Se lo snapshot è `dirty`, tenta `sync()`; se è pulito, ricarica dal server.

### 4.5 Confini della serializzazione

La `Promise` queue in `useDiary` serializza mutazioni della **singola istanza hook**. Non implementa lock IndexedDB, BroadcastChannel o altro coordinamento esplicito tra tab.

## 5. Persistenza locale del diario

### 5.1 IndexedDB

`lib/account-storage.ts`:

```text
DB: ipagell-db
version: 2
stores:
  accounts   current
  state      legacy
```

`accounts` è indicizzato manualmente per chiave `user.id`.

Oggetto memorizzato:

```text
LocalDiary = DiarySnapshot + user + dirty
```

La transazione IndexedDB deve raggiungere `oncomplete` prima che `saveLocal()` ritorni.

### 5.2 Puntatore account

`localStorage["ipagell-active-account-v2"]` identifica quale copia IndexedDB può essere aperta in fallback offline.

Su 401, `useDiary.load()` rimuove il puntatore attivo ma non cancella indiscriminatamente tutti gli snapshot di altri account.

### 5.3 Fallback offline

`useDiary.load()` apre una copia locale soltanto se:

- l'errore non è un `ApiError`, quindi è trattato come failure di rete/client;
- esiste un account attivo;
- la copia IndexedDB è valida.

Un 401 o un 503 ricevuto correttamente dal server non viene trasformato in “login offline”.

## 6. Classi

### 6.1 Gate di funzionalità

Ogni ingresso server classi usa `requireClassesEnabled()` da `lib/server/class-access.ts`.

Valore richiesto:

```text
IPAGELL_CLASSES=enabled
```

Se diverso, la route restituisce 404.

### 6.2 UI

- `components/classes-view.tsx`: elenco, selezione, creazione classe, join, membri, inviti, ruoli, uscita/eliminazione/trasferimento.
- `components/class-events-panel.tsx`: attività condivise dentro una classe.
- `components/ipagell-app.tsx`: tab Classi e integrazione agenda.

La vista Classi viene montata al primo accesso e resta montata finché resta attivo lo stesso `DiaryWorkspace` (identificato da `user.id`). Conserva in memoria elenco, selezione e dettagli per `classId`; il pannello conserva anche gli eventi per `classId`. Tornando al tab, i dati sono subito visibili e una lettura non bloccante parte se l'elenco o gli eventi hanno più di 30 secondi. L'elenco sblocca la UI senza attendere il dettaglio. Gli inviti si caricano aprendo la sezione di gestione. Le scritture confermate aggiornano o invalidano i dati coinvolti. Questa cache di vista non è persistente e non sostituisce i controlli di accesso server. [Misurazione e limiti](CLASSI-PERFORMANCE.md).

### 6.3 Client HTTP

`lib/classes/client.ts` fornisce `classRequest()`:

- `cache: no-store`;
- `credentials: same-origin`;
- timeout;
- header `X-IPagell-Account` con l'utente atteso;
- su 401 cancella cache agenda di classe e invia `ipagell-class-session-ended`.

### 6.4 Server

Accesso:

- `lib/server/class-access.ts` verifica feature flag, appartenenza e ruolo;
- `lib/classes/permissions.ts` contiene la matrice ruoli/azioni.

Dati e operazioni:

- `lib/server/class-repository.ts`.

Tabelle:

- `classes`;
- `class_members`;
- `class_invites`;
- `class_departures`.

### 6.5 Creazione classe

`ClassRepository.create()`:

1. genera UUID;
2. inserisce `classes` solo se il proprietario ne possiede meno di 20;
3. inserisce il creatore in `class_members` con ruolo `owner`;
4. inizializza `settings` con `{"membersVisible":true}`.

Non viene creato automaticamente un invito. La generazione invito è un'operazione successiva.

### 6.6 Inviti

`lib/classes/validation.ts` genera 12 caratteri da un alfabeto senza simboli ambigui. `ClassRepository.createInvite()` salva solo il digest tramite `tokenHash()`.

Join:

```text
POST /api/classes/join
  → normalizeInviteCode()
  → lookup secret_hash
  → verifica non revocato / non scaduto / usi residui
  → verifica non già membro
  → verifica class_departures rispetto a created_at invito
  → INSERT class_members role=member
  → UPDATE invite uses
```

L'effetto di `class_departures` è che un invito creato prima della partenza non può essere riutilizzato per rientrare.

## 7. Eventi di classe

### 7.1 Modello corrente

`lib/classes/events.ts` e `db/schema.ts`.

Campi condivisi:

- `subject`: stringa;
- `kind`: `task` o `test`;
- `title`;
- `description`;
- `dueAt`;
- `status`: `active` o `cancelled`;
- `revision`.

Non esiste una tabella `class_subjects` nel commit.

### 7.2 Lettura/creazione

Endpoint:

- `GET /api/classes/:classId/events`;
- `POST /api/classes/:classId/events`.

Repository:

- `ClassEventRepository.list()`;
- `ClassEventRepository.create()`.

Limite: 500 eventi per classe. La creazione richiede appartenenza ma non un ruolo elevato.

### 7.3 Modifica/eliminazione

Endpoint:

- `PATCH /api/classes/:classId/events/:eventId`;
- `DELETE /api/classes/:classId/events/:eventId`.

La query SQL autorizza:

- owner;
- moderator;
- autore dell'evento.

Le scritture richiedono `revision` attesa. Un mismatch produce 409.

## 8. Sottoscrizione di un'attività condivisa all'agenda personale

### 8.1 Creazione

```text
ClassEventsPanel
  → useClassAgenda.subscribe()
  → POST /api/class-events/:eventId/subscription
  → eventUser()
  → privateReferences()
  → ClassEventRepository.subscribe()
  → INSERT class_event_subscriptions
```

File:

- `components/class-events-panel.tsx`;
- `hooks/use-class-agenda.ts`;
- `app/api/class-events/[eventId]/subscription/route.ts`;
- `lib/server/class-event-http.ts`;
- `lib/server/class-event-repository.ts`.

`privateReferences()` carica il **diario privato dello stesso utente** solo per verificare che `semesterId` e l'eventuale `subjectId` scelti esistano. Questi riferimenti personali non vengono aggiunti alla risposta condivisa della classe.

### 8.2 Persistenza separata

`class_event_subscriptions` contiene:

```text
id
user_id
source_event_id
event_id
snapshot
semester_id
subject_id
completed
reminder
revision
detached_at
```

I campi condivisi sono congelati anche in `snapshot`, mentre completamento/reminder/associazione personale rimangono colonne della sottoscrizione.

### 8.3 Mapping nell'agenda UI

`subscriptionAgenda()` in `lib/classes/events.ts` converte ogni sottoscrizione in `AgendaDisplayItem` con ID UI `class:<subscriptionId>`.

`DiaryWorkspace` in `components/ipagell-app.tsx` costruisce:

```text
allAgenda = personal data.agenda + mapped class subscriptions
```

Le attività di classe non vengono per questo inserite nel JSON `diaries.payload`.

### 8.4 Aggiornamento snapshot

I trigger della migrazione `drizzle/0003_melted_dark_phoenix.sql` mantengono gli snapshot:

- update evento → snapshot aggiornato;
- delete evento → snapshot `cancelled`, scollegato;
- rimozione membro → sottoscrizioni di quell'utente scollegate;
- delete classe → sottoscrizioni scollegate;
- rename classe → `className` aggiornato nello snapshot.

### 8.5 Scollegamento volontario

`PATCH /api/class-agenda/:subscriptionId` può ricevere `detach: true`.

`ClassEventRepository.updateSubscription()`:

- pone `event_id = NULL`;
- imposta `detached_at` se mancante;
- incrementa revisione.

Dopo il detach, `personalEvent` può modificare lo snapshot soltanto se `event_id IS NULL`.

UI: `PersonalEventDialog` in `components/class-events-panel.tsx`.

## 9. Cache e offline delle classi

### 9.1 Cache

`hooks/use-class-agenda.ts` usa:

```text
localStorage key = ipagell-class-agenda-v1:<userId>
```

La cache dell'agenda sottoscritta è distinta dalla cache in memoria della vista Classi descritta in §6.2.

La cache è validata da uno schema Zod e accettata solo se `activeAccountId() === userId`.

### 9.2 Aggiornamento

Refresh:

- avvio;
- ogni 30 secondi se visibile;
- evento `online`;
- `visibilitychange`.

Le mutazioni hanno una guardia pending sincrona per sottoscrizione o evento. `ClassAgendaCoordinator` applica dalla risposta soltanto l'entità modificata e, concluse le scritture in volo, legge uno snapshot finale prima di rilasciare i pending. Una lettura precedente non può sovrascrivere lo stato riconciliato o la cache.

### 9.3 Modalità offline

Se la rete fallisce, gli elementi cache restano consultabili e lo stato segnala che l'agenda non è aggiornata.

Le mutazioni delle classi non hanno una coda offline: `subscribe`, `update`, `remove` richiedono risposta server.

Quindi l'offline delle classi è **cache di lettura**, diverso dall'offline del diario personale che mantiene una copia mutabile `dirty` in IndexedDB.

## 10. PWA e service worker

### 10.1 Registrazione

`components/install-app.tsx`, montato dal layout globale, registra `/sw.js` solo quando `process.env.NODE_ENV === "production"` e il browser supporta service worker. La registrazione avviene sia dalla landing sia da `/app`.

### 10.2 Build del worker

- template: `public/sw.js`;
- generatore: `scripts/generate-precache.mjs`;
- output: worker dentro `dist/client` con hash e lista asset sostituiti.

Non va quindi interpretato il template statico non processato come manifest finale della cache di una build.

### 10.3 Strategia cache

`public/sw.js`:

- CORE: `/`, `/app`, offline, manifest, favicon, icone normali, Apple e maskable;
- JS/CSS/font generati aggiunti alla allowlist;
- API/RSC non cache;
- navigazione `/`, `/app` e `/it`/`/de`/`/fr`/`/en`: network-first → cache dove disponibile → shell offline;
- asset statici consentiti: cache-first;
- nessun `skipWaiting()`.

### 10.4 Notifiche

Il service worker gestisce soltanto il click della notifica. Non contiene `push` o `periodicsync`.

Il trigger dei promemoria è nel componente React `components/ipagell-app.tsx`, quindi richiede che il codice dell'app venga eseguito.

### 10.5 Inviti all'installazione

Il manifest mantiene `id: /`, `start_url: /app?source=pwa`, `scope: /` e `display: standalone`. Dichiara anche sé stesso in `related_applications` per consentire a Chromium, dove disponibile, la verifica di un'installazione già presente tramite `getInstalledRelatedApps()`. Le icone 192, 512 e maskable sono PNG delle dimensioni dichiarate.

`components/install-app.tsx` conserva l'evento `beforeinstallprompt` per aprire il prompt nativo soltanto da un gesto dell'utente. `appinstalled` rimuove subito gli inviti. La modalità standalone viene riconosciuta con `display-mode`, con `navigator.standalone` come fallback Apple. Lo user agent serve solo a selezionare istruzioni manuali pertinenti: Safari iOS/iPadOS, Chrome Android, Samsung Internet, Edge Android e Firefox Android. Per Edge e Firefox il testo descrive un possibile collegamento rapido, senza promettere la modalità app. Browser non riconosciuti non ricevono una CTA manuale. La verifica delle installazioni già presenti in una scheda browser resta limitata ai browser che espongono `getInstalledRelatedApps()`; un marker locale di 90 giorni copre l'evento `appinstalled` sul dispositivo corrente.

La landing mostra un invito secondario. Nella Home dell'app mobile la card compare solo dopo almeno 20 secondi nella sessione e dopo che il diario contiene un voto, un'attività o un'assenza; la chiusura la nasconde per 90 giorni. Nelle Preferenze resta un accesso manuale indipendente dalla chiusura. Sul desktop la Home non propone la card: l'installazione rimane disponibile nella landing e nelle Preferenze se il browser offre il prompt.

Il testo promette accesso offline solo alla copia personale già salvata sul dispositivo. La pagina `offline.html` non garantisce che esista una copia e invita a riaprire `/app`; la sua copy breve è generata dai cataloghi i18n durante la build. Le route pubbliche localizzate non vengono precache come documenti distinti. Le mutazioni condivise continuano a richiedere la rete.

## 11. Backup e import

### 11.1 Backup diario

`createBackup()` in `lib/account-storage.ts` produce:

```text
app
exportedAt
data
preferences
```

`backupSchema` rifiuta campi extra; non è previsto `userId`.

### 11.2 Attività di classe nel backup

`backupWithClassAgenda()` in `lib/classes/backup.ts`:

- prende le sottoscrizioni correnti;
- le converte in normali `AgendaItem` personali;
- crea una materia locale se necessario;
- non include membership/inviti/identità di collegamento;
- evita duplicati con l'ID derivato `class-snapshot-...`.

L'import del backup non ricostruisce la classe.

### 11.3 Appunti e backup V3 (working tree del 30 settembre 2026)

`lib/notes/backup.ts` esporta `backupVersion: 3` con `contentFormat` esplicito in note, bozze, conflitti e snapshot di classe. Accetta V1 (solo diario) e V2 (testi interpretati come `plain`). L'import assegna nuovi ID a diario, materie e appunti, verifica le quote prima del commit e registra un piano in IndexedDB per riprendere dopo un'interruzione. Le note di classe esportate rientrano solo come copie personali non associate a una classe; importare un backup non ripubblica contenuti. L'export completo richiede accesso al server per aggiornare le note personali e leggere quelle di classe scritte dall'utente; in caso di errore l'interfaccia segnala che la copia è limitata al dispositivo.

### 11.4 Appunti per materia (working tree del 1 ottobre 2026)

La vista personale si apre da Home, dalle attività di Agenda associate a una materia privata e dalla materia in Voti senza aggiungere una sesta voce alla barra fissa. Home mostra fino a tre appunti personali modificati di recente e un accesso agli appunti della materia della prossima scadenza. Il ritorno nominato conserva il contesto di ingresso: la materia selezionata in Voti e, in Agenda, elenco/calendario, filtro della sorgente, mese e giorno restano in memoria nello stesso workspace/account. Agenda viene montata al primo accesso e poi nascosta quando non attiva. Nell’editor personale si può aggiungere una materia senza perdere il testo; la materia appena creata viene selezionata. Le note senza titolo o materia restano bozze sul dispositivo, con indicazione di cosa manca per sincronizzarle. `PersonalNotesView` usa `useNotes` e `ipagell-notes-db` versione 2 (store `personal`, `classDrafts`, `meta`) separati da `ipagell-db` del diario. Un appunto personale punta all'ID stabile di una materia privata ma non al semestre: rinominare o archiviare la materia conserva il riferimento; eliminarla lascia il testo con nome storico, ancora modificabile, e permette di scegliere esplicitamente un'altra materia. Le note non sono dentro `SchoolData.version=1`; un vecchio client può salvare il diario senza eliminarle. Il cursore `change_seq` avanza in una transazione insieme alla pagina ricevuta; ogni bozza ha ID di mutazione, revisione base, formato e confronto locale. L'editor condiviso ProseMirror mantiene `plain` fino al primo comando di formattazione; `md-lite-v1` è serializzato da un AST chiuso. `NoteContent` rende solo nodi React ammessi. La barra di formattazione rimane montata anche quando il focus passa ai pulsanti; su mobile è collocata dopo il testo e il menu elenchi si apre verso l’alto. Un bookmark conserva la selezione e viene mappato attraverso le transazioni durante la composizione. `lib/notes/editor-selection.ts` normalizza «Seleziona tutto» e converte i blocchi selezionati in un elemento di elenco per paragrafo, preservando lo schema chiuso e il testo; titoli ed elenchi possono essere tolti dallo stesso comando. Il modulo PDF e i font si caricano al comando Esporta, con Markdown secondario e `.txt` per recuperare una nota plain.

Il dettaglio Classe separa Attività e Appunti della classe con un selettore; il cambio sezione attende `flushOpenNotes()`. `ClassNotesPanel` mostra le bozze dell’utente prima dei testi condivisi; copia da un appunto personale e gestione materie si aprono su richiesta. La modifica della classe resta nella gestione secondaria. Si può scrivere anche senza materie e aggiungerne una direttamente nell’editor, mantenendo la bozza. Le copie provenienti dalla vista personale richiedono la scelta della classe e il comando esplicito di preparazione prima di aprire la bozza. Il comando «Controlla e condividi» apre l’anteprima; soltanto la successiva conferma invia il testo alla classe. Aprire e chiudere un editor di classe senza modifiche non genera una bozza vuota. Ogni classe ha `class_subjects` separati dalle materie private; le etichette delle attività esistenti vengono seminate dalla migrazione 0005 e i vecchi client possono continuare a creare attività con etichette libere. L'editor di classe salva soltanto una bozza privata in IndexedDB finché l'utente non conferma l'anteprima e pubblica online. Le letture richiedono membership corrente; l'autore può modificare o ritirare, owner/moderator possono moderare, e il pin è per membro. Uscita o cancellazione della classe stacca le note condivise senza cancellare automaticamente il testo dell'autore, che resta recuperabile dall'archivio personale. Copiare tra i due spazi crea un nuovo testo e richiede una materia nello spazio di destinazione.

Le API sono `app/api/notes/**`, `app/api/classes/[classId]/subjects/**`, `app/api/classes/[classId]/notes/**` e `app/api/my-class-notes/**`, con repository SQL in `lib/server/note-repository.ts` e guard in `lib/server/note-http.ts`. La migrazione 0005 aggiunge tabelle e trigger; la 0006 aggiunge `content_format` con default `plain` e aggiorna i trigger. Tutte le route note richiedono `X-IPagell-Notes-Contract: 2`, incluse le letture, il pin e l'archivio autore. Le scritture hanno formato esplicito e gli update/delete confrontano atomicamente anche `expectedContentFormat`; i vecchi client ricevono 426 senza toccare le righe. Restano i limiti di 500 note/8 MiB per account, 200/4 MiB per classe, 60 materie attive, 20.000 code point serializzati e 64 KiB per appunto. Le mutazioni usano revisione e ID di mutazione; le liste sono paginate a 50 righe e al massimo 512 KiB di risposta. Le note di classe richiedono rete per pubblicazione e lettura autorizzata; una bozza aperta resta salvabile localmente se la connessione cade.

## 12. Database e layer server

### Accesso D1

`lib/server/db.ts`:

```text
cloudflare:workers env
  → env.DB
  → D1Database
```

Factories:

- `repository()` → `DiaryRepository`;
- `classRepository()` → `ClassRepository`.

Gli eventi costruiscono direttamente `ClassEventRepository(database())` tramite `lib/server/class-event-http.ts`.

### Layer server effettivi

| File | Responsabilità |
|---|---|
| `lib/server/db.ts` | Binding D1 e factory repository. |
| `lib/server/repository.ts` | CRUD snapshot diario e CAS revisione. |
| `lib/server/auth.ts` | Identità, cookie, sessione e rate limit. |
| `lib/server/password.ts` | Scrypt, token e digest. |
| `lib/server/http.ts` | CSRF/origin/content-type/body limit/error envelope. |
| `lib/server/class-access.ts` | Feature gate e autorizzazione classe. |
| `lib/server/class-repository.ts` | Classi, membri, ruoli, inviti. |
| `lib/server/class-event-http.ts` | Guard comune per route eventi/sottoscrizioni. |
| `lib/server/class-event-repository.ts` | Eventi, sottoscrizioni e revisioni. |
| `lib/server/note-http.ts`, `lib/server/note-repository.ts` | Autorizzazione, validazione, quote e revisione di note e materie di classe. |

## 13. Cloudflare / Sites

### Profilo Sites/local predefinito

`vite.config.ts` legge `.openai/hosting.json` e, quando `IPAGELL_DEPLOY_TARGET` non vale `cloudflare`, sostituisce la configurazione binding con quella derivata dal progetto Sites/local.

Il D1 locale usa un ID placeholder intenzionale; il binding resta `DB`.

### Profilo Worker indipendente

Quando `IPAGELL_DEPLOY_TARGET=cloudflare`, il plugin usa `wrangler.jsonc`.

`wrangler.jsonc` definisce Worker, compatibility date, D1 e feature flag classi.

### Build Sites

`build/sites-vite-plugin.ts` copia nel pacchetto build:

- `.openai/hosting.json`;
- directory `drizzle/`.

### Deploy versionato

La repository contiene script operativo soltanto per il Worker sandbox indipendente. La pubblicazione Sites descritta in `docs/DEPLOYMENT.md` richiede un processo esterno/connettore e non è codificata come GitHub Action.

## 14. Integrazione opzionale `document.modelContext`

`components/ipagell-app.tsx` controlla `document.modelContext?.registerTool`.

Se disponibile registra:

### `read_school_summary`

Legge dal diario già in memoria:

- media generale;
- numero attività aperte;
- ore di assenza.

Non effettua chiamate ad un LLM.

### `create_grade`

Valida input minimo, crea un `Grade` e chiama `updateData()`, quindi segue il normale flusso:

```text
modelContext tool
  → updateData()
  → useDiary.commit()
  → IndexedDB
  → /api/diary
  → D1
```

Non sono presenti OCR, embedding, vector DB o pipeline di studio AI.

## 15. Sicurezza architetturale osservabile

Controlli concreti nel codice:

- sessioni HttpOnly e Secure su HTTPS;
- token sessione hashati nel DB;
- recovery code hashato;
- scrypt per password;
- origin/`Sec-Fetch-Site` sulle mutazioni;
- content type JSON;
- body limit streaming;
- `expectedUserId` nel sync diario;
- `X-IPagell-Account` nelle mutazioni classi/eventi;
- feature gate classi;
- permessi server-side su ruolo/membership;
- revisione ottimistica per diario/eventi/sottoscrizioni;
- nessuna API nel service-worker cache.

Questi controlli descrivono ciò che il codice fa; non equivalgono a una certificazione di sicurezza completa.

## 16. Elementi presenti ma non architettura attiva

### Duplicati/template

- `db/schema 2.ts`: vuoto; la configurazione attiva punta a `db/schema.ts`.
- `drizzle.config 2.ts`: duplicato; non risulta referenziato dai normali script.

### Mock auth del plugin Sites

Il codice vendorizzato `build/sites-vite-plugin.ts` include una modalità mock auth locale, ma `vite.config.ts` chiama `sites({ mockAuth: false })`; quindi il percorso di injection degli header mock non è attivo nella configurazione corrente.

### Store legacy

IndexedDB store `state` è ancora leggibile da `legacyBackup()`, ma non è il datastore corrente del diario.

## 17. Funzioni descritte altrove ma non implementate

Non fanno parte dell'architettura runtime di questo commit:

- spazio studio AI;
- OCR/material ingestion;
- embeddings/vector index;
- storage R2 di materiali;
- annunci;
- materiali di classe;
- `class_subjects` normalizzati;
- activity log classe dedicato;
- push scheduler/background reminders;
- chat/feed social.

## Limiti dell'audit

Dalla sola repository non si può certificare:

- quale SHA sia effettivamente in produzione su `ipagell.website`;
- lo stato attuale del progetto Sites;
- il valore delle variabili runtime Sites non versionate;
- lo schema effettivamente applicato al D1 remoto;
- la consistenza o il contenuto dei dati reali;
- i DNS, certificati e alias configurati fuori da Git;
- prestazioni e comportamento con carico reale;
- installabilità/compatibilità PWA su ogni dispositivo;
- la sicurezza complessiva oltre ai controlli staticamente osservabili e ai test realmente eseguiti;
- l'esito sul commit analizzato di `tests/api-smoke.mjs`, che non viene eseguito dal workflow CI corrente.

L'architettura descritta qui è pertanto l'architettura **del codice versionato al commit indicato**, non una fotografia certificata dell'infrastruttura live.

### Affidabilità del salvataggio Appunti — 1 ottobre 2026

`lib/notes/autosave.ts` e `hooks/use-note-autosave.ts` gestiscono entrambi gli editor con un solo writer: autosave, cambio vista, visibilità e Fine condividono la richiesta in corso. Il flush include modifiche arrivate durante il salvataggio; un errore lascia la versione sporca e può essere ritentato. I listener non vengono ricreati a ogni aggiornamento di materie o testi. Dopo il commit IndexedDB, un errore della lettura per aggiornare la UI non invalida il risultato già persistito.

Le transizioni personali in `lib/notes/reconcile.ts` sono applicate dentro una transazione IndexedDB da `lib/notes/storage.ts`. Il confronto della bozza attesa distingue il contenuto scritto dai metadati aggiornati dalla sincronizzazione. Il record personale può avere un `inFlight` opzionale, contenente l’esatto payload locale inviato: una risposta persa ritenta la stessa mutazione; una conferma riconosciuta aggiorna revisione e formato della bozza successiva senza cancellarne il testo. Una risposta diversa resta un conflitto esplicito. Le pagine vecchie non fanno regredire nota o cursore. Non cambia la versione IndexedDB o lo schema D1; `inFlight` è metadato locale del record, escluso dal backup V3. Un rifiuto definitivo 400/413 libera la richiesta respinta, mentre errori di rete mantengono il payload incerto per il retry idempotente.

Il parser `md-lite-v1` gestisce a-capo interni anche in titoli ed elementi di elenco, compreso testo multilinea incollato. L’editor ripristina lo stato precedente se un comando supera il limite o non è applicabile, senza convertire parzialmente il formato. La revisione di partenza dell’editor di classe resta quella del testo aperto: un refresh non autorizza a riscrivere una versione altrui. Riprova, copia e download sono disponibili anche dopo un errore di salvataggio della bozza di classe; la pubblicazione resta subordinata ad anteprima e conferma.
