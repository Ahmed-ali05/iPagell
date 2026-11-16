# Sicurezza runtime e dipendenze — 22 ottobre 2026

[Indice](README.md) · [Sicurezza](../SECURITY.md) · [Pubblicazione](DEPLOYMENT.md)

## Perimetro verificato

Controllati manifest/lockfile, CI, script di installazione/build/preview, configurazioni Sites/Workers, plugin di sviluppo e codice server. Nessun file PHP, `composer.json`, PHP-FPM, mod_php o immagine PHP nel progetto. La produzione è il progetto Sites di `.openai/hosting.json`, URL **https://ipagell.website**, accesso pubblico e domini canonico/www con TLS attivo. Baseline pubblicata: Sites **42**, sorgente `61523824055b62149f8396c197470d507c623072`.

Il checkout di lavoro contiene anche modifiche non pubblicate, comprese modifiche auth/schema e un laboratorio separato. La patch di produzione parte da una copia isolata del sorgente Sites 42: nessuna di quelle modifiche viene inclusa per effetto di questo intervento. Le stesse correzioni applicabili sono riportate nel checkout di lavoro, preservando le differenze preesistenti.

## Avvisi e applicabilità

| Avviso ufficiale | Valutazione su iPagell | Azione |
|---|---|---|
| [PHP, 21 ottobre](https://www.php.net/archive/2026.php): CVE-2026-109618 e CVE-2026-109619, RCE prima del codice applicativo | PHP assente nel progetto e nel percorso di pubblicazione Sites | Nessun aggiornamento PHP da applicare a iPagell. Per eventuali altri siti PHP: aggiornare a 8.2.35, 8.3.36, 8.4.27 o 8.5.12 e riavviare i worker secondo il fornitore. Questi altri siti non sono stati ispezionati. |
| [Node.js, 21 ottobre](https://nodejs.org/en/blog/vulnerability/october-2026-security-releases): correzioni DNS/TLS, Brotli, HTTP, snapshot e permessi | Node locale iniziale **23.10.0**, fuori supporto; requisito `>=22.13.0` troppo permissivo. Node viene usato dalla toolchain, mentre la produzione usa Workers | `.nvmrc` seleziona **22.23.4**; ammesse anche **24.22.1+** nella serie 24 e **26.12.1+** nella serie 26. Escluse serie dispari, precedenti e future non valutate, e prerelease. |
| [Vite GHSA-698v-4r3x-3vcv](https://github.com/advisories/GHSA-698v-4r3x-3vcv), [GHSA-r825-w8mm-5pxw](https://github.com/advisories/GHSA-r825-w8mm-5pxw), [GHSA-587h-7wmj-h5pm](https://github.com/advisories/GHSA-587h-7wmj-h5pm) | Audit segnala tre problemi di apertura editor, uno high, sulla copia Vite **8.0.16**. Le condizioni dipendono da OS/editor; non costituiscono prova di sfruttamento del Worker pubblico | Aggiornamento mirato a **8.1.6**, prima release corretta della linea 8.1. |
| [Vite GHSA-9jrq-w75r-8gcw](https://github.com/vitejs/vite/security/advisories/GHSA-9jrq-w75r-8gcw), [GHSA-rq7h-c2jc-7f22](https://github.com/advisories/GHSA-rq7h-c2jc-7f22) | Rischi del server di sviluppo: esecuzione cross-origin con middleware custom e lettura oltre la directory consentita in configurazioni specifiche | Stesso aggiornamento Vite; non disabilitati CORS, controllo host o audit. |

Le API applicative non implementano server HTTP/2 Node, agent HTTPS personalizzati, resolver DNS o decompressione Brotli esplicita. `lib/server/password.ts` usa `node:crypto`; altre API usano `crypto.randomUUID()`. Non risultano startup snapshot Node o eseguibili SEA costruiti dall'applicazione. Questi rilievi riducono il perimetro diretto, ma non sostituiscono l'aggiornamento della toolchain e delle sue dipendenze.

[Cloudflare documenta](https://developers.cloudflare.com/workers/runtime-apis/nodejs/) che `nodejs_compat` offre API compatibili tramite implementazioni native e polyfill: non seleziona una versione Node installata nel Worker. La data `compatibility_date` seleziona comportamenti di compatibilità, non installa patch Node/PHP. Non è stata cambiata come presunta correzione delle CVE. Il connettore Sites non espone l'inventario delle patch del runtime edge: non si attesta una versione interna corretta del fornitore.

## Correzioni nel sorgente

- `.npmrc` abilita `engine-strict` anche per i normali comandi npm; `package.json` e lockfile: range Node chiuso alle tre serie corrette; Vite 8.1.6 con risoluzioni transitive aggiornate. Restano gli override sharp/source-map e la patch braces già presenti.
- `.nvmrc` e `.github/workflows/check.yml`: stessa selezione **22.23.4**, senza dichiarare che la CI remota sia già stata eseguita.
- `scripts/node-policy.mjs` / `check-node.mjs`: controllo preventivo senza dipendenze, attivo su `preinstall`, `install:ci`, sviluppo/build, preview compilata e `check`. Anche ignorando i lifecycle npm, gli entrypoint framework e installazione controllano il runtime. Un avvio diretto di tool di terze parti può eludere gli script del progetto.
- `tests/node-policy.test.ts`: confini delle versioni vulnerabili/corrette, EOL/prerelease, coerenza manifest/lockfile/CI e risoluzione effettiva Vite nei consumatori Vinext/Cloudflare/RSC.
- Solo nel checkout di lavoro, il laboratorio `experiments/study-local` riceve il medesimo requisito Node nel proprio manifest/lockfile e nei lifecycle. Rimane separato dalla produzione.

Per usare la toolchain del progetto con nvm:

```bash
nvm install
nvm use
npm run install:ci
npm run release:prepare
```

Il Node di sistema non viene sovrascritto. Per le prove è stato scaricato il binario ufficiale macOS ARM64 **22.23.4** in una cartella temporanea, verificando SHA-256 con `SHASUMS256.txt` dello stesso sito ufficiale: `c9e1dbc748b33ed2d14f42445191ecaf14c56259c7a9a26d0042c49ec2b66428`. La verifica è tramite HTTPS e hash ufficiale; non è una verifica indipendente della firma del manutentore.

## Verifiche e pubblicazione

- Installazione pulita da lockfile su Node **22.23.4** riuscita sia nel checkout di lavoro sia nella copia di rilascio. Le deprecazioni esistenti di esbuild-kit rimangono avvisi.
- `npm audit --audit-level=low`: **0 vulnerabilità note** nel sorgente Sites corretto e nel checkout di lavoro; audit indipendente del laboratorio: **0**.
- Sorgente di rilascio: `npm run check` superato, **138 test**, 849 chiavi i18n, inventario e link documentali; quattro regressioni runtime/Vite e sette regressioni delle patch precedenti comprese nel totale.
- Checkout di lavoro: `npm run check` superato, **145 test**, 850 chiavi i18n e documentazione. Laboratorio separato: tipi e **52 test** superati. Queste differenze riflettono codice preesistente, non una modifica pubblicata dal task.
- Build Sites di entrambi i checkout riuscita con Vite **8.1.6**, shell offline con **39 asset**. Rimangono gli avvisi noti sui chunk oltre 500 kB e sulla classificazione statica delle route Vinext.
- Anteprima compilata della sola patch: **146 controlli API passati**, account sintetici ripuliti; database locale nuovo con le sette migrazioni già presenti in Sites 42. Nessuna nuova migrazione e nessun accesso al database reale.
- Node **23.10.0** effettivamente rifiutato sia dal controllo runtime sia da un normale comando npm con `--ignore-scripts` (`EBADENGINE`): il blocco non dipende soltanto dal lifecycle `preinstall`.
- Pacchetto definitivo verificato senza stato locale, file di credenziali, metadati macOS o nuove migrazioni; anteprima arrestata prima del confezionamento.
- `git diff --check` superato. Nel diff isolato di produzione non ci sono modifiche ad app, componenti, API, librerie applicative, schema/migrazioni, configurazione Worker, binding o domini.

Queste sono le prove precedenti alla pubblicazione; lo stato definitivo del deploy si verifica tramite Sites e si registra in [DEPLOYMENT](DEPLOYMENT.md). Nessuna prova di carico o exploit remoto è stata eseguita. La revisione è circoscritta agli avvisi e alla toolchain: non è un penetration test completo né una verifica indipendente delle patch interne di Cloudflare.


`npm audit` verifica le advisory note nel registro, non tutte le vulnerabilità possibili né il codice della patch privata braces. L'audit completo resta richiesto insieme alle regressioni locali; nessuna soglia alzata o advisory esclusa. Ricontrollare queste versioni ai prossimi avvisi e prima di ogni rilascio.

## Esito del rilascio

Pubblicata il **22 ottobre 2026** come **Sites 44**, sorgente `098331e7a9b8cfe7ca957de8f1c10884b35e5759`, deployment `appgdep_6ada321440e081918802629637f18797` con stato **succeeded**. Produzione canonica **https://ipagell.website**; il servizio restituisce anche il proprio alias tecnico. Accesso pubblico e domini/TLS canonico/www riconfermati. Conservati binding `DB`, configurazione dei domini e schema pubblicato; nessun dato reale modificato dal task. La versione 43 intermedia è stata soltanto salvata, non distribuita.

Il checkout di lavoro conserva le proprie modifiche preesistenti. La pubblicazione è stata effettuata dal sorgente Sites isolato in `/private/tmp/ipagell-security-release`, non dall'intero checkout locale. Il sorgente è stato inviato al repository Sites; questo task non ha inviato il checkout di lavoro a GitHub né eseguito la CI remota. Il Node di sistema resta 23.10.0 e viene bloccato dal progetto: prima di lavorare selezionare Node 22.23.4 con nvm o un'altra installazione supportata.

Verifica HTTP post-deploy con curl: homepage e `/app` **200** sul dominio canonico; riferimenti agli asset della homepage coerenti con la build corretta. Il primo controllo con urllib aveva ricevuto 403: l'esito dipende dal client e non è stato trattato come prova di indisponibilità del sito. Non è stata svolta una nuova revisione visuale o autenticata in produzione.
