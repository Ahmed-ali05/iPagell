# iPagell — Analisi di fattibilità del sito: cosa si può fare, vincoli, utilità

[Indice](README.md) · [Snapshot](REPO-SNAPSHOT.md) · [Architettura](ARCHITECTURE-CURRENT.md) · [Verifiche](VERIFICATION-MATRIX.md) · [Conformità legale](ANALISI-CONFORMITA-LEGALE-2026-10-15.md)

Data: **18 novembre 2026**. Prima analisi, senza codice nuovo né modifiche al runtime. Ambito: `https://ipagell.website` (Worker Cloudflare `ipagell`, D1 `ipagell-live`) e le idee già in pianificazione nella repository.

Metodo: lettura di `REPO-SNAPSHOT`, `ARCHITECTURE-CURRENT`, `VERIFICATION-MATRIX`, `PRODOTTO`, `LEZIONI-LIVE-AI`, `ANALISI-CONFORMITA-LEGALE`, `legal/ESSENZIALI-PRIVACY`, `UI-REDESIGN`, e controllo nel codice di `wrangler.jsonc`, delle route `app/api/**` e della configurazione Classi. Dove un documento e il codice divergono, vale il codice. Le affermazioni giuridiche sono **analisi documentale**, non parere legale: vanno confermate da un professionista prima di diventare testo pubblico o decisione.

---

## 1. Sintesi in cinque punti

1. **Il prodotto esiste già e ha un nucleo utile**: diario personale (voti in scala 1–6, pesi, medie, agenda, assenze), appunti per materia con editor e PDF, classi con agenda condivisa, backup, quattro lingue. Il pubblico prioritario dichiarato è lo studente in Svizzera.
2. **Il collo di bottiglia non è la funzione nuova ma la fiducia**: mancano ancora la prova su iPhone fisico, la prova di restore del database e un'informativa privacy reale e accessibile. Questi tre punti hanno effetto su tutto il resto.
3. **Il rischio maggiore non è tecnico ma di dati e di minori**: i dati sono scolastici, il campo assenze può contenere informazioni sanitarie, esistono classi con testi di terzi, e il pubblico può includere minorenni. Nessuna funzione nuova che tratti audio, materiali di altri o pubblico adolescente dovrebbe partire prima di una decisione di trattamento documentata.
4. **Le idee ad alto valore e basso rischio sono poche e concrete**: consolidare il diario, ridurre gli attriti di inserimento voto, rendere più chiara la scala e le medie, promemoria in-app. Le idee ad alto impatto ma ad alto rischio (appunti da lezione con microfono, AI sui materiali, annunci/file) richiedono prima prove e decisioni che oggi non ci sono.
5. **Serve una decisione del gestore su tre temi**: pubblico (studenti singoli o scuole), età minima e rappresentanza, retention e cancellazione. Senza queste risposte, la maggior parte delle funzioni nuove resta sospesa.

---

## 2. Stato reale (verificato nel codice)

