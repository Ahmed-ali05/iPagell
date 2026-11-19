<p align="center">
  <img src="public/icons/icon-192.png" width="88" height="88" alt="Icona di iPagell">
</p>

<h1 align="center">iPagell</h1>

<p align="center">
  <strong>Il diario scolastico personale per voti, agenda, assenze e statistiche.</strong><br>
  Installabile, utilizzabile offline, con i voti che restano privati.
</p>

<p align="center">
  <a href="https://ipagell.website"><strong>Apri l'app</strong></a>
  ·
  <a href="docs/GUIDA-UTENTE.md">Guida utente</a>
  ·
  <a href="docs/README.md">Documentazione</a>
  ·
  <a href="README.md">English</a>
</p>

<p align="center">
  <a href="https://ipagell.website"><img src="public/og.png" width="820" alt="Schermata di iPagell con il prossimo impegno, la media generale e le attività della settimana"></a>
</p>

> [!NOTE]
> iPagell è un progetto indipendente: non è un registro ufficiale e non è affiliato a scuole o istituti. Le materie di base sono una configurazione iniziale facoltativa e modificabile.

## Cosa offre

- **Voti e medie:** pesi per voto e tipologia, coefficienti per materia, andamento e simulatore del prossimo voto. Scala 1–6 (più alto è meglio, sufficienza dal 4).
- **Agenda:** compiti, verifiche e scadenze con filtri, riepilogo settimanale e promemoria quando l'app è aperta.
- **Assenze e statistiche:** riepiloghi per periodo e materia, con viste Periodo, Anno e Storico.
- **Appunti per materia:** editor visivo, bozze sul dispositivo, sincronizzazione ed export PDF/Markdown.
- **Classi private:** gruppi su invito con ruoli e codici revocabili; si condividono attività e appunti di classe, mai voti o assenze.
- **Uso offline:** copia locale in IndexedDB, PWA installabile e backup JSON esportabile e importabile.
- **Account e sincronizzazione:** accesso con email e password o con Google, sessioni protette e controllo dei conflitti tramite revisione.
- **Quattro lingue:** italiano, inglese, tedesco e francese; i contenuti personali restano nella lingua in cui sono scritti.
- **Calcolatore pubblico:** media ponderata senza account, senza salvare i voti inseriti.

## Avvio locale

Requisiti: Node.js 22.23.4+, 24.22.1+ o 26.12.1+ (`.nvmrc` indica quella predefinita) e npm. [Motivo e versioni ammesse](docs/RUNTIME-SECURITY-2026-10-22.md).

```bash
npm run install:ci
npm run build
```

Inizializzare D1 in locale seguendo la guida di [manutenzione](docs/MANUTENZIONE.md), poi:

```bash
npm run dev
npm run check
```

Le prove API (`npm run test:api`) creano dati sintetici e vanno eseguite soltanto in locale.

## Pubblicazione

La produzione è **[ipagell.website](https://ipagell.website)**, su un Worker Cloudflare con D1 in giurisdizione UE. Si pubblica a mano con `npm run release:prepare` e `npm run deploy:cloudflare` dopo `npx wrangler login`; GitHub Actions esegue solo i controlli. Dettagli in [Sviluppo e pubblicazione](docs/DEPLOYMENT.md).

## Documentazione

L'[indice](docs/README.md) separa guide correnti, specifiche future e storico. Punti di partenza: [snapshot corrente](docs/REPO-SNAPSHOT.md), [architettura corrente](docs/ARCHITECTURE-CURRENT.md), [contratto API](docs/API.md), [matrice di verifica](docs/VERIFICATION-MATRIX.md), [piano prodotto](docs/PRODOTTO.md) e [changelog](CHANGELOG.md).

## Stato del progetto

Versione iniziale pubblicata e in uso. Il progetto non dichiara cifratura end-to-end, notifiche ad app chiusa o installazione iOS certificata.

## Contribuire, sicurezza e licenza

Issue e pull request sono benvenute: leggere [CONTRIBUTING](CONTRIBUTING.md) e il [codice di condotta](CODE_OF_CONDUCT.md), usando solo dati sintetici. Le vulnerabilità vanno segnalate in privato seguendo [SECURITY](SECURITY.md). Licenza [MIT](LICENSE).
