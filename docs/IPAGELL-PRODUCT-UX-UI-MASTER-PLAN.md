# iPagell — Master Plan UX, UI e Product Flow

> Documento di lavoro per preparare, in un secondo momento, prompt specifici per agenti che lavorano su iPagell.
>
> Questo file **non contiene i prompt operativi**. Definisce invece le fasi, gli obiettivi, i deliverable, i vincoli e i criteri di verifica da usare quando i prompt verranno scritti.

---

## 0. Scopo del lavoro

L'obiettivo non è fare un semplice restyling grafico.

Il lavoro deve portare iPagell a essere percepito come un prodotto unico, coerente e intenzionale dall'ingresso fino all'uso quotidiano:

```text
scoperta
→ landing
→ accesso / registrazione
→ onboarding
→ primo valore
→ uso quotidiano
→ gestione di errori, vuoti, offline e casi complessi
```

La domanda guida è:

> Come fa uno studente a entrare, capire cosa può fare, ottenere valore rapidamente e usare iPagell ogni giorno senza dover pensare a come è costruito?

L'obiettivo finale è che l'utente possa aprire iPagell e capire rapidamente:

- cosa deve fare;
- cosa è urgente;
- come sta andando;
- dove trovare ciò che gli serve;
- cosa è personale e cosa proviene da una classe;
- cosa è stato salvato e cosa richiede attenzione.

---

# FASE 0 — Fonti di verità e vincoli

## Obiettivo

Definire il terreno di lavoro prima di proporre modifiche.

## Principio

L'agente deve partire dal **codice corrente** e verificare il comportamento reale.

La documentazione serve come:

- contesto;
- storico delle decisioni;
- riferimento di prodotto;
- fonte di vincoli già approvati.

Non deve essere trattata automaticamente come verità se il codice corrente mostra un comportamento diverso.

## Vincoli da preservare

- Non introdurre nuove funzioni solo per riempire l'interfaccia.
- Non fare un redesign totale senza motivazione concreta.
- Non eliminare capacità esistenti senza analizzarne l'impatto.
- Preservare la separazione tra diario personale e spazio condiviso delle classi.
- Preservare la scala voti attuale 1–6 e sufficienza a 4.
- Preservare stati vuoti onesti: niente risultati o metriche inventate.
- Mobile e desktop hanno la stessa importanza.
- Tema chiaro e scuro devono restare coerenti.
- Accessibilità, focus, leggibilità e target tattili devono restare criteri di progetto.
- Il prodotto non deve assumere l'aspetto di una dashboard SaaS generica.
- Evitare nuovi framework, dipendenze o astrazioni se non producono un beneficio concreto.
- Non cambiare API, persistenza, sincronizzazione o modello dati solo per ottenere un risultato estetico, salvo quando una modifica UX richiede realmente un intervento funzionale documentato.

## Deliverable della fase

Un breve documento iniziale con:

- commit/branch analizzati;
- fonti lette;
- parti del codice ispezionate;
- vincoli confermati;
- eventuali divergenze tra documentazione e implementazione.

## Gate

Nessuna modifica UI prima di aver chiuso questa fase.

---

# FASE 1 — Product Mapping

## Obiettivo

Ricostruire iPagell come prodotto reale dal punto di vista dell'utente.

Non valutare ancora se la UI sia bella o brutta.

## Da ricostruire

### Entry point

```text
VISITATORE
├─ Landing
│  ├─ Accedi
│  └─ Crea il tuo diario
│
├─ Link invito classe
│
└─ Utente già autenticato
   └─ Area applicativa
```

### Struttura applicativa

```text
/app
├─ Home
├─ Agenda
├─ Voti
│  └─ Statistiche
├─ Assenze
├─ Classi
└─ Impostazioni
```

La mappa deve riflettere l'implementazione reale, compresi:

- route reali;
- tab interni;
- parametri URL;
- hash;
- redirect;
- deep-link;
- dialog;
- stati client;
- schermate vuote;
- schermate di errore;
- comportamento autenticato/non autenticato.

