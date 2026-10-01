# Materia continua e vista annuale — audit sola lettura

Data: 1 ottobre 2026. Nessuna modifica al checkout, nessuna migrazione o richiesta Sites. Fonti: AGENTS.md e mappe repository già lette; types/domain.ts, lib/validation.ts, lib/calculations.ts, lib/grading.ts; components/ipagell-app.tsx, stats-view.tsx, entry-dialog.tsx; tests/domain.test.ts e grading.test.ts (lettura). Non sono stati eseguiti test o journey browser in questa analisi.

## Risposta alla richiesta

La materia è già continua nel modello dati: `Subject` non ha semestre/anno e mantiene un ID indipendente dai periodi. Un voto ha `subjectId` e `semesterId`. La sensazione di frazionamento nasce dalla vista: `DiaryWorkspace` calcola `semesterGrades` filtrando `currentSemester.id`, poi usa questa lista in Voti, Statistiche e riepilogo Home. La soluzione principale è permettere di leggere l'insieme dei voti di una materia per anno o storico, mantenendo il periodo come attributo organizzativo di ciascun voto.

Non è necessario fondere materie, eliminare semestri o riscrivere ID/dati esistenti per offrire la continuità annuale.

## Comportamento corrente confermato dal codice

| Area | Comportamento |
|---|---|
| Materia | ID, nome, colore, coefficiente e tipologie globali nel diario; non ricreata automaticamente a ogni semestre. |
| Voto | Collega materia, periodo e tipologia; data e peso individuale. |
| Periodo | ID, nome, schoolYear libero, date di inizio/fine e flag archived. |
| Selezione globale | `Preferences.currentSemesterId` è persistito e viene utilizzato per lettura e nuove scritture. |
| Voti | Card materia, media, registro e simulatore ricevono solo `semesterGrades`; nessun aggregato annuale/storico. |
| Statistiche | Media per materia e trend solo del periodo; confronto con altri periodi separati. Se periodo selezionato è senza voti, ritorna EmptyState prima del confronto storico. |
| Home | Media e conteggi limitati al periodo corrente. Agenda e assenze hanno lo stesso contesto, ma dati distinti. |
| Appunti personali | Sono già per materia e indipendenti dal semestre; la continuità richiesta è coerente con quel modello. |
| Inserimento | EntryDialog riceve `semesterId={currentSemester.id}` e lo scrive nel voto; tool document.modelContext usa currentSemesterId. Nessuna riassegnazione automatica per data. |
| Eliminazione periodo | `removeSemester` rimuove anche i suoi voti, agenda e assenze. Non usare eliminazione come soluzione UX al frazionamento. |
| Pesi | Media voto per materia usa voto.weight × tipologia.weight; media generale usa le medie delle materie ponderate per coefficiente. Tipologie e coefficienti sono correnti, senza snapshot storico. La UI di modifica già mostra avviso pesi storici. |

## Proposta di prodotto

In Voti e Statistiche presentare una materia unica con un filtro di lettura compatto:

- **Anno scolastico 2026/27**: somma i voti dei periodi associati a quel `schoolYear`.
- **Periodo**: un periodo preciso, per vedere il dettaglio semestrale/trimestrale.
- **Tutto lo storico**: tutti i periodi e anni, esplicitamente chiamato storico, non media dell'anno.

Default consigliato per prima implementazione: anno scolastico del periodo corrente, con scelta Periodo immediatamente disponibile. Voti e Statistiche condividono lo stesso scope di lettura e lo conservano quando l'utente passa da una vista all'altra. Materia scelta e scroll/contesto non devono resettarsi per il cambio scope.

Se il parent sceglie una patch più prudente, mantenere default Periodo e rendere Anno evidente; il cambio di default può essere un criterio di rilascio a parte. L'esigenza utente è vedere la materia nel suo insieme, quindi non relegare l'anno dentro Impostazioni o un grafico secondario.

Il filtro di lettura non cambia `currentSemesterId`, né il periodo di destinazione dei nuovi voti. La toolbar Voti/Stats deve quindi chiarire entrambi quando diversi: “Stai vedendo: Anno scolastico 2026/27” e nel dialog “Registra in: Semestre 2 · 2026/27”. È essenziale quando si consulta un anno passato o Tutto lo storico. Il nuovo voto deve poter confermare/selezionare un periodo preciso; non assegnare un voto al finto ID 'all'/'year'.

