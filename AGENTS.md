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

## Design dell'interfaccia

Per progettare o rifinire UI e interazioni, leggere la skill locale [apple-design](.agents/skills/apple-design/SKILL.md). Applicarla nel perimetro della richiesta, riusando token, componenti e preferenze di accessibilità di iPagell. La skill guida feedback, movimento, gerarchia e tipografia; non impone un restyling né nuove dipendenze. Per task solo backend, dati, dipendenze o pubblicazione non è necessaria.

# Produzione e pubblicazione

- La produzione richiesta con «deploy» o «pubblica» è **https://ipagell.website**.
- Dal 16 novembre 2026 la produzione passa da OpenAI Sites (abbonamento non più attivo) all'account Cloudflare del proprietario: Worker `ipagell` con D1 `ipagell-live` (binding `DB`, giurisdizione UE), configurati in `wrangler.jsonc`. Si pubblica con `npm run deploy:cloudflare` dopo `npx wrangler login`. Non usare più il flusso Sites né `.openai/hosting.json` per i rilasci.
- `ipagell.website` e `www` sono Custom Domains del Worker (zona Cloudflare del proprietario; dominio registrato su GoDaddy). Indirizzo tecnico: `https://ipagell.ahmedbasto59.workers.dev`. Dettagli in `docs/DEPLOYMENT.md`.
- I dati del D1 Sites non sono esportabili da qui: gli utenti li trasferiscono con il backup JSON dell'app (esporta sul vecchio sito, importa sul nuovo dopo una nuova registrazione).
- Flusso per sviluppatori e pubblicazione: `docs/DEPLOYMENT.md`. Non dichiarare pubblicato il sito dopo una sola build o un push GitHub.