## Per ogni passaggio registrare

```text
Da dove arrivo
→ cosa vedo
→ cosa posso fare
→ quale azione è primaria
→ dove finisco
→ quale contesto viene conservato
→ quale contesto viene perso
```

## Esempio di formato

```text
FLOW-01 — Registrazione

Ingresso:
Landing

Percorso:
Landing
→ Crea il tuo diario
→ Credenziali
→ Codice di recupero
→ Configurazione iniziale
→ Home

Contesto conservato:
- ...

Contesto perso:
- ...

Decisioni richieste:
- ...

Punti di frizione:
- ...

Uscita / primo valore raggiunto:
- ...
```

## Deliverable della fase

- mappa completa delle schermate;
- mappa dei flussi;
- entry point;
- transizioni;
- punti in cui si perde il contesto;
- punti in cui l'utente può trovarsi in uno stato ambiguo.

## Gate

Non proporre ancora redesign.

---

# FASE 2 — Journey Audit

## Obiettivo

Analizzare percorsi completi e realistici invece di giudicare schermate isolate.

## Journey obbligatori

### A. Nuovo utente autonomo

```text
Landing
→ Registrazione
→ Codice di recupero
→ Configurazione iniziale
→ Home
→ Prima materia
→ Primo voto oppure prima attività
→ Primo risultato utile
```

### B. Utente che ritorna quotidianamente

```text
Apre iPagell
→ Home
→ comprende cosa richiede attenzione
→ apre l'elemento rilevante
→ esegue un'azione
→ ritorna nel contesto corretto
```

### C. Registrazione voto

```text
Home / Voti
→ materia
→ registra voto
→ conferma
→ media aggiornata
```

Verificare in particolare:

- materia selezionata;
- semestre;
- tipologia;
- ritorno al contesto;
- feedback del salvataggio.

### D. Gestione attività

```text
Home
→ attività
→ Agenda
→ giorno corretto
→ elemento corretto evidenziato
→ modifica / completa / elimina
```

### E. Classe → agenda personale

```text
Classi
→ attività condivisa
→ aggiungi alla mia agenda
→ associazione personale facoltativa
→ Agenda
→ attività collegata
```

L'utente deve capire:

- cosa segue gli aggiornamenti della classe;
- cosa rimane privato;
- cosa succede se scollega l'attività.

### F. Nuovo utente invitato

```text
Link invito
→ login / registrazione
→ configurazione minima
→ classe
→ adesione
→ attività condivise
→ eventuale aggiunta alla propria agenda
```

Verificare che l'intenzione iniziale non venga persa durante login/onboarding.

### G. Recupero account

```text
Login
→ password dimenticata
→ codice di recupero
→ nuova password
→ nuovo codice
→ nuovo accesso
```

### H. Situazioni non ideali

Provare almeno:

- nessun dato;
- nessun voto;
- nessuna attività;
- molte attività;
- molti voti;
- più materie;
- più semestri;
- più classi;
- classe senza eventi;
- offline;
- sessione scaduta;
- errore API;
- errore di rete;
- conflitto di sincronizzazione;
- attività di classe non aggiornata;
- viewport mobile;
- testo più grande.

## Metriche qualitative da osservare

Per ogni journey:

- numero di decisioni;
- numero di passaggi;
- passaggi non necessari;
- perdita di contesto;
- CTA ambigue;
- ritorni inutili;
- richieste di configurazione anticipate;
- possibilità di errore;
- feedback dopo azioni;
- tempo percepito prima di ottenere valore.

## Deliverable della fase

Una scheda per ogni journey:

```text
Obiettivo dell'utente
Percorso attuale
Friction
Contesto perso
Decisioni premature
Ambiguità
Errore possibile
Primo valore
Possibile semplificazione
```

---

# FASE 3 — Screen Purpose Audit

## Obiettivo

Definire il motivo di esistenza di ogni schermata.

Ogni schermata deve rispondere principalmente a **una domanda dell'utente**.

