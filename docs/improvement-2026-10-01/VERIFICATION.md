# Verifiche del programma iPagell

1 ottobre 2026. [Piano](PLAN.md) · [Prompt](PROMPTS.md)

## Evidenze già disponibili

- Tre audit specialistici in sola lettura, con file verificati e fonti primarie per SEO/identità. L’audit visivo iniziale deriva dal codice e dai contrasti misurati; le prove browser sono registrate separatamente sotto.
- Connettore Sites: progetto corrente attivo, owner, accesso pubblico, URL live `https://ipagell.website`, versione precedente 27; domini canonico e www con stato/TLS `active`. Runtime `IPAGELL_CLASSES=enabled`. Non sono stati letti diari o note reali.
- Riconciliazione GitHub/Sites con merge: file applicativi coincidenti, conservati documenti e dipendenze più recenti del checkout; nessuna storia riscritta.
- Cataloghi delle quattro lingue: `npm run check:i18n` passato, 755 chiavi complete e referenziate.

## Verifiche del rilascio

| Verifica | Esito osservato |
|---|---|
| Preparazione completa | `npm run release:prepare` passato: lint, TypeScript, 106 test, 755 chiavi i18n, inventario e link, build/precache. Rimane l’avviso chunk oltre 500 kB. |
| API locale | 146 verifiche passate nel Worker compilato con DB isolato e cleanup degli account sintetici. Prima esecuzione interrotta da connessione persa del runtime; riavviata l’istanza dopo bootstrap e ripetuta integralmente con esito positivo. |
| HTML SSR pubblico | Otto route: 200, titolo e descrizione tradotti, lingua, canonical, cinque hreflang, OG coerenti e index sullo stesso Worker richiesto con host canonico. Root canonical normalizzato senza slash finale, equivalente all’URL con slash. |
| Esclusioni SEO | `/app` noindex; robots esclude API e consente leggere il noindex; sitemap contiene otto URL pubblici. |
| Landing mobile | Screenshot e DOM a 320/390 px e desktop 1440×900: CTA e scala presenti, nessun overflow. Calcolatore aperto dal link e voto sintetico 4,5 restituisce media 4,5 senza account. |
| Registrazione | Username/password sintetici, mostra/nascondi password e passo recupero; Continua disabilitato prima della conferma. |
| Setup | Nome e preset basic; dettagli periodo aperti, modificati e richiusi: valore «Periodo QA» conservato nella Home dopo invio. |
| Primo valore | Primo voto sintetico 4,5 da CTA Home → form → media Home 4,5, un voto/una materia e stato salvato. |
| Home chiaro/scuro | Screenshot e controllo DOM sul dato sintetico; 390 px senza overflow, testo/CTA leggibili a transizione terminata. |
| Errore recovery | Bug precedente riprodotto interrompendo server: form smontato. Dopo fix, stesso errore conserva textarea da 64 caratteri, passo 2 e checkbox; errore di rete visibile e Continua disponibile. Dopo il riavvio, la stessa schermata Continua raggiunge il setup senza ricaricare la pagina. Tre test della sessione proteggono errore rete/cache, attivazione storage e caricamento identità verificata. |
| Confronto codice/documenti | Diff controllato, nessuna nuova API/tabelle/migrazione; checker link esteso alle sottocartelle. Programma aggiornato con audit periodi e prompt 09 dopo la richiesta utente. |

Gli account browser sono stati creati soltanto nei DB locali di prova; il primo account è stato eliminato tramite endpoint security con la sua password sintetica. Il secondo account è stato eliminato allo stesso modo dopo il retry riuscito. La copia locale di test non è un diario reale.

## Limiti del primo ciclo Sites 28

Google/Apple/email e i filtri annuale/storico sono pianificati, non implementati. Nessuna migrazione database. Indicizzazione, ranking e conversione non misurati; Search Console non collegata in questo task. Prove browser con viewport non certificano telefoni fisici, tastiera virtuale, PWA o password manager di ogni sistema. Traduzioni senza revisione madrelingua. Il primo ciclo non conclude la roadmap delle altre schermate.


