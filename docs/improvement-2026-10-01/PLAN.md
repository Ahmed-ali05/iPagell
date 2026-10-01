# iPagell — programma di miglioramento dell’ingresso e del prodotto

Piano del **1 ottobre 2026**. [Prompt operativi](PROMPTS.md) · [Audit SEO](SEO-AUDIT.md) · [Prodotto e account](AUTH-PRODUCT-AUDIT.md) · [UX visiva](UX-VISUAL-AUDIT.md) · [Verifiche](VERIFICATION.md) · [Materie e andamento annuale](PERIODS-AUDIT.md) · [Altri sistemi di valutazione](GRADING-EXTENSION-AUDIT.md)

## Obiettivo e stato

Una persona nuova deve capire cosa fa iPagell, per chi è, la scala 1–6 e come ottenere il primo risultato. Il programma distingue interventi consegnabili ora, evoluzione dell’identità e miglioramenti delle schermate quotidiane. Sono stati impiegati tre agenti di ricerca specialistici; integrazione, modifica del checkout, verifica browser e pubblicazione appartengono all’agente responsabile del sito.

Le analisi iniziali sono fotografie del codice prima di questo intervento, non guide del prodotto dopo le modifiche. I prompt sono istruzioni riutilizzabili per attività successive, non script automatici e non incarichi già avviati in altri chat.

**Primo ciclo implementato e pubblicato in Sites 28:** landing e metadati in quattro lingue; Appunti visibili; calcolatore nel primo blocco; scala dichiarata; benefici e tre passi; privacy corretta; registrazione con progressione e aiuto; mostra/nascondi password; nome e materie nel setup, semestre/date in sezione espandibile; errore nel passaggio dal codice recupero senza scartare il codice; guida alla prima azione in Home, senza trattare chi ha già appunti come diario completamente vuoto. La conferma della sessione verifica l’identità prima di smontare il form. Sono mantenuti i default delle materie e delle date, le API, gli account e i dati esistenti. Migliorati alcuni contrasti e focus; nessun nuovo sistema grafico o schema DB.

**Pianificato:** materia continua con filtri Periodo / Anno scolastico / Tutto lo storico; estensione dei metodi di valutazione con sistema indipendente dalla lingua e protezione dello storico; Google, Apple ed email verificata. L’accesso pubblicato continua a usare username/password e codice di recupero. I provider verranno mostrati soltanto quando funzionanti. Home, Agenda, Voti, Classi, Appunti e coerenza generale hanno prompt separati e criteri propri. L’audit non certifica indicizzazione Google, conversione o usabilità con persone reali.

## Mappa del prodotto e del primo percorso

| Schermata | Domanda della persona | Azione primaria | Informazione progressiva |
|---|---|---|---|
| Landing | A cosa mi serve? | Crea il diario | Prova media senza account; dettagli delle funzioni e FAQ |
| Accesso | Come ritrovo il mio diario? | Accedi | Recupero e nuovo account |
| Registrazione | Cosa devo scegliere? | Nome utente e password | Regole e spiegazione del recupero |
| Recupero iniziale | Come proteggo l’accesso? | Conserva il codice e continua | File da scaricare; non saltare la conferma |
| Setup | Da cosa parto? | Nome e materie | Semestre, date, scuola |
| Home | Cosa devo fare ora? | Prima materia/attività o prossimo impegno | Medie, appunti e approfondimenti |
| Agenda | Cosa preparo e quando? | Apri/completa o aggiungi attività | Filtri, provenienza classe, calendario/elenco |
| Voti | Come vado in questa materia? | Aggiungi voto | Pesi, simulazioni e statistiche |
| Appunti | Dove ritrovo quello che studio? | Apri/scrivi nota | Copie, export e gestione materie |
| Classi | Cosa abbiamo condiviso? | Attività/appunti della classe | Inviti, membri, ruoli e amministrazione |

Percorso attuale: landing → account → codice di recupero → setup → prima materia/voto/scadenza/appunto → primo risultato. Invito classe, lingua e intenzione di ingresso devono sopravvivere al percorso. Le sezioni app sono stato client dentro `/app`; non aggiungere route pubbliche per fingere contenuti indicizzabili.

