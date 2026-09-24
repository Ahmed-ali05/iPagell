## Contesto della repository

Prima di iniziare task non banali, leggere:

- `docs/REPO-SNAPSHOT.md`
- `docs/ARCHITECTURE-CURRENT.md`

Consultare anche `docs/VERIFICATION-MATRIX.md` quando il task coinvolge comportamento critico, parti poco chiare della repository o affermazioni che devono essere verificate con precisione.

Questi documenti servono come mappa iniziale della repository, ma non sostituiscono la verifica del codice.

Prima di modificare una funzionalità:

1. individuare i file realmente coinvolti;
2. leggere l'implementazione corrente;
3. verificare che il comportamento descritto nei documenti sia ancora valido.

In caso di conflitto tra documentazione e codice, il codice corrente è la fonte primaria di verità.

Se una modifica rende obsoleta una parte della documentazione tecnica, aggiornare i documenti pertinenti nello stesso task, senza riscrivere sezioni non coinvolte.

# Produzione e pubblicazione

- La produzione richiesta con «deploy» o «pubblica» è **https://ipagell.website**.
- Usa Sites hosting con il progetto già presente in `.openai/hosting.json`, preservando database, domini e accesso esistenti. Verifica sito e domini prima della pubblicazione.
- `wrangler.jsonc` identifica un Worker sperimentale con database separato. `npm run deploy:sandbox` non aggiorna la produzione; usarlo solo se richiesto esplicitamente.
- Il vecchio indirizzo `*.chatgpt.site` appartiene alla stessa pubblicazione Sites: la navigazione viene indirizzata al dominio canonico.
- Flusso per sviluppatori e pubblicazione: `docs/DEPLOYMENT.md`. Non dichiarare pubblicato il sito dopo una sola build o un push GitHub.