# Audit specialistico UX/UI iPagell — 1 ottobre 2026

Ambito: lettura del codice. Nessuna sessione browser o prova fisica; il parent esegue QA visiva. Nessuna modifica al checkout. Fonti lette: AGENTS.md, docs/REPO-SNAPSHOT.md, ARCHITECTURE-CURRENT.md, VERIFICATION-MATRIX.md, IPAGELL-PRODUCT-UX-UI-MASTER-PLAN.md; components/landing-content.tsx, account-gate.tsx, diary-empty-state.tsx, ipagell-app.tsx (ingresso, shell, Home, nav); app/marketing-page.module.css, globals-new.css; catalogo it.json; route app e legacy-entry-redirect.

## Conclusione di prodotto

L'identità viola esistente è già adatta e il software ha già ridotto ombre, decorazioni e card equivalenti. Il principale difetto all'ingresso è che viene descritto un insieme di funzioni senza spiegare abbastanza rapidamente il percorso e la condizione d'uso. La UI promette un diario, ma il nuovo utente incontra un account username/password, un codice da conservare e un form di semestre prima del primo risultato.

La prima patch deve aiutare a capire: “È un diario scolastico personale per studenti; registra voti da 1 a 6, organizza compiti/verifiche e appunti; le classi sono facoltative”. Per il vantaggio mostrare una conseguenza leggibile: “Sai cosa preparare e come sta andando ogni materia”. Non aggiungere promesse AI/OCR/push, scale diverse o integrazioni scolastiche non implementate.

## Interventi immediati consigliati

### UX-01 — Primo viewport e CTA

Evidenza: titolo attuale “Voti e scadenze, nel tuo diario.”, lead elenca voti/assenze/compiti/verifiche. Appunti non citati; target studente non esplicito; scala supportata solo nell'anteprima. CTA principale è corretta “Crea il tuo diario”; accesso duplicato header + hero compete su mobile.

Proposta: eyebrow breve “Il diario scolastico personale”; H1 descrittivo con beneficio, lead 2 frasi concrete; nota sotto CTA “Voti da 1 a 6 · Diario personale · Classi facoltative”. CTA principale unica; accesso nel header e link discreto nel hero. Rendere il link calcolatore sans account una seconda azione evidente ma subordinata (es. testo dopo nota).

Per mobile, ridurre padding hero (58px sopra e 80px sotto) e gap preview (58px), dimensione titolo eccessiva per un messaggio più descrittivo. Accettazione: a 390px l'utente vede target, funzione e azione principale nel primo viewport; a 320px nessun clipping/overflow. Non promettere che la preview entra interamente nel primo viewport.

### UX-02 — Tre passi verso il primo valore

Evidenza: stylesheet contiene stepsSection/steps, ma LandingContent non monta alcun percorso. Il codice attuale registra account, recovery code, poi onRegister crea diario; Home guida alla prima attività/materia.

Proposta: sezione corta “Come iniziare”: 1 Crea account e conserva il codice; 2 Prepara diario e aggiungi materie; 3 Registra un voto o una scadenza. Non dire “In 30 secondi” senza prova. Un piccolo diagramma leggibile di passi fornisce certezza migliore di altre feature card.

### UX-03 — Appunti e confine personale/classe

Evidenza: landing ha 3 card Voti/Agenda/Classi; Appunti è una capacità corrente importante. Privacy FAQ dice “la classe vede solo le attività condivise”, ma esistono anche appunti di classe condivisi esplicitamente. “Voti, assenze e note: solo tuoi” è troppo assoluto senza precisare note personali.

Proposta: 4 card concise Voti e media / Agenda scolastica / Appunti per materia / Classi private. Testo privacy “Voti e assenze restano personali. Le classi vedono solo attività e appunti che vengono condivisi nello spazio classe”. Distinguere chiaramente le note personali dalle copie pubblicate. Verificare col codice e specialista prodotto prima di affermare visibilità più ampia.

### UX-04 — Form di accesso e orientamento

Evidenza: AccountGate ha brand non linkato, selettore lingua e solo titolo; nessun ritorno alla landing e nessun breve raccordo al beneficio. Form già supporta autocomplete, minLength/passwordHint, fieldset busy e error role=alert. Errori schema sono generici e non associati al campo. Non esistono Google/Apple/email.

Patch pronta e contenuta: brand link a landing localizzata; piccolo testo distinto login/register/recover/onboarding; informazione esplicita “Oggi accedi con nome utente e password”; percorso a 3 stadi Account / Sicurezza / Diario, con stadio corrente testo aria-current. Un singolo CTA dominante; cambio mode discreto.

