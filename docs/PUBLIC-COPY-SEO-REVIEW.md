# Revisione copy pubblico, UX writing e SEO

**Data:** 21 ottobre 2026. **Perimetro:** codice locale di iPagell; quattro sezioni pubbliche in italiano, tedesco, francese e inglese, ingresso account e offerta di installazione. Nessun commit o deploy richiesto.

## 1. Valutazione iniziale e metodo

La base funzionale è più precisa della sua presentazione. I testi iniziali alternano descrizioni utili e slogan: il primo schermo non identifica chiaramente un diario scolastico, due strumenti senza account hanno titoli astratti e la pagina di approfondimento ripete la stessa promessa della home. Il recente richiamo alla Svizzera rende riconoscibile il pubblico, ma l’elenco di quattro cantoni non corrisponde a funzioni cantonali. La localizzazione francese alterna tu/vous e confonde appunti, voti e corsi; quella tedesca alterna nomi diversi del diario.

Audit eseguito prima delle modifiche ai contenuti. Letti AGENTS.md, snapshot, architettura, matrice di verifica, documentazione pubblica/i18n e codice delle route, provider, componenti pubblici, account, installazione, appunti e calcolo. Inventariate 230 chiavi esplicitamente richiamate nei componenti/metadati esaminati, incluse etichette comuni; analizzate le corrispondenti varianti nei quattro cataloghi. Inclusi titoli/descrizioni, navigazione, pulsanti, FAQ, errori, salvataggio, esportazione, installazione, metadata e testi del ciclo account. Esaminati anche i dodici testi del componente editor condiviso (toolbar, limite, incolla e formattazione). Le chiavi del solo workspace autenticato non sono oggetto di una revisione generale.

Due letture separate, una linguistica e una fattuale/SEO, hanno contestato il contenuto esistente. La verifica finale distingue giudizi editoriali, comportamento del codice, prove eseguite e questioni esterne non misurate. Il sito pubblicato non è usato per dedurre le funzioni del checkout.

### Fatti del prodotto verificati

| Superficie | Disponibile nel codice | Limiti e accesso | Fonti locali |
|---|---|---|---|
| Homepage | Presentazione e collegamenti a diario, appunti, media, accesso | Nessun account per leggere; utenti già autenticati reindirizzati al diario | `components/public-overview.tsx`, `app/page.tsx`, `app/[locale]/page.tsx` |
| Diario | Materie/periodi, voti e pesi, agenda, assenze, statistiche, appunti multipli; classi private e inviti | Account per usare il diario; dati personali separati dallo spazio classe; pubblicazione appunti della classe con conferma | `components/ipagell-app.tsx`, `components/landing-content.tsx`, viste Voti/Agenda/Classi/Appunti |
| Appunti pubblici | Un appunto con titolo/argomento, titoli di sezione, elenchi, grassetto, anteprima, PDF e Markdown | Una sola bozza nel browser, separata dall’account; niente trasferimento automatico al diario; fallback temporaneo. Contenuto serializzato fino a 20.000 code point; titolo/argomento fino a 120 caratteri | `components/public-notes.tsx`, `lib/public-notes.ts`, `components/note-editor.tsx`, `lib/notes/format.ts` |
| Calcolatore | Media aritmetica ponderata, pesi positivi, peso predefinito 1, aggiunta/rimozione voti | Scala 1–6, 6 migliore; visualizzazione a un decimale; valori nella sessionStorage della scheda; nessun tipo di prova, coefficiente materia o regolamento cantonale | `components/grade-average-calculator.tsx`, `lib/grade-average-calculator.ts`, `lib/grading.ts`, `lib/calculations.ts` |
| Account | Nome utente/password, codice recupero e setup diario | Nessun accesso Google/Apple/email implementato; conservare il codice è necessario per recuperare l’accesso se si perde la password | `components/account-gate.tsx`, `lib/auth-validation.ts`, API auth |
| Lingue | it/de/fr/en, URL pubblici propri e selettore | Cambiare lingua non cambia scala, dati o regole. Nessun romancio | `lib/i18n/locale.ts`, `lib/i18n/public-routes.ts`, `components/i18n-provider.tsx` |
| Installazione/offline | Offerta secondo browser; diario già disponibile sul dispositivo consultabile offline | Nessuna promessa universale di installazione o funzionamento offline al primo accesso | `components/install-app.tsx`, `lib/install-app.ts`, `public/sw.js` |

