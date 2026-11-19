# Prompt pronti per le sessioni di posizionamento

**Preparati il 15 ottobre 2026. Nessuno dei prompt è stato eseguito.**

[Direzione e dipendenze](PLAN.md) · [Indice](../README.md)

Apri una chat nel progetto iPagell e incolla un prompt alla volta. Ogni prompt richiede di leggere il piano e il contratto comune, così il contesto rimane disponibile anche senza la cronologia di questa analisi. Le sessioni non partono automaticamente. Usa i modelli e le impostazioni già scelti: il programma non impone cambi.

## S01 — diagnosi aggiornata e baseline

```text
Avvia soltanto S01 del programma docs/posizionamento-2026-10-15/PLAN.md.
Leggi AGENTS.md, docs/REPO-SNAPSHOT.md, docs/ARCHITECTURE-CURRENT.md,
docs/VERIFICATION-MATRIX.md, il piano e le due analisi di SEO e prodotto del
10 ottobre. Applica il contratto comune del piano e preserva il checkout.

Aggiorna la diagnosi in sola lettura: verifica le otto route pubbliche,
HTML iniziale, status, title/description, canonical/hreflang, lingua,
robots/sitemap, noindex di /app e redirect degli alias con query.
Confronta il codice corrente con le osservazioni datate; separa produzione,
checkout e risultati del motore di ricerca disponibile. Cerca il dominio,
il marchio e la query iniziale; non dichiarare posizioni Google personali
o volumi se non li hai misurati.

Se Search Console è accessibile con l'account del proprietario, leggi stato
URL del calcolatore e home, ultima scansione, canonical Google e sitemap,
più dati query/pagine utili disponibili. Non inviare sitemap, richiedere
indicizzazione o cambiare DNS/proprietà. Se non è accessibile, prepara una
richiesta precisa dei soli dati mancanti e completa gli altri controlli.

Crea docs/posizionamento-2026-10-15/BASELINE.md e PROGRESS.md con evidenze
datate, limiti e classificazione: scoperta, indicizzazione, ranking oppure
causa non determinata. Indica quali interventi hanno una prova a sostegno.
Niente codice, installazioni, analytics o deploy. Verifica documenti e
whitespace dei file toccati; consegna l'esito e la dipendenza residua per S02.
```

## S02 — promessa del prodotto, copy e prova del nome

```text
Avvia soltanto S02 di docs/posizionamento-2026-10-15/PLAN.md.
Leggi AGENTS.md, snapshot, architettura, piano, PROGRESS.md e BASELINE.md
se presenti, oltre alle analisi SEO e prodotto del 10 ottobre. Applica il
contratto comune. Se S01 non è documentata, completa prima la sua baseline;
l'accesso mancante a Search Console non impedisce il lavoro editoriale.

Prepara un brief operativo di una pagina: iPagell come marchio di lavoro,
diario scolastico personale come categoria, scala 1–6 come perimetro reale,
calcolatore come ingresso e voti/agenda/appunti come utilità del diario.
Usa la Svizzera italiana come ipotesi da verificare, non mercato dimostrato.
Non assumere una rinomina, AI o nuovi sistemi di voto.

Definisci il copy pronto per S03 e S04: metadata distinti dalla UI del tool,
H1/intro, esempi semplice/ponderato, precisione e limiti, poche FAQ pertinenti,
link dalla home e CTA onesta verso il diario. Prepara proposte nelle quattro
lingue e segnala la revisione umana eventualmente mancante. Verifica ogni
claim nel codice e ogni esempio aritmetico. Nessun mockup o restyling richiesto.

Prepara anche un kit di ricerca del nome e della promessa: scenario,
domande non suggestive, prova di pronuncia/scrittura/ricordo, confronto fra
iPagell con descrittore e 2–3 direzioni alternative, scheda risposte vuota
e criteri di decisione. I nomi creativi non sono disponibili per definizione.
Non contattare persone né inventare risposte.

Salva BRIEF-COPY.md e NAMING-TEST.md nella cartella del programma e aggiorna
PROGRESS.md. Concludi con il copy consigliato e le questioni aperte che
impediscono soltanto le decisioni dipendenti. Nessun codice o deploy.
Esegui i controlli documentali pertinenti.
```

## S03 — implementazione mirata del calcolatore

