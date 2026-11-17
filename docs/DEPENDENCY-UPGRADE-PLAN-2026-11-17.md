# Piano di aggiornamento delle dipendenze — 17 novembre 2026

[Sicurezza dipendenze (10 ottobre)](DEPENDENCY-SECURITY-2026-10-10.md) · [Sviluppo e pubblicazione](DEPLOYMENT.md)

## Perché

La CI della PR 9 (`sync/checkout-20261116`) si ferma al passo **Audit dipendenze** (`npm audit --audit-level=low`). Il commit `5966d95` ha chiuso le due advisory critical (React 19.3.1, Next 16.4.6); restano **28 segnalazioni: 16 high e 12 moderate**. La policy del 10 ottobre resta valida: nessuna advisory ignorata, nessuna soglia alzata, nessun `npm audit fix --force`.

Le 28 segnalazioni derivano da **sei pacchetti radice**; gli altri (vite, vinext, eslint-config-next, typescript-eslint…) compaiono solo perché li includono.

| Pacchetto radice | Versione bloccata | Advisory | Correzione disponibile | Fase |
|---|---|---|---|---|
| `picomatch` | 2.3.2, 4.0.4, 4.0.7 | GHSA-fc5q-39xc-vjpf, high (ReDoS) | **Nessuna** (`patched=null`) | 3 |
| `undici` | 7.29.1 | 8 advisory, 5 high | 7.30.1, tramite wrangler 4.164 | 1 |
| `zod` | 3.25.76 | GHSA-mrhx-c7xc-m3w5, high | 4.6.7 (major) | 2 |
| `satori` | 0.16.0 | GHSA-wx4j-mvgx-mqwp, moderate | 0.33.5, tramite vinext 1.4.6 | 1 |
| `fast-uri` | 3.1.8 | 4 advisory, moderate | 3.1.9 | 1 |
| `minimatch` | 10.2.5 (typescript-estree) | GHSA-g3hv-75wg-m249, moderate | 11.0.9, tramite typescript-eslint | 1 |

## Esposizione reale

Verificata cercando le librerie nel bundle server della build `5966d95` (`dist/server`):

- **Runtime React Server Components: presente** nel bundle. La produzione attuale, pubblicata con React 19.2.8, è esposta alla critical chiusa in `5966d95` finché quel codice non viene pubblicato.
- **zod: presente** (validazione auth e note). L'advisory riguarda collezioni molto grandi; i limiti di dimensione delle API la attenuano ma non la escludono.
- **picomatch e undici: assenti.** Sono usati solo da build, lint e sviluppo locale (vite, eslint, fast-glob, tinyglobby, wrangler/miniflare).
- **satori: non usato.** Nessuna generazione di immagini OG nel codice; arriva solo come dipendenza di vinext.

## Fase 0 — Pubblicare la correzione React (urgente)

La PR 9 non diventa verde finché la Fase 3 non è risolta. Serve una decisione del proprietario: unire la PR 9 con il controllo rosso, spiegando che il residuo è il solo picomatch (build-time), oppure pubblicare da `5966d95` prima del merge. In entrambi i casi: `npm run release:prepare` e i test D1 sono già passati in locale con Node 24 su `5966d95`; in CI non sono girati perché l'audit fallisce prima.

## Fase 1 — Aggiornamenti nello stesso major (rischio basso-medio)

| Pacchetto | Da | A |
|---|---|---|
| `vinext` | 1.0.0-beta.10 | ^1.4.6 (già ammesso dal range) |
| `vite` | 8.1.6 | 8.3.8 |
| `@vitejs/plugin-react` | 6.0.2 | 6.3.0 |
| `@vitejs/plugin-rsc` | 0.5.35 | ^0.5.39 |
| `wrangler` | 4.145.0 | 4.164.0 |
| `@cloudflare/vite-plugin` | 1.62.3 | 1.70.0 |
| `@cloudflare/workers-types` | 5.20261001.1 | 5.20261117.1 (richiesto da wrangler 4.164) |
| `typescript-eslint` e collegati | 8.59.3 | ultima 8.x (porta minimatch 11.0.9) |
| `fast-uri` (transitivo) | 3.1.8 | 3.1.9 |
| override `fflate` | 0.7.3 | 0.7.5 (stessa linea; satori 0.33.5 fissa 0.7.3) |

Chiude undici, satori, fast-uri e minimatch. Il salto di vinext dalla beta alla 1.4.6 è il punto più delicato: è il framework che produce il Worker.

Verifiche: `npm run install:ci`, `npm run check`, `npm run release:prepare`, `npm run test:api` (146 controlli), `test:auth-d1`, `test:auth-restore`, `npm run build:cloudflare`, avvio locale con `npm start` e prova browser di homepage, `/app`, accesso e salvataggio con account sintetico. Per wrangler: confermare con `wrangler deploy --dry-run` che `d1 migrations apply` e il deploy si comportano come prima.