| Area | Stato | Fonte |
|---|---|---|
| Hosting | Worker `ipagell` su account Cloudflare del gestore, D1 `ipagell-live` in giurisdizione UE, binding `DB`, dal 16 novembre 2026. Staging separato (`ipagell-staging`). | `wrangler.jsonc` |
| Classi | Flag `IPAGELL_CLASSES=enabled` in produzione e staging. | `wrangler.jsonc` |
| Log | `invocation_logs: false`: non si registrano IP/posizione per ogni richiesta, restano solo errori del codice. | `wrangler.jsonc` |
| Cancellazione | Account eliminabile da `POST /api/auth/security` (operazione `delete`), bloccata se l'utente possiede classi; note, classi e materie hanno route dedicate. La pulizia locale dopo cancellazione è nel codice W8-A, non ancora pubblicata. | `app/api/auth/security/route.ts`, `lib/server/auth-repository.ts`, [ANALISI-CONFORMITA](ANALISI-CONFORMITA-LEGALE-2026-10-15.md) |
| Dati migrati | **Non migrati.** Il D1 del vecchio hosting Sites non è accessibile da qui; gli utenti devono esportare il backup JSON sul vecchio sito e importarlo dopo una nuova registrazione. | [ARCHITETTURA](ARCHITECTURE-CURRENT.md) §10, [DEPLOYMENT](DEPLOYMENT.md) |
| Schema | 23 tabelle, 9 migrazioni; **0007 e 0008 sono sul branch `auth/w8b-cloudflare` e non ancora pubblicate**. | [REPO-SNAPSHOT](REPO-SNAPSHOT.md) |
| Non implementato | AI nell'app, OCR, upload/R2, annunci, chat, co-scrittura, push ad app chiusa, altre scale di voto, login Google/Apple/email, pagamenti, pubblicità. | [REPO-SNAPSHOT](REPO-SNAPSHOT.md) §Software |
| Laboratori separati | `experiments/study-local` (Spazio Studio, ricerca su materiali con modello locale) e `experiments/lecture-notes` (sola preparazione). Nessuno è collegato all'app. | [SPAZIO-STUDIO-AI-RIPRESA](SPAZIO-STUDIO-AI-RIPRESA.md), [LEZIONI-LIVE-AI](LEZIONI-LIVE-AI.md) |

Sul branch corrente ci sono molte modifiche non committate (CSS, documentazione, migrazioni 0007/0008): prima di qualunque nuova funzione conviene chiudere questo stato, altrimenti non è chiaro cosa è in produzione.

---

## 3. Vincoli tecnici

### 3.1 Infrastruttura

- **Un solo gestore, un solo Worker, un solo D1.** Non c'è un ambiente di ripristino verificato. La matrice registra "backup infrastrutturale, restore isolato, retention" come aperti (Q02, priorità P0). Il piano Free di Cloudflare dà Workers Logs di 3 giorni e Time Travel del D1 di 7 giorni: sono finestre di recupero, non backup a lungo termine. Verificare limiti e prezzi correnti nella documentazione Cloudflare prima di prometterli.
- **Nessun object storage (R2).** Qualunque funzione con file (materiali, allegati, immagini nelle note, PDF caricati) richiede un nuovo binding, un costo, una scansione e una policy di conservazione. Non è un'aggiunta piccola.
- **Nessun push programmato.** I promemoria oggi partono solo se l'app è aperta. Il push reale richiede service worker con sottoscrizione, chiavi VAPID, gestione dei permessi del browser su iOS (funziona solo per PWA installate) e un consenso esplicito. È fattibile su Cloudflare, ma è una funzione con effetti legali propri.
- **Limiti del database.** Il D1 è un SQLite gestito; per un diario personale è adeguato, ma diventa un vincolo con migliaia di account con storico molto lungo. Le letture di liste sono già paginate per gli appunti; diario e agenda vanno ancora misurati con dataset grandi (Q05).

### 3.2 Applicazione

- **Diario come snapshot completo con CAS di revisione.** Ogni modifica riscrive il payload dell'account. È robusto ma non scala per funzioni collaborative fini (co-scrittura reale, commenti per voce). Estensioni a livello di singola riga richiederebbero un cambio di modello dati: lavoro grande, da programmare come progetto a parte.
- **Offline parziale.** La PWA ha una shell network-first e una copia personale offline; la verifica su iPhone fisico non è stata fatta (Q01). Per uno strumento scolastico usato in aula o sul treno è il requisito più sensibile.
- **Bundle client sopra 500 kB** (avviso ricorrente in build). Non bloccante, ma ogni nuova area pesante (grafici, PDF, modelli AI) peggiora il tempo di primo caricamento sul telefono.
- **Scala dei voti fissa a `numeric-1-6`.** Altre scale richiedono un contratto di dati, migrazioni e regole per cantone/scuola. L'analisi multi-sistema esiste ([GRADING-EXTENSION-AUDIT](improvement-2026-10-01/GRADING-EXTENSION-AUDIT.md)) ma non è implementata.
- **Autenticazione interna.** Username/password con sessione e codice di recupero. Login social, email e passkey sono pianificati: ciascuno aggiunge un fornitore esterno e un tema di privacy nuovo.

