# Appunti personali e della classe — comportamento corrente

[Indice](README.md) · [Editor](APPUNTI-EDITOR-SPEC.md) · [API](API.md) · [Architettura](ARCHITECTURE-CURRENT.md)

Aggiornamento: **1 ottobre 2026**, codice applicativo Sites 27. La [specifica iniziale](APPUNTI-DESIGN-2026-09-30.md) conserva le decisioni del primo progetto; non è la descrizione corrente. Questo documento distingue comportamento implementato e limiti ancora da verificare.

## Due spazi e copie indipendenti

| Aspetto | Personale | Classe |
|---|---|---|
| Visibilità | Solo account proprietario | Membri attuali della classe dopo pubblicazione |
| Materia | ID stabile di una materia del diario | ID di `class_subjects` della classe |
| Semestre | Indipendente dal semestre selezionato | Indipendente dal diario personale |
| Scrittura | Bozza locale, poi sync automatica se completa | Bozza privata; anteprima e conferma esplicita online |
| Modifica testo pubblicato | Proprietario | Autore; owner/moderator possono ritirare per moderazione |
| Pin | Campo della nota personale | Preferenza separata per ciascun membro |
| Offline | Testi disponibili sul dispositivo, modifica e retry | Bozza aperta salvabile; lettura autorizzata/pubblicazione richiedono rete |

Copiare fra spazi genera un nuovo ID e richiede la materia di destinazione. Aggiornare l'originale non cambia la copia. Nessun link pubblico, co-scrittura o modifica automatica dei testi altrui.

## Ingressi e lettura

Home mostra fino a tre appunti recenti, Tutti gli appunti e Nuovo appunto. La materia in Voti e le attività private associate a materia in Agenda aprono un elenco filtrato. Torna a… conserva il contesto in memoria nello stesso workspace. Nessuna sesta voce nella barra di navigazione.

In Classe il selettore separa Attività e Appunti della classe; il cambio attende il flush della nota aperta. Le bozze personali compaiono prima dei testi condivisi. Copie, gestione materie e archivio autore sono sezioni secondarie.

Elenco: ricerca per titolo/testo visibile normalizzati per maiuscole e accenti, filtro materia, anteprime, data, pin; in classe anche autore. I risultati dipendono dall'archivio effettivamente caricato. La UI distingue caricamento parziale e completo; la paginazione non è una ricerca full-text sul server.

## Materie e note incomplete

È possibile iniziare prima di scegliere titolo o materia e aggiungere una materia dall'editor senza perdere il testo. Le bozze incomplete restano locali; titolo e materia validi sono necessari per inviare la nota. Le materie personali e della classe non vengono unite per nome.

Rinomina/archiviazione/eliminazione di materia non cancella il testo dell'appunto: il nome storico resta disponibile, con scelta esplicita di una nuova materia quando serve. Il riferimento personale non dipende dal semestre. Le materie di classe hanno revisione e archiviazione; owner/moderator rinominano, archiviano o eliminano, mentre i membri possono aggiungerle. Nomi duplicati normalizzati sono rifiutati. Le etichette degli eventi legacy restano compatibili e vengono seminate nel catalogo di classe.

## Editor e formato

Un solo `NoteEditor` ProseMirror per i due spazi, con title separato e corpo: paragrafi, titolo di sezione, grassetto, elenco puntato/numerato, a-capo, annulla/ripeti. `plain` conserva note precedenti senza interpretare Markdown. `md-lite-v1` è un formato chiuso e canonico con conversione esplicita tramite comandi. Non ammette HTML, immagini, allegati, link attivi arbitrari, tabelle o Markdown generale.

Parser e serializzatore sono condivisi da lettore, anteprima, ricerca, estratti e PDF. La selezione viene conservata tramite bookmark; editor e cronologia non vengono ricostruiti a ogni salvataggio. Dettagli, limiti e prove fisiche mancanti: [Editor](APPUNTI-EDITOR-SPEC.md).

## Salvataggio personale

`useNoteAutosave` e `DraftAutosaver` serializzano autosave (700 ms), Fine, cambio vista e visibilità. Il flush include modifiche arrivate durante una scrittura. Un fallimento conserva dirty e consente retry. Chiudere senza modifiche non genera una nota vuota.

La bozza viene verificata e persistita atomicamente in IndexedDB prima di confermare Salvato sul dispositivo. L'aggiornamento della vista e la notifica alle altre schede sono successivi: una loro failure non trasforma un commit riuscito in una falsa mancata scrittura.

Per sync `useNotes` registra `inFlight` con l'esatto payload, poi invia revisione base, formato atteso e ID di mutazione. La conferma della propria scrittura può aggiornare i metadati della bozza successiva senza rifiutarla o cancellarne il testo. Risposta persa: stesso payload/ID per retry. Vera modifica da altro writer: conflitto conservato, nessun overwrite silenzioso. Una risposta definitiva 400/413 permette la correzione della bozza; un errore di rete mantiene la richiesta incerta. Le pagine vecchie non fanno regredire nota/cursore.

