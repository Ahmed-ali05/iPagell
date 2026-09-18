# Sviluppo e pubblicazione

[Indice](../README.md) · [Manutenzione](MANUTENZIONE.md)

## Una produzione: ipagell.website

La produzione è **https://ipagell.website**, ospitata da Sites con il database esistente. Il progetto da aggiornare è quello in `.openai/hosting.json`. `www.ipagell.website` è collegato allo stesso sito; anche l'indirizzo generato `ipagell.produc-ch.chatgpt.site` è un alias della medesima pubblicazione. La navigazione da questi alias viene reindirizzata al dominio principale, conservando percorso, query e inviti nel frammento. Una protezione nel browser copre anche il proxy Sites quando non espone il nome originale al redirect server. L'alias tecnico resta gestito da Sites e non costituisce una seconda produzione.

Il Worker indipendente configurato in `wrangler.jsonc` ha un **database separato**. Il suo nome storico `ipagell-production` non significa che contenga i dati di ipagell.website. Pubblicarlo non aggiorna il sito pubblico. Non cambiare DNS o database per un normale rilascio.

## Quando modifichi tu il codice

1. Crea un ramo dal `main` aggiornato e modifica il progetto.
2. Da un clone pulito esegui `npm run install:ci`. Per l'anteprima usa `npm run dev`; inizializza il database locale come indicato in [Manutenzione](MANUTENZIONE.md).
3. Esegui `npm run release:prepare`: controlla codice, tipi, test, documentazione e genera la build.
4. Salva le modifiche con un commit, invia il ramo su GitHub e apri una pull request. Il workflow **Controlli iPagell** esegue gli stessi controlli; puoi avviarlo anche da GitHub → Actions → Controlli iPagell → Run workflow. Unisci quando è verde.
5. Apri il progetto aggiornato in Codex e chiedi: **«Pubblica questo codice su ipagell.website usando il progetto Sites esistente»**.

GitHub verifica il codice ma non pubblica la produzione. Il deploy Sites richiede il collegamento Sites autenticato di Codex: in questo repository non è configurata un'integrazione CI per pubblicare su Sites. `release:prepare` prepara il rilascio, non lo pubblica.

## Procedura di pubblicazione per Codex

Usare la skill Sites hosting: verificare il progetto e i domini esistenti, compilare per Sites con `npm run build` (senza `IPAGELL_DEPLOY_TARGET=cloudflare`), salvare e inviare l'esatto sorgente al repository restituito dal connettore, preparare il pacchetto e pubblicare la versione con Sites. Attendere lo stato `succeeded` e confermare l'URL **https://ipagell.website**. Il push del sorgente Sites è distinto da GitHub.

Preservare accesso pubblico e binding esistenti. Le migrazioni incluse nel pacchetto devono essere compatibili con i dati correnti; un rollback del codice non annulla le migrazioni. Nessun token, backup, database locale o `.env` nel pacchetto o nel repository.

## Worker sperimentale separato

Solo per prove esplicitamente richieste, dopo `npx wrangler login`:

```bash
npm run deploy:sandbox
```

Questo compila, verifica e pubblica il Worker `workers.dev`, applicando le migrazioni al suo D1 separato. Il vecchio `npm run deploy:cloudflare` si ferma con un messaggio per evitare pubblicazioni nel posto sbagliato. Il workflow GitHub di deploy Cloudflare è stato sostituito dai controlli.

Un'eventuale migrazione futura fuori da Sites richiede trasferimento verificato dei dati e del dominio come attività dedicata.