## Pubblicazione confermata

- Versione Sites **28**, ID `appgprj_6aa9bf5f9a00819189df944bf2d51850~appgver_e554be1f51a88191bf408d2d3f5fd5c7`.
- Sorgente inviato e pacchetto locale: commit `8fee251e1b942d3392ca92ab9381be4c0a6ae1c8`; archivio salvato dalla piattaforma (241 file).
- Deployment `appgdep_6abe63d2394c8191a6ee91547a4e3008`, risposta terminale `succeeded` del 1 ottobre 2026 alle 13:45 UTC.
- URL restituito dal deployment: `https://ipagell.produc-ch.chatgpt.site`; dominio canonico di produzione **https://ipagell.website**. Progetto/domini/www/TLS verificati prima della pubblicazione; binding DB, accesso pubblico e domini conservati senza mutazioni di configurazione.
- Nessuna ispezione dei contenuti utente, migrazione o prova con account sintetici in produzione. Il successo della piattaforma non certifica indicizzazione o QA su dispositivi fisici.
- Questa registrazione documentale è successiva al commit applicativo pubblicato e non modifica il runtime.


## Aggiunta documentale multi-sistema — 1 ottobre 2026

Richiesta successiva al rilascio 28: [analisi dei metodi di valutazione](GRADING-EXTENSION-AUDIT.md), fonti primarie, collegamenti alle ricerche iniziali e cinque nuovi prompt (10–14). Audit codice delegato in sola lettura; aggiornati programma, prompt annuale e indice.

`npm run docs:check` passato: inventario invariato, 46 documenti e 299 link locali. `git diff --check` senza errori. Nessun codice applicativo, nuovo test, migrazione o deploy in questa aggiunta. I risultati 106 test/146 API sopra restano evidenze del rilascio 28, senza attestare nuovi sistemi implementati.


## PERIODS-01 / W1 — prompt 09, 1 ottobre 2026

Stato del ciclo **completato**: implementazione, verifiche locali e pubblicazione Sites **29** concluse. Baseline Git `a1ebee6`, Sites 28 verificato attivo/pubblico, domini ipagell.website/www con TLS attivo. Gli aggiornamenti documentali non committati presenti all’avvio sono stati conservati. Un responsabile ha scritto patch e controllato browser; specialisti `gpt-6.1-sol` high per UI e `gpt-6-astra` medium per aggregazioni/revisione in sola lettura. Modelli disponibili, nessuna impostazione globale modificata.

