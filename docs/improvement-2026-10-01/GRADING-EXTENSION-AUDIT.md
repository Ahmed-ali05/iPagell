# Estensione dei sistemi di valutazione — analisi e programma

1 ottobre 2026. [Piano](PLAN.md) · [Prompt 10–14](PROMPTS.md) · [Sistema attuale](../GRADING-SYSTEM.md) · [Vista annuale](PERIODS-AUDIT.md)

## Stato e ricerche riutilizzate

Questo documento aggiunge ricerca e pianificazione; non abilita nuove scale e non modifica dati o produzione. Il runtime resta `numeric-1-6`, crescente, sufficienza 4. La scala descrive un metodo, non tutti i percorsi scolastici svizzeri.

La base esiste già e viene conservata:

| Documento | Contributo da riutilizzare | Limite |
|---|---|---|
| [GRADING-SYSTEM](../GRADING-SYSTEM.md) | Scala corrente, inventario dipendenze, tipi numerici/ordinati, proposta di contesto materia–periodo (`SubjectTerm`) | Fondamenta e proposta; nessun selettore o migrazione implementato |
| [Discovery multilingua](../../research/MULTILINGUA-DISCOVERY-2026-09-24.md) | Lingua, formati e contenuti inseriti dagli utenti sono aspetti distinti; schema rigido e preferenza lingua separata | Ricerca del 24 settembre sul multilingua, non catalogo completo delle regole scolastiche |
| [Follow-up SEO](../../research/SEO-FOLLOW-UP-2026-09-24.md) | Sezione «Fondamenta per altri sistemi di valutazione»: configurazione esplicita indipendente da lingua/paese, migrazione compatibile | Le prove live e conteggi riportati si riferiscono al 24 settembre |
| [Product intelligence](../../research/PRODUCT-INTELLIGENCE-2026-09-23.md) | Power Planner come riferimento per voti/GPA e simulazioni; cautela nel trasferire il GPA come metrica principale | Osservazione di prodotto, non fonte per equivalenze scolastiche |
| [Sintesi strategica](../../research/STRATEGIC-SYNTHESIS-2026-09-23.md) | Distinguere orientamento e valutazione; una previsione non deve sembrare un verdetto | Direzione UX, non validazione delle formule |

Verifica aggiornata: lettura di `types/grading.ts`, `types/domain.ts`, `lib/grading.ts`, `lib/calculations.ts`, `lib/validation.ts`, `lib/new-diary.ts`, `lib/grade-average-calculator.ts`, repository diario, storage/backup e componenti Voti/Statistiche/tool browser. Audit tecnico delegato in sola lettura. Fonti scolastiche primarie consultate il 1 ottobre 2026, citate accanto ai fatti sotto. Le proposte sono decisioni di prodotto, non regole ufficiali di promozione.

## Famiglie da supportare e confini

Non basta sostituire il massimo 6 con 10. Un sistema deve dichiarare valori ammessi, direzione, soglia eventuale, precisione, operazioni consentite, regole di aggregazione e stati senza voto. La stessa lingua e lo stesso paese possono usare metodi differenti.

