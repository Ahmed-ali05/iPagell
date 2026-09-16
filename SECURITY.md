# Sicurezza e trattamento dei dati

[Indice](README.md) · [API](docs/API.md) · [Operatività](docs/MANUTENZIONE.md)

Documento tecnico-descrittivo. Non è un’informativa privacy legale, una certificazione o una promessa di invulnerabilità.

## Confini di fiducia

Il browser e i suoi input non sono autorità per la proprietà del diario. Ogni API privata ricava l’utente dalla sessione e usa query parametrizzate. `expectedUserId` rileva cambi account; non sostituisce la verifica del cookie. L’isolamento applicativo non impedisce al gestore autorizzato dell’infrastruttura di accedere al database: non è cifratura end-to-end.

Password: scrypt N=16384, r=8, p=5, output 32 byte, salt casuale 16 byte e confronto timing-safe. Un solo hashing concorrente per isolate; sovraccarico restituisce errore, non una coda illimitata. Non sono implementati pepper, verifica password compromesse o autenticazione a due fattori.

Sessioni: token casuale 32 byte, solo digest SHA-256 nel database, durata fissa 14 giorni. Cookie HTTPS `__Host-ipagell-session`, HttpOnly, Secure, SameSite=Lax, Path=/, senza Domain; nome separato non-Secure in HTTP locale. Versione credenziali verificata a ogni richiesta. Non spostare token in localStorage.

Recupero: codice casuale di 32 byte, digest nel database, rotazione monouso al reset. Il codice permette di cambiare password: trattarlo come una credenziale. Cambio password e recupero invalidano le vecchie sessioni; revoca server non significa cancellazione remota di copie offline.

CSRF: origine esatta e JSON sulle mutazioni, più controllo Fetch Metadata. Questi controlli non proteggono da uno script malevolo già eseguito nella stessa origine. La fiducia in `CF-Connecting-IP` richiede il percorso edge previsto; non esporre il Worker tramite un proxy che consenta al client di falsificare quell’header.

## Dove restano i dati

| Sede | Contenuto / limite |
|---|---|
| D1 | Account, digest credenziali/sessioni, snapshot diario e bucket rate limit |
| IndexedDB | Copia per account, anche draft; non cifrata con la password |
| localStorage | Puntatore account, marcatori notifiche e possibili preferenze legacy |
| Cache service worker | Shell generica e asset consentiti, non API |
| Backup JSON scaricato | Dati scolastici e preferenze in chiaro; fuori dal controllo dell’app |

La cancellazione account rimuove i dati applicativi correnti dal database e invalida le sessioni; non garantisce rimozione da backup infrastrutturali, esportazioni o dispositivi offline. Tempi di conservazione infrastrutturali, titolare, contatto e informativa vanno definiti dal responsabile del servizio: non inventarli nella UI.

La pulizia di sessioni scadute e bucket avviene in occasione della creazione di una sessione, non tramite un job periodico dedicato. Logout rimuove la copia locale attiva, non necessariamente tutti gli archivi legacy o di precedenti account.

## Segnalazioni riservate

Non pubblicare exploit con dati reali, backup, password, codici di recupero, cookie o dump database. Contattare privatamente il responsabile del progetto tramite un canale già verificato. Un indirizzo dedicato e uno SLA **non sono ancora definiti**: la loro attivazione è una priorità prima della diffusione ampia.

Includere versione interessata, impatto, passaggi riproducibili su account sintetici e prove minimizzate. Non accedere a dati altrui né svolgere test di carico sul sito pubblico. Chi mantiene il progetto deve confermare la ricezione, riprodurre in isolamento, classificare il rischio, concordare contenimento e rilascio, aggiornare i test e comunicare i limiti della correzione.