## Domande guida

### Landing

> Perché dovrei usare iPagell?

### Login / Registrazione

> Come entro o creo il mio diario senza confusione?

### Home

> Cosa devo sapere o fare adesso?

### Agenda

> Cosa devo preparare e quando?

### Voti

> Come sto andando nella materia che mi interessa?

### Statistiche

> Come sta cambiando il mio andamento?

### Assenze

> Cosa ho registrato e quanto ammonta?

### Classi

> Cosa è stato condiviso con me e cosa voglio portare nella mia agenda?

### Impostazioni

> Come modifico il mio diario, le preferenze o il mio account?

## Template per schermata

```text
Schermata:

Primary user question:

Primary information:

Secondary information:

Primary action:

Secondary actions:

Cosa NON deve dominare:

Cosa può essere progressivo:

Stato vuoto:

Stato con pochi dati:

Stato con molti dati:

Mobile:

Desktop:
```

## Deliverable della fase

Un contratto UX per ogni schermata principale.

---

# FASE 4 — Information Architecture

## Obiettivo

Determinare cosa deve avere più o meno importanza dentro ogni schermata.

## Classificazione

Ogni elemento viene classificato come:

```text
P0 — immediatamente visibile
P1 — facilmente disponibile
P2 — secondario
P3 — amministrazione/configurazione
P4 — progressivo/nascosto
REMOVE — non giustifica lo spazio o la complessità
```

`REMOVE` non significa eliminazione automatica: richiede sempre verifica dell'uso e delle conseguenze.

## Esempio concettuale — Classi

```text
P0
- prossime attività

P1
- aggiungi alla mia agenda
- crea attività

P2
- selettore classe
- stato/origine dell'attività

P3
- membri
- inviti
- ruoli
- modifica classe
- eliminazione / trasferimento proprietà
```

## Esempio concettuale — Agenda

```text
P0
- giorno / periodo
- attività

P1
- nuova attività

P2
- filtri
- calendario / elenco

P3
- collegamento alla gestione classi
```

## Questioni da valutare

- Quante CTA competono contemporaneamente?
- Quanti elementi sembrano avere la stessa importanza?
- Ci sono informazioni tecniche mostrate troppo presto?
- Le configurazioni occupano spazio destinato al lavoro quotidiano?
- La schermata racconta il beneficio prima della struttura interna?
- Le funzioni rare sono sempre visibili?
- Gli elementi senza dati occupano spazio?
- Le azioni distruttive hanno troppo risalto?
- L'amministrazione delle classi precede le attività?

## Deliverable della fase

Mappa P0–P4 per ogni schermata.

---

# FASE 5 — Visual Hierarchy Audit

## Obiettivo

Valutare l'impatto visivo e capire dove cade l'attenzione dell'utente.

## Non è ancora il redesign

Prima si analizza la UI esistente.

## Aspetti da valutare

- gerarchia tipografica;
- titoli;
- sottotitoli;
- valori principali;
- metadati;
- spaziatura verticale;
- densità;
- allineamento;
- contrasto;
- uso del colore;
- colore delle materie;
- bordi;
- radius;
- ombre;
- icone;
- superfici;
- card;
- CTA primaria;
- CTA secondarie;
- stati selezionati;
- filtri;
- tab;
- empty state;
- feedback di salvataggio;
- errori;
- modali/dialog;
- differenze light/dark;
- responsive.

## Test principale

Per ogni schermata:

> Dove guarda l'occhio per primo?

Poi:

> È davvero la cosa più importante?

## Test aggiuntivi

### Test dei 5 secondi

Dopo 5 secondi l'utente dovrebbe sapere cosa sta guardando e cosa può fare.

### Test della singola azione dominante

Se tutte le azioni sembrano ugualmente importanti, la gerarchia non è sufficientemente chiara.

### Test della densità

La schermata deve funzionare:

- senza dati;
- con pochi dati;
- con dataset realistico;
- con molti elementi.

## Deliverable della fase

