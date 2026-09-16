# Registro modifiche

Le date sono quelle del progetto. Versione npm, formato del diario e numero di pubblicazione Sites sono contatori distinti.

## Non rilasciato

### Documentazione e gestione del progetto

- README corretto: account interni, backend D1 e preferenze sincronizzate, non più descrizione “solo locale”.
- Guida utente, architettura, API, manutenzione e documento di sicurezza.
- Cinque profili d’uso, roadmap prioritaria con criteri d’accettazione, checklist di rilascio e linee guida per contribuire.
- Controllo ripetibile dei collegamenti locali della documentazione.
- Nessuna modifica al comportamento o ai dati dell’app in questo aggiornamento documentale.

## 2026-09-16 — Pubblicazione Sites 2

- Account interni con password scrypt e salt individuale, sessioni protette, codice di recupero e limiti ai tentativi.
- Snapshot personali D1, copie offline per account, controllo revisione e importazioni validate.
- Rimozione dati demo personali, superfici opache e comandi mobili accessibili.
- Tipologie voto con ID stabili, supporto notazione `4-5`, simulatore con pesi espliciti e rimozione della proiezione artificiale.
- Service worker con asset consentiti e API escluse dalla cache.

Dettagli e limiti della verifica: [REVIEW](docs/REVIEW.md). Le funzioni avanzate non completate restano nella [roadmap](docs/PRODOTTO.md), non nelle note di consegna.
