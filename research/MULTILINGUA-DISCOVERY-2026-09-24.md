# Multilingua iPagell — inventario e prova di prodotto

**Stato:** preparazione alla ricerca con utenti; nessuna modifica al codice applicativo.<br>
**Lingue richieste:** italiano, tedesco standard per la Svizzera, francese per la Svizzera, inglese.<br>
**Fonte:** working tree locale del 24 settembre 2026. Lo stato del sito pubblicato non è stato verificato. I documenti `docs/REPO-SNAPSHOT.md`, `docs/ARCHITECTURE-CURRENT.md`, `docs/VERIFICATION-MATRIX.md` sono stati letti come mappa e confrontati con i file sotto. Le correzioni successive allo snapshot sono descritte in `docs/RELIABILITY.md`.

## Decisione da verificare

Un'interfaccia completa nelle quattro lingue potrebbe aiutare uno studente a completare le operazioni principali e a capire dove sono conservati i suoi dati. La domanda e l'entità del beneficio non sono dimostrate. Il primo test deve misurare comprensione e completamento, non soltanto il numero di clic sul selettore.

**Confine della proposta:** si traducono testo e formati dell'app. Nomi di materie, semestri, attività, note, descrizioni e nomi dei membri sono dati delle persone e restano come scritti. Il preset iniziale è un caso separato: i suoi nomi italiani vengono salvati come dati (`lib/new-diary.ts`), quindi non devono cambiare automaticamente al cambio lingua. Prima di localizzare il preset va verificato se le materie proposte sono appropriate ai diversi percorsi scolastici.

## Inventario delle superfici

| Priorità | Superficie e file correnti | Cosa coprire | Rischio osservabile |
|---|---|---|---|
| P0 | Landing `app/page.tsx` | Navigazione, proposta, CTA, FAQ, privacy, metadati e dati strutturati | Pagina indicizzabile solo in italiano; CTA e redirect portano a `/app`. |
| P0 | Layout `app/layout.tsx`, pagina `app/app/page.tsx` | `html lang`, titolo, descrizione, canonical, manifest | `lang="it"`, `it_IT` e metadata italiani sono statici. |
| P0 | Accesso e primo diario `components/account-gate.tsx` | Login, registrazione, recupero, onboarding, errori e file del codice di recupero | Testi client, validazioni e risposte auth sono italiani; il file scaricato contiene istruzioni di sicurezza. |
| P0 | Diario `components/ipagell-app.tsx` | Navigazione, home, agenda, voti, impostazioni, conferme, notifiche, backup | Viste interne a `/app`; testi e date `it-CH` nello stesso componente. |
| P0 | Stati di affidabilità `components/ipagell-app.tsx`, `lib/diary-session.ts`, `hooks/use-diary.ts`, `lib/account-storage.ts` | Salvato, salvataggio, offline, errore, sessione scaduta, conflitto remoto e fra schede | Un testo ambiguo può indurre a scartare una copia o chiudere un modulo con valori non salvati. |
| P0 | Form `components/entry-dialog.tsx`, `components/absences-view.tsx`, `components/stats-view.tsx` | Etichette, aiuto, valori, stati vuoti, validazioni, formati di data e numeri | L'utente deve poter completare primo voto e prima attività nella lingua scelta. |
| P0 | Errori HTTP `app/api/**`, `lib/server/http.ts`, `lib/client-http.ts`, `lib/classes/client.ts` | Testi visibili restituiti dal server e fallback client | Il client mostra `error` del server come stringa; la sola traduzione dei componenti lascerebbe errori italiani. |
| P1 | Classi `components/classes-view.tsx`, `components/class-events-panel.tsx`, `hooks/use-class-agenda.ts` | Ruoli, inviti, attività, origine condivisa/personale, messaggi di stato | La superficie esiste nel codice, ma l'abilitazione live richiede verifica dell'ambiente. Contenuti scritti dai membri non vanno tradotti automaticamente. |
| P1 | PWA `public/manifest.webmanifest`, `public/offline.html`, `public/sw.js`, `components/install-app.tsx` | Nome/descrizione, shortcut, pagina offline, inviti all'installazione | Manifest e pagina offline sono italiani; il service worker consente solo percorsi e asset elencati. |
| P1 | Routing `components/legacy-entry-redirect.tsx`, link in `app/page.tsx`, query/hash in `components/ipagell-app.tsx` e `components/classes-view.tsx` | Link esistenti, registrazione, agenda, nuovo voto, inviti classe | Nuovi percorsi linguistici potrebbero perdere `?view`, `?action`, `?mode` o `#join`. |
| P1 | Schema e backup `types/domain.ts`, `lib/validation.ts`, `lib/account-storage.ts` | Eventuale preferenza persistente e compatibilità dei backup | `Preferences` non contiene la lingua e lo schema è rigido; salvarla nello snapshot introdurrebbe scritture e revisioni. |
| P2 | Primitive `components/ui/calendar.tsx`, `components/ui/chart.tsx` | Formati impliciti dipendenti dal dispositivo | Alcuni formati usano la locale predefinita del browser, che può differire dalla lingua scelta nell'app. |

