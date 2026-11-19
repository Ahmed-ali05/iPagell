---
name: web-design-guidelines
description: Review UI code for Web Interface Guidelines compliance. Use when asked to "review my UI", "check accessibility", "audit design", "review UX", or "check my site against best practices". In iPagell usala per revisionare viste e componenti (accessibilità, focus, form, stati, testi) con segnalazioni puntuali file:riga.
metadata:
  author: vercel (adattata per iPagell)
  version: "1.0.0"
  argument-hint: <file-or-pattern>
  source: "vercel-labs/agent-skills@1a2c79d; regole da vercel-labs/web-interface-guidelines@434b7f9 (MIT, vedi LICENSE)"
---

# Web Interface Guidelines

Review files for compliance with Web Interface Guidelines.

## How It Works

1. Read the local rules in [references/guidelines.md](references/guidelines.md). Do not fetch them from the network.
2. Read the specified files (or ask the user for files/pattern).
3. Check against all rules, applying the iPagell adaptation below where it overrides a generic rule.
4. Output findings in the terse `file:line` format described in the rules file.

If no files are specified, ask the user which files to review. A review reports findings; change files only when the user asks for fixes.

## Adattamento iPagell (prevale sulle regole generiche)

Segui [AGENTS.md](../../../AGENTS.md) e la skill [apple-design](../apple-design/SKILL.md). Prima di segnalare, verifica nel codice corrente che il problema esista davvero.

- **Testi e lingue.** «Title Case», voce attiva, seconda persona e numerali sono regole per l'inglese. Per it/de/fr segui le convenzioni della lingua (in italiano e francese maiuscola solo iniziale). Controlla le quattro lingue in `lib/i18n/messages/{it,de,fr,en}.json` e segnala testi visibili non localizzati.
- **Stato e URL.** Le viste dell'app sono stato client dentro `/app` per scelta progettuale. Non segnalare l'assenza di stato nell'URL e non proporre `nuqs` o altre dipendenze; segnala solo perdita di contesto (selezione, posizione di lettura, focus).
- **Prestazioni.** Non proporre librerie di virtualizzazione: segnala liste lunghe solo con evidenza (quote e paginazione sono in `docs/APPUNTI-SPEC.md`).
- **Movimento.** Riduci movimento usa due segnali, `data-reduce-motion="true"` e `prefers-reduced-motion`; vedi apple-design. Non suggerire regole globali che azzerano `transform`.
- **Salvataggio.** Debounce dell'autosave, `flushOpenNotes()` e protezioni dalle doppie scritture sono intenzionali. Segnala `beforeunload` mancante solo se una modifica può davvero andare persa (gli appunti hanno bozze locali).
- **Aggiornare le regole.** La copia locale è fissata al commit indicato nel frontmatter. Per aggiornarla, confronta a mano con l'upstream, rivedi le differenze e aggiorna il commit; non scaricare le regole a ogni revisione.
