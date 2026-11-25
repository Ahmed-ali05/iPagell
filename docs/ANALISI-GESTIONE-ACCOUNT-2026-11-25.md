# Gestione e controllo dell'account — analisi del 25 novembre 2026

[Indice](README.md) · [Architettura](ARCHITECTURE-CURRENT.md) · [Account standard (W7)](improvement-2026-10-01/AUTH-PRODUCT-AUDIT.md) · [Sicurezza](../SECURITY.md)

**Solo analisi: nessun codice, migrazione o pubblicazione.** Obiettivo: capire che cosa manca perché una persona possa vedere e governare il proprio account, con attenzione agli account creati con «Continua con Google» (in produzione dal 19 novembre 2026, Worker `0c792282`, vedi [DEPLOYMENT](DEPLOYMENT.md)).

Fonti lette: `lib/server/auth.ts`, `auth-repository.ts`, `google-auth.ts`, `google-oidc.ts`, le route `app/api/auth/**` e `app/api/account`, `components/account-security.tsx`, `account-gate.tsx`, le Impostazioni in `components/ipagell-app.tsx`, `lib/diary-session.ts`, `db/schema.ts`, `drizzle/0007`/`0008`, la pagina `/legale` e le analisi legali del 18 novembre.

## 1. Stato attuale verificato nel codice

| Funzione | Account con password | Account Google |
|---|---|---|
| Accesso | username + password, rate limit IP/utente/globale | OIDC code + PKCE, scope `openid`, `prompt=select_account` |
| Identificativo mostrato | username scelto | handle tecnico casuale `u_` + 26 caratteri |
| Recupero | codice di recupero monouso | nessuno: dipende solo dall'account Google |
| Cambio password | sì, incrementa `auth_version` e chiude le altre sessioni | non disponibile |
| Chiudere le sessioni altrove | solo indirettamente, cambiando password | **nessun modo** |
| Vedere sessioni/dispositivi | no | no |
| Riautenticazione per operazioni sensibili | password corrente | sessione emessa da meno di 10 minuti (`sessionAgeSeconds`) |
| Eliminazione account | password + digitare lo username | accesso recente + digitare l'handle `u_…` |
| Collegare un altro metodo | no | no |
| Storico eventi di sicurezza | no | no |
| Esportazione dati | backup V3 dal client | uguale |

Elementi utili già presenti ma inattivi:

- `auth_transactions.purpose` ammette già `login`, `link` e `reauth`, ma il codice usa solo `login`.
- `auth_grants` (0007) è stata progettata per autorizzazioni monouso legate a sessione, `auth_version`, metodo e operazione: è il posto naturale per una riautenticazione. Oggi non è usata.
- `account_identities` ha `status` `active`/`disabled` e il vincolo «un'identità per provider per account»: la base per collegare e scollegare.
- La tabella `sessions` contiene solo `token_hash`, `user_id`, `auth_version`, `expires_at`. L'età della sessione è ricavata da `expires_at - TTL`; non ci sono data di creazione, ultimo uso, metodo o etichetta del dispositivo.
- Tutte le scritture su `accounts`, `sessions` e `account_identities` passano dai trigger di recinzione della 0007, che restano validi in modalità `7/legacy`.

## 2. Lacune

Gravità: **alta** = rischio per sicurezza o perdita di controllo; **media** = attrito o confusione che porta a errori; **bassa** = rifinitura.

### L1 — Un account Google non può chiudere le sessioni (alta)

Per gli account con password l'unica revoca globale è il cambio password, che incrementa `auth_version`. Per gli account Google non esiste alcun percorso che incrementi `auth_version` o cancelli le sessioni dell'utente. Se l'account Google viene compromesso, o se si accede da un computer condiviso e ci si dimentica di uscire, la sessione iPagell resta valida fino a 14 giorni. Anche revocare iPagell dalle autorizzazioni di Google non ha effetto, perché la sessione iPagell è indipendente dai token Google (scelta corretta, ma senza contromossa lato iPagell).

### L2 — Nessuna visibilità su sessioni e dispositivi (alta)

