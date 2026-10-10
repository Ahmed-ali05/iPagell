# Semplificazione dell’interfaccia — 10 ottobre 2026

[Indice](README.md) · [Reference UX](UX-REFERENCE.md) · [Guida](GUIDA-UTENTE.md)

## Mandato e metodo

L’utente ha chiesto di nascondere i comandi cerchiati nella lettura personale e di analizzare e semplificare anche le altre viste. Ha autorizzato a superare indicazioni di prodotto obsolete. L’analisi è stata comunicata prima delle modifiche, dopo aver letto il codice e osservato Appunti, Agenda, Voti, Assenze, Classi, Home e Impostazioni nella sessione esistente. Le catture iniziali includono dati privati e restano fuori dalla repository; quelle del risultato usano esclusivamente dati sintetici e risposte API locali simulate.

Il principio adottato è mostrare contenuto e azione frequente, aprendo le operazioni occasionali quando servono. È coerente con le [toolbar Apple](https://developer.apple.com/design/human-interface-guidelines/toolbars) e i [pattern di navigazione Android](https://developer.android.com/design/ui/mobile/guides/layout-and-content/layout-and-nav-patterns). Queste linee guida motivano la scelta; non dimostrano che iPagell sia diventato più facile per ogni persona. Non è stato condotto uno studio con utenti.

## Riscontri prima dell’intervento

| Priorità | Evidenza osservata | Conseguenza probabile | Decisione applicata |
|---|---|---|---|
| P1 | Appunti: descrizione duplicata, ritorno all’elenco, modifica, export e altri formati, conferma sync, copia e rimozione esposti insieme al testo (cattura 01). | La lettura compete con la gestione della nota; corrisponde alla confusione segnalata dall’utente. | Titolo, metadati, testo, stella e ritorno all’elenco sempre visibile; menu dei tre punti per modifica, export, copia e rimozione. Export in finestra dedicata. |
| P1 | Voti: dodici schede materia precedono il registro; il simulatore è sempre aperto (03). | Più spazio di consultazione viene occupato prima di raggiungere i risultati. | Selettore materia con media, confronto completo espandibile, registro largo e simulatore su richiesta. |
| P2 | Agenda: più barre distinte per comandi, origine e calendario/elenco; ogni riga mostra appunti e rimozione (02). | Troppe aree di controllo da cercare prima di consultare le scadenze. | Barra unica che si dispone su più righe su telefono; Avvisi e Nuova attività visibili; Appunti nella riga e rimozione diretta. |
| P2 | Classi: nuova classe, codice, invito e nuova attività competono nello stesso percorso (05). | Azioni occasionali hanno lo stesso peso dell’attività corrente. | Codice e nuova classe visibili con minore enfasi; invito nella gestione, nuova attività visibile e modifica/rimozione nei menu delle righe. Stato senza classi conserva creazione e ingresso visibili. |
| P2 | Preferenze e salvataggio: lingua, tema, impostazioni e periodo ripetuti nella cornice del workspace (01–07). | Maggiore densità stabile in tutte le viste. | Lingua e tema in Impostazioni; un solo periodo nelle viste pertinenti; conferma normale compatta in alto. |
| P2 | Assenze: campo della soglia personale sempre esposto accanto al riepilogo (04). | Consultazione e configurazione hanno peso simile. | Riepilogo e limite personale visibili; campo in Modifica riferimento. |
| P2 | Impostazioni: ogni materia espone due icone di gestione (07). | Molti comandi ripetuti nell’elenco. | Un menu contestuale per materia. |

P1 indica un ostacolo importante alla consultazione, P2 un miglioramento di gerarchia. Non sono stati osservati nuovi problemi P0 di perdita dati nel percorso esaminato. La conseguenza sul comportamento umano è un’ipotesi, non una misura di frequenza o successo.


## Revisione dopo il confronto

L’utente ha segnalato due difetti nella prima proposta: ritorno all’elenco nascosto nel menu e pulsante generico Azioni nelle viste. La revisione separa navigazione e operazioni: il ritorno è visibile, Statistiche e Appunti sono collegamenti espliciti, Avvisi ha un comando diretto e Classi mostra creazione/ingresso. I menu con un solo comando di eliminazione sono stati rimossi perché aggiungevano un passaggio senza ridurre i controlli. I tre punti restano soltanto nelle note, nelle attività condivise e nella gestione delle materie.

Rimosse descrizioni di beneficio e istruzioni ridondanti nelle liste Appunti e nel relativo riquadro Home. Gli stati vuoti usano testi fattuali (Diario vuoto, Nessuna classe) e indicazioni operative brevi. Informazioni su visibilità, stato e conseguenze restano dove servono.

## Contratto di comportamento

- Le funzioni restano raggiungibili; nascondere dalla lettura non equivale a rimuovere dal prodotto.
- Gli avvisi offline, errori, sessione scaduta e conflitti restano nel contesto. Salvato descrive il diario personale: non certifica da solo il salvataggio di ogni nota.
- Le rimozioni conservano le conferme esistenti. Permessi della classe, revisioni, autosave, formule delle medie, scala e backup non cambiano.
- Il selettore materia e il filtro Periodo/Anno/Storico conservano il contesto previsto; la registrazione sceglie un periodo reale.
- Menu Radix, finestre esistenti e disclosure HTML usano controlli semantici; le icone hanno etichette contestuali e target di almeno 44 px. Il menu restituisce il focus prima di aprire una finestra, così la chiusura può tornare allo stesso controllo.
- La navigazione resta a cinque destinazioni; Statistiche è raggiungibile dal collegamento visibile in Voti. Appunti è visibile accanto al selettore materia. In Home la seconda azione ha minore enfasi.

Le descrizioni storiche che imponevano comandi sempre esposti sono superate da questo intervento. Non sono stati considerati automaticamente completati tutti i task del piano UX: editor degli elementi personali, riordini più ampi, account standard e recupero dei conflitti richiedono lavoro separato.

## Appunti della stessa materia

Sotto il testo, una sezione separata mostra gli altri appunti caricati dello stesso spazio e con lo stesso ID materia, escludendo quello aperto e le note eliminate. Le note senza materia non vengono raggruppate per nome. I riquadri quadrati mostrano solo titolo e data, senza anteprime o colori di richiamo. Se non ci sono altre note, la sezione non compare. Un clic sostituisce il lettore, porta il focus al nuovo titolo e, se necessario, risale al lettore. Dissolvenza di 160 ms, senza spostamenti del testo; la preferenza di sistema e Riduci movimento disattivano animazione e scorrimento fluido. La sezione non viene stampata.

La scelta privilegia la concentrazione richiesta dall’utente: superficie principale per la lettura, separatore e riquadri neutri sotto il contenuto. La [guida Apple sul movimento](https://developer.apple.com/design/human-interface-guidelines/motion) sostiene transizioni contenute e rispettose della sensibilità al movimento; non è una prova di usabilità di questo prodotto.

Verifica incrementale con note sintetiche: esclusione di nota aperta, materia diversa e tombstone; cambio personale e di classe, Enter e focus al titolo; sezione assente per materia con una sola nota; desktop 1440 px e mobile 390 px senza overflow, riquadri 144 × 144 px. Riduci movimento verificato con animazione calcolata `none`. Tipi e lint sui componenti modificati, cataloghi con 759 chiavi; suite generale di 114 test già superata prima di questa aggiunta e non ripetuta. La prova non comprende telefoni fisici o lettori di schermo.

## Verifiche locali e limiti

Le catture 18–24 mostrano la revisione finale; 08–17 documentano la prima proposta poi corretta. Tutte le catture successive a 07 sono con dati dimostrativi. Verificati calendario/elenco e ritorno agli appunti per materia; selezione materia e precompilazione del nuovo voto; apertura del simulatore e risultato; apertura del riferimento assenze; menu attività della classe, appunti condivisi e apertura della finestra invito senza pubblicarlo; navigazione da tastiera del menu, Escape e ritorno del focus dopo la finestra di export.

Controllati layout desktop, viewport 390 px per Appunti/Agenda/Voti e 320 px per Voti/Assenze in tedesco con tema scuro: nessun overflow orizzontale nei casi controllati e menu contenuto nello schermo. Italiano e tedesco sono stati osservati nel browser; la parità di tutte e quattro le lingue è controllata dalla suite i18n. Non sono prove su telefoni fisici, lettori di schermo, tastiera virtuale o tutte le combinazioni lingua/device. Durante l’aggiornamento a caldo dei cataloghi è comparso un errori I18nProvider/InstallAppProvider nel server di sviluppo; una ricarica completa ha ripristinato la demo e le verifiche successive. Non è una prova sul runtime di produzione. La route dimostrativa temporanea è stata rimossa dal codice consegnato.

I risultati delle verifiche automatiche finali sono registrati nella [matrice](VERIFICATION-MATRIX.md). Nessuna pubblicazione, migrazione o modifica di dati reali in questo intervento.

## Pubblicazione

Sites 33 pubblicato il 10 ottobre 2026, sorgente `0288de5aa0419f8d7a1d59a69f5cb728c95dda55`, deployment succeeded. URL canonico https://ipagell.website, accesso pubblico e domini/TLS attivi. Dettagli in [Pubblicazione](DEPLOYMENT.md).

## Correzione Riduci movimento — 10 ottobre

In Sites 34 il controllo Radix esisteva e aveva lo stato accessibile corretto, ma pista e cursore erano trasparenti: le classi `bg-input`/`bg-background` del componente richiedevano alias Tailwind assenti dal tema corrente. Osservati 32×18,4 px e `rgba(0,0,0,0)` su entrambe le parti.

Lo stile condiviso in `app/globals-new.css` ora usa direttamente i token dell’app per pista e cursore, con stati acceso/spento, focus visibile e area cliccabile 52×44 px. L’etichetta è associata al controllo; la riga mantiene testo e toggle affiancati anche sotto il breakpoint mobile. Radix, callback e persistenza della preferenza restano quelli esistenti.

Verifica mirata sulla finestra Impostazioni reale con dati sintetici in una route locale temporanea: stati acceso/spento in chiaro/scuro, clic sul controllo e sull’etichetta, Space, focus da tastiera, `data-reduce-motion=true` con transizione 0s e viewport desktop/390 px senza overflow. La route e l’export temporaneo per la prova vengono rimossi prima della build. Le preferenze dell’account reale non sono state cambiate.

Correzione pubblicata come Sites **35**, sorgente `140c56f6d2dcfbed9d8413c6e5bcd81f7379f6af`, deployment `appgdep_6aca7e78142c81918098b14a342fd8ba` succeeded. [Registro di pubblicazione](DEPLOYMENT.md).
