# iPagell — Domande per il consulente legale

[Indice](README.md) · [Approfondimento legale](ANALISI-LEGALE-APPROFONDITA-2026-11-18.md) · [Analisi di fattibilità](ANALISI-SITO-2026-11-18.md) · [Percorso minimo](legal/ESSENZIALI-PRIVACY-2026-10-22.md)

Data: **18 novembre 2026**. Lista di domande da portare a un consulente svizzero (e, per la parte UE, italiano). Ogni domanda indica perché serve e quale documento allegare. Le risposte vanno annotate nella colonna finale, poi riportate nell'approfondimento. Non contiene dati di utenti.

**Fatti da dichiarare all'inizio della consulenza**
- Gestore: persona fisica residente nel Canton Ticino, servizio web gratuito, nessuna pubblicità né pagamenti.
- Lingue: italiano, tedesco, francese, inglese. Utenti attuali pochi; pubblico previsto: studenti (spesso minorenni), in Svizzera e potenzialmente in Italia.
- Hosting: Cloudflare Worker, database D1 in giurisdizione UE. Dal 16 novembre 2026 il vecchio hosting OpenAI Sites non è più in uso, ma i dati restano lì.
- Account con nome utente e password, recupero con codice, nessuna email verificata.
- Funzioni con dati scolastici: voti, pesi, agenda, assenze con testo libero, appunti personali e di classe, classi con inviti, backup JSON, assistenti browser.

---

## A. Ambito e ruoli

| # | Domanda | Perché serve | Da allegare | Risposta |
|---|---|---|---|---|
| A1 | Con un gestore svizzero che offre un servizio gratuito a studenti anche in Italia, quali norme si applicano alla raccolta, quando scatta l'art. 3 par. 2 GDPR e quali indicatori contano? | Determina quale legge seguire e se serve un'informativa in più lingue | Elenco lingue, canali di promozione, pubblico previsto | |
| A2 | Serve un rappresentante nell'UE (art. 27 GDPR) o in Svizzera? Esiste un'eccezione applicabile? | Obbligo formale, con costo e nome da pubblicare | Stessa scheda di A1 | |
| A3 | Se una scuola pubblica ticinese adotta il servizio, quali obblighi derivano dalla legge cantonale e dall'accordo con il gestore? | Cambia il ruolo da titolare a responsabile | Bozza di proposta alla scuola (se esiste) | |

## B. Età e minori

| # | Domanda | Perché serve | Da allegare | Risposta |
|---|---|---|---|---|
| B1 | Tra 13, 14 e 16 anni, quale soglia è coerente con la legge svizzera (ZGB artt. 16 e 19) e con l'art. 2-quinquies del Codice privacy italiano, se il servizio è offerto in Italia? | Le bozze dicono 13 anni, la norma italiana dice 14 | Testo della registrazione, bozze legali | |
| B2 | Se la base giuridica è il contratto e non il consenso, la soglia di età si applica comunque al rapporto? Quale ruolo hanno i genitori? | Decide se serve un consenso genitoriale o solo un avviso | Descrizione del servizio gratuito | |
| B3 | Come si può dichiarare l'età in modo proporzionato senza raccogliere documenti o data di nascita completa? | Minimizzazione e verifica | Schema della registrazione | |
| B4 | Per gli account già esistenti con età non verificata, cosa va fatto e in quale forma? | Utenti attuali senza verifica | Numero di utenti attesi (stimato), canale disponibile | |

## C. Dati sensibili nelle assenze

| # | Domanda | Perché serve | Da allegare | Risposta |
|---|---|---|---|---|
| C1 | Un'assenza con motivazione "salute" è un dato particolarmente protetto secondo nLPD art. 5 e GDPR art. 9? Serve una base specifica? | Decide se il campo va cambiato o basta un avviso | Schermata del campo assenze e tipi di motivazione | |
| C2 | Basta un avviso e una scelta di tipi predefiniti, o serve un consenso esplicito per la motivazione sanitaria? | Scelta di design e di base giuridica | Bozza dell'avviso | |
| C3 | Se il testo libero resta, quali misure minime sono richieste (limiti di lunghezza, avvisi, regole di conservazione)? | Alternativa alla rimozione del testo libero | Regole d'uso | |

## D. Conservazione, cancellazione e vecchio hosting

