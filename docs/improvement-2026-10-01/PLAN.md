# iPagell — programma di miglioramento dell’ingresso e del prodotto

Piano del **1 ottobre 2026**. [Prompt operativi](PROMPTS.md) · [Audit SEO](SEO-AUDIT.md) · [Prodotto e account](AUTH-PRODUCT-AUDIT.md) · [UX visiva](UX-VISUAL-AUDIT.md) · [Verifiche](VERIFICATION.md) · [Materie e andamento annuale](PERIODS-AUDIT.md) · [Altri sistemi di valutazione](GRADING-EXTENSION-AUDIT.md) · [Workflow e modelli](WORKFLOW-MODELS.md)

## Obiettivo e stato

Una persona nuova deve capire cosa fa iPagell, per chi è, la scala 1–6 e come ottenere il primo risultato. Il programma distingue interventi consegnabili ora, evoluzione dell’identità e miglioramenti delle schermate quotidiane. Sono stati impiegati tre agenti di ricerca specialistici; integrazione, modifica del checkout, verifica browser e pubblicazione appartengono all’agente responsabile del sito.

Le analisi iniziali sono fotografie del codice prima di questo intervento, non guide del prodotto dopo le modifiche. I prompt sono istruzioni riutilizzabili per attività successive, non script automatici e non incarichi già avviati in altri chat.

**Primo ciclo implementato e pubblicato in Sites 28:** landing e metadati in quattro lingue; Appunti visibili; calcolatore nel primo blocco; scala dichiarata; benefici e tre passi; privacy corretta; registrazione con progressione e aiuto; mostra/nascondi password; nome e materie nel setup, semestre/date in sezione espandibile; errore nel passaggio dal codice recupero senza scartare il codice; guida alla prima azione in Home, senza trattare chi ha già appunti come diario completamente vuoto. La conferma della sessione verifica l’identità prima di smontare il form. Sono mantenuti i default delle materie e delle date, le API, gli account e i dati esistenti. Migliorati alcuni contrasti e focus; nessun nuovo sistema grafico o schema DB.

**PERIODS-01 completato e pubblicato in Sites 29:** filtri annuale/storico implementati, verificati e pubblicati; evidenze e limiti nel rapporto. **IDENTITY-ARCH-01 / W7 completato:** decisione e revisione del prompt 04 nell’audit account; implementazione W8/W9 ancora pianificata, provider e nuove migrazioni non disponibili. **Pianificato:** estensione dei metodi di valutazione con sistema indipendente dalla lingua e protezione dello storico; Google, Apple ed email verificata. L’accesso pubblicato continua a usare username/password e codice di recupero. I provider verranno mostrati soltanto quando funzionanti. Home, Agenda, Voti, Classi, Appunti e coerenza generale hanno prompt separati e criteri propri. L’audit non certifica indicizzazione Google, conversione o usabilità con persone reali.

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
| IDENTITY-01 | P1: recupero dipende dal codice e nessun accesso standard | Progetto Google/email/Apple; vedi audit e prompt 04–05 | Account takeover, perdita ID o accesso legacy | Espansione additiva + cutover/contrazione verificati, linking e provider reali; rollback alla versione compatibile e gate risolti |
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

Conservare `accounts.id`, relazioni, IndexedDB e classi. Separare identità provider da account: `issuer + subject` identifica il provider, non l’email. Nessuna unione automatica basata su email. Collegamento da account esistente con ri-autenticazione e prova della nuova identità; scollegamento solo con altro metodo utilizzabile. La decisione W7 include schema, token monouso, callback Apple POST, email relay, sessioni e revoca nell’[audit account](AUTH-PRODUCT-AUDIT.md): espansione additiva, contrazione esplicita delle colonne legacy dopo prove e rollback alla versione W8-A compatibile; i flag da soli non annullano la migrazione.

Dipendenze concrete: client Google e consent screen, account/key/Services ID Apple e prerequisiti applicazione, servizio email transazionale/sender verificato e supporto, segreti nel runtime Sites, ambiente isolato per migrazioni e prove, verifica dell’idoneità delle callback sulla piattaforma. Queste informazioni non sono presenti nel checkout e non sono state inventate. Per implementare chiedere al proprietario soltanto i dati mancanti dopo avere preparato schema/piano verificabile; non salvare segreti nei prompt.

