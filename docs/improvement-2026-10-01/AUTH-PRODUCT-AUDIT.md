# iPagell — audit prodotto, accesso e registrazione

Analisi del 1 ottobre 2026, sola lettura del checkout. AGENTS.md, REPO-SNAPSHOT.md, ARCHITECTURE-CURRENT.md e VERIFICATION-MATRIX.md letti. Le conclusioni sono verificate nel codice; nessun dato reale e nessun provider configurato.

## Risultato

Il prodotto esiste e offre un diario personale con agenda, voti, assenze, appunti e classi. Per un nuovo utente il costo iniziale è alto: credenziali, conservazione obbligatoria di una credenziale di recupero lunga, poi configurazione del semestre prima di vedere il primo valore. L'entrata può essere resa molto più chiara ora con una gerarchia visiva, spiegazioni brevi e passi nominati. Google, Apple ed email richiedono un progetto di identità e migrazione separato; non sono un cambio cosmetico del form.

## Evidenze del codice

- `components/account-gate.tsx`: login/register/recover nello stesso componente; registrazione invia username/password a `/api/auth/register`. Se riceve recoveryCode, blocca la continuazione finché si spunta di averlo conservato. Dopo, ricarica l'identità e mostra setup diario.
- Username: 3–32 caratteri, lettere ASCII minuscole/numeri/._-, normalizzato lowercase; password 12–128 caratteri (`lib/auth-validation.ts`). Il nome visualizzato è distinto da username (`Registration.name`). Il form non spiega chiaramente questa distinzione prima di chiederla.
- Setup richiede nome, semestre, anno scolastico, inizio e fine; materie vuote o cinque predefinite, scuola opzionale. Il semestre e le date precompilati seguono agosto–gennaio, anche se l'utente potrebbe iniziare altrove. Il preset genera nomi italiani e tipologie Scritto/Orale anche con UI in altre lingue (`lib/new-diary.ts`): miglioramento da pianificare senza tradurre contenuti esistenti.
- `POST /api/auth/register` crea account e sessione; `POST /api/account` crea diario separatamente; `diary:null` è onboarding riprendibile. Questo confine permette di migliorare il setup senza ricreare account.
- `accounts` ha username, password_hash e recovery_hash NOT NULL; `AccountIdentity` è id+username. Voti, note, classi e IndexedDB sono legati all'id account. L'id deve restare stabile qualunque metodo di accesso si aggiunga.
- Sessioni proprie, cookie HttpOnly/Secure/__Host/SameSite=Lax, digest del token, durata fissa 14 giorni e auth_version controllato ad ogni richiesta. Hash password scrypt; recupero ruota codice e invalida sessioni; cambio password incrementa versione. Nessuna integrazione OAuth/OIDC/email corrente.
- Mutazioni JSON same-origin e Fetch Metadata (`lib/server/http.ts`): NON riusare indiscriminatamente questo controllo per callback OAuth esterne. Il callback Apple via POST cross-origin richiede una route specifica validata con transazione OAuth.
- `components/account-security.tsx` e relativo endpoint richiedono sempre currentPassword per cambio password e cancellazione. Questo flow deve essere adattato per account social-only con ri-autenticazione del metodo posseduto.
- Dashboard vuota: agenda hero e aggiunta materie; aggiunta voto solo se già esistono materie. 'Aggiungi materie' apre impostazioni generali. Appunti appare anche vuoto e offre nuova nota senza materia: possibile vicolo cieco percettivo. Dal punto di vista prodotto l'azione primaria deve essere configurare una prima materia, con entrata diretta all'editor; le funzioni successive diventano disponibili gradualmente.
- Home definisce emptyDiary con agenda+voti del semestre, senza considerare appunti e assenze. Per chi usa solo Appunti il messaggio iniziale potrebbe continuare ad apparire: distinguere diario iniziale da assenza di scadenze nel periodo.

## Miglioramenti immediati compatibili con l'accesso esistente

