# W8-A — schema, inizializzazione e recupero

**Perimetro aggiornato:** questo documento riguarda l’espansione 0007 ora rinviata in `operations/w8a/deferred-expansion/`. Il candidato security corrente non modifica lo schema e non richiede bootstrap. Il blocco amministrativo/restore resta valido per l’espansione; non impedisce di provare separatamente il rilascio senza migrazioni e il rollback del Worker.

17 ottobre 2026. [Rapporto](../../docs/improvement-2026-10-01/W8A-RELEASE-PREPARATION.md).

## Stato e vincoli

Questa procedura è provata **solo su D1 locale sintetico**. Nessun canale di esecuzione SQL, export o restore del D1 gestito Sites è esposto dai connettori attualmente disponibili. Dal successivo incarico del 17 ottobre è autorizzato esclusivamente creare e pubblicare un ambiente di prova Sites privato distinto, con DB dedicato e dati sintetici. La [qualifica del canale](PLATFORM-QUALIFICATION.md) da `cd38d40` conferma però il prerequisito amministrativo mancante: nessuna creazione o pubblicazione tentata. La produzione è esclusa dall’autorizzazione. Non eseguire la pubblicazione ordinaria: applicare la sola 0007 lascia auth bloccata fino all’inizializzazione operativa, anche per il vecchio Worker tramite trigger.

Produzione: progetto `.openai/hosting.json`, dominio ipagell.website, binding DB esistenti. Il Worker sperimentale non è staging della produzione. Non usare credenziali Cloudflare o ID database di altri progetti per aggirare il canale Sites mancante. Nessun endpoint amministrativo temporaneo è stato aggiunto all’app.

## Sequenza operativa da qualificare su ambiente gestito isolato

1. Identificare responsabile operativo e canale Sites amministrativo ufficiale per SQL parametrizzato, export/import e controllo della migrazione. Fissare un progetto di prova privato distinto, ID restituito da Sites e DB dedicato, senza domini/utenti/dati reali. Raccogliere i metadati prima e dopo. Non registrare un progetto fittizio nel manifest di produzione.
2. Definire e provare la finestra di manutenzione: bloccare il traffico/writer pertinenti sul progetto di prova prima di schema/bootstrap o export multi-fase. Le guardie auth non fermano da sole tutti gli aggiornamenti a diario e appunti. Nessun blocco del traffico è disponibile o stato attivato in questa sessione.
3. Creare un checkpoint del DB precedente alla 0007; conservare versione/sorgente Worker compatibile, schema/indici/trigger, dati, hash dell’artefatto, relazioni e stato migrazioni gestito dalla piattaforma. Definire ubicazione protetta, retention e responsabile del recupero. Non esportare dati reali nel repository o nella chat.
4. Applicare **0007 solo schema** con il percorso Sites. Nessun INSERT/UPDATE/DELETE di dati nella migrazione, nessuna 0008 e nessuna colonna rimossa. Confermare tutte le strutture previste. Se fallisce, verificare lo stato effettivo prima di un retry: una pubblicazione fallita può aver già applicato schema.
5. Nella stessa finestra prima di riaprire il traffico, eseguire [initialize-legacy.sql](initialize-legacy.sql) tramite il canale amministrativo qualificato. Non idempotente per scelta: stato esistente/paused/ignoto non viene sovrascritto o riaperto. Mancanza di tabella/riga o errore interrompe il rilascio. Verificare esattamente una riga (id=1, schema_version=7, write_mode=legacy), colonne legacy presenti e FK integre. La pausa tra schema e inizializzazione è reale, va misurata nello staging e non occultata come rollout senza interruzioni.
6. **Il backfill non è necessario per W8-A.** Login/register/recovery/security in legacy leggono/scrivono accounts anche con account_credentials vuota. Se serve una copia diagnostica, eseguire [backfill-legacy.sql](backfill-legacy.sql) esplicitamente, con parametri: cursore ID esclusivo e batch size 1..100. Per avanzare leggere la pagina degli ID di accounts con lo stesso cursore/limite e usare l’ultimo ID scansionato, anche se tutte le righe erano già copiate. Numero di righe inserite e ultimo RETURNING non sono un cursore affidabile su un replay. Le copie esistenti restano intatte e possono essere obsolete; nuovi account concorrenti richiedono una nuova scansione per una copia completa. In paused/credentials/stato assente non copia. Nessun risultato di questo backfill autorizza il futuro cutover.
7. Pubblicare il Worker W8-A solo dopo le prove, verificare login/password/recovery/cancellazione e i dati sintetici, poi riaprire il traffico. Provare anche ritorno al precedente Worker con DB 7/legacy inizializzato. Dopo eventuali DROP futuri il vecchio Worker non è una destinazione di rollback; tale ciclo è fuori perimetro.
8. Produrre un secondo checkpoint con schema 7/legacy; ripristinarlo **in un altro DB di prova vuoto**, senza sovrascrivere la sorgente. Confrontare schema, indici, trigger e tutte le righe; FK vuote, password verificabile, sequenze appunti e fencing funzionanti. Registrare tempi/RPO/RTO misurati, non stimati come prove. Non dichiarare qualificata la piattaforma con il solo test locale.

