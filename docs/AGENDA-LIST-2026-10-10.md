# Agenda — elenco delle attività, 10 ottobre 2026

[Indice](README.md) · [Guida utente](GUIDA-UTENTE.md) · [Verifiche](VERIFICATION-MATRIX.md) · [Pubblicazione](DEPLOYMENT.md)

## Analisi prima della modifica

Obiettivo: raggiungere il lavoro da fare senza attraversare le attività già svolte. Audit circoscritto all’Agenda personale, desktop e mobile; schermate catturate, salvate e ispezionate prima del codice. L’account già disponibile è stato consultato senza modificare attività o preferenze. Il browser integrato richiedeva accesso; la verifica ha usato la sessione Chrome esistente.

1. **Elenco desktop.** Sette completate precedevano l’unica attività aperta. Il codice ordinava tutte le attività per scadenza crescente, senza separarne lo stato. Calendario/elenco e filtro origine erano riconoscibili; il totale mescolava lavoro rimanente e storico.
2. **Elenco mobile, 390×844.** Prima attività aperta a 2.110,8 px; le sette completate occupavano righe da 193 a 281 px. Il riquadro data e i comandi laterali restringevano il testo; descrizioni integrali aumentavano l’altezza. Nessun overflow orizzontale nel caso osservato. Il testo delle completate attenuato poneva un rischio di leggibilità; non è una misura completa di contrasto.
3. **Decisione.** Separare lavoro aperto e storico, ridurre i contenuti iniziali di ciascuna riga e conservare gli ingressi agli appunti, il contesto del periodo e i contratti di completamento.