Audit visivo per schermata con problemi e priorità.

---

# FASE 6 — Identità visiva e linguaggio comune

## Obiettivo

Definire una grammatica visuale coerente per iPagell senza trasformarla in un design system enorme.

## Aree da normalizzare

### Layout pagina

```text
max-width
padding
spacing
vertical rhythm
breakpoint
```

### Tipografia

```text
page title
section title
primary value
body
metadata
helper text
error text
```

### Superfici

```text
page background
primary surface
secondary surface
interactive surface
selected state
warning state
```

### Colori semantici

```text
brand
subject
success
warning
danger
information
neutral
```

Il colore della materia può diventare un elemento di continuità visiva, ma non deve essere l'unico modo per comunicare significato.

### Pattern da rendere coerenti

- attività;
- voto;
- materia;
- media;
- classe;
- metrica;
- empty state;
- form;
- dialog;
- section header;
- lista;
- filtri;
- stato di sincronizzazione;
- azioni distruttive.

## Obiettivo percettivo

L'utente dovrebbe percepire che tutte le sezioni fanno parte dello stesso prodotto, non di componenti sviluppati separatamente.

## Deliverable della fase

Piccola specifica visuale riutilizzabile durante i cicli successivi.

---

# FASE 7 — Schermate Hero

## Obiettivo

Concentrare la maggior parte dell'attenzione progettuale sulle schermate che determinano la percezione del prodotto.

## Priorità

1. Landing
2. Login / Registrazione / Onboarding
3. Home
4. Agenda
5. Voti
6. Classi

Assenze, Statistiche e Impostazioni possono successivamente ereditare il sistema sviluppato per queste aree.

---

## 7.1 Landing

### Deve chiarire rapidamente

- cosa fa iPagell;
- per chi è;
- cosa tiene traccia;
- cosa resta privato;
- cosa permettono le classi;
- scala voti supportata;
- differenza tra “Crea il tuo diario” e “Accedi”.

### Da evitare

- elenco eccessivo di funzionalità;
- linguaggio generico;
- dashboard finta;
- metriche inventate;
- troppe CTA equivalenti.

---

## 7.2 Login / Registrazione / Onboarding

### Obiettivo

Ridurre il tempo tra scoperta del prodotto e primo valore.

### Analizzare

- distinzione accesso/registrazione;
- quantità di informazioni richieste;
- recovery code;
- configurazione semestre;
- materie iniziali;
- valori di default;
- possibilità di rinviare configurazioni avanzate;
- ripresa dell'intenzione originale, per esempio un invito di classe.

### Principio

Non anticipare configurazioni avanzate se non sono necessarie per ottenere il primo risultato utile.

---

## 7.3 Home

### Domanda principale

> Cosa devo fare o sapere adesso?

### Gerarchia candidata

```text
1. prossima attività rilevante
2. eventuali arretrati
3. andamento / riepilogo voti
4. accessi agli approfondimenti
```

### Da evitare

- trasformarla in una replica di Agenda;
- trasformarla in una replica delle Statistiche;
- metriche a zero;
- grafici senza dati;
- numeri decorativi;
- troppe card equivalenti.

---

## 7.4 Agenda

### Domanda principale

> Cosa devo preparare e quando?

### Obiettivi

- attività al centro;
- creazione rapida;
- contesto giorno/settimana chiaro;
- provenienza personale/classe comprensibile;
- filtri secondari;
- continuità dalla Home;
- mantenimento di vista e giorno quando utile.

---

## 7.5 Voti

### Domanda principale

> Come sto andando in questa materia?

### Obiettivi

- materia sempre evidente;
- media comprensibile;
- numero di voti;
- registrazione voto rapida;
- tipologia/peso comprensibili;
- modifica dati esistenti;
- accesso progressivo a statistiche e simulazione.

### Attenzione

Evitare perdita del contesto materia/semestre durante l'apertura di form o viste secondarie.

---

## 7.6 Classi

### Domanda principale

> Cosa è stato condiviso con me e cosa voglio portare nel mio diario?