Il registro materia annuale resta unico, ordinato cronologicamente. Ogni riga o intestazione gruppo mostra il periodo; con Tutto lo storico mostra anche anno. Nessun duplicato di materia per ogni periodo. Nei grafici annuali usare date reali, eventuali divisioni leggere fra periodi senza interrompere la continuità. Nello storico multiennale asse/tooltip devono includere anno: oggi `gradeTrend` formatta data come giorno/mese, ambiguo dopo aggregazione pluriennale.

## Regole matematiche

Media per materia annuale = media ponderata di **tutti i voti inclusi nel filtro**, ciascuno con il peso individuale × peso tipologia corrente. Non mediare le medie dei semestri.

Esempio: primo periodo ha voto 6, peso effettivo 1; secondo ha voto 4, peso effettivo 3. Media dei periodi = 5, ma media annuale corretta secondo il modello attuale = (6×1 + 4×3) / 4 = **4,5**.

Media generale annuale = calcolare prima la media annuale di ogni materia, poi ponderare queste medie per coefficiente materia corrente. Non appiattire tutti i voti di tutte le materie in una sola media, e non mediare le medie generali dei periodi. Le materie senza voti nello scope non contribuiscono.

Il trend generale deve applicare la stessa regola incrementalmente ai soli voti nello scope e coincidere nel valore finale con generalAverage (prima dell'arrotondamento del grafico). `gradeTrend` corrente può riutilizzarsi con una lista filtrata annuale; non cambiarne la matematica. Un futuro trend della singola materia va calcolato separatamente e etichettato come tale, non fingere che il grafico generale sia specifico della materia.

Questa è “media dei voti registrati”; il software non conosce regole di promozione/valutazione ufficiale che possano pesare i semestri in modo diverso. L'etichetta deve essere precisa. Non introdurre una nuova formula 'media annuale ufficiale' senza definizione di prodotto.

Il simulatore `neededGrade` deve usare lo stesso scope visibile e la stessa materia; label “Per raggiungere X nella media dei voti visualizzati”. In storico pluriennale è poco utile pedagogicamente: si può limitarlo a Periodo/Anno con una spiegazione breve, lasciando storico in sola lettura analitica. Decidere esplicitamente questa UX. `gradeGoal` attuale è un valore globale del diario, anche se copy Stats dice obiettivo semestre: aggiornare microcopy nello scope annuale, non introdurre obiettivi per anno senza schema/documentazione.

## Rischi e decisioni aperte

1. **schoolYear è testo libero**: '2026/27' e '2026-2027' oggi possono rappresentare stesso anno ma non essere uguali. Prima versione conservativa raggruppa per valore esistente (schema già trim); non dedurre/fondere da date o nomi. Permettere correzione esplicita dei periodi nelle impostazioni; elenco anni mostra etichette esistenti. Eventuale normalizzazione futura richiede preview di mapping, nessun merge silenzioso.
2. **Date non definiscono appartenenza**: un voto può avere data fuori intervallo del semestre e schema lo accetta; l'aggregato deve seguire semesterId e schoolYear del periodo. Se si vuole assegnare per data, è un'altra funzione con conflitti di intervalli sovrapposti e migrazione esplicita.
3. **Tipo/coefficiente retroattivi**: modificare peso tipologia o coefficiente ricalcola anche storico; non introdurre uno snapshot storico adesso e non promettere medie storiche immutabili. I dati vecchi non conservano pesi precedenti.
4. **Materie omonime**: due Subject ID entrambi “Matematica” sono due materie distinte. Non unire per nome. Materia globale può essere usata più anni, ma non assumere identità scolastica equivalente solo da etichetta.
5. **Archiviato ≠ eliminato**: anno/storico devono includere periodi archiviati; materie archiviate con voti non vanno nascoste dalle medie storiche in modo da perdere dati. Preservare comportamento corrente fino a specifica archivio.
6. **UI scope vs scrittura**: tenerli separati impedisce che una consultazione storica alteri semestre di inserimento, agenda, assenze o inviti di classe. Conservare currentSemesterId come contesto per queste azioni.
7. **Empty state attuale**: Stats non mostra storico quando semestre è vuoto. Nuovi filtri devono restare disponibili prima del return empty, con CTA “Vedi l'anno / tutto lo storico” quando esistono dati fuori scope. Mai aggiungere voto a caso per uscire dal vuoto.
8. **Backup/API**: schema strict impedisce aggiungere preferenze arbitrarie nel payload. Prima versione scope come stato UI del workspace (non sincronizzato) e helper puro; se si persiste, aggiornare schema/contratto/import/client legacy esplicitamente. Non cambiare SchoolData.version né backup per sola vista.
9. **Prestazioni**: massimo 10.000 voti; evitare filtri ripetuti inutili/render per ciascun punto. Costruire set dei semesterId inclusi e una sola lista filtrata per scope; gradeTrend è già incrementale.

## Prompt operativo per fase successiva

Implementa in iPagell una vista della materia continua fra periodi, con filtro di lettura condiviso Voti/Statistiche: Periodo, Anno scolastico, Tutto lo storico. Leggi AGENTS.md, mappe e codice corrente; verifica che Subject è globale e Grade riferisce semesterId. Non modificare ID, dati utente, schema DB o formula dei pesi. Introduci helper puro per scope e filtro tramite appartenenza del periodo, separando lo scope UI da Preferences.currentSemesterId. Anno usa i periodi con medesimo schoolYear esistente; non fonde etichette o materie omonime. Mantieni periodo esplicito per ogni nuovo voto. Mostra scope nelle medie, periodo/anno nel registro aggregato e anno nei tooltip multiennali. Conserva scope e materia quando si passa Voti↔Statistiche. Correggi empty state Stats perché consenta leggere anno/storico anche quando periodo corrente non ha voti. Aggrega tutti i voti selezionati con funzioni calculations attuali; non mediare medie dei periodi. Rivedi label goal/simulatore per scope e spiega media dei voti registrati. Mantieni agenda, assenze, classi, appunti, CAS/sync/export/import e tool browser col contesto attuale. Aggiungi test semantici del filtro e delle medie su dati sintetici, non test specchio della UI; QA light/dark, mobile/desktop e transizioni. Aggiorna documenti tecnici pertinenti. Pubblica soltanto dopo verifica secondo DEPLOYMENT tramite progetto Sites esistente se il task include deploy.

## Criteri di accettazione

- Materia singola con due periodi stesso anno mostra tutti i voti in Anno e uno dei due in Periodo; nessun voto perso/duplicato o ID riscritto.
- Due anni mostrano dati distinti nelle rispettive viste annuali e entrambi nello storico; nessun accorpamento automatico di year label diversa o materia con ID diverso.
- Caso 6 peso 1 e 4 peso 3 restituisce annuale 4,5, non 5; caso più materie conferma coefficienti; zero voti dà null/— senza metriche inventate.
- Ultimo punto trend coincide con media scope a precisione grafico; ordinamento date e tooltip includono anno quando necessario; periodo archiviato continua a comparire nello storico.
- Periodo corrente senza voti + anno con voti offre vista annuale utile; filtri sempre presenti anche nel vuoto.
- Consultare anno passato non cambia currentSemesterId o destinazione nuova scrittura; dialog esplicita periodo e un eventuale selettore usa ID reale.
- Cambio filtro conserva materia selezionata; Voti→Statistiche→Voti conserva scope; stessa etichetta scope in registro, media e trend.
- Agenda/Assenze/Home/tool browser conservano behavior precedente finché non esiste specifica esplicita; Appunti rimangono indipendenti dal semestre.
- Backup round-trip preserva originali IDs/semesterId e numeri; import/sync/CAS/account isolation invariati.
- it/de/fr/en, tastiera/focus, 390px/320px, desktop, light/dark; nessun overflow per nomi periodi/anno lunghi.
- Test helper scope/medie e check repository; prove browser reali prima di dichiarare complete UX. Non dichiarare device fisici da emulazione viewport.


## Integrazione con altri metodi di valutazione

Le formule sopra descrivono il runtime attuale con una sola scala. L’[estensione multi-sistema](GRADING-EXTENSION-AUDIT.md) aggiunge la futura precondizione di compatibilità: il filtro annuale raccoglie i risultati, ma medie/serie/confronti devono separarli per sistema/revisione e policy. Non rendere la media delle scale diverse possibile normalizzandole per massimo. Il contesto materia–periodo proposto per i dati non reintroduce una divisione della materia nella navigazione. Il prompt 09 può procedere prima dell’estensione, mantenendo la scala corrente; i prompt 10–14 coprono il lavoro successivo. Nessuna nuova capacità runtime aggiunta da questo paragrafo.
