# Revisione iPagell — 16 settembre 2026

[Indice](../README.md) · [Guida utente](GUIDA-UTENTE.md) · [Priorità e verifiche ancora aperte](PRODOTTO.md)

Questo documento conserva l’esito della revisione iniziale. Le verifiche riportate sono storiche, non vengono ripetute automaticamente a ogni modifica della documentazione.

Revisione mirata di codice, sicurezza e cinque profili d’uso. Non è una certificazione o un penetration test indipendente.

## Cinque prospettive

| Persona | Problema trovato | Intervento |
|---|---|---|
| Nuovo studente, altra scuola | Demo personale già popolata e percorso imposto | Account indipendente, profilo vuoto, materie iniziali solo opzionali |
| Utente iPhone, uso rapido | Sfocatura persistente e comandi nascosti | Superfici opache, eliminati i livelli animati permanenti; periodo, tema e modifica disponibili su mobile |
| Utente sensibile al movimento / testo piccolo | Animazioni, contrasto e controlli troppo piccoli | Preferenza movimento ridotto, rispetto impostazioni di sistema, controlli da 44 px e campi da 16 px |
| Utente analitico, molti voti | Proiezione inventata, peso prossimo voto implicito, andamento quadratico | Rimossa previsione artificiale, simulatore esplicito per tipologia/peso, andamento incrementale; limiti validati sui dati |
| Utente su dispositivo condiviso | Un solo archivio indistinto, nessuna identità | Autenticazione interna, proprietà verificata sul server, copie locali per account e uscita con rimozione della copia attiva |

## Sicurezza implementata

- Password scrypt N=16384, r=8, p=5, salt casuale di 128 bit per password. Parametri versionati; confronti timing-safe. Password 15–128 caratteri al momento della revisione; minimo successivamente ridotto a 12. Nessuna password o token nel backup.
- Sessioni casuali a 256 bit: nel database solo SHA-256 del token. Cookie HTTPS `__Host-`, Secure, HttpOnly, SameSite=Lax; scadenza 14 giorni. Nessun token di sessione in localStorage.
- Recupero con codice casuale monouso a 256 bit, mostrato una sola volta e conservato come digest. Recupero e cambio password invalidano tutte le sessioni tramite versione credenziali. Nessuna dipendenza dall’accesso ChatGPT. Nessuna email raccolta o verifica email simulata.
- Limiti persistenti ai tentativi per indirizzo edge, nome utente e budget globale. Protezione sovraccarico della funzione di hashing. Errori pubblici generici.
- Origine e tipo di contenuto verificati per le mutazioni; limiti del corpo (4 KB autenticazione, 1,5 MB diario). SQL parametrizzato; sessione verificata in ogni API privata. Nessuna fiducia in ID utente inviati dal client o header di identità ChatGPT.
- Aggiornamenti del diario con confronto atomico della revisione; i conflitti non sovrascrivono la copia remota. Importazione JSON validata, confermata e atomica. Le transazioni IndexedDB devono terminare prima del messaggio di salvataggio.
- Service worker con allowlist di asset statici; nessuna API, credenziale o risposta di autenticazione in cache. Shell senza dati personali.
- Tipologie di voto con ID stabili: la modifica dell’ordine non riassegna voti. Tipologie già usate non eliminabili.
- Eliminazioni dati con conferma. Eliminazione account e cambio password richiedono nuovamente la password.

Riferimenti: [OWASP Password Storage](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html), [Cloudflare crypto](https://developers.cloudflare.com/workers/runtime-apis/nodejs/crypto/).

## Verifiche e limiti dichiarati

- TypeScript, build, test unitari su ponderazioni/validazione/hash/CSRF e test API su due account sintetici, isolamento, revisione, recupero, revoca, limiti e cancellazione. Gli account dei test API vengono eliminati.
- Verifica browser locale della versione compilata: desktop e viewport 390×844, accesso, salvataggio del voto `4-5`, media `4.5` e persistenza dopo ricaricamento.
- Audit dipendenze di produzione: zero vulnerabilità segnalate alla verifica. Non equivale ad assenza di vulnerabilità sconosciute.
- Non verificata l’installazione su un iPhone fisico. Manifest, icone e splash presenti; chiudere e riaprire le vecchie installazioni per attivare il nuovo service worker.
- Il diario offline non è cifrato con la password: proteggere il dispositivo ed effettuare logout sui dispositivi condivisi. Copie già esportate o su altri dispositivi non sono cancellabili a distanza. Il primo accesso e il logout server richiedono connessione.
- Nessun invio email e nessuna autenticazione a due fattori. Senza password e codice di recupero non è possibile ripristinare l’account.
- I promemoria attuali funzionano mentre l’app è aperta: non sono notifiche push programmate ad app chiusa.
- Le tipologie usano peso voto × peso tipologia, non medie separate per sotto-componenti. Cambiare coefficienti ricalcola anche il passato. Archivio non immutabile; agenda settimanale e paginazione completa restano miglioramenti successivi.
- Prima di un’apertura su larga scala: test di carico, protezione anti-bot aggiuntiva, revisione indipendente, policy di conservazione/privacy e backup operativo del database.

## Installazione iPhone

Aprire il sito in Safari, creare un account e conservare il codice di recupero. Toccare Condividi → Aggiungi alla schermata Home. Aprire l’icona almeno una volta online per preparare la copia offline. I vecchi dati non vengono associati automaticamente: Impostazioni → Preferenze → Recupera vecchio diario, poi Importa dopo aver controllato il backup.