## Fase 2 — zod 3 → 4 (major, PR separata)

Dodici file in `app/api/**` e `lib/**`. Uso rilevato: 59 `z.string()`, 50 `.safeParse`, 42 `.strict()`, 14 `.default()`, 12 `.refine`, 5 `.url()`, 3 `.format()`, 3 `.superRefine`, 2 `.uuid()`, 2 `z.discriminatedUnion`.

Punti da verificare nella migrazione:

- `.default()`: in zod 4 si applica al valore di output e interrompe la validazione su `undefined`; rivedere i campi opzionali con default.
- `.uuid()`: validazione RFC più stretta; controllare che gli ID generati e quelli già salvati la superino.
- `.url()`: comportamento cambiato; ricontrollare i casi accettati e rifiutati.
- `.format()`: deprecato; sostituire con `z.treeifyError`.
- `.strict()`, `.superRefine` e il parametro `message`: ancora supportati ma deprecati; migrare a `z.strictObject` ed `error` senza urgenza.
- Testo e struttura degli errori: verificare che le risposte API e `tests/api-smoke.mjs` non dipendano dai messaggi di zod 3.

Con Fasi 1 e 2 applicate al lockfile, `eslint-plugin-react-hooks` accetta zod 4 e l'advisory zod sparisce.

## Fase 3 — picomatch (bloccato upstream)

GHSA-fc5q-39xc-vjpf è pubblicata dal 19 ottobre 2026 (CVSS 7.5) e non ha versioni corrette. Upstream esiste la PR [micromatch/picomatch#254](https://github.com/micromatch/picomatch/pull/254), aperta il 17 novembre 2026 e non ancora unita. Dopo le Fasi 1 e 2, picomatch è l'unica causa delle 19 segnalazioni high residue.

Opzioni, da decidere:

1. **Attendere il rilascio upstream** (consigliata), con una scadenza, ad esempio due settimane; poi aggiornare e rimuovere il blocco. Nel frattempo la CI resta rossa.
2. **Patch locale**, come per braces (`vendor/braces`): copre le linee 2.3.x e 4.0.x e richiede prove di regressione; costo maggiore.
3. **Eccezione temporanea e motivata** nel gate di audit, con data di scadenza: richiede di modificare esplicitamente la policy del 10 ottobre.

## Stato delle prove di questo piano

- Lockfile di prova (Node 24) con Fasi 1 e 2: **0 critical, 19 high, 3 moderate**; radici residue: picomatch e fflate.

### Fase 1 applicata — 17 novembre 2026

Ramo `deps/phase1-toolchain`, basato su `c036af5`. Versioni risolte: vinext 1.4.6, vite 8.3.8, @vitejs/plugin-react 6.3.0, @vitejs/plugin-rsc 0.5.39, wrangler 4.164.0, @cloudflare/vite-plugin 1.70.0, workers-types 5.20261117.1, typescript-eslint 8.73.0; transitivi undici 7.30.1, satori 0.33.5, fast-uri 3.1.9, minimatch 11.0.9; override fflate 0.7.5.

- `npm audit`: **20 high, 0 moderate, 0 critical**. Radici residue: solo picomatch (Fase 3) e zod (Fase 2).
- Con Node 24.22.3, installazione pulita da lockfile: prove della patch braces (7), `npm run check` con **147 test** superati, `release:prepare`, `test:auth-d1`, `test:auth-restore` e `build:cloudflare` superati.
- Worker compilato avviato in locale con D1 locale nuovo: **146 controlli API** superati, account sintetici rimossi.
- Prova browser sul Worker locale: homepage e `/app` idratati; registrazione, codice di recupero, creazione del diario e registrazione di un voto; `PUT /api/diary` 200 e voto presente dopo il ricaricamento. Database locale eliminato al termine.
- La registrazione del service worker fallisce nel browser integrato su `http://127.0.0.1`, ma in modo identico con la build precedente all'aggiornamento; su https://ipagell.website lo stesso browser lo registra. Non è una regressione della Fase 1.
- `tests/node-policy.test.ts` ora confronta la Vite risolta con la versione esatta dichiarata in `package.json`, invece di fissare 8.1.6.
- Non verificati: lettore di schermo, telefono fisico, deploy su staging o produzione.

## Ordine consigliato

1. Riallineare il branch locale `sync/checkout-20261116` al remoto: contiene quattro commit non pubblicati.
2. Fase 0: decisione su merge o pubblicazione della correzione React.
3. Fase 1 in una PR dedicata.
4. Fase 2 in una PR dedicata.
5. Fase 3 secondo l'opzione scelta.