```text
Avvia soltanto S03 di docs/posizionamento-2026-10-15/PLAN.md.
Leggi AGENTS.md, snapshot, architettura, matrice, piano, PROGRESS.md e
BRIEF-COPY.md. Se manca il brief di S02, preparalo prima senza indovinare
decisioni già richieste al proprietario. Applica il contratto comune,
la skill locale apple-design e la skill Sites per l'implementazione.

Implementa il miglioramento editoriale/SEO del calcolatore esistente
nelle quattro lingue. Rileggi public-page.ts, cataloghi, route del tool,
GradeAverageCalculator, CSS, helper e test pertinenti prima di modificarli.
Separa i metadata da H1/intro con chiavi dedicate; rendi espliciti scala e
pesi, aggiungi esempi corretti, spiegazione di un decimale e poche FAQ.
Mantieni il form immediato e il calcolo locale senza account.

Conserva URL, canonical/hreflang, parsing 4,5 / 4.5 / 4-5, pesi positivi,
formule e precisione esistenti. Non aggiungere salvataggio, esempi che
sovrascrivono input, simulatore, API o trasferimento al diario in questa
sessione. Non aggiungere schema o librerie senza un bisogno concreto.

Aggiorna le verifiche metadata in tests/grade-average-calculator.test.ts
e quelle pubbliche realmente interessate; non creare test che controllano
soltanto frasi esatte di marketing. Prova tastiera/focus, mobile 320/390 px,
desktop, temi, lingue e contenuti presenti nell'HTML prima dell'interazione.
Esegui npm run check e aggiorna documentazione tecnica se resa obsoleta.

Registra modifiche, verifiche, screenshot disponibili e limiti in PROGRESS.md.
Completa la modifica locale senza chiedere una seconda approvazione per
scelte di copy reversibili già comprese nel brief. Nessun deploy.
```

## S04 — rendere il tool facile da trovare e il diario comprensibile

```text
Avvia soltanto S04 di docs/posizionamento-2026-10-15/PLAN.md.
Leggi AGENTS.md, snapshot, architettura, piano, PROGRESS.md e BRIEF-COPY.md.
Verifica che S03 sia completata; applica contratto comune, apple-design
e skill Sites. Osserva prima la landing corrente e leggi componente/CSS.

Integra un ingresso al calcolatore vicino alle azioni iniziali, con testo
riconoscibile e URL localizzato, mantenendo registrazione e accesso chiari.
La collocazione precisa va adattata alla pagina corrente, senza duplicare
CTA ovunque o peggiorare la navigazione mobile. Preserva il link nella
sezione Voti se resta utile. Esplicita la categoria di diario scolastico
personale con il minimo copy necessario: il contenuto attuale già descrive
agenda e appunti, quindi evita una riscrittura completa.

Allinea il passaggio tool→diario alla capacità reale: registrazione di
voti per materia nel diario, senza promessa di conservare automaticamente
quelli del calcolatore. Nessuna rinomina, modifica del logo, nuova pagina
strumenti vuota, nuovo sistema di voti o restyling generale.

Localizza nelle quattro lingue e verifica link HTML, primo calcolo senza
account, ritorno alla home, CTA e lingua in registrazione senza creare
account reali. Prova tastiera, focus, 320/390 px e desktop, temi e testi
lunghi. Esegui i controlli mirati pertinenti e check:i18n/docs:check;
la preparazione completa del candidato è S05.

Aggiorna PROGRESS.md con file effettivi, prove e limiti. Nessun deploy.
```

## S05 — candidato di rilascio verificato

```text
Avvia soltanto S05 di docs/posizionamento-2026-10-15/PLAN.md.
Leggi AGENTS.md, snapshot, architettura, matrice, piano, PROGRESS.md e
docs/DEPLOYMENT.md. Applica contratto comune e skill Sites; usa apple-design
per eventuali correzioni UI. Non pubblicare in questa sessione.

Verifica S03/S04 e identifica il sorgente esatto da rilasciare: il checkout
contiene lavoro pregresso, quindi non includerlo automaticamente. Confronta
il candidato con il sorgente Sites attuale se leggibile, conserva i
rilasci intervenuti e prepara una copia isolata quando necessaria. Non
fare reset o scartare modifiche per ottenere una directory pulita.

Esegui npm run release:prepare sul candidato. Verifica la build compilata
delle otto route: HTML iniziale, metadata, canonical/hreflang, robots,
sitemap, noindex privato, alias, calcolo e percorso home→tool→diario.
Copri 320/390 px e desktop, temi, tastiera, quattro lingue e movimento
ridotto. Non usare dati personali né creare account di produzione.
Correggi regressioni nel perimetro e ripeti soltanto i controlli invalidati.

Consegna RELEASE-CANDIDATE.md nella cartella del programma: perimetro
dei file, riferimento/impronta sorgente e lockfile, build verificata,
esiti, limiti, confronto con il rilascio da preservare, istruzioni di
pubblicazione e ripristino. Aggiorna PROGRESS.md. Se sorgente o controlli
non sono qualificati, spiega il lavoro residuo senza dichiarare pronto
il rilascio. Non aggirare controlli o mescolare lavoro estraneo.
```

## S06 — pubblicazione esplicita del candidato

**Usa questo prompt quando vuoi pubblicare.** Il testo è l'istruzione di deploy; prepararlo nel documento non lo esegue.

