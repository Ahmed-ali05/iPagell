# Spazio Studio — mappa manuale locale L2

[Indice](README.md) · [L1](SPAZIO-STUDIO-AI-L1.md) · [Prompt](SPAZIO-STUDIO-AI-PROMPTS.md) · [Laboratorio](../experiments/study-local/README.md)

**7 ottobre 2026. Implementazione nel laboratorio separato, nessuna pubblicazione.**
La mappa funziona senza scaricare un modello. L2 non integra gli account, il diario,
Appunti, il backup V3 o i database dell’app. I residui del benchmark L1 restano validi.

## Percorso manuale

Aprire `npm run study:dev`, quindi `http://127.0.0.1:5174/`. Aprire il profilo sintetico A
oppure B. Ogni profilo contiene **una sola materia**; titolo e lingua del materiale sono
modificabili. I profili non sono account autenticati e non proteggono da altre persone
che accedono allo stesso browser/origine. Sono un adattatore di prova del namespace account.

Creare o rinominare concetti, scrivere sintesi e note, scegliere lo stato personale,
aggiungere gerarchie e relazioni trasversali. Ogni comando Salva effettua un commit;
modificare un campo non equivale a salvarlo. I comandi di uscita/cambio profilo e il
browser segnalano i moduli o le bozze non salvati. Il pulsante di annullamento ripristina
l’ultima modifica della mappa, comprese note e stato. Non modifica voti o apprendimento
automaticamente. Le relazioni manuali non sono inferenze del modello.

L’import testo/TXT/PDF di L1 rimane un’area temporanea. **Copia le fonti temporanee nella
mappa** conserva originali ed estratti nell’archivio scelto. La rimozione nell’area temporanea
non cancella la copia salvata: per questa usare **Elimina fonte** dentro la mappa.
Un concetto può citare più passaggi; ciascuno apre testo, pagina, hash e intervallo esatto.
Il testo è reso con `textContent`, anche se contiene markup. La fonte è rintracciabile,
non automaticamente corretta o una prova della sintesi.

## Contratto e limiti

Implementazione in [graph.ts](../experiments/study-local/src/graph.ts).
Schema chiuso **`study-graph-v1`**: spazio/materia/lingua, documenti estratti immutabili,
grafo corrente e fino a 20 snapshot precedenti della mappa. Originali Blob separati dai
metadati; stato personale in `graph.personal`, distinto da concetti e relazioni.

- UUID assegnati dall’app per spazio, materia, concetti, relazioni e versioni. Identità
  documento/chunk content-addressed ereditata da L1: hash originale, estrattore e chunker.
- Origine ammessa in L2: `manual`. Nessuna proposta generata, nessun ID assegnato da un
  modello. L3 dovrà validare proposte con ID temporanei e rimapparle prima del commit.
- Evidence: `documentId`, `chunkId`, pagina a base 1, `start`, `end`, `unit: utf16`.
  Gli intervalli `[start,end)` sono nel testo estratto della pagina e coincidono con
  il chunk canonico. Nessuna coordinata PDF o indice di byte.
- Gerarchia: al massimo un genitore, nessun ciclo. Archi trasversali: `related`,
  `prerequisite`, `contrast`; non sono soggetti al vincolo di albero. Endpoint mancanti,
  autoarchi e duplicati dello stesso tipo/direzione vengono rifiutati.
- 200 concetti, 400 archi, 12 evidence per concetto/arco; titoli 120 unità UTF-16,
  sintesi/note 3.000. 8 MiB di metadati complessivi inclusa la cronologia.
- Limiti fonti L1: 24 documenti, 200.000 code point estratti, 50 MiB di originali;
  10 MiB/50 pagine/100.000 code point per fonte. L2 limita inoltre a 4.000 chunk
  per documento. Nessun troncamento silenzioso al superamento dei limiti.

La cronologia contiene lo stato precedente a ciascuna modifica del grafo, un ID, data e
operazione, non copie degli originali. Gli ID di concetto restano stabili durante la
rinomina. Undo rimuove l’ultimo snapshot e salva il suo grafo come nuova revisione; non
regredisce il token di concorrenza. Aggiunta fonti e modifica materia sono salvataggi
espliciti ma non operazioni del comando Undo della mappa. Non c’è redo.

## Archivio, concorrenza e uscita

[study-store.ts](../experiments/study-local/src/study-store.ts) usa IndexedDB
`ipagell-study-lab-archive-v1`, store `accounts`, chiave `accountId`. Un record contiene
revisione opaca UUID, token di cancellazione, archivio e originali. Nessuna outbox,
richiesta API, accesso al DB dell’app, vettore o peso del modello in questo archivio.

Validazione e hash precedono la transazione. Il confronto della revisione attesa e
l’intero snapshot risultante dalla modifica vengono applicati nella stessa transazione
`readwrite`; il successo è comunicato solo dopo `oncomplete`. Nessun merge automatico.
Una fonte già salvata nello stesso spazio non può essere cambiata sotto lo stesso ID.
La copia da salvare è clonata prima delle attese, così una modifica concorrente dell’input
non altera il commit in corso.

