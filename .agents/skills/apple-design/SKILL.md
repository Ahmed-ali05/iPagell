---
name: apple-design
description: "Progetta e rifinisci le interfacce web di iPagell con principi di design ispirati ad Apple: feedback immediato, movimento interrompibile, gesti, gerarchia visiva, materiali e tipografia accessibili. Usa per interventi UI e revisioni di interazioni; non per modifiche solo backend, dati, dipendenze o pubblicazione."
---

# Apple Design per iPagell

Adattamento della skill `apple-design` fornita dall'utente. I principi sono indicazioni progettuali per il web, non una specifica ufficiale Apple. Parametri ed esempi sono punti di partenza da verificare nell'interazione concreta, non valori obbligatori o equivalenze fra librerie.

## Contesto e ambito

Segui [AGENTS.md](../../../AGENTS.md), lo [snapshot](../../../docs/REPO-SNAPSHOT.md) e l'[architettura](../../../docs/ARCHITECTURE-CURRENT.md); verifica poi i componenti realmente coinvolti. Applica la skill alla richiesta corrente, senza un saluto obbligatorio o una pausa iniziale. La sola integrazione della skill non richiede un restyling.

Mantieni l'identità di iPagell: diario scolastico leggibile, azioni frequenti riconoscibili, palette e navigazione coerenti. Semplicità significa ridurre lo sforzo, anche aggiungendo una spiegazione utile; non nascondere comandi essenziali per ottenere una schermata vuota. Mantieni esplicito cosa è personale e cosa è condiviso con la classe.

Punti d'integrazione da rileggere quando pertinenti (possono evolvere):

| Area | Implementazione da controllare |
| --- | --- |
| Token, temi e font di sistema | `app/globals-new.css` |
| Landing e stili pubblici | `components/landing-content.tsx`, `app/marketing-page.module.css` |
| Navigazione, preferenze e ciclo account | `components/ipagell-app.tsx` |
| Dialoghi, menu e interruttori | `components/ui/dialog.tsx`, `components/action-menu.tsx`, `components/ui/switch.tsx` |
| Movimento nei grafici e nella lettura | `components/stats-view.tsx`, `components/related-notes.tsx` |
| Testi localizzati | `lib/i18n/messages/{it,de,fr,en}.json` |

Riusa i token CSS, i componenti Radix e le dipendenze presenti. CSS è adatto a feedback e transizioni semplici; una libreria a molle serve solo quando l'interazione richiede continuità e velocità. Non aggiungerla per animare ogni pulsante. Non rimuovere debounce di autosave, attese di `flushOpenNotes()` o protezioni dalle doppie scritture per rendere la UI apparentemente più veloce.

## Feedback e continuità

- Mostra subito la pressione e mantieni visibile il focus da tastiera. Esegui l'azione tramite l'attivazione semantica del controllo (`click`, submit), non in `pointerdown`: la pressione deve poter essere annullata.
- Distingui pressione, operazione in corso, completamento ed errore. Un feedback rapido non deve dichiarare salvati dati ancora in attesa o nascondere errori e conflitti.
- Conserva oggetto di origine, selezione, posizione di lettura e destinazione del focus. Entrata e uscita devono rendere comprensibile la stessa relazione spaziale; evita spostamenti decorativi di tutta la pagina.
- Per movimenti interattivi parti dal valore visibile corrente, consenti inversioni durante il movimento e conserva la velocità quando appropriato. L'interrompibilità visiva non annulla automaticamente una mutazione già inviata.
- Per drag, swipe, sheet e rilascio con inerzia, leggi [Gesti e movimento](references/gestures.md). Un gesto deve avere un'alternativa accessibile tramite controlli espliciti.

## Materiali, gerarchia e tipografia