## Backlog con priorità, rischi e completamento

| ID | Priorità e problema osservato | Intervento e file | Rischio da proteggere | Criterio di completamento |
|---|---|---|---|---|
| ENTRY-01 | P1: titolo generico, valore e Appunti poco spiegati | Hero, quattro benefici, prova senza account e tre passi; `landing-content`, CSS marketing, cataloghi | Sovraccarico di CTA e promesse non implementate | Primo blocco spiega diario scolastico; un’azione primaria; quattro lingue e 320/390 px leggibili |
| SEO-01 | P1: H1 usato anche come titolo ricerca | Title/description dedicati in `public-page`, cataloghi e test | Doppio brand, canonical/hreflang errati | HTML SSR delle otto route con metadati coerenti; pagine personali escluse dall’indicizzazione |
| TRUST-01 | P1: privacy descrive solo attività di classe | Appunti personali distinti dai condivisi | Promettere che tutte le note siano private | Copy coerente con permessi e pubblicazione esplicita; flag Classi di produzione verificato |
| AUTH-01 | P1: passi e credenziali poco comprensibili | Progressione, aiuti, password visibile su richiesta; `account-gate` | Perdita recovery dopo rete fallita | Codice resta disponibile con retry; nessun cambiamento ai contratti server |
| SETUP-01 | P1: cinque campi prima del primo valore | Configurazione progressiva nel medesimo form | Campi richiesti nascosti invalidi; valori persi | Valori precompilati inviati; apertura/edit date funzionante; errore correggibile |
| START-01 | P1: Home nuova non spiega risultato | Frase contestuale e rispetto appunti esistenti; `ipagell-app` | Falsi inviti a ricominciare e nessun dato sintetico come reale | Materia → primo voto/attività funziona; Home con sole note non dice di iniziare il diario |
| PERIODS-01 | P1: voti e andamento spezzati nel solo semestre; statistiche vuote con storico presente | Filtro di lettura anno/storico separato dal periodo di inserimento; `ipagell-app`, `stats-view`, selettori dedicati | Media delle medie scorretta, ID fittizi, accorpamenti per nome, pesi storici reinterpretati | Materia continua su più periodi; media su tutti i voti pesati; dettaglio per periodo; nuovo voto con destinazione esplicita; nessuna migrazione |
| GRADING-01 | P1: solo numeric-1-6, nessun contesto/schema persistito | Ricerca e modello multi-sistema con prompt 10–11; primo ciclo numerico 12, qualitativi 13 e QA 14; grading/domain/validation/calculations/storage/backup/UI | Reinterpretazione storico, vecchi client strict, medie di scale incompatibili, zero scartato e simulazioni inverse errate | Profili documentati; contesto/revisione espliciti; legacy identico; gate antidowngrade atomico; annuale separato per sistema; round-trip e journey verificati |
| IDENTITY-01 | P1: recupero dipende dal codice e nessun accesso standard | Progetto Google/email/Apple; vedi audit e prompt 04–05 | Account takeover, perdita ID o accesso legacy | Migrazione additiva + linking verificato + prove provider reali; gate esterni risolti |
| SETUP-02 | P2: default agosto–gennaio e preset italiani | Onboarding consapevole di periodo/lingua | Cambio dati storici o scala implicita | Nuovi default localizzati e scelti esplicitamente; diari esistenti invariati |
| FLOW-01 | P2: primo ingresso materia apre impostazioni generali | Entrata diretta gestore materie nel contesto | Perdita stato/bozze | Primo dato creato senza ricerca in impostazioni; ritorno coerente |
| VISUAL-01 | P2: contrasto testo piccolo/tema scuro | Token e testo preview | Mutare significato colore materia/stati | Contrasti misurati e focus visibile; controllo browser light/dark |
| DAILY-01 | P2: coerenza dei flussi quotidiani da validare | Cicli Home/Agenda/Voti/Appunti/Classi | Flush editor, contesto e dati pendenti | Journey completi con dati vuoti/pochi/molti e ritorno corretto |

