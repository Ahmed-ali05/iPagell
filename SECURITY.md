# Security and data handling

[README](README.md) · [API](docs/API.md) · [Operations](docs/MANUTENZIONE.md)

This is a technical description. It is not a legal privacy notice, a certification or a promise of invulnerability.

## Reporting a vulnerability

Please **do not** open a public issue, pull request or discussion for a security problem.

- Use GitHub's private reporting: **Security → Report a vulnerability** on this repository, or
- email **ipagell.service@gmail.com** with the subject `Security`.

Do not include real backups, passwords, recovery codes, cookies or database dumps. Include the affected version or commit, the impact, reproducible steps using synthetic accounts and minimal evidence. Do not access other people's data and do not run load tests against the public site.

There is no formal response-time commitment yet. Maintainers aim to acknowledge reports, reproduce them in isolation, assess the risk, agree on containment and release, add regression tests and communicate the limits of the fix.

### Supported versions

Only the version currently deployed at [ipagell.website](https://ipagell.website), built from the latest released source, receives security fixes.

## Trust boundaries

The browser and its inputs are never the authority on who owns a diary. Every private API derives the user from the session and uses parameterised queries. `expectedUserId` detects account switches; it does not replace cookie verification. Application-level isolation does not prevent the authorised infrastructure operator from accessing the database: this is not end-to-end encryption.

Passwords: scrypt with N=16384, r=8, p=5, 32-byte output, a random 16-byte salt and timing-safe comparison. Only one concurrent hash runs per isolate; overload returns an error instead of an unbounded queue. A pepper, breached-password checks and two-factor authentication are not implemented.

Sessions: a random 32-byte token, with only its SHA-256 digest stored in the database, and a fixed 14-day lifetime. The HTTPS cookie is `__Host-ipagell-session`, HttpOnly, Secure, SameSite=Lax, Path=/, with no Domain; a separate non-Secure name is used for local HTTP. The credential version is checked on every request. Do not move tokens to localStorage.

Recovery: a random 32-byte code, stored as a digest and rotated after a single use at reset. The code allows the password to be changed, so treat it as a credential. Changing the password or recovering the account invalidates old sessions; revoking a session on the server does not remotely delete offline copies.

CSRF: mutations require the exact origin and a JSON body, plus a Fetch Metadata check. These checks do not protect against a malicious script already running on the same origin. Trusting `CF-Connecting-IP` relies on the expected edge path; do not expose the Worker through a proxy that lets clients forge that header.

## W8-A preparation, verified locally only

Migration 0007 adds the auth schema state and separate credentials. 0007 is schema-only: an explicit, separate initialisation is required before traffic is reopened, otherwise auth stays blocked. In legacy mode authentication uses `accounts` only, even without a backfill; an optional explicit copy can become stale. The adapter also supports the future schema without the two secret columns; no remote contraction has been delivered or run. Database guards reject auth writes while the mode is paused or unknown, including requests already in flight. The pause also blocks DELETE on invites and diaries, to stop the effects of old writers. Provider, proof and epoch structures remain inactive.

Password change and account deletion re-check the same session, expiry and `auth_version` inside the mutation after the KDF. Invites, diary and account share the same deletion predicate; a failed FK constraint rolls back the batch. The client flushes before the request, invalidates its own generation right after success and clears only the captured ID. A local clean-up error is reported without reopening the deleted account. Logs of unexpected exceptions contain only the error name, with no SQL or provider text and no parameters. [Evidence and limits](docs/improvement-2026-10-01/AUTH-COMPATIBILITY-W8A.md).

## Where data is stored

| Location | Contents / limits |
|---|---|
| D1 | Accounts, credential and session digests, diary snapshots, rate-limit buckets, classes, members and invites, activities and subscriptions, personal and shared notes, class subjects and pins |
| IndexedDB | Per-account diary and a separate Notes store with drafts, conflicts, in-flight payloads and the import plan; not encrypted with the password |
| localStorage | Account pointer, interface language, linked agenda cache, notification and install markers, and possible legacy preferences |
| Service worker cache | Generic shell and allowed assets, never API responses |
| Downloaded JSON backup | Diary and preferences, notes, drafts, conflicts and copies of your own class notes in plain text; outside the app's control, with no credentials or in-flight payloads |

Deleting an account removes current application data from the database and invalidates sessions; it does not guarantee removal from infrastructure backups, exports or offline devices. Infrastructure retention periods, the data controller, contact details and the privacy notice must be defined by whoever operates the service: do not invent them in the UI.

Expired sessions and buckets are cleaned up when a session is created, not by a dedicated periodic job. Logging out removes the copy of the active diary; the interface may keep the same account's Notes store if it contains pending notes or drafts, after flushing and warning the user. It does not necessarily delete every legacy store or those of previous accounts. On a shared device, check this before signing out.

Personal notes have owner-only endpoints. Class notes require current membership; only the author can rewrite the text, while owners and moderators can moderate by withdrawing a note. The author archive exposes only the author's own texts, even after membership is lost. Pins and drafts stay personal. Rendering uses a closed AST and an allow-list of React nodes; the protocol requires an explicit format and client contract. Copying between spaces is always a voluntary user action.

## Feature status

Classes, events, the linked personal agenda, subjects and shared notes are implemented in the code: they check authorisation on the server and keep shared data separate from the diary. The runtime value of the Classes flag cannot be derived from the repository alone. Release evidence and limits are in the [verification matrix](docs/VERIFICATION-MATRIX.md). The AI study space is still future work. The specifications set security requirements before any extension:

- [Self-managed classes](docs/CLASSI.md): server-side authorisation, invites stored as digests, diary isolation and tests against IDOR and privilege escalation;
- [AI study space](docs/SPAZIO-STUDIO-AI.md): untrusted files, prompt injection, storage and vector isolation, deletion of derived data, quotas and processing by the provider.

Do not connect an AI model or accept real files in production until the privacy notice, provider, region, retention, scanning, deletion and operational responsibility have been approved and verified.

## Runtime and dependencies — 22 October 2026

PHP is not present in the source or in the deployed build. Node is used for local tooling and CI; the public Worker runs on the Cloudflare runtime managed by the platform. Use the patched releases allowed in `package.json`, with 22.23.4 selected in `.nvmrc`. The runtime check also rejects Node 23, which is out of support. Vite is on 8.1.6; a full npm audit and regression tests for the local `braces` patch remain mandatory. [Advisories, scope and evidence](docs/RUNTIME-SECURITY-2026-10-22.md). The npm result does not verify the runtime managed by the provider.