```text
Pubblica in produzione il candidato SEO/posizionamento verificato da S05.
Leggi AGENTS.md, docs/DEPLOYMENT.md, docs/posizionamento-2026-10-15/PLAN.md,
PROGRESS.md e RELEASE-CANDIDATE.md. Applica la skill Sites.

Verifica che il candidato corrisponda ancora al sorgente qualificato e
che il rilascio Sites corrente non contenga aggiornamenti da perdere.
Se qualcosa è cambiato, riconcilia il perimetro autorizzato e completa
i controlli resi necessari prima del deploy, preservando lavoro estraneo.
Non ripetere tutte le verifiche se candidato e ambiente restano validi.

Usa soltanto il progetto esistente in .openai/hosting.json. Prima della
pubblicazione verifica sito, accesso e domini; preserva database, binding,
domini e account. La produzione è https://ipagell.website. Non usare il
Worker sandbox o configurare una nuova pubblicazione.

Completa il flusso Sites, attendi l'esito verificabile e controlla poi
risposte e contenuti pubblici delle route interessate, robots/sitemap,
redirect e noindex dell'area personale. Non dichiarare successo dopo
una sola build o push. Non inviare sitemap o richieste Search Console
senza un'istruzione specifica.

Registra versione/sorgente/deployment ed esito nei documenti previsti
dal repository e nel PROGRESS.md del programma. Riporta cosa è online
e gli eventuali limiti, senza confondere pubblicazione e indicizzazione.
```

## S07 — risultati reali e decisione sul prossimo investimento

```text
Avvia soltanto S07 di docs/posizionamento-2026-10-15/PLAN.md.
Leggi piano, PROGRESS.md, BASELINE.md, eventuale RELEASE-CANDIDATE.md,
BRIEF-COPY.md e NAMING-TEST.md. Applica il contratto comune.

Analizza il periodo successivo al rilascio usando soltanto dati reali
accessibili o forniti dal proprietario: indicizzazione, canonical Google,
impression/clic/query/pagine per paese e dispositivo e riscontri degli
studenti sul nome e sull'utilità del prodotto. Dichiara date, ampiezza
del campione e differenze fra periodi. Non inventare volumi, conversioni,
retention o causalità del rilascio. Nessun nuovo analytics o contatto.

Se i dati non sono disponibili, consegna l'elenco minimo da raccogliere
e una conclusione limitata; continua l'analisi delle evidenze presenti.
Non trattare il mancato accesso come mancata indicizzazione o assenza
di domanda. Non classificare il nome come vincente da preferenze isolate.

Salva RESULTS.md nella cartella del programma e aggiorna PROGRESS.md.
Formula una decisione motivata: consolidare il tool, chiarire la promessa,
avviare S08, approfondire il nome oppure raccogliere altra evidenza.
Per la rinomina identifica il problema osservato e il progetto separato
necessario; non cambiare marchio/dominio. Nessun codice o deploy.
```

## S08 — incremento opzionale: che voto mi serve?

Questo è il primo candidato a una nuova utilità dopo il ciclo iniziale. Avviarlo non è necessario per pubblicare S03/S04 e non è automaticamente raccomandato in assenza di dati.

```text
Avvia S08 di docs/posizionamento-2026-10-15/PLAN.md: implementa un simulatore
pubblico del prossimo voto integrato nella pagina del calcolatore, senza
nuove route. Leggi AGENTS.md, snapshot, architettura, matrice, piano,
PROGRESS.md e risultati precedenti se presenti. Applica contratto comune,
apple-design e skill Sites. Nessun deploy in questa sessione.

Rileggi prima lib/calculations.ts, lib/grading.ts, helper/calcolatore e
simulatore privato dentro components/ipagell-app.tsx. Definisci un contratto
per voti con pesi espliciti, obiettivo e peso della prossima prova.
Non introdurre tipi di prova o coefficienti della materia nel tool pubblico.

Usa la relazione x = (T × (W + w) - S) / w, con S somma dei punti pesati,
W somma dei pesi attuali, w peso futuro positivo e T media obiettivo.
Mostra il requisito matematico e distingui il suo eventuale arrotondamento
verso l'alto per una soglia utilizzabile: non arrotondare alla media più
vicina suggerendo che un voto inferiore basti. Tratta esplicitamente
lista vuota, input invalidi, risultato oltre 6 e obiettivo garantito già
con il voto minimo. Proteggi pesi estremi e risultati non finiti.

Esempi di accettazione: 4 e 5 di peso 1, target 5 e prossimo peso 1 → 6;
gli stessi voti con prossimo peso 2 → 5,5; target 6 con prossimo peso 1
→ 9, quindi non raggiungibile con una sola prova nella scala. Definisci
e verifica il comportamento al confine senza cambiare formule del diario.

Mantieni tool locale, senza salvataggio o account, spiegazione del metodo,
quattro lingue e nessuna promessa di voto ufficiale. Implementa test di
dominio sui casi limite, prova browser/tastiera/mobile e npm run check.
Aggiorna PROGRESS.md e documentazione coinvolta. Il rilascio richiederà
un nuovo candidato verificato e una successiva istruzione di pubblicazione.
```