Non si può sapere dove l'account è aperto. Senza `created_at`, ultimo uso e un'etichetta, un elenco non è costruibile: serve una migrazione additiva su `sessions`.

### L3 — La riautenticazione Google costringe a uscire (media)

Per eliminare un account Google bisogna avere una sessione emessa da meno di 10 minuti. Il solo modo è uscire e rientrare, ma:

- `POST /api/auth/oauth/google/start` rifiuta con 409 se esiste già una sessione;
- il logout (`lib/diary-session.ts`) rimuove la copia locale del diario e si blocca se ci sono modifiche non sincronizzate.

Inoltre `prompt=select_account` non obbliga Google a chiedere di nuovo le credenziali: un accesso «recente» dimostra solo che nel browser c'era una sessione Google attiva. Per un'operazione distruttiva è una prova debole. OIDC offre `max_age=0` (o `prompt=login`) con verifica del claim `auth_time` nel token.

### L4 — Conferma di eliminazione con l'handle tecnico (media)

L'utente Google deve digitare un codice di 28 caratteri casuali (`security.confirmUsername`) che non ha scelto e non conosce. È un ostacolo accessibile solo con copia-incolla e non aggiunge sicurezza rispetto alla riautenticazione.

### L5 — L'handle `u_…` è esposto come identità (media)

L'interfaccia mostra «Account: @u_…» e lo usa nella nota sulla privacy delle Impostazioni (`accountEmail={session.user!.username}`, nome fuorviante: non è un'email). Una persona non riconosce il proprio account e non sa se è entrata con Google o no. Le classi usano invece `display_name` per membro, quindi l'handle non circola tra compagni.

### L6 — Un solo metodo d'accesso, nessun collegamento (alta per Google, media per password)

- Account Google: nessun metodo di riserva. Perso l'accesso a Google, l'account è perso (lo dice anche `/legale`). Non si può aggiungere una password con codice di recupero.
- Account con password: non si può aggiungere Google. Chi prova «Continua con Google» crea un **secondo account vuoto** senza avviso, perché non esiste collegamento per email (scelta corretta, ma va spiegata). Oggi l'unico rimedio è il backup V3: esporta da un account, importa nell'altro.
- Il W7 prevede collegamento con sessione corrente, riautenticazione, transazione `purpose=link` e divieto di rimuovere l'ultimo metodo. Nulla di questo è implementato.

### L7 — Nessun registro degli eventi di sicurezza (media)

Non ci sono email, quindi nessuna notifica di nuovo accesso. Senza un registro nell'app l'utente non può accorgersi di un accesso estraneo, nemmeno a posteriori.

### L8 — Revoca e disattivazione lato Google non propagate (bassa, opzionale)

Se Google disattiva l'account o l'utente revoca l'app, iPagell non lo sa. Google offre la Cross-Account Protection (eventi RISC) per ricevere questi segnali. Richiede un endpoint pubblico che riceve eventi firmati e la registrazione presso Google: da valutare solo dopo L1–L2.

### L9 — Pulizia delle sessioni scadute solo all'emissione (bassa)

Già segnalata nell'[analisi legale](ANALISI-LEGALE-APPROFONDITA-2026-11-18.md): i record scaduti spariscono solo quando qualcuno accede. Un elenco sessioni deve comunque filtrare per `expires_at`; una pulizia periodica (Cron Trigger del Worker) diventa più utile quando le sessioni avranno metadati.

### L10 — Documentazione non allineata (bassa)

`ARCHITECTURE-CURRENT.md` §3 descrive Google come «non ancora in produzione», e `ANALISI-SITO-2026-11-18.md` lo elenca tra le funzioni non implementate. Secondo `DEPLOYMENT.md` e il `CHANGELOG` è pubblicato dal 19 novembre. Va corretto nel primo task che tocca l'account.

## 3. Proposta per fasi

Ordine scelto per massimo controllo con il minimo di nuovi dati e senza nuovi fornitori. Tutte le fasi restano in modalità `7/legacy`, senza contrazione 0008/credentials.

