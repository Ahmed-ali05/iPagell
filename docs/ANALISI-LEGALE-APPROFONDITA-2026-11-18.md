# iPagell — Approfondimento legale: norme, stato del servizio, rischi e azioni

[Indice](README.md) · [Analisi di fattibilità](ANALISI-SITO-2026-11-18.md) · [Conformità (ottobre)](ANALISI-CONFORMITA-LEGALE-2026-10-15.md) · [Percorso minimo](legal/ESSENZIALI-PRIVACY-2026-10-22.md)

Data: **18 novembre 2026**. Approfondimento della prima analisi. Non è un parere legale: è una lettura documentale per preparare le decisioni del gestore e le verifiche con un professionista svizzero e, se serve, italiano. Le norme citate sono indicate per articolo; i testi vanno riletti sulle fonti ufficiali prima di essere usati in un documento pubblico.

Fonti del repository lette: [informativa](legal/INFORMATIVA-PRIVACY-IT-BOZZA.md), [regole d'uso](legal/REGOLE-USO-IT-BOZZA.md), [cookie e archivi](legal/COOKIE-STORAGE-IT-BOZZA.md), [procedura richieste](legal/PROCEDURA-RICHIESTE-PRIVACY.md), [percorso minimo](legal/ESSENZIALI-PRIVACY-2026-10-22.md), [conformità](ANALISI-CONFORMITA-LEGALE-2026-10-15.md), [PRODOTTO](PRODOTTO.md), [LEZIONI-LIVE-AI](LEZIONI-LIVE-AI.md), `wrangler.jsonc`.

---

## 1. Esito in breve

1. **Il quadro di partenza è svizzero** (gestore in Ticino). La **nLPD/revDSG** (in vigore dal 1° settembre 2023) è la legge principale. Il **GDPR** entra in gioco per ogni persona nell'UE/SEE a cui il servizio è offerto in modo intenzionale (art. 3 par. 2 GDPR). Con utenti italiani, questo è un caso concreto, non teorico.
2. **Tre punti hanno effetto immediato:**
   - l'informativa non è ancora pubblicata e la registrazione non la mostra;
   - l'età minima indicata (13 anni) non coincide con la soglia italiana di 14 anni per il consenso dei minori nei servizi della società dell'informazione (art. 2-quinquies Codice privacy);
   - i dati del vecchio hosting Sites restano presso un fornitore terzo, senza un percorso di cancellazione definito.
3. **Un punto è più rilevante di quanto la documentazione suggerisca:** la conservazione dei residui di cancellazione (note eliminate con marcatore e metadati) non ha scadenza. Il principio di limitazione della conservazione (nLPD art. 6 cpv. 4; GDPR art. 5 par. 1 lett. e) rende questo punto da correggere, non solo da documentare.
4. **Gli appunti da lezione con microfono** restano il tema più delicato. Non vanno sviluppati finché non c'è un'analisi specifica sull'aula, sulla scuola e sui terzi coinvolti.
5. **Nessuna delle questioni è bloccante per continuare con il servizio attuale**, ma le prime tre vanno chiuse prima di invitare nuovi utenti o di comunicare il sito fuori dalla cerchia attuale.

---

## 2. Quale legge si applica, in pratica

| Scenario | Norme probabili | Note |
|---|---|---|
| Utente in Svizzera, gestore in Svizzera | nLPD, OR e diritto cantonale per scuole pubbliche | Art. 3 nLPD: ambito territoriale legato anche agli effetti in Svizzera. |
| Utente in Italia, offerta intenzionale | GDPR (art. 3 par. 2 lett. a), Codice privacy italiano | Rileva lingua italiana, pubblicità del servizio, contenuto rivolto a studenti italiani. La sola accessibilità del sito non basta; la scelta di rivolgersi a quel pubblico sì. |
| Utente in Germania o Francia (le lingue del sito) | GDPR con norme nazionali sull'età | Le lingue disponibili non rendono applicabile una legge, ma aumentano il rischio di un'offerta intenzionale. |
| Scuola pubblica svizzera che adotta il servizio | Legge cantonale ticinese sulla protezione dei dati per enti pubblici; accordo di trattamento | Cambia il ruolo: il gestore diventa responsabile per conto della scuola (nLPD art. 9). Non è il caso attuale. |
| Scuola italiana che adotta il servizio | GDPR art. 28 (responsabile del trattamento), contratto obbligatorio | Stesso caso: ruolo e accordo da definire prima dell'adozione. |

**Decisione che manca:** elencare esplicitamente i Paesi in cui il servizio è offerto. Finché non c'è un elenco, l'informativa non può dire con precisione quali norme si applicano.

**Obbligo di rappresentante:** il gestore è in Svizzera. Se il GDPR si applica (offerta a utenti UE), serve un rappresentante nell'UE (art. 27 GDPR), salvo eccezioni che qui non sembrano applicabili (trattamento occasionale e senza categorie particolari su larga scala; il trattamento di dati di salute nelle assenze rende l'eccezione difficile da sostenere). In Svizzera, un gestore estero deve nominare un rappresentante (art. 14 nLPD) quando il trattamento riguarda Svizzera e il gestore è all'estero; per un gestore svizzero non c'è questo obbligo. Da confermare.