Studio AI, OCR, trascrizione delle lezioni, upload di materiali, chat, co-scrittura, push ad app chiusa e altre scale non sono funzioni offerte dalle pagine pubbliche. I laboratori separati non giustificano promesse nel copy.

## 2. Problemi editoriali e scelte

La tabella registra testo iniziale, funzione, problema e decisione editoriale. Il testo effettivo del checkout prima della revisione è il riferimento del confronto, incluse le aggiunte del precedente intervento svizzero.

| Testo iniziale / chiave | Funzione | Problema reale | Scelta e motivazione |
|---|---|---|---|
| «Fai spazio alle tue idee.» (`public.homeTitle`) | H1 home | Intercambiabile con editor, cloud o app creativa; non identifica il prodotto | «Il tuo diario scolastico.»: categoria immediata, senza promessa emotiva |
| «Appunti da ritrovare… uno spazio personale pensato…» | Introduzione home | Elenco suggestivo senza spiegare diario/account | Descrivere agenda, voti 1–6, appunti e due strumenti senza account |
| «Apri il tuo foglio» | Link primario agli appunti | Oggetto metaforico e destinazione poco chiara | «Apri gli appunti»: azione e destinazione coincidono |
| «Il tuo spazio, senza account · PDF & Markdown» sotto hero | Nota introduttiva | Ripete introduzione, scheda appunti ed etichetta strumenti | Eliminare dalla home; conservare «Senza account» negli strumenti |
| «Il resto trova il suo posto.» (`public.diaryCard`) | Titolo copertina e H1 diario | Nessun significato fuori contesto; unica chiave per due funzioni | H1 «Il diario scolastico di iPagell»; titolo copertina dedicato riferito all’agenda mostrata |
| «Un foglio. Le tue idee.» | Scheda appunti | Non nomina lo strumento | «Appunti online», con formato/esportazione nella descrizione |
| «Scrivi, metti in ordine, porta con te.» | Descrizione appunti | Tre benefici generici prima dei dettagli utili | Un appunto con titoli, elenchi e grassetto; PDF/Markdown reali |
| «Dai un senso ai numeri.» | Scheda media | Non descrive il calcolo | «Calcolo della media», poi voti e pesi |
| «Voti e pesi, un risultato chiaro.» | Introduzione calcolo | Autovalutazione della chiarezza | Descrivere inserimento voti 1–6, pesi e aggiornamento della media |
| «Il tuo cantone. La tua scuola.» + Ticino/Grigioni/Vaud/Zurigo | Contesto svizzero | Cantoni senza contenuti distintivi; può suggerire configurazioni assenti | Spiegare scala, direzione dei voti, personalizzazione e limite sui regolamenti; eliminare l’elenco geografico |
| «Condividi… scegliendo cosa resta tuo» | Descrizione diario | Suggerisce privacy configurabile per voti/assenze | Spiegare separazione fissa fra diario personale e spazio classe |
| Stessa descrizione diario nell’introduzione e invito account | Conversione home | Ripetizione quasi integrale | Testo account dedicato a persistenza, appunti multipli e accesso allo spazio classe |
| «Pronto per il prossimo giorno di scuola?» | Titolo prima della registrazione | Domanda retorica senza informazione | Dichiarare che il diario richiede un account |
| «Crea il tuo diario» → registrazione | CTA | Non anticipa il passaggio account | «Crea un account»; conservare la creazione del diario nel setup |
| «Ogni parte della scuola trova il suo posto.» | H2 funzioni diario | Ripete lo slogan home | «Le funzioni del diario», senza una seconda promessa |
| «Sai cosa preparare. E da dove partire.» | Titolo Agenda | Vago rispetto al contenuto mostrato | «Compiti e verifiche in agenda» |
| «Le medie, senza rifare i conti.» | Titolo Voti | Beneficio corretto ma poco descrittivo | «Voti, pesi e medie per materia» |
| «Dal primo appunto al ripasso.» | Titolo Appunti | Formula narrativa generica | «Appunti organizzati per materia» |
| «Guarda oltre l’ultimo voto.» / «Organizzatevi, insieme.» | Statistiche/Classi | Non specificano funzione o accesso | «Andamento dei voti» / «Classi private su invito» |
| Tab «Privacy» con contenuto anche di classe | Navigazione diario | Etichetta incompleta | «Classe e privacy»; avvio/FAQ espliciti nell’altra tab |
| «Un pensiero prende forma.» / «Uno spazio tranquillo…» | H1/intro appunti | Nessun compito identificato; beneficio emotivo | «Appunti online», un solo appunto, formattazione, export e salvataggio locale |
| «Il foglio resta qui. Il file viene con te.» | Informazione persistenza | Metafora prima del rischio concreto | «Salvataggio nel browser»; conservare la spiegazione accurata già presente |
| «Vuoi tenere tutto insieme?» | Collegamento al diario | Non spiega differenza/trasferimento | «Più appunti nel diario», account e assenza di trasferimento automatico |
| «Dai un titolo alla tua idea» / «Comincia da un pensiero…» | Placeholder editor | Tono creativo estraneo al compito | Titolo facoltativo / scrittura dell’appunto |
| «Nuovo foglio» / «Modalità del foglio» | Comandi editor | Terminologia oscillante appunto/foglio/spazio | Usare appunto, conservando conferma e recupero |
| «La bozza non è ancora al sicuro» | Errore prima di uscire | Formula emotiva, stato impreciso | «Modifiche non salvate»; conservare azioni di recupero |
| «Markdown» come pulsante | Export | Formato senza verbo; vicino a un’azione PDF esplicita | «Scarica Markdown» |
| Formula senza esempio e precisione non spiegata | Spiegazione media | Non chiarisce perché il risultato ha un solo decimale | Esempio 4,5/5,5 con peso 1/2, numeri formattati come il risultato reale; spiegare il decimale |
| «Apri iPagell» → registrazione dal calcolatore | CTA | Non anticipa creazione account | «Crea un account per il diario» |
| «Bastano un nome utente e una password» | Intro registrazione | Minimizza i passaggi recupero/setup e ripete un vantaggio vago | Spiegare uso del diario; lasciare istruzioni account e codice nei punti operativi |
| «iPagell, sempre a portata di tocco» | Offerta installazione | Slogan in un’istruzione di sistema | «Aggiungi iPagell alla schermata Home» |
| FR tu/vous; Cours/fiches/notes | Tutta l’esperienza pubblica | Registro e oggetti incoerenti | «vous»; notes=voti, notes de cours=appunti |
| DE Tagebuch/Planer/Schulplaner; Gewicht; Vergrößern | Diario/calcolo/immagini | Ambiguità categoria e terminologia; ortografia non CH | Schulplaner, Gewichtung, Vergrössern |
| Title appunti «…studenti in Svizzera» | SEO strumento | Geografia senza funzione specifica del tool | Dare priorità a appunti online + export PDF/Markdown; contesto scolastico nella home |
| Alt social costruito da vecchio titolo/lead | Open Graph | Testo non corrispondente all’immagine | Descrizione della composizione esistente, con dati dimostrativi |

