# Cura del prodotto e piano di lavoro

[Indice](../README.md) · [Classi](CLASSI.md) · [Spazio studio AI](SPAZIO-STUDIO-AI.md) · [Revisione storica](REVIEW.md)

## Promessa e confini

iPagell aiuta uno studente a sapere cosa scade, come sta andando e quali dati ha registrato. Non sostituisce il registro scolastico, non certifica assenze o promozioni e non è affiliato ufficialmente alla SIG/SSSE.

Stato: **versione iniziale pubblicata**, non “prodotto completo”. L’account è interno; l’accesso al sito è pubblico, i diari sono personali. La priorità è non perdere dati e non confondere le persone, prima di aggiungere funzioni.

## Cinque persone, cinque criteri

| Persona | Bisogno | Criterio verificabile |
|---|---|---|
| Nuovo studente di un’altra scuola | Partire senza dati di Ahmed o vincoli SIG | Registrazione vuota, modello facoltativo, materia e semestre rinominabili |
| Studente di fretta su iPhone | Inserire un voto senza cercare comandi nascosti | Accesso a impostazioni/periodo; inserimento e conferma leggibili a 390 px |
| Persona sensibile al movimento o con testo ingrandito | Leggere senza effetti invasivi | Nessuna sfocatura permanente; movimento ridotto; prova tastiera e testo 200% |
| Studente analitico con anni di storico | Fidarsi di formule e confronti | Pesi espliciti, nessuna previsione inventata; storico e limiti spiegati |
| Persona su dispositivo condiviso o due dispositivi | Sapere dove sono i dati | Account isolati; stato sync visibile; conflitto non risolto con sovrascrittura silenziosa |

## Regole di design e contenuto

- Superfici leggibili e opache; non reintrodurre blur o trasformazioni persistenti per imitare iOS.
- Colore coerente per materia, mai unico indicatore di errore o sufficienza. Aggiungere testo significativo.
- Campi mobili leggibili, bersagli da almeno 44 px come obiettivo di progetto; focus visibile e label associate.
- “Salvato sul dispositivo” e “Salvato nell’account” sono stati diversi. Non usare un successo generico per coprire un errore remoto.
- Importazioni e cancellazioni devono dire cosa verrà sostituito o rimosso e quale copia si può conservare.
- Stati vuoti senza finti risultati; metriche calcolate, non abbellimenti numerici. Terminologia coerente: materia, tipologia, peso, coefficiente, semestre.
- Le formule configurabili non vanno presentate come regolamenti ufficiali della scuola.

## Roadmap ordinata, senza date promesse

Le righe seguenti sono **aperte**, non funzionalità già consegnate. P0 indica un requisito prima di allargare significativamente l’uso, non una vulnerabilità confermata.

| ID / priorità | Intervento | Condizione di completamento |
|---|---|---|
| Q01 / P0 | Prova iPhone reale e offline | Installazione, riapertura senza rete, modifica, riconnessione e aggiornamento worker documentati su dispositivo/versione |
| Q02 / P0 | Recupero operativo e responsabilità | Responsabile nominato, backup database e restore isolato riuscito, canale privato di sicurezza e informativa dati approvata |
| Q03 / P0 | Concorrenza e failure injection | Due schede e due dispositivi; timeout dopo commit, quota IndexedDB, logout con draft e reset testati senza perdita silenziosa |
| Q04 / P0 | Chiarezza del recupero account | Gestire risposta di registrazione/recupero persa e codice non conservato; nessun retry cieco che ruoti codici senza controllo |
| Q05 / P1 | Liste grandi e prestazioni | Paginazione/filtri, caricamento grafici differito e benchmark con dataset sintetico; allineare limite locale e busta API |
| Q06 / P1 | Manutenibilità e test | Separare viste dal componente principale; runner locale migrazioni tracciato e ripetibile; controlli automatizzati in CI |
| Q07 / P1 | Accuratezza scolastica avanzata | Definire medie per componenti e congelamento storico, con esempi approvati e test prima dell’implementazione |
| Q08 / P2 | Estensioni d’uso | Valutare vista settimana e promemoria push reali solo con infrastruttura, consenso e costi chiariti |
| C01 / P1 | Classi autogestite | Ruoli proprietario/moderatore/membro, inviti revocabili e isolamento dei dati coperti da test |
| C02 / P1 | Agenda condivisa | Eventi collaborativi e sottoscrizioni personali aggiornabili senza condividere il diario |
| C03 / P2 | Annunci e materiali | Introdurre prima link/testo; file soltanto con storage privato, scansione e policy dati |
| A01 / ricerca | Spazio studio AI | Prototipo offline su corpus autorizzato con citazioni, albero incrementale ed evaluation documentata |
| A02 / futuro | AI personale in produzione | Solo dopo privacy, cancellazione, quote, storage, code e soglie di qualità approvate |

Prima di ogni intervento assegnare una persona responsabile e un criterio d’accettazione. Non sono ancora assegnati proprietari individuali né scadenze. Non introdurre analytics sui dati scolastici solo per misurare l’adozione: prima definire finalità e minimizzazione.

Le specifiche [Classi](CLASSI.md) e [Spazio studio AI](SPAZIO-STUDIO-AI.md) descrivono l'ordine di realizzazione. La collaborazione viene prima dell'AI in produzione; la prova tecnica AI può procedere isolata soltanto con documenti sintetici o autorizzati.

## Checklist di rilascio

- [ ] Registrazione, login, recupero, logout e separazione di due account verificati.
- [ ] Nessuna password, sessione o codice nei log, cache o backup.
- [ ] Pesi, voti limite 1/4/6, mezzi voti e assenza di dati testati.
- [ ] Offline, errore server, conflitto e importazione fallita lasciano una strada per conservare i dati.
- [ ] Mobile, desktop, tema chiaro/scuro, focus, tastiera, movimento ridotto e testo ingrandito controllati.
- [ ] Build, tipi, test, lint e audit eseguiti; risultati e rischi residui registrati.
- [ ] Migrazioni e recupero/rollback valutati prima del deploy.
- [ ] Guida, API e changelog riflettono il comportamento effettivo.
- [ ] Esito pubblicazione verificato; installazione fisica non dichiarata se non provata.

Questa checklist è un modello da compilare per ciascun rilascio, non una dichiarazione che tutte le voci siano già superate.

## Evidenza disponibile

Nella revisione del 16 settembre 2026 sono stati riportati 6 test unitari e 29 controlli API superati, build e TypeScript riusciti, audit delle dipendenze di produzione senza vulnerabilità segnalate. Prova browser locale compilata: desktop e viewport 390×844, accesso, voto `4-5`, media `4.5`, ricaricamento. Non equivale a prova su iPhone fisico, test di carico, suite completa di accessibilità o penetration test indipendente.