| Verifica nuova | Evidenza osservata |
|---|---|
| Preparazione completa finale | `npm run release:prepare` passato: lint, tipi, **114 test** (otto nuovi semantici), **770 chiavi** in quattro lingue, inventario 27 route/15 tabelle/7 migrazioni, documenti/link e build/precache. Resta l’avviso chunk oltre 500 kB. Il primo check si era fermato sull’inventario da rigenerare; corretto e ripetuto integralmente. |
| Medie e scope | Test: 6×1 + 4×3 = **4,5**, coefficienti materia, pesi tipo correnti, etichette anno distinte, data fuori periodo, archiviati/omonimi, periodo vuoto/anno popolato, trend cumulativo ordinato/finale coerente, backup con ID/voti originali e nessuna mutazione da filtro. Il simulatore conserva peso effettivo **0,01**. |
| API locale | **146 controlli passati**, Worker compilato e DB nuovo isolato in `/private/tmp/ipagell-annual-db-20261001`; cleanup della suite concluso. Nessuna richiesta ai dati utente di produzione. |
| Journey Voti/Statistiche | Annuale iniziale utile nonostante corrente vuoto; materia principale 4,5, omonima 3,0, media generale 4,0. Periodo vuoto conserva filtri e offre storico. Periodo passato → Anno resta 2025/26; ritorno Voti↔Statistiche conserva materia/scope. Storico mostra cinque voti della materia e sospende simulazione. |
| Nuovo voto | Da seconda materia e anno passato: form inizializzato su ID `same` e periodo corrente reale. Modifica valore/destinazione → annulla → riapri: campi azzerati e destinazione corrente. Salvataggio esplicito in periodo `old` riuscito, con data fuori intervallo; risposta API del solo account sintetico conferma subjectId/semesterId, sette voti totali (annullamento non crea voto) e currentSemesterId invariato. |
| Home | Dopo consultazione/scrittura passata, Home continua a mostrare periodo corrente vuoto, nessun voto e attività corrente. Home/Agenda/Assenze/tool browser mantengono il contesto precedente per codice/revisione; nessuna riscrittura di preferenze da filtro. |
| Browser/lingue/accessibilità | Desktop **1440×1000**, mobile **320/390 px**, chiaro/scuro; anno/nome periodo da oltre 100 caratteri in selector, hero, confronto e dialog. Eliminato margine negativo legacy delle materie che produceva 1 px di overflow; sul bundle finale scrollWidth=320 a viewport 320. Etichette accessibili del filtro/destinazione; Tab da filtro ad anno con focus viola visibile. Cataloghi it/de/fr/en letti nel browser senza cambio valori/scala. |
| Review | Due revisioni fresche in sola lettura, invarianti matematiche confermate; corretti cambio modalità su anno passato, wrapping nomi lunghi e peso futuro minimo. Review finale senza difetti critici. |

Account browser annuale creato solo nel DB isolato, eliminato tramite endpoint security con le sue credenziali sintetiche: `{ok:true}`. Una richiesta di verifica è caduta mentre il runtime locale si riavviava dopo build; ripetuta a server stabile con esito positivo. Il dataset iniziale oltrepassava il limite schoolYear: API lo ha rifiutato senza scrivere; etichetta ridotta sotto 120 e dataset validato.

Screenshot locali ignorati da Git in `outputs/annual-grades/`: `annual-desktop-light.jpg`, `annual-390-light.jpg`, `stats-320-dark-long.jpg`. Non sono link/artefatti necessari alla CI; i fatti sopra restano nel rapporto versionato.

Nessuna migrazione o cambio dei contratti/API/backup. Sono invariate scala numeric-1-6, identità, binding DB, audience e domini. Limiti: viewport non equivale a iOS/Android fisici; traduzioni senza revisione madrelingua, Search Console e usabilità con persone non misurate; massimo dataset/performance e PWA fisica restano nella matrice trasversale.

Durante la preparazione è scomparso il helper locale Sites `site-workflow.mjs` e la skill dalla cache; verifica filesystem/ricerca senza copie, connettore ancora attivo. Dopo riattivazione Sites da parte dell’utente, entrambi i file sono tornati nello stesso percorso: **blocco risolto**, nessun deploy alternativo o modifica delle impostazioni globali. La pubblicazione è stata conclusa tramite il workflow originale, come registrato sotto.

Prossima sessione: prima chiudere questo rilascio se ancora aperto; dopo completamento, **architettura identità / prompt 04 / W7**, poi 05 con Google/email e Apple quando realmente configurabili. Non avviato automaticamente.


### Pubblicazione PERIODS-01 confermata

