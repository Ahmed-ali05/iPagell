# iPagell — Snapshot corrente della repository

[Indice](README.md) · [Architettura](ARCHITECTURE-CURRENT.md) · [Verifiche](VERIFICATION-MATRIX.md)

## Riferimento e metodo

Audit del **1 ottobre 2026**. All'inizio dell'allineamento, 234 file applicativi, configurazioni, asset e manifest coincidevano byte per byte con la pubblicazione Sites **27**, sorgente `9535676a53a75f9ff52cf90a501435e1bcee40db`. La repository ora comprende anche documentazione aggiornata, inventario automatico, regole per artefatti locali e correzioni delle dipendenze rilevate dall'audit CI. Questi aggiornamenti successivi non sono ancora pubblicati su Sites; sono distinti nel [changelog](../CHANGELOG.md). Lo SHA Sites è il riferimento del rilascio, non uno SHA GitHub intercambiabile.

Repository: `Ahmed-ali05/iPagell`, branch principale `main`. I metadati effettivi del checkout si leggono con `git status -sb` e `git log -1`; non mantenere uno SHA autoreferenziale nel testo. Il precedente audit e le sue aggiunte sono in [REPO-SNAPSHOT-HISTORY](REPO-SNAPSHOT-HISTORY.md).

Sono stati letti manifest/lockfile, configurazioni, API, schema/migrazioni, sessione diario, storage e riconciliazione degli appunti, backup, componenti e script di verifica. Le guide non sostituiscono la lettura del codice. Stato remoto, dati utente e prove fisiche sono separati nella matrice.

## Software implementato

- Account interni username/password, sessione cookie, codice di recupero e sicurezza account.
- Diario con materie/semestri, voti, pesi, agenda personale, assenze, statistiche e preferenze sincronizzate.
- Appunti personali per materia, distinti dal semestre e dal JSON del diario, con bozze locali e sincronizzazione per nota.
- Classi private: appartenenze, ruoli, inviti, attività condivise e sottoscrizioni personali all'agenda.
- Materie e appunti della classe, bozza privata, anteprima e conferma di pubblicazione; copie indipendenti fra spazi.
- Editor visivo condiviso, testo legacy `plain`, formato chiuso `md-lite-v1`, lettura sicura ed export PDF/Markdown.
- Backup V3 con import V1/V2, piano locale riprendibile e copie delle proprie note di classe.
- Interfaccia it/de/fr/en; landing e calcolatore pubblico della media localizzati, senza account per il calcolatore.
- Shell PWA e copia personale offline già preparata; promemoria generati dall'app aperta.
- Due tool browser opzionali `document.modelContext`: riepilogo e registrazione voto.

Non sono implementati spazio studio AI, OCR, upload materiali/R2, annunci, co-scrittura, chat, push programmati ad app chiusa o selezione di altri sistemi di voto. Il sistema corrente è `numeric-1-6`; lingua e scala non sono collegate.

## Mappa dei file

| Area | File da leggere |
|---|---|
| Entry point e route pubbliche | `app/layout.tsx`, `app/page.tsx`, `app/[locale]/**`, `app/app/page.tsx`, `proxy.ts`, `lib/i18n/public-routes.ts` |
| Workspace e navigazione | `components/ipagell-app.tsx`; viste Agenda, Voti, Assenze, Statistiche, Classi e Appunti |
| Diario locale/remoto | `hooks/use-diary.ts`, `lib/diary-session.ts`, `lib/account-storage.ts`, `lib/server/repository.ts` |
| Classi e agenda collegata | `components/classes-view.tsx`, `class-events-panel.tsx`, `hooks/use-class-agenda.ts`, `lib/classes/**`, `lib/server/class-*.ts` |
| Appunti | `components/notes-view.tsx`, `class-notes-panel.tsx`, `note-editor.tsx`, `hooks/use-notes.ts`, `use-note-autosave.ts`, `lib/notes/**` |
| API e identità | `app/api/**`, `lib/server/auth.ts`, `password.ts`, `http.ts`, `note-http.ts`, `note-repository.ts` |
| Schema | `db/schema.ts`, `drizzle/*.sql`, `drizzle/meta/_journal.json` |
| Lingue, voti, calcolatore | `lib/i18n/**`, `lib/grading.ts`, `lib/calculations.ts`, `components/grade-average-calculator.tsx` |
| Toolchain e hosting | `package.json`, `package-lock.json`, `vite.config.ts`, `.openai/hosting.json`, `build/sites-vite-plugin.ts`, `scripts/**` |
| PWA | `components/install-app.tsx`, `public/sw.js`, `public/manifest.webmanifest`, `scripts/generate-precache.mjs` |
| Test e CI | `tests/*.test.ts`, `tests/api-smoke.mjs`, `tests/storage-browser.ts`, `.github/workflows/check.yml` |

Le viste dell'app sono stato client dentro `/app`, non route autonome. Appunti si apre da Home, Agenda e Voti senza aggiungere una sesta voce alla barra; l'Agenda e la vista Classi conservano il contesto mentre il workspace dello stesso account resta montato.

## Dati, versioni e limiti

Quattro percorsi persistenti: snapshot diario, attività/sottoscrizioni di classe, appunti personali, appunti di classe. D1 contiene **15 tabelle** versionate; **7 migrazioni** `0000`–`0006`. L'[inventario](REPO-INVENTORY.md) elenca tutti i nomi e le API esportate e ne verifica automaticamente l'allineamento.

Non confondere `SchoolData.version=1`, IndexedDB `ipagell-db`/`ipagell-notes-db` versione 2, backup V3, contratto Appunti 2, revisione dei dati, versione npm `0.1.0` e numero Sites 27. `inFlight` è metadato locale per retry, escluso dal backup.

Il diario usa CAS sulla revisione. Gli appunti personali usano revisione, formato atteso, ID di mutazione, cursore e transizioni atomiche locali; una conferma della propria scrittura non scarta le modifiche successive. Classe richiede membership e pubblicazione esplicita online. Quote: 500 note/8 MiB personali, 200 note/4 MiB per classe; creazione limitata a 60 nuove materie attive, escluse le etichette legacy seminate. Per nota: 20.000 code point serializzati e 64 KiB. Le liste note sono paginate. Per regole complete vedere [Appunti](APPUNTI-SPEC.md) e [API](API.md).

## Runtime e verifiche

Convenzioni Next App Router, runtime/build **Vinext + Vite + Cloudflare Workers**, React 19 e TypeScript. Non è un server Next standard. Versioni esatte, script e Node dichiarato sono nell'inventario generato dal lockfile. La CI usa Node 22.

`npm run check`: lint, tipi, unit test, i18n, inventario e link documentali. `release:prepare` aggiunge build e precache. La CI esegue installazione da lockfile, audit di tutte le dipendenze e preparazione; non esegue automaticamente suite API o prove browser e non pubblica.

Produzione: **https://ipagell.website**, progetto Sites esistente e binding `DB`; nessun R2. `wrangler.jsonc` è il Worker sandbox separato. Il push GitHub conserva il codice ma non aggiorna Sites. La pubblicazione e le verifiche esterne del rilascio sono in [DEPLOYMENT](DEPLOYMENT.md).

Gli output PDF della ricerca e il bytecode Python sono ignorati; i sorgenti della ricerca restano versionati. Non caricare `.env`, database locali, credenziali, cookie o backup utente. Non risultano più nel tree i vecchi duplicati `db/schema 2.ts` e `drizzle.config 2.ts` citati dall'audit storico.
