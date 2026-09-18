# Registro modifiche

Le date sono quelle del progetto. Versione npm, formato del diario e numero di pubblicazione Sites sono contatori distinti.

## Non rilasciato

- Anteprima di condivisione Open Graph e X con immagine dedicata, nome iPagell e descrizione leggibile.

- Password: minimo ridotto a 12 caratteri per registrazione, recupero e cambio password; interfaccia e guida allineate.

- Avviato il passaggio UX leggero: copy più espliciti, registrazione separata dall’accesso, conferme specifiche e stati vuoti/assenze/classi più chiari; gli interventi strutturali restano pianificati nella reference UX.

### Semplificazione e contenuti generici

- Modello iniziale con materie generiche personalizzabili; diario vuoto ancora disponibile e compatibilità con i client precedenti.
- Rimossi crediti personali e riferimenti a istituti specifici dai contenuti e dai metadati del progetto.
- Separate le viste Assenze e Statistiche dal coordinamento del diario, senza modificare calcoli o persistenza.
- Corretta la configurazione locale per evitare flag e binding duplicati e usare una data supportata dal runtime installato.
- Documentata la direzione tecnica: evoluzione graduale, comportamenti standard del Web e priorità al prodotto.

### Distribuzione indipendente e pagina pubblica

- Aggiunta una landing page SEO pubblica con dati strutturati, FAQ, sitemap e regole robots; l'area account è ora separata in `/app` e i vecchi link vengono inoltrati.
- Preparato e verificato il deploy autonomo su Cloudflare Workers con D1 europeo, osservabilità e migrazioni tracciate.
- Aggiunti comandi ripetibili e un workflow GitHub Actions manuale per la pubblicazione.
- Il dominio principale resta temporaneamente sul precedente ambiente fino alla migrazione verificata dei dati.

### Classi private C1

- Nuova area Classi per creare un gruppo, entrare tramite link o codice e scegliere il proprio nome visibile.
- Proprietari e moderatori possono creare e revocare inviti; il proprietario gestisce ruoli, trasferimento ed eliminazione.
- Uscita e rimozione revocano subito l’accesso; voti, assenze e diario personale restano fuori dallo spazio condiviso.
- Aggiornati sito e inviti per usare il dominio principale `ipagell.website`.

### Fondamenta classi C0

- Aggiunte tabelle normalizzate per classi, membri e inviti, separate dal diario personale.
- Introdotta una matrice centralizzata dei permessi per proprietario, moderatore e membro, coperta da test.
- Aggiunto un interruttore server spento per impostazione predefinita: nessuna schermata o rotta classi è ancora esposta.

### Documentazione e gestione del progetto

- Repository preparato per la pubblicazione open source con README riorganizzato, metadati GitHub e licenza MIT.
- README corretto: account interni, backend D1 e preferenze sincronizzate, non più descrizione “solo locale”.
- Guida utente, architettura, API, manutenzione e documento di sicurezza.
- Cinque profili d’uso, roadmap prioritaria con criteri d’accettazione, checklist di rilascio e linee guida per contribuire.
- Controllo ripetibile dei collegamenti locali della documentazione.
- Specifica implementabile per classi autogestite, inviti revocabili, ruoli e agenda collegata.
- Progetto dello spazio studio AI: albero/grafo incrementale dalle dispense, fonti, versionamento, privacy, rischi ed evaluation.
- Nessuna modifica al comportamento o ai dati dell’app in questo aggiornamento documentale.

## 2026-09-16 — Pubblicazione Sites 2

- Account interni con password scrypt e salt individuale, sessioni protette, codice di recupero e limiti ai tentativi.
- Snapshot personali D1, copie offline per account, controllo revisione e importazioni validate.
- Rimozione dati demo personali, superfici opache e comandi mobili accessibili.
- Tipologie voto con ID stabili, supporto notazione `4-5`, simulatore con pesi espliciti e rimozione della proiezione artificiale.
- Service worker con asset consentiti e API escluse dalla cache.

Dettagli e limiti della verifica: [REVIEW](docs/REVIEW.md). Le funzioni avanzate non completate restano nella [roadmap](docs/PRODOTTO.md), non nelle note di consegna.
