# iPagell — Repository Snapshot

> Aggiornamento del working tree: [intervento di affidabilità del 23 settembre 2026](RELIABILITY.md). Le sezioni sottostanti restano lo snapshot storico del commit indicato, non descrivono automaticamente le correzioni successive.


| Metadato | Valore |
|---|---|
| Repository | `Ahmed-ali05/iPagell` |
| Branch analizzato | `main` |
| Commit SHA | `c780569869a77d81db86cf1cd70d9a0e31d232bd` |
| Data commit | 18 settembre 2026, 07:17:44 UTC (09:17:44 CEST) |
| Data analisi | 23 settembre 2026 |
| Tree Git | `bcb09ef6eddecd862c04e99a367d41b75855be5a` |

> Questo documento fotografa **esclusivamente il codice e la configurazione presenti nel commit indicato**. Non certifica automaticamente lo stato di un ambiente già pubblicato, del database remoto, del DNS o di servizi esterni. Le affermazioni dipendenti dall'ambiente sono indicate come tali e sono approfondite in `docs/VERIFICATION-MATRIX.md`.

## Metodo dell'audit

L'analisi è stata eseguita sul tree Git del commit HEAD di `main`, leggendo direttamente codice applicativo, route API, schema e migrazioni, hook, script, configurazioni, test e workflow GitHub Actions. README e documenti preesistenti sono stati usati solo come materiale da confrontare con l'implementazione, non come fonte primaria.

Il tree analizzato contiene 204 file. Non sono state apportate modifiche al codice applicativo e non sono stati corretti bug durante l'audit.

## Struttura significativa della repository

```text
.
├── .github/workflows/check.yml
├── .openai/hosting.json
├── app/
│   ├── api/
│   │   ├── account/route.ts
│   │   ├── auth/{login,logout,recover,register,security}/route.ts
│   │   ├── diary/route.ts
│   │   ├── classes/...
│   │   ├── class-events/[eventId]/subscription/route.ts
│   │   └── class-agenda/...
│   ├── app/page.tsx
│   ├── layout.tsx
│   ├── page.tsx
│   ├── robots.ts
│   └── sitemap.ts
├── components/
│   ├── ipagell-app.tsx
│   ├── account-gate.tsx
│   ├── account-security.tsx
│   ├── entry-dialog.tsx
│   ├── absences-view.tsx
│   ├── stats-view.tsx
│   ├── classes-view.tsx
│   ├── class-events-panel.tsx
│   ├── diary-empty-state.tsx
│   ├── legacy-entry-redirect.tsx
│   └── ui/...
├── db/
│   ├── schema.ts
│   └── schema 2.ts
├── drizzle/
│   ├── 0000_glorious_crusher_hogan.sql
│   ├── 0001_amused_tombstone.sql
│   ├── 0002_loving_roland_deschain.sql
│   ├── 0003_melted_dark_phoenix.sql
│   ├── 0004_glossy_stranger.sql
│   └── meta/...
├── docs/...
├── hooks/
│   ├── use-diary.ts
│   ├── use-class-agenda.ts
│   └── use-mobile.ts
├── lib/
│   ├── account-storage.ts
│   ├── auth-validation.ts
│   ├── calculations.ts
│   ├── new-diary.ts
│   ├── validation.ts
│   ├── classes/...
│   └── server/...
├── public/
│   ├── manifest.webmanifest
│   ├── offline.html
│   ├── sw.js
│   ├── icons/...
│   └── splash/...
├── scripts/...
├── tests/
│   ├── api-smoke.mjs
│   └── domain.test.ts
├── types/
│   ├── classes.ts
│   └── domain.ts
├── build/sites-vite-plugin.ts
├── drizzle.config.ts
├── drizzle.config 2.ts
├── next.config.ts
├── vite.config.ts
├── wrangler.jsonc
├── package.json
└── package-lock.json
```

## Runtime, framework e versioni esatte

`package.json` dichiara il pacchetto `ipagell` versione `0.1.0`, privato, con Node.js `>=22.13.0`. `package-lock.json` usa `lockfileVersion: 3`.

L'app usa convenzioni Next App Router nel sorgente, ma la build effettiva è orchestrata da **Vinext + Vite + Cloudflare Vite plugin**. Il Worker usa come entry point `vinext/server/fetch-handler`.

### Dipendenze dirette risolte dal lockfile