---

## 3. Ruoli

| Trattamento | Ruolo di iPagell | Cosa cambia |
|---|---|---|
| Account, diario, appunti personali | Titolare | Informativa, diritti, sicurezza, conservazione sono a carico del gestore. |
| Classi, appunti condivisi | Titolare per il servizio; ogni membro è responsabile dei propri contenuti | Serve una regola chiara su chi è responsabile di cosa, e una procedura di segnalazione. |
| Dati personali inseriti da altri (compagni, docenti) | Il gestore li tratta come titolare; l'utente li inserisce sotto la propria responsabilità | Serve avviso nelle regole d'uso e procedura di correzione/rimozione. |
| Cloudflare (hosting, D1, log) | Responsabile del trattamento per il servizio; **titolare autonomo** per alcuni dati di rete e di sicurezza secondo la sua informativa | L'informativa dice già entrambe le cose; va verificato che il testo distingua i due casi in modo chiaro. |
| Vecchio hosting Sites | Il gestore è rimasto titolare dei dati lì conservati; il fornitore era responsabile del trattamento | La titolarità non si è estinta con la fine dell'abbonamento. Vedi §5.6. |

---

## 4. Analisi per tema

Per ogni tema: norma, stato nel repository, rischio, azione, criterio di chiusura.

### 4.1 Informativa (nLPD art. 19–20; GDPR artt. 12–14)

**Norma:** l'informativa deve essere fornita al momento della raccolta, in forma comprensibile, con identità e contatti del titolare, finalità, destinatari o categorie, Paesi di trasferimento e garanzie, conservazione o criteri, diritti, e le conseguenze del mancato conferimento. Per il GDPR si aggiungono base giuridica, diritto di reclamo, eventuale DPO.

**Stato:** la bozza ([informativa](legal/INFORMATIVA-PRIVACY-IT-BOZZA.md)) copre gran parte del contenuto. Mancano o sono da completare:

- la base giuridica per ogni finalità (GDPR art. 13 par. 1 lett. c): per il diario, esecuzione del contratto (art. 6 par. 1 lett. b); per la sicurezza, interesse legittimo con valutazione documentata; per le note sulle assenze, la base per dati sanitari richiede un'eccezione specifica (art. 9 GDPR), non il solo contratto;
- le conseguenze del mancato conferimento (quali campi sono facoltativi);
- il diritto di reclamo all'autorità competente (IFPDT in Svizzera; autorità del Paese di residenza per gli utenti UE);
- la descrizione dei trasferimenti verso gli USA con la base usata (Swiss-U.S. Data Privacy Framework o clausole contrattuali standard). La bozza parla di "adesione" di Cloudflare: va verificata sull'elenco ufficiale DPF, non solo sulla dichiarazione del fornitore;
- le finalità delle notifiche e dei log di errore;
- la data di entrata in vigore e la versione.

**Rischio:** medio-alto. Non c'è ancora nulla di pubblicato e il servizio è già in uso.

**Azione:** finalizzare l'informativa; pubblicarla prima della registrazione; collegarla dalla homepage, dal calcolatore, dalla registrazione e dalle impostazioni (come già indicato nell'analisi di ottobre).

**Chiusura:** testo pubblicato, versione datata, collegamenti verificati in tutte le lingue in cui il servizio è offerto.

### 4.2 Età minima e minori

**Norma:**

- **Svizzera:** la nLPD non fissa un'età per il trattamento dei dati. Per i contratti, la capacità dipende dal discernimento (ZGB art. 16); un minore può concludere contratti con il consenso dei genitori in base all'età e alla natura del contratto (ZGB art. 19). Un servizio gratuito per studenti può essere considerato di portata modesta, ma non è una certezza. Va verificato con un professionista svizzero.
- **Italia:** GDPR art. 8 lascia agli Stati fissare l'età tra 13 e 16 anni per il consenso nei servizi della società dell'informazione. Il Codice privacy (art. 2-quinquies) fissa 14 anni. Sotto i 14 serve il consenso di chi esercita la responsabilità genitoriale.
- **Nota:** l'art. 8 GDPR riguarda il trattamento basato sul consenso. Se la base è il contratto, la regola dell'età non si applica direttamente, ma il principio di equità e la protezione dei minori (considerando 38) restano.

