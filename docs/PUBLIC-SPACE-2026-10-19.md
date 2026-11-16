# Spazio pubblico — 19 ottobre 2026

## Esperienza

La parte pubblica ha quattro destinazioni con URL propri e una navigazione comune: panoramica, scoperta del diario, appunti online e calcolo della media. La panoramica usa una composizione editoriale su fondo carta, accenti viola e una copertina che introduce il diario. Il diario si esplora per capitoli (funzioni, privacy, domande), con il tour Agenda/Voti/Appunti e le informazioni su Statistiche, Assenze e Classi. Le immagini esistenti restano ingrandibili e dichiarano i dati dimostrativi. Le quattro lingue hanno metadata, canonical e alternate; la sitemap contiene sedici URL.

`PublicHeader`, `PublicFooter` e `PublicLink` collegano le pagine. I link attendono `flushOpenNotes()`; un errore apre un dialogo che consente di rimanere e salvare una copia oppure uscire esplicitamente. I comandi di navigazione conservano semantica nativa, apertura in una nuova scheda e focus visibile. La palette pubblica resta chiara anche se il diario usa il tema scuro.

## Appunti e dati

- Un solo foglio pubblico, indipendente dall’account. Titolo e argomento sono facoltativi, con limite di 120 caratteri; contenuto nel formato esistente `md-lite-v1`, massimo 20.000 code point.
- Editor ProseMirror, lettore e generatore PDF esistenti riutilizzati. Scrittura/anteprima conserva l’editor montato e la sua cronologia; l’anteprima mostra il titolo completo. Grassetto, titoli di sezione, elenchi e annulla/ripeti restano quelli dell’app.
- IndexedDB separato: `ipagell-public-notes-v1`, store `draft`, chiave `current`. Validazione rigorosa e revisione atomica impediscono sovrascritture da una scheda obsoleta. `useNoteAutosave` mantiene debounce, coda, flush e protezione prima di uscire.
- In caso di bozza illeggibile, scelta esplicita fra riprovare e aprire un foglio temporaneo. Un errore di salvataggio non cancella il testo. Conflitti: esportare le proprie modifiche oppure riaprire la bozza salvata dopo conferma. Nuovo foglio richiede conferma e non scavalca un conflitto.
- PDF generato su richiesta nel browser; il link pronto si invalida se cambiano testo, titolo, argomento o lingua. Markdown include titolo/argomento, conserva la formattazione e protegge il testo letterale da interpretazioni HTML/Markdown involontarie. Nessun upload.
- Il calcolatore conserva gli input nella sessionStorage della scheda e ricostruisce i valori numerici dagli input validati. Nessuna modifica alle formule, API o dati dell’account.

La bozza locale non equivale a un backup: cancellare i dati del browser la elimina. La pagina non promette funzionamento offline e non modifica la policy di registrazione del service worker.

## Verifiche

- `npm run check`: lint, TypeScript, 140 test, 837 chiavi complete e referenziate in it/de/fr/en, inventario e collegamenti documentali.
- Test nuovi: persistenza e concorrenza atomica, reset con revisione obsoleta, rifiuto di record corrotti/sovralimite, Markdown con markup letterale e liste multilinea, recupero degli input del calcolatore, canonical e sitemap.
- Browser con testo sintetico: scrittura, bozza recuperata dopo cambio pagina e ricarica, media conservata dopo il ritorno, preview, PDF pronto invalidato dopo modifica, download effettivo PDF e Markdown. PDF scaricato renderizzato con Poppler e ispezionato.
- Due schede: conflitto rilevato, uscita bloccata con dialogo, Annulla restituisce il focus al link, recupero della versione salvata riuscito.
- Layout verificato a 1440, 390 e 320 px; controlli localizzati e anteprima sulle viewport strette. Build compilata: navigazione con frecce/Home tra capitoli e tour, ingrandimento/Escape e ritorno del focus, editor con titolo di sezione ed elenco, PDF formattato scaricato e renderizzato, nuovo foglio confermato.
- Copie HTML statiche derivate dalla build, senza script, per panoramica e anteprima appunti: testo al 200%, `data-theme="dark"` e `data-reduce-motion="true"`, 320 px senza overflow. Navigazione a due colonne e comandi export impilati; transizioni a 0 s. Questa prova verifica il CSS, non la persistenza delle preferenze o l’interazione con lettori di schermo. La preferenza di sistema per movimento ridotto non è stata emulata.
- Build finale e precache riuscite; rimangono gli avvisi della toolchain su chunk oltre 500 kB e classificazione statica di alcune route Vinext.

