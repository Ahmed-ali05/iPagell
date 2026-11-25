# Fase C — Pannello «Account» chiaro: 25 novembre 2026

[Indice](README.md) · [Analisi gestione account](ANALISI-GESTIONE-ACCOUNT-2026-11-25.md) · [Fase A](ACCOUNT-SESSIONI-FASE-A-2026-11-25.md) · [Fase B](ACCOUNT-REAUTH-FASE-B-2026-11-25.md) · [API](API.md)

**Implementato il 25 novembre 2026 sul ramo `feat/account-panel` (da `main` con A e B), pubblicato in produzione il 25 novembre 2026 (Worker `d97b7254`).** Chiude le lacune L4 e L5 dell'[analisi](ANALISI-GESTIONE-ACCOUNT-2026-11-25.md). Nessuna migrazione, nessun dato nuovo raccolto: il pannello mostra dati già conservati.

## 1. Problema

- Gli account creati con Google hanno solo un handle tecnico casuale `u_…` di 28 caratteri. L'interfaccia lo mostrava come identità («Account @u_…» nelle Impostazioni, «Account: @u_…» nell'onboarding) e chiedeva di digitarlo per eliminare l'account.
- Non c'era un posto che dicesse come si accede all'account, da quando esiste e che cosa iPagell conserva di Google.
- Chi ha un account con nome utente e prova «Continua con Google» crea un secondo account vuoto. Il testo vicino al pulsante («Se non hai ancora un account iPagell, ne viene creato uno nuovo») faceva credere il contrario.

## 2. Cosa cambia

**Impostazioni → Preferenze → «Account»** (`components/account-overview.tsx`), sopra la nota sulla copia offline:

- titolo e «Creato il …» (data lunga nella lingua dell'interfaccia);
- elenco «Metodi d'accesso»: «Nome utente e password» con `@username`, oppure «Google» con «Senza password né codice di recupero»;
- per gli account Google: «iPagell conserva solo l'identificativo del tuo account Google, non email, nome o foto. Per entrare serve quell'account Google.»

Il metodo arriva dalla sessione e compare subito; le date arrivano da `GET /api/auth/security` e, se la richiesta fallisce, vengono semplicemente omesse. La riga della data ha l'altezza riservata, così il pannello non si sposta. Il ramo «Google · Collegato il …» per un account con password è già previsto per la fase D e oggi non può comparire.

**Eliminazione di un account Google** (`components/account-security.tsx`): dopo la conferma Google della fase B si digita una parola fissa nella lingua dell'interfaccia (ELIMINA, LÖSCHEN, SUPPRIMER, DELETE) invece dell'handle. Il server (`lib/account-confirmation.ts`) accetta la parola di qualsiasi lingua, senza distinguere maiuscole e spazi esterni: non sa quale lingua legge la persona, e la protezione vera è la conferma Google. Il campo usa `autocapitalize="characters"`, senza correzione automatica. Una parola sbagliata dà `SECURITY_CONFIRMATION_MISMATCH` con il messaggio «Scrivi la parola indicata per confermare.». Gli account con password continuano a digitare lo username.

**Onboarding**: un account Google vede «Accesso con Google» invece di «Account: @u_…».

**Ingresso**: in modalità accesso, sotto «Continua con Google», «Google apre solo gli account creati con Google. Se ti sei registrato con un nome utente, accedi qui sotto.» Il testo di consenso dice ora «Se non hai ancora un account con Google, ne viene creato uno nuovo.»

**Nota sulla copia offline**: perde il prefisso «Account @…» (l'account è nel pannello sopra) e l'icona non si restringe più a pochi pixel nelle colonne strette.

**Interno**: la prop `accountEmail`, che non conteneva un'email, diventa `accountHandle`; il marchio Google passa da `account-gate.tsx` a `components/google-mark.tsx`, condiviso.

## 3. Server

- `AuthRepository.profile(accountId, mode)`: `created_at` dell'account e identità attive come `{ provider, createdAt }`. Mai `issuer` né `subject`. Con lo schema 6 (`legacy-unexpanded`) l'elenco è vuoto.
- `GET /api/auth/security` aggiunge `createdAt` e `identities` a `method` e `reauthUntil`.
- `POST /api/auth/security` con `operation: "delete"`: per gli account senza password `confirmation` deve essere una parola di `DELETE_WORDS`; il resto (conferma Google consumata nel batch, blocco per le classi possedute) non cambia.

## 4. Prove

- **Controlli completi**: lint, tipi, 168 test unitari, cataloghi, inventario e link documentali, eseguiti in un worktree pulito (i duplicati « 2» non tracciati del checkout fanno fallire tipi e inventario). Lì fallisce solo la prova della patch `braces`, perché `node_modules` era un collegamento al checkout principale; nel checkout principale passa (7/7).

- **Unitarie** (`tests/account-confirmation.test.ts`, 3): una parola per ogni lingua dell'interfaccia; parole accettate con maiuscole e spazi diversi; rifiutati vuoto, varianti, handle `u_…`.
- **D1 reale** (`npm run test:auth-d1`, 51/51, 1 nuova): `profile` per un account Google (data, solo `provider` e `createdAt`), per un account con password (nessuna identità) e per un account inesistente.
- **API locale** (`npm run test:api` contro il server di sviluppo, 171 controlli superati, 3 nuovi): `createdAt` numerico, `identities` vuoto per un account con password, `ELIMINA` rifiutata per un account con password.
- **Browser** (dev locale, D1 locale): ingresso con Google configurato da valori segnaposto in `.dev.vars` (poi rimosso) e nuovo avviso; account Google sintetico inserito nel D1: onboarding con «Accesso con Google», pannello Account in tema scuro senza `u_…`, conferma Google valida inserita nel D1 e campo «Scrivi ELIMINA per confermare» con `autocapitalize="characters"`; l'handle digitato è rifiutato con il nuovo messaggio e lascia account e conferma intatti; «elimina» in minuscolo elimina account, identità, sessione, diario e conferma, senza toccare gli altri 30 account locali. Account sintetico con password: pannello a 320 px in tema chiaro, in italiano e tedesco, conferma ancora con lo username; poi eliminato.

**Non verificato**: spostamento del focus al ritorno da Google (il pannello del browser era nascosto e `requestAnimationFrame` non gira; logica della fase B non modificata), francese e inglese nel browser, lettori di schermo reali, staging e produzione.

## 5. Fuori perimetro

Collegamento dei metodi e scelta di uno username per gli account Google (fase D), registro attività (fase E). L'onboarding di un account Google mostra ancora il passo «Recupero» nella barra di avanzamento, pur non avendo un codice: va rivisto con la fase D.