### Fase A — Sessioni visibili e revocabili (chiude L1, L2, L9)

Progetto dettagliato: [Fase A — sessioni](ACCOUNT-SESSIONI-FASE-A-2026-11-25.md), implementato il 25 novembre 2026 e pubblicato in produzione lo stesso giorno (Worker `d97b7254`). Rispetto allo schizzo qui sotto, il progetto sceglie di cancellare le righe invece di incrementare `auth_version` e salva un codice browser/sistema invece di un'etichetta libera.

- **Migrazione additiva** su `sessions`: `created_at`, `last_seen_at`, `method` (`password`/`google`), `label` (etichetta grossolana tipo «Safari · iPhone», derivata dallo User-Agent). Colonne nullable: le sessioni esistenti mostrano «sessione precedente». Niente IP salvato.
- `last_seen_at` aggiornato al massimo una volta ogni N minuti, per non scrivere su D1 a ogni richiesta.
- API (`/api/auth/sessions`): elenco delle sessioni attive con «questo dispositivo» evidenziato; chiusura di una sessione; «esci da tutti gli altri dispositivi» (cancella le altre righe); «esci ovunque» (incrementa `auth_version`). Valgono per entrambi i tipi di account.
- `sessionAgeSeconds` passa a `created_at`.
- UI in Impostazioni → Sicurezza: «Dispositivi connessi».
- Opzionale: Cron Trigger giornaliero per sessioni, contatori e transazioni scadute.

### Fase B — Riautenticazione senza uscire (chiude L3, prepara L6)

Progetto ed esito: [Fase B — conferma Google](ACCOUNT-REAUTH-FASE-B-2026-11-25.md), implementata il 25 novembre 2026 e pubblicata in produzione lo stesso giorno (Worker `d97b7254`). Rispetto allo schizzo qui sotto: niente `max_age`/`auth_time` (decisione 2), grant generico `operation='reauth'` e password invariata (verificata nella stessa richiesta).

- Google: transazione `purpose='reauth'` legata ad `account_id` e alla sessione corrente, con `max_age=0` e verifica di `auth_time` e che il `sub` coincida con l'identità collegata. Lo start non deve più rifiutare quando la sessione è dello stesso account.
- L'esito è una riga `auth_grants` monouso (operazione, sessione, `auth_version`, scadenza breve), non una nuova sessione. Diario locale e modifiche in attesa restano intatti.
- Password: lo stesso grant dopo la verifica della password, così ogni operazione sensibile usa un unico controllo.
- Il ritorno da Google riporta a Impostazioni → Sicurezza con l'operazione pronta da confermare.

### Fase C — Pannello «Account» chiaro (chiude L4, L5)

Progetto ed esito: [Fase C — pannello Account](ACCOUNT-PANNELLO-FASE-C-2026-11-25.md), implementata il 25 novembre 2026 e pubblicata in produzione lo stesso giorno (Worker `d97b7254`). Rispetto allo schizzo qui sotto: la parola è accettata dal server in tutte e quattro le lingue, e l'avviso sul doppio account compare solo nella modalità di accesso.

- Sezione con metodo d'accesso («Accedi con Google» / «Accedi con nome utente»), data di creazione e identità collegate. Niente `@u_…` per gli account Google.
- Conferma di eliminazione Google con una parola fissa localizzata (per esempio «ELIMINA») dopo la riautenticazione; per gli account con password resta lo username.
- Rinominare internamente `accountEmail` in `accountHandle`.
- Avviso nell'ingresso: «Hai già un account con nome utente? Accedi così: Continua con Google crea un account nuovo.»

### Fase D — Collegamento dei metodi (chiude L6)

Da fare dopo B, perché ogni collegamento richiede un grant.

1. **Account con password → collega Google**: transazione `purpose='link'`, grant recente, rifiuto se il `sub` è già legato altrove (nessuna fusione automatica).
2. **Account Google → aggiungi password**: scelta di uno username vero al posto di `u_…`, password e codice di recupero mostrato una volta. In modalità legacy significa sostituire `NO_PASSWORD` in `accounts` con hash reali e incrementare `auth_version`.
3. **Scollegare**: solo se resta un altro metodo utilizzabile; riautenticazione e chiusura delle sessioni aperte con quel metodo.

