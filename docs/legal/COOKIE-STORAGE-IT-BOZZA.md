# iPagell — Cookie e archivi del browser

**Bozza essenziale aggiornata il 17 novembre 2026**, riallineata all’hosting su Cloudflare. Testo breve per gli utenti, seguito dall’inventario tecnico e dalla decisione ancora da completare. Nessun banner è stato aggiunto o pubblicato.

## Testo proposto per gli utenti

Responsabile: **Ahmed Ali, Ticino, Svizzera**. Contatto: **[ipagell.service@gmail.com](mailto:ipagell.service@gmail.com)**.

iPagell utilizza il cookie **`__Host-ipagell-session`**, valido per **14 giorni**, per riconoscere l’account autenticato. Contiene un identificativo di sessione, non il diario; su HTTPS usa HttpOnly, Secure e SameSite=Lax. La validità è gestita anche dai percorsi di uscita e sicurezza dell’account.

Con «Continua con Google» si aggiunge **`__Host-ipagell-oauth-browser`**, valido **30 giorni**: contiene solo un valore casuale che lega il ritorno da Google allo stesso browser (il server ne conserva solo il digest). Stesse protezioni HttpOnly, Secure e SameSite=Lax; è tecnicamente necessario per l’accesso con Google.

Il browser conserva lingua, preferenze, copie offline e bozze. Il calcolatore senza account conserva valori nella sessione della scheda; gli Appunti senza account mantengono una bozza separata nel browser, senza sincronizzarla con l’account. In modalità solo memoria la bozza non è garantita dopo la chiusura della pagina.

Gli archivi persistenti non hanno tutti una scadenza automatica: possono rimanere fino alla pulizia prevista dal relativo flusso o alla rimozione dei dati del sito. I marcatori d’installazione usano finestre logiche di 90 giorni, che non garantiscono da sole la cancellazione fisica. Le cache dell’interfaccia vengono aggiornate dal service worker, che esclude le API. I dettagli sono nell’inventario sotto.

iPagell non usa pubblicità, analytics commerciali o cookie di terze parti. Il fornitore di hosting, Cloudflare, non aggiunge cookie al sito; produce statistiche aggregate sul traffico e i registri tecnici descritti nell’[informativa privacy](INFORMATIVA-PRIVACY-IT-BOZZA.md). Il sito chiede inoltre al browser di segnalare a Cloudflare eventuali errori di connessione (Network Error Logging): secondo Cloudflare queste segnalazioni non conservano l’indirizzo IP, ma solo rete, Paese e area di provenienza.

Puoi bloccare o rimuovere cookie e dati del sito dalle impostazioni del browser. Potresti uscire dall’account o perdere preferenze e bozze non sincronizzate: esporta prima ciò che vuoi conservare. Puoi gestire separatamente il permesso notifiche, che non è un consenso ad altri trattamenti. Per gli altri dati e i tuoi diritti consulta l’[informativa privacy](INFORMATIVA-PRIVACY-IT-BOZZA.md).

## Inventario tecnico di riferimento

Inventario del checkout più un controllo mirato della produzione del 17 novembre 2026 (vedi la nota sul banner). Non è una cattura completa del traffico. Può essere presentato come approfondimento; la decisione interna sul banner in fondo non va pubblicata come se fosse già conclusa.

### Cookie di accesso

Il cookie `__Host-ipagell-session` contiene un identificativo di sessione. Permette al server di riconoscere l’account autenticato, non contiene direttamente il diario. Su HTTPS usa le protezioni HttpOnly, Secure e SameSite=Lax. La durata impostata è di 14 giorni; logout e operazioni di sicurezza incidono sulla validità della sessione secondo il percorso utilizzato.

Il nome `ipagell-dev-session` è riservato all’ambiente di sviluppo HTTP e non è il cookie previsto per il sito pubblico HTTPS.

### Strumenti senza account

| Archivio | Contenuto e scopo | Durata e rimozione |
|---|---|---|
| `sessionStorage` — `ipagell-public-average-v1` | Voti/pesi e campi del calcolatore pubblico, per ritrovarli durante la navigazione nella stessa scheda. Il calcolo non richiede il loro invio al server. | Legato alla sessione della scheda; ripristino e chiusura dipendono anche dal browser. Nessun TTL ulteriore impostato dal codice. |
| IndexedDB — `ipagell-public-notes-v1` | Una bozza degli Appunti senza account: titolo, materia, testo e metadati di salvataggio. Separata dall’account. | Rimane fra le visite nello stesso browser finché viene sostituita usando Nuovo appunto, rimossa dai dati del sito o eliminata dal browser. Nessuna scadenza automatica osservata. |

Se scegli la modalità solo in memoria degli Appunti, non viene garantito il salvataggio persistente della bozza. Non cancellare i dati del browser prima di aver esportato ciò che vuoi conservare.

### Account e uso offline

| Archivio | Contenuto e scopo | Durata e rimozione |
|---|---|---|
| IndexedDB — `ipagell-db` | Copia del diario dell’account, per uso locale e sincronizzazione. | Senza TTL generale; pulizia secondo i flussi di uscita/cancellazione e disponibilità dello storage. |
| IndexedDB — `ipagell-notes-db` | Appunti personali, bozze, conflitti, bozze di classe e metadati di sincronizzazione/import. | Senza TTL generale; alcune bozze pendenti possono essere conservate dopo logout per lo stesso account. |
| `localStorage` — `ipagell-active-account-v2` | Identificativo dell’account attivo per associare la copia locale. Non contiene la password. | Pulizia legata al ciclo dell’account; nessun TTL generale. |
| `localStorage` — `ipagell-class-agenda-v1:*` | Copia delle attività di classe seguite nell’agenda. | Pulizia legata al ciclo account/sessione; nessun TTL generale. |
| `localStorage` — `ipagell-preferences-v1` | Possibili preferenze di versioni precedenti, lette per recupero/compatibilità. | Presenza dipendente dalla storia del browser; nessun TTL generale individuato. |