Quota/storage negati conservano la bozza nella scheda e offrono retry/export. Un conflitto
non sovrascrive il record: la bozza resta esportabile, poi si riapre la versione salvata.
`BroadcastChannel` comunica solo il profilo modificato; controllo aggiuntivo al ritorno
visibile/focus e prima dell’export. Il CAS protegge anche senza notifiche.

Il cambio/uscita invalida letture e salvataggi pendenti con un segnale e una generazione;
svuota DOM, originali temporanei, query, report e motore del laboratorio. Il comando
**Esci e conserva nel browser** conserva esplicitamente l’archivio per lo stesso profilo.
All’apertura non viene scelto automaticamente un archivio salvato.

## Cancellazione

Eliminare una fonte rimuove il Blob, l’estratto, i chunk e tutti i collegamenti a quella
fonte; conserva fonti alternative e concetti manuali, rendendo visibili quelli senza
fonti. I concetti coinvolti ricevono `reviewReason: source-removed`, segnalazione della
sintesi da rivedere distinta dallo stato di apprendimento; un salvataggio manuale del
concetto la rimuove. Svuota **tutta la cronologia** per impedire il recupero di passaggi o testi di
versioni precedenti. Le sintesi e note manuali correnti restano: non si può distinguere
in modo affidabile il testo dell’utente da una sua trascrizione della fonte. Questo è
spiegato prima della conferma; per cancellare ogni contenuto usare Elimina archivio.

La cancellazione dell’archivio lascia soltanto un tombstone con chiave profilo e token,
senza contenuti. Impedisce a schede obsolete di ricrearlo con una vecchia revisione.
Il token di cancellazione invalida anche le copie in memoria delle altre schede quando
ricevono la notifica o tornano attive; non può eseguire codice in una scheda sospesa.
Un export verifica il token prima di preparare il backup. Le copie già scaricate e gli
altri browser/dispositivi non possono essere cancellati da questa origine.

## Export e ripristino

**`study-backup-v1`**, distinto dal backup diario V3. Envelope JSON con payload serializzato
e SHA-256; contiene mappa, note/stati, cronologia, estratti e originali in Base64. Non
contiene profilo/account, revisioni storage, token di cancellazione, modelli o vettori.
Massimo 96 MiB. Il checksum rileva corruzioni accidentali, non autentica il mittente.

Prepara export rende disponibile un link di download con gesto esplicito e il JSON
completo copiabile se il browser non scarica. La preparazione non viene dichiarata come
file già salvato. Export include la bozza applicata dopo un errore storage, ma esclude i
campi del modulo non ancora applicati con Salva; l’interfaccia lo segnala.

Ripristino da file **oppure** testo JSON: verifica envelope/checksum, schema chiuso,
limiti, fonti, gerarchie, riferimenti, originali e loro hash prima della conferma. Il
nome materia viene scelto localmente; nuovi ID per spazio, materia, nodi, archi, versioni
e stato personale referenziato. Gli ID content-addressed dei documenti/chunk restano
stabili. Il profilo nel quale ripristinare viene dalla sessione corrente, mai dal file.
La sostituzione atomica conserva la cronologia importata, senza unirla a quella vecchia.

Per TXT si verifica anche l’uguaglianza con la decodifica dell’originale. Per PDF il restore
verifica hash/magic e coerenza interna pagina/chunk, **non ripete l’estrazione PDF** e non
certifica che un esportatore ostile abbia riportato il testo corretto. L’originale resta
scaricabile per confronto. Nessun HTML/SVG/codice del backup viene eseguito.

## Verifiche e limiti

33 test del laboratorio, di cui 18 dedicati a L2: schema/input/limiti, UTF-16, gerarchie,
stato personale, undo, cancellazione/fonti alternative, backup/ID/hash, doppio commit
sulla stessa revisione, isolamento, tombstone, rollback di transazione dopo un put,
abort/cambio profilo, storage negato, retry di cancellazione e conflitto esportabile.
Le prove storage automatiche usano `fake-indexeddb`, non attestano quota reale o
resistenza a chiusura forzata del browser. Esiti app/build nella [matrice](VERIFICATION-MATRIX.md).

Browser integrato Chromium, sole fixture sintetiche: creazione/salvataggio, riapertura,
fonte con emoji e markup letterale, collegamento e consultazione, profilo B inizialmente
vuoto, backup JSON e ripristino in B con cronologia, rinomina/undo e reload; seconda scheda con notifica di conflitto senza sovrascrittura. Il download
non ha prodotto un evento osservabile dallo strumento, anche con link esplicito; il
percorso JSON alternativo è stato verificato end-to-end. Non attestare il salvataggio
su disco da questa prova.

Restano da qualificare: dispositivi fisici, Safari/Firefox, mobile, riapertura offline
completa, quota reale/eviction, dataset massimo, accessibilità e interfaccia nelle quattro
lingue, UX con studenti e isolamento collegato all’autenticazione reale. I profili locali
non costituiscono una barriera di sicurezza. Non usare lavoro insostituibile come unica
copia. L3 generazione e L4 integrazione restano separati e non avviati.
