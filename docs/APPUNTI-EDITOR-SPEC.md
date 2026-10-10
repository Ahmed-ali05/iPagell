# Editor degli appunti — implementazione e contratto

[Indice](README.md) · [Appunti](APPUNTI-SPEC.md) · [Formato](../lib/notes/format.ts) · [Verifiche](VERIFICATION-MATRIX.md)

Aggiornamento: **1 ottobre 2026**, applicativo Sites 27. Il [design iniziale](APPUNTI-EDITOR-DESIGN-2026-09-30.md) e il [piano](APPUNTI-EDITOR-PIANO.md) sono storici. I criteri ancora da provare non vengono presentati come risultati del rilascio.

## Componenti effettivi

| File | Responsabilità |
|---|---|
| `components/note-editor.tsx` | Editor ProseMirror, schema, comandi, composizione, limite e focus |
| `lib/notes/editor-selection.ts` | Selezione completa, bookmark, titoli e conversione liste |
| `lib/notes/format.ts` | AST, parser, serializzatore canonico e testo visibile |
| `components/note-content.tsx` | Renderer React sicuro usato da lettori e anteprima |
| `lib/notes/autosave.ts`, `hooks/use-note-autosave.ts` | Coda condivisa, dirty/retry e flush dei due editor |
| `components/notes-view.tsx`, `class-notes-panel.tsx` | Stato della nota e differenza fra sync personale/pubblicazione classe |
| `components/note-export.tsx`, `lib/notes/pdf.ts` | Preparazione PDF su richiesta, Markdown, testo e condivisione disponibile |
| `lib/notes/validation.ts`, `lib/server/note-http.ts` | Limiti, formato, contratto client e validazione server |

## Formato persistito

`title` è il titolo dell'appunto; non viene duplicato come primo blocco del corpo. `contentFormat` è obbligatorio per la nota: plain oppure md-lite-v1. Il primo tratta qualsiasi sintassi come testo letterale. Il secondo è un sottoinsieme chiuso, non Markdown completo.

| Nodo | Rappresentazione canonica |
|---|---|
| Paragrafo | Testo con escape; separazione per newline |
| Titolo di sezione | Prefisso `## ` |
| Grassetto | `**testo**` con escape di asterischi/backslash |
| Elenco puntato | `- ` per elemento |
| Elenco numerato | `1. `, `2. `… in ordine |
| A-capo nel blocco | Backslash finale non escapato seguito da newline; valido anche in titolo/elemento lista |

L'AST contiene solo questi nodi. Il serializzatore normalizza anche newline dentro un segmento di testo/grassetto; parser e serializer devono conservare testo visibile e stabilità canonica. HTML, immagini, tabelle, iframe, link eseguibili e nodi sconosciuti non sono interpretati. `NoteContent` costruisce nodi React, senza `dangerouslySetInnerHTML` per le note.

Il limite è 20.000 code point del sorgente serializzato, più 64 KiB per record/corpo nota. I marcatori contano nel limite. Il server verifica `serializeNote(parseNote(...)) === content` per md-lite-v1. I record precedenti hanno default plain tramite 0006; nessuna conversione implicita dei loro caratteri Markdown.

## Editing e selezione

Titolo/materia sono separati dal corpo. Toolbar con Grassetto, Titolo di sezione, menu Elenco puntato/numerato, Annulla e Ripeti. È montata durante editing; su desktop precede il corpo, su mobile segue il corpo e il menu si apre verso l'alto. Non è una toolbar legata alla sola visibilità della selezione nativa.

Gli eventi pointer/mouse conservano focus e bookmark; il comando ripristina la selezione nel documento corrente. La selezione completa è normalizzata per evitare posizioni incompatibili con lo schema. Titolo e liste sono reversibili tramite gli stessi comandi, preservando i blocchi di testo. L'editor resta montato per ID nota: autosave/rerender non ricreano cronologia e caret.

Shift+Enter inserisce un a-capo; Enter in lista gestisce il nuovo elemento. Keymap supporta Mod+B, Mod+Z, Mod+Shift+Z, Mod+Y e comandi di lista. La composizione viene tracciata con compositionstart/end; un comando della toolbar pendente attende la fine della composizione. Questo descrive il codice, non certifica dettatura, autocorrezione o IME su tutti i telefoni.

La conversione plain usa `escapePlain()` e verifica che il testo visibile non cambi; contenuto con carriage return non rappresentabile conserva un campo plain di fallback. L'incolla preferisce text/plain, con fallback al testo estratto da un documento HTML inerte. Non importa formattazione arbitraria.

Un comando che oltrepassa il limite lascia il testo e il formato precedenti; l'editor mostra errore e continua a ricevere modifiche. Il focus torna al corpo dopo comando. Un'eccezione del comando viene intercettata; non viene propagata come crash dell'intero workspace.

## Salvataggio e pubblicazione

Coda unica per editor: debounce, Fine, visibilità e cambio vista condividono il salvataggio in corso e drenano le modifiche sopraggiunte. L'errore mantiene dirty e consente retry; il commit locale riuscito resta tale anche se il refresh della vista fallisce.

Il personale continua nella outbox con revisione/formato/ID di mutazione. La classe conserva la base della nota aperta, salva soltanto la bozza locale e richiede anteprima e conferma prima dell'API. Il reader dell'anteprima usa lo stesso AST del reader normale.

Dopo fallimento, il testo aperto resta disponibile per Riprova, Copia testo e download di recupero. Un vero conflitto con altra scheda resta esplicito; non si forza una nuova revisione. Prima di aggiornare/chiudere l'app conservare le modifiche non persistite. beforeunload non è una garanzia di completamento asincrono.

## Export e compatibilità

PDF: titolo, materia, data e, per classe, metadati pertinenti; blocchi con grassetto/liste/a-capo e font locali con licenze. Il modulo PDF e font sono caricati su richiesta. Preparazione mostra stato/errore; poi sono disponibili Salva PDF, Apri PDF e Condividi dove la File API lo consente. Nessun DOCX implementato.

Markdown è un formato secondario; una nota plain viene convertita per export solo se senza perdita. Plain conserva anche download .txt; Copia testo usa il testo visibile. Backup V3 conserva formato, V2 importa plain, V1 riguarda il diario. `inFlight` locale non viene esportato.

Le API dei testi richiedono contratto 2 e, per update/delete, formato atteso oltre alla revisione. Un vecchio client riceve 426; la bozza va conservata. Il service worker non usa skipWaiting: un vecchio editor può restare aperto fino alla chiusura delle schede.

## Prove e limiti

Test del parser: escape, literal plain, canonicalità, newline/grassetto in tutti i blocchi, testo visibile; selezione: titoli/liste/Select all/bookmark; autosave/storage: chiamate concorrenti, modifiche durante write, risposta persa, errore quota e retry. API: formato personale/classe, contratto, permessi e CAS.

Le prove locali del rilascio verificano riapertura, anteprima e salvataggio di a-capo formattati, e rifiuto del grassetto oltre limite con editing successivo riuscito. La [matrice](VERIFICATION-MATRIX.md) conserva evidenze e conteggi. Per completare la QA mobile servono dispositivi iOS/Android fisici, tastiera virtuale/IME, focus con selezione nativa, download/condivisione PDF, PWA aggiornata e accessibilità. Non dichiararli verificati sulla base di un viewport desktop.

## Export dal lettore

Il menu dei tre punti apre Esporta appunto, una finestra dedicata con PDF e altri formati. Il corpo della nota resta al centro della vista di lettura; formati, serializzazione ed esportazione non cambiano.
