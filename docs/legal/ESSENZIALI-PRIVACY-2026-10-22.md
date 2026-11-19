# iPagell — Percorso minimo di tutela

Data: **22 ottobre 2026**. Gestore: **Ahmed Ali, Ticino, Svizzera**. Contatto: **ipagell.service@gmail.com**.

**Aggiornamento documentale dell’11 novembre 2026:** le tre bozze sono state riorganizzate in testo breve per gli utenti e note tecniche/interne separate. Rilette le fonti ufficiali; i termini Sites riportano un aggiornamento del 6 novembre e conservano il vincolo sul pubblico sotto i 13 anni o sotto l’età applicabile al consenso digitale. Nessuna prova operativa o pubblicazione deriva da questa revisione.

**Aggiornamento del 17 novembre 2026 — passaggio a Cloudflare:** dal 16 novembre la produzione è un Worker sull’account Cloudflare del gestore, con D1 `ipagell-live` in giurisdizione UE. Le bozze sono state riallineate: fornitore, contratto e trasferimenti ora sono quelli di Cloudflare; aggiunti registri del Worker (3 giorni) e cronologia di ripristino del database (7 giorni); il testo cookie riporta un controllo mirato della produzione. I riferimenti a Sites qui sotto restano solo per il sito precedente. Nessuna modifica all’app né pubblicazione dei testi.

Questo è il piano operativo di riferimento, ridotto su richiesta del gestore. Sostituisce la precedente sequenza che proponeva di contattare Sites come primo passo. Il lavoro resta limitato ad analisi e documenti: nessuna modifica all’app, accesso a dati utente, email o pubblicazione.

## Scelta consigliata

Per l’attuale servizio: **informativa comprensibile, regole d’uso brevi, contatto unico, cancellazione funzionante e protezioni di base**. Il quadro di partenza è svizzero; l’uso personale degli studenti va distinto da un eventuale futuro affidamento ufficiale da parte di scuole. Le lingue disponibili non rendono automaticamente applicabile ogni legislazione estera.

**Non serve introdurre un contatto personalizzato con il fornitore di hosting (oggi Cloudflare) come adempimento ordinario.** Si parte da condizioni standard, DPA applicabile, lista subresponsabili, documentazione pubblica e impostazioni disponibili. Le informazioni obbligatorie vanno comunque rese correttamente; un dato mancante si risolve con una fonte attendibile, senza inventarlo o presumere che una formula generica basti.

## Confronto con servizi pertinenti