**Stato:** le bozze indicano "dai 13 anni, con eventuali soglie superiori". Il vincolo Sites (13 anni) non si applica più. Non c'è alcuna verifica dell'età nel codice di registrazione.

**Rischio:** alto. Gli utenti sono studenti, quindi in gran parte minorenni. La soglia di 13 anni è inferiore a quella italiana di 14 anni: se il servizio è offerto in Italia, la bozza è incoerente con la legge italiana.

**Opzioni da scegliere:**

| Opzione | Vantaggi | Svantaggi |
|---|---|---|
| A. Soglia 14 anni, con consenso genitoriale sotto i 14 | Coerente con il Codice privacy italiano; semplice da spiegare | Richiede un passaggio di consenso e una verifica proporzionata; esclude alcuni studenti di scuola media (questi ultimi usano il diario della scuola, non iPagell) |
| B. Soglia 16 anni | Più prudente, copre tutti i Paesi UE | Esclude una parte di studenti delle scuole medie e superiori |
| C. 13 anni, come ora | Più vicino a quanto dichiarato nei documenti | Incoerente con la legge italiana se il servizio è offerto in Italia; ulteriori dubbi in Svizzera |

**Azione proposta:** scegliere A, a meno che il pubblico non sia esclusivamente svizzero e il professionista confermi che B o C sono sufficienti. Aggiornare tutte le bozze e prevedere una frase semplice nella registrazione ("Per iscriverti fino ai 14 anni serve il consenso di un adulto che ti segue").

**Verifica di età:** non serve chiedere documenti. Basta una dichiarazione dell'età (anno di nascita o fascia) e, sotto soglia, una conferma del genitore con un canale verificabile. Non raccogliere la data di nascita completa se non serve (minimizzazione).

**Account esistenti:** l'utente che si è registrato con 13 anni andrebbe contattato (o al prossimo accesso) per la conferma. Senza email associata, il canale è il diario stesso: un avviso al login.

**Chiusura:** scelta documentata dal gestore, bozze coerenti, flusso di registrazione con dichiarazione dell'età, piano per gli account esistenti.

### 4.3 Dati sensibili: assenze, note, testi liberi

**Norma:** nLPD art. 5 lett. c n. 2 include tra i dati personali degni di particolare protezione quelli sulla salute. GDPR art. 9 riguarda i dati sulla salute. Il fatto che un'assenza sia registrata non la rende automaticamente un dato sanitario; una motivazione come "visita medica" o "malattia" può esserlo.

**Stato:** il campo assenze ha durata, giustificazione e testo libero. Le regole d'uso chiedono di non inserire diagnosi o certificati, ma non c'è alcun controllo tecnico né un avviso nell'interfaccia dove si scrive la giustificazione.

**Rischio:** medio-alto. Il rischio è concreto perché nel testo libero possono finire diagnosi, informazioni su terzi o dati di familiari.

**Azioni:**

- nell'interfaccia delle assenze, un avviso breve e leggibile al campo giustificazione ("Non scrivere diagnosi o dati sanitari; basta indicare il tipo di assenza");
- valutare un menu di tipi di giustificazione (es. "motivo scolastico", "famiglia", "salute", "altro") senza testo libero obbligatorio;
- non usare il campo per funzioni di analisi o riepilogo automatici senza una base specifica;
- nelle regole d'uso, dire chiaramente che l'app non è adatta a conservare informazioni sanitarie.

Nota: scegliere "salute" come tipo di giustificazione è già un dato sanitario, anche senza testo. Va detto nell'informativa; non è un problema da eliminare ma un trattamento da spiegare.

**Chiusura:** avviso visibile, tipi di giustificazione o motivazione che non richiedono testo, informativa coerente.

### 4.4 Conservazione e cancellazione

**Norma:** nLPD art. 6 cpv. 4: i dati personali devono essere distrutti o resi anonimi quando non sono più necessari allo scopo. GDPR art. 5 par. 1 lett. e (limitazione della conservazione) e art. 17 (cancellazione). Il diritto alla cancellazione dell'interessato ha eccezioni, ma non copre i residui inutili.

**Stato (dai documenti del repository e dal codice):**

- le sessioni durano 14 giorni, ma i record scaduti sono rimossi solo all'emissione di una nuova sessione: nessun termine fisico garantito;
- i contatori contro gli abusi usano finestre di 15 minuti e pulizia legata alle sessioni;
- gli inviti di classe scaduti o usati restano nel database;
- le note eliminate lasciano un **marcatore con metadati**, incluse materia e, per gli appunti di classe, autore e classe; **non c'è scadenza**;
- i log di errore e i log per richiesta sono gestiti come descritto (3 giorni, errori soltanto);
- il Time Travel del D1 conserva lo stato per 7 giorni (30 se il piano cambia);
- il vecchio D1 Sites non ha alcun termine.

