# Contributing to iPagell

[README](README.md) · [Product plan](docs/PRODOTTO.md) · [Code of conduct](CODE_OF_CONDUCT.md)

Thanks for your interest in iPagell. Focused issues and pull requests are welcome. Before starting a large change, open an issue describing the problem, the goal and the scope so we can agree on the approach first.

Most technical documentation is in Italian. Issues and pull requests can be written in English or Italian.

## Before you change the code

- Read `AGENTS.md`, the [repository snapshot](docs/REPO-SNAPSHOT.md), the [current architecture](docs/ARCHITECTURE-CURRENT.md), [SECURITY.md](SECURITY.md) and the user flow you are touching. For critical behaviour, also check the [verification matrix](docs/VERIFICATION-MATRIX.md).
- Always verify against the code. Historical plans and audits do not automatically describe the current runtime.
- Describe the problem, who it affects, the expected behaviour and what is out of scope.
- Use synthetic accounts and data only. Never commit real diaries, backups or credentials.
- Keep the licenses of vendored components intact.

## Local setup

Follow [Getting started](README.md#getting-started) and the [maintenance guide](docs/MANUTENZIONE.md) to install dependencies and initialise the local D1 database.

## Definition of done

1. Add a reproducible test for bugs in calculations, validation, ownership or sync.
2. Make the smallest coherent change, preserving other people's work and existing data IDs and references.
3. Check empty, loading, error and success states, not only the happy path.
4. Run the checks from the [maintenance guide](docs/MANUTENZIONE.md) in proportion to the change. `npm run check` covers runtime, lint, types, tests, i18n and docs. For documentation-only changes run at least `npm run docs:check` and `git diff --check`.
5. Update the related documents and the unreleased section of the [changelog](CHANGELOG.md). Keep what was verified, what is planned and what was not verified clearly separate.
6. For persistent changes, include a migration, compatibility with old data and a recovery plan. No implicit deletions.
7. If routes, schema, migrations, npm scripts or dependencies change, regenerate the inventory with `npm run docs:generate`. `docs:check` compares it with the source; the affected guides still need a manual update.

Do not claim a security improvement just because a dependency was updated. Do not hand-edit compiled assets or migrations that have already been released. Documentation-only changes do not require a new deployment.

## Pull requests

- Keep each pull request focused on one problem.
- Explain what changed, why, and how you verified it.
- Mention any user-facing change, migration or new dependency explicitly.
- CI must pass. It runs the full check suite, a dependency audit and local D1 compatibility tests.

## Reporting a bug

Use the bug report template when you open an issue. It asks for:

```text
Environment and version:
What you were trying to do:
Steps to reproduce (with synthetic data):
Expected / actual behaviour:
Network and sync state:
Impact and whether data can be recovered:
Evidence, with personal data removed:
```

For vulnerabilities, use the private channel described in [SECURITY.md](SECURITY.md), never a public issue.