- Organizza prima contenuto, prossima azione e strumenti secondari. Usa prossimità, allineamento, dimensione e peso per chiarire le relazioni. Le icone ambigue hanno bisogno di etichette.
- Mantieni superfici solide per testi lunghi, voti e moduli. Usa trasparenza e blur solo dove chiariscono una sovrapposizione; non rendere traslucida ogni card o barra. Il contenuto deve restare leggibile e raggiungibile sotto il chrome fisso.
- Riusa `--surface`, `--surface-solid`, `--ink`, `--subtle`, `--line` e gli accenti esistenti; valuta contrasto in tema chiaro e scuro sullo sfondo effettivo. Una superficie opaca deve funzionare anche senza `backdrop-filter`.
- Quando introduci trasparenza, considera `prefers-reduced-transparency` e `prefers-contrast` come miglioramenti progressivi; la leggibilità di base non deve dipendere dal supporto delle media query.
- Mantieni lo stack di font di sistema esistente. Regola insieme dimensione, peso, interlinea e spaziatura: titoli più compatti, corpo arioso, tracking vicino a zero per il testo continuo. Non imporre tracking positivo a tutti i caratteri piccoli.
- Usa dimensioni flessibili, verifica testo al 200% e traduzioni lunghe. Non troncare informazioni necessarie per farle entrare nella composizione.
- Preferisci `transform` e `opacity` per il movimento; evita blur animato su grandi superfici senza misure. Limita `will-change` agli elementi e ai momenti che ne beneficiano. Suoni e vibrazioni sono facoltativi e solo per un bisogno esplicito del prodotto.

## Accessibilità e Riduci movimento

In iPagell la preferenza account `preferences.reduceMotion` viene esposta come `data-reduce-motion="true"` su `document.documentElement`; il CSS considera anche `prefers-reduced-motion: reduce`. Leggi l'implementazione corrente prima di estenderla.

- Rispetta entrambi i segnali: se uno richiede movimento ridotto, elimina spostamenti, rimbalzi, parallasse e scorrimento animato non necessari. Conserva feedback statico e stato finale comprensibile.
- Non disattivare soltanto le transizioni CSS: controlla anche grafici, `requestAnimationFrame`, spring e scroll programmato. Gestisci cambi di preferenza durante l'interazione e cleanup allo smontaggio/cambio account.
- Non azzerare indiscriminatamente `transform`: può definire il centraggio di un dialogo o la posizione acceso/spento di uno switch. Rimuovi il movimento preservando geometria e stato finale.
- Conserva semantica, nome accessibile, Escape e gestione/ritorno del focus dei componenti Radix. L'animazione non deve trattenere il focus in contenuti nascosti o ritardare l'accesso ai controlli.
- Mantieni target touch comodi, indicazione di stato oltre al colore, scroll e zoom nativi. Verifica che barre e tastiera non coprano l'azione principale.

## Lavoro e verifica

Prima di una modifica visiva osserva lo stato attuale con screenshot, se il browser è disponibile, e leggi il codice. Se puoi verificare solo il sorgente, dichiaralo. Implementa l'intervento richiesto nel componente condiviso pertinente, evitando regole globali che alterino controlli estranei.

Scegli le prove proporzionate alla modifica usando la [matrice di verifica](../../../docs/VERIFICATION-MATRIX.md):

- Per UI: flusso interessato, tastiera/focus, desktop e viewport stretti (320/390 px), chiaro/scuro, testi lunghi e le quattro lingue quando coinvolte.
- Per animazioni: attivazioni rapide, inversione/annullamento, preferenza di sistema e account separatamente; controlla la build compilata quando cambiano selettori, trasformazioni o animazioni. La regressione storica dello switch mostra che la sola anteprima di sviluppo non basta.
- Per gesti: trascinamento oltre i limiti, rilascio, scroll concorrente, `pointercancel`, smontaggio e alternativa da tastiera.
- Per soli file della skill/documentazione: valida frontmatter, riferimenti e collegamenti; non avviare suite applicative o build senza modifiche al runtime.

Descrivi cosa è cambiato, le prove realmente eseguite e i limiti. Screenshot e build non certificano accessibilità, fluidità su dispositivi fisici o pubblicazione. Aggiorna documentazione pertinente se cambia il comportamento; il deploy segue esclusivamente le istruzioni della repository e la richiesta dell'utente.