1. Prima del form: 'Il tuo diario scolastico: voti, compiti e appunti in un solo posto'. Una riga precisa sulla scala attuale 1–6/sufficienza 4; non promettere compatibilità con altre scale.
2. Registrazione mostra progressione reale 'Account → Codice di recupero → Diario'. Login resta breve e distinto; ritorno alla pagina pubblica sempre disponibile.
3. Username: 'Ti servirà per accedere; potrai scegliere separatamente il nome mostrato nel diario'. Password visibile/nascosta accessibile e requisiti leggibili. Errori vicino al campo e focus al primo errore, senza cancellare altri dati.
4. Recupero: spiegare prima della registrazione che non esiste email di recupero; schermata codice mantiene obbligo attuale e chiarisce che è una credenziale. Download/copia + conferma conservazione; nessuna rimozione dell'unica protezione senza infrastruttura sostitutiva.
5. Setup: titolo 'Prepara il primo semestre', spiegare 'Puoi modificare materie e date dalle impostazioni'. Date e scuola sotto una sezione dettagli più calma, mantenendo campi richiesti e validation; non nascondere errori dentro details chiusi. Spiegare significato di semestre e offrire anteprima delle materie di base.
6. Primo uso: checklist breve per una prima materia e primo voto/scadenza/appunto; una sola azione forte. Classi come possibilità successiva spiegata: 'Invita compagni per condividere compiti e appunti; voti e assenze personali restano privati'.
7. Nessun pulsante Google/Apple/email inattivo e nessuna promessa di email finché i flow non sono testati. Tutti i testi coerenti it/de/fr/en.

## Piano obiettivo Google, Apple, email personale

### Esperienza prevista

Entrata con 'Continua con Google', 'Continua con Apple' e 'Continua con email' solo quando abilitati. Accesso esistente username/password sempre raggiungibile con 'Usi già iPagell? Accedi con il tuo nome utente'. Non forzare gli account correnti a migrare. Nuovi utenti social/email confermano nome mostrato e primo periodo con buoni default; configurazione scolastica separata dall'identità.

Email personale: email+password con verifica email per nuove registrazioni; recupero password via email verificata. Codice breve OTP può essere un'alternativa futura, non da introdurre insieme a magic link e password al primo rilascio. Scelta proposta: password familiare, verifica e recovery monouso. Definire sender/supporto reale, tempi e privacy prima di trattare l'email. Prima della verifica non attribuire proprietà di un'identità esistente né consentire azioni condivise.

### Identità e migrazione

- Conservare `accounts.id` e tutte le relazioni, payload e chiavi IndexedDB esistenti. Username è compatibilità e identificatore leggibile, non una nuova chiave provider.
- Migrazione SQL NUOVA, non modifica di 0000–0006. Primo rilascio additivo: `account_identities` con account_id, provider, issuer, subject, created_at e UNIQUE(issuer,subject); `account_emails` con originale, normalizzazione conservativa, stato verificato, verificato_at; transazioni OAuth e token email monouso con digest, scadenza, finalità e account/contesto atteso. Eventuale tabella credenziali per metodo e metadati.
- Attuale password/recovery NOT NULL va trattato esplicitamente: prima introdurre un flag/metodo credential che vieti accesso/password reset locale sugli account senza password. In fase successiva migrare a credenziali separate o colonne nullable con piano SQLite/D1 testato. Non inserire password fittizie riutilizzabili; non registrare l'utente con una password derivata dall'email o dal provider. Nessun account social-only finché tutti gli endpoint security/recover comprendono i metodi disponibili.
- Migrazione legacy: lasciare intatte le password e recovery attuali; offrire collegamento volontario dentro impostazioni dopo verifica password recente. Backfill credenziale locale se si sceglie la tabella nuova, senza esportare hash né ricalcolare password.
- Non unire account automaticamente per email, username o nome simili. Identità provider stabile è issuer+subject. Provider email serve come contatto osservato, non prova universale di proprietà di un vecchio account.
- Collegare Google/Apple richiede sessione corrente, ri-autenticazione recente dell'account locale, transazione server che conserva accountId e purpose=link, autenticazione nuova identità e conferma esplicita. Identità già legata altrove: rifiuto; eventuale fusione dati è un progetto distinto con prova di entrambi gli account.
- Collegare email richiede token inviato alla nuova casella + sessione e ri-autenticazione account corrente. Avviso del cambio alla vecchia email verificata quando presente. Nessuna politica aggressiva di rimozione punti/plus alias (sono diversi secondo provider); definire e testare normalizzazione.
- Scollegamento: richiedere ri-autenticazione, almeno un altro metodo realmente utilizzabile/verificato, revoca sessioni interessate e audit minimizzato. Non permettere di eliminare l'ultimo metodo di accesso.