Nessuna dipendenza aggiunta o modifica a database remoti durante lo sviluppo. Le prove locali non certificano dispositivi fisici, tastiera virtuale/IME o accessibilità completa con lettore di schermo. Output di verifica e screenshot sono locali e ignorati da Git.

## Pubblicazione — 20 ottobre 2026

Sites **40** pubblicata con successo su https://ipagell.website. Sorgente isolato dalla produzione 39, commit `482e550c2541d8bf1994e53f29f49ae8441bbfa5`; esperimenti e auth W8-A esclusi. Suite già eseguite non ripetute su richiesta dell’utente; eseguita la build del pacchetto destinato alla produzione. [Dettagli del rilascio](DEPLOYMENT.md#spazio-pubblico-multipagina--sites-40-20-ottobre-2026).

## Ritorno dai moduli account — 20 ottobre 2026

Accedi, Crea account e Recupera password espongono «Torna alla panoramica» con freccia e URL pubblico canonico della lingua selezionata. Il link funziona anche con ingresso diretto in `/app`, senza dipendere dalla cronologia browser. Durante una richiesta pendente la navigazione attende la fine dell’operazione; il passaggio di custodia del codice recupero e il setup autenticato conservano il percorso esistente.

Correzione pubblicata in Sites **41**, deployment `appgdep_6ad73f2fad9c8191a5db1c849121843f` riuscito. Prova incrementale sulla build: Enter dal link in registrazione ritorna alla panoramica; link presente anche in accesso e recupero. Quattro lingue a 320 px, nessun overflow e target alto 44 px. Lint del componente e build superati, suite pregresse non ripetute. Nessuna verifica su dispositivo fisico o lettore di schermo.

## Posizionamento Svizzera — 21 ottobre 2026

Revisione locale di panoramica, diario, calcolatore e ingresso alla registrazione: pubblico esplicito di chi studia in Svizzera, scala 1–6 con 6 migliore e altre scale non ancora supportate. La homepage conserva il titolo editoriale e introduce un richiamo sobrio a Ticino, Grigioni, Vaud e Zurigo, alle quattro lingue disponibili e alla personalizzazione di materie, periodi e pesi. FAQ e calcolatore distinguono il risultato indicativo dai regolamenti della scuola. Nessun blocco geografico, preset cantonale o modifica alle formule.

Metadata di tutte le sedici pagine pubbliche localizzati sul contesto svizzero; diario e appunti hanno titoli SEO dedicati. Alternate CH e fallback generici condividono gli URL esistenti e una sola funzione tra HTML e sitemap; Open Graph inglese passa da en_GB a en_CH. Nessuna pagina duplicata per cantone. Riferimento tecnico: [versioni localizzate, Google Search Central](https://developers.google.com/search/docs/specialty/international/localized-versions). Questi segnali descrivono il pubblico; non attestano un miglioramento di ranking o indicizzazione.

Verifiche della revisione: `npm run check` superato (lint, TypeScript, 141 test, 845 chiavi i18n, inventario e link); build/precache riuscite con gli avvisi già presenti sui chunk e la classificazione Vinext. Test dei metadata sulle sedici route: canonical preservati, alternate reciproci e identici alla sitemap, Open Graph CH. Browser in sviluppo: homepage e calcolatore nelle quattro lingue a 320/390 px, registrazione a 320 px, homepage italiana desktop a 1440 px; nessun overflow orizzontale nei casi misurati. Controllati testo visibile e alternate HTML della homepage. Nessun account creato. Non verificati dispositivi fisici, lettori di schermo, zoom 200% o indicizzazione reale. Modifiche non pubblicate in questo task.
