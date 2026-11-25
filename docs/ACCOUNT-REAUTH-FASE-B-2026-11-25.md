# Fase B — Conferma Google senza uscire: 25 novembre 2026

[Indice](README.md) · [Analisi gestione account](ANALISI-GESTIONE-ACCOUNT-2026-11-25.md) · [Fase A](ACCOUNT-SESSIONI-FASE-A-2026-11-25.md) · [API](API.md) · [Sicurezza](../SECURITY.md)

**Implementato il 25 novembre 2026 sul ramo `feat/account-reauth` (dalla fase A), non pubblicato.** Chiude la lacuna L3 dell'[analisi](ANALISI-GESTIONE-ACCOUNT-2026-11-25.md) e prepara il collegamento dei metodi (fase D). Resta in modalità `7/legacy`, senza nuove migrazioni.

## 1. Problema

Per eliminare un account Google serviva una sessione emessa da meno di 10 minuti. L'unico modo era uscire e rientrare, ma:

- l'avvio dell'accesso Google rifiutava con 409 se c'era già una sessione;
- il logout cancellava la copia locale del diario e si bloccava con modifiche in attesa.

Inoltre la regola dei 10 minuti valeva per qualsiasi sessione recente, anche aperta da un'altra persona sullo stesso browser.

## 2. Decisione del proprietario

Google non supporta `prompt=login` e restituisce `auth_time` solo se richiesto con `claims` e abilitato nelle impostazioni di Google Auth Platform; `max_age` non è documentato nella guida OIDC di Google. Il proprietario ha scelto la **conferma con l'account Google attivo**: basta che Google confermi lo stesso account, senza imporre una nuova password Google. Nessuna modifica nella console Google.

## 3. Flusso

```text
Impostazioni → Sicurezza → «Conferma con Google»
  → flush degli editor → POST /api/auth/oauth/google/start { purpose: "reauth", expectedUserId }
  → transazione purpose='reauth' (account, sessione, auth_version) → Google con login_hint=sub, prompt=select_account
  → callback: stessa sessione del browser? stesso (issuer, sub)? → riga auth_grants monouso, 10 minuti
  → /app?accesso=reauth-ok → Impostazioni → Preferenze, pannello aperto, focus sulla conferma
  → POST /api/auth/security { operation: "delete" } consuma il grant nello stesso batch dell'eliminazione
```

Nessuna nuova sessione, nessun logout: diario locale e modifiche in attesa restano intatti.

## 4. Server

- **`auth_transactions`** (0007): `purpose='reauth'` con `account_id`, `session_hash`, `auth_version`. L'inserimento richiede la sessione valida dell'account alla stessa versione e un'identità Google attiva. Le transazioni di accesso restano senza account.
- **`auth_grants`** (0007): `operation='reauth'`, `method='google'`, `target=account_id`, scadenza 10 minuti, legata a sessione e `auth_version`. Il nome generico è voluto: qualsiasi operazione sensibile futura (collegamento, scollegamento) consuma lo stesso tipo di grant, che è monouso. Una nuova conferma sostituisce quella aperta della stessa sessione; i grant scaduti vengono tolti alla conferma successiva o con l'account.
- **Callback**: per `reauth` richiede che il cookie di sessione del browser sia quello che ha avviato la conferma, poi verifica l'ID token come per l'accesso. `sub` diverso → `reauth-mismatch`, nessun grant. Il consumo della transazione ricontrolla identità, sessione e versione nello stesso batch che crea il grant.
- **Eliminazione**: per gli account senza password il batch prima consuma il grant e ogni effetto (inviti, diario, account) richiede quel consumo. Senza grant valido: 403 `SECURITY_REAUTH_REQUIRED`.
- **`GET /api/auth/security`**: `method` e `reauthUntil`, così il pannello sa se la conferma è ancora valida anche dopo una ricarica.
- **Rimosso**: `sessionAgeSeconds` e la regola dei 10 minuti dalla sessione.
- **Password**: invariato. La password corrente è inviata nella stessa richiesta dell'operazione sensibile, quindi è già una prova contestuale; i grant servono ai provider con reindirizzamento. È una differenza rispetto alla proposta dell'analisi («lo stesso grant anche per la password»), scelta per non aggiungere un passo agli account con password.

## 5. Interfaccia

`components/account-security.tsx`, per gli account Google:

- senza conferma valida: spiegazione, pulsante «Conferma con Google» (disattivato con modifiche non sincronizzate, come le altre operazioni di sicurezza) e nota «non esci da iPagell»;
- con conferma valida: «Account Google confermato. Puoi eliminare l'account fino alle HH:MM» in un'area `role="status"`, poi il modulo di eliminazione esistente;
- al ritorno da Google: Impostazioni aperte su Preferenze, pannello aperto, focus sul campo di conferma (riuscita) o sul pulsante (annullata, altro account, errore) con messaggio in `role="alert"`. Il parametro `accesso` viene tolto dall'indirizzo.

La conferma digitando l'handle `u_…` resta: la sua sostituzione è nella fase C.

## 6. Prove

- **Unitarie**: `login_hint` solo per la conferma, `prompt=select_account` sempre.
- **D1 reale** (`npm run test:auth-d1`, 9 prove nuove, 50/50): transazione solo con sessione, versione e identità Google valide; transazioni di accesso non legate; altro account Google → nessun grant; grant per la sola sessione d'avvio, una sola volta; sostituzione del grant aperto; sessione chiusa nel frattempo → nessun grant; eliminazione rifiutata senza grant, da un'altra sessione o con grant scaduto; eliminazione con grant che rimuove account, identità, sessioni e grant senza toccare altri account.
- **API locale** (`tests/api-smoke.mjs`): stato di sicurezza senza sessione 401; account con password `{ method: "password", reauthUntil: null }`; avvio della conferma rifiutato senza sessione, per un account con password e con corpo non strict.
- **Browser** (dev locale, account Google sintetico inserito nel D1 locale): ritorno `reauth-mismatch` con messaggio e focus sul pulsante; clic con Google non configurato in locale → errore gestito senza lasciare la pagina; ritorno `reauth-ok` con grant → messaggio con orario, focus sul campo, eliminazione riuscita e righe dell'account rimosse dal D1 locale.

- **Staging, giro reale con Google** (25 novembre 2026, Worker `72995954`, D1 `ipagell-staging` con la 0009): accesso con Google del proprietario e diario di prova; «Conferma con Google» → Google con `login_hint` e `prompt=select_account` → ritorno con «Account Google confermato … fino alle 20:52», focus sul campo, conferma valida 10 minuti, **una sola sessione** (nessuna nuova sessione creata). Scelta di un altro account Google → «Hai scelto un altro account Google», transazione `failed`, nessun nuovo grant. Eliminazione con la conferma valida → ritorno all'accesso; nel D1 di staging spariti account, identità, sessione, diario e grant, l'altro account già presente intatto, `PRAGMA foreign_key_check` vuoto.

**Non verificato**: l'annullamento sul giro reale (la pagina di scelta account di Google non offre «Annulla»; il ramo `access_denied` è coperto solo dal codice e dalle prove locali dello stesso percorso d'errore). Produzione.

## 7. Fuori perimetro

Pannello Account e conferma senza handle (fase C), collegamento dei metodi (fase D), registro attività (fase E), `auth_time` e nuova password Google (scartati dal proprietario).
