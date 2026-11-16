# iPagell — Analisi delle lacune legali e attività da pianificare

Data: **15 ottobre 2026**. Oggetto: servizio pubblico **https://ipagell.website** e codice presente nel checkout.

**Aggiornamento del 17 ottobre 2026:** questo rapporto conserva le evidenze del 15 ottobre. Il codice locale W8-A ora include la pulizia del diario/agenda e degli Appunti dopo cancellazione, con gestione dell’errore parziale, e registra soltanto il nome delle eccezioni inattese. Il rilievo LEG-05.A e il riferimento ai messaggi nei log in LEG-10 non descrivono quindi più quel codice locale. Non è verificata qui la pubblicazione delle correzioni; gli altri aspetti di cancellazione/retention restano da valutare. Vedere l’[approfondimento operativo aggiornato](APPROFONDIMENTO-OPERATIVO-BUONE-PRATICHE-2026-10-17.md) e le [evidenze W8-A](improvement-2026-10-01/AUTH-COMPATIBILITY-W8A.md). Nessuna certificazione legale o nuova verifica live deriva da questa nota.

**Aggiornamento del 22 ottobre 2026:** il [piano essenziale](legal/ESSENZIALI-PRIVACY-2026-10-22.md) raccoglie identità/contatto, bozze aggiornate e attività residue. La lettura dei metadati Sites e delle fonti ufficiali ha identificato la controparte e il DPA previsto per l’hosting, statistiche automatiche del provider e un vincolo sul pubblico minorenne. Restano da accertare Paesi e conservazione del progetto specifico; nessun dato utente è stato letto e nessuna modifica applicativa o pubblicazione è stata eseguita.

**Scelta di proporzionalità, 22 ottobre:** su richiesta del gestore, il piano corrente è limitato a informative/regole, contatto ordinario, cancellazione e protezioni essenziali. Le condizioni e il DPA standard di Sites sono il punto di partenza; la precedente proposta di scrivere al supporto non è un adempimento obbligatorio. Il confronto documentale con School Companion, Schuno ed Escola è nel piano. I rilievi di questo audit restano materiale di analisi: non sono tutti obblighi applicabili o sistemi da costruire prima di procedere.

**Revisione documentale dell’11 novembre:** informative e regole sono state accorciate, separando il testo per gli utenti dalle note interne e conservando gli inventari tecnici utili. Le fonti ufficiali sono state rilette, inclusi i termini Sites aggiornati il 6 novembre; le verifiche residue sono raccolte nel piano minimo. Nessuna modifica all’app o nuova verifica della produzione.

## 1. Esito e limiti

**Oggi non ci sono elementi sufficienti per dichiarare iPagell pienamente conforme.** La lacuna pubblica più evidente è l’assenza di una vera informativa privacy accessibile dalla homepage e dalla registrazione. Seguono gestione dei minori, documentazione dei fornitori, conservazione, esercizio dei diritti e completezza della cancellazione.

L’analisi è tecnica e documentale, con consultazione di fonti istituzionali; non è un parere legale né una certificazione. La conformità dipende anche da identità e sede del gestore, contratti, organizzazione, Paesi serviti e dati realmente trattati. Questi fatti non si possono ricavare interamente dal codice. Non è assegnata una percentuale di conformità.

**È stato prodotto soltanto questo documento.** Nessuna modifica a funzionalità, configurazioni, database, contratti o pubblicazione. Non sono stati creati account, inviati moduli, letti dati di utenti o eseguiti test applicativi. Le azioni descritte sotto sono lavoro futuro, non operazioni già effettuate.

### Metodo ed evidenze

- Letti [AGENTS.md](../AGENTS.md), [snapshot](REPO-SNAPSHOT.md), [architettura](ARCHITECTURE-CURRENT.md), [matrice di verifica](VERIFICATION-MATRIX.md), [sicurezza](../SECURITY.md) e parti pertinenti dell’implementazione.
- Esaminate route, registrazione, schema dati, autenticazione, cancellazione, storage locale, export, classi, appunti, notifiche e tool browser.
- Consultate in sola lettura homepage e registrazione pubbliche nel browser. Confermati il link `#privacy`, il footer senza collegamenti legali e il modulo di registrazione senza informativa, condizioni o indicazioni sull’età. La registrazione si è presentata in tedesco; non è stata cambiata alcuna preferenza né inviato il form.
- Nessuna cattura completa della rete, verifica dei cookie HttpOnly o ispezione dei pannelli hosting. Nessuna attestazione di regione D1, log, backup, responsabili/subresponsabili o equivalenza integrale fra checkout e versione online.
- Il checkout conteneva già numerose modifiche e file non tracciati, lasciati intatti. Le evidenze del codice riguardano questo stato locale; i rilievi pubblici riguardano solo le pagine effettivamente consultate.

Nel seguito: **confermato** = osservato nel codice o nelle pagine indicate; **non documentato** = non dimostrato dalle evidenze disponibili, non necessariamente inesistente; **condizionale** = dipende da presupposti giuridici o organizzativi da accertare.

## 2. Prima decisione: chi gestisce il servizio e quali leggi si applicano

**Il responsabile di iPagell è Ahmed Ali, residente in Svizzera, nel Canton Ticino. Il contatto pubblico è [ipagell.service@gmail.com](mailto:ipagell.service@gmail.com).** Questo è il contesto di partenza per le valutazioni del servizio. Restano da definire la forma dell’attività e i mercati destinatari. La lingua italiana non implica che l’attività sia stabilita in Italia.

Sono predisposte le [bozze dell’informativa privacy](legal/INFORMATIVA-PRIVACY-IT-BOZZA.md) e del [testo cookie e archivi locali](legal/COOKIE-STORAGE-IT-BOZZA.md), aggiornate al 22 ottobre, con nome e contatto inseriti. Restano Paesi/garanzie specifici, conservazione e gestione operativa delle richieste. Per l’accesso sotto i 16 anni va considerato anche il vincolo Sites: la proposta dai 13 anni, con eventuali soglie superiori e rappresentanza quando necessaria, è documentata ma non applicata nel prodotto. Non è una soglia legale svizzera universale.