### Parti da conservare

Restano validi: scala 1–6 e indipendenza dalla lingua; dati dimostrativi sulle immagini; etichette dei campi e formati di voto accettati; peso predefinito 1; errori che mantengono il testo e consentono retry/export; avvisi su bozza locale, conflitto fra schede e sostituzione della bozza; requisiti del codice recupero; FAQ sul registro ufficiale, privacy e uso senza account. Si correggono termini o registro dove necessario, non il loro significato. Nessuna nuova promessa AI, automatismo cantonale, gratuità perpetua, prestazione o sicurezza assoluta.

## 3. Posizionamento e intento per pagina

Le query seguenti sono **ipotesi editoriali**, non dati di domanda: non sono disponibili dati Search Console, volumi, difficoltà o posizioni. Fonti Google consultate per comportamento tecnico, non per stimare il mercato.

| Pagina / pubblico | Scopo e intento dominante | Query plausibili principali / secondarie | Informazione distintiva e collegamenti |
|---|---|---|---|
| Home — chi cerca un diario scolastico in Svizzera | Capire categoria, destinatari e accessi | diario scolastico online; diario scolastico Svizzera / agenda voti e appunti | Diario 1–6 e due strumenti senza account; introduce le tre destinazioni senza replicare il tour |
| Diario — chi valuta l’uso continuativo | Capire funzioni e requisiti prima dell’account | agenda scolastica online; diario voti per materia / agenda verifiche, appunti per materia, classe privata | Tour reale, separazione personale/classe, avvio e FAQ; collega calcolatore e registrazione |
| Media — chi deve fare un calcolo | Calcolare una media semplice o ponderata 1–6 | calcolo media voti Svizzera / media ponderata voti da 1 a 6, peso doppio | Calcolo subito disponibile, formula, esempio, precisione e limiti; link account esplicito |
| Appunti — chi deve scrivere/esportare | Usare un editor nel browser | appunti online / editor appunti PDF, esportare appunti Markdown | Un solo appunto, formattazione, bozza locale, export senza account; spiega differenza col diario |
| Account — chi ha scelto il diario | Creare credenziali/recuperare accesso | Nessun obiettivo di acquisizione organica | Area noindex; istruzioni operative e ritorno alla home |

