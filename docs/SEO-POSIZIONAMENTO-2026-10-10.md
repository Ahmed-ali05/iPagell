# iPagell — visibilità organica e possibilità di posizionamento

**Data:** 10 ottobre 2026. **Stato:** analisi e proposte documentali; nessun intervento applicativo o di pubblicazione autorizzato da questo documento.

[Indice](README.md) · [Prodotto e nome](PRODOTTO-NOME-POSIZIONAMENTO-2026-10-10.md) · [Audit SEO iniziale del 1 ottobre](improvement-2026-10-01/SEO-AUDIT.md)

## 1. Valutazione principale

La pagina adatta alla ricerca «calcolo media voti da 1 a 6» **esiste già**, è pubblica e restituisce contenuto nell'HTML iniziale. Nei controlli effettuati non emerge un blocco tecnico generale all'indicizzazione. Il limite osservabile è una pagina molto essenziale, con titolo generico, pochi contenuti esplicativi e poche occasioni di scoperta dentro il sito.

Resta però una domanda precedente a qualsiasi ottimizzazione: **Google ha indicizzato la pagina e scelto il suo URL canonico?** Non disponiamo di Search Console. Non è possibile attribuire l'assenza dai risultati a una causa unica, a una penalizzazione, alla giovane età del dominio o alla mancanza di backlink.

La direzione proposta è concentrare il primo lavoro sul calcolatore esistente, verificarne l'indicizzazione e costruire attorno ad esso contenuti e utilità pertinenti. Una riscrittura dell'app o un cambio di nome non risultano necessari per affrontare questa query.

## 2. Metodo, evidenze e limiti

Letti snapshot, architettura, matrice di verifica, documentazione prodotto/pubblicazione, audit SEO precedente e codice corrente delle pagine pubbliche, metadati, routing, cataloghi, calcolatore e formule. Il checkout contiene numerose modifiche pregresse: non sono state alterate nell'analisi.

Verifiche esterne: ricerche web esplorative e richieste HTTP GET anonime alla produzione. Nessun accesso ad account, nessuna modifica ai dati, nessun invio di sitemap o richiesta di indicizzazione. Le richieste locali iniziali erano limitate dalla rete dell'ambiente; la lettura pubblica successiva è riuscita. L'errore del primo strumento web nell'aprire il dominio non era prova di indisponibilità del sito.

Le ricerche sono un campione fornito dal motore dello strumento, **non una riproduzione della SERP Google personale dell'utente** né un rilevamento di posizioni a Google.ch, con località e dispositivo controllati. Non sono disponibili volumi keyword, dati Search Console, storico del dominio, misure CrUX o inventario dei backlink.

### Risposte pubbliche osservate

| Risorsa | Risultato del controllo del 10 ottobre | Significato e limite |
|---|---|---|
| `/`, `/de`, `/fr`, `/en` | HTTP 200, lingua corretta, `index, follow`, titoli localizzati | Landing pubbliche raggiungibili con una richiesta anonima; non prova che Google le abbia indicizzate |
| `/calcolo-media-voti` | HTTP 200; title «Calcolo media voti \| iPagell»; H1 «Calcolo media voti»; `index, follow` | Il titolo non esplicita 1–6 o media ponderata |
| Calcolatori DE/FR/EN | HTTP 200, lingua corretta, `index, follow`, titolo localizzato | Localizzazione già esistente; non documenta domanda o ranking in ciascuna lingua |
| HTML del calcolatore italiano | Campi, descrizione e formula già presenti prima di eseguire JavaScript | `use client` nel componente non equivale, in questo runtime, a pagina vuota per il crawler |
| Canonical/hreflang di home, tool IT e tool DE | Canonical sul dominio principale; alternates delle quattro lingue e `x-default` | Base coerente nel campione ispezionato; verificare anche la canonical scelta da Google |
| `/robots.txt` | HTTP 200; permette `/`, esclude `/api/`, dichiara sitemap | Nessun blocco generale osservato per le pagine pubbliche |
| `/sitemap.xml` | HTTP 200, XML con otto URL: quattro landing e quattro calcolatori | Il file esiste; invio e lettura da parte di Google non verificati |
| Alias `www` e `ipagell.produc-ch.chatgpt.site` | HTTP 308 verso il calcolatore canonico; query di prova conservata | Redirect server effettivo nel campione, non soltanto protezione JavaScript |
| URL HTTP del calcolatore | HTTP 302 verso HTTPS, poi 200 | Eventuale allineamento a redirect permanente da valutare nella piattaforma; nessuna evidenza che sia la causa del problema |
| `/it` | HTTP 200, `noindex, nofollow` | Alias non destinato all'indice; non è necessario intervenire per creare una nona landing |
| `/app` anonimo | HTTP 200, `noindex, nofollow` | Area personale intenzionalmente esclusa; non va aperta all'indicizzazione per ottenere traffico |
| Percorso inventato per la prova | HTTP 404 | Nessuna soft-404 osservata in questo singolo caso |

