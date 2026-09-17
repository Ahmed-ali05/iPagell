# Architettura e dati

[Indice](../README.md) · [API](API.md) · [Manutenzione](MANUTENZIONE.md)

Descrizione del codice corrente, non del solo brief iniziale. Stato documentato: 16 settembre 2026. Le architetture future sono separate nelle specifiche [Classi](CLASSI.md) e [Spazio studio AI](SPAZIO-STUDIO-AI.md).

## Componenti e responsabilità

```text
Interfaccia React
  └─ useDiary: stato, coda mutazioni, sincronizzazione
       ├─ IndexedDB: snapshot per account + modifiche in attesa
       └─ API same-origin: sessione, validazione, proprietà, revisione
            └─ D1: account, sessioni, limiti, snapshot diario
Service worker: solo shell e asset statici; nessuna API in cache
```

| Percorso | Responsabilità |
|---|---|
| `app/page.tsx`, `app/layout.tsx` | Entrata, metadati e PWA |
| `components/ipagell-app.tsx` | Coordinamento del diario, navigazione, dashboard, agenda, voti e impostazioni |
| `components/absences-view.tsx`, `stats-view.tsx` | Viste Assenze e Statistiche; ricevono dati e azioni dal diario |
| `components/classes-view.tsx` | Classi private, membri, ruoli, inviti e azioni amministrative C1 |
| `components/account-gate.tsx`, `account-security.tsx`, `entry-dialog.tsx` | Accesso/onboarding, gestione credenziali, inserimento dati |
| `hooks/use-diary.ts` | Fasi dell’app, accodamento per istanza, copia locale e server |
| `lib/validation.ts`, `auth-validation.ts` | Schemi runtime e limiti; riferimento per dati accettati |
| `lib/calculations.ts` | Medie, simulatore e andamento incrementale |
| `lib/account-storage.ts` | IndexedDB, backup e recupero legacy |
| `lib/server/` | Sessioni, hashing, controlli HTTP e query parametrizzate |
| `db/schema.ts`, `drizzle/` | Schema D1 e migrazioni versionate, incluse le fondamenta isolate delle classi |
| `public/`, `scripts/generate-precache.mjs` | Asset PWA e generazione allowlist del service worker |

React/TypeScript, Tailwind e componenti Radix/Shadcn; grafici Recharts. Vinext/Vite produce il Worker e il client usando convenzioni compatibili con Next. Non trattare il repository come un server Next standard. Il backend usa D1 tramite binding `DB`; nessun R2 configurato e nessun servizio email.

## Semplicità architetturale e priorità di prodotto

La complessità deve essere proporzionata al beneficio. Account, permessi, offline, backup e conflitti risolvono problemi reali: vanno mantenuti affidabili. Nuovi framework, livelli di compatibilità e sistemi di cache richiedono invece un vantaggio concreto prima di essere introdotti.

- Preferire comportamenti standard del Web: la pagina pubblica apre `/app` con normali link HTML, senza prefetch o transizioni RSC.
- Stabilizzare la build esistente e mantenere le dipendenze che servono al prodotto; nessuna riscrittura generale.
- Estrarre gradualmente viste complete dal componente principale. Assenze e Statistiche sono separate; stato, persistenza e sincronizzazione restano nel flusso esistente.
- Per l'ambiente Sites e l'anteprima, sostituire i binding locali nella configurazione Vite, senza concatenarli a quelli del Worker indipendente. La data di compatibilità deve essere supportata dal runtime installato.
- Investire prima nella comprensione dell'andamento scolastico e nel collegamento fra agenda, voti e materiali. Lo spazio studio AI resta un'evoluzione da validare, non un motivo per complicare oggi l'infrastruttura.

Un intervento è utile se rende il comportamento più prevedibile, un problema più facile da localizzare o una funzione più semplice da usare e mantenere.

## Modello persistente

| Tabella | Contenuto e vincoli |
|---|---|
| `accounts` | ID, username univoco normalizzato, hash password, digest recupero, `auth_version`, data creazione |
| `sessions` | Digest token, account, versione credenziali, scadenza; FK con cancellazione a cascata |
| `auth_limits` | Chiave digest del bucket, tentativi, scadenza |
| `diaries` | Un payload JSON per `user_id`, revisione, creazione e aggiornamento |
| `classes` | Identità, proprietario e impostazioni del gruppo; nessun dato del diario personale |
| `class_members` | Appartenenza, nome visualizzato e ruolo proprietario/moderatore/membro |
| `class_invites` | Solo digest dell'invito, limiti, scadenza, utilizzi e revoca |

`diaries.user_id` è una chiave primaria, ma **non ha una FK SQL verso accounts**: l’integrità è attualmente mantenuta dalle API e dalla cancellazione transazionale. Non inserire snapshot tramite SQL operativo senza verificarne il proprietario.

