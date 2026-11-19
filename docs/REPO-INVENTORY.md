# Inventario verificabile della repository

Generato da `scripts/repo-inventory.mjs` leggendo il sorgente, senza rete o dati utente. Non descrive l'infrastruttura di produzione. Per rigenerare: `npm run docs:generate`; `npm run docs:check` rifiuta un inventario obsoleto. Non modificare questa tabella a mano.

## Metadati

| Campo | Valore |
|---|---|
| Pacchetto | `ipagell@0.1.0` |
| Node dichiarato | `^22.23.4 || ^24.22.1 || ^26.12.1` |
| Lockfile | 3 |
| Cataloghi | it, de, fr, en; 904 chiavi nel riferimento italiano |
| Schema D1 versionato | 23 tabelle |
| Migrazioni | 9, SQL e journal concordanti |
| File route API | 30 |

## API esportate

L'elenco verifica presenza e metodi, non permessi o forma dei payload: vedere [Contratto API](API.md).

| Percorso | Metodi | File |
|---|---|---|
| `/api/account` | GET, POST | [route](../app/api/account/route.ts) |
| `/api/auth/login` | POST | [route](../app/api/auth/login/route.ts) |
| `/api/auth/logout` | POST | [route](../app/api/auth/logout/route.ts) |
| `/api/auth/oauth/google/callback` | GET | [route](../app/api/auth/oauth/google/callback/route.ts) |
| `/api/auth/oauth/google/start` | POST | [route](../app/api/auth/oauth/google/start/route.ts) |
| `/api/auth/providers` | GET | [route](../app/api/auth/providers/route.ts) |
| `/api/auth/recover` | POST | [route](../app/api/auth/recover/route.ts) |
| `/api/auth/register` | POST | [route](../app/api/auth/register/route.ts) |
| `/api/auth/security` | POST | [route](../app/api/auth/security/route.ts) |
| `/api/class-agenda/:subscriptionId` | PATCH, DELETE | [route](../app/api/class-agenda/[subscriptionId]/route.ts) |
| `/api/class-agenda` | GET | [route](../app/api/class-agenda/route.ts) |
| `/api/class-events/:eventId/subscription` | POST | [route](../app/api/class-events/[eventId]/subscription/route.ts) |
| `/api/classes/:classId/events/:eventId` | PATCH, DELETE | [route](../app/api/classes/[classId]/events/[eventId]/route.ts) |
| `/api/classes/:classId/events` | GET, POST | [route](../app/api/classes/[classId]/events/route.ts) |
| `/api/classes/:classId/invites/:inviteId` | DELETE | [route](../app/api/classes/[classId]/invites/[inviteId]/route.ts) |
| `/api/classes/:classId/invites` | GET, POST | [route](../app/api/classes/[classId]/invites/route.ts) |
| `/api/classes/:classId/members/:userId` | GET, PATCH, DELETE | [route](../app/api/classes/[classId]/members/[userId]/route.ts) |
| `/api/classes/:classId/notes/:noteId/pin` | PUT, DELETE | [route](../app/api/classes/[classId]/notes/[noteId]/pin/route.ts) |
| `/api/classes/:classId/notes/:noteId` | GET, PATCH, DELETE | [route](../app/api/classes/[classId]/notes/[noteId]/route.ts) |
| `/api/classes/:classId/notes` | GET, POST | [route](../app/api/classes/[classId]/notes/route.ts) |
| `/api/classes/:classId` | GET, PATCH, DELETE | [route](../app/api/classes/[classId]/route.ts) |
| `/api/classes/:classId/subjects/:subjectId` | PATCH, DELETE | [route](../app/api/classes/[classId]/subjects/[subjectId]/route.ts) |
| `/api/classes/:classId/subjects` | GET, POST | [route](../app/api/classes/[classId]/subjects/route.ts) |
| `/api/classes/join` | POST | [route](../app/api/classes/join/route.ts) |
| `/api/classes` | GET, POST | [route](../app/api/classes/route.ts) |
| `/api/diary` | PUT | [route](../app/api/diary/route.ts) |
| `/api/my-class-notes/:noteId` | DELETE | [route](../app/api/my-class-notes/[noteId]/route.ts) |
| `/api/my-class-notes` | GET | [route](../app/api/my-class-notes/route.ts) |
| `/api/notes/:noteId` | GET, PATCH, DELETE | [route](../app/api/notes/[noteId]/route.ts) |
| `/api/notes` | GET, POST | [route](../app/api/notes/route.ts) |