Le varianti DE/FR/EN esprimono gli stessi intenti: **Schulplaner Schweiz / Notendurchschnitt berechnen / Online-Notizen**, **journal scolaire en Suisse / calcul de moyenne des notes / notes de cours en ligne**, **school planner Switzerland / Swiss grade average calculator / online notes PDF**. Non si aggiungono pagine cantonali né metadati per lingue inesistenti. L’inglese è una lingua disponibile, non una quarta lingua nazionale svizzera.

### Alternative considerate

- Home: «Agenda, voti e appunti» descrive i contenuti ma non la categoria; «Il tuo diario scolastico» identifica il prodotto, mentre intro e CTA chiariscono accesso e scala. Scelta la seconda.
- Diario: un altro slogan sul semestre non aiuta a confrontare le funzioni; titolo con nome della categoria e del prodotto, poi dettagli nel tour.
- Appunti: «Editor di appunti» è corretto ma meno diretto del nome del compito; «Appunti online» seguito da un solo appunto/export rende il limite immediato.
- Svizzera: elenco di cantoni scartato perché non esistono regole o preset dedicati; conservati sistema 1–6 e limite di applicazione.
- Calcolo: evitare aggiunta di guide autonome o una lunga spiegazione scolastica; un esempio accanto alla formula risolve una domanda concreta.

## 4. Interventi SEO tecnici

Audit iniziale: sedici URL pubblici, canonical propri, alternate reciproci generici e CH, sitemap coerente, host preview noindex, `/app` noindex, API escluse da robots, JSON-LD limitato a `WebSite`. Queste basi non richiedono una riscrittura.

Interventi effettuati sui problemi accertati:

