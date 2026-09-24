# Product intelligence per iPagell — osservazione del 23 settembre 2026

## Scopo, metodo e limiti

Ricerca esplorativa su nove prodotti. Fonti primarie pubbliche, consultate il **23-09-2026**: siti dei produttori, pagine di supporto e policy. Ho ispezionato visivamente nel browser le landing di MyPlusPoints, School Companion, Power Planner, MyStudyLife, Todoist, StudySmarter, Forest e Goblin Tools. Non ho creato account, acquistato piani, installato app o provato flussi riservati agli utenti. Le schermate prodotto mostrate nelle landing sono **materiale promozionale**, non una prova indipendente del comportamento corrente. Prezzi e funzionalità possono variare per paese, piattaforma e data.

**Legenda epistemica:** **F** = fatto osservato nella fonte indicata; **I** = interpretazione del problema risolto o del compromesso; **P** = principio generale; **A** = possibile applicazione a iPagell, da validare e non decisione di implementazione. **NV** = non verificabile dalle fonti pubbliche consultate. Le debolezze sono inferenze esplicite, salvo quando la fonte dichiara un limite.

### Punto di partenza iPagell

Il codice corrente descrive un diario personale con voti, medie, agenda, assenze, statistiche e attività di classe sottoscrivibili in un'agenda privata; la landing promette uno spazio personale distinto da quello condiviso. La sincronizzazione distingue copia locale e account, con stati offline/conflitto. Fonti locali verificate: [`app/page.tsx`](../app/page.tsx), [`components/ipagell-app.tsx`](../components/ipagell-app.tsx), [`hooks/use-diary.ts`](../hooks/use-diary.ts). I documenti storici sono serviti da mappa, non da prova dello stato live. Questa ricerca **non** verifica la produzione né definisce una roadmap.

## Indice dei casi e delle evidenze

Tutti gli URL sotto sono stati osservati il **23-09-2026**. `V` indica anche ispezione visiva della landing; `T` testo pubblico; `S` supporto/policy. Le URL sono conservate per permettere una nuova verifica.

