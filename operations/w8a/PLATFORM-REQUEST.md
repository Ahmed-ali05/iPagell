# Richiesta operativa Sites — W8-A

**Perimetro aggiornato:** questo documento riguarda l’espansione 0007 ora rinviata in `operations/w8a/deferred-expansion/`. Il candidato security corrente non modifica lo schema e non richiede bootstrap. Il blocco amministrativo/restore resta valido per l’espansione; non impedisce di provare separatamente il rilascio senza migrazioni e il rollback del Worker.

Aggiornata il 17 ottobre 2026 dopo la ripresa da `cd38d40`, **non inviata**. [Qualifica del canale](PLATFORM-QUALIFICATION.md): blocco amministrativo confermato nella superficie disponibile. [Contesto e prove](../../docs/improvement-2026-10-01/W8A-RELEASE-PREPARATION.md).

Progetto produzione esistente: `appgprj_6aa9bf5f9a00819189df944bf2d51850`, https://ipagell.website, binding DB, pubblico. Versione 39, sorgente `a8cf046fe2cbe804cebdb80957e1ffa2c88893f1`. Non modificare progetto, DB, domini o accesso per rispondere alla richiesta.

Il candidato W8-A contiene espansione 0007 solo schema e conserva autorità legacy; richiede una singola inizializzazione amministrativa separata dopo schema e prima del traffico. Il backfill paginato è opzionale e non serve al login. Mancando l’inizializzazione, le fence DB bloccano anche il vecchio writer. Non proponiamo un deploy per cercare di scoprire a posteriori questo comportamento.

Chiediamo il percorso ufficiale e le capacità minime:

1. Come eseguire un’operazione D1 amministrativa separata dalle migrazioni, con binding/progetto verificabili e finestra di manutenzione schema → bootstrap → Worker → riapertura? Esiste un hook transazionale/coordinato o una procedura operatore documentata? Il connettore corrente non espone SQL amministrativo.
2. Come predisporre un progetto **privato e distinto** con D1 dedicato e HTTPS, senza dati reali né domini di produzione? L’utente ha ora autorizzato esclusivamente creazione e deploy di questo ambiente di prova privato, con DB dedicato e dati sintetici, per HTTPS e recupero. Il canale amministrativo è ancora assente nella superficie verificata: nessun progetto creato o deploy tentato; non serve chiedere nuovamente quel consenso. Fornire prima la procedura supportata e l’operatore per le fasi SQL/backup/restore.
3. Qual è il percorso autorizzato per snapshot coerente, export di schema/indici/trigger/dati **e stato interno migrazioni Sites**, import in altro DB di prova vuoto e verifica? Come viene riconciliato il journal dopo un restore? Il connettore corrente espone soltanto overview e righe read-only; non espone export/import o restore.
4. Chi esegue e approva il recupero, dove sono conservati gli artefatti protetti, quale retention/RPO/RTO è disponibile e come si prova il rollback Worker senza sovrascrivere la produzione? D1 Time Travel in-place da solo non certifica un restore isolato.

Non richiediamo credenziali, cookie, hash password o dati utente in chat; bastano un canale autorizzato e istruzioni ufficiali per il responsabile operativo. Non usare credenziali Cloudflare di altri progetti o il Worker sperimentale come sostituti. Fino a qualificazione, **nessun deploy W8-A su produzione**, nessuna 0008, cutover o provider. Risposta richiesta al responsabile operativo: documentazione/API o console amministrativa ufficiale accessibile, ambito progetto/DB, modalità di coordinamento, gestione del journal e incaricato del recupero. L’abilitazione del canale non autorizza interventi su ipagell.website; la prova resta soltanto privata e distinta.

Disponibili nel repository: SQL schema-only, bootstrap non idempotente, backfill opzionale limitato, runbook, test D1 e rehearsal locale export/restore pre/post espansione. Il caso minimo di bootstrap è `INSERT INTO auth_schema_state(id,schema_version,write_mode) VALUES(1,7,'legacy')`; nessuna scrittura a credenziali o dati utente è necessaria per il bootstrap W8-A.