L'inventario è per **superficie e comportamento**, non è ancora un catalogo esaustivo di ogni stringa. Prima dello sviluppo servirà estrarre tutte le stringhe UI e assegnare chiavi e contesto. Un controllo automatico di chiavi mancanti è utile, ma non sostituisce la revisione del significato.

## Prototipo di percorso, senza codice

Il prototipo deve mostrare quattro schermate e due stati alternativi, su larghezza telefono e desktop. Le traduzioni sotto sono **bozze di ricerca**, da correggere con revisori competenti prima di pubblicarle.

### A. Prima visita

- Landing nella lingua del dispositivo, se supportata; scelta manuale sempre visibile con i nomi delle lingue nella loro forma nativa: **Italiano · Deutsch · Français · English**.
- La scelta non richiede account e non copre la CTA principale.
- L'utente passa alla registrazione mantenendo la lingua scelta.
- Variante da testare: lingua iniziale italiana con scelta esplicita. Non assumere che il rilevamento automatico sia preferito.

### B. Primo uso

- Registrazione, codice di recupero e creazione del primo diario nella stessa lingua.
- Primo voto: scegliere materia, inserire voto, salvare; lo stato indica se la modifica è sul dispositivo o nell'account.
- Se il preset propone materie, chiarire che sono modificabili; nel prototipo usare un diario vuoto per non confondere il test linguistico con la pertinenza del curriculum.

### C. Cambio lingua a diario aperto

- In Impostazioni, riga **Lingua dell'interfaccia** con scelta immediata e reversibile.
- Restare nella vista corrente. Un modulo già aperto deve conservare tutti i valori inseriti.
- Titoli e note dell'utente restano identici. Le etichette e i formati cambiano.
- La scelta persiste sul dispositivo. La sincronizzazione tra dispositivi è fuori dalla prima versione.

### D. Stato critico da comprendere

Simulare una modifica effettuata offline. Mostrare stato, spiegazione e prossima azione, senza far credere che il salvataggio remoto sia già riuscito.

| Lingua | Etichetta breve, bozza | Spiegazione, bozza |
|---|---|---|
| Italiano | Copia sul dispositivo · offline | Le modifiche restano su questo dispositivo. iPagell proverà a sincronizzarle quando torni online. |
| Deutsch | Auf diesem Gerät gespeichert · offline | Deine Änderungen bleiben auf diesem Gerät. iPagell versucht sie zu synchronisieren, sobald du wieder online bist. |
| Français | Copie sur cet appareil · hors ligne | Vos modifications restent sur cet appareil. iPagell essaiera de les synchroniser dès votre retour en ligne. |
| English | Saved on this device · offline | Your changes remain on this device. iPagell will try to sync them when you're back online. |

**Domanda di comprensione:** «Dove si trova adesso la modifica? È già nell'account? Che cosa faresti se dovessi cambiare telefono ora?» La risposta corretta non deve dipendere dal colore dell'avviso.

### E. Stato critico alternativo