| ID | Prodotto / relazione | Evidenze primarie | Stato |
|---|---|---|---|
| C1 | MyPlusPoints / diretto, voti CH | [landing](https://www.mypluspoints.ch/de/) | V,T |
| C2 | School Companion / diretto, planner CH | [landing](https://schoolcompanion.ch/), [privacy](https://schoolcompanion.ch/privacy/) | V,T,S |
| C3 | Power Planner / diretto, voti + planner | [landing](https://powerplanner.net/), [privacy](https://powerplanner.net/privacy) | V,T,S |
| C4 | MyStudyLife / diretto, planner studente | [landing](https://mystudylife.com/), [tour](https://mystudylife.com/tour/), [piani](https://mystudylife.com/msl-plus/) | V,T |
| A1 | Todoist / produttività generale | [landing](https://www.todoist.com/), [funzioni](https://www.todoist.com/features), [prezzi](https://www.todoist.com/pricing/), [notifiche](https://www.todoist.com/help/todoist/features/manage-your-notifications-in-todoist-QxQGXkMu), [sync](https://www.todoist.com/help/todoist/troubleshooting/troubleshoot-syncing-issues-in-todoist-d6dDzzpF) | V,T,S |
| A2 | StudySmarter / apprendimento | [landing](https://www.studysmarter.co.uk/), [study plan](https://www.studysmarter.co.uk/features/study-plan/) | V,T |
| A3 | Forest / focus consumer | [landing e piani](https://www.forestapp.cc/) | V,T |
| A4 | Finch / benessere consumer | [prodotto](https://finchcare.com/about-finch), [guida iniziale](https://help.finchcare.com/hc/en-us/articles/42149821015693-New-User-Guide), [home](https://help.finchcare.com/hc/en-us/articles/37780000231309-Exploring-the-Finch-Home-Page), [prezzi](https://help.finchcare.com/hc/en-us/articles/38755205001869-Finch-Plus-Pricing), [backup](https://help.finchcare.com/hc/en-us/articles/41834952026381-Accounts-and-Cloud-Backups) | T,S |
| E1 | Goblin Tools / pattern emergente | [landing](https://www.goblin.tools/), [Magic ToDo](https://goblin.tools/ToDo), [Taskmaster](https://goblin.tools/Taskmaster), [about](https://goblin.tools/About), [privacy](https://goblin.tools/Privacy) | V,T,S |

## Schede prodotto

### C1 — MyPlusPoints

**Fatto osservato.** Target dichiarato: ginnasiali in Svizzera; promessa: registrare voti e calcolare media e pluspoints necessari per superare il semestre. Posizionamento stretto e locale. La landing ha hero viola pieno, titolo bianco grande a sinistra, mockup di telefono a destra, CTA primaria «Zur App» e secondaria «Mehr erfahren». Tipografia sans leggibile; layout a sezioni con funzionalità, quattro passi, FAQ e testimonianze. In app il mockup mostra dashboard con media, pluspoints e materie espandibili; non è una prova di uso reale. Navigazione pubblica per funzioni, funzionamento, testimonianze e FAQ. Onboarding dichiarato: aprire la web app senza installazione, creare semestre, aggiungere materie, inserire voti. Mobile PWA e desktop; dark mode. Il sito dichiara uso senza registrazione, account facoltativo per cloud sync; tutte le funzioni gratuite. Ritorno implicito: aggiungere nuovi voti e monitorare andamento. **NV:** microcopy degli stati vuoti, errori, conferme, navigazione interna effettiva e qualità della sincronizzazione. [C1](https://www.mypluspoints.ch/de/)

**Interpretazione.** Il prodotto riduce una domanda scolastica ansiosa («passo il semestre?») a indicatori immediati. La specificità locale fa sembrare pertinente il calcolo, ma una metrica sintetica può sovrastimare la validità rispetto alle regole di singoli istituti.

**Principio generale.** Una metrica è convincente quando il suo contesto e la regola di calcolo sono comprensibili; la prova di utilità può precedere l'account.

**Possibile applicazione a iPagell.** Studiare se il primo valore percepito sia capire una media o organizzare un impegno. Eventuali simulazioni richiedono formule esplicite e disclaimer contestuali sulle regole scolastiche. **Da non trasferire:** trattare i pluspoints di una scuola/cantone come criterio universale; ridurre tutto a un punteggio.

### C2 — School Companion

**Fatto osservato.** Target dichiarato: studenti svizzeri dalla secondaria alla formazione professionale; promessa: orario, esami, voti, focus e gruppi in un'app gratuita iOS/Android, senza abbonamento. Landing azzurro chiarissimo, testo scuro, hero a due colonne e mockup mobile con «adesso», «prossimo», verifiche e settimana; app store come CTA. Tipografia sans robusta, molte superfici bianche e colori per materia. Menu landing minimo; screenshot di tab bar mobile con cinque destinazioni. Onboarding descritto in tre passi: download, inserimento unico dell'orario, uso continuativo. La home promozionale privilegia **il prossimo momento** più della media; gli screenshot mostrano calendario, voti/obiettivo, studio e social. Microcopy pratico e locale; la landing espone una calcolatrice Matura senza login e dichiara che i dati restano sul dispositivo. Ritorno: prossima lezione, countdown esami, promemoria e sessioni di studio. La privacy policy specifica dati di account/scuola, assenza di pubblicità di terzi, social opzionale e informazioni visibili nei gruppi; la pagina web dichiara niente cookie/analytics. **NV:** stati vuoti, errori, conferme in app e precisione del sync offline. [C2 landing](https://schoolcompanion.ch/) · [C2 privacy](https://schoolcompanion.ch/privacy/)

**Interpretazione.** Un prodotto «compagno della giornata» ottiene ritorno naturale dalla variabilità dell'orario; il calcolatore senza account dà un assaggio di valore. Le funzioni social aumentano utilità e superficie di esposizione dei dati.

**Principio generale.** La home funziona quando risponde alla domanda più frequente nel momento d'uso; una prova gratuita può rendere verificabile la promessa.

**Possibile applicazione a iPagell.** Confrontare in ricerca utenti la domanda «cosa devo fare ora?» con «come sto andando?». Valutare solo dopo evidenza se serva un assaggio senza registrazione. **Da non trasferire:** orario, gruppi o gamification come obblighi di categoria; default social che facciano sembrare condivisi i voti personali.

### C3 — Power Planner

**Fatto osservato.** Target: studenti che gestiscono compiti, orari e voti/GPA. Promessa «ultimate homework planner», cross platform. Landing con barra navy, hero blu scuro a gradiente, titolo bianco centrato e link agli store; visuale più funzionale che emotiva. Tipografia sans, sezioni a griglia di funzionalità e CTA di download/login. Navigazione pubblica essenziale (Support, Login). La pagina descrive assignment, esami, media, modalità «What If?», reminder, widget e calendario Google. Onboarding non illustrato passo per passo; l'account online è facoltativo secondo la policy, che distingue account locale e cloud. Home/dashboard e navigazione interna non verificati in sessione; la promessa suggerisce panoramica compiti+voti. Ritorno: scadenze, reminder, orario e widget. Privacy policy: account locale senza raccolta dei dati inseriti; account online con dati nel database, telemetria di affidabilità e trasferimento negli USA dichiarati. Modello: free più Premium una tantum sotto $5, con limiti su voti/semestre nella versione gratuita. **NV:** empty states, messaggi di errore/conferma e UX mobile effettiva. [C3 landing](https://powerplanner.net/) · [C3 privacy](https://powerplanner.net/privacy)

**Interpretazione.** Il vantaggio è la copertura dei casi accademici con un prezzo prevedibile. La densità di funzioni e la promessa totale possono far crescere il costo iniziale di configurazione.

**Principio generale.** La scelta esplicita fra locale e sync è anche una scelta di fiducia; il modello commerciale influenza la percezione di stabilità.

**Possibile applicazione a iPagell.** Usare come benchmark della chiarezza su dove risiedono i dati, non della lista di feature. **Da non trasferire:** GPA come metrica primaria per il contesto svizzero/italiano; enfasi «ultimate» se i flussi reali restano più specifici.

### C4 — MyStudyLife

**Fatto osservato.** Target: studenti, con pagine anche per famiglie e scuole. Promessa: un luogo unico per orario, compiti, esami, revisioni e coach AI. La landing osservata usa blu/bianco, header semplice con CTA «Open web app», hero tipografico a sinistra e mockup di telefono/web a destra; molte sezioni di prova sociale, metodo, tour, FAQ e privacy. Sans geometrica; headline dominante, elementi secondari colorati per categoria. Onboarding dichiarato: account, orario digitato o scansione di foto, reminder; tour afferma revisione/conferma dopo la scansione. Home promozionale: settimana integrata, non solo elenco di task. Navigazione pubblica verso tour, genitori, about e study tips; navigazione interna non verificata. Microcopy orientato a calma/controllo; CTA gratuite e trial del piano. Ritorno: impegni, reminder, widget, focus, calendario, piani di revisione. Mobile/web/offline dichiarati. Sito dichiara dati non venduti, assenza di annunci, export/cancellazione; non ho verificato indipendentemente la policy o il flusso. Piani: core gratuito ma pagina MSL+ indica limite di cinque task attivi, abbonamento premium e trial; la pagina media indica $6.99/mese o $39.99/anno. **NV:** empty states, errori, conferme e comportamento reale dell'AI. [C4 landing](https://mystudylife.com/) · [tour](https://mystudylife.com/tour/) · [piani](https://mystudylife.com/msl-plus/) · [media](https://mystudylife.com/media/)

**Interpretazione.** La scansione aggredisce il lavoro preliminare che spesso blocca un planner. Il limite di cinque task potrebbe incidere proprio nel momento di bisogno intenso: è un compromesso commerciale, non un principio UX.

**Principio generale.** Automazione utile = tempo risparmiato **più** controllo per correggere i dati importati. La promessa «tutto in uno» deve mantenere una gerarchia chiara.

**Possibile applicazione a iPagell.** Indagare quanto pesa l'inserimento iniziale di materie e attività; prototipare import solo se l'errore è correggibile e la provenienza evidente. **Da non trasferire:** AI coach o vista genitori come scorciatoia strategica; cap sulle attività come pattern neutro per studenti.

### A1 — Todoist

**Fatto osservato.** Target ampio vita/lavoro; promessa di fare chiarezza e catturare task rapidamente. Landing italiana osservata: bianco caldo, arancio come CTA, headline molto grande a sinistra, visual a destra, prova sociale vicina all'azione; banner cookie separato e leggibile. Sans, spaziature generose, navigazione per soluzioni/risorse/prezzi. La pagina funzioni descrive Quick Add in linguaggio naturale, task ricorrenti, Today/Upcoming. La CTA «Inizia gratis» è ripetuta. Home/dashboard di account, empty states e conferme non verificati. Supporto documenta notifiche configurabili (riepilogo mattina, review serale, celebrazioni) e precauzione esplicita: non cancellare cache/local data prima di recuperare modifiche non sincronizzate. Mobile app e desktop sono dichiarati; pricing gratuito + Pro da US $5/utente/mese fatturato annualmente nella pagina consultata. Ritorno: compiti del giorno, ricorrenze, notifiche e Karma. Privacy/trust è affrontata in supporto e impostazioni; nessun test dell'effettiva gestione. [A1 landing](https://www.todoist.com/) · [funzioni](https://www.todoist.com/features) · [prezzi](https://www.todoist.com/pricing/) · [notifiche](https://www.todoist.com/help/todoist/features/manage-your-notifications-in-todoist-QxQGXkMu) · [sync](https://www.todoist.com/help/todoist/troubleshooting/troubleshoot-syncing-issues-in-todoist-d6dDzzpF)

**Interpretazione.** La velocità di cattura sostiene l'abitudine più della ricchezza di categorie. Il documento sul sync mostra che la fiducia si costruisce anche nei fallimenti, con istruzioni che proteggono il lavoro dell'utente.

**Principio generale.** Prima ridurre il tempo fra intenzione e registrazione; poi rendere visibile lo stato reale dei dati e il recupero.

**Possibile applicazione a iPagell.** Osservare se «aggiungi voto/attività» richiede scelte che rallentano studenti di fretta; misurare anche comprensione di «salvato sul dispositivo» contro «salvato nell'account». **Da non trasferire:** date in linguaggio naturale senza affidabilità locale; KPI di completamento/Karma applicati meccanicamente alla scuola.

### A2 — StudySmarter

**Fatto osservato.** Target: studenti che devono imparare contenuti e preparare esami. Promessa «make learning easy» con materiali, flashcard, note, test, ripetizione dilazionata e AI. Landing osservata con hero azzurro chiaro, titolo blu a sinistra, mosaico di grandi riquadri blu/viola/turchese e mockup mobili a destra; CTA nera «Get started for free», prova sociale subito sotto. Sans grande, griglia modulare; menu separa contenuti, funzioni, risorse. La pagina menziona una home con attività quotidiane, calendar/to-do e feedback immediato; immagine promozionale, non test autenticato. Onboarding non documentato nei dettagli; la landing invita a creare o trovare materiali. Ritorno: sessioni di ripasso, spaced repetition, progressi, quiz e library. Mobile, tablet e laptop dichiarati. Modello free con Premium esistente, prezzo preciso **NV** dalle fonti primarie consultate; trattamento privacy specifico **NV** in questa ricognizione. Empty states, errori e conferme **NV**. [A2 landing](https://www.studysmarter.co.uk/) · [study plan](https://www.studysmarter.co.uk/features/study-plan/)

**Interpretazione.** L'unità di valore è una sessione di apprendimento, non la registrazione di un voto. L'ampiezza del catalogo e dell'AI può facilitare l'accesso ai contenuti ma rendere meno chiaro quale sia il prossimo passo.

**Principio generale.** Il feedback immediato ha senso quando segue una pratica che cambia la competenza; una dashboard deve distinguere «da fare» da «imparato».

**Possibile applicazione a iPagell.** Tenere separato il significato di performance scolastica e padronanza di un argomento. Valutare qualsiasi spazio studio solo rispetto a un bisogno confermato e alla qualità delle spiegazioni. **Da non trasferire:** claim di miglioramento voti o generazione AI come prova di apprendimento.

### A3 — Forest

**Fatto osservato.** Target: persone che vogliono evitare distrazioni, inclusi studenti. Promessa: tempo ben speso che fa crescere un albero/una foresta. La landing osservata usa verde scuro, grafica di un germoglio luminoso, titolo bianco centrato e CTA degli store in basso; navigazione ridotta a menu. La visualizzazione dà un'anteprima del meccanismo prima della lista di feature. La pagina descrive timer, blocco distrazioni, foresta cumulativa, statistiche, stagioni e sessioni con amici. Onboarding e home in app non testati; il ciclo dichiarato è avviare sessione, restare concentrati, ottenere albero. Microcopy «mindful» e incoraggiante; conferma di completamento implicita nell'albero, ma errore/empty state **NV**. Mobile iOS/Android, estensione browser e uso offline core dichiarati. Ritorno: crescita visibile, collezione, eventi stagionali, sfide; la regola «se lasci, l'albero muore» è esplicitata. Free con annunci occasionali fuori dalle sessioni e Plus in abbonamento; prezzo locale **NV**. Sito afferma dati di sessione privati/non venduti. [A3 landing e FAQ](https://www.forestapp.cc/)

**Interpretazione.** La metafora trasforma tempo astratto in memoria visiva. La perdita dell'albero crea incentivo forte, ma può aggiungere pressione a chi è già ansioso.

**Principio generale.** Un rituale di ritorno funziona quando rende tangibile un progresso autentico; il costo emotivo del fallimento va calibrato.

**Possibile applicazione a iPagell.** Esplorare feedback di progresso comprensibile e non punitivo per attività completate. **Da non trasferire:** penalità per giorni saltati, «streak» del voto, pubblicità vicino a dati scolastici sensibili.

### A4 — Finch

**Fatto osservato.** Target: cura quotidiana di sé; promessa di piccoli passi con un compagno virtuale. Pagina prodotto con narrazione in tre passi e illustrazioni del pet; stile morbido, colori pastello, sans arrotondata, CTA app mobile. Navigazione pubblica per spiegazione/guide; home in app documentata dal supporto: goal giornalieri, pet, avventura e tab Home/Quests/Shop/Friends/Bag. Onboarding: pet e pochi goal predefiniti, prima avventura presto; gli eventi stagionali si aprono dopo tre giorni. Microcopy esplicitamente gentile; guida spiega streak riparabili, per continuità senza perfezionismo. Empty states/errori/conferme **NV**. iOS/Android. Ritorno: dialogo quotidiano col pet, avventure, personalizzazione e ricompense. Core gratuito; Plus opzionale, supporto indica $9.99/mese o $69.99/anno USD, con variazioni in app possibili. La guida backup dice che l'account crea backup cifrato su server ogni 24 ore durante l'uso; questo non equivale a sync immediato. [A4 prodotto](https://finchcare.com/about-finch) · [guida](https://help.finchcare.com/hc/en-us/articles/42149821015693-New-User-Guide) · [home](https://help.finchcare.com/hc/en-us/articles/37780000231309-Exploring-the-Finch-Home-Page) · [prezzi](https://help.finchcare.com/hc/en-us/articles/38755205001869-Finch-Plus-Pricing) · [backup](https://help.finchcare.com/hc/en-us/articles/41834952026381-Accounts-and-Cloud-Backups)

**Interpretazione.** Il prodotto usa relazione affettiva e piccoli successi per ridurre la soglia del primo gesto; la densità di reward/shop può diventare rumore per chi cerca solo una risposta rapida.

**Principio generale.** Un ritorno sano premia il passo reale e permette di riprendere dopo interruzioni senza vergogna.

**Possibile applicazione a iPagell.** Testare tono incoraggiante negli empty states e nei periodi senza dati. **Da non trasferire:** pet, monete e negozio in un diario di voti; pressione a registrare qualcosa ogni giorno quando non c'è nulla da registrare.

### E1 — Goblin Tools

**Fatto osservato.** Target dichiarato soprattutto persone neurodivergenti davanti a compiti percepiti come troppo grandi. Promessa: piccoli strumenti per una difficoltà alla volta. Landing osservata su bianco, verde lime come accento, logo/emoji, griglia di carte con nome e beneficio di ciascun microstrumento; gerarchia estremamente diretta. Tipografia sans ordinaria e layout modulare; navigazione per strumenti, lingua, Pro. CTA è la carta del tool, non un funnel lungo. Magic ToDo scompone un compito; Taskmaster guida un elemento per volta con timer e suggerimento «what next». L'empty state di Taskmaster è esplicito («Nothing in this tab yet. Add some items in Magic Todo first.»); conferma positiva «All done in this tab!». Errori AI **NV**; la pagina About avverte che l'output è congettura e va giudicato dall'utente. Web gratuito senza ads/paywall; app mobili a basso costo e Pro opzionale per sync, cronologia e template. Privacy: senza Pro impostazioni e testo restano locali salvo input necessari inviati ai provider AI; con Pro alcune liste/storici stanno sul server. Ritorno: uso situazionale quando ci si blocca, non un rituale quotidiano. [E1 landing](https://www.goblin.tools/) · [Magic ToDo](https://goblin.tools/ToDo) · [Taskmaster](https://goblin.tools/Taskmaster) · [About](https://goblin.tools/About) · [Privacy](https://goblin.tools/Privacy)

**Interpretazione.** Il prodotto preferisce un insieme di «porte» specializzate a una dashboard universale. Il beneficio è basso carico iniziale; il costo potenziale è frammentazione e affidamento a output AI variabile.

**Principio generale.** Quando l'utente è bloccato, restringere il campo a un prossimo passo può valere più di mostrare l'intero sistema.

**Possibile applicazione a iPagell.** Studiare microaiuti contestuali nei flussi complessi, con possibilità di correggere e ignorare suggerimenti. **Da non trasferire:** scomposizione AI automatica di qualunque compito scolastico, soprattutto se usa dati personali senza chiarezza su invio e conservazione.

## Sintesi trasversale: problemi prima dei pattern

| Problema ricorrente | Soluzioni osservate | Principio comune | Tensione da studiare per iPagell |
|---|---|---|---|
| «Dove sono adesso?» | C1 media/pluspoints; C2 prossima lezione; A1 Today; A4 goal odierni | Home come risposta alla domanda frequente, non indice di tutto | Stato del rendimento e prossimo impegno competono per la prima posizione. Servono osservazioni d'uso, non una fusione automatica. |
| «È troppo faticoso iniziare» | C1 prova senza account; C2 calcolatore senza login; C4 scansione orario; E1 un tool alla volta; A4 goal iniziali | Anticipare un risultato utile e ridurre input preliminare | L'account e il primo semestre di iPagell vanno valutati in termini di tempo al primo valore, senza inventare dati demo. |
| «Posso fidarmi dei miei dati?» | C3 locale/cloud espliciti; C2 privacy dei gruppi; C4 export/delete; A1 guida al recupero sync; E1 confine locale/AI | Fiducia concreta = destinazione, accesso, stato, recupero | iPagell ha una distinzione privata/condivisa e locale/account: comunicarla al momento dell'azione conta più di uno slogan privacy. |
| «Perché dovrei tornare?» | C2 orario; C4 reminder; A1 Today; A2 ripasso; A3 foresta; A4 pet | Il ritorno deve corrispondere alla frequenza naturale del lavoro | I voti non arrivano ogni giorno. Una streak giornaliera incentiverebbe interazioni vuote o ansia. |
| «Che cosa faccio dopo?» | C4 piano di revisione; A1 Quick Add/Today; A2 feedback; E1 Taskmaster | Ridurre l'ambiguità del prossimo passo | Un suggerimento può aiutare solo se poggia su dati affidabili e non sembra un giudizio sullo studente. |

### Pattern ricorrenti

1. **Vista temporale integrata** (C2, C3, C4, A1): riunisce scadenze che altrimenti stanno in luoghi diversi. La differenza reale è che cosa la home considera urgente.
2. **Colori con funzione semantica** (C1, C2, C4, A2): materia/tipo di attività si riconoscono a colpo d'occhio. Serve sempre un'etichetta testuale e contrasto adeguato.
3. **Primo risultato anticipato** (C1, C2, E1, A4): valore prima del setup completo. Si ottiene anche con scopi più stretti, non necessariamente con AI.
4. **Privacy narrata per confini d'uso** (C2, C3, C4, E1): «locale/cloud», «gruppo/personale», «input AI/server» sono più concreti di «sicuro».

### Pattern emergenti e idee insolite

- **AI come interfaccia di inserimento e pianificazione** (C4, E1; anche A2): promette minor fatica. Problema irrisolto: provenienza dei dati, errore silenzioso, costo, privacy e capacità di correzione. Da trattare come ipotesi.
- **Strumento specialistico accessibile senza account** (C2 calcolatore, E1 tool): può dimostrare competenza prima di chiedere impegno, ma deve evitare di confondere una simulazione con un risultato ufficiale.
- **Ritorno non quotidiano** (E1 uso quando bloccati, C1 nuovo voto): un prodotto può essere prezioso senza aprirsi ogni giorno. Questo contraddice metriche consumer standard basate su streak/DAU.
- **Progressione gentile e riparabile** (A4) contro perdita simbolica (A3): stesso scopo di continuità, diversa risposta emotiva. Nella scuola il costo psicologico conta.

### Convenzioni ormai standard nel campione

Landing con promessa sintetica, mockup prodotto e CTA visibile; mobile con navigazione compatta; piano free per iniziare; reminder configurabili dove il tempo conta; FAQ su sync/privacy/prezzo; prova sociale. Sono convenzioni di orientamento, **non** prova che una specifica implementazione migliori iPagell.

### Opportunità poco esplorate nel campione

- Spiegare **perché** una media cambia, non solo mostrarla, mantenendo tracciabilità di pesi e formule.
- Presentare lo stato del salvataggio con linguaggio comprensibile e azioni di recupero nel momento di errore; A1 tratta la questione nel supporto, ma nel campione non emerge come promessa centrale.
- Rendere esplicita la differenza fra attività condivisa e interpretazione personale (completamento, promemoria, materia locale), senza trasformare la classe in un social network.
- Progettare un empty state onesto per i giorni tranquilli: «nessun impegno registrato» non equivale a «nessun impegno reale».

### Contraddizioni da mantenere aperte

| Approccio A | Approccio B | Domanda di ricerca |
|---|---|---|
| C1/C3: stato dei voti come centro | C2/C4/A1: tempo e prossima azione come centro | Quale domanda porta davvero lo studente ad aprire iPagell nei diversi momenti del semestre? |
| C3: account locale facoltativo | C4: account iniziale e sync ovunque | Quale soglia di fiducia e continuità serve a iPagell, dato il suo modello attuale? |
| A3: conseguenza forte della distrazione | A4: recupero senza vergogna | Quale feedback sostiene autonomia senza aumentare ansia scolastica? |
| C4/A2: prodotto ampio e AI | E1: tool piccoli e indipendenti | Il problema è mancanza di funzioni o difficoltà ad arrivare a quella giusta? |
| C2: gruppi e amici | C1: diario strettamente personale | Quale informazione è davvero utile condividere, e con chi? |

## Ipotesi di ricerca successive, non roadmap

1. Intervistare/osservare studenti su tre momenti: prima lezione, dopo un nuovo voto, sera prima di una verifica. Annotare prima domanda, tempo al risultato e incomprensioni.
2. Testare in prototipo tre gerarchie della home (prossimo impegno, andamento, mix) con gli **stessi** dati realistici e senza claim di successo inventati.
3. Chiedere agli utenti di spiegare a voce chi vede un'attività di classe e chi vede voto, assenza e completamento; verificare il modello mentale, non solo il testo letto.
4. Valutare con studenti il tono degli stati vuoti, dei promemoria e dei conflitti di sync, inclusa la capacità di recuperare il proprio lavoro.
5. Ripetere la ricognizione con account di prova e dispositivi reali solo in una fase autorizzata, per verificare navigazione interna, errori, conferme, accessibilità e prezzo locale. Questa fonte pubblica non li certifica.

## Regola di riuso

Ogni pattern qui resta collegato al **problema** che sembra risolvere, all'**evidenza** e al **limite della verifica**. Per proporlo a iPagell occorrono un bisogno utente osservato, un criterio di successo, un rischio noto e una verifica nel contesto del prodotto. La presenza presso un competitor non basta.
