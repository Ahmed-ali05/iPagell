# iPagell — Architettura corrente

[Indice](README.md) · [Snapshot](REPO-SNAPSHOT.md) · [API](API.md) · [Verifiche](VERIFICATION-MATRIX.md)

Aggiornamento: **1 ottobre 2026**. Descrive Sites 28 e la patch annuale nel checkout, in verifica/pubblicazione, dopo il confronto iniziale con Sites 27 e il ciclo ingresso/SEO; le evidenze e i limiti sono nella matrice. Le vecchie analisi sono conservate in [ARCHITECTURE-HISTORY](ARCHITECTURE-HISTORY.md). Il codice attuale prevale sempre sulla guida.

## 1. Runtime, ingressi e navigazione

Il sorgente segue Next App Router; `scripts/run-framework.mjs`, Vinext, Vite e il plugin Cloudflare producono client e Worker compatibile con Workers. `vite.config.ts` usa `sites({ mockAuth: false })` e binding derivati da `.openai/hosting.json`. Il profilo locale sostituisce i binding del Worker sandbox: non li concatena. `IPAGELL_DEPLOY_TARGET=cloudflare` seleziona il Worker indipendente; non è il percorso della produzione Sites.

- `app/layout.tsx`: lingua, metadata, provider globali, installazione PWA e protezione dell'host canonico.
- `app/page.tsx` e `app/[locale]/page.tsx`: landing SSR italiana e localizzate.
- `lib/i18n/public-routes.ts` e `app/[locale]/[tool]/page.tsx`: route pubbliche del calcolatore; calcoli solo nel browser.
- `proxy.ts`: lingua iniziale SSR e redirect dagli alias previsti.
- `app/app/page.tsx`: monta `IPagellApp`; `mode=register` apre registrazione. L’ingresso mostra i passi account/recupero/diario; il setup conserva nome e materie in vista e semestre/date nella sezione espandibile dello stesso form. Google/Apple/email restano pianificati, non implementati.

Dentro `/app`, `DiaryWorkspace` è identificato dall'account e gestisce viste Home, Agenda, Voti, Assenze, Statistiche e Classi. La barra contiene cinque voci; Statistiche si apre da Voti. Appunti è una vista del workspace, con ingresso da Home, Agenda e materia in Voti, non una route pubblica. Query `view=agenda`, `view=classes`, `action=grade` e hash `join=` sono ingressi client; `uiLocale` è un ponte temporaneo per la lingua.

Agenda viene montata al primo accesso e conservata quando nascosta: calendario/elenco, filtro, mese e giorno restano nel workspace. La vista Classi conserva selezione e cache in memoria per classe. Cambi di contesto che lasciano un editor attendono `flushOpenNotes()`; un errore blocca il cambio anziché fingere un salvataggio. Questi stati non sono una preferenza persistente fra sessioni.

Voti e Statistiche condividono `GradeScope` nel workspace: Periodo / Anno / Storico, default anno del periodo corrente. `lib/grade-scope.ts` filtra per appartenenza `semesterId` ed etichetta `schoolYear` esatta, include archiviati e risolve ID rimossi/importati senza mutare dati. Scope e materia selezionata sono UI, esclusi da schema/backup; il ritorno ai voti conserva anche la posizione. Il filtro non modifica `currentSemesterId`, Home, Agenda, Assenze o tool browser. `EntryDialog` seleziona un periodo reale solo per il nuovo voto. Media/trend usano i singoli voti inclusi e i pesi correnti; nessuna media delle medie dei periodi.

### Gerarchia UI del 10 ottobre


`components/action-menu.tsx` riusa DropdownMenu Radix: operazioni secondarie del singolo elemento nei menu contestuali, navigazione e comandi frequenti visibili. Non esiste un pulsante generale Azioni. La chiusura del menu restituisce il focus al trigger prima di aprire una finestra. Agenda ha una barra unica per vista/origine/azioni/inserimento; Classi mantiene creazione e ingresso visibili, con inviti nella sezione di gestione. Voti usa un selettore materia, confronto medie espandibile e simulatore chiuso inizialmente; il filtro di ambito resta visibile. Assenze espande il riferimento solo su richiesta. Lingua e tema sono in Impostazioni; il normale salvataggio ha un indicatore compatto, mentre problemi e conflitti mantengono i percorsi di recupero esistenti. Nessuna modifica a payload, formule o permessi. [Analisi e decisioni](UX-SIMPLIFICATION-2026-10-10.md).

`components/related-notes.tsx` condivide i riquadri della stessa materia e il ritorno del focus al titolo nei due lettori. Selezione e transizione sono stato UI; nessun endpoint, payload o dato persistente aggiunto.

## 2. Quattro percorsi dei dati