`BroadcastChannel` aggiorna le viste dello stesso account, ma la protezione delle scritture è la transazione IndexedDB e il CAS server. Salvato sul dispositivo e Salvato nell'account sono conferme distinte.

## Bozza e pubblicazione della classe

Salva bozza e chiudi persiste solo su questo dispositivo. Controlla e condividi salva il testo e apre l'anteprima; Pubblica/Aggiorna per la classe è il gesto successivo che invia la richiesta. Un refresh non pubblica e non aggiorna la revisione base del testo già aperto.

Il server verifica membership nella classe e autore della modifica. Un conflitto o una risposta persa non autorizza a forzare la revisione. La bozza resta disponibile con retry/copia/download. Ritirare la nota condivisa è distinto dall'eliminare la bozza privata.

Uscita/rimozione toglie l'accesso alle note altrui. L'autore ritrova i propri testi tramite l'archivio autore e può copiarli o ritirarli. Eliminare la classe stacca la nota dalla classe, conservando il testo dell'autore; le note non diventano pubbliche. Non c'è cestino o storico completo delle revisioni.

## Quote, API e storage

| Vincolo | Valore implementato |
|---|---|
| Titolo | 1–120 code point dopo trim per pubblicazione/sync |
| Corpo | Massimo 20.000 code point serializzati |
| Record / scrittura nota | Massimo 65.536 byte |
| Personale | 500 note attive, 8 MiB |
| Classe | 200 note attive, 4 MiB |
| Nuove materie attive nel controllo di creazione | 60, escluse le etichette legacy seminate |
| Bozze locali complessive | Controllo applicativo 8 MiB, distinto dalla quota effettiva del browser |
| Liste note | Fino a 50 righe e limite di risposta 512 KiB |
| Backup V2/V3 | Massimo 24 MiB |

Questi limiti sono controlli, non benchmark su telefono o garanzia di spazio disponibile. Le quote D1 sono protette da trigger; revisione/formato e membership sono verificati anche nella scrittura SQL. Le cancellazioni personali producono tombstone e avanzano `changeSeq`.

IndexedDB `ipagell-notes-db` versione 2: `personal`, `classDrafts`, `meta`; separazione per `userId`, cursore e piano d'import locali. `inFlight` è metadato opzionale, non una migrazione di schema né parte del backup. D1 aggiunto con 0005/0006: `personal_notes`, `personal_note_sequences`, `class_subjects`, `class_notes`, `class_note_pins`.

Tutte le route dei testi, pin e archivio autore richiedono `X-IPagell-Notes-Contract: 2`; materia di classe ha route separata senza questo vincolo. Scritture note richiedono account atteso e formato esplicito; update/delete anche `expectedContentFormat`. [API](API.md) elenca tutti i metodi e cursori.

## Backup, import e recupero

Export V3 conserva formato in note, bozze, conflitti e snapshot delle note dell'autore. Export completo aggiorna l'archivio personale e legge quello autore; senza rete/letture complete è etichettato device-only e richiede conferma. Nessun token, password, membership o invito nel file.

Import V1 sostituisce solo diario/preferenze e mantiene gli appunti esistenti. V2 viene interpretato plain; V3 mantiene formato. V2/V3 richiedono export della situazione corrente, controllo quote e piano IndexedDB riprendibile, rimappano gli ID, sostituiscono il diario e aggiungono copie degli appunti senza pubblicare in classe. Bozze/note della classe diventano personali e possono richiedere la scelta di una materia privata. File V1 massimo 1.500.000 byte; V2/V3 24 MiB. La busta di sincronizzazione diario ha un limite distinto.

Il logout esegue il flush e distingue note pendenti: può conservarle sul dispositivo per il medesimo account. Un altro account non le eredita. Non cancellare storage per risolvere un errore senza recuperare il testo aperto o esportare. PDF è export di una nota; non sostituisce il backup JSON ripristinabile.

## Evidenze e lavoro aperto

Il rilascio 27 ha 103 test e 146 verifiche API locali, casi di IndexedDB/risposta persa/quota, formato multilinea ed editing dei due spazi. Browser locale: riapertura personale, bozza/anteprima/pubblicazione di classe e recupero dopo limite. [Matrice](VERIFICATION-MATRIX.md) distingue risultati della sessione, CI e produzione.

Restano da provare sistematicamente iOS/Android fisici, IME/tastiera virtuale, installazione/aggiornamento PWA, export aperto sui dispositivi, dataset massimo, accessibilità completa e restore infrastrutturale. Nessuna affermazione di compatibilità universale deriva dai test locali.
