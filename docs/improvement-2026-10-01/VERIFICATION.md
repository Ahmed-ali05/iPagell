# Verifica del ciclo ingresso iPagell

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

## Limiti permanenti di questo ciclo

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