### Priorità

```text
attività
→ aggiunta alla propria agenda
→ creazione attività
→ contesto classe
→ membri / inviti / ruoli / amministrazione
```

### Principio

La struttura amministrativa della classe non deve precedere il beneficio principale.

---

# FASE 8 — Product Improvement Plan

## Obiettivo

Prima di toccare il codice, consolidare tutte le osservazioni in un piano ordinato.

## Classificazione consigliata

```text
P0 — problemi che causano errore, perdita di contesto, sfiducia o forte frizione
P1 — problemi importanti di comprensione, gerarchia o percorso
P2 — miglioramenti di coerenza e qualità
P3 — rifiniture estetiche
```

## Scheda obbligatoria per intervento

```text
ID:
Titolo:

Problema:
Evidenza:
Impatto utente:

Proposta:
Perché è migliore:

Schermate coinvolte:
Flussi coinvolti:
File probabili:

Rischi:
Possibili regressioni:

Verifica:
Criterio di completamento:
```

## Deliverable della fase

Un piano ordinato abbastanza preciso da poter essere trasformato in prompt di implementazione separati.

## Gate

Nessuna mega-modifica unica.

---

# FASE 9 — Implementazione per cicli

## Obiettivo

Evitare una singola modifica enorme e difficile da verificare.

## Sequenza consigliata

```text
Ciclo 1 — Ingresso, login, registrazione e onboarding
Ciclo 2 — Home
Ciclo 3 — Agenda
Ciclo 4 — Voti
Ciclo 5 — Classi
Ciclo 6 — Coerenza globale e schermate secondarie
Ciclo 7 — Mobile, responsive, accessibilità e rifinitura finale
```

La sequenza può cambiare se il Product Improvement Plan trova dipendenze più importanti.

## Processo per ogni ciclo

```text
1. rileggere comportamento corrente
2. identificare file realmente coinvolti
3. definire criteri d'accettazione
4. implementare modifiche circoscritte
5. eseguire controlli tecnici
6. aprire l'app
7. provare flussi reali
8. controllare mobile
9. controllare desktop
10. controllare tema chiaro
11. controllare tema scuro
12. correggere regressioni
13. documentare risultato reale
```

## Regola

Un ciclo non è concluso perché il codice compila.

È concluso quando il comportamento previsto è stato provato.

---

# FASE 10 — Verifica UX finale

## Obiettivo

Valutare il prodotto come insieme dopo le modifiche.

## Test del primo valore

Nuovo utente:

```text
Landing
→ account
→ setup minimo
→ prima azione utile
→ primo risultato riconoscibile
```

Domanda:

> Il percorso è più corto, comprensibile e intenzionale?

---

## Test dei 5 secondi

Per ogni schermata hero:

- cosa noto per primo?
- capisco dove sono?
- capisco qual è l'azione principale?

---

## Test del ritorno

Dopo:

- registrazione voto;
- apertura attività;
- modifica;
- creazione;
- passaggio a statistiche;
- aggiunta attività di classe;

verificare:

> L'utente torna nel contesto che aveva senso?

---

## Test del vuoto

Provare:

- diario nuovo;
- nessun voto;
- nessuna attività;
- nessuna assenza;
- classe vuota.

La UI deve:

- spiegare;
- guidare;
- non inventare risultati;
- non riempire lo spazio con metriche inutili.

---

## Test di densità

Provare dataset sintetici realistici con:

- molte attività;
- molte materie;
- molti voti;
- più semestri;
- più classi.

Verificare:

- scansione visiva;
- performance;
- overflow;
- filtri;
- leggibilità;
- comportamento dei dialog.

---

## Test mobile

Viewport minima di riferimento: circa 390 px.

Verificare:

- navigazione;
- target touch;
- campi;
- tastiera;
- dialog;
- filtri;
- tabelle/grafici;
- overflow;
- testo lungo;
- una mano.

---

## Test desktop

Verificare che il layout non diventi semplicemente “mobile allargato”.

