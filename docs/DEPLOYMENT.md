# Distribuzione indipendente

[Indice](../README.md) · [Manutenzione](MANUTENZIONE.md) · [Architettura](ARCHITETTURA.md)

## Scelta della piattaforma

iPagell è un'applicazione full-stack: il browser usa route API, sessioni HTTP e un database D1. GitHub Pages può ospitare soltanto l'output statico e quindi non può eseguire il backend dell'app. La distribuzione indipendente usa:

- GitHub come repository e punto di avvio della pipeline;
- Cloudflare Workers per pagine, API e asset;
- Cloudflare D1 per account, diari e classi;
- Vinext/Vite come build compatibile con Workers;
- `ipagell.website` come dominio pubblico dopo la migrazione dei dati.

Il file `wrangler.jsonc` è la fonte di verità del Worker indipendente. `.openai/hosting.json` rimane nel repository finché la precedente pubblicazione Sites serve da rollback e sorgente dei dati esistenti.

## Ambienti

| Ambiente | Indirizzo | Dati |
|---|---|---|
| Pubblicazione attuale | `https://ipagell.website` | Database della pubblicazione Sites |
| Worker indipendente | `https://ipagell.ahmedbasto59.workers.dev` | D1 `ipagell-production`, regione WEUR |

Non spostare il dominio principale sul nuovo Worker prima di aver esportato, verificato e importato i dati esistenti. Il nuovo database è separato: cambiare solo il DNS farebbe apparire vuoti gli account creati sulla pubblicazione precedente.

La zona `ipagell.website` non è ancora associata all'account Cloudflare del Worker: un tentativo controllato sul solo sottodominio `beta` è stato rifiutato prima di creare la route. Occorre aggiungere prima la zona e aggiornare i nameserver presso il gestore del dominio. L'URL `workers.dev` è marcato `noindex`; l'indicizzazione si abilita soltanto sul dominio canonico.

## Pubblicazione manuale

Autenticarsi una volta con `npx wrangler login`, poi eseguire:

```bash
npm run deploy:cloudflare
```

Lo script:

1. genera il build Cloudflare con la configurazione di produzione;
2. esegue un deploy a secco;
3. applica soltanto le migrazioni D1 non ancora registrate;
4. pubblica il Worker e gli asset.

Per controllare soltanto il pacchetto:

```bash
npm run build:cloudflare
npx wrangler deploy --dry-run
```

## GitHub Actions

Il workflow `.github/workflows/deploy-cloudflare.yml` è manuale (`workflow_dispatch`) per evitare pubblicazioni involontarie. Nell'ambiente GitHub `production` servono:

- `CLOUDFLARE_API_TOKEN`, limitato al Worker, D1 e alle route necessarie;
- `CLOUDFLARE_ACCOUNT_ID`.

Dopo aver aggiunto protezioni, revisori e un backup verificato, il trigger può essere esteso ai push sul ramo `main`.

## Passaggio del dominio

Checklist minima per trasferire `ipagell.website` senza perdita di dati:

1. sospendere temporaneamente le nuove scritture o definire una finestra di manutenzione;
2. esportare il database Sites e conservarne una copia cifrata con accesso limitato;
3. importare in `ipagell-production` e confrontare conteggi, relazioni e accesso di account sintetici;
4. provare registrazione, login, diario, classi, offline e cancellazione sull'ambiente indipendente;
5. aggiungere il dominio alla zona Cloudflare e collegarlo al Worker;
6. aggiornare DNS e certificato, mantenendo il precedente deploy come rollback temporaneo;
7. verificare `/`, `/app`, `/robots.txt`, `/sitemap.xml` e le route API dal dominio finale;
8. inviare la sitemap ai motori di ricerca solo dopo il passaggio.

Un rollback del codice non annulla una migrazione. Un rollback DNS non riconcilia automaticamente le scritture avvenute sui due database: durante il passaggio deve esistere una sola sorgente scrivibile.
