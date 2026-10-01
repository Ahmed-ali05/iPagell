# Appunti più leggibili — analisi documentale

> **Piano storico del 30 settembre 2026.** Editor e export sono ora implementati nella pubblicazione Sites 27. La tabella iniziale seguente fotografa il codice prima dell’intervento; per il comportamento corrente vedere [Editor](APPUNTI-EDITOR-SPEC.md) e [Verifiche](VERIFICATION-MATRIX.md).


> 30 settembre 2026. Questa analisi riguarda il working tree locale, che contiene modifiche degli appunti non ancora committate. Non certifica che la funzione sia già pubblicata su ipagell.website. La specifica della prima versione resta in [APPUNTI-SPEC.md](APPUNTI-SPEC.md).

## Obiettivo

Consentire anche a uno studente giovane di scrivere appunti ordinati senza conoscere Markdown o scegliere tra molte impostazioni. Durante la scrittura vede titoli di sezione, grassetto ed elenchi come appariranno in lettura; l'app conserva dietro le quinte un testo Markdown limitato e sicuro. L'esportazione deve produrre almeno un PDF leggibile e facile da condividere. La nuova funzione si applica agli appunti personali e a quelli della classe senza alterare le regole di visibilità.

## Stato riscontrato nel codice

| Aspetto | Evidenza nel working tree | Conseguenza |
| --- | --- | --- |
| Due spazi | components/notes-view.tsx e components/class-notes-panel.tsx gestiscono note personali e di classe. | Riutilizzare lo stesso comportamento editor/lettore, mantenendo i due flussi di pubblicazione. |
| Scrittura e lettura | Entrambi gli editor usano textarea; i lettori mostrano content come testo React; l'anteprima di pubblicazione di classe usa pre. | Non esistono ancora comandi di formattazione né rendering Markdown. |
| Dati | types/notes.ts e lib/notes/validation.ts hanno content come stringa, senza formato/versione; limite 20.000 caratteri e 64 KiB per record. Le note sono righe separate in D1, non nello snapshot del diario. | Serve distinguere in modo esplicito testo precedente e Markdown; valutare come la sintassi incida sui limiti. |
| Salvataggio | Gli editor salvano bozze in IndexedDB; hooks/use-notes.ts le sincronizza. Le note usano revisione e ID di mutazione. | L'editor deve produrre snapshot coerenti anche con selezione, composizione tastiera, offline e conflitti. |
| Classe | La bozza viene salvata localmente e pubblicata solo dopo un'anteprima e una conferma. | L'anteprima deve usare esattamente lo stesso rendering sicuro del lettore e del PDF. |
| Backup | lib/notes/backup.ts esporta/importa la versione V2 con note e bozze. | Conservare contenuto e formato in export, import e copie tra spazi; supportare i V1/V2 già prodotti. |
| Esportazione singola | La vista personale scarica un file .txt; non compare un'esportazione PDF/DOCX degli appunti. | Il PDF ha valore immediato. Un file .md può essere una scelta secondaria. |
| Rilascio | docs/DEPLOYMENT.md indica Sites e la migrazione 0005 per il backend attuale. | Prima di un nuovo rilascio verificare lo stato reale di Sites e del suo D1; non dedurlo dal working tree. |

## Scelta di prodotto raccomandata

Un **editor visivo essenziale** con un campo separato per il titolo dell'appunto e tre operazioni sul testo: *titolo di sezione*, *grassetto* ed *elenco*. L'elenco può avere punti o numeri nello stesso piccolo menu. I comandi si vedono accanto al testo solo quando servono; etichette accessibili e suggerimenti brevi restano disponibili a tastiera e lettore di schermo. Quando l'utente seleziona parole, il grassetto agisce sulla selezione; “Titolo di sezione” agisce sul paragrafo. Nessuna sintassi speciale deve essere richiesta, e non va aggiunta una spiegazione fissa nell'interfaccia.