## Sequenza e responsabilità

1. Analisi codice/SEO, prodotto/account e UX visiva indipendenti; integrazione in questo piano.
2. Primo ciclo ingresso e setup; verifica e pubblicazione sul Sites esistente.
3. Materia continua/anno: prompt 09 sulla scala corrente, senza migrazione. Ricerca e architettura multi-sistema con prompt 10–11 possono procedere prima o in parallelo alla vista annuale, senza bloccarla; numeric rollout 12 solo dopo contratto/compatibilità, poi cicli 13 e QA 14.
4. Identity architect + security reviewer: scelta adapter, espansione schema e contrazione verificata, recovery e linking. Backend engineer: implementazione isolata; QA: legacy/provider e migrazione. Owner: configurazioni esterne.
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

Questo ciclo non è incluso in Sites 28. **PERIODS-01 / W1 completato, Sites 29**, nella sessione corrente: scope UI condiviso, anno iniziale del periodo corrente, medie dei singoli voti, storico e destinazione esplicita nel nuovo voto. Nessuna migrazione. Audit e criteri in PERIODS-AUDIT.md; evidenze nel rapporto VERIFICATION.md. Il successivo ciclo architettura identità/prompt 04 è ora chiuso come W7, senza patch runtime.


## Estensione oltre la scala attuale

L’[analisi dedicata](GRADING-EXTENSION-AUDIT.md) riprende GRADING-SYSTEM.md e le ricerche iniziali multilingua/SEO/prodotto. Non occorre ricominciare: i tipi numerici e ordinati sono già preparati, ma diario, UI e persistenza supportano soltanto `numeric-1-6`. Il catalogo candidato comprende decimi, su 20, percentuali/punti, scale inverse e successivamente giudizi, lettere e metodi di certificazione; priorità da validare con utenti, senza attribuire una scala automaticamente al paese o alla lingua.

La materia resta continua. Un sistema/revisione appartiene al contesto valutativo; cambi futuri non riscrivono i risultati vecchi. Nella lettura annuale possono convivere più metodi, con registro unico e medie/grafici separati quando incompatibili. Nessuna media dei ranghi, GPA universale o conversione basata sul massimo della scala. Server, client offline/PWA e backup vanno progettati insieme: gli schemi attuali strict e il salvataggio dell’intero snapshot impediscono di trattare questa estensione come sola impostazione grafica.

Cinque prompt aggiunti (10–14): ricerca delle regole, modello/compatibilità, primo rilascio numerico, cicli qualitativi/complessi e QA. Sono nuovi incarichi riutilizzabili, non implementazioni avviate o sistemi già disponibili in produzione. La vista annuale è chiusa in Sites 29; la scelta multi-sistema resta preparazione indipendente prima delle patch numeriche.


## Modelli e percorso operativo completo

Preferenza operativa del proprietario: **GPT-6.1 Sol high** per responsabile, analisi e subagenti/reviewer; Astra solo in extremis con approvazione esplicita per lo specifico incarico, mai avviato autonomamente. I registri storici conservano i modelli effettivi.

Il [workflow operativo](WORKFLOW-MODELS.md) assegna modelli/effort e revisione a tutti i 14 prompt, distingue i sottocicli UX e qualitativi, definisce dipendenze esterne, parallelismo, criteri di chiusura e previsione delle sessioni. Ordine operativo aggiornato alla richiesta corrente: annuale → architettura identità → account Google/email e Apple quando configurabile → Home/Agenda/Voti/Appunti/Classi/coerenza → scale numeriche → metodi complessi → verifica complessiva e SEO misurata. Gli audit 01–03 si aggiornano soltanto per differenze pertinenti. Le ricerche identità/valutazioni possono procedere in sola lettura durante i cicli UI; le patch a contratti condivisi vengono integrate una alla volta. Le stime sono ipotesi da aggiornare con i consuntivi, non scadenze garantite.


## Registro del ciclo PERIODS-01 — 1 ottobre 2026