## Prova locale riproducibile

```bash
npm run test:auth-d1
npm run test:auth-restore
```

`test:auth-d1` usa un binding D1 in Worker effimero: schema-only resta fenced fino al bootstrap esplicito; auth legacy funziona senza copia; inizializzazione ripetuta non riapre paused; backfill limitato, replay e copia obsoleta non sovrascritta. Restano le regressioni precedenti, inclusa la fixture sintetica di compatibilità credentials; non viene consegnata o eseguita una 0008 operativa.

`test:auth-restore` genera da sé tre directory con DB placeholder e soli dati sintetici. Non accetta argomenti o target remoti, rimuove credenziali Cloudflare dall’ambiente dei processi figli e usa Wrangler sempre con `--local`. Esporta e ripristina checkpoint pre-0007 (15 tabelle) e post-0007 inizializzato/backfill esplicito (23 tabelle). Confronta tutte le righe/oggetti schema, FK, password, trigger appunti e fence; verifica che la sorgente non cambi. I file temporanei vengono rimossi anche in errore; il log finale contiene digest e risultati, senza dump o hash password.

### Ordine di restore verificato

La semplice importazione del dump completo locale è fallita con `no such table: main.classes`: venivano inserite righe prima che esistessero tabelle referenziate. La [guida D1](https://developers.cloudflare.com/d1/best-practices/import-export-data/) richiede ordine coerente delle dipendenze e descrive il differimento FK.

La prova corretta acquisisce dal medesimo DB statico un backup in tre file: schema tabelle/indici, export Wrangler solo dati e trigger. Li salva su disco con manifest SHA-256 e ripristina rileggendo proprio quei tre file dopo verifica delle impronte; una copia deliberatamente corrotta viene rifiutata. Il dump completo del primo tentativo fallito non è l’artefatto ripristinato e non viene dichiarato verificato. Crea tutte le tabelle/indici nel DB vuoto; importa il dump dati con `PRAGMA defer_foreign_keys=TRUE`; ricrea infine i trigger originali. Così i trigger delle note non riscrivono le sequenze esportate e le fence non bloccano il caricamento della riga auth. Confronta poi l’intero snapshot e verifica i trigger con mutazioni sintetiche sulla copia. Per un DB attivo, snapshot coerente e manutenzione restano da qualificare, non sono garantiti dalla somma di esportazioni distinte.

Il rapporto locale non include il journal migrazioni interno di Sites: non è esposto dal connettore né riprodotto da un bootstrap SQL manuale. Recuperare anche quello è parte del gate gestito. Il [Time Travel D1](https://developers.cloudflare.com/d1/reference/time-travel/) ripristina il DB in-place e richiede accesso amministrativo: non è stato eseguito e non prova il restore in un DB isolato. Non applicarlo alla produzione per dimostrare questo task.

## Gate ancora aperto e incarico minimo

Occorre un canale amministrativo Sites ufficiale con operazioni SQL/backup/restore. L’autorizzazione a creare e pubblicare **solo** un ambiente di prova privato separato è stata concessa il 17 ottobre; non sblocca da sola la prova. Senza il canale amministrativo non si può attestare bootstrap/backup/restore gestito, e HTTPS isolato resta non provato. Non basta creare un Site non pubblicato: non costituisce una prova del binding D1 e delle operazioni HTTPS.

L’intervento esterno necessario è descritto nella [richiesta alla piattaforma](PLATFORM-REQUEST.md): rendere disponibile il canale e assegnare un operatore, poi qualificare l’ambiente privato già autorizzato senza toccare la produzione. Se la piattaforma non li espone, riportare questo limite preciso al responsabile e mantenere chiuso il rollout; non sostituire di nuovo la prova mancante con unit test, localhost o un deploy nel progetto pubblico.
