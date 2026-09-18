# Produzione e pubblicazione

- La produzione richiesta con «deploy» o «pubblica» è **https://ipagell.website**.
- Usa Sites hosting con il progetto già presente in `.openai/hosting.json`, preservando database, domini e accesso esistenti. Verifica sito e domini prima della pubblicazione.
- `wrangler.jsonc` identifica un Worker sperimentale con database separato. `npm run deploy:sandbox` non aggiorna la produzione; usarlo solo se richiesto esplicitamente.
- Il vecchio indirizzo `*.chatgpt.site` appartiene alla stessa pubblicazione Sites: la navigazione viene indirizzata al dominio canonico.
- Flusso per sviluppatori e pubblicazione: `docs/DEPLOYMENT.md`. Non dichiarare pubblicato il sito dopo una sola build o un push GitHub.