Le indicazioni italiane di questo rapporto, comprese quelle sui cookie e sulla soglia dei minori, sono riferimenti condizionali: non si applicano automaticamente per il fatto che iPagell è in italiano. Per cookie e tecnologie simili consultare anche le [indicazioni dell’IFPDT svizzero](https://www.edoeb.admin.ch/it/cookies-consigli-pratici). La residenza svizzera non risolve da sola la valutazione dell’eventuale ambito UE/SEE, che resta distinta come nella tabella seguente.

| Scenario da accertare | Conseguenza da valutare |
|---|---|
| Gestore in Svizzera o trattamento con effetti in Svizzera | Valutare la LPD e gli altri obblighi svizzeri pertinenti. |
| Stabilimento nell’UE/SEE | Valutare GDPR e norme nazionali pertinenti al trattamento. |
| Gestore svizzero/extra UE che offre intenzionalmente il servizio a persone nell’UE o ne monitora il comportamento nell’UE | Valutare anche l’art. 3(2) GDPR. La sola raggiungibilità del sito dall’UE non basta. |
| Gestore fuori dal territorio interessato | Verificare separatamente rappresentante UE ex art. 27 GDPR e rappresentante svizzero ex art. 14 LPD, con rispettivi presupposti ed eccezioni. |
| Uso ufficiale da scuole, docenti o enti pubblici | Definire ruoli e regole scolastiche, anche cantonali se pertinenti; non assimilare automaticamente questo uso al diario personale dello studente. |
| Offerta intenzionale in altri mercati | Prima dell’espansione, valutare le norme locali, soprattutto sui minori; questo rapporto non copre tutte le giurisdizioni del mondo. |

**Da produrre:** scheda con nome/denominazione del gestore, recapito, Paese e forma dell’attività, mercati serviti, età destinataria, uso personale o istituzionale, gratuità e modello economico effettivo. Non inserire dati fiscali o societari inventati.

Fonti: [EDPB — ambito territoriale GDPR](https://www.edpb.europa.eu/our-work-tools/our-documents/guidelines/guidelines-32018-territorial-scope-gdpr-article-3-version_en), [IFPDT — guida tecnica, campo LPD](https://www.edoeb.admin.ch/dam/edoeb/it/Dokumente/datenschutz/leitfaden_tom.pdf.download.pdf/TOM_IT.pdf), [IFPDT — rappresentante ex art. 14](https://www.edoeb.admin.ch/it/il-rappresentante-secondo-larticolo-14-lpd).

## 3. Dati e funzioni effettivamente rilevanti

| Trattamento verificato nel sorgente | Implicazione per il lavoro legale |
|---|---|
| Username, hash password, digest recupero, sessioni e data creazione | Informativa, gestione credenziali, conservazione e diritti. Username e hash non rendono anonimo l’account. |
| Nome studente, scuola facoltativa, docenti facoltativi, materie, voti e date | Dati personali scolastici; valutare necessità dei campi e possibilità di usare soprannomi. |
| Assenze con durata, giustificazione e testo libero | Il testo può rivelare salute o altre informazioni particolarmente delicate. Un’assenza non è automaticamente un dato sanitario. |
| Agenda e appunti personali sincronizzati sul server | Descrivere sincronizzazione, accessi autorizzati e copie locali. Non presentare il diario come esclusivamente sul dispositivo. |
| Nomi membri, ruoli, attività e appunti delle classi | Trasparenza verso i membri, regole di condivisione, moderazione, dati di terzi e copie successive. |
| IP elaborato per rate limiting, poi chiave hash in `auth_limits` | Finalità di sicurezza e retention. Non assumere anonimato solo perché è presente un hash. |
| IndexedDB, localStorage, Cache Storage e notifiche locali | Inventario dello storage, pulizia su dispositivo condiviso e informazione sui permessi. |
| Tool browser `read_school_summary` e `create_grade` | Possibile accesso di assistenti al riepilogo scolastico e scrittura di voti nei browser compatibili. |

Fonti tecniche: [schema](../db/schema.ts), [tipi](../types/domain.ts), [validazione](../lib/validation.ts), [autenticazione](../lib/server/auth.ts), [workspace](../components/ipagell-app.tsx).

Nell’app principale esaminata non risultano implementati pagamenti, pubblicità, analytics commerciali, login Google/Apple/email, upload di materiali o trascrizione audio. Il laboratorio AI è separato e non risulta integrato nell’app dai file esaminati. L’assenza nel sorgente non esclude servizi o log aggiunti dall’hosting.

## 4. Ordine pratico delle priorità

Le priorità indicano l’ordine del lavoro, non una classificazione delle sanzioni. Gli obblighi GDPR citati presuppongono che il regolamento sia applicabile; la LPD richiede una valutazione distinta.

| Priorità | ID | Attività | Stato |
|---|---|---|---|
| **P0 — affrontare subito** | LEG-01 | Identificare gestore, contatti e perimetro normativo | Nome, email e sede definiti; mercati e modello di servizio da precisare |
| **P0** | LEG-02 | Pubblicare informativa privacy reale e accessibile prima della raccolta | Lacuna confermata sulle pagine pubbliche consultate |
| **P0** | LEG-03 | Definire basi dei trattamenti e politica per i minori | Nessun meccanismo dedicato nel sorgente esaminato |
| **P0** | LEG-04 | Verificare contratti, fornitori, Paesi e trasferimenti | Fonti Sites reperite; Paesi/garanzie del progetto e canale email da completare |
| **P1 — interventi prioritari** | LEG-05 | Completare cancellazione locale e percorso di cancellazione account | Criticità specifiche nel codice |
| **P1** | LEG-06 | Definire conservazione e pulizia effettiva | Parziale; nessuna retention completa dimostrata |
| **P1** | LEG-07 | Attivare canale e procedura per i diritti | Non individuati nel prodotto |
| **P1** | LEG-08 | Documentare cookie/storage e verificare la necessità di consenso | Inventario da completare |
| **P1** | LEG-09 | Regole per classi, contenuti di terzi e segnalazioni | Funzioni tecniche presenti; presidio legale da definire |
| **P1** | LEG-10 | Registro, valutazione rischi/DPIA e gestione incidenti | Evidenze organizzative incomplete |
| **P1** | LEG-11 | Rendere trasparente e controllabile l’integrazione con assistenti browser | Registrazione automatica nel codice |
| **P2 — verifiche condizionali e completamento** | LEG-12 | Condizioni d’uso, identità legale e asset/licenze | Testi d’uso non individuati; licenze in parte presenti |
| **P2** | LEG-13 | Verificare applicabilità accessibilità e uso scolastico | Dipende da servizio/gestore/clienti |
| **P2** | LEG-14 | Gate per futuri AI, audio, pagamenti, marketing e nuovi mercati | Prima dell’introduzione delle funzioni |

### LEG-01 — Identità e contatti del gestore

- [ ] Compilare la scheda descritta nella sezione 2 e individuare chi decide finalità e mezzi del trattamento.
- [ ] Attivare un contatto privacy/supporto realmente presidiato e un canale riservato per incidenti e abusi. Possono coincidere in una realtà piccola, con gestione adeguata.
- [ ] Esporre sul sito l’identità e i recapiti dovuti nel caso concreto; valutare obblighi commerciali e fiscali con il professionista competente, senza presumere che ogni sito debba avere partita IVA.
- [ ] Se in futuro entra una scuola, definire se iPagell agisce come titolare, responsabile o in altro ruolo per ciascun trattamento e predisporre gli accordi corrispondenti.

**Chiusura:** un utente riesce a identificare il gestore e contattarlo senza dover cercare un profilo GitHub. [SECURITY.md](../SECURITY.md) dichiara già che un indirizzo dedicato non è definito.

### LEG-02 — Informativa privacy e punti di accesso

**Confermato:** [landing](../components/landing-content.tsx) usa `href="#privacy"` per una sezione sulla separazione dei dati personali e condivisi. Il footer contiene GitHub e accesso. [AccountGate](../components/account-gate.tsx) non presenta un’informativa prima della creazione account. [SECURITY.md](../SECURITY.md) precisa di non essere un’informativa legale.

- [ ] Redigere l’informativa sui trattamenti reali: identità/contatto, dati, scopi, basi applicabili, destinatari, trasferimenti e garanzie, tempi/criteri di conservazione, diritti, reclamo e riferimenti pertinenti. Indicare quali dati sono necessari e cosa accade se non vengono forniti; aggiungere DPO/rappresentante e decisioni automatizzate se pertinenti.
- [ ] Includere visitatori, registrazione, sincronizzazione, classi, testi liberi, copie offline, notifiche, backup esportati e assistenti browser; descrivere i log dopo averli verificati.
- [ ] Renderla accessibile senza account da homepage, calcolatore, registrazione e impostazioni; distinguere chiaramente la sezione promozionale dalla pagina legale.
- [ ] Usare un linguaggio comprensibile agli studenti e versioni coerenti nelle lingue dei destinatari effettivi. Datare e versionare il testo.

**Chiusura:** contenuti completi, nessun segnaposto, collegamenti utilizzabili prima dell’invio dei dati, corrispondenza fra testo e trattamento reale. Un checkbox “accetto la privacy” non sana un’informativa incompleta e non è una base universale per tutti i trattamenti.

Fonti: [Garante — trasparenza e informativa](https://www.garanteprivacy.it/web/guest/home/docweb/-/docweb-display/docweb/8981258), [IFPDT — obbligo di informare](https://www.edoeb.admin.ch/it/obbligo-di-informare).

### LEG-03 — Basi dei trattamenti, minori e testi delicati

**Confermato:** [signupSchema](../lib/auth-validation.ts) e [API registrazione](../app/api/auth/register/route.ts) accettano username/password; non gestiscono età, autorizzazione del genitore o versioni dei testi legali.

- [ ] Associare a ogni finalità la base appropriata. Per GDPR valutare la necessità contrattuale per le funzioni richieste e un eventuale interesse legittimo di sicurezza con bilanciamento, senza dichiararli validi automaticamente.
- [ ] Decidere destinatari e soglie d’età per Paese, capacità di stipulare il rapporto e ruolo dei genitori. L’art. 8 GDPR riguarda i trattamenti basati sul consenso nell’offerta diretta di servizi della società dell’informazione: non è una soglia universale di accesso a qualsiasi sito. In Italia la soglia prevista dall’art. 2-quinquies è 14 anni in quel contesto; sotto soglia serve il consenso di chi esercita la responsabilità genitoriale. Non trasferire automaticamente questa regola alla Svizzera o agli altri Paesi.
- [ ] Progettare una verifica proporzionata all’età e al rischio, senza raccogliere documenti d’identità per automatismo. Se necessaria, prevedere autorizzazione genitoriale verificabile e gestione del suo venir meno. Valutare anche gli account già esistenti.
- [ ] Rendere separati e documentabili gli eventuali consensi facoltativi; distinguere informativa, condizioni d’uso e permessi browser.
- [ ] Ridurre dati non necessari: soprannomi dove sufficienti, scuola/docente facoltativi, istruzioni per non inserire diagnosi, certificati, dati di compagni o altre informazioni delicate senza necessità.
- [ ] Se si ammettono intenzionalmente dati sanitari o altre categorie particolari, validare presupposti e misure ulteriori; la sola clausola nelle condizioni non risolve il trattamento effettivo.

**Chiusura:** decisione giuridica documentata su basi ed età; flusso coerente e verificato sui casi ammessi/esclusi, con minimizzazione dei dati di verifica.

Fonti: [Garante — basi e categorie particolari](https://garanteprivacy.it/web/guest/home/principi-fondamentali-del-trattamento), [Garante — applicazione della base contrattuale](https://www.garanteprivacy.it/home/docweb/-/docweb-display/docweb/10108848), [Codice privacy, art. 2-quinquies](https://www.garanteprivacy.it/documents/10160/0/Codice%2Bin%2Bmateria%2Bdi%2Bprotezione%2Bdei%2Bdati%2Bpersonali%2B%28Testo%2Bcoordinato%29.pdf/b1787d6b-6bce-07da-a38f-3742e3888c1d?download=true&version=15.0).

### LEG-04 — Fornitori, contratti e trasferimenti

**Confermato:** [configurazione hosting](../.openai/hosting.json), [architettura](ARCHITECTURE-CURRENT.md) e codice indicano Sites e binding D1 `DB`. Questo non identifica da solo entità contrattuale, catena dei subresponsabili, ubicazione o condizioni del servizio.

**Integrazione del 22 ottobre:** termini, DPA e lista subresponsabili sono collegati nelle bozze aggiornate; per il gestore svizzero la controparte Sites è OpenAI Ireland Ltd. Restano le verifiche specifiche elencate nel piano essenziale, inclusa la casella Gmail. La disponibilità di documenti generali non dimostra localizzazione o retention del singolo progetto.

- [ ] Mappare hosting, database, CDN/DNS, log, backup, assistenza e strumenti di sviluppo che possano ricevere dati personali. Distinguere erogazione del sito e trattamento di dati durante manutenzione/assistenza.
- [ ] Recuperare i contratti effettivamente applicabili al piano utilizzato e gli accordi di trattamento necessari; verificare ruoli, istruzioni, subresponsabili, sicurezza, incidenti, restituzione/cancellazione e fine servizio.
- [ ] Accertare Paesi di conservazione e di accesso remoto per dati, log e backup. Per trasferimenti soggetti a GDPR/LPD verificare lo strumento applicabile e le garanzie necessarie; non dichiarare “tutto in Svizzera/UE” dal nome del provider.
- [ ] Verificare che condizioni e capacità del servizio siano compatibili con l’uso previsto, inclusi minori e dati scolastici. Se manca una garanzia necessaria, decidere una soluzione prima di prometterla nell’informativa.

**Chiusura:** elenco fornitori aggiornato, contratti/garanzie reperibili e flussi effettivi coerenti con informativa e registro. Nessuna migrazione o modifica di hosting è stata eseguita in questo audit.

Fonti: [IFPDT — outsourcing](https://www.edoeb.admin.ch/it/outsourcing-affidamento-del-trattamento-a-un-responsabile), [IFPDT — cloud](https://www.edoeb.admin.ch/it/trattamento-di-dati-nel-cloud), [Garante — trasferimenti esteri](https://www.garanteprivacy.it/home/docweb/-/docweb-display/docweb/2036021), [IFPDT — comunicazione all’estero](https://www.edoeb.admin.ch/it/comunicazione-di-dati-personali-allestero).

### LEG-05 — Cancellazione: correggere e completare ciò che esiste

La cancellazione account **esiste già** in [AccountSecurity](../components/account-security.tsx) e [API sicurezza](../app/api/auth/security/route.ts), con riautenticazione. Non va realizzata da zero.

**A. Copia locale del diario non rimossa dal percorso di cancellazione.** Alla riga 982 del [workspace](../components/ipagell-app.tsx), il callback elimina gli Appunti con `forgetNotes()` e chiama `session.reauthenticate()`. Quest’ultima, righe 235–238 di [diary-session](../lib/diary-session.ts), azzera lo stato in memoria senza chiamare `forgetLocal()`. Il logout, invece, richiama la pulizia. Il diario in IndexedDB e il puntatore account non sono quindi esplicitamente rimossi da questo percorso. La possibile riapertura tramite fallback offline richiede una prova controllata; non è stata eseguita su utenti reali.

- [ ] Correggere il percorso per pulire diario, Appunti, cache agenda e riferimenti locali dell’account cancellato, anche in caso di errore parziale; impedire richieste obsolete di riscrittura.
- [ ] Verificare dopo cancellazione: ricarica online/offline, altra scheda, vecchio client e assenza di ricomparsa del diario sul dispositivo interessato.

**B. Ostacoli all’esercizio del diritto.** Il server blocca la cancellazione se l’utente possiede una classe. L’UI disabilita le operazioni di sicurezza con dati non sincronizzati o note pendenti. L’account senza diario completato non arriva alle impostazioni del workspace.

- [ ] Offrire una scelta comprensibile per trasferire/eliminare la classe e un canale assistito quando non si riesce a completare il percorso. Prevedere cancellazione anche per onboarding incompleto, perdita delle credenziali e sincronizzazione bloccata, con verifica proporzionata dell’identità.

**C. Copie e metadati residui.** Le cancellazioni delle note svuotano titolo e contenuto ma conservano altri campi per la sincronizzazione, inclusi nomi materia e, nelle note condivise, autore/classe. I trigger degli eventi preservano snapshot nelle agende altrui; l’eliminazione della classe può lasciare appunti nell’archivio dell’autore. Copie indipendenti negli appunti personali altrui, download e dispositivi offline richiedono una valutazione distinta.

- [ ] Definire per ogni residuo se eliminarlo, minimizzarlo o conservarlo con motivo e durata; distinguere ritiro del contenuto, cancellazione del dato personale e tutela dei diritti di terzi.
- [ ] Prevedere gestione delle cancellazioni nei backup e dopo un ripristino; informare sui limiti delle copie già scaricate senza usare tali limiti per escludere ogni responsabilità sulle copie controllate dal servizio.

**Chiusura:** matrice di cancellazione per tutte le tabelle, archivi locali, snapshot e backup; prove con account sintetici, compresi owner e onboarding incompleto. Nessuna promessa generica di eliminazione istantanea da qualsiasi dispositivo.

Evidenze: [storage diario](../lib/account-storage.ts), [storage Appunti](../lib/notes/storage.ts), [repository note](../lib/server/note-repository.ts), [trigger snapshot](../drizzle/0003_melted_dark_phoenix.sql), [schema](../db/schema.ts). Per il diritto e la sua gestione: [Garante — diritti degli interessati](https://www.garanteprivacy.it/Regolamentoue/diritti-degli-interessati).

### LEG-06 — Conservazione e pulizia

**Confermato:** cookie di sessione di 14 giorni; bucket di rate limit con scadenza legata a finestre di 15 minuti. La rimozione fisica di sessioni e bucket scaduti avviene opportunisticamente creando una sessione, non con un job dedicato. Non risultano definite retention complete per account inattivi, metadati delle note eliminate o dati infrastrutturali.

- [ ] Preparare una tabella per account attivi/inattivi/incompleti, diario, note, classi, inviti, snapshot, sessioni, rate limit, log, richieste privacy e backup.
- [ ] Per ogni categoria fissare motivo, durata o criterio verificabile, evento iniziale, responsabile della pulizia ed eventuali eccezioni motivate.
- [ ] Implementare i meccanismi necessari e verificare che la scadenza produca la pulizia anche senza nuove registrazioni/login. Per tombstone e sincronizzazione progettare un recupero sicuro dei client rimasti offline a lungo.
- [ ] Non scegliere un periodo universale “di legge” per comodità: le durate dipendono dalle finalità e dagli obblighi effettivi.

**Chiusura:** policy approvata e applicata, verifiche dei residui e documentazione delle eccezioni. Fonte: [Garante — principi, inclusa limitazione della conservazione](https://www.garanteprivacy.it/web/guest/home/principi-fondamentali-del-trattamento).

### LEG-07 — Diritti e assistenza privacy

**Confermato:** il backup V3 esporta diario, note e copie delle proprie note condivise; non costituisce da solo una risposta completa all’accesso ai dati account, membership, destinatari o trattamenti infrastrutturali. Un export tecnico può aiutare la portabilità, ove applicabile, ma accesso e portabilità non coincidono.

- [ ] Pubblicare modalità semplici per accesso, rettifica, cancellazione, limitazione, opposizione e portabilità ove spettanti; distinguere il reclamo all’autorità.
- [ ] Stabilire chi riceve e gestisce la richiesta, come verifica l’identità, come protegge dati di terzi e come recupera le informazioni dai fornitori. Non chiedere sempre un documento d’identità.
- [ ] Per GDPR organizzare il riscontro entro un mese, con eventuale proroga motivata comunicata entro il primo mese; valutare separatamente termini e modalità LPD.
- [ ] Gestire richieste di genitori/tutori valutando titolo, età e diritti del minore; non dare accesso automatico ai voti a chi si dichiara genitore.
- [ ] Consentire rettifica dei dati personali non modificabili nell’UI e un percorso per chi non riesce più ad accedere.

**Chiusura:** una richiesta campione può essere trattata dall’inizio alla risposta entro il termine pertinente, con evidenza minima e protetta. Non è obbligatorio costruire subito un portale complesso: un canale manuale efficace può essere sufficiente.

Fonti: [Garante — esercizio dei diritti](https://www.garanteprivacy.it/Regolamentoue/diritti-degli-interessati), [Garante — portabilità](https://www.garanteprivacy.it/i-miei-diritti/diritto-alla-portabilita-dei-dati). Evidenza tecnica: [backup](../lib/notes/backup.ts).

### LEG-08 — Cookie, storage e notifiche

**Integrazione del 22 ottobre:** Sites documenta statistiche di traffico automatiche senza SDK applicativo. Non è quindi verificata l’assenza di misurazioni sul sito; identificatori, durata e controlli del provider sono da accertare. Non ne discende automaticamente l’obbligo di un banner. Vedere il [testo cookie aggiornato](legal/COOKIE-STORAGE-IT-BOZZA.md).

**Non è dimostrato che serva un banner di consenso.** Il codice esaminato usa strumenti funzionali e non mostra integrazioni pubblicitarie. In Italia, per soli cookie tecnici il banner non è richiesto, mentre resta l’informazione. La classificazione va verificata anche per altri storage e componenti del provider. Fonte: [Garante — FAQ cookie, in particolare domanda 12](https://www.garanteprivacy.it/faq/cookie).

| Elemento presente nel sorgente | Durata/limite osservato da descrivere |
|---|---|
| `__Host-ipagell-session` | Max-Age 14 giorni, HttpOnly/Secure su HTTPS; distinguere cookie e record server. |
| `ipagell-db`, `ipagell-notes-db` | Copie locali e bozze senza TTL generale osservato. |
| `ipagell-active-account-v2`, cache `ipagell-class-agenda-v1:*` | Pulizia legata ai flussi account; da completare per la cancellazione. |
| `ipagell-interface-locale-v1` | Preferenza lingua, senza TTL generale osservato. |
| Marcatori installazione e `ipagell-notified-*` | Per installazione vi sono finestre logiche di 90 giorni; non equivalgono necessariamente alla rimozione fisica di tutte le chiavi. |
| Cache service worker | Shell/asset, esclusione API prevista dal codice; aggiornamento delle cache per build. |

- [ ] Fare un inventario in un browser pulito su landing, calcolatore, registrazione e sessione autenticata sintetica: dominio, nome, scopo, durata effettiva, soggetto che riceve dati e condizione di attivazione.
- [ ] Pubblicare una sezione cookie/storage coerente con l’inventario, anche integrata nell’informativa se adeguata al caso.
- [ ] Se emergono strumenti non esenti, bloccarli prima del consenso e prevedere scelta libera, rifiuto e modifica/revoca agevoli. Non aggiungere un banner vuoto per sola apparenza.
- [ ] Informare che le notifiche possono mostrare titoli di attività sulla schermata bloccata e come disattivarle. Il permesso notifiche del browser non è un consenso generale privacy.

**Chiusura:** inventario e comportamento reale concordano; le scelte, quando necessarie, producono effetti verificabili. Fonti ulteriori: [Garante — linee guida 2021](https://www.garanteprivacy.it/web/guest/home/docweb/-/docweb-display/docweb/9677876), [IFPDT — obbligo di informare](https://www.edoeb.admin.ch/it/obbligo-di-informare).

### LEG-08-bis — Accettazioni e consensi visibili all’utente

Integrazione del **17 ottobre 2026**. Specifica di analisi: nessun banner, form o registro è stato implementato. Le indicazioni cookie seguenti fanno riferimento al quadro italiano citato in LEG-08; sede e mercati del servizio vanno comunque determinati come nella sezione 2.

| Elemento | Cosa predisporre per iPagell | Quando raccogliere una scelta |
|---|---|---|
| Cookie strettamente necessari | Descrizione di nome, scopo e durata nell’informativa cookie/storage. Verificare anche quelli del provider. | Nel quadro italiano non richiedono consenso; per soli tecnici non serve il banner di accettazione. |
| Tracciamento facoltativo | Se presente, pannello con categorie/finalità, stato iniziale disattivato e gestione successiva. | Consenso preventivo per gli strumenti non esenti. Nessun caricamento anticipato del tracciatore. |
| Informativa privacy | Link evidente prima della creazione account e testo comprensibile sugli usi dei dati. | Informare non equivale a chiedere consenso: un’eventuale presa visione non legittima ogni trattamento. |
| Condizioni d’uso | Documento consultabile prima della registrazione; valutare accettazione esplicita separata e prova della versione. | Dipende dalla conclusione del rapporto; il checkbox è una soluzione progettuale da validare, non un obbligo identico per ogni sito. |
| Marketing/newsletter | Solo se introdotti: scelta dedicata, facoltativa e non preselezionata, con gestione della revoca. | Quando il trattamento richiede consenso; non condizionare automaticamente la creazione del diario al marketing. |
| Minori | Applicare la politica d’età e l’eventuale autorizzazione genitoriale definite in LEG-03. | Quando richiesto dal presupposto applicabile. Una casella con cui si dichiara un’età non risolve da sola tutti i requisiti. |
| Notifiche | Spiegazione nel contesto e richiesta del permesso browser dopo un’azione consapevole. | Permesso specifico per le notifiche; non vale come consenso generale privacy o marketing. |
| Pubblicazione nella classe | Anteprima, destinatari e conferma dell’azione, già prevista nel prodotto. | È una conferma di condivisione, da distinguere da condizioni, cookie e consensi ad altri trattamenti. |

Fonti per la distinzione fra informativa, basi del trattamento e consenso: [Garante — trattamento e trasparenza](https://www.garanteprivacy.it/web/guest/home/docweb/-/docweb-display/docweb/8981258). Per cookie e scelta dell’utente: [FAQ cookie](https://www.garanteprivacy.it/faq/cookie), [linee guida cookie 2021](https://www.garanteprivacy.it/web/guest/home/docweb/-/docweb-display/docweb/9677876). Per età, condizioni, notifiche e condivisione valgono anche le verifiche specifiche di LEG-03/09/12; la tabella non li qualifica indistintamente come consensi GDPR.

#### Attività concrete da progettare

- [ ] Mettere nel footer collegamenti riconoscibili a Privacy, Cookie/storage, Condizioni e Contatti; aggiungere gestione delle preferenze cookie se necessaria.
- [ ] Nella registrazione, rendere consultabili i testi prima dell’invio; separare eventuale accettazione delle condizioni, presa visione e scelte facoltative. Non usare un’unica casella “accetto tutto”.
- [ ] Prima di decidere il banner, completare l’inventario tecnico: il cookie di sessione non dimostra la presenza di profilazione, e l’assenza di analytics nel codice non esclude strumenti aggiunti dal provider.
- [ ] Se il banner serve, prevedere comandi chiari per accettare, rifiutare i facoltativi e personalizzare, con facilità comparabile. Rifiuto/chiusura devono lasciare disattivati i non necessari; nessun consenso da semplice navigazione o scorrimento.
- [ ] Rendere modificabile la scelta e interrompere gli usi basati sul consenso dopo la revoca. Non obbligare a creare un account per rifiutare i tracciatori.
- [ ] Definire prove proporzionate: versione di testo e finalità, momento e scelta, identificativo minimo pertinente e successive variazioni. Il registro delle condizioni e quello dei consensi hanno scopi diversi; non raccogliere IP o dati aggiuntivi per automatismo.
- [ ] Definire quando una modifica richiede nuova informazione, nuova accettazione contrattuale o nuovo consenso: non ripresentare ogni richiesta a ogni visita né equiparare queste tre operazioni.
- [ ] Verificare su browser pulito: prima della scelta, rifiuto, accettazione selettiva, riapertura preferenze, revoca e ritorno successivo. Controllare la rete e gli effetti reali, non solo la comparsa del popup.

**Decisione attuale:** nel sorgente riletto non sono emerse integrazioni di analytics commerciali o una gestione dedicata dei consensi. È prioritario predisporre informative e condizioni appropriate; l’obbligatorietà del banner resta subordinata all’inventario effettivo e al quadro applicabile. Una piattaforma commerciale per i consensi può aiutare, ma non è un acquisto obbligatorio né una garanzia automatica di conformità.

### LEG-09 — Classi, dati di terzi e contenuti illeciti

**Confermato:** condivisione e moderazione tecnica esistono; i membri vedono l’elenco della classe. Il campo `membersVisible` non costituisce un controllo effettivo di occultamento nell’implementazione corrente. Le note pubblicate e le copie successive non seguono tutte lo stesso ciclo di vita.

- [ ] Spiegare prima dell’ingresso/pubblicazione chi vede nomi, ruoli, attività e testi; dichiarare le possibilità di copia ed export. Non promettere l’invisibilità dell’elenco membri.
- [ ] Scrivere regole concrete su dati di compagni/docenti, informazioni sanitarie, molestie, impersonificazione e materiali protetti; prevedere segnalazione al gestore e gestione riservata.
- [ ] Definire trattamento dei dati di terzi inseriti nei testi e valutare gli obblighi informativi indiretti e le eventuali eccezioni, senza una clausola che scarichi ogni obbligo sugli studenti.
- [ ] Consentire segnalazione anche a chi non appartiene alla classe ma è interessato dal contenuto; stabilire presa in carico, valutazione, rimozione motivata e tutela delle persone coinvolte.
- [ ] Far qualificare l’applicabilità del DSA alle funzioni di memorizzazione/condivisione se il servizio ricade nel suo ambito. Una classe privata non è automaticamente una piattaforma che diffonde al pubblico. Verificare eventuali obblighi da hosting, incluso notice-and-action, punti di contatto, condizioni di moderazione e motivazione delle decisioni; valutare le esenzioni puntualmente.

**Chiusura:** regole accessibili, canale funzionante, responsabilità e gestione del ciclo di vita chiarite. Non serve introdurre un controllo generale di tutti i contenuti per presumere conformità.

Evidenze: [repository classi](../lib/server/class-repository.ts), [note](../lib/server/note-repository.ts), [schema](../db/schema.ts). Fonti: [Commissione UE — domande DSA](https://digital-strategy.ec.europa.eu/en/faqs/digital-services-act-questions-and-answers), [DSA — testo, inclusa distinzione fra comunicazioni private e diffusione al pubblico](https://eur-lex.europa.eu/eli/reg/2022/2065).

### LEG-10 — Accountability, sicurezza, incidenti e continuità

**Già presente:** hash delle credenziali, cookie protetto, controlli di origine e autorizzazioni, API no-store, formato note limitato e documentazione tecnica. Sono misure utili, non una certificazione. [Manutenzione](MANUTENZIONE.md) non documenta come attivi backup automatici con restore verificato, reperibilità o canale dedicato.

- [ ] Preparare il registro dei trattamenti se dovuto. Per GDPR la soglia dei 250 dipendenti non esonera automaticamente un piccolo servizio: il trattamento continuativo è rilevante. Per LPD verificare separatamente le eccezioni applicabili.
- [ ] Documentare lo screening DPIA/VIPD: minori, informazioni scolastiche, possibili dati sanitari, condivisione e accessi di assistenti sono fattori da valutare. Se il trattamento presenta rischio elevato, completare la valutazione richiesta e gestire l’eventuale rischio residuo secondo le regole applicabili. Non dichiarare obbligatoria o superflua la DPIA dalla sola dimensione del progetto.
- [ ] Valutare necessità del DPO/RPD e dei rappresentanti: il DPO non è obbligatorio per ogni sito che tratta dati personali.
- [ ] Limitare accessi amministrativi a database, hosting, sorgenti e backup; usare protezioni forti disponibili, revisionare autorizzazioni e impedire l’uso ordinario di dati reali nei test.
- [ ] Verificare log ed errori: `errorResponse()` registra nome e messaggio degli errori inattesi; accertare che messaggi del database o provider non espongano dati personali. Verificare anche header e misure dell’hosting, senza presumere che l’assenza nel codice significhi assenza online.
- [ ] Definire e provare backup/ripristino isolato, conservazione, accessi e applicazione delle cancellazioni dopo restore.
- [ ] Preparare piano incidenti e registro delle violazioni, con responsabile, contatti, contenimento e valutazione delle notifiche. Per GDPR la notifica all’autorità è senza ritardo e, ove possibile, entro 72 ore dalla conoscenza, salvo improbabilità del rischio; per la LPD l’art. 24 richiede notifica quanto prima nei casi di rischio verosimilmente elevato. Gestire anche l’informazione agli interessati quando dovuta.

**Chiusura:** evidenze organizzative e prove sintetiche, non solo policy firmate. Non sono stati eseguiti penetration test o scansioni del sito in questo task.

Fonti: [Garante — registro](https://www.garanteprivacy.it/home/faq/registro-delle-attivita-di-trattamento), [Garante — DPIA](https://www.garanteprivacy.it/it/valutazione-d-impatto-della-protezione-dei-dati-dpia-), [IFPDT — VIPD](https://www.edoeb.admin.ch/it/valutazione-dimpatto-sulla-protezione-dei-dati), [Garante — DPO privati](https://www.garanteprivacy.it/faq-sul-responsabile-della-protezione-dei-dati-rpd-in-ambito-privato), [Garante — data breach](https://www.garanteprivacy.it/data-breach), [IFPDT — sicurezza e notifiche](https://www.edoeb.admin.ch/it/sicurezza-dellinformazione).

### LEG-11 — Tool per assistenti nel browser

**Confermato:** nel [workspace](../components/ipagell-app.tsx), dall’effetto che inizia attorno alla riga 333, i tool si registrano se esiste `document.modelContext` e sono disponibili diario/preferenze. Nel codice esaminato non c’è un’opzione iPagell dedicata che preceda questa registrazione.

`read_school_summary` restituisce media, numero attività aperte e ore di assenza; `create_grade` inserisce un voto e un eventuale testo. La disponibilità effettiva, i permessi e l’eventuale invio a un servizio esterno dipendono dal browser/assistente: **non è stata osservata una trasmissione effettiva di dati a un modello**.

- [ ] Verificare quali permessi e conferme imponga l’ambiente compatibile e quali dati lasci il dispositivo durante l’utilizzo.
- [ ] Valutare come misura di privacy by default un’attivazione esplicita nell’app, disattivata inizialmente, con descrizione dei dati esposti, disattivazione semplice e controllo per le scritture.
- [ ] Aggiornare informativa, mappa dei destinatari e valutazione rischi secondo i flussi verificati. Non presentare il riepilogo delle assenze come dato privo di impatto personale.

**Chiusura:** comportamento provato in ambiente compatibile con dati sintetici e decisione documentata sui controlli. È una raccomandazione progettuale motivata dal codice, non la conclusione che ogni tool browser richieda per legge un checkbox di consenso.

### LEG-12 — Condizioni d’uso, obblighi commerciali e proprietà intellettuale

**Integrazione documentale del 22 ottobre:** sono predisposte le [regole d’uso in italiano](legal/REGOLE-USO-IT-BOZZA.md), con proposta per minori, credenziali, condivisione, diritti sui materiali, segnalazioni e cambiamenti del servizio. Restano da adottare, verificare e applicare; nessuna accettazione è stata raccolta. La [procedura per richieste privacy](legal/PROCEDURA-RICHIESTE-PRIVACY.md) dettaglia anche i casi relativi a terzi e classi. Le caselle seguenti rimangono aperte per le parti operative.

- [ ] Predisporre condizioni adatte al servizio: gestore, destinatari/età, credenziali e recupero, uso indipendente dal registro ufficiale, contenuti condivisi, copie/export, moderazione, cessazione account e modifiche del servizio.
- [ ] Far valutare modalità di conclusione e prova del rapporto, incluse eventuali versioni accettate. Distinguere accettazione delle condizioni da consenso al trattamento; la sola assenza di checkbox non prova automaticamente l’illiceità di un contratto.
- [ ] Evitare esclusioni assolute di responsabilità o clausole che pretendano di eliminare diritti inderogabili. Il disclaimer MIT del codice non è una disciplina completa del rapporto con gli utenti.
- [ ] Verificare gli obblighi italiani di informazione del prestatore, se applicabili, e quelli svizzeri per l’e-commerce se il modello vi rientra. Gli adempimenti fiscali dipendono dall’attività effettiva, non dal solo dominio.
- [ ] Controllare avvisi e attribuzioni dovuti per codice distribuito, librerie, icone, font, immagini e componenti modificati. Sono già presenti [LICENSE](../LICENSE), [licenza plugin build](../build/sites-vite-plugin.LICENSE) e licenze dei font in `public/fonts`; non risulta effettuato in questo audit un controllo legale completo del bundle.
- [ ] Conservare provenienza e diritti degli asset dimostrativi. Il sito pubblico li indica come dati dimostrativi: verificarne comunque la provenienza prima di sostituirli con screenshot di utenti.
- [ ] Chiarire che l’utente conserva i diritti sui propri appunti e concede solo i permessi necessari al funzionamento/condivisione. Non presumere che “uso scolastico” autorizzi qualsiasi copia di libri o materiale altrui.
- [ ] Valutare disponibilità del nome/marchio prima di investimenti significativi o registrazioni; l’uso di un dominio non prova l’assenza di diritti anteriori.

**Chiusura:** testi proporzionati e rivisti sul caso reale, adempimenti identificati e attribuzioni verificate. Fonti: [D.lgs. 70/2003](https://www.normattiva.it/atto/caricaDettaglioAtto?atto.codiceRedazionale=003G0090&atto.dataPubblicazioneGazzetta=2003-04-14&bloccoAggiornamentoBreadCrumb=true&dataVigenza=&generaTabId=true&qId=&tabID=&tipoDettaglio=multivigenza&title=lbl.dettaglioAtto), [Portale PMI Confederazione — obblighi e-commerce](https://www.kmu.admin.ch/it/obblighi-legali-in-svizzera-e-nellue). Le attività su licenze e marchio sono verifiche da effettuare, non violazioni già accertate.

### LEG-13 — Accessibilità e contesto scolastico

- [ ] Determinare se il servizio rientra nelle norme di accessibilità applicabili al gestore e alla categoria di servizio. L’European Accessibility Act non impone indistintamente la stessa disciplina a ogni sito: considerare perimetro, microimprese ed eventuali rapporti con enti pubblici.
- [ ] Se si applicano obblighi specifici, definire standard, informazioni/dichiarazioni richieste e canale per segnalazioni. Le prove UI già documentate nella repository non costituiscono una verifica completa di accessibilità.
- [ ] Per un’adozione scolastica ufficiale verificare contratti, ruoli, norme scolastiche/locali, accessi del personale e garanzie per gli studenti prima del pilota con dati reali.

**Chiusura:** decisione motivata sul perimetro e verifiche pertinenti. Fonte: [AgID — FAQ accessibilità](https://accessibilita.agid.gov.it/domande-frequenti/).

### LEG-14 — Valutazioni prima di nuove funzioni

Non sono lacune di funzionalità che il sito debba necessariamente aggiungere. Sono condizioni da considerare se si decide di introdurle.

| Possibile estensione | Verifica preventiva da pianificare |
|---|---|
| AI su appunti o materiali | Fornitore o funzionamento locale reale, finalità, destinatari, retention, diritti sui materiali, dati di terzi, aggiornamento DPIA e applicabilità delle regole AI pertinenti all’uso. Nessun obbligo di classificare oggi la semplice media matematica come sistema AI ad alto rischio. |
| Registrazione delle lezioni | Ammissibilità della registrazione secondo legge locale e regole dell’istituto, voce di docenti/studenti, informazione/autorizzazioni necessarie, conservazione e cancellazione audio/trascrizioni. Il permesso microfono del browser non basta. |
| Analytics, pubblicità o newsletter | Base appropriata, minimizzazione, fornitori, cookie/consensi quando dovuti, revoca/disiscrizione e protezioni specifiche per minori. |
| Abbonamenti o vendite | Informazioni precontrattuali, prezzi/imposte, rinnovi, cancellazione, recesso/rimedi applicabili, pagamenti e fiscalità; valutare anche le regole sui servizi digitali quando i dati fungono da controprestazione nei casi previsti. |
| Apertura a scuole o nuovi Paesi | Aggiornare ruoli, contratti, età, norme locali e perimetro dei rappresentanti prima dell’avvio. |

Questa tabella individua future analisi, non fornisce una valutazione normativa completa di funzioni non implementate. Riferimenti di contesto: [preparazione lezioni](LEZIONI-LIVE-AI.md), [laboratorio AI](SPAZIO-STUDIO-AI-L0.md), [IFPDT — IA e dati personali](https://www.edoeb.admin.ch/it/ia-e-protezione-dei-dati).

## 5. Consegne concrete per il prossimo lavoro

Nessuna delle consegne seguenti è stata realizzata con questo task, salvo il presente rapporto.

Questa frase descrive il task originario del 15 ottobre. Nella prosecuzione del 22 ottobre sono stati predisposti i testi e la procedura collegati sopra, che restano bozze non pubblicate e non costituiscono l’esecuzione delle attività operative elencate.

| Consegna | Responsabile da coinvolgere | Cosa dimostra il completamento |
|---|---|---|
| Scheda gestore/mercati/età e decisione sul perimetro | Gestore + consulente legale/privacy | Fatti verificati e norme applicabili motivate. |
| Mappa trattamenti e registro pertinente | Gestore + privacy + tecnico | Flussi dal browser fino a fornitori, copie e cancellazione. |
| Dossier fornitori | Gestore/contraente + privacy | Contratti, subresponsabili, Paesi, trasferimenti e retention accertati. |
| Informativa e condizioni proporzionate | Consulente + gestore; poi sviluppo | Testi approvati, pagine accessibili e versioni coerenti. |
| Flusso minori e politica dati delicati | Legale/privacy + prodotto + sviluppo | Regole giustificate, minimizzazione e casi sintetici verificati. |
| Correzione cancellazione e retention | Sviluppo + gestore infrastruttura | Pulizia verificata di dati controllati dal servizio e limiti comunicati. |
| Canale diritti/abusi e piano incidenti | Gestore + privacy + tecnico | Richiesta e incidente simulati, responsabilità e tempi gestibili. |
| Inventario storage e valutazione assistenti browser | Tecnico + privacy | Evidenze del comportamento effettivo e controlli coerenti. |
| Screening DPIA/DPO/accessibilità/DSA | Consulenti competenti + gestore | Esito motivato, anche se un obbligo risulta non applicabile. |

### Informazioni da raccogliere dal gestore prima di finalizzare i testi

1. Nome/denominazione, sede/domicilio professionale pertinente, recapito e forma dell’attività.
2. Paesi ai quali il servizio è realmente rivolto, età degli utenti e presenza di minori sotto soglia.
3. Eventuali rapporti con scuole, docenti o enti; finalità personali o istituzionali.
4. Gratuità, ricavi, pubblicità, sponsorizzazioni, donazioni o abbonamenti previsti.
5. Contratti hosting e trattamento dati, Paesi, persone con accesso amministrativo, log e backup effettivi.
6. Volumi indicativi, canale di assistenza e capacità di rispondere a richieste/incidenti.

Non è necessario rispondere pubblicamente con dati sensibili: servono al gestore e ai professionisti incaricati per trasformare le voci aperte in decisioni verificabili.

## 6. Cosa non va aggiunto per automatismo

- Un banner cookie se tutti gli strumenti effettivi sono esenti dal consenso.
- Un consenso privacy unico e obbligatorio per qualsiasi finalità.
- DPO, raccolta documenti d’identità, partita IVA o dichiarazioni di accessibilità senza verificarne i presupposti.
- La dicitura “conforme al 100%”, “dati anonimi”, “cifratura end-to-end” o “dati solo locali” senza prove corrispondenti.
- Clausole che pretendano di sostituire cancellazione, sicurezza, diritti o controllo dei fornitori.
- Nuove funzioni AI, pagamenti o registrazioni solo perché sono menzionate in questo documento.

Il prossimo passo utile è chiudere LEG-01–LEG-04 e definire le correzioni di LEG-05 con evidenze sintetiche. Solo dopo si possono finalizzare testi coerenti e verificarne l’effettiva applicazione. **Questo documento non autorizza né esegue quelle attività.**
