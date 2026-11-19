# Account W8-A — compatibilità e sicurezza

17 ottobre 2026. [Piano](PLAN.md) · [Architettura account](AUTH-PRODUCT-AUDIT.md) · [Verifiche](VERIFICATION.md).

## Separazione successiva del rilascio security

Il candidato corrente supporta lo schema Sites 39 invariato senza bootstrap; 0007 e snapshot erano conservati in `operations/w8a/deferred-expansion/`, fuori dal runner; dal 17 novembre 2026 sono in `drizzle/` sul branch W8-B ([piano](W8B-PIANO-CLOUDFLARE.md)). Le correzioni security restano, con modalità server esplicita `legacy-unexpanded` e verifica dello schema anche nelle scritture finali. Le sezioni seguenti documentano la precedente implementazione con espansione; stato attuale e prova gestita nel [rapporto di preparazione](W8A-RELEASE-PREPARATION.md). Non confondere rollback del Worker e restore DB.

## Risultato e perimetro

Implementazione locale di **W8-A / prompt 05**: espansione 0007, adattatore compatibile e correzioni security indipendenti dai provider. Nessuna migrazione remota, configurazione esterna o pubblicazione. **W8 complessivo non è completato**; W8-A non è ancora la release intermedia pubblicata richiesta prima della contrazione.

Baseline Git `fdd59f8`, branch `codex/identity-architecture-20261001`. Il checkout iniziale conteneva già molti interventi successivi a W7, inclusi documenti dei rilasci Sites 33–36. Conservati senza reset/stash, commit complessivo o riscrittura della cronologia. La vecchia consegna «checkout pulito / Sites 29» descrive W7, non lo stato trovato in questa ripresa. Nessuna verifica live Sites eseguita: non dedurre da questo rapporto la versione attualmente online.

Un solo writer; revisione separata in sola lettura con **gpt-6.1-sol / high**, conclusa senza blocchi individuati nel perimetro W8-A. Nessuna chiamata Astra e nessuna impostazione globale modificata.

## Comportamento implementato

- [0007](../../drizzle/0007_auth_compatibility.sql) aggiunge otto tabelle auth e `accounts.auth_operation_id`, senza modificare 0000–0006 o ricreare accounts. La revisione operativa successiva rende la 0007 solo schema: inizializzazione separata e backfill esplicito opzionale fuori dalle migrazioni, come descritto nel [runbook](../../operations/w8a/RUNBOOK.md). La copia preserva gli hash byte per byte e non serve per autenticare in legacy. Schema e snapshot Drizzle aggiornati; 23 tabelle e 8 migrazioni nel sorgente, non una dichiarazione sul DB remoto.
- [AuthRepository](../../lib/server/auth-repository.ts) riconosce solo schema 7/legacy o 8/credentials. Stato assente, ignoto o paused fallisce chiuso. In legacy tutte le operazioni usano esclusivamente accounts: nuove registrazioni/reset/password possono rendere la copia obsoleta e non la rendono mai autorevole. Non esistono writer bidirezionali.
- In credentials le query non citano le colonne segrete di accounts. Registrazione account+credenziale è atomica; credenziale assente non abilita password né recovery. Il KDF dummy rimane sul login e sulla verifica security senza password.
- I trigger DB fermano anche writer già oltre il controllo applicativo quando auth è paused. Sono inclusi DELETE di inviti e diari, perché il vecchio security handler poteva aver già avviato quel batch. La pausa può quindi impedire anche la cancellazione di una classe con inviti: è una finestra operativa da pianificare.
- Password e cancellazione rivalidano digest della stessa sessione, scadenza e auth_version nel SQL finale. In credentials un marker casuale di operazione lega la scrittura della password al CAS vincente. Tutti gli effetti della cancellazione condividono il predicato; account cancellato riconosciuto dal `RETURNING id`, senza inferirlo dai conteggi CASCADE. La FK RESTRICT protegge anche ownership acquisita durante la richiesta.
- Il controller diario esegue il flush prima della richiesta security, cattura ID/snapshot, controlla copia pulita e puntatore, quindi invalida la propria generazione subito dopo successo remoto. La cancellazione tenta pulizia diario/agenda e archivio note dello stesso ID, senza azzerare il nuovo account intervenuto nel frattempo. Storage fallito non ripristina la vecchia UI; un messaggio nelle quattro lingue segnala le copie locali non rimosse.
- Le eccezioni server inattese registrano solo il nome dell’errore. Niente testo di query/parametri, errori provider o segreti nel log applicativo.