### 3.3 Qualità e verifica

- La CI esegue lint, tipi, test, i18n, audit delle dipendenze e prove auth su D1 locale. **Non esegue la suite API né le prove browser.** Ogni release di funzioni nuove richiede quindi una verifica manuale ripetuta.
- Le prove sono su browser desktop e su viewport simulati; **non su device fisici**, Safari iOS incluso.
- Un solo maintainer. Ogni funzione aggiuntiva aumenta il costo di manutenzione e di documentazione (il progetto ha già 88 documenti in `docs/`, secondo `npm run docs:check`).

---

## 4. Vincoli legali (analisi documentale, da confermare)

Le fonti sono quelle già in repository: [analisi di conformità](ANALISI-CONFORMITA-LEGALE-2026-10-15.md), [piano essenziale](legal/ESSENZIALI-PRIVACY-2026-10-22.md), bozze [informativa](legal/INFORMATIVA-PRIVACY-IT-BOZZA.md), [cookie](legal/COOKIE-STORAGE-IT-BOZZA.md), [regole d'uso](legal/REGOLE-USO-IT-BOZZA.md). Il piano del 22 ottobre è stato volutamente ridotto su richiesta del gestore.

| Tema | Stato | Perché conta |
|---|---|---|
| **Gestore e ambito** | Ahmed Ali, Ticino; contatto `ipagell.service@gmail.com`. Ambito GDPR/LPD da confermare in base a dove si offre il servizio e a chi (studenti in Svizzera, Italia, Germania, ecc.). | Determina quale legge si applica e chi risponde delle richieste. |
| **Informativa privacy** | Bozza pronta; **non ancora pubblicata**. La homepage ha solo un'anchor `#privacy`. | Va resa accessibile prima della registrazione. È il primo adempimento, con effetto immediato. |
| **Minori** | Proposta 13+ con eventuali soglie superiori e rappresentanza; non applicata nel prodotto. Il vincolo Sites è decaduto dal 16 novembre. | Gli studenti sono spesso minorenni. La soglia non è universale: va scelta per Paese e documentata. |
| **Dati sensibili** | Il campo assenze con testo libero può rivelare salute. Le regole d'uso vanno in questa direzione, ma non c'è un controllo tecnico. | Una nota sanitaria salvata è un dato particolare. La soluzione più semplice è un avviso e una riduzione del campo, non un'AI che lo "legge". |
| **Classi** | Dati di terzi (nomi, appunti condivisi, inviti). Moderazione e ritiro dei testi sono implementati; il presidio legale non è definito. | Chi condivide un appunto deve sapere chi lo vede e per quanto. |
| **Uso scolastico** | Se una scuola adotta iPagell, i ruoli cambiano (responsabile del trattamento, accordi). Non è il caso attuale. | Va deciso prima di proporre il servizio a istituti. |
| **Cookie e storage** | Nessun banner previsto; cookie di sessione e storage locale per funzioni essenziali. Non ci sono analytics commerciali. | Da ripetere ogni volta che si attiva un servizio Cloudflare che aggiunge script o cookie. |
| **Hosting e trasferimenti** | Cloudflare, DPA self-serve, D1 in UE, log con finestra di 3 giorni. Da verificare DPF e entità contraente. | Obbligatorio nell'informativa. Già in gran parte documentato. |
| **Dati del vecchio Sites** | Il D1 Sites resta presso il precedente fornitore. Richieste di accesso/cancellazione per quei dati non hanno un percorso chiaro. | Problema concreto e attuale: va deciso come si gestiscono. |
| **Appunti da lezione (audio)** | Ascolto di terzi in aula senza consenso è un tema penale e di privacy, non solo di prodotto. Il documento di prodotto già lo segnala. | Bloccante per qualunque pilota in classe. Va valutato prima di scrivere codice audio. |
| **Materiali altrui e AI** | Upload di dispense e testi protetti da diritto d'autore; uso di modelli su quei testi. | Serve una policy di uso e una scelta di non archiviare materiali di terzi senza licenza. |
| **Pagamenti, pubblicità, annunci** | Non implementati. | Ciascuno richiede il proprio assetto legale e fiscale; oggi non sono in programma. |

**Conclusione legale:** le cose da fare prima di crescere sono informativa pubblicata, decisione sulla soglia d'età, prassi per le richieste di diritti e chiarimento sul D1 Sites. Il resto si può valutare funzione per funzione.

---

## 5. Cosa si può fare, con valutazione

Scala: **Utilità** (per lo studente) · **Sforzo** (tecnico) · **Rischio** (legale/dati) · **Dipendenze** (cosa va prima).

### 5.1 Consolidamento (da fare prima di tutto)

| Idea | Utilità | Sforzo | Rischio | Dipendenze / note |
|---|---|---|---|---|
| Prova su iPhone fisico: installazione PWA, offline, modifica, riconnessione | Molto alta | Basso–medio | Basso | Q01 in matrice. Nessun codice nuovo. |
| Prova di restore del database e backup esportabile verificato | Molto alta | Medio | Medio | Q02. Necessaria prima di invitare più utenti. |
| Pubblicare informativa, regole d'uso, contatto privacy | Alta | Basso | Basso | Bozze pronte; decisione del gestore su testo finale. |
| Chiudere il branch `auth/w8b-cloudflare` (migrazioni 0007/0008, modifiche non committate) | Alta (per chiarezza) | Medio | Medio | Serve sapere cosa è in produzione. |
| Migrare o avvisare gli utenti del vecchio Sites | Alta | Basso (comunicazione) + manuale | Alto se nessuno lo fa | Piano di comunicazione e backup JSON. |
| Suite API e browser in CI | Media (per il gestore) | Medio | Basso | Riduce il costo di ogni rilascio. |

### 5.2 Funzioni con buon rapporto utilità/rischio

| Idea | Utilità | Sforzo | Rischio | Note |
|---|---|---|---|---|
| **Inserimento voto più rapido** (es. scorciatoie, ultimo tipo di prova usato) | Alta | Basso | Basso | Miglioria diretta del lavoro quotidiano. Già in parte presente. |
| **Medie per componenti** (Q07) | Alta per chi analizza | Medio | Medio | Richiede esempi approvati e regole chiare: altrimenti sembra un regolamento ufficiale. |
| **Vista settimana dell'agenda** | Media–alta | Medio | Basso | Solo UI; riusa dati esistenti. Il promemoria push è un passo successivo. |
| **Promemoria in-app** (già presenti con app aperta) | Media | Basso | Basso | Limite noto: nessun push ad app chiusa. |
| **Esportazione in formati più utili** (CSV del diario) | Media | Basso | Basso | Utile per chi cambia scuola o conserva lo storico. |
| **Calcolatore pubblico e landing per la ricerca** | Media (acquisizione) | Basso | Basso | Già pubblico; migliorabile solo con contenuti reali, non con promesse. |
| **Scala dei voti alternativa** (es. 0–20, 0–10, 0–100) | Alta per altri Paesi | Alto | Medio | Richiede contratto di dati, migrazioni e regole di lingua/scala. Da fare dopo il consolidamento. |

### 5.3 Funzioni con valore alto ma rischio o costo elevato

| Idea | Utilità | Sforzo | Rischio | Condizioni prima di iniziare |
|---|---|---|---|---|
| **Appunti da lezione con microfono** | Alta potenziale | Alto | **Molto alto** | Decisione su consenso in aula, ruoli scolastici, prova di qualità del riconoscimento in italiano su notebook. Il documento [LEZIONI-LIVE-AI](LEZIONI-LIVE-AI.md) prevede prima una prova isolata. |
| **Spazio Studio (ricerca su materiali con modello locale)** | Media | Alto | Medio | Prove negative finora (E2B: 3 sezioni su 43 completate). Non va in produzione senza qualificazione. Resta un laboratorio. |
| **Materiali e file (upload, R2)** | Alta per la scuola | Alto | Alto | Storage privato, scansione, copyright, costi. Rinviare. |
| **Classi con agenda condivisa più estesa** | Media | Medio | Medio | Già implementata; serve presidio di moderazione e regole scritte. |
| **Login Google/Apple/email** | Media | Medio | Medio | Nuovo fornitore e nuovi dati. Passkey è un'alternativa da valutare. |
| **Pagamenti / abbonamento / pubblicità** | Incerta | Alto | Alto | Fuori scopo attuale. |
| **Co-scrittura e chat** | Bassa per l'uso individuale | Molto alto | Alto | Fuori scopo. Cambia il modello dati. |

### 5.4 Da non fare ora

- AI che legge o riassume le assenze o i testi personali senza consenso specifico.
- Analytics sui dati scolastici "per capire l'uso": prima serve una finalità e una minimizzazione (come già scritto in [PRODOTTO](PRODOTTO.md)).
- Altri hosting, altri database o altri provider senza un problema concreto da risolvere.

---

## 6. Cosa serve per decidere

Domande al gestore, nell'ordine in cui bloccano il lavoro:

1. **Pubblico**: studenti singoli, famiglie, o scuole? Cambia ruolo legale e funzioni.
2. **Paesi**: solo Svizzera, o anche Italia e UE? Cambia il regime applicabile.
3. **Età minima**: 13, 14, 16? Con quale verifica e con quale rappresentanza?
4. **Dati del vecchio Sites**: si vuole un'azione attiva (es. avviso agli utenti) o basta la comunicazione del backup?
5. **Retention**: quanto tempo si conservano i log (già 3 giorni), i backup del D1 (Time Travel 7 giorni), gli account inattivi?
6. **Persona di riferimento**: chi risponde alle richieste e agli incidenti, e con quale tempo?

Fuori da questa analisi ma necessari per una decisione informata: budget mensile accettabile (piano Free o Paid di Cloudflare), numero di utenti attesi nei prossimi sei mesi, e se esiste un pilota con una scuola.

---

## 7. Proposta di ordine di lavoro (non vincolante)

1. **Chiarezza di stato**: chiudere il branch W8-B, decidere cosa va in produzione, comunicare a chi usa il sito.
2. **Fiducia**: prova su iPhone, prova di restore, informativa pubblicata.
3. **Qualità d'uso**: inserimento voto, vista settimana, medie per componenti con esempi approvati.
4. **Scala e Paesi**: solo dopo le decisioni del punto 6.
5. **Appunti da lezione**: solo dopo parere legale sul microfono in aula e dopo una prova tecnica isolata.

Ogni punto ha un criterio di chiusura nel documento di riferimento già esistente ([PRODOTTO](PRODOTTO.md) §Roadmap, [VERIFICATION-MATRIX](VERIFICATION-MATRIX.md) §Ancora aperto).

---

## 8. Limiti di questa analisi

- Non sono stati letti dati reali di utenti né eseguite prove sul sito pubblicato.
- Non è stato verificato lo stato live di Cloudflare (piani, limiti, DPF, subresponsabili): le informazioni vengono dai documenti in repository, che a loro volta indicano le fonti.
- Le valutazioni legali sono una lettura documentale, non un parere. Le soglie d'età e i ruoli cambiano per Paese.
- Le stime di sforzo sono qualitative; non sono preventivi.