Il payload contiene `{ data, preferences }`. `SchoolData.version = 1`; la `revision` dello snapshot è invece il contatore di sincronizzazione. Non confondere versione formato, revisione dati, versione npm (`0.1.0`) e numero di pubblicazione Sites.

In `data`: semestri, materie, voti, attività e assenze. Voti/attività/assenze referenziano semestre e, quando richiesto, materia; i tipi voto appartengono alla materia. Gli ID sono stabili. `component` è un’etichetta opzionale, non un secondo livello di calcolo.

Limiti principali degli schemi:

- 1–60 semestri, fino a 150 materie; 1–30 tipi per materia.
- Fino a 10.000 elementi per ciascun registro voti, agenda, assenze; non è una garanzia di prestazioni a quella dimensione.
- Voti numerici finiti 1–6; mezzi voti supportati, non esclusivi. Pesi e coefficienti 0,1–100.
- Date calendario valide `YYYY-MM-DD`; scadenze e aggiornamenti ISO con fuso. Assenze 0,1–24 ore per voce.
- Limite HTTP 1.500.000 byte sull’intera richiesta diario, inclusa la busta API. Un backup vicino al limite può essere valido localmente ma troppo grande per sincronizzarsi.

La validazione controlla duplicati, riferimenti, colori esadecimali, lunghezze e semestre selezionato; rigetta campi sconosciuti negli oggetti strict. I tipi TypeScript da soli non costituiscono validazione.

## Formule

Per il voto `i`, peso effettivo `wᵢ = pesoVotoᵢ × pesoTipoᵢ`.

```text
media materia = Σ(votoᵢ × wᵢ) / Σ(wᵢ)
media generale = Σ(mediaMateriaⱼ × coefficienteⱼ) / Σ(coefficienteⱼ)
prossimo voto = [obiettivo × (pesoAccumulato + pesoProssimo) − puntiAccumulati] / pesoProssimo
```

Una materia senza voti restituisce `null` ed è esclusa dalla generale. Il simulatore arrotonda nell’interfaccia al mezzo voto superiore; i calcoli usano valori non arrotondati. Il grafico aggrega l’ultima media di ogni data e aggiorna somme progressive, evitando il ricalcolo di tutta la storia a ogni punto.

## Sincronizzazione e conflitti

1. Validazione della modifica e salvataggio IndexedDB con `dirty: true`.
2. Attesa del commit della transazione locale; aggiornamento UI.
3. `PUT /api/diary` con revisione attesa e ID atteso dell’account.
4. Il server verifica sessione/proprietà e aggiorna solo se la revisione coincide.
5. Successo: incremento revisione e copia locale pulita; `409`: conflitto da risolvere manualmente.

La coda serializza le operazioni nella singola istanza React, **non coordina più schede**. Non esistono merge automatico, CRDT o cronologia completa degli snapshot. Un timeout dopo un commit remoto può apparire come conflitto al tentativo successivo: esportare prima di sostituire.

All’avvio una copia offline viene aperta solo dopo un fallimento non classificato come errore API e se esiste l’account locale attivo. Un `401` rimuove il puntatore attivo, non automaticamente tutti i draft in IndexedDB; l’account successivo non li eredita. `503` del server non è un’autenticazione offline alternativa.

## Storage locale e PWA

IndexedDB `ipagell-db`, versione 2: store `accounts` per ID utente e store `state` mantenuto per recupero legacy. LocalStorage: puntatore `ipagell-active-account-v2`, vecchie preferenze legacy e marcatori delle notifiche. Le preferenze correnti risiedono nello snapshot, non solo in localStorage.

La build sostituisce i marker in `dist/client/sw.js` con hash e lista degli asset. Non distribuire direttamente il template `public/sw.js`. Le API, le rotte di autenticazione e le risposte RSC non sono in cache. La pagina `/` è una shell generica senza diario utente incorporato.

Il service worker non forza `skipWaiting`: un aggiornamento può attendere la chiusura delle schede controllate. Eliminare le cache senza backup non è una strategia di migrazione dati. La registrazione del worker avviene solo nella build di produzione.

## Confine delle estensioni future

Classi, appartenenze e inviti usano tabelle normalizzate separate da `diaries.payload`: una classe non può leggere o dedurre voti, assenze o preferenze private. Ogni endpoint verifica sessione, appartenenza e ruolo; i segreti degli inviti sono conservati soltanto come digest e i link usano il frammento URL, che non viene inviato al server. Gli eventi C2 saranno sottoscrizioni unite all'agenda dall'interfaccia, non copie nascoste nel diario.

I documenti dello spazio studio AI richiederanno object storage, coda di elaborazione e indice di ricerca separati. Non inserire file, testo estratto o embedding nel payload del diario e non eseguire analisi AI nella richiesta HTTP di upload.