Non aggiungere pulsanti Google/Apple/email finti, disabilitati o “presto disponibili”. Presentarli nel piano autenticazione separato finché il backend manca. Estensione futura: errori inline con aria-invalid/aria-describedby e focus primo campo errato, toggle password con nome accessibile, preservare stato invito durante auth.

### UX-05 — Setup minimo progressivo

Evidenza: il nuovo utente autenticato deve compilare nome, primo periodo, anno scolastico, inizio, fine, preset materie; scuola è già in details opzionale. Valori di default anno scolastico assumono anno corrente agosto-luglio, date 24 agosto e 31 gennaio.

Proposta pianificata: chiedere nome e scelta iniziale materie; raccogliere periodo/anno/date sotto “Personalizza il periodo”, con default trasparenti e modificabili; mantenere stessi payload. Non occultare semplicemente campi required senza preservarne i valori nel form. Mostrare prima “Puoi modificarlo nelle impostazioni”. Preservare username/login legacy. Accettazione: primo diario creato con setup default, personalizzazione completa tuttora disponibile, nessun cambio calcoli/scala dati.

## Identità visiva raccomandata

Conservare viola #6655e6 (CTA, selezione), inchiostro #171a2a, sfondo neutro #f2f4f9, superfici bianche; niente nuove gradienti o palette con molti accenti. In tema scuro accent può allinearsi al primary esistente #8372f3. Colori materia soltanto punto/bordo/etichetta; voto insufficiente sempre anche valore e testo, errore sempre spiegato.

Gerarchia: H1 chiaro, lead 17–20px, corpo almeno 15–16px, helper leggibili 13–14px; preview può essere compact ma non affidare informazioni indispensabili a 11px. Radius 10px controlli, 16px contenitori; niente nuove ombre decorative. Spaziature una sequenza breve 8/12/16/24/32/48. Landing e account condividono font/token/focus, pur con densità diverse.

## Accessibilità verificabile dal sorgente

Calcolo locale contrasto via formula luminanza relativa (nessuna prova browser):

| Coppia | Rapporto | Implicazione |
|---|---:|---|
| preview .miniLabel #a7a9bb su averageCard #fff | 2,32:1 | Testo piccolo difficile da leggere |
| preview #858798 su bianco | 3,55:1 | Testo 11px insufficientemente contrastato |
| app subtle #6f7387 su bianco | 4,69:1 | Mantiene contrasto per corpo piccolo |
| marketing muted #696c7d su #fbfbfd | 5,03:1 | Buona base |
| accent #6655e6 su bianco | 5,24:1 | Mantiene CTA chiara |
| danger #dd4f62 su bianco | 3,91:1 | Insufficiente per testo errore piccolo |
| dark primary #8372f3 su #191b26 | 4,62:1 | Utile per testo accento |
| dark accent #6655e6 su #191b26 | 3,27:1 | Token accent non sovrascritto in dark |

Patch accessibile: miniLabel in averageCard colore marketing-muted; caption/metadati preview più scuri; accent dark allineato primary; token dedicato error text oppure danger più scuro in light e versione leggibile dark. Verificare colore per stato non come unico indicatore. Il focus globale esiste in globals-new.css; non duplicare inutile sistema. CTA header 43px può salire a 44px. language-select ha 2rem: per uso touch allineare 44px senza comprimere header a 320px. Movimento ridotto esiste ma hover primaryCta transform rimane: eliminare transform in prefers-reduced-motion.

## App quotidiana: preservare e migliorare con cicli

Home già mostra prossima attività, arretrati, futuro, riepilogo voti senza metriche zero; ritorno alla singola attività in Agenda esiste. Non riprogettare ciò che il Master Plan propone come se fosse assente.

Rischio attuale: Home sempre monta una card Appunti con CTA primaria Nuovo appunto anche quando il diario non ha materie/attività/voti. Lo stato emptyDiary non conta appunti. Pianificare domanda di primo valore più chiara; guidare prima Aggiungi materia quando serve, appunti secondari fino a una materia disponibile. Non cambiare oggi emptyDiary senza verificare significato e contesto dati.

Navigazione ha 5 voci; Appunti accessibile da Home, Agenda e materia in Voti. Preservare nav compatta; valutare test 5-secondi per trovare appunti senza allargarla. Statistiche restano sotto Voti.

Semestre è selezionato nella topbar e nell'account-toolbar: responsive li alterna? Verificare CSS/browser prima di eliminare. Stato “Diario personale salvato nell'account” ha valore di fiducia ma non deve dominare; conserva evidenza distinta per offline/errore/conflict/expired. Non usare unico “Tutto salvato” perché note/classi hanno percorsi separati.