Il primo ciclo copre ENTRY-01, SEO-01, TRUST-01, AUTH-01, SETUP-01, START-01 e parte VISUAL-01. La verifica effettiva è registrata separatamente; una voce implementata non equivale a tutte le prove superate.

## Direzione estetica

Preservare viola del brand, testo scuro, fondi neutri e superfici chiare. Riservare colore pieno all’azione primaria e al contenuto prioritario; usare bordi, testo e spaziatura per il resto. Conservare colori materia con etichetta testuale. Titoli brevi ma specifici; valori e scadenze prima dei metadati; margini più compatti all’ingresso; niente metriche a zero decorative. Testo secondario leggibile, focus visibile, controlli tattili e fallback senza hover.

Le viste non devono tutte imitare dashboard a card. Agenda privilegia attività e giorni, Voti materia/media, Appunti testo e ricerca, Classi contenuti condivisi. Amministrazione e azioni distruttive restano secondarie. I dettagli tecnici di sync compaiono solo quando aiutano a risolvere un problema reale.

## Percorso account standard

Scelta iniziale proposta: Google e email/password verificata, mantenendo accesso username per utenti esistenti. Apple segue il gate Apple Developer/app primaria/Services ID. Non usare la sessione ChatGPT come identità iPagell; il sito pubblico mantiene autorizzazione propria.

Conservare `accounts.id`, relazioni, IndexedDB e classi. Separare identità provider da account: `issuer + subject` identifica il provider, non l’email. Nessuna unione automatica basata su email. Collegamento da account esistente con ri-autenticazione e prova della nuova identità; scollegamento solo con altro metodo utilizzabile. Il piano completo include schema, token monouso, callback Apple POST, email relay, sessioni, revoca e rollback per flag nell’[audit account](AUTH-PRODUCT-AUDIT.md).

Dipendenze concrete: client Google e consent screen, account/key/Services ID Apple e prerequisiti applicazione, servizio email transazionale/sender verificato e supporto, segreti nel runtime Sites, ambiente isolato per migrazioni e prove, verifica dell’idoneità delle callback sulla piattaforma. Queste informazioni non sono presenti nel checkout e non sono state inventate. Per implementare chiedere al proprietario soltanto i dati mancanti dopo avere preparato schema/piano verificabile; non salvare segreti nei prompt.

## Sequenza e responsabilità

1. Analisi codice/SEO, prodotto/account e UX visiva indipendenti; integrazione in questo piano.
2. Primo ciclo ingresso e setup; verifica e pubblicazione sul Sites esistente.
3. Materia continua/anno: prompt 09 sulla scala corrente, senza migrazione. Ricerca e architettura multi-sistema con prompt 10–11 possono procedere prima o in parallelo alla vista annuale, senza bloccarla; numeric rollout 12 solo dopo contratto/compatibilità, poi cicli 13 e QA 14.
4. Identity architect + security reviewer: scelta adapter, schema additivo, recovery e linking. Backend engineer: implementazione isolata; QA: legacy/provider e migrazione. Owner: configurazioni esterne.
5. Product designer + frontend engineer: Home/primo valore, poi Agenda/Voti, poi Appunti/Classi. Conservare flussi già corretti.
6. Accessibility/QA: journey, mobile, tastiera, temi, testi lunghi e dati realistici.
7. Release owner: check/build, sorgente esatto, Domains/Sites, deployment riuscito. Dopo: SEO con Search Console e test con nuovi utenti.

## Misure da raccogliere senza inventare risultati

Test con nuovi utenti: dopo cinque secondi, chiedere cosa fa il prodotto, chi inserisce i dati e quale azione partirebbe; annotare le risposte. Journey: decisioni e passaggi fino a primo dato utile, punti di abbandono, ritorno dopo annullamento/errore. Misurare in seguito query/impression/click e URL indicizzati tramite Search Console. Nessun dato personale dei form in analytics; nessuna baseline numerica disponibile in questo task. Deploy e metadati corretti preparano l’indicizzazione, non la garantiscono.