### Google

Creare progetto Google Cloud e client OAuth web per ambiente test/produzione, branding/consent screen e dominio canonico verificato, homepage/privacy/supporto reali. Origini e redirect precisi: proposta `https://ipagell.website/api/auth/oauth/google/callback`, evitando wildcard. Scopi minimi openid/email/profile. Flow authorization code server oppure GIS ID-token con verifica server: scegliere un solo adattatore verificato, compatibile Workers. Preferire libreria JWT/OIDC mantenuta con WebCrypto, senza costruire crittografia manuale. Nessun accesso Drive/Calendar richiesto per login.

### Apple

Gate di fattibilità da verificare prima di promettere il rilascio: Apple Developer e App ID primario abilitato; guida Apple web richiede associazione Services ID a primaria app, guida environment indica anche app App Store esistente. Servono Services ID, Team ID, Key ID, chiave privata, dominio e return URL assoluto HTTPS (proposta `/api/auth/oauth/apple/callback`). Registrare email sender nel relay con SPF/DKIM per inviare a Hide My Email. Nome va salvato al primo consenso perché non sempre restituito successivamente; email relay non si sostituisce alla chiave subject. Pianificare rotazione client-secret firmato, key rotation, revoke e notifiche server per revoca/variazioni account. Non simulare Apple con un semplice bottone prima dei prerequisiti.

### Sicurezza e operatività

Transazione OAuth breve, casuale, monouso e legata al browser/purpose/provider: state, nonce, PKCE S256 dove supportato; validare firma JWT, issuer, audience, tempi, nonce, algorithm allowlist e subject. Rifiutare callback fuori contesto e open redirect; destinazioni post-login solo relative/allowlist. Per Apple form_post non contare sul cookie SameSite=Lax che normalmente non accompagna il POST esterno: verificare soluzione transazione dedicata/ritorno same-origin, binding del browser e replay prima di linking/sessione; non indebolire globalmente il cookie iPagell.

Token email: digest, TTL definito (es. 15 minuti recovery, 24 ore verifica da validare lato prodotto), finalità unica, uso atomico, limiti IP/account/provider; risposte recovery neutrali; token esclusi da log/analytics/referrer, rimozione URL dopo consumo. Evitare il consumo con il semplice GET del link, che può essere aperto dallo scanner email: conferma POST e sessione/transazione contestuale. Revocare altri token/sessioni su reset e cambi critici, incrementare auth_version; sessione propria iPagell resta indipendente dai token Google/Apple.

Tenere credenziali nei segreti runtime del progetto Sites, non `.openai/hosting.json`, repo, client bundle o log. Le notifiche email richiedono provider transazionale, sender verificato, SPF/DKIM/DMARC, gestione bounce/relay e un recapito supporto reale. Protezione abuso, timeout e fallback se provider indisponibile. Audit minimizzato: evento/metodo/account/scadenza, mai password, token o email completa.

Cancellazione account social: ri-autenticazione provider e conferma dell'operazione; conserva blocco proprietà classi; rimuove dati via id stabile e revoca collegamenti/token provider necessari. Rispetta conservazione di bozze pendenti e contesto account delle operazioni asincrone già garantiti da diary-session.

