# Direzione e prossime sessioni — posizionamento iPagell

**Preparato il 15 ottobre 2026. Stato: pronto per avviare le sessioni, nessuna sessione eseguita.** Questa preparazione modifica soltanto documentazione. Non avvia sviluppo, pubblicazione, campagne, contatti o nuove chat.

[Indice documentazione](../README.md) · [Prompt pronti](PROMPTS.md) · [Analisi SEO](../SEO-POSIZIONAMENTO-2026-10-10.md) · [Prodotto e nome](../PRODOTTO-NOME-POSIZIONAMENTO-2026-10-10.md)

## 1. Direzione consigliata per il primo ciclo

**Rendere iPagell riconoscibile come diario scolastico personale, facendolo scoprire attraverso un calcolatore della media da 1 a 6 più utile e comprensibile.**

| Livello | Scelta di lavoro per questo ciclo | Come si presenta |
|---|---|---|
| Marchio | Mantenere iPagell durante il primo ciclo | «iPagell» |
| Categoria | Diario scolastico personale | «Il tuo diario scolastico» come descrittore da integrare nel contesto, senza imporlo al logo |
| Promessa | Sapere cosa preparare e seguire voti e appunti per materia | Benefici dimostrabili con le funzioni già presenti |
| Ingresso dalla ricerca | Calcolo della media semplice e ponderata nella scala 1–6 | Pagina `/calcolo-media-voti` conservata |
| Pubblico iniziale | Studenti che usano 1–6 con 6 come voto migliore; Svizzera italiana come ipotesi di partenza | Contesto esplicito, non affiliazione o conformità a ogni scuola |
| Lingue | Preservare it/de/fr/en | Localizzare il significato e spiegare la scala; nessuna nuova scala implicita |
| Nome futuro | Decisione basata su comprensione, memoria e direzione del prodotto | Preparare una prova del nome; non avviare ora una migrazione |

È una direzione raccomandata per concentrare il lavoro, non il risultato di una ricerca di mercato già svolta. L'avvio dei prompt applicativi autorizzerà il perimetro descritto in ciascuno; questo piano non decide una rinomina definitiva.

Il primo risultato concreto sarà un piccolo rilascio coerente: calcolatore spiegato meglio, metadati pertinenti, accesso visibile dalla home, promessa del diario chiara e stato di indicizzazione documentato quando verificabile. Nessun nuovo strumento è necessario per completarlo.

## 2. Punto di partenza verificato nel checkout

Riletti snapshot, architettura, matrice e analisi del 10 ottobre; verificati metadata, route, componente e helper del calcolatore, formule, test pertinenti e script npm. Le verifiche HTTP dell'analisi risalgono al **10 ottobre**, non sono state ripetute il 15: S01 le aggiorna.

- Il calcolatore esiste nelle quattro lingue e usa `average.title`/`average.description` sia per UI sia per metadata. La home ha già chiavi SEO separate: non rifare quel lavoro.
- Il tool calcola con pesi espliciti, mostra un decimale e non conserva i voti. Il link al diario passa modalità e lingua, non trasferisce i voti.
- Il link al calcolatore è nella sezione Voti della landing; il gruppo CTA iniziale conduce a registrazione ed esplorazione della pagina.
- `tests/grade-average-calculator.test.ts` comprende aritmetica, parsing, pesi estremi e metadata delle lingue. Non limitare il lavoro a `tests/i18n-public.test.ts`.
- Il simulatore privato si trova nel workspace `components/ipagell-app.tsx`; `neededGrade` è in `lib/calculations.ts` e usa pesi di dominio diversi dal tool. Non esiste un file `components/grade-simulator.tsx` nel checkout letto.
- La matrice e il registro riportano successivi rilasci fino a **Sites 37**, compresa la correzione dipendenze e la revisione Agenda. Sono evidenze documentali, non una nuova conferma remota. Il vecchio blocco CI della PR 5 non va riproposto come ancora aperto senza verificarlo.
- Il checkout contiene molte modifiche e file non tracciati preesistenti. Nessuna sessione deve includerli o scartarli automaticamente; prima del rilascio serve una provenienza chiara del sorgente candidato.

## 3. Regole comuni delle sessioni

Ogni prompt in [PROMPTS](PROMPTS.md) rimanda a questo contratto e può essere incollato in una nuova chat dello stesso progetto.

