# Audit UX e copy — 27 settembre 2026

Ambito: landing, ingresso, onboarding, Home, navigazione, Agenda, Voti, Assenze, Classi, Statistiche, Impostazioni, moduli e stati vuoti. Le proposte derivano dal codice corrente e dalla verifica locale; i documenti di repository sono stati usati come mappa. Classificazione: A essenziale, B utile ma secondario, C contestuale, D ridondante, E debole, F eccessivo o impreciso.

## P0 — Confusione e claim imprecisi

| Posizione | Prima e problema | Intervento |
|---|---|---|
| Landing, CTA finale | «Apri iPagell» portava all'accesso mentre il percorso del nuovo studente parte dalla registrazione. **D** | Riscritta e collegata a «Crea il tuo diario». |
| Preferenze, nota dati | «I dati sono sincronizzati nell'account» non descrive gli stati offline, errore e conflitto. **F** | Riscritta: indica la copia sul dispositivo e il contenuto del backup; lo stato di salvataggio resta nella sua sede dedicata. |
| Dialog attività di classe | «Le modifiche aggiornano le agende collegate, mai i dati personali» poteva far pensare che nessun campo della copia personale cambi. **F** | Precisato che titolo e data seguono gli aggiornamenti nelle agende collegate. |
| Backup precedente | «Recupera vecchio diario» in realtà scaricava un file. **F** | Riscritto «Esporta vecchio diario», spostato sotto «Versione precedente». |

## P1 — Rumore e ripetizione

| Posizione | Prima e problema | Intervento |
|---|---|---|
| Landing | Eyebrow, rassicurazioni, quattro funzioni, tre passi, introduzione FAQ e titolo finale ripetevano hero o CTA. **D/E** | Eliminati i blocchi ridondanti; hero concreto, tre funzioni, preview dichiarata come esempio, privacy e FAQ mantenute. Offline resta nella FAQ, consultabile quando serve. |
| Registrazione | Badge su account/dispositivi e istruzioni ovvie precedevano i campi. **D/E** | Eliminati; password minima, assenza di email e codice di recupero restano visibili. |
| Onboarding | Scuola facoltativa tra i campi indispensabili. **B** | Spostata in un controllo espandibile, disponibile con tastiera e tocco. Nome, semestre e date restano visibili per evitare un periodo errato. |
| Home | Testi sotto stati senza dati, conteggi già leggibili e pannello «In arrivo» anche con una sola scadenza. **D** | Rimossi; prima scadenza, arretrati e azioni restano distinti. |
| Agenda | Sottotitolo permanente e «Agenda vuota» anche per un giorno o filtro vuoto. **D/C** | Sottotitolo eliminato; stato vuoto contestuale per giorno, filtro e attività aperte. Senza materie, la CTA apre l'editor materia esistente. |
| Voti e materia | «Registra voto» senza materie apriva un modulo non compilabile; spiegazione dei pesi sempre visibile. **C/B** | CTA iniziale «Aggiungi materia»; nuova materia mostra prima il nome, opzioni in un pannello espandibile e formula in un secondo dettaglio. Con voti già presenti, l'avviso sul ricalcolo storico resta visibile. |
| Assenze | Tre zeri, soglia «0 di 24», spiegazione dello zero e pannello per materia vuoto. **D** | Riepiloghi, soglia e ripartizione compaiono dopo il primo dato. L'avviso «non è il limite ufficiale» rimane con la soglia. |
| Classi, Impostazioni, moduli | Introduzioni ripetute, «Nessuna descrizione», titoli duplicati dalle tab, testo generico sul salvataggio. **D/E** | Eliminati; privacy e conseguenze restano nei dialog pertinenti. |

## P2 — Rifinitura

- Statistiche: «Più forte» e «Da rinforzare» giudicavano lo studente; ora «Media più alta/bassa» descrive il dato. **E → riscritto**.
- Liste di classe: data e autore erano due righe adiacenti senza separazione; ora sono un unico metadato leggibile. **D → abbreviato**.
- Preferenze: helper sotto nome, tema e riduzione movimento ripetevano il controllo. **D → eliminato**.

## Informazioni rimaste visibili

- **A:** scala voto 1–6, errori, stato di sincronizzazione e conseguenze di importazione, cancellazione e scollegamento.
- **A:** codice di recupero e limite del recupero senza email; privacy tra diario e classe.
- **C:** limite degli avvisi ad app aperta accanto al controllo; ricalcolo dei semestri passati quando si modificano pesi di una materia con voti.

Restano decisioni di prodotto separate: terminologia generale per trimestri/quadrimestri, date iniziali proposte nell'onboarding e ulteriori semplificazioni del modello di configurazione. Questo intervento non cambia modelli dati, regole di salvataggio o permessi.
