# Più scale di voto — analisi di prodotto (19 novembre 2026)

[Sistema voti](GRADING-SYSTEM.md) · [Analisi multi-sistema del 1 ottobre](improvement-2026-10-01/GRADING-EXTENSION-AUDIT.md) · [Prompt 10–14](improvement-2026-10-01/PROMPTS.md)

Obiettivo: permettere a più studenti di usare iPagell supportando altre scale di voto, mantenendo il programma facile da usare, curato e riconoscibile. Questo documento è **solo analisi**: nessun codice, schema o dato è cambiato. Il runtime resta `numeric-1-6`.

## Punto di partenza verificato nel codice

- Ricerca, fonti primarie e rischi sono già nell'[analisi del 1 ottobre](improvement-2026-10-01/GRADING-EXTENSION-AUDIT.md); questo documento non la sostituisce, ne propone una via più leggera da percorrere.
- `types/grading.ts` descrive già sistemi numerici (range o set, ordine crescente o inverso) e ordinati.
- In pratica tutto legge `CURRENT_GRADING_SYSTEM` (1–6):
  - validazione e `gradeGoal` in `lib/validation.ts` (schemi `.strict()`, `SchoolData.version: 1`);
  - assi, tick e `ReferenceLine` della sufficienza in `components/stats-view.tsx`;
  - pill dei voti, barra di progresso, slider obiettivo e simulatore in `components/ipagell-app.tsx`;
  - calcolatore pubblico (`components/grade-average-calculator.tsx`, `lib/grade-average-calculator.ts`);
  - testi nelle quattro lingue (`grades.scale`, `error.grade`, `public.factScaleValue`, `public.homeText` con «Swiss 1–6 grading scale»).
- Le Classi non condividono voti, medie o obiettivi ([CLASSI](CLASSI.md)): non sono coinvolte.

## Dove si trova il pubblico in più

Le lingue già presenti (it/de/fr/en) portano verso queste scale. Le scale si descrivono per ciò che sono; il paese è solo un suggerimento, non una regola ufficiale.

| Scala | Pubblico tipico | Complessità |
|---|---|---|
| 1–6, crescente, sufficienza 4 (attuale) | Svizzera | nessuna |
| Decimi 1–10, sufficienza 6 | Italia | bassa, ma servono le notazioni `6+`, `6-`, `6½`, `6/7` |
| 0–20, sufficienza 10 | Francia | media: molti voti arrivano come «su N» (`7/10`, `15/20`) |
| 1–6 inverso (1 migliore), sufficienza 4 | Germania | media: ordine, colori, ordinamenti e simulatore invertiti |
| Percentuale 0–100, soglia facoltativa | inglese/generico | bassa |

Le prime quattro sono numeriche e coprono quasi tutto il guadagno. Giudizi, lettere/GPA, IB e GCSE restano successivi, come già indicato nell'analisi del 1 ottobre.

## Modello proposto (semplificazione)

L'analisi del 1 ottobre propone un contesto materia–periodo (`SubjectTerm`). Qui si propone un'alternativa più leggera che offre le stesse garanzie:

- **Ogni voto porta un riferimento alla propria scala** (per esempio `scale: "decimi-1-10@1"`), non la definizione completa. Assenza del campo = `numeric-1-6@1`: i voti esistenti restano validi senza migrazione dei valori.
- **Il diario ha una scala predefinita**; ogni materia può avere un'**eccezione facoltativa**. Entrambe valgono solo per i voti nuovi.
- **Medie e grafici aggregano solo voti con la stessa scala.** Nessuna conversione o normalizzazione fra scale.
- **`gradeGoal` per scala**, invece di un unico valore globale.

Vantaggi: nessuna nuova entità, backup semplice, storico mai reinterpretato da una preferenza cambiata. Il riferimento include la revisione (`@1`), quindi un cambio futuro delle regole non riscrive il passato.

## Esperienza utente