| Famiglia e contesto verificato | Evidenza | Proposta per iPagell |
|---|---|---|
| Voti in decimi, secondaria di primo grado italiana | Il MIM distingue voti in decimi da giudizi sintetici per religione/attività alternativa. [Fonte MIM](https://www.mim.gov.it/ricerca-tag/-/asset_publisher/oHKi7zkjcLkW/content/scuola-secondaria-di-primo-grado) | Primo candidato numerico; definire con scuola/utenti minimo ammesso, decimali e soglia. Non dichiarare un preset unico valido per tutta l’Italia |
| Giudizi sintetici, primaria italiana | L’ordinanza 3/2025 definisce sei giudizi ordinati da ottimo a non sufficiente. [Ordinanza MIM](https://www.mim.gov.it/en/-/ordinanza-n-3-del-9-gennaio-2025) | Etichette e andamento/distribuzione; nessuna media aritmetica ottenuta numerando i giudizi |
| Notazione su 20 e componenti del bac francese | Il Ministero descrive media finale e coefficienti del bac; éduscol ammette coefficienti 0 per escludere valutazioni dal calcolo. [Ministero](https://www.education.gouv.fr/reussir-au-lycee/comment-calculer-votre-note-au-baccalaureat-325511), [éduscol](https://eduscol.education.gouv.fr/5670/le-projet-d-evaluation-en-lycee-general-et-technologique) | Candidato numerico su 20; media personale distinta dall’esito bac. Esclusione esplicita dal calcolo, senza trattarla come assenza o voto zero |
| Scala 1–6 con direzione inversa, scuola a Berlino | SchulG §58 assegna 1 a sehr gut e 6 a ungenügend; distingue anche risultati non valutati. [Norma di Berlino](https://gesetze.berlin.de/bsbe/?query=DOKNR%3Ajlr-SchulGBEV76P58&source=PermaLink) | Prova obbligatoria `lower-is-better`: ordinamento, colori, grafici e simulatore. Non estendere automaticamente regole di Berlino a ogni percorso tedesco |
| IB Diploma Programme | I corsi ricevono risultati 1–7, con 7 migliore; conseguimento diploma dipende anche da core e condizioni complessive. [IB assessment](https://ibo.org/programmes/diploma-programme/assessment-and-exams/understanding-ib-assessment/), [IB passing criteria](https://ibo.org/about-the-ib/what-it-means-to-be-an-ib-student/recognizing-student-achievement/about-assessment/dp-passing-criteria/) | Risultati di corso distinti da punteggi delle prove. Nessuna soglia unica o media di voti inseriti presentata come previsione ufficiale del diploma |
| GCSE in Inghilterra | Ofqual prescrive 9–1, 9 migliore, U per unclassified; double award ha risultati composti. [Ofqual](https://www.gov.uk/government/publications/gcse-9-to-1-qualification-level-conditions/gcse-9-to-1-qualification-level-conditions-and-requirements) | Set discreto + stato U; media non abilitata automaticamente perché le etichette sono numeri. Double award richiede gestione propria |
| Lettere e GPA di istituto | Stanford usa una mappa fino a 4,3, pesata per unità del corso, con regole proprie per simboli inclusi/esclusi. [Stanford GPA](https://studentservices.stanford.edu/my-academics/evaluations-exams-grades/grades/how-do-i-calculate-my-grade-point-average-gpa) | Lettere senza GPA per default; GPA solo come policy esplicita di istituto/versione. Nessuna equivalenza universale A–F → 4,0 |
| Percentuali, punti ottenuti/totali, pass/fail, rubriche | Famiglie candidate di prodotto; nessuna soglia nazionale o policy universale dedotta | Percentuale 0–100 con soglia opzionale. Punti conservati come coppia ottenuti/totale. Pass/fail e criteri di rubrica senza media numerica implicita |

Catalogo iniziale da scegliere con utenti target: mantenere 1–6 corrente e aggiungere pochi profili numerici espliciti in decimi, su 20 e percentuali; provare anche direzione inversa. Ordinali e pass/fail vengono dopo il contratto tipizzato. IB, GCSE, GPA e rubriche complete restano rilasci dedicati finché tutte le regole richieste non sono definite. Queste sono priorità proposte, non domanda di mercato misurata.

## Ostacoli verificati nel codice

| Area | Comportamento corrente | Lavoro necessario |
|---|---|---|
| Tipi | `NumericGradingSystem` descrive range/set e direzione; `OrderedGradingSystem` vieta la media. `Grade.value` è ancora sempre `number` | Capacità del sistema separate dalla rappresentazione del risultato; etichette/stati senza numeri fittizi |
| Validazione/persistenza | `SchoolData.version=1`, schemi `.strict()`, range 1–6 anche per `gradeGoal`; payload JSON completo, nessun riferimento al sistema | Contratto versionato e validazione contestuale condivisa server/storage/backup; aggiungere campi non è compatibile automaticamente |
| Medie e trend | `subjectAverage`, `generalAverage`, `gradeTrend` aggregano numeri senza controllo dei sistemi | Resolver del contesto e verifica di compatibilità prima dell’aritmetica; zero distinto da null; niente media tra sistemi differenti |
| Pesi/esclusioni | `gradeWeight` impone minimo 0,1 e gli schemi ammettono pesi ≥0,1 | Modellare «escluso dalla media» esplicitamente; non introdurre 0 per poi rialzarlo silenziosamente a 0,1 |
| Statistiche | Scala/asse/ticks globali; lista medie filtra `media > 0`; confronto migliore/peggiore usa il preset corrente | Conservare 0 valido, raggruppare per sistema, evitare confronti fra sistemi incompatibili |
| Sufficienza | `isPassingGrade` può restituire null ma la UI usa negazione booleana | Tre stati: soddisfa soglia / sotto soglia / soglia non definita; nessun rosso automatico in assenza di regola |
| Simulatore | Goal globale, slider da sufficienza a massimo, risultato arrotondato sempre verso l’alto, impossibilità confrontata col massimo | Obiettivo per contesto; disabilitazione quando non applicabile. Direzione inversa e set richiedono scelta del valore ammesso che soddisfa la disuguaglianza |
| Parser | `4-5` diventa 4,5 per convenzione corrente | Regola esplicita del preset; non interpretare automaticamente intervalli, plus/minus, U o 18/25 col parser corrente |
| Ingresso e utility | Preset unico, obiettivo iniziale 5; calcolatore pubblico monta `CURRENT_GRADING_SYSTEM`; copy/SEO dichiara 1–6 | Scelta breve e consapevole, utility separata dal diario; metadata e promesse aggiornati solo per sistemi effettivamente disponibili |
| Tool browser | Input schema numerico e range del preset globale | Dichiarare capacità/contesto supportati, rifiutare operazioni non rappresentabili; non scrivere secondo una scala diversa da quella vista |

## Modello proposto e legame con l’anno

Conservare `Subject.id` come materia continua. Il contesto valutativo è interno, non una nuova divisione obbligatoria della navigazione: riprendere `SubjectTerm` come possibile associazione materia–periodo, con riferimento a **definizione di sistema e revisione immutabile**. Lo studente sceglie un default iniziale, con eccezioni visibili per corso/materia; lingua, paese e account non ne determinano automaticamente il significato.

Non copiare la definizione completa su ogni voto, né usare una preferenza globale mutabile per reinterpretare lo storico. Il voto risolve il proprio contesto; una successiva modifica di regole crea una nuova revisione per risultati futuri. Una correzione dei dati storici richiede anteprima e azione esplicita. I pesi/tipi correnti restano retroattivi finché un task distinto non ne cambia la semantica: non inventare pesi storici mancanti.

Per il contratto futuro valutare risultati discriminati: valore numerico, codice di etichetta ordinata, punti ottenuti/totale; stati non valutato/in attesa/esente fuori dai risultati numerici. Rubriche richiedono più criteri e non rientrano semplicemente in un’etichetta. Il tipo attuale non descrive ancora tutti questi casi; nessuna nuova forma è introdotta in questo task.

Nella vista Periodo / Anno / Storico, il registro può mostrare tutti i risultati in ordine temporale con etichetta del sistema. Medie e grafici aggregati usano solo gruppi con la stessa definizione/revisione e policy compatibile, verificata dal resolver. Con sistemi diversi, mostrare riepiloghi separati e una spiegazione breve. Non normalizzare per massimo, percentuale di scala o colore per simulare confrontabilità. Anche due range uguali possono avere ordine, soglie e policy differenti.

La vista annuale può essere implementata prima, mantenendo l’attuale scala unica. Il prompt 09 deve però dichiarare questa precondizione e prevedere l’evoluzione; l’associazione dati non deve riportare il semestre al centro dell’esperienza.

## Matematica e risultati comprensibili

- Media numerica consentita: singoli risultati × peso effettivo, senza arrotondamento intermedio. Media generale: medie materia × coefficienti, solo entro il gruppo compatibile. Le scale ordinali mostrano sequenza, distribuzione e ultimo esito; niente media dei ranghi.
- Punti: 18/25 è 72%, trasformazione aritmetica della prova con denominatore noto. Due prove 18/25 e 90/100 producono **81%** se pesate ugualmente dopo il rapporto; **86,4%** se si sommano punti ottenuti/totali. La policy va scelta e dichiarata, non dedotta. Questo non converte un voto su 6 in uno su 10.
- Simulazione: sui numerici si risolve l’obiettivo nel medesimo contesto; per direzione inversa si verifica una disuguaglianza opposta. Per un set si cerca un risultato ammesso; arrotondare alla mezza unità non è una regola universale. Su giudizi/GPA/qualifiche senza policy completa, la simulazione resta assente con spiegazione.
- Una media calcolata dai dati personali non diventa automaticamente voto ufficiale, esito di promozione, diploma o GPA. Il copy deve nominare l’operazione realmente supportata.

## Compatibilità e sequenza di lavoro

1. **Ricerca mirata:** poche famiglie, percorso/istituto/livello espliciti, input grezzi vs risultati finali, fonti datate, regole mancanti e utenti target. Nessuna necessità di completare tutti i paesi prima del primo rilascio numerico.
2. **Decisione di dominio:** definizione/revisione, contesto continuo della materia, capacità e aggregazioni; prototipo UX con dati sintetici prima del codice persistente.
3. **Contratto e migrazione isolata:** mantenere invariati ID e numeri legacy assegnandoli al sistema corrente; mappare i contesti necessari senza accorpare omonimi. Definire versione diario/API/backup separatamente; valutarne l’evoluzione senza inventare una migrazione D1 necessaria solo perché il payload cambia.
4. **Compatibilità client:** un vecchio client `.strict()` non può leggere campi nuovi. Un client con cache vecchia non deve poter salvare uno snapshot V1 sopra un diario esteso. CAS protegge concorrenza, non sostituisce un gate di formato/capacità verificato atomicamente nella scrittura, senza finestra fra controllo e aggiornamento. Prima di opt-in, rendere espliciti aggiornamento richiesto, rifiuto sicuro delle scritture incompatibili, recupero delle bozze e coesistenza PWA/due dispositivi.
5. **Primo rilascio numerico:** pochi profili verificati, feature flag di disponibilità, selezione iniziale semplice e override contestuale. Backup/import e server pronti prima di abilitare nuove scritture. La utility pubblica può avere un ciclo autonomo in memoria; non equivale al supporto nel diario.
6. **Qualitativi e metodi complessi:** etichette/pass-fail, poi punti, componenti fisse, rubriche o GPA con policy proprie. Composizione 60% teoria / 40% pratica non equivale a peso per singolo voto: richiede regole per componenti vuote, esclusioni e arrotondamento.
7. **Rollout/rollback:** profili legacy non richiedono azione degli utenti; abilitazione graduale dopo prove. Tornare al vecchio codice non consente leggere un nuovo formato: rollback deve preservare dati nuovi, disabilitando nuove scritture o usando un reader compatibile. Nessun downgrade distruttivo.

## Criteri di accettazione e verifiche future

| Caso | Risultato richiesto |
|---|---|
| Diario/backup legacy, Appunti e classi | Stessi ID, risultati, pesi e media; nessuna perdita di note/riferimenti; V1/V2/V3 letti secondo contratto storico |
| Numerico con zero valido | 0 resta un voto reale nelle liste/medie; null e «non valutato» restano distinti |
| Sistema inverso | 1 migliore di 6; soglia 4 del profilo di prova, colori/ordinamento e simulazione coerenti; esempio 2 e 4 di pari peso → media 3 |
| Soglia assente | Nessun giudizio di insufficienza implicito e nessuna ReferenceLine fittizia |
| Set discreto/etichetta | Input fuori set respinto; media derivata distinta dall’input ammesso; giudizi senza media o simulatore arbitrari |
| Anno con più periodi | Aggregato pesato corretto solo entro sistema compatibile; stesso registro continuo e gruppi separati se cambia scala |
| Punti e componenti | 81% vs 86,4% secondo policy dichiarata; componente mancante/esclusa con regola esplicita |
| Cambio lingua/sistema | Lingua non cambia voti; cambio sistema non riscrive il passato; annullamento conserva valori e contesto |
| Vecchio client e offline | Nuovo diario protetto da scritture legacy, bozze esportabili, retry senza perdita; verifica con due versioni reali, non solo stub |
| Backup/sync/tool browser | Round-trip con revisione di sistema, rifiuto schema sconosciuto e nessun fallback a 1–6; permessi, CAS e isolamento account mantenuti |
| UX/SEO | it/de/fr/en, mobile, tastiera, temi; scale disponibili dichiarate con precisione, nuove keyword solo dopo supporto reale |

Verifiche eseguite per questa aggiunta: ricerca documentale, lettura del codice e consultazione delle fonti. Nessuna nuova prova runtime o migrazione; i 106 test/146 check API del rilascio 28 non attestano supporto multi-sistema. Controllo finale di inventario/link e diff registrato nel rapporto del programma.