Gli archivi locali non sono protetti dalla password del diario come se fossero un archivio cifrato. La rimozione della sessione server non elimina a distanza tutti i file o le copie offline presenti su altri dispositivi.

### Lingua, installazione e promemoria

| Archivio | Contenuto e scopo | Durata e rimozione |
|---|---|---|
| `localStorage` — `ipagell-interface-locale-v1` | Lingua dell’interfaccia scelta. | Senza TTL generale; modificabile scegliendo un’altra lingua o rimuovendo i dati del sito. |
| `localStorage` — `ipagell-install-dismissed-v1`, `ipagell-install-complete-v1` | Marcatori per gestire le proposte di installazione. | Il codice usa finestre logiche di 90 giorni; ciò non equivale necessariamente alla cancellazione fisica della chiave dopo 90 giorni. |
| `localStorage` — `ipagell-notified-*` | Marcatori per evitare di ripetere lo stesso promemoria. | Senza TTL generale individuato. |
| Cache Storage — `ipagell-shell-*` | Risorse dell’interfaccia per l’uso offline. Il codice del service worker esclude le API dalla cache. | Le cache di versioni precedenti vengono eliminate all’attivazione del nuovo worker; la cache corrente può restare fino alla pulizia del browser. |

Puoi gestire i permessi di notifica nelle impostazioni del browser o del dispositivo. Il permesso notifiche non è un consenso generale ad altri utilizzi dei tuoi dati.

## Decisione sul banner — nota interna

Il percorso corrente usa anzitutto documentazione pubblica, impostazioni disponibili e una verifica tecnica mirata; non prevede un’email obbligatoria al supporto o l’acquisto di una piattaforma consensi. La decisione dipende dal trattamento concreto secondo le regole applicabili, come nel [piano minimo](ESSENZIALI-PRIVACY-2026-10-22.md).

Nel codice riletto non sono state individuate integrazioni commerciali di pubblicità o analytics. Gli archivi inventariati sopra servono alle funzioni dell’app, ma questa osservazione non classifica automaticamente ogni chiave come strettamente necessaria.

**Controllo della produzione Cloudflare, 17 novembre 2026** (account Cloudflare del gestore e richieste anonime con `curl` su `/`, `/app`, `/calcolo-media-voti` e `/api/account`):

- Nessun header `Set-Cookie` senza sessione: niente `__cf_bm` o altri cookie dell’edge. Bot Fight Mode e protezioni bot a pagamento sono disattivati; la zona è sul piano Free.
- Cloudflare Web Analytics non è configurato (nessun sito RUM nell’account) e la homepage non carica `cloudflareinsights` né altri script esterni. Restano le statistiche aggregate della zona e dei Worker, calcolate lato server.
- Ogni risposta contiene gli header `Report-To` e `NEL` verso `a.nel.cloudflare.com` (`success_fraction` 0: si segnalano solo gli errori). La documentazione Cloudflare dichiara che l’IP resta in memoria solo per la durata della richiesta e si conservano ASN, Paese e area metropolitana. La funzione si gestisce dalla dashboard (Network Error Logging Monitoring).
- Email Obfuscation è attiva: agisce sull’HTML e non imposta cookie.
- Workers Logs registra le richieste lato server (vedi informativa): non è uno strumento sul dispositivo, ma rientra nella trasparenza.

Con questi elementi il sito non usa tecnologie sul dispositivo per finalità diverse dal funzionamento richiesto, salvo le segnalazioni NEL, che servono all’affidabilità del servizio e non identificano la persona secondo il fornitore. La raccomandazione resta **nessun banner**, con informazione chiara in questa pagina. Decisioni ancora aperte:

1. Confermare la scelta sulle segnalazioni NEL (lasciarle e descriverle, oppure disattivarle dalla dashboard se non servono).
2. Ripetere il controllo se si attivano Web Analytics, Bot Fight Mode, Turnstile o altri servizi Cloudflare che aggiungono script o cookie.
3. Applicare le regole svizzere al trattamento concreto e valutare separatamente eventuali requisiti connessi ad altri mercati.
4. Se emergono trattamenti per cui occorre una scelta, prevederne gli effetti reali prima dell’attivazione e una gestione successiva. Non aggiungere un popup puramente decorativo né un consenso unico obbligatorio alla privacy.

Il progetto non riceve un nuovo tracciatore o un banner con questa bozza. La [guida IFPDT](https://www.edoeb.admin.ch/it/cookies-consigli-pratici) è il riferimento svizzero consultato; tratta anche tecnologie simili ai cookie e distingue necessità tecnica, trasparenza e altri presupposti del trattamento. Non va sostituita automaticamente con le regole italiane.

## Evidenze tecniche usate

[Sessione](../../lib/server/auth.ts), [diario locale](../../lib/account-storage.ts), [Appunti account](../../lib/notes/storage.ts), [Appunti senza account](../../lib/public-notes.ts), [calcolatore](../../components/grade-average-calculator.tsx), [lingua](../../lib/i18n/locale.ts), [installazione](../../lib/install-app.ts), [workspace e notifiche](../../components/ipagell-app.tsx), [service worker](../../public/sw.js), [configurazione Worker](../../wrangler.jsonc). Fonti Cloudflare: [Network Error Logging](https://developers.cloudflare.com/network-error-logging/), [Workers Logs](https://developers.cloudflare.com/workers/observability/logs/workers-logs/). L’inventario deve essere riallineato se questi comportamenti cambiano prima della pubblicazione.