Cicli seguenti: Home vuota e invito classe; Agenda con giorno/origine leggibile; Voti con materia/periodo, tipologia/peso e progresso; Classi con contenuti prima di amministrazione; Appunti con personal/shared e salvataggio; infine Assenze/Statistiche/Impostazioni. Per ciascuno dataset zero/poco/denso, dark/light, mobile/desktop, tastiera e testo 200%.

## Rapporto con Master Plan esistente

Documento è esplicitamente piano, non stato software; rispettare questa distinzione. Principi ancora validi: diario privato/classe, primo valore, palette sobria, niente funzioni inventate, cicli piccoli e QA reale. Divergenze: mappa non include Appunti attuali; sezioni login non includono email/Google/Apple come futuro standard richiesto; Home/Agenda/navigazione hanno già miglioramenti dei cicli e conservazione contesto; landing/calcolatore pubblico e i18n hanno entry point più ampi. Meglio aggiungere delta datato con tabella già presente / intervento prossimo / solo pianificato e roadmap autenticazione che riscrivere tutte le 11 fasi.

## Gate di rilascio prima patch

1. Cataloghi it/de/fr/en coerenti e controllo i18n.
2. Landing reale desktop 1440 e mobile 390/320: primo viewport comprensibile, CTA, overflow, dettagli FAQ, lingua.
3. Login/register/recovery/onboarding: ritorno landing, no funzionalità auth promesse assenti, mode e signup attuali continuano.
4. Navigazione tastiera/focus/label; testo ingrandito; light/dark account/app; reduced motion landing.
5. Build e check repository. Regressione auth importante: journey sintetico account nuovo, codice, setup, prima materia/voto/agenda, logout/login; invito non perso.
6. Dopo deploy produzione: homepage canonica, localized, app noindex e CTA effettive. Non dichiarare verifiche fisiche iOS/Android da screenshot desktop.

## Decisione integrativa del parent e roadmap residua

Il parent ha scelto di implementare nel task la prima tranche: landing con 4 card Voti/Agenda/Appunti/Classi, scala 1–6 esplicita, 3 passi; helper e progress di autenticazione; configurazione avanzata del diario in details e preset basic esplicito di default; Home vuota con frase del primo valore; contrasto accent dark e preview. Le sezioni sopra descrivono la situazione ispezionata inizialmente e il razionale, non certificano la patch ancora in corso. Non serve implementare oggi una riprogettazione integrale.

Roadmap residua per lavoro successivo:

- **Autenticazione standard**: analisi backend separata per email verificata, Google, Apple, collegamento account esistenti e recupero. UI comune “Continua con Google / Apple / email” solo dopo configurazione reale provider; mantenere ingresso legacy username e dati utente. Flusso invito preservato; prova account nuovo, account esistente, email uguale fra provider, annullamento callback, provider errore e revoca. Il dettaglio protocollo è responsabilità dell'audit auth.
- **Home**: primo valore contestuale a dati reali; evitare CTA nuova nota senza materia disponibile; distinguere diario senza agenda/voti e account che usa soprattutto appunti; test zero/denso e ritorno al contesto. Preservare attuale ordinamento prossima attività/arretrati e assenza di medie inventate.
- **Agenda/Voti**: una domanda e una CTA primaria per vista; calendario/lista e filtri secondari; origine classe chiara; materia e periodo conservati nei form; pesi spiegati vicino alla scelta; statistiche progressive. Non cambiare formule o sincronizzazione per finalità estetiche.
- **Classi/Appunti**: contenuti e beneficio prima di gestione membri/ruoli/inviti; separazione personale/condiviso evidente; bozza privata e anteprima/conferma restano; CTA Appunti facile da trovare con nav a 5 voci; versioni locali/account sempre distinte.
- **Coerenza globale**: allineamento token e stili form/dialog/empty state; riduzione CSS storico per componenti dopo QA, non cancellazione indiscriminata delle override; Assenze/Statistiche/Impostazioni ereditano grammatica di prima tranche.
- **Accessibilità e device**: contrasto error text, target select lingua, 200%, focus error field, tastiera virtuale/editor note/PWA/export su iOS/Android fisici. Non attribuire prova dispositivo fisico al task odierno.

Il deliverable raccomandato per nuova fase è un backlog con priorità/evidenza/criterio di accettazione e file probabili, più un registro verifiche per ogni ciclo. Il documento Master Plan va aggiornato come delta datato del lavoro reale, separando implementato, verificato, pianificato e dipendente da credenziali/provider esterni.