- Sorgente esatto salvato/inviato dal workflow Sites: `02cb8843867987dbb3552e049fd1aecd5f755352`; archivio locale validato `/private/tmp/ipagell-annual-release.tar`, **241 file**, salvato dalla piattaforma.
- Versione Sites **29**, ID `appgprj_6aa9bf5f9a00819189df944bf2d51850~appgver_71c64327d1c48191ab46f6cea3e52434`.
- Deployment `appgdep_6abe8ea156008191bdddc2141ffb5162`, stato terminale **succeeded**, 1 ottobre 2026 **18:47 Europe/Zurich**. URL della risposta `https://ipagell.produc-ch.chatgpt.site`; URL live canonico confermato da get_site dopo il deploy: **https://ipagell.website**, progetto attivo, owner, audience public, latest version 29.
- Domini `ipagell.website` e `www.ipagell.website` verificati nuovamente dopo il deploy: status/TLS active. Nessuna mutazione di binding, runtime, accesso o domini; migrazioni storiche preservate. Nessuna lettura/scrittura dei diari reali. Verifica esterna tramite piattaforma, senza nuovo journey autenticato in produzione.
- SSR locale del bundle finale: tutte le otto route dal catalogo public-routes restituiscono 200 con title/canonical; `/app` noindex. Primo script di controllo usava nomi URL errati e ha trovato 404; corretto usando il catalogo e ripetuto integralmente. Questo non certifica indicizzazione Google.
- Le registrazioni finali dei documenti sono successive al commit applicativo del rilascio; non cambiano il runtime pubblicato. Stato PLAN e WORKFLOW-MODELS allineato: **completato**. Prossimo ciclo **prompt 04 / W7**, non avviato.


## IDENTITY-ARCH-01 / W7 — prompt 04, 1 ottobre 2026

Stato **completato come architettura**; baseline `199215c`, tree iniziale pulito, branch iniziale `codex/annual-grades-20261001`. Nessuna implementazione, migrazione in drizzle, provider configurato, UI o deploy. La decisione è aggiunta all’[audit esistente](AUTH-PRODUCT-AUDIT.md), senza duplicare documenti. PLAN/WORKFLOW/PROMPTS allineati alla nuova preferenza **Sol 6.1 high** per responsabile e subagenti; Astra solo in extremis dopo approvazione esplicita per incarico.

Analisi iniziali effettive: due specialisti Astra high in sola lettura per dati/concorrenza e protocollo/adapter, conclusi prima della nuova istruzione del proprietario. Revisione fresca finale Sol 6.1 high. Nessun Astra avviato dopo la nuova istruzione, nessuna impostazione globale cambiata. Un responsabile ha scritto i documenti; nessun agente ha controllato il browser.

| Verifica di questa sessione | Evidenza e limite |
|---|---|
| Stato reale | git status iniziale pulito, cronologia `199215c` dopo release `02cb884`; PERIODS-01 effettivamente chiuso, non dedotto da una build. |
| Produzione read-only | Sites get_site: stesso project_id del manifest, active/owner/public, latest_version_number 29, live ipagell.website; list_custom_domains: canonico/www status e TLS active. Nessun env secret o contenuto DB letto, nessuna configurazione mutata. |
| Contratto corrente | Letti db/schema, 0000–0006, auth register/login/recover/security/account, server auth/password/http/db/class-repository, AccountIdentity, account-storage/diary-session e callback security nel workspace. Password/recovery NOT NULL e username obbligatorio confermati; diario senza FK e ownership classi verificati. |
| Architettura consegnata | Credenziali separate, handle compatibile, backfill iniziale non autorevole, versione adapter compatibile, fencing DB e cutover senza DROP parent; linking/ultimo metodo/CAS/reauth/browser epoch e cookie tardivo, email/scanner/pre-hijacking, Apple ponte POST/revoca/relay, gate e matrice test. |
| Fonti primarie | Documentazione Google/Apple, discovery e librerie mantenute, SQLite/D1 e OWASP; link accanto alle decisioni nell’audit. Compatibilità documentata Workers non equivale a prova build/provider Sites. |
| Review fresca Sol high | Due P1 corretti: nessuna assunzione Google prompt=login/max_age; auth_time recente verificato e gate reale. Login concorrenti serializzati da epoch browser anche per legacy/logout; cookie tardivo non ripristina sessione valida. Allineati PLAN/prompt 05 a contrazione esplicita e rollback W8-A. Reviewer approva chiusura architetturale con queste precisazioni. |
| Esperimento SQLite | Specialista: SQLite 3.53.4 in memoria con 7 SQL storici, account/sessione/classe/membership sintetici; sostituzione colonne nullable ADD/copy/DROP/rename preserva record/trigger e FK check vuoto. Prova di fattibilità, non esecuzione della migrazione a credenziali separate. Nessun file/DB produzione modificato. |
| Esperimento D1 | Prime due invocazioni Miniflare fermate dalla nuova API options v5 prima DB; adattamento tramite convertV4MiniflareOptions accettato, ma `listen EPERM 127.0.0.1` ferma runtime prima getD1Database/SQL. **D1 non eseguita**, nessuna certificazione di backfill/DROP COLUMN. Nessuna escalation, nessun blocco esterno attribuito all’utente. |
| Verifiche repository | `npm run check` passato: lint, TypeScript, **114 test**, **770 chiavi** it/de/fr/en, inventario **27 route/15 tabelle/7 migrazioni** e link. Dopo i registri finali `npm run docs:check` ripetuto: **47 documenti, 322 link locali**; `git diff --check` passato. Test esistenti non verificano provider non implementati; nessun test specchio dei documenti aggiunto. |
| Browser/build/deploy | Non eseguiti: nessuna UI o runtime cambiato. Nessuna prova OAuth reale, SameSite Safari/PWA, email sender/relay, migrazione Sites/restore o nuovo deployment. |