| Percorso | Stato locale | Stato remoto | Regola di scrittura |
|---|---|---|---|
| Diario personale | `ipagell-db`, store `accounts` | `diaries.payload` | Snapshot completo e CAS revisione |
| Attività della classe e agenda collegata | Cache agenda per account; cache vista in memoria | Eventi e sottoscrizioni normalizzati | Scritture online, revisione e permessi |
| Appunti personali | `ipagell-notes-db`, record remoto + bozza + eventuale `inFlight` | `personal_notes`, sequenza per account | Commit locale, outbox e riconciliazione per nota |
| Appunti della classe | Bozze private in `classDrafts` | `class_notes`, materie di classe e pin per membro | Commit locale della bozza; anteprima e conferma online |

Le note e le sottoscrizioni non vengono inserite in `SchoolData`: un vecchio client del diario non le elimina salvando lo snapshot. Una classe non riceve voti, assenze, preferenze o testi personali non copiati esplicitamente.

## 3. Identità e confini HTTP

`lib/server/auth.ts` risolve la sessione iPagell dal cookie; nessun header ChatGPT autentica un account. Token sessione e codice recupero sono conservati come digest; password con scrypt in `lib/server/password.ts`. I dettagli e i limiti sono in [SECURITY](../SECURITY.md).

Registrazione account e primo diario sono due operazioni: `POST /api/auth/register`, poi `POST /api/account`. Un account con `diary: null` è in onboarding. Login emette una sessione; recupero ruota il codice e invalida le sessioni; cambio password mantiene il codice ma incrementa `auth_version`. Un proprietario deve trasferire o eliminare le classi prima di cancellare l'account.

`lib/server/http.ts` applica Origin same-origin, rifiuto Fetch Metadata cross-site, JSON e lettura streaming con limite. Gli endpoint privati rispondono `private, no-store`; le API non entrano nella cache PWA. `expectedUserId` e `X-IPagell-Account` rilevano cambio account, senza sostituire cookie e proprietà.

Classi richiede `IPAGELL_CLASSES=enabled`, membership corrente e ruolo. `lib/server/note-http.ts` richiede anche contratto Appunti 2 su note personali, condivise, pin e archivio autore. Le route materie della classe usano gli stessi controlli di account/membership ma non richiedono l'header del formato note. [Contratto API](API.md) documenta corpi, eccezioni e codici.

## 4. Sessione e sincronizzazione del diario

La conferma di accesso `authenticate()` verifica l’identità prima di lasciare il form: un errore di rete/attivazione conserva la schermata e il codice di recupero, senza aprire la copia offline di un altro account.

`hooks/use-diary.ts` è un adattatore React di `createDiarySession()` in `lib/diary-session.ts`, sottoscritto con `useSyncExternalStore`. Il controller mantiene una coda unica per load, commit, sync e logout; ticket di generazione invalidano risultati pendenti dopo cambio account o smontaggio.

```text
azione UI → recipe su copia dei dati → diarySchema
  → IndexedDB dirty=true, confronto atteso nella transazione
  → aggiornamento UI → PUT /api/diary
  → sessione + expectedUserId + CAS SQL revisione
  → IndexedDB pulito solo dopo conferma e commit locale
```

`lib/account-storage.ts` confronta e scrive atomicamente lo snapshot locale atteso. Questo protegge anche da una seconda scheda, oltre alla coda in memoria. Non c'è merge automatico o CRDT. Un 409 può confermare una risposta persa solo se il server contiene tutti i campi del medesimo snapshot; altrimenti il draft resta in conflitto. La copia server viene scelta esplicitamente dopo aver conservato il backup.

Stati: `saved`, `saving`, `offline`, `conflict`, `device-conflict`, `error`, `expired`. Fasi: `loading`, `anonymous`, `onboarding`, `ready`, `error`. Riprova su `online` e ritorno visibile; il listener `storage` rileva cambio dell'account attivo.

Solo un fallimento di rete della richiesta di identità permette il fallback alla copia del puntatore locale attivo. Un 401 o un errore storage dopo identità autenticata non può aprire l'account precedente. `ipagell-db` versione 2 contiene `accounts` e `state` legacy; il puntatore è `ipagell-active-account-v2`. Le preferenze correnti fanno parte dello snapshot.

## 5. Classi, attività e sottoscrizioni

`components/classes-view.tsx` coordina elenco/dettaglio, membri e inviti; `ClassEventsPanel` gestisce attività. Gli inviti si caricano aprendo gestione. Elenco e dettaglio vengono letti separatamente; le cache di vista in memoria si aggiornano al ritorno quando obsolete. [Prestazioni e limiti](CLASSI-PERFORMANCE.md).

`lib/classes/permissions.ts` e i repository SQL verificano proprietà e ruoli. La creazione classe crea il proprietario ma non un invito automatico. I codici sono generati separatamente e conservati come digest; un ex membro richiede un invito successivo alla partenza. `membersVisible` non è applicato come controllo di occultamento dell'elenco.