## Rollout e script di verifica proposti

- Fase 0: copy/gerarchia onboarding e primo uso, test browser mobile/desktop e locale. Nessuna migrazione DB.
- Fase 1: schema additivo e provider/email adapter in ambiente isolato; flag indipendenti provider, legacy resta predefinito; configurazioni esterne confermate con responsabile.
- Fase 2: collegamento facoltativo da account legacy prima della creazione social pubblica. Verificare che id, diario, note, memberships, bozze e offline restino identici.
- Fase 3: email e Google per nuovi utenti dopo prove end-to-end reali con account sintetici; Apple dopo prerequisiti. Provider non pronto viene omesso dal form.
- Fase 4: misurare abbandono per fase e tempi/errori aggregati, senza email/input personali; ottimizzare setup progressivo. Nessuna eliminazione forzata username prima di un ciclo completo di migrazione/recovery verificato.

`tests/auth-identities.test.ts`: subject/issuer, state/nonce/token replay, algoritmo/firma/audience/expiry, timeout/key refresh e provider mix-up; linking account diverso, email stessa/cambiata/relay, concorrenza linking e ultimo metodo.

`tests/api-auth-smoke.mjs` con DB locale nuovo e account sintetici: legacy register/login/recovery invariati; migrazione su DB con dati; autorizzazioni per diario/note/classi e auth_version; verification/reset single-use; anti-enumerazione; session cookie e errori provider; cleanup account. Un OAuth stub non sostituisce prova provider reale.

`tests/auth-flow-browser.ts` o browser tooling: registrazione/login/errore/recupero, ritorno dai provider annullato, refresh/back/multiple tab, account cambiato durante callback, callback Apple form_post, PWA standalone e Safari iOS/Chrome Android reali, autofill/password manager, focus/tastiera e 320/390 px, quattro lingue.

Release: check locale completo, build/precache, API suite, prova account sintetico su dominio canonico e pubblicazione Sites confermata succeeded. Rollback via flag frontend/provider e compatibilità schema additivo; mai rollback distruttivo delle identità già create. Niente prova con dati reali o deploy sandbox chiamato produzione.

## Fonti primarie consultate

Le seguenti fonti supportano i requisiti protocollari; il piano di rollout e i dettagli di migrazione sono una proposta per il codice iPagell.

- Google descrive setup client/redirect/consenso, code flow, verifica state e subject come identificatore: [Google OpenID Connect](https://developers.google.com/identity/openid-connect/openid-connect).
- Google richiede verifica token e avverte che email_verified per una casella esterna non dimostra l'attuale proprietà: [Verify Google ID token](https://developers.google.com/identity/gsi/web/guides/verify-google-id-token).
- Issuer+subject è la coppia stabile; email/nome non sono chiavi univoche stabili: [OIDC Core, 5.7](https://openid.net/specs/openid-connect-core-1_0.html#ClaimStability).
- PKCE è raccomandato anche per client server riservati e deve essere legato alla transazione; preferire S256 e code flow: [RFC 9700, OAuth Security BCP](https://www.rfc-editor.org/rfc/rfc9700.html).
- Services ID associato ad app primaria e return URL web: [Apple web configuration](https://developer.apple.com/help/account/capabilities/configure-sign-in-with-apple-for-the-web).
- App abilitata, key e fonti email relay: [Apple environment configuration](https://developer.apple.com/documentation/signinwithapple/configuring-your-environment-for-sign-in-with-apple).
- Callback POST e dati utente al primo consenso: [Apple webpage configuration](https://developer.apple.com/documentation/signinwithapple/configuring-your-webpage-for-sign-in-with-apple).
- Relay nasconde email reale e richiede fonti registrate: [Apple private email relay](https://developer.apple.com/documentation/signinwithapple/communicating-using-the-private-email-relay-service).