- Stato: **completato**; implementazione e QA locali concluse, pubblicazione Sites **29** riuscita. Partenza Git `a1ebee6`; Sites corrente 28 confermato dal connettore, domini canonico/www e TLS attivi. Conservati gli aggiornamenti documentali preesistenti non committati.
- Prompt applicato integralmente: **09**, con PERIODS-AUDIT e precondizione numeric-1-6 di GRADING-EXTENSION-AUDIT. Responsabile unico per patch/browser/deploy; Sol high in sola lettura per UI e Astra medium per aggregazioni e revisione. Nessuna impostazione globale modificata.
- Risultato: filtro di consultazione separato dal periodo di scrittura, materia continua e scope condivisi Voti/Statistiche, conteggi/provenienza/dettaglio periodi, anno nel trend cumulativo, recupero dallo scope vuoto e nuova destinazione esplicita. Anni con etichetta diversa restano distinti; archiviati e omonimi preservati. Simulatore limitato a Periodo/Anno e riferito ai voti visualizzati. Corretto anche il peso futuro effettivo 0,01 nel simulatore.
- Commit applicativo `02cb8843867987dbb3552e049fd1aecd5f755352`, deployment `appgdep_6abe8ea156008191bdddc2141ffb5162` succeeded; verifiche e riferimenti completi nel [rapporto esistente](VERIFICATION.md); una build o un commit non chiude il rilascio. Residui trasversali: device fisici, revisione madrelingua e prove utenti, senza bloccare questo ciclo.
- Prossima sessione raccomandata: **prompt 04 / W7**, architettura Google, Apple ed email, prima di 05; nessun provider va mostrato prima della configurazione e prova reale.


## Registro IDENTITY-ARCH-01 / W7 — 1 ottobre 2026

- Stato: **completato come architettura**, prompt 04 letto integralmente; baseline Git `199215c`, checkout iniziale pulito. Nessuna implementazione provider, migrazione eseguibile, cambio UI o pubblicazione. Produzione Sites 29 riconfermata attiva/pubblica, canonico/www/TLS active tramite connettore.
- Risultato nell’[audit account esistente](AUTH-PRODUCT-AUDIT.md): adapter oauth4webapi + jose proposto, credenziali separate e ID/handle stabili, espansione 0007 non autorevole seguita da versione compatibile/fencing/cutover 0008 senza DROP parent; rollback solo a W8-A compatibile. Linking/ultimo metodo atomici, reauth provider fresca, browser epoch e cookie tardivo, email dopo verifica/scanner, Apple form_post/relay/revoca, matrice test e configurazioni precise.
- Analisi indipendenti iniziali Astra high concluse prima della nuova preferenza del proprietario; **revisione finale Sol 6.1 high**. Da ora responsabile/subagenti/reviewer Sol high; Astra solo in extremis con approvazione esplicita per incarico. Nessuna modifica globale.
- Verifiche: confronto codice/schema/storage/ownership, fonti primarie, review fresca e check repository; limiti/prove nel [rapporto](VERIFICATION.md). SQLite in memoria è solo prova esplorativa; D1 locale fermato dal sandbox prima SQL. Nessuna prova provider reale o SameSite nel browser, e nessun risultato del rilascio 29 attribuito ai nuovi provider.
- Commit documentale: ricavabile con `git log --grep='document identity architecture'`; nessun deploy per questo ciclo solo documentale. Questa registrazione evita uno SHA autoreferenziale.
- Prossimo ciclo raccomandato: **W8-A / prompt 05**, circoscritto a compatibilità credenziali/guardie e difetti security/cleanup già verificati, in ambiente isolato; prima della contrazione serve restore/prova migrazioni. Google/email richiedono configurazioni esterne e reauth reale prima del rollout; Apple W9 separato. Se un sottociclo viene bloccato da questi gate, registrarlo e proseguire con W2 / 06 A su checkout stabile. Nessun ciclo successivo avviato in questa sessione.


## Ripresa W8-A — 17 ottobre 2026

Implementazione e QA **locali completati** per espansione 0007, adattatore legacy/credentials e correzioni security; [rapporto dedicato](AUTH-COMPATIBILITY-W8A.md). W8 complessivo resta aperto: nessun rilascio intermedio, cutover operativo, restore o provider reale. 135 test app, 8 test D1 dedicati, 146 controlli API e build locale; browser login/settings/logout sintetico. Il checkout trovato era già ampiamente modificato dopo W7: preservato, nessun commit complessivo o deploy. Non usare la consegna storica Sites 29 come stato live corrente. Prossimo: gate operativi/restore e release W8-A prima di W8-B; configurazioni provider soltanto nel relativo sottociclo.