Riferimenti del modello SQL: [batch D1](https://developers.cloudflare.com/d1/worker-api/d1-database/), [foreign key D1](https://developers.cloudflare.com/d1/sql-api/foreign-keys/), [trigger SQLite](https://www.sqlite.org/lang_createtrigger.html). Le prove sopra il codice restano necessarie.

Le strutture identity/email/transaction/challenge/grant/browser sono **riservate e inattive**. Non sono un protocollo OAuth completato, non espongono nuove route e non creano metodi utilizzabili. Flag provider, coordinatore browser epoch e callback sono lavoro successivo prima di abilitare provider. Nessuna dipendenza OAuth aggiunta in W8-A.

## Verifiche iniziali eseguite (prima della revisione operativa)

| Prova | Esito e limite |
|---|---|
| `npm run check` | 135 test passati; lint, TypeScript, cataloghi it/de/fr/en, inventario e link documentali. Sette regressioni aggiunte a questo checkout: cinque controller security, pulizia note per ID e redazione errori. |
| `npm run test:auth-d1` | 8 test passati contando contenitore e sette sottotest. D1 reale locale in workerd/Miniflare, effimero, senza persistenza o dati remoti. |
| Espansione con dati | Migrazioni storiche, account/sessioni, diario, membership, invito e nota sintetici prima di 0007. Hash/ID/relazioni preservati; trigger note ancora funzionante e `foreign_key_check` vuoto. |
| Autorità e concorrenza | Password/reset successivi al primo backfill non riattivano gli hash vecchi. Replay con versione precedente rifiutato. Sessione stale/revocata/scaduta non elimina inviti/diario/account. Pausa ferma SQL legacy e rollback di un batch già iniziato; stato ignoto/assente fallisce chiuso. |
| Compatibilità credentials | Solo fixture sintetica: backfill finale e DROP fisico delle due colonne, poi stato 8/credentials. Due mutazioni concorrenti hanno un vincitore; nessun orfano per username duplicato; account privo di credenziale non riceve hash fittizi. **Non è una migrazione W8-B distribuibile né una prova del cutover operativo.** |
| Race proprietà/cancellazione | Ownership assegnata dopo lettura: FK rifiuta DELETE e il batch conserva invito e diario. Rimossa ownership: cancellazione valida elimina A e i suoi dati, preservando B. |
| Migrazioni Wrangler | Tutte le 8 applicate con `--local` a `/private/tmp/ipagell-w8a-preview-state`, DB placeholder Sites. Nessun accesso al Worker sperimentale o al DB Sites remoto. |
| `npm run build` | Build Sites e precache completati, 31 asset. Restano gli avvisi già osservati su chunk >500 kB e classificazione statica delle route Vinext. |
| `TEST_BASE_URL=http://127.0.0.1:5181 npm run test:api` | 146 controlli passati sulla build locale: contratti auth/cookie, recovery, sessioni, proprietà classi, note e cancellazione; account sintetici ripuliti. |
| Browser build finale | IAB, viewport osservato 591×853, italiano/tema scuro: login sintetico → Home → Impostazioni/Preferenze → moduli password/eliminazione → uscita e ritorno al form. Nessun provider visibile. Account browser poi eliminato tramite API locale e sessione verificata 401. |
| Pulizia e generazioni | Test sul controller reale con richieste ritardate/flush fallito/storage negato; test IndexedDB con fake-indexeddb su note, bozze classe e import metadata A/B. Non è una prova fisica di eviction o chiusura forzata. |
| Revisione separata | Sol high, sola lettura su SQL, route, adattatore, lifecycle client e prove. Nessun blocco trovato; restano i gate sotto. |

Miniflare installato è v5 alpha: `getD1Database()` nel bridge Node si bloccava. Il test usa il binding D1 dentro un Worker effimero e invia query tramite HTTP loopback; SQL, batch e vincoli sono eseguiti dal D1 locale. Non usa un repository SQL finto. Il test è separato da `npm test` perché richiede socket locali; nessuna dipendenza aggiunta. Le due prove diagnostiche bloccate sono state terminate.

Il delta di questa sola ripresa, separato dalle modifiche pregresse, è conservato in `outputs/w8a/w8a.patch` rispetto alle copie iniziali di `/private/tmp/ipagell-w8a-baseline`. Non è un commit Git; il checkout resta modificato.

Screenshot locale di fine prova: `outputs/w8a/browser-logout.png` (ignorato da Git, nessun segreto). Le prove API non sono state ripetute sui provider o sul dominio canonico. Non eseguiti il submit security nel browser, le viewport 320/390/desktop, temi/lingue completi, device fisici o sicurezza indipendente.

## Prima del rollout e di W8-B

1. Preparare un ambiente D1/HTTPS isolato gestito tramite Sites, provare restore e attribuirne la responsabilità operativa. Confermare il percorso reale delle migrazioni Sites. I test locali non lo certificano.
2. Pubblicare e verificare la release intermedia W8-A con 0007 in legacy soltanto secondo prompt 08, preservando DB/domini/accesso. Questo rapporto **non autorizza né dichiara un deploy**. Il vecchio runtime può convivere con l’espansione legacy solo dopo inizializzazione; tra schema e bootstrap anche i vecchi writer auth sono bloccati dai trigger. Il nuovo richiede 0007 e singleton 7/legacy inizializzato.
3. Preparare 0008 in un sottociclo separato: pausa/fencing, richieste in volo, backfill finale verificato, conteggi/hash/FK/trigger, DROP delle sole colonne, stato coerente e riapertura. Le guardie che impediscono anche il backfill durante paused vanno gestite nella medesima unità transazionale verificata, senza lasciare una finestra ai writer. Non portare in produzione il SQL della fixture test.
4. Provare restore e rollback a **W8-A compatibile**, non alla vecchia pubblicazione dopo DROP. L’esistenza del ramo credentials non certifica da sola quel rollback. Prima dei provider, coordinare tutti i login/register/logout con browser epoch e provare cookie tardivi/switch, atomicità della creazione con prova e sessione, grant e ultimo metodo.
5. Solo dopo cutover: linking legacy, poi Google/email reali. Mancano client test/production Google, secret nel vault, redirect/origine HTTPS, consent/test users e prova reauth fresca; servizio email/sender/SPF/DKIM/DMARC/supporto. Non incollare segreti nella chat. Apple resta W9 con Developer/app primaria/Services ID/key/relay e callback/revoca provate.

La prossima ripresa è la **preparazione operativa e verifica W8-B**, preceduta dai gate restore/ambiente e dal rilascio intermedio W8-A. Se indisponibili, mantenere questa patch chiusa nel perimetro locale e passare a W2 su un checkout stabile secondo il workflow; non abilitare provider o mescolare una contrazione parziale con altri contratti dati.