Simulare un conflitto con una copia dell'account più recente. L'utente deve identificare la propria copia locale, capire che può esportarla e distinguere l'azione di caricamento della copia account dall'azione di salvataggio. Il prototipo non deve semplificare questa situazione in un generico «Riprova».

## Scelte architetturali da decidere dopo la prova

1. **Priorità della lingua:** scelta esplicita dell'utente > lingua del browser compatibile > italiano. I link pubblici in una lingua precisa devono prevalere sulla preferenza locale per quella pagina. Definire come si torna alla lingua salvata quando si apre l'app.
2. **URL pubblici:** versioni stabili della landing per ciascuna lingua e collegamenti tra versioni; conservare l'URL italiano esistente. Scegliere i percorsi solo dopo una verifica Vinext/Vite con build, canonical, sitemap e redirect. Non presumere che una convenzione Next funzioni identicamente nel runtime attuale.
3. **Preferenza nell'app:** per il primo rilascio, archivio locale separato dal diario. Questo evita di modificare lo schema rigido e la revisione dello snapshot solo per un'impostazione visiva. Specificare comportamento su browser condiviso e dopo cancellazione dei dati locali.
4. **Messaggi:** codici semantici stabili per gli errori API, con testo localizzato nel client e compatibilità del campo `error` durante la migrazione. I dati applicativi e i permessi non dipendono dalla lingua.
5. **Risorse:** dizionari per lingua e controllo delle chiavi; date, numeri e plurali mediante API `Intl`. Misurare le risorse caricate e verificare la cache PWA. Nessun servizio di traduzione durante l'uso.
6. **Accessibilità:** lingua corretta del documento e delle porzioni di testo statico in lingua diversa. I contenuti scritti dai membri non possono essere etichettati automaticamente con certezza.

## Piano del test con studenti

**Campione esplorativo:** 3–5 studenti per tedesco e francese; 3–5 per inglese se si vuole giustificare il rilascio simultaneo dell'inglese; 2–3 utenti italiani come controllo di regressione. È una proposta operativa, non una stima statistica. Usare dati fittizi e non chiedere voti o credenziali reali.

1. Dare il prototipo senza spiegare la posizione del selettore. Osservare se la lingua viene riconosciuta o cambiata.
2. Chiedere di creare un diario e registrare un voto fittizio. Annotare richieste d'aiuto, esitazioni e passaggi non completati.
3. Aprire un modulo con testo già inserito; chiedere di cambiare lingua e verificare che l'utente si aspetti di conservare i valori.
4. Mostrare lo stato offline e poi il conflitto. Chiedere dove sono i dati, che cosa succede dopo e quale azione sceglierebbe.
5. Mostrare un'attività di classe scritta in un'altra lingua. Chiedere che cosa si aspetta che iPagell traduca.
6. Solo alla fine: breve intervista su parole poco chiare, valore della lingua rispetto alle altre difficoltà incontrate e desiderio di riutilizzare il diario.

**Registrazione minima:** lingua, compito completato sì/no, aiuto necessario sì/no, interpretazione corretta degli stati dati sì/no, punti di esitazione, errori di traduzione. Non registrare contenuti personali o filmare senza consenso specifico.

**Segnali per procedere:** più partecipanti completano primo voto e interpretano correttamente lo stato offline nella propria lingua senza guida; la scelta linguistica risolve una difficoltà che avevano realmente. **Segnali per rivedere l'idea:** la lingua viene cambiata ma compiti e stati restano incomprensibili, oppure le difficoltà principali riguardano navigazione e flusso indipendentemente dalla lingua. Soglie numeriche di lancio vanno fissate dopo il primo giro, evitando precisione artificiale su un campione piccolo.

## Criteri di uscita della fase

- Inventario completo delle stringhe e dei formati, con proprietario e contesto per ogni messaggio critico.
- Bozze revisionate da persone competenti nelle lingue target, soprattutto per termini scolastici, privacy e salvataggio.
- Risultato documentato del test: compiti osservati, interpretazioni degli stati, attriti e decisione su MVP e ordine di rilascio.
- Verifica tecnica mirata dei percorsi linguistici nel runtime Vinext/Vite e dell'offline PWA prima di impegnarsi in un disegno di routing definitivo.