| Pacchetto | Dichiarato | Versione risolta |
|---|---:|---:|
| `next` | `16.3.4` | `16.3.4` |
| `react` | `19.2.6` | `19.2.6` |
| `react-dom` | `19.2.6` | `19.2.6` |
| `react-server-dom-webpack` | `19.2.6` | `19.2.6` |
| `vinext` | `^1.0.0-beta.10` | `1.0.0-beta.10` |
| `vite` | `8.0.13` | `8.0.13` |
| `@cloudflare/vite-plugin` | `1.37.1` | `1.37.1` |
| `wrangler` | `4.92.0` | `4.92.0` |
| `@cloudflare/workers-types` | `4.20260515.1` | `4.20260515.1` |
| `drizzle-orm` | `0.45.2` | `0.45.2` |
| `drizzle-kit` | `0.31.10` | `0.31.10` |
| `typescript` | `5.9.3` | `5.9.3` |
| `eslint` | `9.39.4` | `9.39.4` |
| `eslint-config-next` | `16.3.4` | `16.3.4` |
| `tsx` | `^4.22.1` | `4.22.1` |
| `tailwindcss` | `4.2.1` | `4.2.1` |
| `@tailwindcss/postcss` | `4.2.1` | `4.2.1` |
| `@vitejs/plugin-react` | `6.0.2` | `6.0.2` |
| `@vitejs/plugin-rsc` | `^0.5.35` | `0.5.35` |
| `zod` | `^3.25.76` | `3.25.76` |
| `recharts` | `^3.8.0` | `3.8.0` |
| `react-hook-form` | `^7.85.0` | `7.85.0` |
| `@hookform/resolvers` | `^5.7.1` | `5.7.1` |
| `lucide-react` | `^1.31.0` | `1.31.0` |
| `sonner` | `^2.0.8` | `2.0.8` |
| `@base-ui/react` | `^1.7.0` | `1.7.0` |
| `@shadcn/react` | `^0.3.0` | `0.3.0` |
| `radix-ui` | `^1.6.7` | `1.6.7` |
| `class-variance-authority` | `0.7.1` | `0.7.1` |
| `clsx` | `2.1.1` | `2.1.1` |
| `cmdk` | `^1.1.1` | `1.1.1` |
| `date-fns` | `^4.4.0` | `4.4.0` |
| `embla-carousel-react` | `^8.6.0` | `8.6.0` |
| `input-otp` | `^1.4.2` | `1.4.2` |
| `next-themes` | `^0.4.6` | `0.4.6` |
| `react-day-picker` | `^10.0.1` | `10.0.1` |
| `react-resizable-panels` | `^4.12.2` | `4.12.2` |
| `tailwind-merge` | `3.6.0` | `3.6.0` |
| `tw-animate-css` | `^1.4.0` | `1.4.0` |
| `vaul` | `^1.1.2` | `1.1.2` |
| `@types/node` | `22.19.19` | `22.19.19` |
| `@types/react` | `19.2.14` | `19.2.14` |
| `@types/react-dom` | `19.2.3` | `19.2.3` |

### Configurazione frontend/toolchain

- `vite.config.ts`: plugin `vinext()`, plugin Sites vendorizzato `sites({ mockAuth: false })`, `@cloudflare/vite-plugin` per ambiente RSC/SSR.
- `next.config.ts`: redirect host verso il dominio canonico; non definisce un server Next tradizionale separato.
- `postcss.config.mjs`: abilita `@tailwindcss/postcss`.
- `tsconfig.json`: `strict: true`, `noEmit: true`, `moduleResolution: "bundler"`, alias `@/*`, tipi Node e Cloudflare Workers.
- `eslint.config.mjs`: Next core web vitals + TypeScript; eccezioni per `components/ui/**` e `hooks/use-mobile.ts`, descritti come file vendorizzati Shadcn.
- `components.json`: configurazione Shadcn con stile `new-york`, RSC e TypeScript. Il campo CSS punta a `app/globals.css`, mentre il layout importa `app/globals-new.css`; quindi questo file è una configurazione di tooling/registry, non la fonte effettiva del CSS caricato dall'app.
- `.npmrc`: disabilita audit automatico, messaggi funding e update notifier. L'audit dipendenze non viene quindi eseguito implicitamente da npm.

## Entry point e routing

### Entry point runtime

- Worker: `vinext/server/fetch-handler`, configurato in `wrangler.jsonc` e nella configurazione Vite locale.
- Layout applicativo: `app/layout.tsx`.
- Landing pubblica: `app/page.tsx` → `/`.
- Area diario: `app/app/page.tsx` → `/app`.

### Pagine effettive

| Percorso | Implementazione | Comportamento corrente |
|---|---|---|
| `/` | `app/page.tsx` | Landing pubblica server-rendered; verifica la sessione e reindirizza a `/app` se già autenticato. |
| `/app` | `app/app/page.tsx` | Monta `IPagellApp`; `?mode=register` seleziona la registrazione come modalità iniziale. |
| `/robots.txt` | `app/robots.ts` | Consente `/`, disabilita crawling di `/app` e `/api/`. |
| `/sitemap.xml` | `app/sitemap.ts` | Contiene solo la root canonica. |

Le viste **Home, Agenda, Voti, Assenze, Statistiche e Classi non sono route Next separate**: sono tab client-side gestiti dentro `components/ipagell-app.tsx`.

`DiaryWorkspace` interpreta parametri client:

- `?view=agenda` → tab Agenda;
- `?view=classes` oppure hash `#join=...` → tab Classi;
- `?action=grade` → tab Voti + apertura del dialog di inserimento voto.

`components/legacy-entry-redirect.tsx` trasferisce query legacy (`view`, `action`, `source`) e hash di invito dalla landing a `/app`.

## API realmente presenti

Le route seguenti esistono nel tree e sono incluse nel route report della build del commit analizzato.