Controllare:

- uso dello spazio;
- max-width;
- gerarchia;
- densità;
- colonne;
- coerenza delle superfici.

---

## Test light/dark

Le due modalità devono avere:

- gerarchia equivalente;
- contrasto leggibile;
- stati di selezione chiari;
- colori materia leggibili;
- errori e warning riconoscibili.

---

## Test accessibilità

Almeno:

- focus visibile;
- tastiera;
- target tattili;
- label;
- errore associato al campo;
- colore non come unico indicatore;
- movimento ridotto;
- testo ingrandito;
- leggibilità a 200% quando realisticamente applicabile.

---

# FASE 11 — Revisione di coerenza finale

## Obiettivo

Verificare che i singoli miglioramenti non abbiano creato nuovi linguaggi o eccezioni.

## Controllare

### Lessico

Stessi concetti = stessi nomi.

Esempi:

- materia;
- semestre;
- attività;
- classe;
- aggiungi alla mia agenda;
- scollega dalla classe;
- codice di recupero;
- diario personale salvato.

### CTA

Stessa azione = stesso verbo.

### Dialog

Stessa struttura per:

- crea;
- modifica;
- elimina;
- conferma;
- errore.

### Feedback

Distinguere sempre:

- salvato sul dispositivo;
- salvato nell'account;
- classi non aggiornate;
- offline;
- conflitto;
- sessione scaduta.

### Navigazione

Verificare che:

- non esistano percorsi morti;
- il back/ritorno abbia senso;
- il contesto non venga perso senza motivo;
- le viste secondarie non diventino nuove destinazioni principali accidentalmente.

---

# FASE 12 — Documentazione del risultato

## Obiettivo

Documentare ciò che è stato realmente cambiato.

## Aggiornare solo ciò che è necessario

- UX reference;
- guida utente;
- architettura, se il comportamento strutturale cambia;
- API, solo se cambiano contratti;
- changelog/release notes;
- criteri di verifica.

## Non fare

- dichiarare risolto un problema solo perché esiste codice;
- descrivere funzioni pianificate come implementate;
- aggiornare documenti non coinvolti;
- ampliare la documentazione senza beneficio.

---

# Deliverable complessivi

Alla fine del programma dovrebbero esistere almeno:

```text
01 — Product map
02 — Journey audit
03 — Screen purpose map
04 — Information architecture
05 — Visual hierarchy audit
06 — Visual language / design rules
07 — Product improvement plan
08 — Implementazioni per ciclo
09 — UX verification report
10 — Documentazione aggiornata
```

---

# Struttura futura dei prompt

Questo documento serve come base.

I prompt futuri non dovranno chiedere tutto contemporaneamente.

La strategia consigliata è creare prompt separati per:

```text
Prompt 01 — Product Mapping
Prompt 02 — Journey Audit
Prompt 03 — Screen Purpose + Information Architecture
Prompt 04 — Visual Hierarchy + Visual Language
Prompt 05 — Product Improvement Plan
Prompt 06 — Implementazione ciclo Onboarding
Prompt 07 — Implementazione ciclo Home
Prompt 08 — Implementazione ciclo Agenda
Prompt 09 — Implementazione ciclo Voti
Prompt 10 — Implementazione ciclo Classi
Prompt 11 — Coerenza globale
Prompt 12 — UX verification finale
```

Ogni prompt deve avere:

- scopo limitato;
- input;
- file da leggere;
- vincoli;
- deliverable;
- criteri di accettazione;
- cosa non fare;
- condizioni per fermarsi prima di modificare il codice.

---

# Principio finale

Il risultato da cercare non è:

> “iPagell ha una UI più moderna.”

Il risultato è:

> **iPagell appare come un prodotto unico: l'utente entra, capisce rapidamente cosa conta, raggiunge il primo valore con poca configurazione, mantiene il contesto mentre si sposta e trova una gerarchia visiva coerente in tutte le schermate principali.**

La qualità visiva deve rafforzare questa struttura, non sostituirla.