1. I pannelli inattivi Radix inizialmente restituivano contenitori vuoti: Voti/Appunti, condivisione e FAQ richiedevano un clic per esistere. La prova SSR isolata sui componenti reali confermava il problema. Ora tutti i contenuti sono resi nell’HTML iniziale; i pannelli inattivi sono nascosti via CSS e la navigazione a schede resta operativa.
2. Il selettore lingua dalla home DE/FR/EN all’italiano usava `/it`, alias noindex con canonical `/`. Ora usa direttamente `/` tramite la mappa esistente.
3. Title/description distinti per home, diario, appunti e media. La descrizione SEO del diario ha una chiave dedicata; dal tool appunti sono stati rimossi riferimenti geografici senza utilità per il compito. Allineati nomi pagina, H1 e link.
4. Alt della preview social aggiornato con una descrizione della composizione reale e dei dati dimostrativi; immagine generica datata mantenuta come residuo dichiarato.
5. Separatore testuale fra le due righe dell’H1 home e nome accessibile completo: evita parole concatenate nel contenuto estratto. Una sola intestazione principale per pagina, sezioni H2 e dettagli H3.

Il rendering delle schede usa `forceMount` e selettori `data-state` nel solo componente pubblico. Non cambiano formule, autenticazione, payload, dati o comportamento dei comandi. Il selettore lingua cambia soltanto la destinazione pubblica dell’italiano da alias `/it` a canonical `/`; il percorso di compatibilità resta disponibile.

Non aggiungere FAQ schema, recensioni, offerte, keyword meta, pagine per cantone o nuovi sistemi di routing. Un title più pertinente non prova un aumento di ranking; title e snippet effettivi restano decisi dal motore di ricerca.

