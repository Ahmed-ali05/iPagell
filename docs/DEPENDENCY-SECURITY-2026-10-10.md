# Dipendenze e blocco CI — 10 ottobre 2026

[Indice](README.md) · [Manutenzione](MANUTENZIONE.md) · [Pubblicazione](DEPLOYMENT.md)

## Problema e scelta

La PR [5](https://github.com/Ahmed-ali05/iPagell/pull/5), che conserva il sorgente già pubblicato come Sites 33, si fermava prima di `release:prepare`: l’audit npm riportava 13 pacchetti high, propagati da tre dipendenze. Il problema è stato riprodotto sul suo lockfile; non è un errore della vista Appunti.

| Origine | Risoluzione |
|---|---|
| [braces ≤3.0.3, GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) | Nessuna release upstream corretta disponibile nel controllo del 10 ottobre. Patch locale MIT in `vendor/braces`, con provenienza e hash dei file originali. |
| [sharp <0.35.5, GHSA-wq5f-xc86-pv6w](https://github.com/advisories/GHSA-wq5f-xc86-pv6w) | Override globale a 0.35.5: comprende le copie usate da Next e Miniflare. |
| [source-map-js ≤1.2.1, GHSA-68fv-2mgg-jv7q](https://github.com/advisories/GHSA-68fv-2mgg-jv7q) | Override a 1.2.2, release upstream corretta. |

`npm audit fix --force` proponeva downgrade di framework senza una correzione upstream per braces. Sono stati mantenuti Next, Vinext, Vite e Cloudflare nelle versioni del rilascio. Nessuna advisory ignorata, audit ridotto o soglia alzata.

## Patch braces

È il sorgente originale 3.0.3 con una modifica circoscritta: limite fisso di 128 livelli sullo stack del parser e sui tre attraversamenti ricorsivi dell’AST. Copre parentesi graffe, tonde, input incompleti e AST forniti direttamente, compresi cicli dei nodi figli. Le opzioni del chiamante non possono disattivarlo. L’input eccessivo produce `SyntaxError` prima dell’esaurimento dello stack; restano i limiti originali su lunghezza ed espansione.

Prima della patch, 4.000 graffe annidate riproducevano `RangeError: Maximum call stack size exceeded`. Ora i percorsi pubblici rifiutano intenzionalmente quell’input. L’override `$braces` fa risolvere la copia locale sia alla catena ESLint/fast-glob/micromatch sia a quella Vinext/vite-plugin-dynamic-import.

`vendor/braces/UPSTREAM.json` registra tarball, integrità npm e SHA-256 dei file originali; `LICENSE` conserva la licenza MIT. Il nome privato `@ipagell/braces` distingue la patch da una release ufficiale. L’audit del registro non analizza il codice locale: il suo risultato zero va letto insieme alle prove della patch, non come certificazione di sicurezza.

## Verifiche

- `npm run check:dependency-security`: **7 test passati** su risoluzione effettiva, pattern annidati/completi/incompleti, AST profondi/ciclici, glob ordinari, escape/range e consumatori reali sincroni/asincroni.
- Source map con offset enorme: rifiuto immediato oltre il limite upstream; conversione con offset grande ammesso completa entro la scadenza del processo di prova.
- Entrambe le copie sharp 0.35.5 caricano il decoder nativo e completano un round-trip PNG sintetico.
- Lint del test e TypeScript superati. `npm audit --audit-level=low`: **0 vulnerabilità segnalate** nel registro.
- La CI esegue i controlli della patch dopo l’installazione da lockfile e prima dell’audit completo. [CI sul commit f2200a9](https://github.com/Ahmed-ali05/iPagell/actions/runs/38073051270) **riuscita**: installazione pulita Node 22, sette controlli prima dell’audit, audit a zero, lint/tipi, 121 test, i18n/documentazione e build.
- Pubblicata come **Sites 34**, deployment `appgdep_6aca7a42f8bc819184aaa0f9b87e7436` succeeded; dominio canonico/pubblico e TLS riconfermati. Homepage e `/app` HTTP 200. [Registro di pubblicazione](DEPLOYMENT.md).

Le prove browser della modifica UI non vengono ripetute: questa correzione riguarda le dipendenze, senza nuovi componenti, API o migrazioni.

## Manutenzione

Controllare le release upstream di braces. Quando esiste una correzione verificata, rimuovere la dipendenza locale, il relativo override e `vendor/braces`; adeguare la prova di risoluzione mantenendo le regressioni su input malevoli e glob reali. Rigenerare lockfile/inventario, rieseguire questi controlli e verificare CI/build prima della pubblicazione. La patch non introduce un’esenzione permanente dall’audit.