1. Leggere `AGENTS.md`, snapshot, architettura, questo piano e il registro di avanzamento se esiste. Consultare la matrice per le affermazioni da verificare. Il codice prevale sulle analisi datate.
2. Eseguire soltanto la sessione richiesta. Preservare modifiche pregresse; niente reset, pulizie indiscriminate, `git add -A` o commit/push di lavoro estraneo. Non avviare altre chat o agenti per effetto del piano.
3. Per UI leggere e applicare la [skill locale apple-design](../../.agents/skills/apple-design/SKILL.md): screenshot prima della modifica quando possibile, componenti/token esistenti, tastiera e focus, 320/390 px, temi, traduzioni lunghe e movimento ridotto. La skill non impone un restyling.
4. Per implementazione/preparazione Sites seguire la skill Sites disponibile nella sessione e [DEPLOYMENT](../DEPLOYMENT.md). Non trattare il progetto come un server Next standard: il runtime è Vinext/Vite/Workers.
5. Mantenere URL e formule esistenti nel primo ciclo; API, account, database, backup e copie locali restano fuori dal suo perimetro. Non promettere trasferimento dei voti, AI, altre scale o notifiche non implementate.
6. Nessun deploy in S01–S05. **S06 è il prompt esplicito di pubblicazione**, da usare quando si vuole mettere online il candidato verificato. Produzione: `https://ipagell.website`, progetto Sites esistente; preservare binding, dati, domini e accesso. Niente deploy sandbox.
7. Aggiornare le fonti tecniche pertinenti solo quando cambia un comportamento. Gli audit del 10 ottobre restano fotografie datate. Per soli documenti: `npm run docs:check` e controllo whitespace dei file toccati; niente build applicativa.
8. Non trasformare accesso pubblico o build riuscita in prova di indicizzazione. Usare «non verificabile» per dati mancanti, non inventare misure o risultati di utenti.

### Passaggio da una sessione alla successiva

S01 crea `docs/posizionamento-2026-10-15/PROGRESS.md`; le altre sessioni lo aggiornano. Il percorso è un risultato futuro, non un documento già consegnato. Ogni registrazione deve contenere:

```text
Sessione e data:
Stato: completata / completata con limiti / lavoro incompleto
Checkout iniziale: branch, HEAD e modifiche pregresse rilevanti
Risultato e file effettivamente cambiati:
Verifiche eseguite ed esiti, con ambiente e data:
Evidenze esterne e limiti:
Decisioni prese e questioni aperte:
Sorgente/candidato verificato, se applicabile:
Prossimo prompt avviabile e sue dipendenze:
Pubblicazione: non eseguita / riferimento Sites e stato verificato
```

Il registro serve a riprendere il lavoro fra chat. Non deve duplicare credenziali, esportazioni di dati scolastici o intere trascrizioni di tool.

## 4. Sequenza concreta

| Sessione | Obiettivo e risultato | Dipendenza | Codice / pubblicazione |
|---|---|---|---|
| **S01 — diagnosi** | Risposte HTTP attuali, stato Search Console se accessibile, baseline e ostacoli distinti | Nessuna | Sola lettura esterna, documenti locali |
| **S02 — promessa e contenuti** | Brief di una pagina, copy IT e localizzazioni proposte, scheda di prova del nome | S01, anche se Search Console resta aperta | Documenti |
| **S03 — calcolatore** | Metadata distinti dalla UI, scala/pesi, esempi e precisione spiegati nelle quattro lingue | S02 | Implementazione locale |
| **S04 — scoperta dalla home** | Ingresso al tool riconoscibile e promessa del diario coerente | S03 | Implementazione locale |
| **S05 — candidato verificato** | Verifica integrata su build compilata, provenienza del sorgente, elenco modifiche e piano di ripristino | S03 e S04 concluse | Verifica e correzioni nel perimetro; nessun deploy |
| **S06 — pubblicazione** | Rilascio Sites riuscito e controlli pubblici successivi | Candidato S05 ancora valido e volontà di pubblicare | Pubblicazione esplicitamente richiesta dal prompt |
| **S07 — risultati e scelta successiva** | Lettura dei dati reali, riscontri sul nome, decisione sul prossimo investimento | S06 e dati utilizzabili | Analisi/documenti |
| **S08 — simulatore, opzionale** | Strumento «che voto mi serve?» integrato nel tool, con contratto matematico e verifiche | Primo ciclo concluso; avvio esplicito dopo revisione delle priorità | Sviluppo locale, rilascio successivo separato |

**Da avviare adesso: S01, poi S02.** S03 e S04 sono un piccolo ciclo di implementazione; S05 lo rende verificabile prima della pubblicazione. Il lavoro è sequenziale perché cataloghi e componenti si sovrappongono.

S07 può avvenire dopo alcune settimane di dati dalla pubblicazione: prima lettura indicativa a circa quattro settimane, seconda se utile a otto. Sono finestre per una revisione manuale, non automazioni, scadenze di ranking o inviti ad aspettare per correggere un errore evidente.

