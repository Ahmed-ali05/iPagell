# iPagell

Diario scolastico personale per voti, agenda e assenze. Pensato per la scala ticinese 1–6, con materie e periodi personalizzabili. Non è un registro ufficiale della scuola.

[Apri iPagell](https://ipagell.ahmed-2005-taverbe.chatgpt.site)

## Stato del progetto

Versione iniziale pubblicata, con account interni e sincronizzazione. Non serve un account ChatGPT. Il modello SIG è una configurazione iniziale facoltativa, non un piano di studi ufficiale.

L’app **ha un backend**: API su Cloudflare Workers e database D1. IndexedDB conserva una copia del diario per l’uso offline; localStorage identifica l’account locale attivo. Anche le preferenze fanno parte del diario sincronizzato. Non promettiamo cifratura end-to-end, notifiche programmate ad app chiusa o installazione iOS certificata.

## Da dove iniziare

| Ti serve… | Documento |
|---|---|
| Usare l’app, installarla, recuperare account o dati | [Guida utente](docs/GUIDA-UTENTE.md) |
| Capire struttura, dati, formule e sincronizzazione | [Architettura](docs/ARCHITETTURA.md) |
| Integrare o verificare gli endpoint | [Contratto API](docs/API.md) |
| Avviare, testare, pubblicare e gestire problemi | [Manutenzione](docs/MANUTENZIONE.md) |
| Priorità, qualità, limiti e criteri di rilascio | [Piano prodotto](docs/PRODOTTO.md) |
| Progettare classi autogestite, inviti e agenda condivisa | [Specifica classi](docs/CLASSI.md) |
| Capire la futura mappa AI costruita dalle dispense | [Spazio studio AI](docs/SPAZIO-STUDIO-AI.md) |
| Confini di sicurezza e segnalazioni riservate | [Sicurezza](SECURITY.md) |
| Vedere cosa è cambiato | [Registro modifiche](CHANGELOG.md) |
| Consultare la revisione precedente | [Revisione del 16 settembre](docs/REVIEW.md) |

## Sviluppo

Usare una versione Node compatibile con le dipendenze (linea 22 da 22.13, oppure 24+) e npm con il lockfile del progetto. Su un clone pulito:

```bash
npm run install:ci
npm run build
```

Prima dell’accesso locale, inizializzare D1 seguendo [Manutenzione](docs/MANUTENZIONE.md). Poi `npm run dev`; per provare la PWA compilata, `npm run start -- --port 8787`. `start` è un’anteprima locale, non una pubblicazione.

Controlli rapidi:

```bash
npm test
npx tsc --noEmit
npm run docs:check
```

Le istruzioni API di test creano dati sintetici: non puntarle al sito pubblico. Per proporre una modifica seguire [CONTRIBUTING](CONTRIBUTING.md).