Le attività conservano `class_events.subject` come etichetta, anche per vecchi client. Le materie normalizzate `class_subjects` servono agli appunti; migrazione e trigger seminano le etichette esistenti senza convertire gli eventi in riferimenti privati.

`hooks/use-class-agenda.ts`, `lib/classes/agenda-coordinator.ts` e `class-event-repository.ts` gestiscono sottoscrizioni con snapshot dell'evento e campi personali separati. Home e Agenda uniscono `data.agenda` e le sottoscrizioni soltanto per visualizzazione. Il coordinatore protegge pending concorrenti e applica una lettura finale coerente. La cache `ipagell-class-agenda-v1:<userId>` è validata, distinta dal diario e rimossa su fine sessione.

Refresh all'avvio, ogni 30 secondi se visibile, su online/visibilità. Le mutazioni richiedono connessione. Trigger conservano snapshot dopo uscita, rimozione, annullamento o cancellazione; detach volontario interrompe il collegamento e rende modificabili i campi della copia personale. Nessun push o aggiornamento istantaneo garantito.

## 6. Appunti: persistenza e riconciliazione

`hooks/use-notes.ts` coordina lettura, outbox personale e bozze di classe. IndexedDB `ipagell-notes-db` versione 2 contiene `personal`, `classDrafts`, `meta`; i dati sono separati per `userId`. Il record personale è `remote`, `draft`, `localVersion` e l'opzionale `inFlight`. Meta conserva cursore/completamento e piano d'import.

`lib/notes/reconcile.ts` contiene transizioni pure applicate da `storage.ts` nella stessa transazione di lettura/check/scrittura. Il confronto atteso distingue contenuto e ID di mutazione dai metadati aggiornati dalla sincronizzazione. Una vera scrittura di un'altra scheda o un conflitto remoto resta protetta.

```text
editor → coda autosave → transazione della bozza
  → conferma locale → aggiornamento vista, best effort
  → snapshot inFlight persistito → richiesta API
  → conferma della stessa mutazione → transazione di riconciliazione
  → bozza successiva rebased oppure copia pulita
```

Una risposta persa ritenta l'esatto payload `inFlight`. La conferma dell'antenato aggiorna revisione/formato della bozza successiva senza cancellare il testo nuovo. Un risultato diverso diventa conflitto; pagine vecchie non regrediscono nota o cursore. Rifiuti definitivi 400/413 liberano la richiesta respinta; errori di rete conservano il payload incerto. Draft incompleti o non canonici non vengono inviati. Il loop è limitato e riprogramma il lavoro restante.

Il cursore personale `changeSeq` è aggiornato insieme alla pagina ricevuta. D1 verifica quote, revisioni, ID di mutazione e `expectedContentFormat`. Tombstone comunica eliminazioni senza confonderle con note mancanti. `BroadcastChannel` notifica aggiornamenti locali ma non è l'autorità delle scritture.

La bozza di classe resta privata sul dispositivo, conserva la revisione del testo inizialmente aperto e non viene pubblicata per un refresh o una riconnessione. `Controlla e condividi` salva, apre anteprima, poi richiede conferma. Membership, autore e moderazione sono verificati dal server. Dopo uscita l'autore può recuperare o ritirare solo i propri testi; cancellazione classe stacca `classId`, non cancella automaticamente gli appunti dell'autore. Il pin di classe è per membro.

Le materie personali sono ID del diario, indipendenti dal semestre; quelle di classe sono un elenco separato. Rinomina/archiviazione/eliminazione conserva i nomi storici nelle note. Le copie fra spazi hanno nuovi ID e richiedono materia nello spazio di destinazione: non c'è sincronizzazione fra copie.

## 7. Editor, formato e recupero

`components/note-editor.tsx` usa ProseMirror con schema chiuso: paragrafi, titoli di sezione, elenchi, testo, grassetto e a-capo. `lib/notes/format.ts` è parser/serializzatore condiviso da lettura, estratti, ricerca, anteprima e PDF. `plain` resta letterale; i comandi di formattazione convertono a `md-lite-v1` solo se rappresentabile. Il server richiede serializzazione canonica. Nessun HTML della nota viene inserito nel DOM; `NoteContent` rende nodi React ammessi.

La toolbar resta montata in editing, sopra il corpo su desktop e dopo il corpo su mobile; menu mobile verso l'alto. Bookmark e normalizzazione della selezione in `editor-selection.ts` preservano testo/schema durante comandi, selezione completa e composizione. Un comando oltre limite o fallito ripristina lo stato precedente; errori di salvataggio permettono retry e copia/download del testo.

