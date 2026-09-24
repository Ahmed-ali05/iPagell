# Affidabilità del diario — intervento del 23 settembre 2026

[Architettura](ARCHITETTURA.md) · [API](API.md) · [Manutenzione](MANUTENZIONE.md)

Analisi e correzioni sul working tree, che conteneva già modifiche precedenti. Nessuna pubblicazione, modifica ai dati reali, nuova dipendenza o migrazione. Gli audit `REPO-SNAPSHOT`, `ARCHITECTURE-CURRENT` e `VERIFICATION-MATRIX` restano fotografie del commit indicato nei rispettivi documenti; questo documento registra il delta verificato.

## Modello e confini ricostruiti

| Entità | Proprietà, persistenza e modifiche | Offline, revisione e cancellazione |
|---|---|---|
| Account | Credenziali/sessioni in D1; identità dal cookie, mai dall'ID fornito dal client | Nessuna autenticazione nuova offline. Reset/cambio password invalidano sessioni; cancellazione transazionale, bloccata per proprietari di classi |
| Diario | Uno snapshot privato per account in `diaries`, copia in IndexedDB per ID account | Modificabile offline dopo apertura; `dirty` fino alla conferma remota e al commit locale; revisione SQL compare-and-swap |
| Semestre | Dentro il diario; proprietario unico | Eliminazione rimuove voti, attività personali e assenze del periodo; almeno un semestre resta. Preferenza corrente corretta nello stesso commit |
| Materia | Dentro il diario, tipi e pesi condivisi fra semestri | Eliminazione rimuove i riferimenti personali in tutti i semestri. Le sottoscrizioni di classe restano separate |
| Voto | Privato, riferisce materia/tipo/semestre, validato prima della persistenza | Stesso snapshot e protocollo del diario; creazione/eliminazione disponibili, editor personale ancora mancante |
| Attività personale | Privata, titolo/scadenza/completamento nello snapshot | Creazione, completamento ed eliminazione offline; editor generale ancora mancante |
| Assenza | Privata, durata/tipo/giustificazione nel diario | Stesso flusso; creazione/eliminazione, editor ancora mancante |
| Classe | Tabelle D1 separate, owner/moderator/member; permessi applicati sul server e nelle query | Scritture online; uscita/rimozione/eliminazione scollegano le copie personali tramite trigger |
| Evento condiviso | `class_events`, visibile ai membri; autore o moderatori possono modificarlo, revisione propria | Nessuna coda offline. Aggiornamento propaga snapshot; eliminazione conserva una copia annullata e scollegata |
| Attività aggiunta all'agenda | `class_event_subscriptions`, appartiene al singolo studente; snapshot condiviso e campi personali separati | Cache di lettura per account in localStorage. Completamento/promemoria privati; detach conserva la copia e ferma aggiornamenti; rimozione personale non elimina l'evento |

Le sottoscrizioni non entrano nel JSON del diario. Il backup le converte in copie personali, senza membership o inviti; l'import sostituisce il diario, non esegue un merge. Il service worker conserva shell e asset, non API o dati account. Filtri, dialoghi e selezioni sono stato UI, non prova di persistenza.

## Problemi confermati e scelta

1. **P0 — Sovrascrittura locale tra schede.** La revisione remota restava identica per più modifiche offline; `saveLocal` scriveva senza confrontare la copia attuale. Anche un logout o il caricamento della versione server potevano eliminare un draft scritto da un'altra scheda.
2. **P0 — Identità e fallback mescolati.** Il medesimo `catch` gestiva rete e storage dopo una risposta autenticata: riconosciuto B, un errore IndexedDB poteva riaprire A dal puntatore locale. `load` non partecipava alla coda delle mutazioni; risposte ritardate potevano pubblicare dati precedenti.
3. **P1 — Conferma remota persa.** Il server poteva avere già salvato lo snapshot, ma il successivo 409 veniva sempre presentato come differenza da risolvere. Il fallimento locale dopo la risposta remota era classificato come offline.
4. **P1 — Errori HTTP delle classi.** Il client assumeva JSON e non impostava un timeout. Un 401 HTML/JSON malformato non invalidava la cache di classe.

Non sono stati ripetuti interventi già presenti nel working tree: copy password, Home/Statistiche, terminologia e altri aggiornamenti documentali.

## Cambiamenti