## Tabelle D1

Da [schema](../db/schema.ts); l'esistenza nel sorgente non prova l'applicazione delle migrazioni remote.

- `accounts`
- `sessions`
- `auth_limits`
- `diaries`
- `classes`
- `class_members`
- `class_invites`
- `class_events`
- `class_departures`
- `class_event_subscriptions`
- `personal_notes`
- `personal_note_sequences`
- `class_subjects`
- `class_notes`
- `class_note_pins`
- `auth_schema_state`
- `account_credentials`
- `account_identities`
- `account_emails`
- `auth_browser_epochs`
- `auth_transactions`
- `auth_challenges`
- `auth_grants`

## Migrazioni

- [0000_glorious_crusher_hogan.sql](../drizzle/0000_glorious_crusher_hogan.sql)
- [0001_amused_tombstone.sql](../drizzle/0001_amused_tombstone.sql)
- [0002_loving_roland_deschain.sql](../drizzle/0002_loving_roland_deschain.sql)
- [0003_melted_dark_phoenix.sql](../drizzle/0003_melted_dark_phoenix.sql)
- [0004_glossy_stranger.sql](../drizzle/0004_glossy_stranger.sql)
- [0005_heavy_elektra.sql](../drizzle/0005_heavy_elektra.sql)
- [0006_daily_stranger.sql](../drizzle/0006_daily_stranger.sql)
- [0007_auth_compatibility.sql](../drizzle/0007_auth_compatibility.sql)
- [0008_auth_bootstrap_legacy.sql](../drizzle/0008_auth_bootstrap_legacy.sql)

## Script npm

| Script | Comando |
|---|---|
| `install:ci` | `node scripts/install-ci.mjs` |
| `dev` | `node scripts/run-framework.mjs dev` |
| `study:dev` | `npm --prefix experiments/study-local run dev` |
| `study:check` | `npm --prefix experiments/study-local run check` |
| `study:build` | `npm --prefix experiments/study-local run build` |
| `study:evaluate` | `npm --prefix experiments/study-local run evaluate` |
| `build` | `node scripts/run-framework.mjs build && node scripts/generate-precache.mjs` |
| `build:cloudflare` | `node scripts/build-cloudflare.mjs` |
| `deploy:cloudflare` | `node scripts/deploy-cloudflare.mjs` |
| `check` | `npm run check:runtime && npm run lint && tsc --noEmit && npm test && npm run check:i18n && npm run docs:check` |
| `release:prepare` | `npm run check && npm run build` |
| `test` | `node --import tsx --test tests/*.test.ts` |
| `test:auth-d1` | `node --import tsx --test tests/auth-d1.integration.ts` |
| `test:auth-restore` | `node --import tsx scripts/w8a-restore-rehearsal.ts` |
| `test:api` | `node tests/api-smoke.mjs` |
| `media:capture` | `node scripts/capture-product-media.mjs` |
| `docs:generate` | `node scripts/repo-inventory.mjs` |
| `docs:check` | `node scripts/repo-inventory.mjs --check && node scripts/check-docs.mjs` |
| `check:i18n` | `node scripts/check-i18n.mjs` |
| `start` | `node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js dev --config dist/server/wrangler.json --local --persist-to .wrangler/state --ip 127.0.0.1 --inspector-port 0` |
| `lint` | `eslint . --ignore-pattern dist --ignore-pattern .next` |
| `check:dependency-security` | `node --import tsx --test tests/dependency-security.test.ts` |
| `preinstall` | `node scripts/check-node.mjs` |
| `check:runtime` | `node scripts/check-node.mjs` |

## Dipendenze dirette

