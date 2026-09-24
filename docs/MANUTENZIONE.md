# Sviluppo, verifiche e manutenzione

[Indice](../README.md) · [Criteri di rilascio](PRODOTTO.md)

## Ambiente locale

I comandi seguenti sono per una shell POSIX dalla radice del repository. Non richiedono credenziali di produzione. Il progetto usa npm e `package-lock.json`; non alternare gestori pacchetti. Le impostazioni `.sites-runtime/` sono locali e ignorate da Git.

```bash
npm run install:ci
npm run build
```

Il build genera `dist/server/wrangler.json`, il Worker, gli asset e il service worker compilato. Su **database locale nuovo**, applicare una sola volta ciascuna migrazione, in ordine:

```bash
npx wrangler d1 execute DB --config dist/server/wrangler.json --local --persist-to "$PWD/.wrangler/state" --file drizzle/0000_glorious_crusher_hogan.sql
npx wrangler d1 execute DB --config dist/server/wrangler.json --local --persist-to "$PWD/.wrangler/state" --file drizzle/0001_amused_tombstone.sql
npx wrangler d1 execute DB --config dist/server/wrangler.json --local --persist-to "$PWD/.wrangler/state" --file drizzle/0002_loving_roland_deschain.sql
npx wrangler d1 execute DB --config dist/server/wrangler.json --local --persist-to "$PWD/.wrangler/state" --file drizzle/0003_melted_dark_phoenix.sql
npx wrangler d1 execute DB --config dist/server/wrangler.json --local --persist-to "$PWD/.wrangler/state" --file drizzle/0004_glossy_stranger.sql
```

Questi comandi non sono idempotenti e non registrano una cronologia Wrangler delle migrazioni: sono il bootstrap manuale dello schema locale iniziale. Non rieseguirli su un database già inizializzato. Il percorso assoluto di persistenza evita di creare accidentalmente un database sotto `dist/server/`. Le migrazioni remote sono gestite dal flusso descritto in [Distribuzione](DEPLOYMENT.md).

Avvio sviluppo:

```bash
npm run dev
```

Il profilo portable usa normalmente la porta 5173; seguire l’URL stampato dal processo. Non è abilitato il mock login ChatGPT: creare account **sintetici** per le prove.

Per il comportamento compilato/PWA, fermare lo sviluppo e usare:

```bash
npm run start -- --port 8787
```

La registrazione del service worker è disabilitata in sviluppo. Dopo una nuova build riavviare l’anteprima compilata: un processo rimasto attivo può servire una mappa asset vecchia. `localhost`, `127.0.0.1` e porte diverse sono origini distinte per IndexedDB/cache; non usare questa differenza come prova di perdita dati.

## Controlli

```bash
npm run docs:check
npm test
npx tsc --noEmit
npm run lint
npm audit --omit=dev
npm run build
```

Ogni comando ha un significato distinto: build non significa correttezza dei calcoli; audit dipendenze non significa audit completo; link validi non garantiscono documentazione veritiera. Registrare gli esiti reali, incluse eventuali segnalazioni lint, senza dichiarare “tutto passato” se un controllo non è stato eseguito.

Con l’anteprima locale già in esecuzione:

```bash
TEST_BASE_URL=http://127.0.0.1:8787 npm run test:api
```

La suite accetta solo host locali, crea due account sintetici e ne tenta la cancellazione nel `finally`. Un’interruzione può lasciare account di test: identificare esattamente quelli creati prima di rimuoverli; mai cancellare tutti gli utenti. Include richieste errate, reset delle credenziali, revoca e rate limiting. Non usare account reali. Se il runtime si riavvia durante un test, conservare l’errore e ripetere a server stabile, non ignorare l’asserzione.

## Prove dello storage nel browser

`node scripts/test-storage-browser.mjs` avvia una pagina di test su una porta locale casuale distinta dall'app. Aprire l'URL stampato e verificare `DONE: 10 browser storage checks passed`; poi interrompere il server. La pagina usa solo account sintetici e prova IndexedDB reale, inclusi abort e scritture concorrenti. Non servirla dall'origine dell'app in uso. Non è inclusa automaticamente in `release:prepare`.

I test del controller di sessione sono invece inclusi in `npm test`. Per scenari, risultati e limiti, vedere [Affidabilità](RELIABILITY.md).

## Modifiche schema e pubblicazione

1. Modificare `db/schema.ts`; generare con `npx drizzle-kit generate`.
2. Leggere la migrazione: soprattutto cancellazioni, vincoli e cambi di formato. Non modificare migrazioni già pubblicate.
3. Provare su copia locale e preparare recupero dati prima di modifiche distruttive. Le future migrazioni locali vanno applicate una sola volta, in ordine; il bootstrap sopra non è un runner generale.
4. Eseguire i controlli pertinenti e aggiornare changelog, API e guida se cambia il comportamento.
5. Eseguire `npm run release:prepare` per verificare e compilare il codice.
6. Pubblicare su **ipagell.website** tramite il progetto Sites esistente, seguendo [Distribuzione](DEPLOYMENT.md), e attendere l'esito terminale. Il Worker Cloudflare indipendente è un ambiente sperimentale separato.

Non mettere token Git o Cloudflare nelle remote, nei file, negli screenshot o nella documentazione. Non pubblicare `.wrangler/`, database locali, file `.env`, cookie o backup degli utenti. Non usare un nuovo database come scorciatoia per risolvere errori di deploy sul database esistente.

Un rollback del codice **non annulla le migrazioni**. Prima di ripubblicare una versione precedente, verificare che sappia leggere lo schema e il payload correnti. Non ripristinare un intero database sopra dati nuovi senza piano e autorizzazione espliciti.

## Supporto e incidenti

| Sintomo | Prima azione sicura |
|---|---|
| Conflitto 409 | Esportare il draft; confrontare le copie, non forzare la revisione |
| Accesso negato | Verificare origine HTTPS/cookie/scadenza, senza copiare token nei log |
| 429 | Attendere la finestra; distinguere un attacco da molti utenti sulla stessa rete |
| 503 / D1 non disponibile | Controllare stato deploy, binding e migrazioni; non creare tabelle nel gestore HTTP |
| Interfaccia vecchia | Salvare/esportare, chiudere tutte le schede e riaprire online |
| Asset 404 in locale | Fermare anteprima, ricostruire e riavviare; non cancellare IndexedDB |
| Storage pieno o bloccato | Esportare se possibile e chiudere altre schede; non promettere salvataggio |

Per un sospetto accesso incrociato: fermare l’ampliamento del rilascio, preservare prove minime senza segreti, coinvolgere il responsabile del progetto e verificare API/proprietà/cache. Non esplorare dati di utenti reali per dimostrare il problema. Qualunque intervento su accesso pubblico, credenziali o dati di produzione richiede una decisione esplicita del responsabile.

## Operatività ancora da definire

Non sono documentati come attivi un backup automatico D1 con restore verificato, un monitoraggio con reperibilità o un canale di sicurezza dedicato. Prima di una diffusione ampia assegnare responsabile, frequenza backup, conservazione, RPO/RTO e contatto incidenti; eseguire un ripristino in ambiente isolato e registrarne l’esito. Il JSON esportato dall’utente non sostituisce il backup operativo del servizio.