Gap codice registrati per W8: delete inviti non subordinato alla versione ri-autenticata e pulizia diario/puntatore non eseguita dal percorso security; nessuna correzione applicativa in questo ciclo. Apple reauth fresca, refresh token cifrato/outbox e runner sono gate W9, non capacità correnti.

Configurazioni Google, sender email/supporto e prerequisiti Apple **non confermati**, non inventati né richiesti come segreti in chat. Non occorrono per chiudere W7. Prima del rollout W8 chiedere soltanto client ID/configurazione Google, servizio/sender/supporto email e conferma inserimento secrets nel vault; Apple a parte. Restore/migrazioni D1 e callback Sites vanno provati in ambiente isolato prima di renderli disponibili.

Prossimo ciclo raccomandato: **W8-A / prompt 05**, compatibilità credenziali/guardie e correzioni security/cleanup, risultato locale verificabile prima della contrazione e dei provider. W8/W9 restano pianificati con gate; se un sottociclo non può proseguire, registrare il blocco e riprendere W2/06 A secondo il workflow. Nessun ciclo successivo avviato. Commit documentale ricercabile con `git log --grep='document identity architecture'`; nessun nuovo deployment.

Salvataggio documentale su ramo dedicato `codex/identity-architecture-20261001`; commit di questa decisione identificabile con il subject `docs: document identity architecture and prefer Sol high`. Nessun push/PR/CI remota o deploy in questa sessione; i controlli riportati sono locali.


## W8-A — 17 ottobre 2026, ambiente locale isolato

[Rapporto, fonti e gate](AUTH-COMPATIBILITY-W8A.md). Espansione 0007, adattatore legacy/credentials e correzioni security: `npm run check` con 135 test, 8 test D1 dedicati (contenitore incluso), 146 controlli API e build/precache passati. Migrazioni Wrangler applicate soltanto al nuovo D1 locale sintetico in /private/tmp. Browser build finale: login/Home/moduli sicurezza/logout in italiano, scuro, 591×853; account ripulito. Revisione separata Sol high senza blocchi individuati. Nessuna prova provider/cutover operativo/restore o sui device fisici, nessun accesso ai DB remoti o deploy. La rimozione delle colonne nella fixture D1 verifica l’adattatore e non consegna una 0008 di rollout. Checkout preesistente preservato; l’esito W7 «pulito / Sites 29» resta storico.