**Rischio:** alto per i residui di note e per il vecchio hosting; medio per il resto.

**Il punto più critico:** i marcatori di cancellazione delle note. Un marcatore che conserva materia, autore e classe dopo che l'utente ha chiesto la cancellazione è un trattamento di dati che non servono più. Il documento di ottobre lo dichiara come "residuo" e non propone una scadenza. Per il principio di limitazione, serve una regola: rimuovere del tutto il marcatore dopo un termine breve (es. dopo la conferma di sincronizzazione ai dispositivi), oppure anonimizzare i campi identificativi.

**Azioni:**

1. definire un termine per i marcatori di nota eliminata (proposta: rimozione fisica dopo la sincronizzazione o dopo 30 giorni, a seconda dell'esigenza di sincronizzazione);
2. definire una pulizia periodica dei record scaduti (sessioni, inviti, contatori), eseguibile anche manualmente, con un termine documentato;
3. documentare il Time Travel come finestra di ripristino: un ripristino riporta dati cancellati, quindi il gestore deve ripetere le cancellazioni successive (come già scritto nella procedura);
4. decidere il destino del vecchio D1 Sites (vedi §4.7).

**Chiusura:** tabella dei termini per ogni categoria, verificata sul codice e sul database; l'informativa riporta gli stessi termini.

### 4.5 Cancellazione dell'account e copie locali

**Stato:** la cancellazione account esiste ([sicurezza account](../app/api/auth/security/route.ts)) con riautenticazione. Blocca se l'utente possiede una classe. Il documento LEG-05 segnala che il percorso di cancellazione nel workspace non pulisce esplicitamente il diario in IndexedDB; la pulizia locale è corretta nel codice W8-A ma non è pubblicata.

**Rischio:** medio. Su un dispositivo condiviso, un diario ricomparso dopo la cancellazione è un incidente di riservatezza.

**Azione:** pubblicare la correzione W8-A e verificarla con dati sintetici su due schede e in modalità offline (come già elencato in LEG-05).

**Blocco per proprietari di classe:** la regola "trasferisci o elimina la classe prima" è chiara, ma se il proprietario non è più raggiungibile, l'utente non può cancellare il proprio account. Serve un percorso del gestore per questi casi, con verifica dell'identità e regole sulla classe (es. trasferimento automatico a un moderatore, o chiusura della classe dopo un termine di avviso).

**Chiusura:** test di cancellazione documentato; regola per proprietari non reperibili.

### 4.6 Diritti degli interessati (accesso, correzione, cancellazione, portabilità, opposizione)

**Norme:** nLPD art. 25 (accesso: gratuito e in linea di principio entro 30 giorni), art. 28 (consegna e trasmissione dei dati). GDPR artt. 15–21 (con termine di un mese, prorogabile di due).

**Stato:** la procedura è scritta ([procedura richieste](legal/PROCEDURA-RICHIESTE-PRIVACY.md)) ma non è operativa. Il punto critico è l'**identificazione**: gli account non hanno un'email verificata; il recupero avviene con un codice. Quindi una richiesta via email non può essere collegata con certezza a un account.

**Rischi:**

- consegnare dati di un account a chi non ne è titolare (es. un genitore o un compagno che non dovrebbe avere accesso);
- non riuscire a rispondere entro i termini, perché la procedura non è chiara.

**Azioni:**

1. stabilire che le richieste di accesso o portabilità si fanno con un percorso autenticato: un utente loggato può scaricare il backup (già possibile) oppure una richiesta via email che porta a una verifica del codice di recupero o a un appuntamento di prova (es. una parola chiave scelta in fase di registrazione);
2. per richieste da terzi (dati su di me inseriti da altri), definire un iter di verifica separato e limitare la risposta ai dati della persona richiedente;
3. registrare le richieste in un registro minimo, fuori dal repository.

**Nota:** il backup JSON non è una risposta completa all'accesso (non contiene log, metadati di sicurezza, residui di cancellazione). La risposta va spiegata nell'informativa.

**Chiusura:** procedura testata su un caso sintetico; registro vuoto pronto.

### 4.7 Vecchio hosting Sites: il tema più sottovalutato

**Stato:** dal 16 novembre 2026 il sito è su Cloudflare. Il D1 di Sites contiene ancora dati personali di utenti (account, diari, appunti, classi). L'alias `ipagell.produc-ch.chatgpt.site` reindirizza al nuovo sito (308). Gli utenti non possono più usare il vecchio sito per esportare il backup, come previsto da `docs/DEPLOYMENT.md`. Il gestore non vi accede direttamente.

**Norme:** la titolarità dei dati non si è estinta con la fine dell'abbonamento. Il gestore deve decidere quali dati conservare e per quanto (nLPD art. 6 cpv. 4; GDPR art. 5 e 17). Se il fornitore conserva dati dopo la fine del rapporto, serve un accordo o un'istruzione di cancellazione (nLPD art. 9; GDPR art. 28 par. 3 lett. g).

**Rischi:**

- dati conservati senza finalità;
- utenti che credono di aver migrato i dati e invece li perdono;
- richieste di accesso o cancellazione che non si possono soddisfare.

**Azioni proposte (decisione del gestore):**

1. fissare una data limite per la migrazione manuale tramite backup JSON, comunicata agli utenti con il canale disponibile (il sito stesso, l'avviso in app, l'email se disponibile);
2. dopo la data, eliminare il progetto Sites (o chiedere la cancellazione dei dati) e documentarlo;
3. nel frattempo, rispondere alle richieste su quei dati spiegando cosa è possibile fare;
4. verificare nel contratto OpenAI/Sites la politica di conservazione dopo la fine dell'abbonamento, senza attendere una risposta del supporto come condizione obbligatoria.

**Chiusura:** data di cessazione decisa, comunicazione inviata, progetto Sites eliminato e registrato.

### 4.8 Trasferimenti internazionali e fornitori (Cloudflare)

**Stato (dai documenti):** Cloudflare, DPA v6.4 come parte del Self-Serve Subscription Agreement; D1 in giurisdizione UE; richieste elaborate nel centro più vicino al visitatore; log nei centri principali del mondo senza Customer Metadata Boundary; subresponsabili pubblicati; NEL attivo.

**Norme:** nLPD art. 16–18 (comunicazione all'estero: Paese con protezione adeguata, o garanzie come clausole contrattuali, o eccezioni). Il Consiglio federale riconosce gli USA solo per le imprese aderenti allo Swiss-U.S. DPF. GDPR artt. 44–49 (DPF UE-USA, clausole contrattuali standard).

**Punti da verificare:**

- l'adesione di Cloudflare allo Swiss-U.S. DPF sull'elenco ufficiale del Dipartimento del Commercio USA (non solo nell'informativa del fornitore);
- l'entità contraente nel contratto self-serve per clienti svizzeri;
- se il piano cambia (Workers Paid, Observability dal 1° dicembre 2026), la conservazione dei log cambia e l'informativa va aggiornata.

**Rischio:** basso-medio se le verifiche risultano positive; medio se l'adesione DPF non è confermata (serve allora una clausola contrattuale da firmare o un'altra base).

### 4.9 Cookie, archivi locali e NEL

**Norme:**

- **Svizzera:** l'art. 45c della legge sulle telecomunicazioni (LTC) prevede informazione sull'uso di tecnologie di tracciamento e possibilità di rifiuto, con eccezione per ciò che è strettamente necessario al servizio richiesto. Le linee guida IFPDT del 2026 (Merkblatt Cookies) danno indicazioni applicative. Il testo esatto va letto su fedlex.
- **Italia/UE:** Codice privacy art. 122 e direttiva ePrivacy: consenso per archivi sul terminale, con eccezione per l'archiviazione strettamente necessaria a fornire il servizio richiesto dall'utente.

**Stato:**

- cookie di sessione `__Host-ipagell-session` (14 giorni, HttpOnly, Secure, SameSite=Lax): necessario all'account;
- IndexedDB e localStorage per diario offline, bozze, lingua, preferenze: necessari alla funzione richiesta, ma alcuni marcatori (promemoria, installazione) non sono strettamente necessari;
- NEL: il sito dice al browser di inviare a Cloudflare le segnalazioni di errore di rete. Il documento cita Cloudflare per "nessun IP conservato". Questa affermazione va verificata sulla documentazione Cloudflare e nel testo va descritta come trasmissione verso un fornitore, non come assenza di trattamento.

**Rischio:** basso per i cookie necessari; medio per NEL, perché è una trasmissione di informazioni sul dispositivo a un terzo senza una scelta esplicita.

**Azioni:**

1. verificare la documentazione NEL e decidere: mantenerlo e descriverlo, oppure disattivarlo dalla dashboard se non è indispensabile;
2. documentare nell'inventario la base di ciascun archivio ("necessario al servizio" o "altro");
3. non introdurre banner per gli archivi necessari; ripetere l'analisi se si aggiungono analytics o servizi con script.

### 4.10 Classi, contenuti di terzi e responsabilità

**Norme:**

- **Svizzera:** protezione della personalità (ZGB art. 28) e diritti sulle immagini e sui testi; reati di diffamazione e ingiuria (StGB art. 173 e segg.) per contenuti offensivi. Non esiste nel diritto svizzero una "safe harbour" generale per l'hosting come quella europea; la responsabilità dipende dalla conoscenza e dal comportamento del gestore.
- **Italia/UE:** il Digital Services Act (Reg. UE 2022/2065) disciplina le piattaforme online e gli obblighi di notifica e azione. Per un servizio piccolo e non pubblico, gli obblighi principali di DSA probabilmente non si applicano, ma un meccanismo di segnalazione e rimozione è buona prassi e può diventare necessario.
- **Copyright:** l'uso personale e didattico ha eccezioni limitate; la condivisione di materiali altrui in una classe non è automaticamente lecita.

**Stato:** le classi permettono di condividere appunti e attività con i membri. La moderazione (proprietario, moderatori, ritiro dei testi) è implementata. Mancano: una procedura per le segnalazioni di terzi, un canale privato di sicurezza, una regola sul materiale protetto da diritto d'autore.

**Rischio:** medio. Più cresce l'uso scolastico, più è probabile un contenuto offensivo o un dato di minore in un appunto condiviso.

**Azioni:**

1. procedura di segnalazione con contatto e tempo di risposta; rimozione o nascondimento temporaneo dei contenuti segnalati con verifica;
2. nelle regole d'uso, un divieto esplicito di pubblicare dati di minori, diagnosi e foto/voci di persone senza consenso;
3. regola sul materiale protetto: l'utente condivide solo testi propri o di cui ha diritto;
4. registrare e conservare le segnalazioni per il tempo strettamente necessario.

### 4.11 Assistenti browser e strumenti AI

**Stato:** il workspace espone a browser compatibili due strumenti (`read_school_summary`, `create_grade`). Questi strumenti leggono il riepilogo scolastico o scrivono voti quando un assistente li richiama.

**Norme:** principio di trasparenza e di minimizzazione (nLPD art. 6 e 19; GDPR artt. 5 e 13). Se un assistente esterno riceve dati di voti e assenze, il trasferimento è a suo carico e a carico dell'utente, ma il gestore deve informare con chiarezza.

**Rischio:** medio. Lo strumento è poco visibile e l'utente potrebbe non sapere che un assistente può leggere il suo riepilogo.

**Azioni:** descrivere lo strumento nell'informativa e nella guida; chiedere una conferma esplicita nell'interfaccia prima della prima lettura da un assistente; permettere di disattivarlo.

### 4.12 Appunti da lezione con microfono (LEZIONI-LIVE-AI)

**Norme:**

- **Svizzera:** Codice penale art. 179bis (registrazione di conversazioni non pubbliche da parte di terzi all'insaputa dei partecipanti) e art. 179ter (registrazione da parte di un partecipante senza consenso degli altri). Punibili su querela. Le fonti consultate precisano che l'art. 179quater riguarda soprattutto immagini, non l'audio.
- **Italia:** il Garante distingue la registrazione per studio personale dello studente (ammessa, secondo le FAQ, nel rispetto del regolamento scolastico) dalla diffusione, che richiede il consenso di tutti i presenti ripresi. Esistono posizioni più restrittive, anche giurisprudenziali, sulla registrazione da parte del docente. La questione è incerta.
- **Trattamento dei dati:** registrare la voce di un altro studente o del docente è un trattamento di dati personali (anche senza identificazione), con base giuridica da individuare.

**Stato:** solo documentazione. Il piano prevede ascolto con microfono, trascrizione locale, cancellazione dell'audio entro 60 secondi, nessuna conservazione di audio, trascrizione o sessioni.

**Analisi:**

- la trascrizione in memoria e l'eliminazione dell'audio riducono il rischio di conservazione, ma non risolvono la questione della raccolta dei dati di terzi in aula;
- la "registrazione effimera" è comunque un trattamento, e la sua liceità dipende dal contesto (aula, consenso, scuola);
- il rischio penale (179bis/179ter) è reale se qualcuno registra senza consenso e la conversazione è non pubblica: una lezione frontale può essere considerata pubblica o no, a seconda del contesto. Non è una valutazione da fare in questo documento.

**Azione:** non sviluppare il microfono in aula. Limitare le prove a voce del solo utente su contenuti sintetici, in ambiente privato, senza terzi. Prima di un pilota con classi serve un parere legale su aula, scuola e consenso, e un accordo con la scuola.

**Rischio:** molto alto se il prodotto viene usato in aula senza queste basi.

### 4.13 Materiali protetti e strumenti di studio (Spazio Studio)

**Norme:** Svizzera: URG (legge sul diritto d'autore) art. 19 (uso privato); Italia: LDA art. 68 (copia privata) e art. 70 (uso didattico e di ricerca, con limiti). Il riassunto automatico di un libro protetto è un'opera derivata se va oltre l'uso privato.

**Stato:** laboratorio separato, non in produzione. I documenti sono solo sintetici o autorizzati.

**Azione:** prima di qualunque upload di materiali di terzi in produzione, servono una policy di uso, un divieto di condivisione e un'analisi di copyright. Il laboratorio resta con documenti sintetici.

### 4.14 Accessibilità

**Norme:** in Svizzera la legge sui disabili (BehiG) si applica soprattutto a servizi federali e a enti pubblici; per privati è rilevante quando offrono servizi a enti pubblici (scuole pubbliche). In UE la direttiva (UE) 2019/882 (European Accessibility Act) si applica dal 28 giugno 2025 a determinati servizi e prodotti; un'app per la gestione del diario personale probabilmente non rientra direttamente, ma serve verificarlo.

**Stato:** verifiche tecniche su desktop e viewport simulati; nessuna verifica con screen reader o device fisici (Q01, Q-accessibilità).

**Rischio:** basso per l'obbligo diretto, medio per la reputazione e per l'uso scolastico, dove la scuola può chiedere standard.

**Azione:** dichiarare il livello di accessibilità cercato (es. WCAG 2.2 AA come obiettivo) senza dichiarare conformità non verificata.

### 4.15 Sicurezza come obbligo legale

**Norme:** nLPD art. 8 (sicurezza dei dati, misure adeguate); art. 24 (notifica all'IFPDT di violazioni con rischio elevato, il prima possibile); GDPR art. 32 (sicurezza), artt. 33–34 (notifica all'autorità entro 72 ore e agli interessati se il rischio è elevato).

**Stato:** esistono protezioni (hash di password e codici, sessioni, CSRF/Origin, rate limiting, limiti di payload, cookie sicuri) e un audit delle dipendenze. Mancano: una procedura scritta di gestione degli incidenti, un canale per segnalazioni di vulnerabilità (SECURITY.md non indica un indirizzo dedicato), una persona responsabile, un registro delle violazioni.

**Rischio:** medio-alto. Un'esposizione di diari scolastici è un incidente con notifica in molti casi.

**Azioni:**

1. procedura breve di incidente: rilevazione, contenimento, valutazione del rischio, notifica IFPDT/autorità UE quando richiesto, avviso agli utenti;
2. registro delle violazioni (anche se vuoto);
3. canale per segnalazioni di sicurezza e impegno di risposta;
4. verifica periodica delle credenziali e degli accessi amministrativi a Cloudflare e GitHub (autenticazione a due fattori).

### 4.16 Valutazione d'impatto (DPIA)

**Norme:** nLPD art. 22 (valutazione d'impatto quando il trattamento può comportare un rischio elevato, in particolare con dati sensibili su larga scala); GDPR art. 35.

**Analisi:** con dati di salute (assenze), minori e dati di terzi, la soglia di rischio elevato è plausibile, anche se oggi gli utenti sono pochi. Una valutazione breve e documentata è un passo ragionevole prima di crescere; non serve un'analisi complessa per un servizio così piccolo.

**Azione:** redigere una valutazione breve (rischi, misure, residui) e aggiornarla quando cambiano funzioni o utenti.

### 4.17 Condizioni d'uso e modifiche

**Norme:** Svizzera: OR art. 1–2 (accettazione delle condizioni), clausole insolite da indicare esplicitamente; UWG per le clausole abusive nei rapporti con consumatori (il servizio è gratuito, ma il rapporto può essere considerato di consumo). Italia: Codice del consumo (artt. 33–36) per le clausole vessatorie se il servizio è offerto a consumatori italiani, anche se gratuito.

**Stato:** le regole d'uso sono brevi e chiare. Mancano: una modalità di accettazione, una versione datata, un canale per comunicare le modifiche (senza email, il canale è l'app).

**Azione:** decidere se le regole sono un contratto (accettazione al primo accesso con versione registrata) o un documento informativo. Per le modifiche sostanziali, un avviso in app con la possibilità di chiedere chiarimenti.

### 4.18 Email, contatto e canali

Il contatto `ipagell.service@gmail.com` è pubblico. Gmail non è un fornitore con DPA personalizzato per questo uso; il trattamento è regolato dalle condizioni di Google. Nell'informativa va detto. Per email con dati personali, serve prudenza: non chiedere dati sensibili via email, non rispondere con dati di account.

---

## 5. Incoerenze da correggere nei documenti

| Documento | Passaggio | Problema | Correzione proposta |
|---|---|---|---|
| Informativa, regole d'uso, percorso minimo | "dai 13 anni" | Non coerente con la soglia italiana di 14 anni | Scelta del gestore (§4.2) |
| Informativa | "Cloudflare tratta i dati per conto del gestore" e "titolare autonomo" per alcuni dati | Non chiaro quali dati | Elencare i casi |
| Informativa | "Per il diritto d'accesso svizzero il riscontro è in linea di principio gratuito entro 30 giorni" | Corretto ma incompleto: manca il rinvio alla verifica dell'identità | Aggiungere la verifica |
| Cookie | NEL "non conserva l'IP" secondo Cloudflare | Affermazione da verificare sulla documentazione | Verificare e descrivere come trasmissione |
| Conservazione (ANALISI-CONFORMITA §Evidenze) | Marcatori di nota eliminata "nessuna scadenza" | Contrasta con il principio di limitazione | Definire un termine (§4.4) |
| Regole d'uso | "Puoi usare un nome utente diverso dal tuo nome reale" | Il diario chiede nome e scuola; l'uso di pseudonimo è dichiarato senza strumenti di verifica | Chiarire che il nome del diario può essere di fantasia |
| Procedura richieste | "Il riscontro è gratuito e in 30 giorni" | Il termine GDPR è un mese; per gli utenti UE si applica il termine più breve | Usare il termine più stringente |
| Analisi di ottobre (LEG-08) | "non sono state individuate integrazioni commerciali" | Corretto per il codice letto, ma il controllo di produzione è del 17 novembre | Ripetere il controllo a ogni cambio di piano |

---

## 6. Piano di azione legale, in ordine

| # | Azione | Chi decide | Perché prima |
|---|---|---|---|
| 1 | Scegliere paesi destinatari e soglia d'età | Gestore | Tutto il resto dipende da questi due punti |
| 2 | Chiarire il destino del vecchio D1 Sites (data limite, comunicazione, cancellazione) | Gestore | Dati personali senza finalità; rischio di perdita per gli utenti |
| 3 | Pubblicare informativa, regole d'uso, cookie, con collegamenti in tutte le viste | Gestore + parere | Obbligo di informazione prima della raccolta |
| 4 | Correggere il percorso di cancellazione (W8-A) e definire i termini di conservazione | Gestore, sviluppo | Riservatezza su dispositivi condivisi; limitazione |
| 5 | Avviso e limite sul campo giustificazione assenze | Gestore, sviluppo | Dati sanitari in testo libero |
| 6 | Procedura di incidente, canale per segnalazioni di sicurezza, registro | Gestore | Obbligo di notifica in caso di violazione |
| 7 | Procedura di segnalazione per classi e regole sui contenuti di terzi | Gestore | Dati di minori e di terzi |
| 8 | Verifica DPF Cloudflare e clausole; verifica NEL | Gestore | Base del trasferimento verso gli USA |
| 9 | DPIA breve | Gestore | Dati sensibili e minori |
| 10 | Parere su appunti da lezione con microfono | Gestore + professionista | Prima di ogni prova con classi |

Le voci 1–3 bloccano l'invito di nuovi utenti. Le voci 4–7 riducono il rischio per gli utenti attuali. Le voci 8–10 servono prima di crescere o di introdurre nuove funzioni.

---

## 7. Domande per il professionista

1. Con un gestore svizzero che offre un servizio gratuito a studenti anche in Italia, quali norme applicano alla raccolta e alla registrazione, e quale rappresentante è necessario?
2. La soglia d'età da scegliere è 14 o 16? Il consenso dei genitori sotto soglia è necessario se la base è il contratto?
3. Il marcatore di nota eliminata va rimosso o anonimizzato, e dopo quanto tempo?
4. La conservazione dei dati sul vecchio D1 Sites dopo la fine dell'abbonamento può essere mantenuta per un periodo di transizione? Con quale comunicazione?
5. NEL e le segnalazioni di errore di rete rientrano nell'eccezione per i servizi necessari?
6. La registrazione di lezioni da parte di studenti per uso personale, con trascrizione in memoria, è ammessa in Svizzera e in Italia? Che regole servono per una scuola?
7. Le classi con appunti condivisi richiedono una procedura di notifica e rimozione più formale?
8. Il trattamento di assenze con motivazione sanitaria richiede una base specifica o basta un avviso e la scelta di tipi predefiniti?

---

## 8. Limiti di questo approfondimento

- Non è un parere legale. Le norme sono citate per articolo e riassunte; i testi ufficiali vanno letti su fedlex.admin.ch e eur-lex.europa.eu.
- Le ricerche online hanno confermato l'impianto generale (nLPD in vigore dal 1° settembre 2023, art. 3, 19, 24, 25; art. 179bis/179ter StGB; orientamento del Garante sulle registrazioni a scuola), ma non il testo esatto di tutti gli articoli. La posizione dell'IFPDT sui cookie è citata da fonti secondarie e va verificata sul Merkblatt ufficiale.
- L'adesione di Cloudflare al DPF e l'entità contraente non sono state verificate sulle fonti ufficiali in questa sede.
- Non sono stati letti dati reali di utenti, né eseguite prove sul sito pubblicato.
- Non si valutano i rischi di altri Paesi o di scuole che adottano il servizio.