| Fonte pubblica consultata nel confronto del 22 ottobre | Cosa dichiara | Cosa riprendere per iPagell |
|---|---|---|
| [School Companion — privacy](https://schoolcompanion.ch/privacy/) | Dati scolastici sincronizzati, visibilità nei gruppi, gestore e contatto, cancellazione dall’app o tramite email. | Spiegazione concreta delle funzioni e un contatto ordinario per assistenza e diritti. |
| [Schuno — privacy](https://www.schuno.app/de/privacy/) | Distingue l’app senza account e offline dal sito e dalle email ricevute. | Distinguere strumenti locali, account online e contatti, senza dichiarare che tutto iPagell sia solo locale. |
| [Escola — privacy di portale e app](https://www.escola.ch/datenschutz) | Servizio istituzionale: informazioni sui fornitori, trattamento per le scuole e un canale di contatto per i diritti. | Chiarezza sui ruoli e sui fornitori. Gli accordi per adozioni scolastiche ufficiali si valutano se quel modello viene avviato. |

Sono esempi di presentazione e organizzazione dichiarata, non verifiche della loro conformità o prova di come operino internamente. La scelta per iPagell è una raccomandazione ricavata dal confronto e dalle fonti ufficiali, non una statistica su tutti i siti. Non si copiano promesse su localizzazione, tempi o assenza di tracciamento di prodotti con infrastrutture diverse.

## Cosa realizzare, senza aggiunte automatiche

| Priorità | Intervento minimo | Quando è sufficiente |
|---|---|---|
| 1 | Finalizzare e rendere accessibile l’informativa, con nome/email, dati e scopi, classi, archivi locali, fornitori/trasferimenti, conservazione e diritti. | Testo coerente con il servizio e disponibile dalle pagine pubbliche, dall’account e prima della registrazione; niente note interne nella versione pubblica. |
| 2 | Descrivere cookie e archivi del browser; controllare cookie e richieste del sito effettivo e i servizi Cloudflare attivi (statistiche, NEL, protezioni bot). Primo controllo fatto il 17 novembre. | Decisione motivata sulle scelte necessarie. Nessun banner introdotto per il solo fatto che esista un cookie di sessione o un conteggio delle visite. |
| 3 | Usare regole brevi su età, credenziali, condivisione, materiali altrui e valore indicativo dei calcoli. | Regole leggibili prima dell’adesione, con modalità appropriata di accettazione se usate come condizioni contrattuali. Privacy e contratto restano distinti. |
| 4 | Usare ipagell.service@gmail.com per privacy, assistenza e segnalazioni. | Ricezione verificata, casella protetta e controllata; richieste gestite anche manualmente, con verifica del richiedente proporzionata. Non occorrono un portale dedicato o una nuova API per il solo fatto di ricevere richieste. |
| 5 | Verificare la cancellazione esistente e limitare i residui non più necessari. | Dati dell’account, appunti e copie sotto il controllo del servizio gestiti correttamente; limiti di file scaricati, dispositivi offline e backup spiegati. Nessun termine di rimozione infrastrutturale inventato. |
| 6 | Mantenere le protezioni di base e una breve gestione degli incidenti. | Accessi amministrativi limitati e protetti, autorizzazioni fra account verificate, manutenzione e una persona che sappia contenere un’esposizione e valutare gli obblighi del caso. |

Per i minori la proposta resta **13+ con eventuali soglie superiori applicabili e rappresentanza quando necessaria**. Era nata dal vincolo dei termini Sites, che dal 16 novembre non si applica più: ora è una scelta del gestore da confermare. Non è una soglia universale della LPD e non impone di raccogliere documenti o data di nascita completa. La forma di attuazione deve essere proporzionata al servizio e ai dati.

## Hosting: percorso ordinario senza email

Dal 16 novembre 2026 il fornitore è **Cloudflare, Inc.**, con contratto self-serve sull’account del gestore (Worker `ipagell`, zona e Workers sul piano Free).

1. Usare il [DPA Cloudflare](https://www.cloudflare.com/cloudflare-customer-dpa/) (v6.4, in vigore dal 3 aprile 2026), che dichiara di far parte del Self-Serve Subscription Agreement. Non occorre chiedere un contratto individuale al supporto. Conservare una copia datata di DPA, condizioni self-serve e [lista subresponsabili](https://www.cloudflare.com/gdpr/subprocessors/cloudflare-services/).
2. Trasferimenti: Cloudflare dichiara l’adesione allo Swiss-U.S. Data Privacy Framework ([informativa Cloudflare, §7](https://www.cloudflare.com/privacypolicy/)); il DPA prevede in alternativa le clausole contrattuali standard con gli adattamenti svizzeri. Restano da controllare da fonti pubbliche la registrazione DPF e l’entità contraente nelle condizioni self-serve.
3. Dove stanno i dati: il D1 è in giurisdizione `eu` (regione EEUR); le richieste sono elaborate nel centro dati più vicino al visitatore; i Workers Logs, senza Customer Metadata Boundary, possono stare nei centri dati principali di Cloudflare nel mondo. Non dichiarare un trattamento esclusivo in Svizzera o nell’UE.
4. Conservazione sotto il controllo del gestore: Workers Logs 3 giorni e Time Travel del D1 7 giorni sul piano Free (7 e 30 con Workers Paid). Aggiornare l’informativa se cambia il piano. Dal 17 novembre le invocation logs (IP, posizione approssimativa, identificativo account per ogni richiesta) sono disattivate: restano solo gli errori registrati dal codice.
5. Sito precedente: il D1 Sites resta nell’account di OpenAI e l’alias `*.chatgpt.site` reindirizza a `ipagell.website`, quindi gli utenti non lo raggiungono più per esportare. Da decidere come gestire richieste di accesso o cancellazione su quei dati.

Questo percorso non equivale a una certificazione di tutte le informazioni del progetto. Eventuali lacune sostanziali restano annotate, ma **una risposta personalizzata del supporto non è il criterio obbligatorio di chiusura**.

## Cookie: decisione pratica

Il codice dell’app non integra pubblicità o analytics commerciali. Il controllo della produzione del 17 novembre non ha trovato cookie aggiunti da Cloudflare né Web Analytics attivo; sono presenti le segnalazioni di errore di rete (NEL) e le statistiche aggregate lato server. I dettagli sono nel [testo cookie/storage](COOKIE-STORAGE-IT-BOZZA.md).

La raccomandazione è **nessun banner**, con informazione chiara; **nessun acquisto di CMP**. Il controllo va ripetuto se si attivano servizi Cloudflare che aggiungono script o cookie. Se il trattamento concreto richiede una scelta, va resa effettiva. Riferimento: [guida IFPDT su cookie e tecnologie simili](https://www.edoeb.admin.ch/it/cookies-consigli-pratici).

## Gestione manuale e conservazione

Per le prime richieste bastano presa in carico, verifica adeguata, riscontro pertinente e nota minima dell’esito in uno spazio riservato. La [procedura dettagliata](PROCEDURA-RICHIESTE-PRIVACY.md) è un riferimento interno per casi concreti, non un elenco di nuovi sistemi da costruire prima di iniziare. I termini legali applicabili restano da rispettare.

La cancellazione automatica di ogni account inattivo dopo un numero prefissato di mesi non viene indicata come obbligo universale. Vanno scelti criteri giustificati per i dati non più necessari: sessioni e contatori scaduti, inviti inutilizzabili, residui delle note e pratiche chiuse. Pulizia e riesame possono essere manuali quando praticabili e sicuri; nuovi automatismi si introducono soltanto se servono a rispettare quei criteri.

## Cosa resta fuori da questo intervento minimo

Non si introducono per automatismo DPO, certificazioni, raccolta di documenti, portale privacy, consenso unico a ogni trattamento, nuovo sistema di recupero account o un ulteriore cambio di hosting. Un eventuale obbligo specifico emerso dal caso reale va comunque rispettato. Pagamenti, pubblicità, AI sulle lezioni e adozione ufficiale da scuole richiederanno una valutazione al momento dell’introduzione.

Testi rivisti in forma essenziale, senza creare altre pagine o documenti: [informativa](INFORMATIVA-PRIVACY-IT-BOZZA.md), [cookie/storage](COOKIE-STORAGE-IT-BOZZA.md), [regole d’uso](REGOLE-USO-IT-BOZZA.md). Gli approfondimenti del [rapporto legale](../ANALISI-CONFORMITA-LEGALE-2026-10-15.md) restano consultabili; non diventano tutti adempimenti obbligatori per il solo fatto di essere elencati.

Prima dell’integrazione restano quattro verifiche circoscritte: informazioni pertinenti su fornitori/Stati/conservazione dalle fonti standard; comportamento reale di cookie/statistiche e assistenti; adozione e attuazione di regole, gestione richieste e criteri di conservazione; corrispondenza dei testi con il rilascio e i suoi punti di accesso. Non sono nuovi sistemi da costruire: servono a evitare che la versione pubblica descriva comportamenti non verificati.

Il risultato perseguito è una tutela proporzionata e verificabile. Le consuetudini di altri servizi aiutano a scegliere la forma, ma non attestano da sole la conformità di iPagell.
