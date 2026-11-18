# Ridisegno UI — analisi preliminare e interventi (18 novembre 2026)

[Indice](README.md) · [Architettura](ARCHITECTURE-CURRENT.md) · [Skill apple-design](../.agents/skills/apple-design/SKILL.md)

Richiesta: ridefinire l'interfaccia in stile Apple «Liquid Glass» con accento blu, partendo da un'analisi, poi lo spazio pubblico e infine l'app. Criteri del proprietario: **utilità prima**, **trovare le cose**, **capire cosa succede**, **proporzioni**.

Metodo: lettura di `app/globals-new.css`, dei moduli CSS pubblici, di `components/public-*.tsx` e `components/ipagell-app.tsx`; osservazione nel dev server locale a 390 e 1280 px con un account di prova vuoto. Le viste con dati (voti, agenda piena, statistiche) sono valutate dal codice: l'account di prova non contiene dati.

## 1. Analisi

### Spazio pubblico (landing, diario, appunti, media)

| # | Osservazione | Effetto su chi arriva | Priorità |
|---|---|---|---|
| P1 | Due identità visive: il pubblico usa carta calda `#f7f6f2`, viola e serif corsivo; l'app usa grigio freddo e (ora) blu. | Passando da sito ad app sembra un altro prodotto. | Alta |
| P2 | Colori scritti a mano in quattro moduli CSS (`#6655e6`, `#5140cb`, `#242132`…), nessun token condiviso. | Ogni ritocco va ripetuto in decine di punti; incoerenze inevitabili. | Alta |
| P3 | Nella landing l'azione principale è «Apri gli appunti»; il diario, il prodotto principale, compare come anteprima e poi solo in fondo. | Non è chiaro che cosa sia iPagell né da dove iniziare. | Alta |
| P4 | Le tre cose che si possono fare (diario, appunti, media) sono distribuite in tre sezioni con numerazione «02 / 03 / 04». | La numerazione non ha significato per l'utente e aggiunge rumore. | Media |
| P5 | Header mobile alto circa 120 px: marchio, lingua, accesso e quattro voci numerate su due righe. | Lo strumento (editor, calcolatore) scende sotto la piega. | Media |
| P6 | Testi molto piccoli: didascalie a 10–11 px (`.625rem`, `.6875rem`), kicker con tracking `.13em`. | Leggibilità ridotta, specie su telefono. | Media |
| P7 | Titoli con tracking `-0.065em`. | Lettere che si toccano nei titoli grandi; meno leggibile. | Bassa |
| P8 | Le pagine strumento (appunti, media) sono già funzionali: lo strumento è subito visibile. | Da conservare. | — |

### App

| # | Osservazione | Effetto | Priorità |
|---|---|---|---|
| A1 | `globals-new.css` ha 2.900 righe con più strati di correzioni successive (es. righe 2030+, 2470+, 2840+) che ridefiniscono le stesse classi. | Proporzioni non uniformi: raggi 12/14/15/18/28 px, ombre diverse per card simili. | Alta |
| A2 | Appunti non ha una voce di navigazione: si apre da Home, Agenda e Voti. | Su desktop la barra laterale ha spazio ma la funzione resta difficile da trovare. | Alta |
| A3 | Impostazioni: sul desktop esistono sia la voce in barra laterale sia un'icona senza etichetta in alto; su mobile un'icona in alto e un avatar. | Due ingressi per la stessa cosa, uno dei due ambiguo. | Media |
| A4 | Titoli con tracking `-0.045em` e card con raggio 28 px. | Aspetto pesante rispetto al riferimento Apple (titoli compatti ma leggibili, card 20 px). | Media |
| A5 | Stato vuoto della Home: due card con azioni chiare («Aggiungi materie», «Nuovo appunto»). | Funziona; può guadagnare un ordine più netto. | Bassa |
| A6 | Tab bar mobile a cinque voci con etichetta e stato attivo tinto. | Buona base; diventa il punto giusto per il materiale vetro. | — |

### Vincoli confermati

