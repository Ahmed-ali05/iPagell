# Rifinitura delle interazioni — 15 ottobre 2026

[Architettura](ARCHITECTURE-CURRENT.md) · [Verifiche](VERIFICATION-MATRIX.md) · [Pubblicazione](DEPLOYMENT.md)

## Analisi e scelta

Applicazione dei principi della skill apple-design al prodotto esistente. Letti AGENTS, snapshot, architettura, matrice, regole di prodotto, CSS e componenti coinvolti. Osservati Home, Impostazioni, inserimento voto e menu materia su account sintetici locali. Il sorgente di partenza del rilascio è Sites 37, `bf295652402cc3018fba46a5b8ec91ed55cfcdb5`, aperto con il workflow Sites in una copia separata dal checkout di lavoro.

Problemi osservati: titolo mobile troncato, chiusura dei dialoghi con bersaglio piccolo, feedback di pressione globale, selezione mobile comunicata soprattutto dall'icona. La prova menu materia → Modifica → Annulla ha inoltre rilevato perdita del focus quando il trigger nelle Impostazioni viene smontato. Con testo al 200% le schede delle Impostazioni si accavallavano.

La direzione conserva palette, font di sistema e superfici opache previste da `PRODOTTO.md`. Non richiede nuovi gesti o dipendenze: l'intervento riguarda controlli e navigazione già presenti.

## Implementazione

| Area | Comportamento |
| --- | --- |
| Pulsanti | Feedback di pressione immediato sui comandi pertinenti, rilascio breve; esclusi switch e controlli disabilitati dalla scala. Hover per puntatori che lo supportano. |
| Dialoghi e menu | Entrata/uscita coerenti con opacità e scala individuale, senza sovrascrivere la traslazione di centraggio. Menu ancorati all'origine Radix. Tutti rispettano la preferenza di movimento ridotto. |
| Finestre | Chiusura 44×44 px, spazio riservato nel titolo, altezza limitata alla viewport e scorrimento interno. |
| Focus | Il trigger originale ha precedenza; se rimosso, nascosto o disabilitato, gli editor e le Impostazioni possono ritornare al comando Impostazioni del workspace tramite riferimento esplicito. |
| Mobile | Titoli su più righe, sfondo della voce selezionata e `aria-current="page"`; spazio inferiore proporzionato alla dimensione del testo. |
| Testo ingrandito | Schede delle Impostazioni con altezza automatica e colonne adattive. |
| Contrasto | Bordi più definiti per superfici sovrapposte e selezione mobile quando il browser segnala contrasto maggiore. |

File applicativi: `app/globals-new.css`, `components/ui/dialog.tsx`, `components/entry-dialog.tsx`, `components/ipagell-app.tsx`. Formule, payload e meccanismi di salvataggio mantengono il contratto esistente; nessuna migrazione.

## Verifiche

`npm run release:prepare` nella copia Sites: lint, TypeScript, **128 test**, 768 chiavi i18n, inventario e link documentali, build e precache (31 asset) superati. Restano gli avvisi preesistenti sui chunk oltre 500 kB e sulla classificazione statica delle route Vinext.

Prove browser sul workspace reale, con database locale nuovo e dati sintetici:

- Home e finestre a 390 px; Impostazioni nelle quattro lingue, con campioni a 320/390/1440 px e temi chiaro/scuro. Nei casi misurati non c'è overflow orizzontale e il dialogo resta nella viewport.
- Menu materia tramite tastiera, apertura dell'editor e annullamento; ritorno a Impostazioni. Inserimento voto chiuso con Escape e ritorno a Registra voto. Nessun salvataggio di voti necessario a queste prove.
- Preferenza account Riduci movimento: `animation: none`, transizioni a zero, switch con thumb di 22 px all'inset atteso di 27 px, senza scala o doppia trasformazione.
- Testo al 200% tramite proxy locale temporaneo che aggiunge soltanto `html { font-size: 200% }` all'HTML della build. È una prova di ingrandimento del testo, non di zoom nativo del browser. Proxy, credenziali sintetiche e database locali sono esterni al sorgente e al pacchetto pubblicato.

Le correzioni scoperte durante le prove sono state ricontrollate nella build finale: focus del menu/editor su mobile e desktop e schede senza sovrapposizioni con testo al 200%. Nessuna suite API esterna ripetuta: endpoint e contratti non sono modificati. La preferenza OS e il contrasto maggiore sono coperti dalle media query nel CSS; non è stata cambiata l'impostazione del sistema operativo. Telefoni fisici, Safari, lettori di schermo, misure di frame rate e audit completo di accessibilità restano fuori da questa verifica.

## Rilascio

Il rilascio viene confezionato con il workflow Sites dall'esatto sorgente verificato, mantenendo progetto, binding `DB`, audience pubblica e domini esistenti. Il registro di pubblicazione contiene il successivo esito restituito dalla piattaforma.

Pubblicazione conclusa: Sites **38**, sorgente `2a946daea00a3b069a25809c52af3abc0875a061`, deployment `appgdep_6ad07e3bcdbc8191a3edac8c9e3fceb2` **succeeded**, https://ipagell.website confermato attivo e pubblico; dominio principale/www con TLS attivo. Controllo HTTP successivo: `/app` 200 e nuovo CSS presente.
