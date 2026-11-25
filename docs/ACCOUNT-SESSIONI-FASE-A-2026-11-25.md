# Fase A — Sessioni visibili e revocabili: progetto del 25 novembre 2026

[Indice](README.md) · [Analisi gestione account](ANALISI-GESTIONE-ACCOUNT-2026-11-25.md) · [API](API.md) · [Sicurezza](../SECURITY.md)

**Implementato il 25 novembre 2026 sul ramo `feat/account-sessioni`, pubblicato in produzione il 25 novembre 2026 (Worker `d97b7254`); migrazione 0009 applicata a `ipagell-live`.** Le cinque decisioni del §9 sono state confermate dal proprietario così come proposte. Le differenze fra progetto e codice sono nel §12. Questo documento traduce la fase A dell'[analisi](ANALISI-GESTIONE-ACCOUNT-2026-11-25.md) in schema, API, interfaccia, rilascio e prove. Le scelte segnate come **proposta** attendono conferma del proprietario (§9).

## 1. Obiettivo e perimetro

Chi usa iPagell, con password o con Google, deve poter:

1. vedere dove il proprio account è aperto (tipo di dispositivo, metodo d'accesso, inizio, ultima attività);
2. chiudere una singola sessione su un altro dispositivo;
3. chiudere tutte le altre sessioni con un comando.

Chiude le lacune L1, L2 e in parte L9 dell'analisi. Non tocca il flusso di accesso Google, la riautenticazione (fase B), le Impostazioni account (fase C) né lo schema delle credenziali. Resta in modalità `7/legacy`.

## 2. Stato di partenza verificato

- `sessions` ha solo `token_hash` (PK, SHA-256 del token), `user_id` (FK con cascade), `auth_version`, `expires_at`. Indici su `user_id` e `expires_at` ([schema](../db/schema.ts)).
- Le sessioni vengono create in due punti: `issueSession` in [auth.ts](../lib/server/auth.ts) (login e registrazione) e `finishGoogleLogin` in [auth-repository.ts](../lib/server/auth-repository.ts). Entrambi usano un `INSERT` con le colonne elencate.
- `identity()` è l'unico punto che risolve la sessione per tutte le API private e per la landing SSR. Accetta la sessione solo se `auth_version` coincide con quello dell'account.
- La durata è fissa (14 giorni, `TTL`): oggi l'inizio si ricava come `expires_at - TTL`, ed è ciò che fa `sessionAgeSeconds`.
- Le righe scadute o invalidate (cambio password, recupero) restano finché qualcuno non crea una nuova sessione. Nessun limite al numero di sessioni per account.
- Il trigger della 0007 recinta solo `INSERT` su `sessions`. `UPDATE` e `DELETE` non sono recintati: il logout attuale fa già `DELETE` diretto.
- Il client gestisce già una sessione revocata: ogni API risponde 401, il diario passa allo stato `expired` (export + «Accedi»), le modifiche locali restano in IndexedDB, Appunti e agenda di classe mostrano «sessione scaduta» ([diary-session.ts](../lib/diary-session.ts), [use-notes.ts](../hooks/use-notes.ts), [use-class-agenda.ts](../hooks/use-class-agenda.ts)). **Nessuna modifica necessaria su questo lato.**

## 3. Schema: migrazione 0009

Solo colonne nuove e facoltative: nessuna ricostruzione di tabella, nessun tocco ad `accounts`.

| Colonna | Tipo | Contenuto |
|---|---|---|
| `created_at` | integer, nullable | Millisecondi di emissione |
| `last_seen_at` | integer, nullable | Ultima richiesta autenticata, aggiornata al massimo ogni 15 minuti |
| `method` | text, nullable | `password` oppure `google` |
| `client` | text, nullable | Codice `browser.os` da elenco chiuso (§5); mai lo User-Agent grezzo |

Nella stessa migrazione, dopo gli `ALTER`, un riempimento delle sessioni già aperte:

- `created_at = expires_at - 1209600000` (esatto, perché il TTL è sempre stato fisso);
- `method = 'google'` se l'account ha `password_hash = 'none$google'`, altrimenti `password`;
- `client` e `last_seen_at` restano `NULL`: l'interfaccia mostra «Dispositivo non riconosciuto».

File: `db/schema.ts`, `drizzle/0009_session_metadata.sql` generata con drizzle-kit più l'`UPDATE` di riempimento, `drizzle/meta/0009_snapshot.json`, `_journal.json`. Nessun nuovo indice: le letture filtrano per `user_id`, già indicizzato.

**Compatibilità del rilascio.** `deploy:cloudflare` applica le migrazioni prima del deploy. Nell'intervallo il codice vecchio continua a inserire sessioni con le colonne elencate, quindi le nuove restano `NULL`, e il codice nuovo deve tollerarlo. In caso di rollback il codice vecchio ignora le colonne. Nessuna finestra di sospensione.

**Effetti sui test.** `tests/auth-d1.integration.ts` inserisce sessioni con `INSERT INTO sessions VALUES(...)` posizionale a quattro valori. Funziona finché quei test applicano solo 0000–0008, ma ogni test che applica la 0009 deve elencare le colonne. `scripts/w8a-restore-rehearsal.ts` applica solo 0000–0006 e non è toccato.

## 4. Server

### 4.1 Emissione

- `issueSession(request, userId, version, mode, method)`: nuovo parametro `method`, più `created_at = now` e `client` calcolato dagli header. Login e registrazione passano `password`.
- `finishGoogleLogin`: stessi campi nell'`INSERT` del batch, `method = 'google'`. Il `client` viene calcolato nella route di callback e passato nell'input.
- **Limite per account (proposta: 20 sessioni valide).** Dopo l'emissione, nel batch di pulizia già esistente: eliminare le sessioni dell'utente oltre le 20 più recenti per `expires_at`, più quelle con `auth_version` superato. Senza limite l'elenco crescerebbe a ogni accesso, e un furto ripetuto potrebbe nascondersi tra molte righe.

### 4.2 Ultima attività

In `identity()` si legge anche `s.last_seen_at`. Se è `NULL` o ha almeno 15 minuti, un `UPDATE sessions SET last_seen_at=? WHERE token_hash=? AND (last_seen_at IS NULL OR last_seen_at<=?)`. Al massimo una scrittura ogni 15 minuti per sessione attiva. La condizione nel `WHERE` evita scritture doppie fra richieste concorrenti.

Un errore di questo aggiornamento non deve mai far fallire la richiesta: va catturato e ignorato. Se si vuole togliere la latenza, l'aggiornamento può passare a `waitUntil` di `cloudflare:workers`; va verificato che sia disponibile nell'entry Vinext prima di adottarlo.

### 4.3 Età della sessione

`sessionAgeSeconds` usa `created_at`, con ripiego su `expires_at - TTL` per le righe con `NULL`. Il comportamento della riautenticazione Google per l'eliminazione non cambia. (La [fase B](ACCOUNT-REAUTH-FASE-B-2026-11-25.md) ha poi sostituito questa regola con una conferma Google monouso e rimosso `sessionAgeSeconds`.)

### 4.4 Elenco e revoca

Un piccolo modulo `lib/server/session-repository.ts` con tre operazioni, sempre vincolate a `user_id = utente della sessione corrente`:

- **elenco**: sessioni con `expires_at > now` e `auth_version` uguale a quello dell'account (la stessa regola di `identity()`, così una sessione già invalidata da un cambio password non compare). Ordine: corrente prima, poi `last_seen_at` / `created_at` decrescenti. Massimo 20. Prima della lettura, cancella le righe scadute o invalidate dello stesso utente (pulizia mirata, chiude in parte L9).
- **revoca singola**: `DELETE FROM sessions WHERE user_id=? AND token_hash=? AND token_hash<>?(corrente)`.
- **revoca delle altre**: `DELETE FROM sessions WHERE user_id=? AND token_hash<>?(corrente)`.

**Identificativo esposto.** Il client non riceve mai `token_hash`. Ogni sessione ha un `id` derivato al momento della lettura: i primi 32 caratteri esadecimali di `SHA-256("ipagell-session-id:" + token_hash)`. Per revocare, il server rilegge le sessioni dell'utente (al massimo 20), ricalcola gli `id` e cancella la riga corrispondente. Nessuna colonna o indice in più, e funziona anche per le sessioni nate prima della 0009.

**Perché non incrementare `auth_version`.** Cancellare le righe ha lo stesso effetto immediato su `identity()` e sulle guardie `sessionGuard` delle operazioni sensibili, senza scrivere su `accounts` (tabella recintata dai trigger). L'incremento resta riservato al cambio password e al recupero. Un accesso con password già in corso al momento della revoca può comunque emettere una sessione nuova: è accettabile, perché chi conosce la password può comunque rientrare. Il rimedio è cambiare password, e l'interfaccia lo dice.

**Niente riautenticazione per revocare.** Chiudere sessioni è un'azione protettiva. Chi usa una sessione rubata potrebbe chiudere quella del titolare, ma il titolare rientra con le proprie credenziali e può fare lo stesso. È la scelta di Google, GitHub e Apple. La riautenticazione resta per le azioni distruttive (fase B).

### 4.5 Route `app/api/auth/sessions/route.ts`

Stesso stile di `/api/auth/security`: `dynamic = "force-dynamic"`, risposte `private, no-store`, nessun dato sensibile nei log.

| Metodo | Corpo | Esito |
|---|---|---|
| `GET` | nessuno | 200 `{ sessions: SessionSummary[] }`; 401 `SECURITY_SESSION_REQUIRED` |
| `POST` | `{ operation: "revoke", expectedUserId, id }` | 200 `{ revoked: 0 \| 1 }` |
| `POST` | `{ operation: "revoke-others", expectedUserId }` | 200 `{ revoked: n }` |

```ts
type SessionSummary = {
  id: string;            // 32 hex, derivato
  current: boolean;
  method: "password" | "google" | null;
  client: string | null; // "chrome.android", da elenco chiuso
  createdAt: number | null;
  lastSeenAt: number | null;
  expiresAt: number;
};
```

Controlli del `POST`, nell'ordine: `checkMutation` (Origin, Fetch Metadata, JSON) → `identity` → schema zod `.strict()` con `id` `/^[a-f0-9]{32}$/` e corpo massimo 1 KiB → `expectedUserId === user.id`, altrimenti 401 `ACCOUNT_CHANGED` → `rateLimit(request, user.id, "sessions")` → operazione.

- Revocare la sessione corrente con `revoke` → 400 `SESSIONS_CURRENT`: il client usa il logout normale, che gestisce copia locale e modifiche in attesa.
- `id` inesistente o già revocato → 200 `{ revoked: 0 }`: idempotente, così un nuovo tentativo dopo una risposta persa non mostra un errore.
- Corpo non valido → 400 `SESSIONS_INVALID_INPUT`.

Nessuna risposta rivela se un `id` appartiene a un altro utente: il vincolo `user_id` lo rende semplicemente inesistente.

## 5. Riconoscimento del dispositivo

`lib/server/session-client.ts`: funzione pura `clientCode(headers) → string | null`, testabile senza Worker.

- **Sistema** (`ios`, `android`, `macos`, `windows`, `chromeos`, `linux`): prima l'header `Sec-CH-UA-Platform` (inviato di default dai browser Chromium su HTTPS), poi espressioni regolari sullo User-Agent.
- **Browser** (`safari`, `chrome`, `firefox`, `edge`, `samsung`, `opera`): `Sec-CH-UA` se presente, poi User-Agent. L'ordine conta: Edge, Opera e Samsung contengono anche «Chrome», e Chrome su iOS è `CriOS`.
- Valore fuori elenco → `other`. Header assenti → `null`.
- Limite noto: iPadOS si presenta come macOS. Si mostra «Safari su Mac», senza correggerlo con euristiche.

Si salva solo il codice (per esempio `safari.ios`). La frase visibile («Safari su iPhone o iPad», «Chrome su Android») è tradotta nel client. Niente IP, versione, modello o lingua: è il minimo per riconoscere un dispositivo e non permette di identificare la persona.

## 6. Interfaccia

Posizione: Impostazioni → Preferenze, sotto la nota sulla privacy e sopra «Sicurezza e gestione account». Nuovo componente `components/account-sessions.tsx`, con lo stesso schema di `AccountSecurity`: un `<details>` chiuso, «Dispositivi connessi», che carica l'elenco solo all'apertura, come gli inviti delle classi.

Contenuto, dall'alto:

1. Breve testo: «Qui vedi dove il tuo account è aperto. Chiudere una sessione non cancella la copia offline salvata su quel dispositivo.»
2. Elenco `<ul>`. Ogni riga ha:
   - un'icona Lucide già presente (telefono o computer, secondo il sistema);
   - titolo «Chrome su Android»;
   - una riga secondaria: metodo («Accesso con Google» / «con nome utente») · «Entrato il 20 nov» · «Attivo ora» se l'ultima attività è di meno di 15 minuti, altrimenti data relativa con `Intl.RelativeTimeFormat` nella lingua dell'interfaccia.
   - La riga corrente mostra un'etichetta testuale «Questo dispositivo», non solo un colore, e nessun pulsante: per uscire c'è già «Esci» poco sopra.
   - Le altre righe hanno un pulsante «Esci», con nome accessibile completo («Esci da Chrome su Android»).
3. Se ci sono altre sessioni: pulsante «Esci da tutti gli altri dispositivi», con conferma nel dialogo di rimozione già usato nelle Impostazioni (`setRemoval`).
4. Un suggerimento diverso per metodo d'accesso:
   - password: «Se pensi che qualcuno conosca la tua password, cambiala: chiude anche tutte le sessioni.»
   - Google: «Se pensi che il tuo account Google sia compromesso, proteggilo da Google, poi esci dagli altri dispositivi.»

Comportamento (skill apple-design e microinteractions):

- Nessun aggiornamento ottimistico. Il pulsante passa a «Attendi…» e viene disattivato. La riga sparisce solo dopo la conferma, con transizione di opacità che rispetta `data-reduce-motion` e `prefers-reduced-motion`.
- Esito annunciato in un'area `role="status"` («Sessione chiusa», «Chiuse 3 sessioni»); errori in `role="alert"` vicino all'azione, con i messaggi di `lib/i18n/errors.ts`.
- Focus: dopo una revoca singola passa al pulsante della riga successiva, oppure al titolo dell'elenco se non restano righe. Dopo la revoca di tutte le altre passa al titolo.
- Stati: caricamento (testo, non scheletro animato), elenco vuoto («Nessun altro dispositivo»), errore di rete con «Riprova», 401 coerente con lo stato `expired` già esistente.
- Pulsanti con target ≥ 44 px. Righe che vanno a capo con testo al 200% e a 320 px. Token esistenti (`--surface`, `--line`, `--subtle`), nessuna superficie traslucida.

## 7. Testi, errori e documentazione

- `lib/i18n/messages/{it,de,fr,en}.json`: titolo, testi descrittivi, nomi di browser e sistemi, metodi, «Questo dispositivo», «Attivo ora», azioni, conferme, esiti.
- `lib/i18n/errors.ts`: `SESSIONS_INVALID_INPUT`, `SESSIONS_CURRENT`.
- Da aggiornare **nello stesso rilascio**:
  - [API.md](API.md): nuova riga e sezione;
  - [SECURITY.md](../SECURITY.md): metadati, limite di 20, revoca;
  - [ARCHITECTURE-CURRENT.md](ARCHITECTURE-CURRENT.md) §3: correggere anche «Google non ancora in produzione»;
  - [/legale](../app/legale/page.tsx) e [bozza di informativa](legal/INFORMATIVA-PRIVACY-IT-BOZZA.md): proposta di testo — «Per ogni sessione conserviamo quando è iniziata, l'ultima attività (con precisione di circa 15 minuti), il metodo d'accesso e il tipo di browser e sistema, per mostrarti i dispositivi connessi. Non conserviamo l'indirizzo IP. Questi dati vengono eliminati con la sessione.»;
  - [procedura richieste](legal/PROCEDURA-RICHIESTE-PRIVACY.md): nuove colonne di `sessions`;
  - inventario (`npm run docs:generate`) e conteggio migrazioni in [REPO-SNAPSHOT](REPO-SNAPSHOT.md) e nell'architettura;
  - [CHANGELOG](../CHANGELOG.md).

## 8. Prove

**Unitarie** (`npm test`)
- `tests/session-client.test.ts`: User-Agent reali di Safari iOS, Chrome Android, Chrome iOS (`CriOS`), Edge, Samsung Internet, Firefox, Opera, iPadOS desktop; client hints con e senza User-Agent; header assenti; valori strani mai salvati.
- Funzione dell'`id` derivato: stabile, 32 caratteri, diverso da `token_hash`.

**D1 locale** (`tests/auth-d1.integration.ts`, con 0000–0009)
- Riempimento: `created_at`, `method` password/google corretti; `client` `NULL`.
- Emissione password e Google con i nuovi campi; limite di 20 con cancellazione delle più vecchie e delle invalidate.
- Elenco: esclude scadute, `auth_version` superato e sessioni di altri account.
- Revoca singola e delle altre: la corrente sopravvive; l'`id` di un altro utente non cancella nulla (prova IDOR); idempotenza.
- `last_seen_at`: nessuna scrittura entro 15 minuti, scrittura dopo; un errore di aggiornamento non blocca `identity()`.
- Un `INSERT` con il codice vecchio (quattro colonne) funziona dopo la 0009.

**HTTP** (`tests/auth-http.test.ts`)
- Origin estraneo 403; senza sessione 401; `expectedUserId` diverso 401; corpo extra 400; `SESSIONS_CURRENT`; rate limit 429.

**Browser** (account sintetici, staging)
- Due browser sullo stesso account, uno con password e uno con Google: elenco corretto, revoca reciproca, lato revocato in `expired` con modifiche non sincronizzate conservate ed esportabili.
- «Esci da tutti gli altri» con tre sessioni.
- Tastiera e focus, 320/390 px, chiaro/scuro, quattro lingue, Riduci movimento acceso.

**Rilascio**: `npm run check`, `test:auth-d1`, `release:prepare`; deploy su staging (`--env staging`) con prova browser; poi produzione da `main` secondo [DEPLOYMENT](DEPLOYMENT.md), con verifica dopo il deploy di `GET /api/auth/sessions` 401 senza sessione e dell'elenco con un account sintetico.

## 9. Decisioni da confermare

| # | Domanda | Proposta (confermata) |
|---|---|---|
| 1 | Metadati del dispositivo | Solo codice browser + sistema, niente IP |
| 2 | Precisione dell'ultima attività | 15 minuti |
| 3 | Limite di sessioni per account | 20, le più vecchie chiuse in automatico |
| 4 | Riautenticazione per revocare | No |
| 5 | Testo di `/legale` | Quello del §7, pubblicato insieme alla funzione |

## 10. Fuori perimetro

- **Pulizia periodica globale** (Cron Trigger): l'entry attuale è `vinext/server/fetch-handler` e non espone un gestore `scheduled`. Serve un entry Worker proprio che lo avvolga. È un compito separato; la fase A riduce il problema con la pulizia mirata per utente.
- Notifica di nuovo accesso e registro eventi (fase E), riautenticazione in-place (fase B), rinomina dell'handle `u_…` (fase C).
- Riconoscimento della PWA installata come dispositivo distinto: non è rilevabile lato server senza un header aggiuntivo dal client.

## 11. Suddivisione suggerita del lavoro

Un solo ramo e una PR (`feat/account-sessioni`), in tre commit verificabili:

1. **Schema e server**: 0009, `session-client`, emissione, `identity`, repository, route, test unitari/D1/HTTP.
2. **Interfaccia**: `account-sessions.tsx`, montaggio nelle Impostazioni, CSS, i18n, prove browser.
3. **Documentazione e testi legali**: §7.

## 12. Esito dell'implementazione

Codice: [migrazione 0009](../drizzle/0009_session_metadata.sql), [session-client](../lib/server/session-client.ts), [session-repository](../lib/server/session-repository.ts), [vocabolario condiviso](../lib/session-devices.ts), [route](../app/api/auth/sessions/route.ts), [interfaccia](../components/account-sessions.tsx). Differenze rispetto al progetto:

- Tutto l'SQL delle sessioni (`resolve` per `identity()`, `insert`, potatura, elenco, revoca) sta in `SessionRepository`, così le prove D1 lo eseguono senza il runtime Worker. `identity()` e `issueSession` restano in `auth.ts` come involucri.
- La condizione dell'aggiornamento di `last_seen_at` è `<=`: con `<` la scrittura a 15 minuti esatti veniva saltata (trovato dalle prove D1).
- `waitUntil` non è adottato: l'aggiornamento resta in linea, al massimo una volta ogni 15 minuti per sessione, e i suoi errori sono ignorati.
- Alla nuova sessione `last_seen_at` coincide con `created_at`. La sessione corrente è mostrata sempre «Attivo ora».
- La lettura dell'elenco toglie solo le righe scadute o invalidate; il limite di 20 si applica all'emissione (login, registrazione e dopo il callback Google, dove un errore non blocca l'accesso).
- Il riconoscimento tratta come Safari anche le pagine iOS senza «Safari/» (app sulla schermata Home) e legge solo i primi 512 caratteri dello User-Agent.
- Le prove HTTP sono nella suite [api-smoke](../tests/api-smoke.mjs) (servono il runtime e un server locale), non in `auth-http.test.ts`.
- Un database locale deve avere la 0009 applicata: senza, accesso e sessioni falliscono ([Manutenzione](MANUTENZIONE.md)).

Prove ed esiti: [matrice di verifica](VERIFICATION-MATRIX.md). Restano da fare: staging con due browser reali (password e Google), poi produzione da `main`.
