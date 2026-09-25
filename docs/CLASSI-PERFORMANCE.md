# Schermata Classi: diagnosi e verifica locale

## Causa

Prima della correzione, `view-stage` aveva `key={activeTab}` e `ClassesView` era renderizzata solo con `activeTab === "classes"`. Ogni uscita smontava vista e pannello eventi. Al ritorno il loader principale aspettava `GET /api/classes` → `GET /api/classes/:id` →, per owner/moderator, `GET /api/classes/:id/invites`; il pannello avviava separatamente `GET /api/classes/:id/events` dopo il dettaglio. `cache: no-store` è corretto per queste API, ma non conservava lo stato React della schermata.

## Waterfall delle richieste

| Scenario | Prima | Dopo |
| --- | --- | --- |
| Prima apertura, member | elenco → dettaglio; eventi dopo dettaglio. 3 GET. | elenco → contenuto utile; dettaglio dopo elenco, eventi dopo dettaglio. 3 GET. |
| Prima apertura, owner/moderator | elenco → dettaglio → inviti; eventi dopo dettaglio. 4 GET. | elenco → contenuto utile; dettaglio ed eventi successivi. 3 GET; inviti solo all'apertura della gestione. |
| Ritorno al tab entro 30 s | Stessa cascata della prima apertura. | 0 GET, stato già renderizzato. |
| Ritorno dopo 30 s | Stessa cascata bloccante. | Elenco e dettaglio in background; eventi aggiornati dal loro timer/riattivazione. Nessun loader globale. |
| Classe A → B → A | Dettaglio ed eventi richiesti a ogni cambio. | Primo B: dettaglio ed eventi; ritorno ad A: dettaglio ed eventi dalla memoria, senza GET se recenti. |

Il conteggio “prima” deriva dal percorso verificato nel codice precedente, non da un trace di produzione. Il tempo utile precedente includeva tutti i segmenti della catena del loader: elenco + dettaglio (+ inviti amministrativi). Dopo la correzione il loader principale termina alla risposta dell'elenco; i successivi ritorni usano il DOM già montato. Una verifica UI locale su un account senza classi ha mostrato subito il contenuto ai cinque ritorni consecutivi; è stata osservata una sola rilettura dell'elenco al superamento della soglia di 30 secondi. Il tempo di circa 270 ms registrato dal controllo browser per ogni clic include l'automazione e non è una misura di paint dell'app.

Una seconda prova browser con due classi e account sintetici ha confermato: cambio A → B → A con un solo pannello eventi visibile e l'attività corretta; cinque ritorni Home → Classi con A e la sua attività subito presenti e zero nuove `GET /api/classes/**`; nessuna lettura inviti prima di aprire “Membri e gestione”; una lettura all'apertura; il member vede solo A e non può gestire inviti; dopo logout del member e login dell'owner la vista mostra A e B con ruolo owner. I dati sintetici sono stati rimossi dal D1 locale.

## Tempi API e database

Con due account sintetici sul server locale Wrangler/D1, due letture consecutive per endpoint hanno dato:

| Endpoint | Owner, ms | Member, ms |
| --- | --- | --- |
| `GET /api/classes` | 4 / 4 | 4 / 3 |
| `GET /api/classes/:id` | 6 / 6 | 6 / 4 |
| `GET /api/classes/:id/events` | 5 / 5 | 5 / 6 |
| `GET /api/classes/:id/invites` | 5 / 6 | non autorizzato |

Sono tempi end-to-end locali, non percentili di produzione. Il dettaglio esegue due letture D1 (classe e membri); elenco, eventi e inviti una lettura dati ciascuno, oltre alla verifica sessione e, per eventi/inviti, ai controlli di appartenenza/ruolo. `EXPLAIN QUERY PLAN` locale usa `class_members_user_idx` per l'elenco, la chiave `(class_id,user_id)` per appartenenza e `member_count`, `class_events_due_idx` per eventi e `class_invites_class_idx` per inviti. L'ordinamento di elenco, membri e inviti può usare un B-tree temporaneo, ma sui limiti correnti (50 classi, 100 membri, 50 inviti) e con questi tempi non emerge una giustificazione per nuovi indici o query.

## Coerenza

La cache vive solo nel `DiaryWorkspace` dell'utente: logout, cambio account e ricaricamento la distruggono; un 401 delle API Classi la svuota subito. Le letture server restano `no-store` e autorizzate. Se una lettura fallisce durante un refresh, la vista conserva gli ultimi dati con un errore visibile; una scrittura confermata invalida o aggiorna la porzione coinvolta prima della rilettura. Eventi e dettagli sono separati per `classId`; le risposte fuori ordine non sostituiscono la selezione corrente. Nessuna modifica è stata fatta al database o alla cache offline dell'agenda.