Punto tecnico da risolvere: oggi il metodo dell'account è dedotto da `password_hash = NO_PASSWORD` (in `identity()` e nella route security). Con due metodi questo non basta più: il metodo va letto dalla sessione (colonna `method` della fase A) e le capacità (`canChangePassword`, metodi collegati) da un endpoint di sicurezza dedicato, come già indicato dal W7.

### Fase E — Registro attività dell'account (chiude L7, apre L8)

- Tabella `account_events` (tipo, metodo, etichetta del dispositivo, data), retention breve (proposta: 90 giorni), cancellata con l'account.
- Eventi: nuovo accesso, uscita da altri dispositivi, collegamento/scollegamento, cambio password, tentativo di eliminazione bloccato.
- Mostrato in Impostazioni sotto «Dispositivi connessi».
- In seguito: RISC Google, che chiude le sessioni quando Google segnala una compromissione.

Fuori perimetro: email (verifica, notifiche, recupero), passkey/2FA, Apple, fusione di due account, cutover `credentials`.

## 4. Impatti trasversali

- **Schema**: migrazioni nuove (0009 e seguenti), solo `ADD COLUMN` e `CREATE TABLE`; nessuna modifica alla SQL già pubblicata. Le nuove tabelle con dati di autenticazione vanno sotto gli stessi trigger di recinzione della 0007.
- **Privacy**: etichetta del dispositivo, orari di ultimo uso e registro eventi sono dati personali nuovi. Vanno aggiornati `/legale`, la [bozza di informativa](legal/INFORMATIVA-PRIVACY-IT-BOZZA.md) e la [procedura richieste](legal/PROCEDURA-RICHIESTE-PRIVACY.md) (tabelle da consultare per una richiesta di accesso). Minimizzazione: niente IP, User-Agent ridotto a famiglia di browser e sistema.
- **CPU Workers Free**: elenco e revoca non usano scrypt. Il grant per gli account con password sì, come oggi il cambio password.
- **Test**: estendere `tests/auth-d1.integration.ts` (revoca, `auth_version`, grant monouso e scaduto, link verso un `sub` già usato, ultimo metodo) e `tests/google-oidc.test.ts` (`auth_time`, `max_age`, `sub` diverso in fase di reauth). Prove browser: due browser sullo stesso account, revoca reciproca, PWA installata.
- **i18n**: tutte le nuove stringhe in it/de/fr/en.
- **Documentazione**: `ARCHITECTURE-CURRENT.md` §3, `SECURITY.md` (sessioni, revoca), `docs/API.md`.

## 5. Decisioni per il proprietario

1. **Metadati di sessione**: basta un'etichetta grossolana (browser + sistema) senza IP? È la proposta più leggera per l'informativa.
2. **Forza della riautenticazione Google**: obbligare Google a chiedere di nuovo la password (`max_age=0`), con più attrito ma prova reale, oppure accettare la sessione Google attiva? **Deciso il 25 novembre: sessione Google attiva**, con `login_hint` e scelta esplicita dell'account.
3. **Priorità del collegamento**: prima «aggiungi password a un account Google», che dà un metodo di riserva, o «collega Google a un account esistente», che evita doppi account?
4. **Nome dell'account**: un nome visualizzato a livello di account o solo i nomi per classe e il nome nel diario come oggi?
5. **Retention del registro attività**: 90 giorni vanno bene?
6. **Ordine**: A → B → C → D → E, con A e C pubblicabili separatamente.

## 6. Raccomandazione

Partire dalla **fase A**. È piccola, non tocca Google né il flusso di accesso, e chiude la lacuna più grave (L1) per tutti gli account. Subito dopo la **B**, che rende la riautenticazione Google sicura e senza perdita della copia locale: è il prerequisito di tutto il resto. La **C** può affiancare la A perché è quasi solo interfaccia.
