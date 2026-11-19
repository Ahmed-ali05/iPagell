# iPagell — Buone pratiche aziendali applicabili al servizio

Data: **15 ottobre 2026**. Perimetro: prodotto, sviluppo, dati e gestione operativa di iPagell.

**Aggiornamento del 17 ottobre 2026:** l’[approfondimento operativo](APPROFONDIMENTO-OPERATIVO-BUONE-PRATICHE-2026-10-17.md) aggiorna le priorità alla luce del codice locale W8-A e propone dieci attività con dipendenze e criteri di completamento. Pulizia locale della cancellazione e redazione dei log risultano ora implementate nel checkout; non ne è attestata qui la pubblicazione. È presente anche una suite D1 dedicata, ancora separata dalla CI ordinaria. Le descrizioni successive restano l’analisi datata 15 ottobre e vanno lette con questa integrazione.

## 1. Risultato dell’analisi

**iPagell dispone già di diverse basi tecniche solide. Il maggiore miglioramento verso una gestione professionale consiste nel rendere verificabili ripristino, qualità dei percorsi critici, controllo degli accessi e risposta ai problemi.** Prima di aggiungere infrastrutture o funzioni, occorre poter rispondere a quattro domande: i dati si recuperano? Ci accorgiamo di un guasto? Sappiamo intervenire? Sappiamo che una modifica non ha compromesso le operazioni principali?

Questo rapporto confronta le evidenze della repository con pratiche pubblicate da Google/SRE e DORA, GitHub, NIST, OWASP, W3C, FinOps Foundation e GOV.UK. Sono riferimenti con ruoli diversi: esperienza aziendale, standard, linee guida e gestione di servizi pubblici. **Non dimostrano che tutte le aziende adottino ogni pratica né che tutte siano necessarie per iPagell.** Le proposte sono adattamenti al servizio, non una certificazione o un obbligo legale generalizzato.

La precedente [analisi legale](ANALISI-CONFORMITA-LEGALE-2026-10-15.md) resta distinta: questo documento non sostituisce i suoi interventi su minori, informativa, fornitori, conservazione e diritti.

**Solo analisi e documentazione:** non sono stati modificati codice applicativo, dipendenze, account, database, domini o hosting. Non sono stati avviati monitoraggi, scansioni, benchmark, test con utenti, test applicativi o pubblicazioni. Le attività successive sono proposte, non operazioni eseguite.

## 2. Metodo, stato delle evidenze e proporzionalità

Letti [AGENTS.md](../AGENTS.md), [snapshot](REPO-SNAPSHOT.md), [architettura](ARCHITECTURE-CURRENT.md), [matrice](VERIFICATION-MATRIX.md), [sicurezza](../SECURITY.md), [manutenzione](MANUTENZIONE.md), [pubblicazione](DEPLOYMENT.md), workflow e parti del codice/test pertinenti. I risultati dei test descritti nei documenti sono **evidenze storiche**: non sono stati rieseguiti in questa analisi.

Non sono stati ispezionati pannelli amministrativi, fatture, metriche di produzione, impostazioni GitHub remote o contratti. L’assenza di un’evidenza nella repository non prova l’assenza della misura sul provider. I rilievi sul codice si riferiscono al checkout corrente, che contiene modifiche preesistenti: non è stata attestata l’equivalenza integrale con la pubblicazione online.

Stati usati:

- **Presente:** implementazione o procedura individuata; non implica una verifica completa del suo funzionamento in produzione.
- **Parziale:** parte del presidio esiste, ma manca una prova, un’automazione o una responsabilità.
- **Da accertare:** dipende da configurazioni esterne o informazioni non disponibili.
- **Futuro:** utile soltanto al verificarsi di una crescita, un accordo o una nuova funzione.

Priorità: **P0** = fondamenti da trattare per primi; **P1** = consolidamento prioritario; **P2** = miglioramento successivo; **P3** = condizionale. Non sono gravità CVSS né scadenze imposte.

Impegno relativo: **S** = decisione/configurazione o attività circoscritta; **M** = più componenti e verifiche; **L** = lavoro trasversale o infrastrutturale. Sono ordini di grandezza, non preventivi; capacità del provider e persone disponibili possono cambiarli.

## 3. Mappa delle aree analizzate