URL del tool: [calcolatore pubblico](https://ipagell.website/calcolo-media-voti). File di scoperta: [robots](https://ipagell.website/robots.txt), [sitemap](https://ipagell.website/sitemap.xml).

L'estrazione del testo dentro `main`, escludendo script e stili e contando anche etichette e pulsanti, rileva circa **115 parole nel calcolatore italiano** e 423 nella home. È una misura della quantità di contenuto disponibile, non una soglia SEO: la proposta è aggiungere risposte utili, non raggiungere un numero di parole.

### Campione delle ricerche

Query consultate: frase con e senza virgolette, «iPagell calcolo media voti Svizzera», «calcolo media voti svizzera ticino», `site:ipagell.website`, dominio con «media» e nome di marca. Le ricerche dedicate al dominio non hanno restituito risultati nel campione. Le ricerche tematiche hanno restituito strumenti e guide di altri siti; non consentono di certificare la posizione Google di iPagell.

Tre riferimenti illustrano opportunità diverse:

| Pagina osservata | Cosa presenta | Spunto per iPagell |
|---|---|---|
| [Calcolatore svizzero](https://finanzrechnerschweiz.ch/it/calcolatori/note-svizzere) | Punti→nota, media, nota obiettivo, esempi e spiegazione dei limiti | Rispondere a bisogni vicini al calcolo senza confondere una formula con un regolamento ufficiale |
| [Calcolatore di Canva](https://www.canva.com/it_it/strumenti/calcolatore-voti/) | Media ponderata, istruzioni e domande sul metodo | Spiegazione accessibile intorno allo strumento, oltre ai campi |
| [MyPlusPoints](https://www.mypluspoints.ch/it/) | Presentazione della gestione continuativa dei voti e dei pluspoints nel contesto svizzero | Posizionamento scolastico riconoscibile; non adottare automaticamente le sue regole di calcolo |

Sono osservazioni sulle pagine e sui risultati disponibili. Non abbiamo verificato traffico, autorevolezza, qualità complessiva, recensioni o tassi di conversione di questi prodotti.

## 3. Separare scoperta, indicizzazione, posizione e scelta dell'utente

| Situazione da accertare | Interpretazione | Lavoro teoricamente appropriato |
|---|---|---|
| Google non conosce l'URL | Problema di scoperta | Sitemap, link interni accessibili e segnalazioni esterne pertinenti |
| URL scoperto ma non scansionato | Scoperta avvenuta, scansione da accertare | Controllare accessibilità, stabilità, risorse e segnali di scoperta; non riscrivere tutto il sito |
| URL scansionato ma non indicizzato | Google lo ha letto senza inserirlo nell'indice | Esaminare contenuto, duplicati, canonical e report; il solo title non identifica la causa |
| Canonical Google diversa | Il motore raggruppa la pagina sotto un altro URL | Allineare redirect, link, sitemap e canonical in base al caso reale |
| URL indicizzato, poche impression pertinenti | Possibile problema di rilevanza o competizione | Migliorare corrispondenza con l'intento, utilità e riferimenti esterni |
| Impression pertinenti, pochi clic | Risultato poco invitante o posizione sfavorevole | Valutare title/snippet separando paese, dispositivo e query |
| Clic, ma poche registrazioni o ritorni | Questione di prodotto e percorso | Verificare utilità del calcolatore, continuità verso il diario e motivi per tornare |

L'[ispezione URL di Search Console](https://support.google.com/webmasters/answer/9012289) distingue versione indicizzata e test live: un test live valido non garantisce l'inclusione nell'indice. Nella futura diagnosi servirebbero stato URL, ultima scansione, canonical dichiarata/scelta e HTML letto da Google.

## 4. La pagina principale da potenziare

### Proposta editoriale, non applicata

**URL da conservare:** `/calcolo-media-voti`. La frase 1–6 può comparire nel contenuto senza cambiare un indirizzo già valido.

**Title proposto:** «Calcolo media voti da 1 a 6, con pesi | iPagell». Il suffisso di marca viene aggiunto una sola volta dal template.

**H1 proposto:** «Calcolo della media dei voti da 1 a 6».

**Description proposta:** «Calcola la media dei voti da 1 a 6, semplice o ponderata. Inserisci voti e pesi, consulta esempi e formule. Gratis, senza registrazione.»

**Introduzione proposta:** «Inserisci i voti per calcolare la media nella scala da 1 a 6. Se una prova conta più delle altre, modifica il suo peso. Il calcolo avviene nel browser e non richiede un account.»

La precisazione sul sistema svizzero andrebbe aggiunta con 6 come voto migliore e 4 come riferimento di sufficienza, distinguendola dalle regole della singola scuola. La [EDK](https://edk.ch/de/bildungssystem/kantonale-schulorganisation/kantonsumfrage/b-31-schuelerbeurteilung/) descrive questo uso generale della scala; non certifica il nostro prodotto o una formula universale di promozione.

Google può ricostruire il titolo mostrato usando più segnali: il title deve essere descrittivo e coerente con la pagina, non una lista di varianti della query. [Documentazione sui titoli](https://developers.google.com/search/docs/appearance/title-link).

### Contenuti che mancano e che avrebbero una funzione reale

1. **Media semplice:** formula e esempio `4,5 + 5 + 5,5 = 15`; `15 / 3 = 5,0`.
2. **Media ponderata:** esempio con 4,5 di peso 1 e 5,5 di peso 2: `(4,5 × 1 + 5,5 × 2) / 3 = 5,1666…`.
3. **Precisione del risultato:** il calcolatore corrente visualizza un decimale, quindi l'esempio precedente appare come 5,2. Questo non equivale all'arrotondamento ufficiale della pagella.
4. **Pesi comprensibili:** peso 2 significa due volte il peso 1. Percentuali e pesi relativi vanno spiegati, senza imporre che i pesi sommino a 100.
5. **Errori comuni:** media delle medie, confusione tra peso della prova e coefficiente della materia, arrotondamento troppo anticipato.
6. **FAQ sul compito concreto:** «Posso inserire 4,5?», «Come funziona un voto doppio?», «Perché vedo un decimale?», «Questa media è il voto della pagella?», «I miei voti vengono conservati?».
7. **Passaggio al diario:** esempio verificabile del beneficio di conservare voti per materia durante il semestre, dopo aver ottenuto il risultato.

Il tool deve restare immediatamente utilizzabile. Le spiegazioni possono stare sotto o accanto, con sezioni consultabili. Nessun articolo lungo obbligatorio prima del primo calcolo.

Il codice corrente distingue già le formule: tool pubblico = media dei voti con pesi inseriti; diario = pesi voto×tipo di prova e media generale con coefficienti delle materie. Non usare una spiegazione unica che cancelli questa differenza.

## 5. Mappa degli intenti e architettura possibile

Le query seguenti sono ipotesi semantiche da validare, **non keyword con volume di ricerca misurato**.

| Intento | Esempi di ricerca | Destinazione proposta | Decisione |
|---|---|---|---|
| Calcolare adesso | calcolo media voti da 1 a 6, media voti svizzera, media ponderata voti | Calcolatore esistente arricchito | Prima priorità |
| Capire il metodo | come si calcola la media, voto doppio, arrotondamento media | Sezioni del calcolatore; guida separata solo se approfondita | Evitare pagine quasi identiche |
| Raggiungere un obiettivo | che voto serve per arrivare al 4 / al 5 | Futuro simulatore pubblico | Richiede funzionalità reale |
| Convertire un punteggio | punti verifica in voto svizzero | Eventuale tool distinto con formula configurabile | Richiede validazione; non esiste oggi |
| Organizzare la scuola | diario scolastico online, agenda per studenti, voti e appunti | Home e possibili pagine prodotto specifiche | Promessa coerente con le funzioni attuali |
| Cercare il marchio | iPagell, ipagell diario | Home | Coerenza di nome e descrizione |
| Lavorare con compagni | agenda di classe, appunti condivisi per materia | Eventuale pagina dedicata alle classi | Dimostrare il caso d'uso e i confini privati |

Possibile struttura futura: home → sezione «Strumenti» → calcolatore e simulatore; guide collegate agli strumenti; pagine prodotto per voti, agenda, appunti e classi soltanto quando ciascuna risponde a una domanda distinta.

«Media ponderata» non richiede automaticamente un secondo calcolatore: quello esistente la supporta già. «Media voti Ticino», «media voti Lugano» e sinonimi non giustificano copie della stessa pagina.

Le pagine nuove dovrebbero contenere una dimostrazione, un esempio o una spiegazione propria. Le [politiche antispam di Google](https://developers.google.com/search/docs/essentials/spam-policies) includono pagine doorway, contenuti prodotti in massa senza utilità e link costruiti per manipolare il ranking.

## 6. Interventi tecnici: cosa avrebbe senso e cosa verificare prima

| Possibilità | Giudizio attuale | Verifica prima di una futura modifica |
|---|---|---|
| Metadati distinti da H1/intro del calcolatore | Utile per descrivere pesi, scala e uso senza account | Oggi `average.title` e `average.description` servono sia metadata sia UI; progettare chiavi dedicate nelle quattro lingue |
| Contenuti esplicativi SSR | Utile preservare e ampliare l'HTML iniziale | Il contenuto attuale è già reso dal server; non serve convertire il framework per questo motivo |
| Link «Calcola la media» nell'header o vicino alle CTA | Candidato semplice | Oggi il link esiste nella sezione Voti, non nel nav principale o nel gruppo CTA hero; valutarne utilità e chiarezza |
| Hub di strumenti con link HTML | Utile se gli strumenti aumentano | Non creare una pagina intermedia vuota con un solo link |
| Redirect HTTP permanente | Miglioria possibile di coerenza | Il 302 osservato appartiene al percorso di piattaforma; verificare controllo e impostazioni Sites prima di ipotizzare una patch al proxy |
| Sitemap con nuove pagine e `lastmod` | Solo quando esistono contenuti nuovi | Usare date di modifica reali, non il giorno di ogni build |
| Prestazioni delle route pubbliche | Da misurare, poi decidere | HTML tool circa 70 kB nella richiesta osservata; non misura JS trasferito, LCP o INP |
| Isolare codice del diario dalle route marketing | Possibilità architetturale condizionata | Misurare dipendenze e chunk delle pagine pubbliche; la segnalazione di chunk grandi non dimostra che il tool carichi tutta l'app |
| Rendere indicizzabile `/app` | Da escludere | Il problema si affronta con pagine pubbliche, mantenendo privati diario, account e classi |
| Cambiare URL, framework o hosting | Nessuna necessità dimostrata | Solo un problema misurato giustificherebbe la migrazione |

Per le prestazioni, obiettivi di riferimento: LCP entro 2,5 s, INP entro 200 ms, CLS entro 0,1. Servirebbero misure mobile e dati sul campo, quando disponibili; nessuna di queste metriche è stata misurata qui. [Core Web Vitals](https://developers.google.com/search/docs/appearance/core-web-vitals).

### Lingue e geografia

Le quattro lingue non significano quattro sistemi scolastici supportati. Il prodotto usa sempre 1–6, voto più alto migliore. Il tedesco generico può attirare persone con aspettative scolastiche diverse; francese e inglese possono evocare altre scale. La pagina deve spiegare il sistema prima che l'utente interpreti il risultato.

Una strategia Svizzera potrebbe localizzare anche il contesto e gli esempi: «Notendurchschnitt Schweiz», «moyenne des notes en Suisse», «Swiss grade average». Le espressioni sono proposte da rivedere con parlanti competenti e dati di ricerca. Gli hreflang `it/de/fr/en` correnti sono validi; `it-CH/de-CH/fr-CH` possono essere valutati se il targeting diventa esplicitamente regionale. Non sono un pulsante per alzare il ranking. [Versioni localizzate](https://developers.google.com/search/docs/specialty/international/localized-versions).

### Dati strutturati e visibilità nelle risposte AI

La home dichiara già un oggetto `WebSite` con nome iPagell e URL canonico. Il calcolatore non presenta JSON-LD nel campione. Potrebbero essere valutati `SoftwareApplication`/`WebApplication` o breadcrumb reali; non sono prerequisiti per essere indicizzati né garanzie di risultati arricchiti. L'idoneità richiede proprietà e contenuti corretti, senza recensioni, valutazioni o offerte inventate. [Schema per software](https://developers.google.com/search/docs/appearance/structured-data/software-app).

**Aggiornamento rilevante al 2026:** Google ha dismesso i rich result FAQ dal 7 maggio e rimosso la relativa documentazione in giugno. Le FAQ restano utili come contenuto, ma un progetto `FAQPage` non va motivato con la promessa di espansioni in SERP. Google precisa inoltre che `llms.txt` non migliora né peggiora visibilità o ranking nella propria ricerca. [Changelog ufficiale](https://developers.google.com/search/updates).

Per la consultazione da assistenti e sistemi di risposta, sono ipotesi utili formule leggibili, esempi verificati, confini chiari e pagine accessibili. Non è possibile promettere che un assistente citi iPagell.

## 7. Interventi di prodotto che potrebbero creare una ragione per cercarci

Questa parte è esplorativa e non descrive funzioni già disponibili nel calcolatore pubblico.

| Idea | Utilità per lo studente | Potenziale di scoperta | Condizione e costo relativo |
|---|---|---|---|
| Esempi caricabili «voto doppio» / «media semplice» | Capire il risultato facendo una prova | Esempi collegabili dalle guide | Basso; distinguere sempre esempio e dati propri |
| Inserimento di più voti insieme | Calcolo veloce da telefono | Strumento più comodo da consigliare | Medio; gestire virgola decimale senza ambiguità con i separatori |
| Precisione visibile e arrotondamento configurabile | Comprendere decimali e regole | Domande più specifiche sui risultati | Medio; distinguere valore esatto, visualizzato e regola scolastica |
| Simulatore pubblico del prossimo voto | Rispondere a «che voto mi serve?» | Intento adiacente e distinto | Medio; riusare il dominio delle formule con verifiche, non copiare senza analisi il simulatore privato |
| Passaggio dal calcolo al diario con i voti scelti | Evitare di reinserire i dati | Migliore conversione del traffico utile | Medio/alto; scelta esplicita di conservazione, account e materia di destinazione |
| Condivisione di un esempio anonimo | Spiegare i pesi a un compagno | Riferimenti spontanei allo strumento | Medio; non inserire voti personali in URL pubblici o indicizzabili |
| Widget per siti scolastici o di tutor | Rendere disponibile il tool in contesti pertinenti | Scoperta presso un pubblico preciso | Alto; versione, accessibilità, manutenzione e attribuzione non manipolativa |
| Guide per contesti scolastici specifici | Chiarire casi particolari | Query con intento preciso | Alto; fonti ufficiali, revisore, aggiornamento e nessuna certificazione di promozione |
| Materiali di esempio stampabili | Spiegare formula e pesi fuori dal sito | Utilità per tutor e studenti | Medio; HTML principale accessibile, PDF come complemento |
| Altre scale di voto | Ampliare il mercato realmente servito | Nuove query coerenti con il prodotto | Alto; progetto di dominio/persistenza, non solo testi o selettore di lingua |

La priorità consigliata è esempi + precisione spiegata + simulatore. Conversione punti→voto, widget e nuovi sistemi richiedono un caso d'uso validato prima dell'investimento.

## 8. Fiducia, riferimenti esterni e distribuzione

La home e il repository pubblico identificano il progetto, ma non abbiamo misurato quanti siti lo citino. Parlare di «dominio senza autorità» sarebbe una diagnosi non verificata.

Possibili attività future: pagina chiara sul progetto e supporto; spiegazioni delle formule revisionate; segnalazione mirata a tutor, associazioni studentesche e raccolte di strumenti scolastici; esempi video che mostrino davvero il calcolo; materiali utilizzabili da docenti. Ogni attività dovrebbe offrire valore al destinatario. Nessun contatto è stato effettuato.

Un widget, un tutorial o una guida ben fatta possono meritare un riferimento editoriale; non bisogna trasformarli in obblighi di link con keyword. Google documenta [sistemi di analisi dei collegamenti](https://developers.google.com/search/docs/appearance/ranking-systems-guide), ma non fornisce una formula del numero di backlink necessario per la prima pagina.

Un eventuale test pubblicitario potrebbe misurare messaggi e domanda con budget deciso separatamente. Pagare annunci non migliora il posizionamento organico. L'estensione `.website` non costituisce da sola una penalizzazione; un cambio dominio può avere motivi di marchio o fiducia, non una promessa di ranking. [FAQ Google sul posizionamento](https://developers.google.com/search/help/site-position-in-search-faq).

## 9. Piano teorico con priorità e criteri di decisione

Le durate sono finestre organizzative dopo un'eventuale autorizzazione, non promesse di risultati.

| Ordine | Lavoro | Criterio per passare oltre |
|---|---|---|
| P0 — diagnosi, prima settimana | Search Console: proprietà esistente se disponibile, ispezione tool/home, sitemap, canonical scelta, problemi di scansione e azioni manuali | Sapere se si tratta di scoperta, indicizzazione o ranking; correggere soltanto problemi osservati |
| P1 — pagina principale, settimane 1–2 | Titolo/H1/intro pertinenti, esempi, precisione e limiti; collegamenti al tool | Pagina utile e verificata, mantenendo URL e calcolo immediato |
| P1 — rilevanza, settimane 2–4 | Contesto scolastico e localizzazione; prima guida soltanto se distinta | Ogni pagina ha un compito proprio e un collegamento pertinente |
| P2 — prodotto, settimane 3–6 | Scegliere un miglioramento: inserimento rapido o simulatore pubblico | Prova con studenti dimostra utilità e comprensione della formula |
| P2 — distribuzione, settimane 4–8 | Risorse e contatti selettivi, monitoraggio query/landing | Riferimenti pertinenti e visite utili osservate, senza comprare link |
| Revisione — giorni 30/60/90 | Confrontare indicizzazione, impression, clic e uso | Decidere il prossimo investimento sulla base dei dati |

Queste fasi possono sovrapporsi dopo la diagnosi. Se la pagina non è indicizzata, l'analisi del CTR è prematura. Se è indicizzata ma gli ingressi sono irrilevanti, allargare le keyword può peggiorare la qualità dell'acquisizione.

Google indica tempi variabili, da ore a mesi, e consiglia generalmente di attendere alcune settimane per valutare gli effetti. Non esiste una garanzia di prima pagina. [Guida SEO](https://developers.google.com/search/docs/fundamentals/seo-starter-guide).

### Misurazione proposta

- **Indicizzazione:** stato e canonical Google dei singoli URL prioritari, non il totale grezzo di tutte le pagine.
- **Domanda intercettata:** impression/clic delle query pertinenti non di marca, per Italia/Svizzera, lingua e dispositivo; isolare il traffico incompatibile con 1–6.
- **Risultato di ricerca:** CTR a condizioni comparabili; la posizione media non è una classifica fissa.
- **Utilità:** completamento del primo calcolo e uso del peso, se la futura misurazione è proporzionata e definita.
- **Conversione:** passaggio al diario, registrazione conclusa e primo inserimento reale, senza raccogliere valori dei voti per analytics.
- **Ritorno:** uso volontario del diario nei giorni successivi; distinguere utilità singola del tool da utilità continuativa dell'app.

Baseline non disponibile: non inventare click, volumi, tassi o obiettivi di crescita percentuale. Con poco traffico privilegiare casi osservati e interviste a un test A/B privo di campione sufficiente.

## 10. Mappa di una eventuale implementazione futura

| Area | File realmente coinvolti | Vincolo |
|---|---|---|
| Copy e metadata del tool | `lib/i18n/messages/{it,de,fr,en}.json`, `lib/i18n/public-page.ts` | Separare testo SEO e UI; preservare traduzioni e alternates |
| Esempi, spiegazioni e tool | `components/grade-average-calculator.tsx`, `app/grade-average.module.css`, `lib/grade-average-calculator.ts` | Nessuna regressione nel parsing, nei pesi e nella precisione |
| Collegamenti dalla landing | `components/landing-content.tsx`, `app/marketing-page.module.css` | Navigazione chiara e mobile; contenuti accessibili nell'HTML |
| Nuove utility/guide | `app/**`, `lib/i18n/public-routes.ts`, `app/sitemap.ts` | URL stabili, contenuto proprio, nessun dato privato |
| Domain routing | `proxy.ts`, `app/layout.tsx`, configurazione Sites | Intervenire soltanto sul livello responsabile del problema verificato |
| Verifiche | `tests/i18n-public.test.ts`, test formule, controlli HTTP e browser pertinenti | Build e test non dimostrano indicizzazione o ranking |

Non sono stati eseguiti build, deploy o test applicativi: non è cambiato codice. Per una futura attuazione valgono i controlli della repository e il flusso di [pubblicazione](DEPLOYMENT.md); la produzione resta `https://ipagell.website` sul progetto Sites esistente.

## 11. Decisione proposta

Per la ricerca segnalata: prima diagnosi Search Console, poi potenziamento del calcolatore esistente e collegamenti migliori. Per rendere più riconoscibile il software: definire categoria, pubblico e promessa, come sviluppato nel [ragionamento sul prodotto e sul nome](PRODOTTO-NOME-POSIZIONAMENTO-2026-10-10.md). Un cambio di marchio rimane un'opzione da validare, non il presupposto del miglioramento SEO.
