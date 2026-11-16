# Prove security senza migrazioni — 17 ottobre 2026

[Rapporto](../../../../docs/improvement-2026-10-01/W8A-RELEASE-PREPARATION.md).

`managed.json` registra Site privato, versioni/deployment, prove HTTPS/account/rollback e pulizia. Risposte native selezionate senza credenziali, token, cookie o URL firmati. Il binding è provisionato da Sites per il nuovo progetto; il connettore non espone l’ID fisico del D1.

`release-prepare.log`: 137 test applicativi, lint/tipi/cataloghi/inventario/link/build. `api.log`: 146 controlli sul nuovo DB **locale** con 0000–0006, account rimossi. `deferred-local-restore.log`: regressione del percorso dei file 0007 rinviati; restore soltanto locale, nessuna attestazione amministrativa Sites.

Il probe [managed-security-probe.mjs](../../managed-security-probe.mjs) è un client delle normali API dell’app, non un endpoint o una console SQL. Accetta solo l’URL esatto del Site privato; legge configurazione e token da stdin e mantiene cookie/password/recovery in memoria. Eseguire da un terminale con eco input disabilitata; prima `configure`, poi `seed`, `candidate`, `rollback`, `reapply`, `cleanup`, coordinando le pubblicazioni con i tool ufficiali Sites. Non conservare l’input. Nel sorgente è stata resa generica la diagnostica degli assert per evitare che un futuro errore stampi cookie. Non rieseguito dopo le sole modifiche di redazione del logging e chiusura esplicita di stdin al cleanup. Due errori iniziali dell’harness sul formato del diario sono stati corretti e gli account parziali rimossi prima della prova finale.

`SHA256SUMS` identifica i byte dei file prova e del probe. Non ci sono dump DB, dati utente o segreti effettivi. Il rollback del Worker **non è** un restore DB; backup/journal/restore gestiti, retention e RPO/RTO restano non qualificati.

Il log release-prepare è normalizzato rimuovendo soltanto gli spazi di fine riga generati dalla tabella Vite; managed.json conserva anche SHA-256 dello stdout originale.