Il documento conserva **Markdown limitato come formato canonico**, non HTML. Per la prima iterazione bastano paragrafi, titoli di sezione, grassetto, elenchi puntati e numerati. Il campo titolo diventa il titolo principale nel PDF; all'interno della nota si usano titoli di sezione. Niente HTML incorporato, immagini, tabelle, iframe o URL attivi non verificati. Incollare testo ricco deve rimuovere la formattazione non supportata senza perdere le parole. I contenuti della classe vanno renderizzati come contenuto non attendibile anche nell'anteprima e nell'export.

Il backend degli appunti **esiste già**: occorre estendere il contratto dei contenuti con un indicatore esplicito di formato, per esempio plain/markdown e versione del sottoinsieme supportato. Le vecchie note restano plain e si leggono identiche. La conversione a Markdown avviene quando l'utente sceglie di formattare una nota e non deve cambiare il testo visibile. Prima dello sviluppo va provata la compatibilità con vecchie schede/PWA: un vecchio client non deve sovrascrivere silenziosamente una nota convertita. La soluzione può richiedere un controllo di versione lato API oltre alla revisione già esistente. Non migrare automaticamente tutti i testi esistenti solo per introdurre l'editor.

Per l'esportazione, il primo comando visibile è **“Esporta PDF”** nella lettura dell'appunto. Il PDF deve avere titolo, materia, autore e classe quando pertinente, data e testo ben impaginato. Valutare una vista di stampa dedicata con stile print e salvataggio PDF del browser; verificare realmente telefono e desktop. Conservare il download .txt come recupero di emergenza in caso di errore di salvataggio. Un .md opzionale nel menu “Altri formati” offre portabilità. Il DOCX entra solo se un prototipo dimostra conversione affidabile di titoli ed elenchi, file apribile nei programmi comuni e peso accettabile nell'app: non deve ritardare PDF ed editor.

## Rischi da risolvere prima di pubblicare

1. **Testi preesistenti:** caratteri come cancelletto, asterisco e trattino basso nelle note attuali devono restare letterali finché la nota è plain.
2. **Editor e salvataggio:** selezione del testo, Undo/Redo, composizione IME, incolla, perdita del focus e passaggio in background non devono far perdere battute o mostrare “salvato” troppo presto. Il limite va calcolato sul Markdown serializzato e spiegato solo quando si avvicina.
3. **Vecchi client e conflitti:** verificare lettura e scrittura da una scheda vecchia, richieste concorrenti e recupero delle bozze. Se un vecchio client non comprende il formato, il server deve rifiutare la scrittura incompatibile conservando la bozza del client.
4. **Render sicuro:** la stessa funzione di rendering deve servire lettura, anteprima di classe ed export. Testare HTML, link pericolosi, Markdown malformato e contenuto lungo.
5. **Backup e copie:** il formato deve sopravvivere a backup V2, import ripreso dopo interruzione, copia personale↔classe, archivio autore e recupero dei conflitti. I vecchi backup restano validi.
6. **Stampa:** interruzioni di pagina, elenchi, caratteri accentati, testi lunghi e resa su browser mobile vanno provati con file reali.

## Sequenza di lavoro

1. **Analisi mirata:** provare una conversione senza perdita plain → Markdown, selezionare editor e renderer adatti alla build Sites e decidere come bloccare vecchi client incompatibili. Produrre una specifica breve con esempi e criteri misurabili.
2. **Sviluppo:** aggiornare modello, API e backup; creare editor/lettore condivisi per i due spazi; aggiungere export PDF; testare sicurezza, salvataggio e UX su telefono. Valutare DOCX con prototipo separato e includerlo soltanto se supera le prove.
3. **Rilascio:** verificare il progetto Sites e il D1 correnti, applicare l'eventuale migrazione additiva, pubblicare il sorgente esatto e provare il flusso completo su ipagell.website con account di prova.