- **Una sola domanda nel setup:** «Come vengono dati i voti nella tua scuola?». 4–5 schede con esempi di pill già colorate («6 = ottimo · 4 = sufficiente», «1 = ottimo»). La lingua può suggerire una scheda, mai sceglierla in silenzio. 1–6 crescente e 1–6 inverso devono essere distinguibili a colpo d'occhio.
- **Utenti esistenti:** nessun cambiamento. Nelle Impostazioni compare una riga discreta «Scala: 1–6 · Cambia».
- **Cambio scala:** vale «da ora in poi». Se in un periodo convivono più scale, le statistiche mostrano riepiloghi separati con una frase di spiegazione.
- **Inserimento naturale:** il voto si scrive come lo dà il docente (`6½`, `7-`, `15/20`) con anteprima del valore contato prima del salvataggio.
- **Identità:** stessa palette, stesse pill, stessi componenti Radix, nessuna nuova dipendenza (vedi skill [apple-design](../.agents/skills/apple-design/SKILL.md)). Il messaggio evolve da «basato sulla scala svizzera» a «nato in Svizzera, parla la scala della tua scuola»; nella landing svizzera la 1–6 resta in primo piano.

## Fasi proposte

1. **Calcolatore pubblico multi-scala.** Non salva dati: rischio nullo per gli utenti. È il canale di acquisizione più rapido (ricerche tipo «calcolo media voti») e mostra quali scale vengono usate davvero. *Implementata il 19 novembre 2026, non ancora pubblicata: dettagli in [Sistema voti](GRADING-SYSTEM.md#public-grade-average-calculator).*
2. **Fondamenta invisibili.** Tutte le funzioni ricevono la scala come parametro invece di leggere sempre 1–6; sufficienza a tre stati (sopra / sotto / non definita). Un rilascio *legge* il nuovo formato ma *scrive* ancora quello vecchio, così i client si aggiornano prima che il formato cambi.
3. **Nuove scale nel diario.** Scale numeriche, scelta nel setup e nelle Impostazioni, nuovo formato del diario, blocco lato server delle scritture incompatibili.
4. **Eccezione per materia, notazioni `+/-` e voti «su N».** Poi giudizi e altre famiglie, solo con domanda reale.

## Rischi da non saltare

Ripresi dall'analisi del 1 ottobre e confermati nel codice:

- **Vecchi client.** Schemi `.strict()` e salvataggio dell'intero diario: una PWA non aggiornata rifiuterebbe i dati nuovi o potrebbe sovrascriverli. Il server deve impedire che uno snapshot vecchio sovrascriva un diario nuovo, con un controllo atomico nella stessa query della scrittura con CAS, non con un controllo preliminare separato.
- **Zero valido.** Su 0–20 lo 0 è un voto reale; oggi la lista delle medie scarta `media > 0`.
- **Simulatore.** `roundRequiredGrade` arrotonda sempre verso l'alto a passi di 0,5: sbagliato per scale inverse e per altri passi.
- **Backup.** L'import deve continuare ad accettare il formato V1 per sempre: serve anche al trasferimento in corso da Sites a Cloudflare.
- **Pesi.** `gradeWeight` impone un minimo di 0,1: un'eventuale esclusione dal calcolo va modellata esplicitamente, non con peso 0.

## Decisioni del proprietario (19 novembre 2026)

- **Scale del primo rilascio:** oltre alla 1–6 crescente, tutte e quattro le scale della tabella: decimi 1–10, 0–20, 1–6 inverso e percentuale 0–100.
- **Notazione dei decimi:** `6+` = 6,25 · `6-` = 5,75 · `6½` = 6,5 · `6/7` = 6,5. L'app mostra il valore contato prima del salvataggio. Va distinta dalla notazione attuale `4-5` della scala 1–6, che vale 4,5.
- **Eccezione per materia:** in una fase successiva. Il primo rilascio ha una sola scala per diario.
- **Punto di partenza:** fase 1, calcolatore pubblico multi-scala.

## Ancora da decidere

- Notazione `+/-` per la 1–6 inversa (per esempio `2+`, `2-`) e per lo 0–20.
- Voti «su N» per lo 0–20 (`7/10`, `15/20`): fase 4, oppure già nel calcolatore pubblico.
- Etichette e suggerimento del paese nel selettore, nelle quattro lingue.
