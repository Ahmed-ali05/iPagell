<p align="center">
  <img src="public/icons/icon-192.png" width="96" height="96" alt="Icona di iPagell">
</p>

<h1 align="center">iPagell</h1>

<p align="center">
  <strong>Il diario scolastico personale per voti, agenda, assenze e statistiche.</strong><br>
  Progettato per la scala di voti 1–6, con materie e periodi personalizzabili.
</p>

<p align="center">
  <a href="https://ipagell.website"><strong>Apri l'app</strong></a>
  ·
  <a href="docs/GUIDA-UTENTE.md">Guida utente</a>
  ·
  <a href="docs/ARCHITETTURA.md">Documentazione tecnica</a>
</p>

<p align="center">
  <img alt="Stato: versione iniziale" src="https://img.shields.io/badge/stato-versione%20iniziale-F59E0B">
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white">
  <img alt="Next.js" src="https://img.shields.io/badge/Next.js-16-000000?logo=next.js&logoColor=white">
  <img alt="PWA" src="https://img.shields.io/badge/PWA-installabile-5A0FC8?logo=pwa&logoColor=white">
  <img alt="Licenza MIT" src="https://img.shields.io/badge/licenza-MIT-22C55E">
</p>

> [!IMPORTANT]
> iPagell non è un registro ufficiale e non è affiliato a scuole o istituti. Le materie di base sono una configurazione iniziale facoltativa e personalizzabile.

## Cosa offre

- **Voti e medie:** pesi per voto e tipologia, coefficienti per materia, andamento e simulatore del prossimo voto.
- **Agenda scolastica:** attività, scadenze, filtri e promemoria quando l'app è aperta.
- **Assenze e statistiche:** riepiloghi per periodo e materia in un'unica interfaccia.
- **Account e sincronizzazione:** sessioni protette, diario personale su D1 e controllo dei conflitti tramite revisione.
- **Uso offline:** copia locale in IndexedDB, shell PWA installabile e backup JSON esportabile.
- **Configurazione flessibile:** semestri, materie, colori, tipologie e scala 1–6 personalizzabili.
- **Classi private:** gruppi su invito con ruoli, membri e codici revocabili, senza condividere voti o assenze.

## Stato del progetto

La versione iniziale è pubblicata e utilizzabile. L'app ha un backend su Cloudflare Workers e D1; IndexedDB conserva una copia del diario per l'uso offline. Le preferenze fanno parte del diario sincronizzato.

Sono ancora aperte verifiche operative e di qualità elencate nel [piano prodotto](docs/PRODOTTO.md). In particolare, il progetto non dichiara cifratura end-to-end, notifiche programmate ad app chiusa o installazione iOS certificata.

## Stack

| Area | Tecnologie |
|---|---|
| Interfaccia | React 19, TypeScript, Tailwind CSS, componenti Radix/Shadcn |
| Framework | Next.js 16 con build Vinext/Vite |
| Grafici e validazione | Recharts, Zod, React Hook Form |
| Backend | Cloudflare Workers, D1, Drizzle ORM |
| Offline | Service worker, IndexedDB, manifest PWA |

## Avvio locale

Requisiti: Node.js `>=22.13.0` e npm. Da un clone pulito:

```bash
npm run install:ci
npm run build
```

Prima del primo accesso locale occorre inizializzare D1 seguendo la guida di [sviluppo e manutenzione](docs/MANUTENZIONE.md). Poi:

```bash
npm run dev
```

Controlli principali:

```bash
npm test
npx tsc --noEmit
npm run lint
npm run docs:check
```

Le prove API creano dati sintetici e devono essere eseguite soltanto contro un ambiente locale.

## Documentazione

| Documento | Contenuto |
|---|---|
| [Guida utente](docs/GUIDA-UTENTE.md) | Utilizzo, installazione, account, recupero e dati |
| [Architettura](docs/ARCHITETTURA.md) | Componenti, persistenza, formule e sincronizzazione |
| [Contratto API](docs/API.md) | Endpoint, richieste, risposte ed errori |
| [Manutenzione](docs/MANUTENZIONE.md) | Ambiente locale, test, build, migrazioni e incidenti |
| [Distribuzione](docs/DEPLOYMENT.md) | Worker indipendente, D1, CI e passaggio del dominio |
| [Piano prodotto](docs/PRODOTTO.md) | Priorità, limiti, qualità e criteri di rilascio |
| [Sicurezza](SECURITY.md) | Confini di fiducia e segnalazioni riservate |
| [Changelog](CHANGELOG.md) | Evoluzione e note di rilascio |

La specifica [Classi](docs/CLASSI.md) distingue il gruppo C1 già disponibile dalle fasi condivise successive. [Spazio studio AI](docs/SPAZIO-STUDIO-AI.md) resta un possibile sviluppo futuro.

## Contribuire

Issue e pull request sono benvenute. Prima di proporre modifiche, leggere [CONTRIBUTING](CONTRIBUTING.md) e usare soltanto dati sintetici nelle prove. Le vulnerabilità vanno segnalate seguendo [SECURITY](SECURITY.md), senza pubblicare credenziali o dati reali.

## Licenza

Distribuito con licenza [MIT](LICENSE). Le dipendenze e i componenti vendorizzati mantengono le rispettive licenze.