`lib/notes/autosave.ts` e `hooks/use-note-autosave.ts` condividono un writer per editor, debounce 700 ms, flush su cambio vista e visibilità. Richieste sovrapposte condividono il lavoro in corso e includono modifiche sopraggiunte; un errore lascia dirty per il retry. Prima di unload dirty il browser riceve un avviso, ma l'evento non garantisce l'esecuzione completa di operazioni asincrone. Una chiusura senza modifica non crea una bozza vuota.

`NoteExport` carica `lib/notes/pdf.ts` su richiesta, con font locali e licenze versionate. Produce PDF con titolo/materia/data e testo strutturato, offre download/apertura/condivisione quando disponibili; Markdown è secondario, plain ha anche `.txt`. Non genera DOCX. Per comportamento e limiti: [Editor Appunti](APPUNTI-EDITOR-SPEC.md).

## 8. Backup, import e uscita

`lib/notes/backup.ts` esporta V3: diario/preferenze, note personali, bozze/conflitti, bozze di classe e snapshot delle proprie note condivise. `contentFormat` è esplicito; `inFlight` non è portabile. Export completo aggiorna il personale e legge l'archivio autore; una failure richiede conferma di `device-only`. Agenda collegata è esportata come copia personale senza membership/inviti.

Il parser accetta V1 diario, V2 interpretato `plain`, V3 con formato. File V2/V3 massimo 24 MiB; V1 massimo 1.500.000 byte. L'import V1 sostituisce il diario e conserva note correnti. V2/V3 verifica quota, rimappa ID di diario/materie/note e registra un piano locale riprendibile; il diario viene sostituito, gli appunti aggiunti, i testi di classe diventano copie personali. Non ricrea classe né pubblica. La busta HTTP del diario mantiene limite separato 1.500.000 byte.

Prima di export, import o logout si esegue il flush degli editor. Con note/bozze pendenti il logout offre export e conserva il loro archivio per lo stesso account; senza pending può rimuoverlo. La copia del diario attiva è gestita separatamente dalla sessione. Cancellazione account e cambio password non cancellano file scaricati o archivi di altri dispositivi. [Guida utente](GUIDA-UTENTE.md) e [Sicurezza](../SECURITY.md).

## 9. Lingue, voti e PWA

it/de/fr/en: cataloghi con chiavi e placeholder verificati, scelta interfaccia in localStorage separata dall'account e dai payload. URL pubblici influenzano SSR e ponte iniziale; contenuti utente non vengono tradotti. Le landing e utility hanno otto URL canonici nella sitemap; `/it` è alias e `/app` noindex. [I18N](I18N.md).

`lib/grading.ts` centralizza scala `numeric-1-6`, sufficienza 4, parsing e precisione. `lib/calculations.ts` mantiene media ponderata per voto×tipo e generale per coefficiente di materia. Il calcolatore pubblico riusa l'aritmetica con pesi inseriti dall'utente, senza salvare dati o chiamare API. Altre scale e selezione dello schema non sono implementate. [Sistema voti](GRADING-SYSTEM.md).

`InstallAppProvider` registra il service worker in produzione su landing/app; il calcolatore non richiede installazione. `scripts/generate-precache.mjs` trasforma il template in `dist/client/sw.js`, includendo asset con hash e manifest localizzati. Shell network-first, asset ammessi cache-first, esclusione API/RSC; nessun `skipWaiting()`. La visita al calcolatore non deve sostituire da sola la shell offline. Notifiche da codice dell'app aperta, senza scheduler push. Installazione e tastiera su device fisici restano verifiche distinte.

## 10. Schema, controlli e produzione

[Inventario](REPO-INVENTORY.md): 15 tabelle, 7 migrazioni, route/metodi, script e dipendenze verificati dal sorgente. Le migrazioni 0005/0006 aggiungono appunti, materie, pin e formato; non modificare SQL già pubblicato. `diaries.user_id` non ha FK SQL verso accounts: la cancellazione passa dalle API transazionali.

`npm run check` comprende lint, TypeScript, test, cataloghi, inventario e link documentali. `release:prepare` aggiunge build/precache. La CI include audit dipendenze, non suite API/browser e non deploy. Risultati reali e lacune: [Matrice di verifica](VERIFICATION-MATRIX.md).

La produzione usa il progetto Sites in `.openai/hosting.json`, binding `DB`, accesso e domini esistenti. `.openai/hosting.json` non contiene segreti runtime. Il Worker di `wrangler.jsonc` e `deploy:sandbox` è distinto. Pubblicazione richiede commit sorgente inviato a Sites, versione salvata e deploy `succeeded`; push GitHub non pubblica. [Procedura](DEPLOYMENT.md).

Questa architettura non certifica dati reali, restore infrastrutturale, performance massime, accessibilità completa, sicurezza indipendente o tutti i device. AI, file/R2, annunci, chat e co-scrittura restano fuori dal runtime attuale.