- Superfici solide per voti, testi e moduli; vetro solo per barre e fogli sopra il contenuto, con fallback opaco e rispetto di `prefers-reduced-transparency` e `prefers-contrast` ([skill apple-design](../.agents/skills/apple-design/SKILL.md)).
- Nessuna modifica a dati, payload, formule, permessi, autosave o `flushOpenNotes()`.
- Testi nei quattro cataloghi it/de/fr/en; nessun testo letterale nei componenti migrati.
- Riduci movimento: account e sistema.

## 2. Sistema visivo

| Token | Chiaro | Scuro | Uso |
|---|---|---|---|
| `--canvas` | `#f2f2f7` | `#0b0d14` | Fondo pagina |
| `--surface` | `#ffffff` | `#191b26` | Card e moduli |
| `--ink` | `#1d1d1f` (pubblico) / `#171a2a` (app) | `#f5f5fb` | Titoli e testo |
| `--subtle` | `#6e6e73` (pubblico) / `#6f7387` (app) | `#9b9eb1` | Testo secondario |
| `--accent` | `#0066cc` | `#64b5ff` | Testo e icone d'accento (contrasto ≥ 4,5:1 su bianco) |
| `--accent-fill` | `#0071e3` | `#0a84ff` | Fondi dei pulsanti primari (testo bianco) |
| `--accent-soft` | `#e8f2ff` | `rgba(10,132,255,.2)` | Stato attivo, pulsanti secondari |
| `--radius-card` | 20 px | — | Card, pannelli |
| `--radius-control` | 12 px | — | Pulsanti, campi |

Tipografia: font di sistema esistente, titoli 700 con tracking `-0.02em`, corpo 400–600 con tracking 0, testo minimo 12 px.

## 3. Interventi

### Fase 1 — Spazio pubblico

- Token condivisi in `app/public-space.module.css`; i quattro moduli pubblici usano le variabili invece dei colori scritti a mano (P1, P2).
- Landing: apertura con titolo, descrizione e azioni «Crea un account» e «Accedi»; subito sotto la scelta «Da dove vuoi iniziare?» con tre card equivalenti — Diario (richiede un account), Appunti e Media voti (senza account) — ciascuna con la propria azione (P3, P4).
- Header: numerazione rimossa, voce attiva tinta in blu, accesso più evidente; su mobile le voci restano su una riga compatta (P4, P5).
- Testo minimo 12 px, tracking dei titoli `-0.02em`, raggi 12/20 px (P6, P7).

### Fase 2 — App

- Strato finale di normalizzazione in `globals-new.css`: raggi, ombre e tracking unificati tramite token (A1, A4).
- Tab bar mobile come materiale vetro, con fallback opaco; la barra laterale desktop resta solida perché non si sovrappone al contenuto (A6).
- Appunti come voce della barra laterale desktop; la tab bar mobile resta a cinque voci (A2).
- Su desktop l'icona Impostazioni senza etichetta in alto viene nascosta: resta la voce «Impostazioni» con etichetta nella barra laterale. Su mobile l'icona resta l'unico ingresso (A3).
- Card principale della Home, pulsanti e grafici portati al blu (A4).

### Fase 3 — Viste con dati di prova e navigazione (richieste del proprietario)

Con un account di prova locale (3 materie, 7 voti, 3 attività, 1 assenza senza note):