## Decisione sui semestri dopo la richiesta aggiuntiva

Il limite è verificato nel codice: `Subject` non contiene un riferimento al semestre, mentre `Grade` contiene sia `subjectId` sia `semesterId`. Il workspace filtra l’elenco voti prima di passarlo a Voti e Statistiche; il confronto storico di Statistiche non è un andamento annuale e viene nascosto quando il periodo attivo non ha voti.

Proposta prioritaria: rendere **la materia il centro della consultazione** e aggiungere i filtri **Periodo / Anno scolastico / Tutto lo storico**. All’ingresso di Voti, orientare alla vista dell’anno corrente e offrire il dettaglio per periodo; la scelta precisa del default si verifica nel ciclo dedicato. In lettura mostrare anche conteggio voti, periodo di provenienza e andamento cronologico cumulativo. Periodi conservati come organizzazione e destinazione delle scritture, senza imporli all’intera esperienza.

La prima implementazione richiede selettori condivisi e stato UI, senza ristrutturare dati persistenti. `currentSemesterId` resta un ID reale per scritture/compatibilità: nessun valore speciale «tutti» nel payload. Il form di nuovo voto deve mostrare dove verrà registrato e permettere scegliere un periodo reale; un filtro storico non può spostare un voto automaticamente. Home, Agenda, Assenze e promemoria non cambiano ambito per un filtro di consultazione dei voti.

L’anno si ricava dai periodi con la stessa etichetta `schoolYear`, mostrando eventuali incongruenze legacy e permettendo scelta esplicita. Non accorpare materie omonime con ID diversi né anni dal testo incerto. Una futura entità Anno scolastico è una seconda fase solo se risolve ambiguità effettive. Gli appunti sono già legati alla materia senza semestre e mantengono questo comportamento.

Media annuale: aggregare i singoli voti con peso voto × peso tipo, usando le funzioni esistenti. Non fare la media delle medie dei semestri: con 6 di peso 1 e 4 di peso 3, il risultato è 4,5, non 5. È una media calcolata dei risultati registrati, non un voto ufficiale annuale. I pesi/tipi attuali ricalcolano anche il passato; non esistono snapshot storici da inventare. Il grafico deve dichiarare se mostra voto singolo o media cumulativa.

Questo ciclo è **pianificato, non incluso nel primo rilascio dell’ingresso**. Audit e criteri completi in PERIODS-AUDIT.md; prompt 09 dedicato. Priorità successiva consigliata: PERIODS-01 prima di una rifinitura estetica delle viste quotidiane.


## Estensione oltre la scala attuale

L’[analisi dedicata](GRADING-EXTENSION-AUDIT.md) riprende GRADING-SYSTEM.md e le ricerche iniziali multilingua/SEO/prodotto. Non occorre ricominciare: i tipi numerici e ordinati sono già preparati, ma diario, UI e persistenza supportano soltanto `numeric-1-6`. Il catalogo candidato comprende decimi, su 20, percentuali/punti, scale inverse e successivamente giudizi, lettere e metodi di certificazione; priorità da validare con utenti, senza attribuire una scala automaticamente al paese o alla lingua.

La materia resta continua. Un sistema/revisione appartiene al contesto valutativo; cambi futuri non riscrivono i risultati vecchi. Nella lettura annuale possono convivere più metodi, con registro unico e medie/grafici separati quando incompatibili. Nessuna media dei ranghi, GPA universale o conversione basata sul massimo della scala. Server, client offline/PWA e backup vanno progettati insieme: gli schemi attuali strict e il salvataggio dell’intero snapshot impediscono di trattare questa estensione come sola impostazione grafica.

Cinque prompt aggiunti (10–14): ricerca delle regole, modello/compatibilità, primo rilascio numerico, cicli qualitativi/complessi e QA. Sono nuovi incarichi riutilizzabili, non implementazioni avviate o sistemi già disponibili in produzione. La vista annuale resta il prossimo ciclo pratico; la scelta architetturale multi-sistema viene preparata accanto a quel lavoro.