## 5. Accettazione del primo ciclo

### Contenuto e prodotto

- Il tool resta utilizzabile senza account e senza leggere un articolo prima di inserire il primo voto.
- Titolo e introduzione rendono espliciti scala 1–6 e pesi; il contesto chiarisce 6 migliore e 4 riferimento di sufficienza, distinguendo regole della scuola e formula.
- Esempio semplice: 4,5 / 5 / 5,5 → 5,0. Esempio ponderato: 4,5 peso 1 e 5,5 peso 2 → 5,1666… → visualizzazione 5,2. Le spiegazioni corrispondono all'implementazione.
- Le FAQ rispondono a pesi, virgola, precisione e conservazione dei dati. Nessuna promessa di voto ufficiale o di trasferimento automatico al diario.
- Chi entra dalla home trova il calcolatore e capisce perché il diario è utile dopo un calcolo occasionale.

### Routing, verifica e rilascio

- HTML delle otto route pubbliche con title, description, canonical, hreflang, lingua e direttive coerenti; nessun cambio URL o lingua→scala.
- `/app` rimane noindex, API escluse dal crawling; alias esistenti conservano percorso e query. Non applicare modifiche speculative ai redirect soltanto per il 302 storico.
- Prove browser nelle route coinvolte, tastiera/focus, viewport 320/390 px e desktop, temi e quattro lingue. Dati sintetici; nessuna scrittura su account reali.
- `npm run check` durante S03; prove mirate e i18n in S04; `npm run release:prepare` sul candidato finale in S05. Ripetere controlli già riusciti solo quando sorgente, dipendenze o ambiente rilevante cambiano.
- S05 registra il perimetro sorgente: HEAD più impronta delle modifiche non committate oppure commit dedicato se disponibile; elenco dei file applicativi e versioni manifest/lockfile. Una build di un checkout diverso non è quella verificata.
- S06 verifica il progetto e i domini attuali, lo stato Sites e le risposte pubbliche dopo il rilascio. Un push o una build non chiudono la sessione di pubblicazione.

## 6. Search Console e riscontri umani: dipendenze precise

**Search Console:** S01 usa una proprietà già accessibile al proprietario. Se manca accesso, prepara un elenco breve dei dati da ottenere: ispezione URL del calcolatore e home, canonical Google, ultima scansione, stato sitemap e query/pagine per paese e dispositivo. Non chiede credenziali né inserisce verifiche DNS in autonomia. S02–S05 possono proseguire sul lavoro verificabile; lo stato d'indicizzazione rimane aperto. Invio sitemap/richiesta indicizzazione sono azioni successive da eseguire su istruzione esplicita, non un risultato presunto.

**Nome e prodotto:** S02 prepara un kit con scenario, domande non suggestive, ordine variabile delle presentazioni, scheda di risposte vuota e criteri decisionali. Il proprietario può usarlo con 6–10 studenti del contesto iniziale. Questo è un campione esplorativo proposto, non una prova già effettuata. Codex non contatta persone; S07 analizza soltanto riscontri realmente forniti.

Con pochi dati, S07 produce una conclusione limitata e propone come ottenere l'evidenza mancante. Non deve trasformare «dati insufficienti» in approvazione automatica di una rinomina o di un nuovo strumento.

## 7. Investimenti rinviati e condizioni per riaprirli

| Investimento | Quando riaprirlo |
|---|---|
| Nuovo nome e dominio | Prove mostrano un problema di comprensione/memoria o una direzione incompatibile; shortlist verificata e migrazione studiata separatamente |
| Passaggio dei voti dal tool al diario | Utilità confermata e contratto esplicito per conservazione, destinazione materia, duplicati e cambio account |
| Nuove guide/pagine prodotto | Esiste una domanda distinta con contenuto proprio, non una variante della stessa keyword |
| Inserimento massivo e arrotondamento configurabile | Una prova identifica un bisogno maggiore degli esempi e della precisione spiegata |
| Widget, campagne e contatti esterni | Primo rilascio stabile e materiale concreto da proporre; autorizzazione specifica per spese e contatti |
| AI, nuovi sistemi di voto e restyling complessivo | Programmi dedicati, con verifiche proprie; non dipendenze per migliorare la query iniziale |
| Analytics comportamentali | Finalità e dati minimi definiti; Search Console e osservazioni qualitative non bastano per la domanda specifica |

## 8. Cosa è stato fatto in questa preparazione

Creati questo piano e i prompt; aggiunto il collegamento nell'indice. Nessuna verifica remota nuova, implementazione, pubblicazione o sessione aperta. I risultati dei controlli documentali vengono riportati nella risposta di consegna; S01 inaugura il registro operativo con evidenze nuove.