| ID | Area | Stato attuale osservabile | Priorità | Impegno iniziale |
|---|---|---|---|---|
| BP-01 | Responsabilità, rischi e continuità del gestore | Documentazione presente; reperibilità e sostituzione non dimostrate | P0 | S |
| BP-02 | Accessi amministrativi e account utente | Autenticazione presente; accessi provider da accertare | P0 amministratori / P1 utenti | S–M |
| BP-03 | Sicurezza applicativa e abusi | Controlli presenti; verifica strutturata incompleta | P1 | M |
| BP-04 | Privacy e ciclo di vita dei dati | Lacune documentate nel rapporto legale | P0 | M–L |
| BP-05 | Backup, ripristino e portabilità | Export presente; restore infrastrutturale non dimostrato | P0 | M–L |
| BP-06 | Monitoraggio e obiettivi di affidabilità | Stati client presenti; monitoraggio operativo non dimostrato | P0 | M |
| BP-07 | Incidenti e supporto operativo | Indicazioni tecniche presenti; canale/reperibilità non definiti | P0 | S–M |
| BP-08 | Rilasci, ambienti e migrazioni | Procedura presente; isolamento e gate da consolidare | P1 | M |
| BP-09 | Test dei percorsi critici | Suite presenti; API e browser fuori dalla CI ordinaria | P1 | M |
| BP-10 | Dipendenze e catena di fornitura software | Audit/lockfile presenti; Actions a tag e patch da mantenere | P1 | S–M |
| BP-11 | Integrità, offline e conflitti | Difese implementate; prove fisiche e di aggiornamento aperte | P1 | M |
| BP-12 | Prestazioni e capacità | Ottimizzazioni/prove locali presenti; dati reali insufficienti | P1 | M |
| BP-13 | Costi e sostenibilità economica | Quote tecniche presenti; budget operativo da accertare | P1 | S–M |
| BP-14 | Usabilità, accessibilità, lingue e dispositivi | Iterazioni documentate; ricerca e copertura completa mancanti | P1 | M |
| BP-15 | Ricerca utenti e misurazione del prodotto | Piani presenti; risultati comportamentali non dimostrati | P2 | S–M |
| BP-16 | Supporto utenti e sicurezza delle classi | Moderazione tecnica presente; processo da definire | P1 | M |
| BP-17 | Manutenibilità e conoscenza del progetto | Buona mappa documentale; gestione del lavoro da consolidare | P2 | S–M |
| BP-18 | Fornitori, uscita dal servizio e nuove funzioni AI | Hosting identificato; continuità e nuove funzioni da qualificare | P1 fornitori / P3 estensioni | M–L |

## 4. Analisi e attività concrete

### BP-01 — Responsabilità chiare e gestione dei rischi