| # | Domanda | Perché serve | Da allegare | Risposta |
|---|---|---|---|---|
| D1 | I marcatori di nota eliminata (con materia, autore, classe) vanno rimossi del tutto o anonimizzati? Dopo quale termine? | Principio di limitazione; oggi nessuna scadenza | Descrizione tecnica dei marcatori | |
| D2 | Il Time Travel del D1 (7 giorni nel piano Free) riporta dati cancellati in caso di ripristino. Basta documentarlo o serve una procedura di ripetizione delle cancellazioni? | Coerenza fra cancellazione e backup | Procedura di ripristino (bozza) | |
| D3 | Per il vecchio D1 Sites (dati ancora presenti presso OpenAI, dopo la fine dell'abbonamento): quale periodo di transizione è ragionevole, e come comunicarlo? Va chiesta la cancellazione al fornitore? | Dati personali senza finalità | Metadati del progetto, alias `chatgpt.site` (redirect 308) | |
| D4 | Per gli utenti che non hanno migrato: quale responsabilità resta al gestore dopo la data limite? Serve un avviso scritto? | Rischio di perdita e di richieste pendenti | Numero stimato di account nel vecchio sito | |
| D5 | Quali termini di conservazione sono ragionevoli per sessioni (14 giorni), contatori anti-abuso (15 minuti), inviti di classe scaduti? | Oggi nessun termine fisico garantito | Tabella di conservazione (ANALISI-CONFORMITA, sezione Evidenze) | |
| D6 | La cancellazione dell'account bloccata quando si possiede una classe è conforme? Serve un percorso del gestore se il proprietario non è reperibile? | Diritto di cancellazione vs. dati degli altri membri | Schermata della cancellazione | |

## E. Diritti degli interessati e identificazione

| # | Domanda | Perché serve | Da allegare | Risposta |
|---|---|---|---|---|
| E1 | Come si verifica l'identità di un richiedente se l'account non ha email verificata e il recupero usa un codice? Sono accettabili una verifica con domande di sicurezza o un percorso di conferma nell'account? | Evitare la consegna di dati a persone non autorizzate | Schema del recupero | |
| E2 | Per una richiesta di un genitore o di un docente su dati dello studente, quali presupposti servono? | Rappresentanza e minorenni | Caso ipotetico | |
| E3 | Per dati inseriti da un compagno in una classe, come si risponde a una richiesta di accesso o cancellazione di chi non è iscritto? | Dati di terzi | Schema delle classi | |
| E4 | Quale termine si applica (30 giorni nLPD art. 25; un mese nel GDPR)? Se il servizio è offerto a utenti UE, quale termine vale? | Scadenze da rispettare | Procedura richieste | |
| E5 | Il backup JSON soddisfa il diritto di accesso o di portabilità? Cosa va spiegato in più? | Rischio di risposta incompleta | Contenuto del backup (V3) | |

## F. Trasferimenti, fornitori e log

| # | Domanda | Perché serve | Da allegare | Risposta |
|---|---|---|---|---|
| F1 | Cloudflare dichiara l'adesione allo Swiss-U.S. DPF: come si verifica sull'elenco ufficiale, e l'entità contraente per clienti svizzeri quale è? | Base del trasferimento verso gli USA | Link al DPA v6.4 e condizioni self-serve | |
| F2 | In assenza di DPF valido, quale clausola va firmata (clausole standard con adattamenti svizzeri)? Con quale procedura? | Alternativa di garanzia | Stessa documentazione | |
| F3 | Quali dati Cloudflare tratta come titolare autonomo (es. NEL, sicurezza) e come va descritto nell'informativa? | Chiarezza di ruoli | Informativa, bozza | |
| F4 | Se il piano passa a Workers Paid o a Observability (dal 1° dicembre 2026), cosa cambia nell'informativa? | Durate di conservazione dei log | Piano attuale e prezzi | |
| F5 | Il contratto con Gmail per il contatto privacy è sufficiente o serve un canale diverso? | Email con dati personali | Uso previsto della casella | |

## G. Cookie e archivi del browser

| # | Domanda | Perché serve | Da allegare | Risposta |
|---|---|---|---|---|
| G1 | Secondo l'art. 45c LTC e le linee guida IFPDT del 2026, la sessione, IndexedDB per il diario offline e le preferenze sono "strettamente necessari"? Serve un banner? | Decisione sul banner | Inventario archivi (COOKIE-STORAGE) | |
| G2 | Le segnalazioni NEL di Cloudflare richiedono informazione o opt-out? Possono restare? | Trasmissione di dati del browser a un terzo | Documentazione NEL | |
| G3 | Le bozze di archivi per promemoria e installazione (localStorage con finestre di 90 giorni) sono necessarie? | Minimizzazione | Elenco chiavi | |

## H. Classi, contenuti di terzi e segnalazioni

| # | Domanda | Perché serve | Da allegare | Risposta |
|---|---|---|---|---|
| H1 | Serve una procedura formale di segnalazione e rimozione per appunti di classe (contenuti offensivi, dati di minori)? Quali tempi? | Responsabilità del gestore | Schema della moderazione | |
| H2 | In Svizzera, quale responsabilità ha il gestore per contenuti pubblicati da membri di una classe? Esiste una protezione paragonabile all'hosting europeo? | Assetto di responsabilità | Regole d'uso | |
| H3 | Gli appunti di classe possono contenere materiale protetto da diritto d'autore. Quale regola va scritta per la condivisione (LDA art. 68–70; URG art. 19)? | Copyright in aula | Regole d'uso | |
| H4 | Il ritiro di un appunto dopo l'uscita dalla classe lascia copie indipendenti: come va spiegato? | Copie di terzi | Descrizione delle copie | |

## I. Sicurezza, incidenti e valutazione d'impatto

| # | Domanda | Perché serve | Da allegare | Risposta |
|---|---|---|---|---|
| I1 | Quale procedura minima di gestione degli incidenti serve (nLPD art. 24; GDPR artt. 33–34)? Chi notifica e in quanto tempo? | Obbligo di notifica | Bozza della procedura | |
| I2 | Serve un registro delle violazioni anche se vuoto? | Obbligo documentale | Nessuno | |
| I3 | È necessaria una valutazione d'impatto (nLPD art. 22; GDPR art. 35) con dati sanitari e minori, anche per un servizio piccolo? Quale forma basta? | Rischio elevato | Elenco dei trattamenti | |
| I4 | Come si dichiara un canale per segnalazioni di sicurezza senza esporre un indirizzo personale? | Obbligo di risposta | Pagina di sicurezza del repository | |

## J. Condizioni d'uso, accettazione e modifiche

| # | Domanda | Perché serve | Da allegare | Risposta |
|---|---|---|---|---|
| J1 | Le regole d'uso devono essere accettate al primo accesso o bastano come informazione? Come si registra la versione accettata? | Efficacia delle regole | Testo regole d'uso | |
| J2 | Le clausole sull'uso (divieti, responsabilità dell'utente, licenza sui contenuti) sono valide in Svizzera (OR art. 1–2) e in Italia (Codice del consumo artt. 33–36) anche se il servizio è gratuito? | Clausole insolite e vessatorie | Testo regole d'uso | |
| J3 | Come si comunicano modifiche sostanziali senza email nell'account? L'avviso in app è sufficiente? | Modifiche al contratto | Schermata di accesso | |
| J4 | Serve un testo distinto per l'uso scolastico, se il servizio viene adottato da una scuola? | Ruolo e condizioni | Eventuale bozza scuola | |