- **Titoli:** il reset di Tailwind portava tutti i titoli a peso 400; ora un peso predefinito 700 a specificità zero, che le regole esplicite possono sostituire.
- **Home:** «Da controllare», «In arrivo», «Situazione voti» e «I miei appunti» sono card uguali (stesso fondo, padding, raggio e dimensione del titolo). Corretta una regressione di questo ridisegno: l'ombra delle card finiva su sezioni piatte senza fondo.
- **Agenda:** selettore Calendario/Elenco e filtro sulla stessa riga su telefono; segmento attivo bianco in rilievo; nel calendario numero e punti delle attività centrati sotto il giorno della settimana (prima i punti cadevano sotto il giorno successivo).
- **Voti:** i due selettori di consultazione sulla stessa riga su telefono; righe del registro con spazio sopra e sotto il divisore.
- **Statistiche:** il riepilogo «voti · materie» non è più compresso in una colonna stretta (residuo di una griglia pensata per un'icona non più presente); titoli delle card uniformi.
- **Assenze:** data, testo, ore ed eliminazione restano su una riga; i tre numeri del riepilogo sono allineati.
- **Assenze meno in vista:** esce dalla barra mobile e scende in un gruppo secondario della barra laterale; al suo posto la barra mobile mostra Appunti (`nav.notes`).
- **Impostazioni da più punti:** su telefono l'icona in alto diventa l'avatar dell'account; su desktop la scheda account in fondo alla barra laterale è un pulsante. In fondo alla Home il gruppo «Altro» (`home.moreLinks`) porta ad Assenze, Statistiche e Impostazioni.
- **Tema scuro:** un vecchio strato impostava ancora `--accent` viola (`#9788ff`); ora blu.

## 4. File modificati

- Token e accento: `app/globals-new.css` (valori in `:root`, `[data-theme="dark"]`, residui viola, strato finale di normalizzazione).
- Spazio pubblico: `app/public-space.module.css`, `app/public-overview.module.css`, `app/marketing-page.module.css`, `app/grade-average.module.css`, `components/public-overview.tsx`; numerazione rimossa in `components/landing-content.tsx`, `components/public-notes.tsx`, `components/grade-average-calculator.tsx`.
- App: voce Appunti nella barra laterale in `components/ipagell-app.tsx`; colori dei grafici in `components/stats-view.tsx`.
- Testi: `public.startHere` sostituita da `public.chooseTitle` nei quattro cataloghi.

## 5. Verifiche e limiti

Eseguito il 18 novembre 2026 con Node 24.22.3:

- `npm run check`: lint, TypeScript, 152 test, cataloghi, inventario e link superati.
- `npm run build`: superata; il CSS compilato contiene il vetro della barra mobile, il fallback per trasparenza ridotta/contrasto alto e l'occultamento dell'icona Impostazioni duplicata su desktop.
- Dev server: landing a 1280 e 390 px senza scroll orizzontale; pagine Il diario e Media voti a 390 px; schermata di accesso a 1280 px.
- App con account di prova vuoto: Home a 1280 px senza icona Impostazioni duplicata; la voce «I miei appunti» della barra laterale apre Appunti con `aria-current="page"` solo su di essa; Home a 390 px con barra mobile traslucida (`rgba(255,255,255,.72)`, blur 20 px) e senza scroll orizzontale; tema scuro applicato temporaneamente nella pagina (non salvato nelle preferenze) con token scuri corretti.
- Correzione emersa nella prova: i titoli delle card della Home avevano peso 400 accanto al titolo di pagina a 700; ora 700.

- Fase 3, dev server con dati di prova: Home, Agenda (calendario ed elenco), Voti, Statistiche, Assenze e Classi a 390 px; Home, Voti, Agenda e Appunti a 1280 px; tema scuro su Agenda e Home; ingressi alle Impostazioni da avatar e scheda account con ritorno del focus; Appunti dalla barra senza «Torna a…», dalla Home con «Torna a Home».
- Fase 3: `npm run check` completo (lint, TypeScript, 152 test, cataloghi, inventario, link) e `npm run build` superati con Node 24.22.3. Il compilatore React segnalava come impura una chiamata a `openNotes` dentro `nav.map`: risolto con un gestore `openNotesFromNav` definito a livello di componente.

Non verificato: classi con membri e attività condivise, tedesco e francese a schermo (in francese la voce «Notes de cours» della barra va su due righe), testo al 200%, Safari e dispositivi fisici. Le immagini del prodotto in `public/product-media` mostrano ancora l'interfaccia viola e vanno rigenerate. Il colore predefinito di una nuova materia (`components/entry-dialog.tsx`) resta `#6655e6` perché è un valore salvato nei dati.

Pubblicato il 18 novembre 2026 come versione Worker `7b26524e-f3e0-4b27-8326-d006ff16b713`: dettagli e verifiche nel [registro di pubblicazione](DEPLOYMENT.md#ridisegno-ui--18-novembre-2026).