| Metodo | Percorso | Implementazione | Funzione verificata |
|---|---|---|---|
| `GET` | `/api/account` | `app/api/account/route.ts` | Legge identità da cookie e restituisce account + snapshot diario o `null`. |
| `POST` | `/api/account` | stesso file | Crea il primo diario autenticato, revisione iniziale 1. |
| `POST` | `/api/auth/register` | `app/api/auth/register/route.ts` | Crea account, password hash, codice recupero, sessione. |
| `POST` | `/api/auth/login` | `app/api/auth/login/route.ts` | Verifica credenziali e crea una nuova sessione. |
| `POST` | `/api/auth/logout` | `app/api/auth/logout/route.ts` | Revoca la sessione corrente e scade il cookie. |
| `POST` | `/api/auth/recover` | `app/api/auth/recover/route.ts` | Verifica codice recupero, cambia password, ruota codice, incrementa `auth_version`, invalida sessione browser. |
| `POST` | `/api/auth/security` | `app/api/auth/security/route.ts` | Cambio password o cancellazione account previa ri-autenticazione. |
| `PUT` | `/api/diary` | `app/api/diary/route.ts` | Aggiorna l'intero snapshot con compare-and-swap sulla `revision`. |
| `GET` | `/api/classes` | `app/api/classes/route.ts` | Elenca le classi dell'utente. |
| `POST` | `/api/classes` | stesso file | Crea una classe; massimo 20 classi possedute. |
| `POST` | `/api/classes/join` | `app/api/classes/join/route.ts` | Entra in una classe tramite codice invito valido. |
| `GET` | `/api/classes/:classId` | `app/api/classes/[classId]/route.ts` | Dettaglio classe e membri, previa appartenenza. |
| `PATCH` | `/api/classes/:classId` | stesso file | Modifica nome/descrizione; proprietario. |
| `DELETE` | `/api/classes/:classId` | stesso file | Elimina classe; proprietario. |
| `GET` | `/api/classes/:classId/invites` | `app/api/classes/[classId]/invites/route.ts` | Elenca metadati inviti; owner/moderator. |
| `POST` | `/api/classes/:classId/invites` | stesso file | Genera un invito con scadenza/usi; ritorna il codice in chiaro alla creazione. |
| `DELETE` | `/api/classes/:classId/invites/:inviteId` | `app/api/classes/[classId]/invites/[inviteId]/route.ts` | Revoca un singolo invito. |
| `GET` | `/api/classes/:classId/members/:userId` | `app/api/classes/[classId]/members/[userId]/route.ts` | Legge il membro entro il contesto autorizzato. |
| `PATCH` | `/api/classes/:classId/members/:userId` | stesso file | Modifica nome visibile, ruolo o trasferisce proprietà secondo permessi. |
| `DELETE` | `/api/classes/:classId/members/:userId` | stesso file | Uscita/rimozione con regole ruolo/proprietà. |
| `GET` | `/api/classes/:classId/events` | `app/api/classes/[classId]/events/route.ts` | Elenca eventi condivisi della classe, massimo 500 restituiti. |
| `POST` | `/api/classes/:classId/events` | stesso file | Crea evento condiviso; qualsiasi membro della classe può creare. |
| `PATCH` | `/api/classes/:classId/events/:eventId` | `app/api/classes/[classId]/events/[eventId]/route.ts` | Modifica evento con controllo revisione e permessi autore/moderatore/owner. |
| `DELETE` | `/api/classes/:classId/events/:eventId` | stesso file | Elimina evento con controllo revisione e permessi. |
| `POST` | `/api/class-events/:eventId/subscription` | `app/api/class-events/[eventId]/subscription/route.ts` | Sottoscrive un evento attivo all'agenda privata dell'utente. |
| `GET` | `/api/class-agenda` | `app/api/class-agenda/route.ts` | Restituisce le sottoscrizioni personali ad attività di classe. |
| `PATCH` | `/api/class-agenda/:subscriptionId` | `app/api/class-agenda/[subscriptionId]/route.ts` | Modifica campi personali, scollega o modifica la copia ormai personale, con revisione. |
| `DELETE` | `/api/class-agenda/:subscriptionId` | stesso file | Rimuove una sottoscrizione con revisione attesa. |

### Regole HTTP trasversali

`lib/server/http.ts` implementa:

- limite corpo predefinito `1_500_000` byte;
- limiti più piccoli espliciti su auth e route classi;
- JSON obbligatorio per le mutazioni;
- `Origin` uguale all'origine della richiesta;
- rifiuto `Sec-Fetch-Site: cross-site`;
- lettura streaming con limite anche senza `Content-Length` affidabile;
- risposte `Cache-Control: private, no-store`, `Vary: Cookie`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: same-origin`;
- errori non `HttpError` convertiti in 503 generico.

## Componenti principali

| File | Responsabilità effettiva |
|---|---|
| `components/ipagell-app.tsx` | Orchestratore client principale: account gate, workspace diario, tab, dashboard, agenda, voti, impostazioni, backup, notifiche, class agenda, registrazione service worker. |
| `components/account-gate.tsx` | Login, registrazione, recupero account e onboarding del primo diario. |
| `components/account-security.tsx` | Cambio password e cancellazione account. |
| `components/entry-dialog.tsx` | Moduli di inserimento/modifica per dati personali del diario. |
| `components/absences-view.tsx` | Vista e gestione delle assenze. |
| `components/stats-view.tsx` | Statistiche e grafici basati sui dati del diario. |
| `components/classes-view.tsx` | Elenco/dettaglio classi, membri, ruoli, inviti e azioni amministrative. |
| `components/class-events-panel.tsx` | Eventi condivisi, creazione/modifica/eliminazione, sottoscrizione e dialog della copia personale. |
| `components/diary-empty-state.tsx` | Stati vuoti del diario. |
| `components/legacy-entry-redirect.tsx` | Compatibilità degli ingressi legacy verso `/app`. |
| `components/ui/**` | Primitive UI vendorizzate/registry; l'ESLint le tratta separatamente dal codice applicativo. |

## Hooks e moduli di dominio

### `hooks/use-diary.ts`

È il nucleo dello stato del diario personale.

Stati di sincronizzazione: `saved`, `saving`, `offline`, `conflict`, `error`, `expired`.

Fasi UI: `loading`, `anonymous`, `onboarding`, `ready`, `error`.

Responsabilità:

1. legge `/api/account`;
2. confronta server e copia IndexedDB;
3. consente apertura offline solo su errore di rete, non su un errore API server-side;
4. salva una mutazione locale con `dirty: true` prima della richiesta remota;
5. serializza le operazioni nella singola istanza React con una Promise queue;
6. invia l'intero snapshot a `/api/diary` con `expectedUserId` e `revision`;
7. converte 409 in `conflict`, 401 in `expired`;
8. ritenta su riconnessione/ritorno visibile;
9. consente di scegliere la copia server tramite `useServer()`.

Non implementa un merge automatico, CRDT o coordinamento fra più tab/browser.

### `hooks/use-class-agenda.ts`

Gestisce l'agenda derivata dalle sottoscrizioni di classe:

- cache per account in `localStorage`;
- refresh immediato e ogni 30 secondi;
- refresh su `online` e `visibilitychange`;
- su errore mantiene l'ultima copia cache, salvo sessione invalidata/non trovata;
- mutazioni solo online, tramite API;
- pending per sottoscrizione/evento e lettura finale ordinata dopo scritture concorrenti, tramite `lib/classes/agenda-coordinator.ts`;
- nessuna outbox offline per le scritture condivise.

### Moduli dominio

- `types/domain.ts`: tipi del diario privato.
- `types/classes.ts`: tipi classi/membri/inviti.
- `lib/validation.ts`: schemi Zod del diario, backup, registrazione iniziale e voto.
- `lib/auth-validation.ts`: username/password/credenziali/recupero.
- `lib/calculations.ts`: pesi, medie, voto necessario, trend.
- `lib/new-diary.ts`: creazione del diario iniziale.
- `lib/classes/events.ts`: schema evento condiviso, sottoscrizioni e mapping all'agenda.
- `lib/classes/permissions.ts`: ruoli e matrice permessi.
- `lib/classes/validation.ts`: validazione classi e codici invito.
- `lib/classes/backup.ts`: conversione delle attività di classe in copie personali nel backup.
- `lib/classes/client.ts`: client HTTP delle classi, controllo account e invalidazione cache.

## Modello dati del diario personale

`types/domain.ts` e `lib/validation.ts` definiscono un payload `SchoolData` con `version: 1`:

- `semesters`;
- `subjects` con tipologie voto;
- `grades`;
- `agenda` personale;
- `absences`;
- `preferences` separate nel payload `{ data, preferences }`.

Vincoli principali verificati:

- almeno 1 semestre, massimo 60;
- massimo 150 materie;
- 1–30 tipologie voto per materia;
- massimo 10.000 voti, 10.000 voci agenda e 10.000 assenze;
- voto numerico 1–6;
- pesi/coefficienti 0,1–100;
- riferimenti semestre/materia/tipologia validati;
- oggetti Zod `strict` per evitare campi extra inattesi;
- date calendario validate e timestamp ISO per le scadenze.

Il preset iniziale può essere `empty` oppure `basic`; il vecchio identificatore `sig` viene ancora accettato e trasformato in `basic`. Il preset `basic` crea solo configurazione generica (`Matematica`, `Italiano`, `Inglese`, `Storia`, `Scienze`) e nessun voto/attività/assenza demo.

## Database D1: tabelle e relazioni

La fonte di schema attiva è `db/schema.ts`, indicata da `drizzle.config.ts`.

| Tabella | Funzione | Relazioni/vincoli principali |
|---|---|---|
| `accounts` | Account interni | `id` PK, `username` unico, hash password/recupero, `auth_version`. |
| `sessions` | Sessioni browser | `token_hash` PK; FK `user_id → accounts.id` con cascade; versione credenziali e scadenza. |
| `auth_limits` | Bucket rate limit | Chiave hash PK, contatore e scadenza. |
| `diaries` | Snapshot diario privato | `user_id` PK; **nessuna FK SQL** verso `accounts`; payload JSON e revisione CAS. |
| `classes` | Gruppi classe | `owner_id → accounts.id` con `restrict`; settings JSON. |
| `class_members` | Appartenenze | PK composta `(class_id,user_id)`; FK verso classes/accounts; unico owner per classe; ruolo vincolato. |
| `class_invites` | Inviti | FK classe cascade; `created_by → accounts` restrict; `secret_hash` unico; maxUses/uses vincolati. |
| `class_events` | Attività condivise | FK classe cascade; autore account `set null`; tipo `task/test`; stato `active/cancelled`; revisione. |
| `class_departures` | Ultima uscita/rimozione | PK composta `(class_id,user_id)`; usata per impedire il rientro con inviti precedenti alla partenza. |
| `class_event_subscriptions` | Agenda collegata personale | FK `user_id` cascade; FK `event_id` set null; `source_event_id` non è FK; snapshot JSON; campi personali e revisione. |

### Migrazioni presenti

| Migrazione | Contenuto effettivo |
|---|---|
| `drizzle/0000_glorious_crusher_hogan.sql` | Crea `diaries`. |
| `drizzle/0001_amused_tombstone.sql` | Crea `accounts`, `auth_limits`, `sessions`. |
| `drizzle/0002_loving_roland_deschain.sql` | Crea `classes`, `class_members`, `class_invites`. |
| `drizzle/0003_melted_dark_phoenix.sql` | Crea `class_events`, `class_event_subscriptions` e trigger di mantenimento/detach snapshot. |
| `drizzle/0004_glossy_stranger.sql` | Crea `class_departures` e trigger per registrare l'uscita di un membro. |

`drizzle/meta/_journal.json` contiene tutte e cinque le migrazioni, indici 0–4.

### Trigger correnti relativi agli eventi condivisi

`0003` installa trigger che:

- aggiornano lo snapshot delle sottoscrizioni dopo modifica evento;
- rendono lo snapshot `cancelled` e scollegato prima della cancellazione evento;
- scollegano le sottoscrizioni dell'utente prima della rimozione dalla classe;
- scollegano le sottoscrizioni prima della cancellazione della classe;
- aggiornano `className` negli snapshot quando cambia il nome classe.

`0004` registra `class_departures` prima della rimozione da `class_members`.

## Autenticazione e sessioni

### Password

`lib/server/password.ts` usa `scrypt` Node:

- `N = 16384`;
- `r = 8`;
- `p = 5`;
- output 32 byte;
- salt casuale 16 byte;
- `maxmem = 32 MiB`;
- confronto `timingSafeEqual`;
- un singolo hashing concorrente per isolate, con `HashBusyError` in sovraccarico.

`lib/auth-validation.ts` accetta password nuove di **12–128 caratteri**, rifiutando una stringa formata dalla ripetizione dello stesso carattere.

Nota di coerenza: i messaggi di errore in `app/api/auth/recover/route.ts` e `app/api/auth/security/route.ts` parlano ancora di **15–128 caratteri**, mentre lo schema attivo è 12–128. È una contraddizione di copy presente nel codice, non corretta durante questo audit.

### Sessioni

`lib/server/auth.ts`:

- durata: 14 giorni;
- token casuale: 32 byte, serializzato hex;
- nel DB viene salvato soltanto SHA-256 del token;
- HTTPS: cookie `__Host-ipagell-session`, `HttpOnly`, `Secure`, `SameSite=Lax`, `Path=/`, senza `Domain`;
- HTTP locale: cookie `ipagell-dev-session`, non Secure;
- `identity()` richiede token valido, non scaduto e `auth_version` uguale a quello account;
- cambio password/recupero incrementano `auth_version`, invalidando le sessioni precedenti;
- la pulizia di sessioni scadute e rate-limit scaduti avviene opportunisticamente durante `issueSession()`.

### Recupero

Il codice di recupero è un token casuale di 32 byte hex; nel DB resta solo il digest SHA-256. Registrazione e recupero restituiscono il codice in chiaro al client. Un recupero riuscito ruota sia password sia codice.

### Rate limiting

Finestra fissa 15 minuti, separata per azione:

- 40 tentativi per IP edge;
- 12 per username;
- 400 globali;
- se manca `CF-Connecting-IP`, viene usato il bucket condiviso `unknown`.

Le chiavi dei bucket vengono hashate prima della persistenza.

Non risultano implementati email, OAuth, 2FA o login basato su header Sites/ChatGPT. Il plugin Sites è invocato con `mockAuth: false`; l'app usa il proprio sistema account/cookie.

## Persistenza locale, offline e PWA

### IndexedDB

`lib/account-storage.ts` apre:

- database: `ipagell-db`;
- versione: `2`;
- store `accounts`: corrente, chiave `user.id`;
- store `state`: mantenuto per recupero legacy.

`LocalDiary` contiene snapshot, utente e flag `dirty`.

`saveLocal()`:

1. valida il diario;
2. scrive nello store `accounts`;
3. attende il commit della transazione IndexedDB;
4. aggiorna `localStorage` con l'account attivo.

### localStorage

Chiavi correnti/legacy rilevanti:

- `ipagell-active-account-v2` — puntatore all'account locale attivo;
- `ipagell-class-agenda-v1:<userId>` — cache agenda di classe per account;
- `ipagell-notified-<userId>-<itemId>-<dueAt>` — marker dei promemoria già mostrati;
- `ipagell-preferences-v1` — preferenze legacy lette dal recupero legacy.

### Service worker

`public/sw.js` è un template di build. `scripts/generate-precache.mjs` inserisce:

- hash build;
- lista esatta degli asset JS/CSS/font generati.

Il worker:

- precache shell e asset consentiti;
- non intercetta API, auth, payload RSC o navigazioni arbitrarie;
- per `/` e `/app` usa network-first con fallback cache/offline;
- elimina le vecchie cache `ipagell-shell-*` in activate;
- non chiama `skipWaiting()`;
- gestisce `notificationclick` focalizzando una finestra esistente o aprendo `/app?view=agenda`.

### Manifest PWA

`public/manifest.webmanifest`:

- `start_url: /app?source=pwa`;
- `scope: /`;
- `display: standalone`;
- orientamento portrait-primary;
- icone 192/512/maskable;
- shortcut per nuovo voto, agenda e classi.

La repository contiene icone, `offline.html` e sette splash image iPhone. L'installabilità effettiva su browser/device specifici non può essere certificata dal solo codice.

### Promemoria

I promemoria non sono push schedulati in background. `components/ipagell-app.tsx` controlla le attività quando l'app è attiva, cerca quelle con scadenza entro 12 ore e usa `ServiceWorkerRegistration.showNotification()` se il permesso è già concesso.

## Sincronizzazione del diario

Il flusso corrente è snapshot-based:

```text
mutazione UI
  → useDiary.commit()
  → validazione Zod
  → IndexedDB, dirty=true
  → PUT /api/diary {expectedUserId, revision, diary}
  → UPDATE diaries ... WHERE user_id=? AND revision=?
  → revision + 1
  → IndexedDB, dirty=false
```

In caso di `409` il server non viene forzato. Il client passa a `conflict`; l'UI offre conservazione/esportazione della copia locale oppure caricamento della copia server tramite `useServer()`.

Non esistono:

- merge automatico;
- CRDT;
- log storico degli snapshot;
- coordinamento cross-tab esplicito;
- WebSocket per la sincronizzazione del diario.

La Promise queue di `useDiary` serializza soltanto le operazioni nella singola istanza hook.

## Classi ed eventi condivisi

### Feature gate

Le route classi/eventi chiamano `requireClassesEnabled()`, che accetta solo `IPAGELL_CLASSES=enabled`.

- `wrangler.jsonc` imposta il valore `enabled` per il Worker indipendente configurato nel repository.
- `vite.config.ts` lo imposta nel profilo locale `serve` quando non si usa la config Cloudflare indipendente.
- il valore effettivo nell'ambiente Sites pubblicato non è certificabile dalla repository.

### Ruoli

`lib/classes/permissions.ts`:

- `owner`: tutti i permessi definiti;
- `moderator`: visualizzazione, creazione/modifica contenuto, moderazione, inviti, rimozione membri ordinari;
- `member`: visualizzazione, creazione contenuti e modifica del proprio contenuto.

Le verifiche sono ripetute server-side, non affidate alla UI.

### Inviti

- codice di 12 caratteri non ambigui, mostrato come `XXXX-XXXX-XXXX`;
- digest SHA-256 in DB, non codice in chiaro;
- scadenza 1–30 giorni;
- `maxUses` 1–50;
- revoca singola;
- un utente uscito/rimosso non può rientrare con un invito creato prima della sua partenza, grazie a `class_departures`.

Non è presente un endpoint di “rotazione di tutti gli inviti”.

### Attività condivise

`class_events` conserva:

- materia come **stringa**, non come entità/tabella separata;
- `kind` `task` o `test`;
- titolo, descrizione, scadenza;
- stato `active/cancelled`;
- revisione e timestamp.

Qualsiasi membro può creare un evento. L'autore può modificare/eliminare il proprio; owner/moderator possono moderare gli eventi altrui. Gli update/delete usano revisione ottimistica.

### Sottoscrizioni personali

`class_event_subscriptions` mantiene separati:

- snapshot condiviso dell'evento;
- semestre personale;
- materia personale opzionale;
- completamento;
- reminder;
- revisione della sottoscrizione;
- eventuale `detached_at`.

La sottoscrizione viene resa autonoma se l'evento/classe scompare o l'utente perde l'appartenenza. L'utente può anche “Scollega dalla classe”; a quel punto la copia può essere modificata come attività personale senza più aggiornamenti dalla classe.

### Cache/aggiornamento classi

`useClassAgenda` aggiorna:

- ogni 30 secondi quando la pagina è visibile;
- al ritorno online;
- al ritorno in foreground.

Non c'è realtime push/WebSocket. Offline è disponibile soltanto l'ultima cache di lettura; le mutazioni classi/sottoscrizioni richiedono rete.

## Backup

`lib/account-storage.ts` esporta un JSON contenente solo:

- `app: "iPagell"`;
- data export;
- `data`;
- `preferences`.

Non contiene `userId`, cookie o token.

`lib/classes/backup.ts` integra le attività di classe selezionate trasformandole in voci agenda **personali**, senza ricreare membership/inviti. Le copie cancellate/annullate vengono conservate con indicazione e reminder disattivato.

## Integrazione browser `document.modelContext`

`components/ipagell-app.tsx` contiene integrazione opzionale con `document.modelContext`, eseguita solo se il browser espone `registerTool`:

- `read_school_summary`: legge media generale, attività aperte e ore di assenza del semestre corrente;
- `create_grade`: crea un voto tramite lo stesso percorso locale/sync del diario.

Questa è integrazione browser condizionale; non è uno “spazio studio AI” server-side e non introduce un modello LLM, OCR, embeddings o vector store nella repository.

## Cloudflare Workers / D1 / Sites

### Worker indipendente

`wrangler.jsonc` definisce:

- nome Worker `ipagell`;
- main `vinext/server/fetch-handler`;
- compatibility date `2026-09-16`;
- flag `nodejs_compat`;
- `workers_dev: true`;
- variabile `IPAGELL_CLASSES=enabled`;
- binding D1 `DB`, migrations dir `drizzle`;
- observability/log attivi.

Gli identificativi infrastrutturali presenti nel file non sono riprodotti qui.

### Configurazione Sites

`.openai/hosting.json` dichiara:

- un project ID Sites, omesso qui;
- binding D1 `DB`;
- `r2: null`.

`vite.config.ts` legge questa configurazione e costruisce binding locali. `build/sites-vite-plugin.ts`, vendorizzato da `@openai/sites-vite-plugin 0.2.0`, copia `hosting.json` e la directory `drizzle` in `dist/.openai` durante il build.

`cloudflare-env.d.ts` permette `DB?: D1Database`, `BUCKET?: R2Bucket` e `IPAGELL_CLASSES?: string`; tuttavia `.openai/hosting.json` non configura R2 e nessun flusso applicativo usa un bucket R2 nel codice analizzato.

## Build, test, lint e script

| Script | Comando effettivo |
|---|---|
| `npm run install:ci` | `node scripts/install-ci.mjs` |
| `npm run dev` | `node scripts/run-framework.mjs dev` |
| `npm run build` | build Vinext/Vite + `generate-precache.mjs` |
| `npm run build:cloudflare` | build con `IPAGELL_DEPLOY_TARGET=cloudflare` + precache |
| `npm run deploy:cloudflare` | avvia `deploy-cloudflare.mjs` **senza `--sandbox` e termina intenzionalmente con errore** |
| `npm run deploy:sandbox` | build Cloudflare, dry-run Wrangler, migrazioni remote, deploy Worker indipendente |
| `npm run check` | lint + TypeScript + unit test + docs check |
| `npm run release:prepare` | `check` + build |
| `npm test` | `tsx --test tests/*.test.ts` |
| `npm run test:api` | `node tests/api-smoke.mjs` |
| `npm run docs:check` | `node scripts/check-docs.mjs` |
| `npm run start` | Wrangler dev su output build con D1 locale persistito |
| `npm run lint` | ESLint su repository, esclusi dist/.next |

### Test presenti

- `tests/domain.test.ts`: test unitari/dominio con Node test runner.
- `tests/api-smoke.mjs`: suite API locale separata.

Non risultano Playwright, Cypress o un'altra suite E2E browser nel tree analizzato.

## CI effettivamente eseguita sul commit analizzato

Workflow: `.github/workflows/check.yml`, nome **Controlli iPagell**.

Trigger:

- push su `main`;
- pull request;
- `workflow_dispatch`.

Il workflow usa `actions/checkout@v4`, `actions/setup-node@v4` con Node 22, `npm run install:ci`, quindi `npm run release:prepare`. Non effettua deploy.

Per **questo esatto commit** GitHub Actions mostra il run `35318742358`, conclusione `success`, job `check` concluso `success`. I log del job confermano checkout di `c780569869a77d81db86cf1cd70d9a0e31d232bd` e:

- Node `v22.23.2`;
- npm `10.9.8`;
- lint completato;
- `tsc --noEmit` completato;
- 13 test unitari eseguiti, 13 passati, 0 falliti;
- docs check: 16 documenti e 63 link locali verificati;
- build Vinext/Vite completata;
- 12 asset hashati preparati per la shell offline.

Il build ha emesso un warning Vite: alcuni chunk client superano 500 kB dopo minificazione.

**Non** risulta eseguito nello stesso workflow:

- `npm run test:api`;
- `npm audit`;
- un test browser fisico;
- test di carico;
- penetration test.

Quindi questo documento non dichiara tali verifiche come superate sul commit HEAD.

## Deployment implementato nella repository

### Produzione Sites

I file `AGENTS.md` e `docs/DEPLOYMENT.md` dichiarano `https://ipagell.website` come produzione Sites. Il codice contiene redirect e metadati coerenti con quel dominio. Tuttavia la repository da sola non prova che:

- il dominio stia servendo questo esatto commit;
- il progetto Sites associato sia attivo;
- il binding D1 in produzione punti allo schema/migrazioni attesi;
- gli alias descritti siano configurati lato piattaforma.

Questi punti sono quindi **NON VERIFICABILI dalla sola repository**.

### Worker indipendente/sandbox

`npm run deploy:sandbox` è un percorso operativo implementato. Esegue:

1. build in modalità Cloudflare indipendente;
2. `wrangler deploy --dry-run`;
3. `wrangler d1 migrations apply` sul database configurato nel file Wrangler;
4. `wrangler deploy`.

`npm run deploy:cloudflare`, senza flag sandbox, si ferma intenzionalmente con un messaggio che indica di non usarlo per `ipagell.website`.

### CI

Non è presente un workflow GitHub Actions che esegua deploy su Sites o sul Worker. La CI attuale è solo di verifica/build.

## Configurazioni rilevanti senza segreti

- `.openai/hosting.json`: project id presente ma omesso; D1 `DB`; nessun R2.
- `wrangler.jsonc`: database id presente ma omesso; binding `DB`; classi abilitate nel profilo Worker indipendente.
- `.gitignore`: esclude `.env*`, `.wrangler/`, `.sites-runtime/`, output/build locali e file sensibili `.pem`.
- `cloudflare-env.d.ts`: tipi ambiente opzionali per D1/R2/class flag.
- `next.config.ts`: redirect host canonico.
- `app/layout.tsx`: contiene anche redirect client-side dagli alias noti al dominio canonico.

Nessuna chiave API, password, token sessione o codice recupero è riportato in questo documento.

## Stato attuale, codice non attivo e funzionalità future

### Implementato nel codice corrente

- autenticazione interna username/password + recupero;
- sessioni cookie server-side;
- diario privato, voti, agenda personale, assenze, statistiche;
- persistenza IndexedDB e sincronizzazione snapshot/revision;
- backup/import JSON;
- PWA/service worker/offline shell;
- classi con ruoli/membri/inviti;
- eventi condivisi;
- sottoscrizioni personali ad attività di classe;
- detach/copia personale e cache offline di lettura per l'agenda di classe;
- integrazione browser opzionale `document.modelContext` per due tool.

### Condizionale a configurazione runtime

- tutta la superficie classi/eventi: il server richiede `IPAGELL_CLASSES=enabled`.
- `document.modelContext`: disponibile solo nei browser/runtime che espongono `registerTool`.
- notifiche: dipendono dalle API browser, dal permesso e dal service worker.

### Artefatti presenti ma non parte del percorso attivo principale

- `db/schema 2.ts`: file vuoto/template; `drizzle.config.ts` punta a `db/schema.ts`.
- `drizzle.config 2.ts`: duplicato equivalente, ma gli script standard usano il nome convenzionale `drizzle.config.ts` e nessun riferimento esplicito trovato punta al file “ 2”.
- codice di mock auth dentro `build/sites-vite-plugin.ts`: presente nel vendored plugin, ma `vite.config.ts` lo invoca con `mockAuth: false`, quindi quel percorso non viene attivato dalla configurazione corrente.
- store IndexedDB `state`: non è il percorso corrente del diario; è mantenuto per `legacyBackup()`.

L'inattività dei file duplicati è una deduzione basata sui riferimenti/configurazioni osservati, non una prova di impossibilità assoluta di uso manuale esterno.

### Documentato come futuro/non implementato

Non risultano moduli runtime per:

- spazio studio AI;
- OCR;
- embeddings/vector store;
- upload materiali su R2;
- `class_subjects` normalizzati;
- annunci di classe;
- materiali di classe;
- activity log amministrativo dedicato;
- chat/social feed;
- push notification schedulate ad app chiusa.

I documenti `docs/SPAZIO-STUDIO-AI.md` e `docs/SPAZIO-STUDIO-AI-CONSIDERAZIONI.md` sono quindi materiale di progettazione, non descrizione di funzionalità implementata.

## Documentazione esistente: parti obsolete o contraddittorie

### `SECURITY.md`

La sezione “Funzioni future” afferma che **le classi** e lo spazio studio AI non fanno parte della superficie pubblicata. Rispetto al codice, la parte “classi” è obsoleta: UI, API, tabelle, eventi e sottoscrizioni sono implementati. Resta non verificabile dalla sola repository se il feature flag sia attivo nell'ambiente Sites pubblico. Lo spazio studio AI resta effettivamente futuro.

La tabella “Dove restano i dati” elenca D1 principalmente come account/sessioni/rate-limit/diario e non descrive le tabelle classi/eventi/sottoscrizioni ora presenti.

### `docs/API.md`

La tabella endpoint documenta auth, diario e classi C1, ma manca la superficie realmente implementata per:

- `/api/classes/:classId/events`;
- `/api/classes/:classId/events/:eventId`;
- `/api/class-events/:eventId/subscription`;
- `/api/class-agenda`;
- `/api/class-agenda/:subscriptionId`.

Quindi il documento non è completo per il commit HEAD.

### `docs/ARCHITETTURA.md`

Descrive ancora eventi C2 come futuro e il modello persistente si ferma a classi/membri/inviti. Nel commit HEAD esistono già `class_events`, `class_event_subscriptions`, `class_departures`, le relative route e i trigger.

### `docs/PRODOTTO.md`

La roadmap marca “C02 / Agenda condivisa” come intervento aperto/futuro, ma il codice e `docs/CLASSI.md` mostrano C2/C3 implementati. È una contraddizione interna della documentazione.

Le evidenze di test riportate nella sezione storica del 16 settembre non vanno trattate come risultato automatico del commit corrente; per HEAD si deve usare il run CI specifico descritto sopra.

### `docs/CLASSI.md`

È il documento più vicino al codice attuale e dichiara C1/C2/C3 implementati, ma mescola implementazione e specifiche future:

- `class_subjects`, `class_announcements`, `class_materials`, `class_activity` sono nel “modello dati proposto” ma **non** nello schema corrente;
- la materia dell'evento è oggi `class_events.subject` come testo;
- il documento dice che il proprietario può nascondere l'elenco membri: `classes.settings` viene inizializzato con `membersVisible`, ma non è stato trovato codice che legga/modifichi questa impostazione e `ClassRepository.get()` restituisce i membri a ogni appartenente;
- il flusso narrativo dice che creando una classe si riceve un codice/link: il codice reale crea la classe, mentre l'invito viene generato con una seconda azione/API;
- viene citata la possibilità di “ruotare tutti gli inviti”, ma è implementata solo la revoca del singolo invito;
- annunci e materiali non hanno API/tabelle/UI nel commit.

### `docs/MANUTENZIONE.md`

Il bootstrap locale elenca solo migrazioni `0000`, `0001`, `0002`; il journal e lo schema HEAD includono anche `0003` e `0004`. Quindi quelle istruzioni non ricostruiscono integralmente lo schema corrente su un database nuovo.

### `docs/DEPLOYMENT.md` e `AGENTS.md`

Descrivono la destinazione Sites e la separazione dal Worker indipendente. Il codice e gli script sono coerenti con tale intenzione, ma lo stato effettivo del progetto Sites, dei domini e dei dati remoti non è certificabile osservando il repository.

### `docs/REVIEW.md`

Si presenta esplicitamente come revisione storica del 16 settembre 2026. Va trattato come evidenza storica, non come certificazione automatica dell'HEAD corrente.

## Limiti dell'audit

Osservando soltanto la repository e i metadati GitHub del commit non è possibile certificare:

- che `https://ipagell.website` stia servendo questo esatto SHA;
- che il progetto Sites dichiarato sia attivo o configurato come descritto;
- il valore effettivo di `IPAGELL_CLASSES` nel runtime Sites di produzione;
- che il D1 remoto abbia tutte e sole le migrazioni presenti nel repository;
- contenuto, consistenza, backup, retention o restore effettivo dei database remoti;
- configurazione reale DNS/TLS/alias fuori dal repository;
- segreti/variabili non versionati;
- comportamento di Cloudflare/Sites in caso di failure reale;
- installazione PWA e comportamento offline su tutti i browser/device;
- recapito affidabile di notifiche in background: tale infrastruttura non è implementata nel codice corrente;
- prestazioni con dataset reali/grandi o carico concorrente;
- sicurezza contro vulnerabilità non coperte dai test presenti;
- esito della suite `tests/api-smoke.mjs` sul commit HEAD, perché il workflow CI analizzato non la esegue;
- esito di `npm audit`, test E2E browser, accessibilità completa, test di carico o penetration test sul commit HEAD;
- eventuali processi manuali o servizi esterni non rappresentati nel repository.

L'audit può quindi certificare **struttura, codice, configurazioni versionate, migrazioni, script e il run CI specifico associato allo SHA analizzato**, ma non lo stato operativo dell'infrastruttura esterna.