## K. Appunti da lezione con microfono

| # | Domanda | Perché serve | Da allegare | Risposta |
|---|---|---|---|---|
| K1 | Lo studente che usa un'app per trascrivere in memoria una lezione (senza conservare audio) commette un reato o viola la privacy? Quale differenza fa il consenso dei presenti? | Art. 179bis/179ter StGB e trattamento dei dati di terzi | Descrizione del flusso (LEZIONI-LIVE-AI) | |
| K2 | In Italia, la registrazione per studio personale è ammessa? Che regole della scuola si applicano (regolamento d'istituto, circolari)? | Garante vs. giurisprudenza | Regolamento d'istituto da richiedere alla scuola | |
| K3 | Un'app che distrugge l'audio entro 60 secondi cambia la valutazione? La trascrizione in memoria è un trattamento distinto? | Proporzionalità | Specifiche tecniche (provvisorie) | |
| K4 | Quali condizioni minime servono per un eventuale pilota in una classe? | Prerequisiti prima di ogni prova | Protocollo di pilota (bozza) | |

## L. Assistenti browser

| # | Domanda | Perché serve | Da allegare | Risposta |
|---|---|---|---|---|
| L1 | Se un assistente esterno legge il riepilogo scolastico, chi è responsabile del trattamento successivo? Basta un'informazione e un consenso esplicito al primo utilizzo? | Trasferimento a terzi scelto dall'utente | Descrizione dello strumento `read_school_summary` | |
| L2 | Lo strumento `create_grade` che scrive voti: quali limiti e quale conferma servono? | Integrità dei dati scolastici | Descrizione dello strumento | |

---

## Ordine consigliato per la consulenza

1. **Prima ora:** A1, A2, B1, B2, D3 (decisioni che bloccano il resto).
2. **Seconda parte:** C, D1, D5, E1, E4, F1, I1.
3. **Se c'è tempo:** G, H, J, K, L.

## Documenti da portare

- Informativa, regole d'uso, testo cookie e procedura richieste (bozze in `docs/legal/`).
- Approfondimento legale e analisi di fattibilità (questi due documenti in `docs/`).
- Estratto del DPA Cloudflare e delle condizioni self-serve.
- Tabella dei termini di conservazione.
- Schermate di registrazione, assenze, cancellazione e recupero (versione di produzione).
- Descrizione tecnica dei marcatori di nota eliminata e del Time Travel.

## Nota

Le domande non chiedono di compilare moduli, né richiedono dati di utenti reali. Le risposte vanno lette come pareri personali del professionista e non come certificazione.