- `saveLocal(next, expected)` confronta e scrive nella stessa transazione IndexedDB. Il confronto comprende snapshot, revisione e dirty, quindi rileva anche due scritture offline con identica revisione remota. Anche la rimozione usa il confronto. Una transazione abortita non è un salvataggio riuscito.
- Il puntatore dell'account viene aggiornato all'apertura autenticata, non da ogni salvataggio: una risposta tardiva di A non riattiva A mentre si usa B. Errori di storage dopo il riconoscimento di B non possono aprire A.
- `lib/diary-session.ts` contiene l'unica coda per caricamento, modifica, sincronizzazione e logout. L'hook React mantiene solo sottoscrizione ed eventi browser. Cambio sessione e smontaggio invalidano le operazioni pendenti; le ricette ricevono una copia dei dati, evitando modifiche in memoria prima della persistenza.
- Dopo un 409 il client legge il server: conferma solo uno snapshot esattamente uguale, altrimenti mantiene il conflitto e il draft. Lo stesso confronto funziona alla riapertura. Nessuna revisione viene forzata, nessun merge implicito.
- Nuovo stato per cambiamenti provenienti da un'altra scheda, con aggiornamento esplicito della copia locale disponibile anche dentro il modulo, senza chiuderlo. I moduli conservano i valori quando il commit viene rifiutato. Su 503/errore storage durante refresh il diario già aperto resta consultabile; su 401 resta esportabile ma le nuove modifiche sono bloccate.
- Diario e classi condividono il trasporto JSON con timeout e distinzione tra errore HTTP e rete. Le classi invalidano la propria cache anche con 401 non JSON. Onboarding/logout controllano l'account atteso quando il client invia l'header, mantenendo compatibilità con client precedenti.

## Verifiche e limiti

- `tests/diary-session.test.ts`: failure injection sul vero controller, con adapter di rete/storage sintetici. Include due istanze, refresh concorrente, risposta persa, conflitto reale, 401/503, quota e transizione account.
- `tests/storage-browser.html`: transazioni IndexedDB reali, su origine locale dedicata. **10 controlli passati**, incluse scritture concorrenti, cancellazione obsoleta, mancata riattivazione account e abort dopo successo della richiesta.
- `tests/api-smoke.mjs`: **88 controlli passati** sulla build locale con database nuovo e migrazioni 0000–0004. Include autorizzazioni, isolamento, revisioni, completamento privato, detach, uscita, cancellazione evento/classe, recupero e revoca sessioni. Tre controlli nuovi proteggono onboarding/logout dopo cambio account. Gli account della suite sono stati rimossi dalla suite stessa.
- `npm run release:prepare`: lint, TypeScript, test, documentazione e build eseguiti; warning del bundle client oltre 500 kB. Il controllo link non certifica il contenuto dei documenti.
- Verifica UI sulla build compilata con account sintetico: accesso, primo diario con materie base, registrazione `4-5`, media `4.5` e ricaricamento persistente. In due schede dello stesso account un voto obsoleto è stato rifiutato; il modulo ha conservato voto e nota, ha aggiornato la copia locale e al secondo invio entrambi i voti sono risultati salvati.
- Nessuna prova fisica iPhone, nessun test di carico o certificazione di produzione. I due dispositivi sono simulati a livello controller/API; le prove IndexedDB usano transazioni concorrenti nel browser, non due dispositivi fisici. Quota e timeout sono iniettati, non ottenuti saturando il dispositivo reale.

## Rimane aperto

- Un vero conflitto fra dispositivi richiede ancora esportazione e scelta esplicita; non c'è storico recuperabile né merge assistito. Se dopo una conferma persa si aggiungono altre modifiche prima della riconciliazione, il confronto non può provare l'equivalenza e conserva il conflitto.
- Queste protezioni valgono per i client aggiornati; una scheda con codice precedente può ancora scrivere senza confronto locale. Il service worker non forza l'aggiornamento sotto un modulo aperto.
- Il limite in byte della busta API non è ancora un limite preventivo del diario locale; grandi backup e copie di classe al limite dei campi possono non essere esportabili/importabili integralmente.
- Voti, attività e assenze personali non hanno ancora editor equivalenti alle classi; il modulo nuovo voto usa ancora la prima materia anziché quella scelta nella vista. La simulazione mantiene l'obiettivo nelle preferenze; alcuni filtri si perdono navigando. Questi problemi sono verificati nel codice e lasciati fuori dall'intervento di affidabilità.
- Polling classe ogni 30 secondi, snapshot intero per salvataggio e assenza di benchmark restano costi da misurare. Non sono stati introdotti sistemi distribuiti o infrastruttura anticipata.

## Un solo prossimo investimento

Con 100× l'utilizzo, la preoccupazione maggiore è il **recupero operativo dei dati**: eseguire e documentare un ripristino D1 in ambiente isolato, con responsabilità e obiettivi di recupero espliciti. La repository non prova che esistano backup operativi e restore verificati; la copia IndexedDB e il JSON esportato non li sostituiscono. Questo richiede una decisione operativa sul servizio, non una riscrittura del prodotto.