Fonti primarie consultate il 21 ottobre 2026: [title link](https://developers.google.com/search/docs/appearance/title-link), [snippet](https://developers.google.com/search/docs/appearance/snippet), [versioni localizzate](https://developers.google.com/search/docs/specialty/international/localized-versions), [contenuti caricati con JavaScript](https://developers.google.com/search/docs/crawling-indexing/javascript/lazy-loading).

## 5. Revisione avversariale

Le letture indipendenti hanno contestato anche la prima riscrittura: rimanevano «tu conserveras», «fiches» e «Tagebuch» in testi conservati; l’H1 aveva due righe senza separatore testuale; il limite di una bozza era troppo evidente soltanto nella conferma del nuovo appunto. Questi punti sono stati corretti. Migliorate anche la spiegazione operativa della formula in tedesco e la costruzione dell’esempio in francese.

Rubrica qualitativa finale, da 1 a 5. I punteggi sono giudizi editoriali, non misure scientifiche, prove di ranking o risultati di un test con utenti. Le dimensioni a 3 nella prima revisione (naturalezza di diario/account) hanno determinato ulteriori correzioni prima di assegnare il giudizio finale.

| Sezione | Chiarezza | Specificità iPagell | Fatti | Naturalezza | Utilità | Pertinenza SEO |
|---|---:|---:|---:|---:|---:|---:|
| Home: categoria e strumenti | 5 | 4 | 5 | 4 | 5 | 4 |
| Contesto svizzero | 5 | 5 | 5 | 4 | 5 | 4 |
| Diario: funzioni | 5 | 5 | 5 | 4 | 5 | 4 |
| Classe e privacy | 5 | 5 | 5 | 4 | 5 | 4 |
| Avvio e FAQ | 5 | 5 | 5 | 4 | 5 | 4 |
| Appunti: editor/salvataggio | 5 | 5 | 5 | 4 | 5 | 5 |
| Media: calcolo/formula/esempio | 5 | 5 | 5 | 4 | 5 | 5 |
| Account e recupero | 5 | 4 | 5 | 4 | 5 | 4 |
| Footer/installazione | 5 | 4 | 5 | 4 | 4 | 4 |

**Intercambiabilità.** «Appunti online» e «Calcolo della media» sono categorie condivise da altri strumenti: mantenerle è utile per riconoscere la destinazione. La specificità sta nei dettagli associati (una bozza locale, PDF/Markdown, scala 1–6, pesi, un decimale, account separato), non in un titolo artificialmente originale. I testi senza informazione propria sono stati eliminati, inclusa la nota duplicata sotto l’hero.

**Cinque secondi, simulazione editoriale.** Home: diario scolastico, pubblico svizzero, agenda/voti/appunti, tool senza account e destinazioni esplicite. Diario: categoria e separazione classe/personale prima del tour; CTA account. Appunti: compito, formattazione, export e località della bozza. Media: scala, ordine dei voti, pesi e accesso libero prima del form. Account: scelta delle credenziali e percorso account/recupero/diario. Nessuna osservazione su visitatori reali viene dedotta da questa lettura.

**Decisioni di sottrazione.** Nessun nuovo slogan, nessuna sezione testimonianze o numeri di utilizzo, nessun elenco di cantoni, nessuna promessa di aderenza a programmi/regolamenti, nessuna FAQ aggiunta per la sola SEO. Le informazioni tecniche utili restano accanto al compito; i dettagli del runtime restano in questo report.

### Principali formulazioni finali

Confronti testuali esatti per le parti più significative; la motivazione e la funzione sono nella tabella dell’audit.



| Chiave | Prima | Dopo |
|---|---|---|
| `public.homeTitle` | Fai spazio alle tue idee. | Il tuo diario scolastico. |
| `public.openNotes` | Apri il tuo foglio | Apri gli appunti |
| `public.diaryCard` | Il resto trova il suo posto. | Il diario scolastico di iPagell |
| `public.notesCard` | Un foglio. Le tue idee. | Appunti online |
| `public.averageCard` | Dai un senso ai numeri. | Calcolo della media |
| `public.notesTitle` | Un pensiero prende forma. | Appunti online |
| `public.localTitle` | Il foglio resta qui. Il file viene con te. | Salvataggio nel browser |
| `public.connectedTitle` | Vuoi tenere tutto insieme? | Più appunti nel diario |
| `public.leaveTitle` | La bozza non è ancora al sicuro | Modifiche non salvate |
| `landing.readyTitle` | Pronto per il prossimo giorno di scuola? | Il diario personale richiede un account |
| `landing.create` | Crea il tuo diario | Crea un account |
| `public.swissTitle` | Il tuo cantone. La tua scuola. | Voti nella scala svizzera 1–6 |
| `landing.feature1Title` | Le medie, senza rifare i conti. | Voti, pesi e medie per materia |
| `landing.feature4Title` | Dal primo appunto al ripasso. | Appunti organizzati per materia |
| `average.ctaLink` | Apri iPagell | Crea un account per il diario |
| `landing.metaTitle` | Diario scolastico per la Svizzera · voti da 1 a 6 | Diario scolastico online per la Svizzera |
| `public.notesMetaTitle` | Appunti online per studenti in Svizzera · PDF e Markdown | Appunti online con esportazione PDF e Markdown |

## 6. Verifiche eseguite

| Verifica effettivamente eseguita | Esito e perimetro |
|---|---|
| Audit iniziale | Sorgenti e quattro cataloghi letti; screenshot home e apertura diario prima delle modifiche. Audit linguistico e fattuale/SEO separati; 32 test mirati preliminari del revisore tecnico e prova SSR dei Tabs |
| `npm run check` finale | Superato: lint, TypeScript, **141 test**, **850 chiavi** complete/referenziate nelle quattro lingue, inventario e documentazione. Non sono state aggiunte prove che confrontano frasi letterali del copy |
| `npm run build` finale | Riuscita; precache generata con **39 asset**. Restano gli avvisi della toolchain su chunk oltre 500 kB e classificazione statica di alcune route. Non è un deploy |
| HTTP sul runtime compilato | **16 pagine** con status 200; `html lang`, title/description, H1 singolo e separato correttamente, canonical, 9 alternate, Open Graph (title/description/locale/alt) e Twitter description coerenti con i cataloghi |
| Contenuti senza JavaScript | Parser dell’HTML ricevuto, senza esecuzione script: presenti Voti/Appunti, privacy, FAQ e avvio del diario; presenti formula/esempio e informazioni sulla bozza degli strumenti. L’editor stesso resta interattivo dopo hydration |
| Indicizzabilità tecnica locale | Host canonico indicizzabile; quattro campioni su host preview noindex; `/it` e `/app?mode=register&uiLocale=fr` noindex; `/xx`, tool inesistente e alias tool italiano inesistente restituiscono 404. Nessun controllo di indicizzazione reale Google |
| Sitemap/robots/alias | Sitemap con 16 URL e 9 alternate per voce; robots consente pagine pubbliche ed esclude `/api/`; `www` e alias corrente `chatgpt.site` restituiscono 308 verso URL canonico nella prova locale |
| Layout compilato | **48 casi**: tutte le 16 pagine a **1440, 390 e 320 px**. Nessun overflow orizzontale misurato; pannelli inattivi con `display:none`. Ispezionate visivamente home italiana desktop, home francese e calcolatore inglese stretti, appunti e navigazione tedesca; corrette parole spezzate delle etichette e placeholder del titolo troppo lungo |
| Navigazione del diario | Nelle quattro lingue: schede Voti/Appunti, classe/privacy, avvio/FAQ, apertura dell’ultima FAQ, CTA registrazione e ritorno alla propria home. Nessun account creato. Registrazione a 320 px senza overflow |
| Cambio lingua | Dalle home DE/FR/EN all’italiano: destinazione `/`, senza passaggio a `/it` |
| Tastiera/focus | In italiano: Home/ArrowRight/End selezionano le schede attese dopo l’aggiornamento del focus; immagine aperta e chiusa con Escape, dialogo chiuso e focus restituito al pulsante di ingrandimento. Non è una prova con lettore di schermo |
| Strumenti senza account | Con testo sintetico: link agli appunti, scrittura, anteprima, bozza recuperata dopo navigazione; download effettivi Markdown e PDF. Markdown di 84 byte con titolo/testo attesi; PDF di 6.310 byte con header e terminazione validi. PDF non renderizzato visivamente in questo task |
| Calcolo e CTA | Inseriti 4.5 di peso 1 e 5.5 di peso 2: risultato reale **5.2**, uguale all’esempio italiano formattato per it-CH. Link «Crea un account per il diario» arriva a `/app?mode=register` |
| Controllo finale | `git diff --check` e controlli documentali superati; nessun commit, deploy, nuovo account o modifica a dati remoti |

**Limiti della verifica.** Il browser disponibile ha verificato la palette pubblica chiara; nessuna prova dedicata del tema scuro nei moduli account, zoom/testo al 200%, dispositivi fisici, IME/tastiera virtuale o lettori di schermo. Login e recupero credenziali sono stati analizzati nel sorgente e nei testi; non è stato eseguito un ciclo completo di creazione/recupero account. Le prove dei conflitti di salvataggio restano coperte dai test esistenti, non sono state ripetute con due schede in questa sessione. Nessuna misurazione di Core Web Vitals o ricerca utenti.

**Ambiente locale.** Durante gli aggiornamenti a caldo dei cataloghi, il server di sviluppo ha mostrato errori di contesto I18n/InstallApp già documentati in precedenti verifiche. La QA finale usa la build compilata avviata dopo la chiusura del server dev. Il comando standard `npm run start` restituiva 404 per asset statici nel presente ambiente: l’override `--assets /Users/ahmedali/Documents/ProgettiCodex/iPagell/dist/client` ha reso disponibili CSS e JavaScript, poi sono stati eseguiti i 48 controlli e le prove interattive. Non è stata corretta o pubblicata una configurazione di hosting.


## 7. Criticità aperte e suggerimenti futuri

1. **Validazione umana della comprensione.** Far leggere titolo/intro/CTA a pochi studenti svizzeri e verificare che distinguano diario, singolo appunto pubblico e calcolatore. È più utile di nuove pagine o altra prosa.
2. **Revisione madrelingua.** Confermare registro, terminologia scolastica e frasi di recupero con parlanti DE-CH/FR-CH/EN. La revisione multiagente non equivale a una revisione umana locale. Il workspace autenticato conserva testi fuori dal perimetro; non dichiarare uniformità terminologica dell’intera app.
3. **Search Console, quando disponibile.** Misurare URL indicizzati, canonical scelte, query pertinenti e paesi/lingue; non confrontare ranking prima che questa versione sia pubblicata. Nessun volume o risultato SEO è stato inventato.
4. **Anteprime social.** Sostituire in un intervento dedicato le quattro composizioni precedenti, soprattutto per gli appunti senza account. Le immagini esistenti sono dimostrative e gli alt ora le descrivono correttamente; non sono una riproduzione del layout pubblico attuale.
5. **Anteprima compilata locale.** Verificare separatamente il percorso relativo degli asset del comando `npm run start`: nell’ambiente di questa sessione CSS/JS restituivano 404, mentre le route SSR rispondevano. L’override locale con percorso assoluto di `dist/client` ha consentito la verifica completa. Nessuna conclusione sulla produzione deriva da questo problema locale; non è stata modificata la configurazione di hosting.

Dispositivi fisici, IME/tastiera virtuale, lettori di schermo e indicizzazione reale rimangono fuori dalla prova. Nessuna necessità dimostrata di aggiungere pagine cantonali, blog, campagne, schema markup o altri strumenti in questo task.

## 8. File modificati e perimetro

- `lib/i18n/messages/{it,de,fr,en}.json`: copy e microcopy delle superfici esaminate, metadata, istruzioni d’ingresso/installazione; una correzione di registro nel messaggio dell’editor condiviso francese.
- `components/public-overview.tsx`: titolo copertina dedicato, invito account distinto, rimozione nota duplicata e H1 con separatore/nome accessibile.
- `components/landing-content.tsx`: contenuti dei pannelli presenti nell’HTML iniziale.
- `components/public-notes.tsx`: azione Markdown esplicita.
- `components/grade-average-calculator.tsx`: esempio informativo con formattazione numerica della lingua; formula applicativa invariata.
- `components/i18n-provider.tsx`: selezione italiana della home verso `/`.
- `lib/i18n/public-page.ts`: descrizione SEO del diario dedicata e alt social coerenti.
- `app/marketing-page.module.css`: visibilità dei pannelli e leggibilità delle etichette lunghe senza spezzare parole.
- `app/public-space.module.css`: navigazione a due colonne fino a 360 px per le etichette localizzate.
- `docs/PUBLIC-COPY-SEO-REVIEW.md`: unico report della revisione.
- `docs/REPO-INVENTORY.md`: aggiornamento automatico delle chiavi i18n.

Il checkout conteneva numerose modifiche precedenti. La lista descrive soltanto il lavoro di questa sessione, senza attribuire alla revisione modifiche pregresse a auth, database, dipendenze o altre viste. Nessuna nuova dipendenza, API, scala, pagina, autenticazione o migrazione; nessun commit o deploy.

## 9. Pubblicazione successiva — 21 ottobre 2026

Su successiva richiesta esplicita di deploy semplificato, la revisione è stata pubblicata come Sites **42** su **https://ipagell.website** alle 11:24 Europe/Zurich. Deployment `appgdep_6ad884a903208191b44d6d94a51a4f6e` succeeded, sorgente `61523824055b62149f8396c197470d507c623072`. Il riferimento precedente a nessun deploy descrive la sessione editoriale, conclusa prima di questa richiesta.

Sorgente di rilascio derivato dalla produzione 41 con sole modifiche pubbliche/linguistiche pertinenti; backend, migrazioni e dipendenze preservati. Eseguita la build del pacchetto isolato, senza ripetere le suite già concluse. Domini/TLS e accesso pubblico verificati; dopo il deploy, homepage canonica HTTP 200 con title e contenuti nuovi. Il commit necessario alla pubblicazione appartiene al repository sorgente Sites; nessun commit o push sul repository GitHub di lavoro. [Registro del rilascio](DEPLOYMENT.md#revisione-copy-e-seo--sites-42-21-ottobre-2026).