**Pratica di riferimento.** Assegnare le decisioni, conoscere risorse e dipendenze e preparare la continuità anche in organizzazioni piccole. NIST propone un percorso specifico per piccole e medie realtà, non soltanto per grandi imprese. [NIST SP 1300](https://csrc.nist.gov/pubs/sp/1300/final).

**iPagell.** Le guide indicano come lavorare, ma [manutenzione](MANUTENZIONE.md) lascia aperte responsabilità operative, monitoraggio e reperibilità. Non è accertato chi possa intervenire se il gestore abituale è indisponibile.

**Da pianificare:** una scheda con responsabile del servizio, referente tecnico, contatti, chi può pubblicare/ripristinare e gestione delle emergenze. Aggiungere un registro breve dei rischi con impatto, probabilità motivata, misura, responsabile e prossima revisione; includere rinnovo dominio, perdita credenziali e indisponibilità del fornitore.

**Criterio di chiusura:** per un guasto ipotetico è chiaro chi decide e dove trova le istruzioni. Se il progetto è individuale, documentare realisticamente questo limite; non inventare un team o una copertura 24/7.

### BP-02 — Proteggere prima gli accessi con maggiore impatto

**Pratica di riferimento.** Privilegi minimi, autenticazione forte per accessi sensibili, recupero sicuro e verifica delle azioni critiche. [OWASP — autenticazione](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html).

**iPagell.** Cookie HttpOnly/Secure, password con scrypt, digest di sessioni/recupero, rate limiting e riautenticazione per operazioni di sicurezza sono presenti. Non risultano MFA o passkey per gli utenti; stato di MFA, ruoli e recupero su hosting/GitHub/dominio non accertato. Fonti: [auth](../lib/server/auth.ts), [password](../lib/server/password.ts), [API sicurezza](../app/api/auth/security/route.ts).

**Da pianificare:** inventario degli amministratori e controllo MFA/passkey sui servizi che lo supportano; credenziali individuali, recupero protetto e revoca accessi non necessari. Per gli utenti valutare elenco/revoca sessioni, prevenzione delle password compromesse e recupero più accessibile. Provider social, email o passkey richiedono un progetto di migrazione che preservi identità e dati, non una semplice aggiunta grafica.

**Criterio di chiusura:** accessi amministrativi verificati e recuperabili; nessuno può ottenere dati scolastici tramite una richiesta di supporto non verificata. Non introdurre cambi password periodici indiscriminati come sostituto delle difese utili.

### BP-03 — Verifica di sicurezza basata sui rischi

**Pratica di riferimento.** Usare requisiti verificabili e un modello delle minacce, anziché trattare il solo audit delle dipendenze come prova di sicurezza. [OWASP ASVS](https://owasp.org/projects/asvs), [OWASP — threat modeling](https://cheatsheetseries.owasp.org/cheatsheets/Threat_Modeling_Cheat_Sheet.html).

**iPagell.** Controlli di origine, query parametrizzate, autorizzazioni server, limiti dei corpi e rendering chiuso degli appunti sono presenti; esistono prove API contro accessi impropri. Non è dimostrata una revisione indipendente completa. [HTTP](../lib/server/http.ts), [repository note](../lib/server/note-repository.ts), [suite API](../tests/api-smoke.mjs).

**Da pianificare:** descrivere attaccanti e confini di fiducia per account, inviti, ruoli, import, testi e assistenti browser. Selezionare requisiti ASVS pertinenti, registrandone versione, evidenza e motivazione degli esclusi. Verificare intestazioni di sicurezza effettive online; valutare CSP gradualmente rispetto agli script esistenti, senza applicare regole che rompano il servizio. Provare abuso e isolamento in ambiente dedicato.

**Criterio di chiusura:** elenco finito di controlli con esiti riproducibili e correzioni prioritarie. I browser non autenticati o gli ID arbitrari non devono permettere lettura/scrittura altrui. Nessuna scansione offensiva della produzione è stata eseguita.

### BP-04 — Privacy integrata nelle decisioni tecniche

**Pratica applicata proposta.** Ogni nuova funzione deve dichiarare dati necessari, destinatari, copie, conservazione e cancellazione. Per gli obblighi e le fonti normative rimanda al [rapporto legale](ANALISI-CONFORMITA-LEGALE-2026-10-15.md); qui si tratta di organizzare il lavoro tecnico.

**iPagell.** La separazione diario/classe e l’anteprima prima della pubblicazione sono buone basi. Restano i punti già identificati su cancellazione locale, account incompleti/proprietari di classi, snapshot e tool browser. Non sono nuovi problemi accertati in produzione in questa seconda analisi.

**Da pianificare:** integrare nei criteri di completamento una mappa del ciclo di vita dei dati; usare dataset sintetici; vietare testi di appunti, password, recuperi e inviti nei log ordinari. Mantenere un’unica lista degli interventi legali e collegarla alle attività tecniche, evitando due backlog contraddittori.

**Criterio di chiusura:** una modifica che introduce un dato spiega anche come cancellarlo e come verificarlo; informativa e comportamento restano coerenti.

### BP-05 — Il backup vale quando il recupero è provato

**Pratica applicata proposta.** Distinguere continuità del servizio, recupero dopo errore e copia esportata dall’utente. Definire **RPO** — perdita temporale massima accettabile dei dati — e **RTO** — tempo obiettivo di ripristino — secondo il servizio reale.

**iPagell.** Backup V3, import e copie locali esistono; il [rapporto di verifica](VERIFICATION-MATRIX.md) lascia aperto il ripristino infrastrutturale. Il JSON dell’utente non dimostra il recupero del database completo.

**Da pianificare:** accertare cosa offra effettivamente Sites per il DB gestito, chi possa recuperarlo e con quali limiti. D1 documenta recupero nel tempo, ma disponibilità operativa e accesso tramite Sites non si deducono dal binding: [Cloudflare — Time Travel](https://developers.cloudflare.com/d1/reference/time-travel/). Progettare una prova isolata con dati sintetici comprendente account, diario, classi, note, permessi, migrazioni e cancellazioni precedenti. Valutare copie indipendenti protette se il rischio lo giustifica, senza esportare indiscriminatamente dati reali.

**Criterio di chiusura:** rapporto con contenuti recuperati, tempi misurati, controlli d’integrità e persone abilitate. Non eseguire un restore sul DB di produzione per “fare una prova”.

### BP-06 — Monitorare ciò che l’utente riesce a fare

**Pratica di riferimento.** Google SRE distingue segnali operativi utili e obiettivi misurabili di affidabilità; il solo server acceso non prova che il prodotto funzioni. [Google SRE — monitoraggio](https://sre.google/sre-book/monitoring-distributed-systems/), [obiettivi di servizio](https://sre.google/workbook/implementing-slos/).

**iPagell.** Gli stati locali di sincronizzazione sono dettagliati; [HTTP](../lib/server/http.ts) registra alcuni errori inattesi. Non sono individuati nel codice strumenti completi per monitoraggio, avvisi e correlazione delle richieste. I pannelli del provider non sono stati consultati.

**Da pianificare:** accertare i segnali già disponibili; misurare errori, latenza, saturazione e disponibilità dei percorsi essenziali. Separare conferma locale e conferma server del salvataggio. Aggiungere identificatori di richiesta non contenenti dati scolastici e limiti di retention dei log. Collegare ogni avviso a responsabile e procedura; un controllo autenticato richiede account sintetico dedicato e gestione sicura delle credenziali.

**Criterio di chiusura:** un guasto simulato in ambiente controllato produce un avviso azionabile. Soglie e SLO vengono scelti dopo una baseline; questo documento non promette disponibilità del 99,9% né uno SLA agli utenti.

### BP-07 — Gestire incidenti e imparare dagli errori

**Pratica di riferimento.** Google usa analisi degli incidenti focalizzate su cause e miglioramenti del sistema, con attività correttive assegnate. [Google SRE — postmortem](https://sre.google/sre-book/postmortem-culture/).

**iPagell.** Sono già documentate cause e verifiche di regressioni, per esempio il CSS compilato del toggle e il problema dei campi iOS. Manca una procedura operativa completa con contatti e tempi sostenibili, secondo [sicurezza](../SECURITY.md) e [manutenzione](MANUTENZIONE.md).

**Da pianificare:** distinguere indisponibilità, rischio perdita dati, accesso improprio e difetto senza impatto sui dati; definire escalation e modalità di comunicazione. Preparare procedure brevi per salvataggio bloccato, migrazione fallita, account compromesso e guasto provider. Registrare cronologia, impatto, causa, recupero e attività preventive; per incidenti privacy usare anche il percorso del rapporto legale.

**Criterio di chiusura:** una simulazione documentale arriva dalla segnalazione al recupero senza improvvisare ruoli. Un’eventuale pagina di stato deve restare consultabile durante il guasto e avere un responsabile; non è necessario acquistarla prima di definire il processo.

### BP-08 — Rilasci piccoli, riproducibili e recuperabili

**Pratica di riferimento.** Ridurre la dimensione delle modifiche e seguire esiti e recupero dei rilasci. DORA oggi presenta cinque metriche, non soltanto le quattro originarie: tempi di consegna, frequenza, recupero di deploy falliti, tasso di fallimento e quota di rilavorazioni dovute a incidenti. [DORA — metriche](https://dora.dev/guides/dora-metrics/).

**iPagell.** [CI](../.github/workflows/check.yml) verifica e compila; [deploy](DEPLOYMENT.md) distingue correttamente GitHub, Sites e Worker sperimentale. L’isolamento del sandbox non dimostra che sia una replica rappresentativa della produzione. Le regole GitHub remote non sono state accertate.

**Da pianificare:** identificare un candidato pulito con commit, lockfile, build e schema compatibili; richiedere verifiche pertinenti prima del rilascio. Valutare protezioni del ramo e revisione delle parti critiche secondo il piano GitHub disponibile: [ruleset GitHub](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/about-rulesets). Registrare smoke test successivi, criteri di arresto e ritorno alla versione precedente. Per migrazioni, documentare compatibilità dei client e recupero dati; tornare al vecchio codice non annulla SQL già eseguito.

**Criterio di chiusura:** si sa esattamente cosa è online e come reagire a una regressione. Automazione del deploy e rollout progressivo sono opzioni da qualificare con Sites, non prerequisiti per lavorare bene.

### BP-09 — Test dei rischi reali, non soltanto conteggio dei test

**Pratica di riferimento.** Integrare verifica e gestione dei difetti nel ciclo di sviluppo, scegliendo controlli proporzionati al rischio. [NIST — SSDF](https://csrc.nist.gov/pubs/sp/800/218/final).

**iPagell.** Unit test, controlli dei cataloghi, tipi, lint e build sono nella CI. La [suite API](../tests/api-smoke.mjs) limita l’esecuzione a localhost e usa account sintetici; i [test browser storage](../tests/storage-browser.ts) sono separati. API e percorsi browser non risultano eseguiti dal workflow ordinario.

**Da pianificare:** portare in CI una selezione stabile dei percorsi critici su runtime e DB isolati: registrazione/recupero, salvataggio/riapertura, risposta persa, conflitto, cambio account, invito/ruoli, export/import e cancellazione. Selezionare pochi test browser sulla build compilata; conservare test manuali mirati ai dispositivi che l’automazione non copre. Per schema/storage usare versioni e fixture legacy note.

**Criterio di chiusura:** un difetto nei percorsi selezionati blocca il candidato; account sintetici vengono ripuliti e gli errori dei test non vengono silenziati con retry illimitati. Nessun obiettivo universale di copertura al 100%.

### BP-10 — Dipendenze, Actions e provenienza del software

**Pratica di riferimento.** Conoscere ciò che entra nella build, ridurre privilegi e fissare riferimenti verificabili. GitHub raccomanda oggi lockfile delle dipendenze dei workflow ove adottabili, oppure riferimenti a commit SHA completi; i tag possono cambiare. [GitHub — uso sicuro delle Actions](https://docs.github.com/en/actions/reference/security/secure-use).

**iPagell.** Lockfile, audit completo e test della patch locale `braces` sono presenti. Il workflow usa `actions/checkout@v4` e `actions/setup-node@v4`, con permessi `contents: read`. Non sono presenti nel tree esaminato configurazioni dedicate Dependabot o CodeQL; l’attivazione tramite impostazioni remote resta da accertare.

**Da pianificare:** valutare lockfile workflow se supportato nel contesto, altrimenti pin SHA verificati e aggiornamento assistito. Definire responsabile e frequenza per aggiornamenti/advisory, scansione segreti e controlli statici pertinenti. Mantenere la provenienza e i test di `vendor/braces`, con criterio esplicito di rimozione della patch quando esista un’alternativa qualificata. Non fare aggiornamenti forzati indiscriminati.

**Criterio di chiusura:** una build indica dipendenze effettive, eccezioni motivate e azioni da svolgere sugli avvisi. Il risultato “zero advisory” non certifica il codice locale: [analisi dipendenze](DEPENDENCY-SECURITY-2026-10-10.md).

### BP-11 — Integrità, offline e aggiornamenti dei vecchi client

**Pratica applicata proposta.** Trattare salvataggio, sincronizzazione e recupero come contratti distinti, con garanzie dichiarate e scenari di errore verificabili. Questo adattamento deriva soprattutto dai rischi specifici del codice iPagell.

**iPagell.** CAS del diario, outbox note, riconciliazione delle conferme e transazioni locali proteggono già diversi casi difficili. Il service worker esclude API e non forza `skipWaiting()`. Mancano prove complete su due dispositivi reali, client vecchi e storage bloccato, secondo la [matrice](VERIFICATION-MATRIX.md). Evidenze: [riconciliazione](../lib/notes/reconcile.ts), [sessione](../lib/diary-session.ts), [worker](../public/sw.js).

**Da pianificare:** definire casi di accettazione per modifica offline, spegnimento improvviso, risposta persa, altra scheda, perdita membership, aggiornamento PWA, quota esaurita e ritorno dopo molto tempo. Verificare che “salvato sul dispositivo” e “sincronizzato” abbiano significati comprensibili e coerenti. Conservare sempre una strada di recupero prima di operazioni distruttive.

**Criterio di chiusura:** nessun caso selezionato perde silenziosamente una scrittura confermata secondo il contratto; i limiti irrisolti sono visibili e documentati. Non introdurre co-scrittura/CRDT prima che la necessità sia dimostrata.

### BP-12 — Prestazioni, capacità e limiti del runtime

**Pratica di riferimento.** Usare misure dell’esperienza: Google indica per i Core Web Vitals LCP ≤2,5 s, INP ≤200 ms e CLS ≤0,1 al 75° percentile, distinguendo mobile e desktop. Queste soglie non misurano da sole salvataggio e affidabilità. [Google — Web Vitals](https://web.dev/articles/vitals).

**iPagell.** La [revisione Classi](CLASSI-PERFORMANCE.md) documenta riduzione delle richieste e tempi locali, senza equipararli ai percentili di produzione. La matrice lascia aperti dataset massimi, rete lenta e carico realistico. [password.ts](../lib/server/password.ts) limita l’hashing concorrente per isolate; [auth.ts](../lib/server/auth.ts) usa anche bucket IP/globali, da valutare in reti scolastiche condivise.

**Da pianificare:** baseline per apertura app/agenda, elenco note, digitazione, conferma locale, sync ed export lungo. Provare dispositivi rappresentativi e dataset nei limiti ammessi. Simulare picchi in ambiente isolato, compresi login simultanei e più utenti dietro lo stesso IP. Misurare chunk, memoria, download PWA e query prima di cambiare architettura.

**Criterio di chiusura:** colli di bottiglia riprodotti, budget concordati e regressioni rilevabili. Non dedurre un problema di produzione dalle sole limitazioni teoriche né aggiungere indici/cache senza misure.

### BP-13 — Costi, quote e sostenibilità

**Pratica di riferimento.** Collegare utilizzo, costo e valore e rendere visibili le decisioni di spesa. La FinOps Foundation raccoglie capacità dedicate alla gestione del valore e dei costi tecnologici. [FinOps — capacità](https://www.finops.org/framework/capabilities/).

**iPagell.** Quote note/payload ed elenchi limitati sono presenti. Non sono state esaminate fatture, inclusioni del piano Sites o disponibilità di avvisi di spesa. [use-class-agenda](../hooks/use-class-agenda.ts) effettua un tick ogni 30 secondi mentre il documento è visibile: teoricamente 120 tick per ora per client continuamente visibile, oltre agli eventi di riattivazione. Non sono 120 query D1 garantite né una misura del traffico reale.

**Da pianificare:** accertare risorse fatturate e limiti del piano; raccogliere baseline di richieste, letture/scritture, storage e banda. Costruire scenari parametrizzati per utenti attivi contemporanei e sessioni, non solo account registrati. Definire un budget sostenibile, avvisi disponibili e modalità di degradazione che preservino dati. Valutare polling, backoff e quote soltanto con misure.

**Criterio di chiusura:** il gestore sa quali attività fanno crescere costi/limiti e come intervenire. Non attribuire prezzi Cloudflare diretti al progetto Sites senza verificare il contratto effettivo.

### BP-14 — Usabilità, accessibilità, lingue e dispositivi

**Pratica di riferimento.** Verificare accessibilità durante lo sviluppo, combinando strumenti e giudizio umano: nessun tool da solo dimostra conformità. [W3C WAI — valutazione](https://www.w3.org/WAI/test-evaluate/). WCAG 2.2 è un riferimento tecnico da valutare rispetto al perimetro richiesto. [W3C — WCAG 2.2](https://www.w3.org/TR/WCAG22/).

**iPagell.** Sono documentati focus, tastiera, movimento ridotto, viewport piccoli e quattro lingue. Restano aperti screen reader, traduzioni umane, dispositivi fisici, IME e comportamento iOS. Non è stata eseguita una nuova revisione visiva o dei flussi in questo task.

**Da pianificare:** una matrice compatta dei dispositivi/browser effettivamente usati; prove manuali di tastiera, lettore di schermo, zoom e testo ingrandito, errori dei form, grafici e editor. Aggiungere controlli automatici mirati sulle schermate critiche, con revisione umana delle traduzioni. Per ogni futura rifinitura UI applicare la skill locale prevista da AGENTS.md.

**Criterio di chiusura:** attività quotidiane completabili sui dispositivi dichiarati e con tecnologie assistive selezionate; limiti residui espliciti. Un screenshot a 390 px non sostituisce un telefono reale.

### BP-15 — Ricerca utenti e metriche di prodotto rispettose dei dati

**Pratica di riferimento.** Partire da domande e ipotesi, scegliere metodi proporzionati e iterare sui risultati. GOV.UK propone ricerca continuativa e inclusiva; è un riferimento metodologico, non una prova di efficacia per iPagell. [GOV.UK — pianificare la ricerca](https://www.gov.uk/service-manual/user-research/plan-user-research-for-your-service).

**iPagell.** [UX reference](UX-REFERENCE.md) distingue scelte progettuali e risultati con utenti; il [piano posizionamento](posizionamento-2026-10-15/PLAN.md) presenta una direzione da validare. Non sono dimostrati qui conversione, ritorno degli utenti o riduzione degli errori reali.

**Da pianificare:** osservare piccoli gruppi rappresentativi su compiti concreti: creare diario, inserire voto, trovare scadenza, recuperare nota, capire la condivisione. Per minori usare reclutamento e autorizzazioni appropriati. Misurare successo, errori, tempo e comprensione. Se si introduce analytics, minimizzare eventi e identificativi: niente voti, testi, nomi scuola o replay dei contenuti come dati ordinari. Con pochi utenti, interviste e prove guidate possono dare più informazioni di un A/B test.

**Criterio di chiusura:** ogni investimento importante risponde a un problema osservato; le metriche hanno definizione e uso decisionale, non sono numeri decorativi.

### BP-16 — Supporto, segnalazioni e tutela delle classi

**Pratica applicata proposta.** Un servizio con contenuti condivisi ha bisogno di un percorso di assistenza e gestione abusi collegato alle funzioni tecniche. Per gli aspetti obbligatori rimanda a LEG-07/LEG-09 del [rapporto legale](ANALISI-CONFORMITA-LEGALE-2026-10-15.md).

**iPagell.** Ruoli, inviti, ritiro delle note e archivio autore sono implementati. [SECURITY.md](../SECURITY.md) dichiara che indirizzo dedicato e SLA non sono definiti. Non è documentato un flusso completo per richieste di utenti o persone citate nei contenuti.

**Da pianificare:** canale accessibile senza account, categorie di problema, priorità e responsabilità; guida sintetica per recupero account, bozze offline, inviti e cancellazione. Non chiedere agli utenti password, codice recupero o backup completo per un normale ticket. Definire presa in carico delle segnalazioni, minimizzazione delle prove e comunicazione della decisione, con tutela dei minori e dei terzi.

**Criterio di chiusura:** un problema di sincronizzazione e una segnalazione su un contenuto seguono percorsi chiari e riservati. Pubblicare tempi di risposta soltanto se sostenibili e realmente presidiati.

### BP-17 — Manutenibilità, documentazione e gestione del lavoro

**Pratica applicata proposta.** Conservare decisioni e istruzioni eseguibili, ridurre modifiche troppo ampie e verificare che una persona diversa riesca a orientarsi. Le indicazioni SSDF e DORA sostengono rispettivamente organizzazione del lavoro sicuro e miglioramenti del processo; non impongono una particolare struttura delle cartelle.

**iPagell.** Snapshot, architettura, inventario generato e matrice sono punti di forza. Il checkout contiene molte modifiche preesistenti e documenti di pianificazione; [ipagell-app.tsx](../components/ipagell-app.tsx) coordina molte responsabilità. Questo aumenta il costo potenziale delle modifiche, ma non giustifica da solo una riscrittura.

**Da pianificare:** un solo elenco attivo di lavori con obiettivo, priorità, dipendenze e prove di chiusura; un responsabile e una data di revisione per i documenti operativi. Registrare decisioni architetturali brevi per cambi persistenti. Separare i candidati di rilascio dalle modifiche in corso senza scartare lavoro altrui. Estrarre moduli soltanto quando riduce un rischio concreto e con verifiche pertinenti.

**Criterio di chiusura:** una seconda persona prepara l’ambiente con le guide, individua il percorso dei dati e produce una piccola modifica verificabile. Non usare numero di righe o quantità di documenti come misura isolata della qualità.

### BP-18 — Fornitori, continuità e nuove funzioni

**Pratica applicata proposta.** Preparare una via d’uscita realistica, conoscere vincoli dei fornitori e qualificare nuove superfici di rischio prima dell’introduzione. Non significa migrare ora.

**iPagell.** [Sites](DEPLOYMENT.md) è il percorso di produzione; il Worker sperimentale usa dati separati. Il backup personale non ricrea necessariamente account, membership e intero servizio. I laboratori AI e la preparazione audio sono separati dall’app; questa distinzione va preservata fino a qualificazione.

**Da pianificare:** documentare titolarità di dominio/account, recupero accessi, formati dei dati e requisiti di un eventuale trasferimento, senza copiare subito il database. Per AI/audio/upload richiedere valutazioni riproducibili di qualità, costi, licenze, privacy, cancellazione e comportamento in errore. Per assistenti browser verificare permessi e controllo delle scritture; disponibilità di un’API non equivale a qualificazione del prodotto.

**Criterio di chiusura:** è noto cosa servirebbe per continuare o terminare il servizio ordinatamente. Ogni nuova funzione supera criteri propri con dati autorizzati e sintetici; nessuna integrazione è autorizzata da questo rapporto. Riferimenti: [laboratorio AI](SPAZIO-STUDIO-AI-L0.md), [lezioni](LEZIONI-LIVE-AI.md), [analisi legale](ANALISI-CONFORMITA-LEGALE-2026-10-15.md).

## 5. Percorsi critici da usare come riferimento comune

Questa tabella è una proposta di copertura per il lavoro futuro, non un elenco di test già passati.

| Percorso | Caso utile da verificare | Evidenza attesa |
|---|---|---|
| Account e recupero | Risposta persa, credenziali errate, codice recupero, vecchia sessione | Identità coerente, nessuna esposizione di segreti o apertura dell’account sbagliato. |
| Salvataggio diario | Commit locale, risposta server persa, due schede | Nessuna perdita silenziosa; stato del salvataggio comprensibile. |
| Appunti | Modifica durante sync, chiusura forzata, storage pieno | Bozza recuperabile o errore esplicito; niente conferma falsa. |
| Classi | Invito revocato, cambio ruolo, uscita e rientro | Permessi applicati sul server e copie gestite secondo le regole dichiarate. |
| Export/import | Vecchi formati, file incompleto, import interrotto | Dati recuperabili e nessuna condivisione implicita. |
| Cancellazione | Owner, onboarding incompleto, altra scheda, offline | Pulizia coerente delle copie controllate e limiti trasparenti. |
| Aggiornamento PWA | Client vecchio con bozza e nuovo contratto dati | Aggiornamento senza perdita dei dati o procedura di recupero esplicita. |
| Rilascio/restore | Migrazione e ripristino su ambiente isolato | Versione/schema noti, integrità e tempi misurati. |
| Dispositivo/accessibilità | iPhone, Android, tastiera, lettore schermo | Operazioni essenziali completabili nei contesti dichiarati. |

## 6. Roadmap proporzionata

Le fasi indicano un ordine logico, non un calendario né un’autorizzazione all’esecuzione. Una criticità reale può modificarne l’ordine.

### Fase A — Proteggere gestione e dati

1. Assegnare responsabilità e canali di contatto; verificare accessi amministrativi e rinnovi.
2. Chiudere le decisioni di base del rapporto legale e pianificare la cancellazione completa.
3. Accertare backup/restore effettivamente disponibili e produrre un piano di prova isolata.
4. Accertare monitoraggio già esistente; definire segnali, avvisi e risposta minima ai guasti.

**Uscita:** il gestore conosce i rischi più gravi, ha un percorso di intervento e sa come dimostrare recuperabilità e controllo degli accessi.

### Fase B — Ridurre le regressioni

1. Automatizzare la selezione API/browser dei percorsi critici su ambiente isolato.
2. Consolidare candidato di rilascio, protezioni del repository, provenienza Actions e manutenzione della patch locale.
3. Verificare due dispositivi, vecchi client/PWA e accessibilità dei percorsi essenziali.
4. Raccogliere baseline di prestazioni, risorse e costi reali, senza aggiungere raccolte di dati scolastici.

**Uscita:** un candidato non supera i controlli se compromette un percorso selezionato e i limiti di compatibilità sono espliciti.

### Fase C — Crescere sulla base di evidenze

1. Ricerca con utenti rappresentativi e interventi sul principale problema osservato.
2. Ottimizzare prestazioni/costi soltanto dove le misure indicano una necessità.
3. Qualificare nuove funzioni, rapporti con scuole e nuovi mercati separatamente.
4. Preparare eventuali richieste contrattuali o certificazioni quando diventano un requisito reale.

**Uscita:** ogni investimento ha un problema da risolvere, un beneficio verificabile e un costo di gestione sostenibile.

## 7. Cruscotto minimo proposto

Iniziare con pochi indicatori, anche raccolti manualmente quando affidabili. Non installare uno strumento di analytics prima di definirne finalità e dati.

| Indicatore | Definizione da fissare | Decisione che aiuta |
|---|---|---|
| Disponibilità dei percorsi critici | Esiti riusciti / tentativi validi nella finestra, distinti per percorso | Stabilità prima di nuove funzioni. |
| Tempo di salvataggio | Tempo al commit locale e alla conferma server, separati | Capire lentezza e rischio percepito. |
| Errori/confitti di sincronizzazione | Eventi tecnici per operazione, senza contenuti utente | Priorità di correzione e assistenza. |
| Recupero dati | Data dell’ultima prova riuscita e tempi misurati | Valutare se il piano di continuità è credibile. |
| Salute dei rilasci | Fallimenti, interventi urgenti e recupero, con denominatori | Ridurre dimensione e rischio dei cambiamenti. |
| Supporto | Problemi aperti per impatto ed età della segnalazione | Individuare problemi ricorrenti e carico insostenibile. |
| Esperienza | Successo dei compiti nelle prove e Web Vitals dove misurabili | Orientare miglioramenti utili. |
| Risorse/costo | Utilizzo e spesa reale, distinguendo quota fissa e variabile | Prevenire limiti e pianificare la crescita. |

Per ogni indicatore indicare fonte, finestra, campionamento, esclusioni, conservazione e responsabile. Su campioni piccoli evitare conclusioni statistiche e percentuali senza denominatore. Le soglie devono derivare dalla baseline e dal livello di servizio scelto.

## 8. Pratiche da rinviare finché non hanno una motivazione

- Microservizi, Kubernetes o migrazioni cloud per il solo desiderio di sembrare una grande azienda.
- Certificazioni ISO/SOC, grandi piattaforme SIEM o reperibilità continua senza un requisito contrattuale, un rischio e risorse adeguati.
- Riscrittura completa dell’app o co-scrittura distribuita senza un problema misurato che la giustifichi.
- Tracciamento dettagliato, session replay o A/B test con pochi utenti e dati scolastici per ottenere grafici di crescita.
- Tool automatici sovrapposti senza responsabile degli avvisi e capacità di correggerli.
- KPI su quantità di commit, righe di codice, test o deploy come obiettivi individuali di produttività.
- Portare AI, registrazioni audio, pagamenti o nuovi provider in produzione prima delle verifiche dedicate.

**Scelta raccomandata:** adottare poche pratiche con una prova di funzionamento, iniziando da responsabilità, accessi, recupero dati, monitoraggio e percorsi critici. Gli interventi non iniziano automaticamente con la consegna di questa analisi.
