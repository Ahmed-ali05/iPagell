# Prompt operativi — editor visivo ed esportazione degli appunti

Usare i tre prompt in ordine. Il primo produce la specifica, il secondo implementa, il terzo pubblica. Il piano e le evidenze iniziali sono in [APPUNTI-EDITOR-PIANO.md](APPUNTI-EDITOR-PIANO.md). Ogni fase deve rileggere il codice corrente perché il working tree può cambiare.

## 1. Analisi esecutiva

> Lavora in /Users/ahmedali/Documents/ProgettiCodex/iPagell. Leggi AGENTS.md, docs/REPO-SNAPSHOT.md, docs/ARCHITECTURE-CURRENT.md, docs/VERIFICATION-MATRIX.md, docs/APPUNTI-SPEC.md e docs/APPUNTI-EDITOR-PIANO.md. Controlla git status: gli appunti nel working tree sono modifiche locali; preservale. Verifica sempre il codice corrente.
>
> Prepara una specifica esecutiva per rendere visivamente formattabili gli appunti personali e di classe mantenendo Markdown limitato sul backend. L'utente può essere un ragazzino: usa il campo titolo già esistente e pochi comandi contestuali per titolo di sezione, grassetto ed elenco. Non richiedere sintassi Markdown e non aggiungere istruzioni permanenti all'interfaccia.
>
> Esamina i due editor/lettori, le API, lo schema D1, la validazione, la sincronizzazione, le bozze, il backup V2, le copie tra spazi e il flusso di pubblicazione di classe. Confronta almeno due approcci tecnici all'editor visivo e scegli quello che conserva selezione, Undo/Redo, accessibilità mobile e serializzazione stabile. Definisci grammatica Markdown supportata, formato/versione dei dati, conversione senza perdita delle note plain e comportamento delle vecchie schede/PWA. Specifica come evitare scritture incompatibili da client vecchi, anche dopo una migrazione.
>
> Prototipa rendering sicuro e PDF con una nota breve e una lunga. Valuta DOCX con criteri verificabili: fedeltà, apertura dei file, dimensione del bundle e manutenzione. Se non supera i criteri, raccomanda PDF più Markdown. Considera l'export da telefono, la possibilità di condividere il file e le alternative quando il browser non consente di salvare PDF direttamente.
>
> Salva la decisione in docs/APPUNTI-EDITOR-SPEC.md con flussi mobile/desktop, esempi prima/dopo, file coinvolti, piano di migrazione, test necessari, criteri di accettazione e decisioni motivate. Non pubblicare in questa fase.

## 2. Sviluppo

> Lavora in /Users/ahmedali/Documents/ProgettiCodex/iPagell. Implementa docs/APPUNTI-EDITOR-SPEC.md dopo aver letto AGENTS.md e i documenti tecnici richiesti. Controlla git status e preserva tutte le modifiche già presenti.
>
> Mantieni gli appunti personali e di classe, le relative autorizzazioni, le bozze locali, i conflitti, i backup e la pubblicazione esplicita in classe. Realizza un editor visivo condiviso con pochi comandi contestuali e un lettore sicuro. Salva Markdown limitato con formato/versione espliciti; rendi le note plain preesistenti identiche e non sovrascriverle automaticamente. Garantisci che client vecchi non possano corrompere note convertite. Non salvare a ogni tasto sul server e non perdere contenuto durante selezione, composizione IME, incolla, navigazione, offline, cambio account o errori di storage.
>
> Aggiungi “Esporta PDF” alla lettura, con stile di stampa dedicato e metadati corretti. Mantieni la via di recupero .txt; offri Markdown come formato secondario. Aggiungi DOCX solo se il prototipo della specifica lo approva. Aggiorna API, DB/migrazioni, tipi, validazione, backup/import, copie tra spazi e traduzioni solo dove necessario. Aggiorna la documentazione tecnica diventata obsoleta.
>
> Prova unitariamente conversione, serializzazione, rendering sicuro, limiti, backup e conflitti; prova nel browser mobile e desktop editing, Undo/Redo, lettura, anteprima di classe e PDF breve/lungo. Esegui npm run release:prepare e gli smoke test pertinenti. Riporta risultati, file modificati e limiti. Non pubblicare ancora.

## 3. Pubblicazione su Sites

> Pubblica su https://ipagell.website il miglioramento degli appunti già sviluppato in /Users/ahmedali/Documents/ProgettiCodex/iPagell.
>
> Leggi AGENTS.md, docs/DEPLOYMENT.md e la skill Sites hosting. Controlla git status, identificazione del sorgente esatto e verifiche dello sviluppo. Verifica tramite Sites il progetto in .openai/hosting.json, domini, accesso, binding e stato delle migrazioni nel D1 di Sites. Preserva database, domini e accesso. Verifica che eventuali migrazioni del formato siano additive e compatibili con le note plain e con i client/PWA precedenti. Non usare deploy:sandbox.
>
> Esegui npm run release:prepare, prepara il pacchetto per Sites e pubblica la versione con il flusso Sites documentato. Attendi lo stato succeeded. Con un account di prova, verifica sul dominio canonico una nota vecchia plain, una nuova nota formattata, bozza offline/riconnessione, anteprima e pubblicazione in classe, PDF breve e lungo, backup/import e comportamento di una vecchia scheda aperta. Prova anche le funzioni principali del diario.
>
> Comunica URL, versione/identificativo di deploy, sorgente pubblicato, controlli passati, migrazioni effettivamente applicate e limiti osservati. Una build o un push GitHub da soli non equivalgono alla pubblicazione.