[Microsoft To Do](https://support.microsoft.com/en-us/accessibility/todo/use-a-screen-reader-to-work-with-lists-in-to-do) e [Apple Reminders](https://support.apple.com/en-lamr/guide/iphone/iph3fb74d597/ios) consentono di mostrare/nascondere le completate. Questo orienta la scelta convenzionale, non dimostra l’usabilità di iPagell. Qui le sezioni di storico sono esplicite, con conteggio, senza un filtro obbligatorio o una voce nascosta nel menu.

## Comportamento implementato

- **Da fare** in testa: Scadute, Oggi, Prossime attività. Scadute significa giorno locale precedente; gli orari trascorsi del giorno corrente restano in Oggi. Una scadenza passata non completa mai un’attività.
- **Completate** e **Annullate** hanno sezioni distinte, chiuse inizialmente, con conteggio e `aria-expanded`. I record chiusi non vengono montati finché la sezione non è aperta. L’annullamento prevale sul completamento; un’attività annullata non si può spuntare. Le copie scollegate ma attive restano da fare.
- Le aperte sono ordinate per istante crescente; lo storico per scadenza decrescente. Il modello non memorizza la data di completamento: nessuna etichetta promette un ordine per completamento. Parità risolte con ID; input mai mutato.
- Titolo completo, materia, tipo, data con anno/orario e origine restano visibili. Descrizioni complete nei **Dettagli**, Appunti diretto, promemoria con icona etichettata; preferenze di classe e rimozione/eliminazione nel menu contestuale specifico. Le conferme e le scritture esistenti restano nel workspace.
- Dopo completamento/riapertura il focus passa a un controllo ancora presente. Il completamento di classe cambia gruppo dopo la conferma dati; attesa e blocco disabilitano le scritture, un errore non produce un falso completamento.
- Un ingresso con ID mostra anche lo storico pertinente. Se il filtro origine esclude l’attività, torna a Tutte; lo storico aperto automaticamente resta richiudibile. Il ritorno dagli appunti conserva calendario/elenco e filtro compatibile.
- Il calendario mantiene il riepilogo limitato a sei aperte, esclude le annullate e mostra **6 di N** con **Mostra tutte le attività** quando necessario. Il giorno selezionato mantiene tutte le proprie attività, con stati separati; il dettaglio è visibile anche su mobile. Il selettore del periodo continua a limitare i dati prima della vista.
- Il giorno locale viene ricontrollato ogni minuto, al ritorno della finestra e quando cambia visibilità. Nessuna nuova animazione, dipendenza, migrazione, proprietà persistente o API.

File: `components/agenda-list.tsx`, `lib/agenda-list.ts`, integrazione in `components/ipagell-app.tsx`, CSS e quattro cataloghi. `AgendaView` resta interno al workspace; export e route usati per la fixture sono rimossi dal rilascio.

## Verifiche e limiti

| Caso | Evidenza |
|---|---|
| Ordinamento e stato | Cinque test mirati: annullamento/completamento, copie scollegate, istanti con offset/parità, giorno locale/ora legale/mezzanotte, completamento/riapertura, input congelato e 1.500 completate con due attività ancora aperte |
| Build compilata | Componenti reali con fixture sintetica, senza scritture di rete: 30 completate, cinque aperte, due annullate, titolo lungo e descrizione da 1.790 caratteri |
| Interazione | Space per completare/riaprire, Enter per storico/Dettagli, Escape dal menu con focus ripristinato. Conferma tardiva di classe conserva il focus su altro controllo/vista; se ancora nel completamento, arriva allo storico. Spostamento/focus osservati, annullate disabilitate, classi in attesa e errore simulati senza falso successo |
| Contesto | Filtri Tutte/Dalle classi osservati; distinzione Personali/scollegate verificata nel codice corrente. Ritorno dagli appunti conserva Elenco e filtro. Ingresso su completata da Home ripristina Tutte, apre lo storico e consente di richiuderlo. Stati vuoto, filtro vuoto e solo storico osservati |
| Calendario | Sei aperte nel riepilogo, ingresso al totale di 17; giorno con due aperte e due annullate distinguibili, dettaglio mobile `display:block` |
| Layout | 1.440 px chiaro/scuro, 390 px e 320 px in it/de/fr/en dopo caricamento effettivo dei cataloghi; nessun overflow nei casi misurati. Controlli riga 44×44 px. Righe sintetiche mobile finali da 124 a 217 px, secondo contenuto |

Schermate iniziali e prove sintetiche restano nel fascicolo locale di audit, fuori dal sorgente pubblicato. Una schermata chiara catturata durante la transizione del tema è stata scartata e ripresa dopo stabilizzazione. Un disallineamento della griglia mobile è stato trovato e corretto nella build compilata prima del rilascio.

Le prove browser simulano esito/attesa/errore delle callback esistenti, non ripetono la suite API o certificano un nuovo protocollo di sincronizzazione. Restano da provare telefoni fisici/Safari, lettori di schermo, zoom completo e prestazioni con migliaia di attività tutte aperte. Il test con 1.500 record copre raggruppamento e conservazione dei dati, non un benchmark browser. Le evidenze non attestano conformità WCAG completa.

## Rilascio e riscontro in produzione

Sites **37**, sorgente `bf295652402cc3018fba46a5b8ec91ed55cfcdb5`, deployment `appgdep_6aca90049350819189acde5a20f974a2` succeeded il 10 ottobre alle 21:20 Europe/Zurich. [CI del sorgente](https://github.com/Ahmed-ali05/iPagell/actions/runs/38079164366): audit a zero, 128 test, 768 chiavi e build riusciti. Progetto, pubblico, dominio canonico e www/TLS conservati.

4. **Produzione mobile, 390×844.** Unica attività aperta subito visibile, prima riga a 406,2 px rispetto ai 2.110,8 px iniziali. Le sette completate sono in una sezione chiusa con conteggio. Titolo, data, materia e Appunti leggibili; nessun overflow nel caso misurato.
5. **Produzione desktop, 1.440×900.** Stesso ordine/stato, unica aperta prima dello storico chiuso. Verifica read-only della sessione disponibile; nessuna attività o preferenza modificata. Viewport temporaneo ripristinato.

Questo controllo dimostra l’elenco servito dalla pubblicazione, non sostituisce le prove sintetiche di tutti gli stati o quelle fisiche ancora aperte.