Versioni dichiarate in `package.json` e risolte in `package-lock.json`. La classificazione segue il manifest; non misura quali pacchetti entrino nel bundle. Per un audit eseguire il comando dedicato.

| Pacchetto | Gruppo | Dichiarata | Risolta |
|---|---|---|---|
| `@fontsource/noto-emoji` | app | `^5.3.2` | `5.3.2` |
| `@fontsource/noto-sans` | app | `^5.3.0` | `5.3.0` |
| `@fontsource/noto-sans-arabic` | app | `^5.3.0` | `5.3.0` |
| `@fontsource/noto-sans-symbols-2` | app | `^5.3.0` | `5.3.0` |
| `@pdf-lib/fontkit` | app | `^1.1.1` | `1.1.1` |
| `class-variance-authority` | app | `0.7.1` | `0.7.1` |
| `clsx` | app | `2.1.1` | `2.1.1` |
| `drizzle-orm` | app | `0.45.2` | `0.45.2` |
| `jose` | app | `6.2.15` | `6.2.15` |
| `lucide-react` | app | `^1.31.0` | `1.31.0` |
| `next` | app | `16.4.6` | `16.4.6` |
| `next-themes` | app | `^0.4.6` | `0.4.6` |
| `pdf-lib` | app | `^1.17.1` | `1.17.1` |
| `prosemirror-commands` | app | `^1.7.2` | `1.7.2` |
| `prosemirror-history` | app | `^1.5.1` | `1.5.1` |
| `prosemirror-keymap` | app | `^1.2.3` | `1.2.3` |
| `prosemirror-model` | app | `^1.25.12` | `1.25.12` |
| `prosemirror-schema-list` | app | `^1.5.1` | `1.5.1` |
| `prosemirror-state` | app | `^1.4.4` | `1.4.4` |
| `prosemirror-view` | app | `^1.42.6` | `1.42.6` |
| `radix-ui` | app | `^1.6.7` | `1.6.7` |
| `react` | app | `19.3.1` | `19.3.1` |
| `react-dom` | app | `19.3.1` | `19.3.1` |
| `recharts` | app | `^3.8.0` | `3.8.0` |
| `sonner` | app | `^2.0.8` | `2.0.8` |
| `tailwind-merge` | app | `3.6.0` | `3.6.0` |
| `zod` | app | `^4.6.7` | `4.6.7` |
| `@cloudflare/vite-plugin` | tooling/test | `1.70.0` | `1.70.0` |
| `@cloudflare/workers-types` | tooling/test | `5.20261117.1` | `5.20261117.1` |
| `@tailwindcss/postcss` | tooling/test | `4.2.1` | `4.2.1` |
| `@types/node` | tooling/test | `22.19.19` | `22.19.19` |
| `@types/react` | tooling/test | `19.2.14` | `19.2.14` |
| `@types/react-dom` | tooling/test | `19.2.3` | `19.2.3` |
| `@vitejs/plugin-react` | tooling/test | `6.3.0` | `6.3.0` |
| `@vitejs/plugin-rsc` | tooling/test | `^0.5.39` | `0.5.39` |
| `braces` | tooling/test | `file:vendor/braces` | `3.0.3-ipagell.1` |
| `drizzle-kit` | tooling/test | `0.31.10` | `0.31.10` |
| `eslint` | tooling/test | `9.39.4` | `9.39.4` |
| `eslint-config-next` | tooling/test | `16.4.6` | `16.4.6` |
| `fake-indexeddb` | tooling/test | `^6.2.5` | `6.2.5` |
| `react-server-dom-webpack` | tooling/test | `19.3.1` | `19.3.1` |
| `tailwindcss` | tooling/test | `4.2.1` | `4.2.1` |
| `tsx` | tooling/test | `^4.22.1` | `4.22.1` |
| `tw-animate-css` | tooling/test | `^1.4.0` | `1.4.0` |
| `typescript` | tooling/test | `5.9.3` | `5.9.3` |
| `vinext` | tooling/test | `^1.4.6` | `1.4.6` |
| `vite` | tooling/test | `8.3.8` | `8.3.8` |
| `wrangler` | tooling/test | `4.164.0` | `4.164.0` |
