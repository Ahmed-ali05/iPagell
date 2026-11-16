# W8-A — qualifica del canale Sites, 17 ottobre 2026

**Perimetro aggiornato:** questo documento riguarda l’espansione 0007 ora rinviata in `operations/w8a/deferred-expansion/`. Il candidato security corrente non modifica lo schema e non richiede bootstrap. Il blocco amministrativo/restore resta valido per l’espansione; non impedisce di provare separatamente il rilascio senza migrazioni e il rollback del Worker.

**Esito: BLOCCATO — canale amministrativo non disponibile nella superficie verificata.** Ripresa da `cd38d40`, ramo `codex/w8a-release-sites39-20261017`. [Rapporto](../../docs/improvement-2026-10-01/W8A-RELEASE-PREPARATION.md) · [Intervento richiesto](PLATFORM-REQUEST.md).

L’utente autorizza creazione e deploy esclusivamente di un ambiente Sites privato distinto, con DB dedicato e dati sintetici, per HTTPS e recupero. La produzione ipagell.website resta esclusa. Non mancano più il consenso al deploy di prova o una prova locale: manca il prerequisito amministrativo.

## Superficie ufficiale verificata

Inventario dei **25 strumenti Sites esposti**, contratti dei due strumenti DB, riferimenti della skill Sites **1.0.1** e ricerca Plugin Management `Sites SQL backup restore` (limite 10). Sites risulta già installato; nessuna descrizione delle integrazioni restituite offre amministrazione del D1 gestito Sites. Nessuna integrazione installata, suggerita o riconfigurata. L’assenza in questa superficie non dimostra l’inesistenza di capacità riservate agli operatori della piattaforma.

| Capacità | Evidenza ed esito |
|---|---|
| Progetto privato e pubblicazione | Operazioni Sites esposte; la skill documenta nuovi Site privati e provisioning tramite binding logico `d1`. Creazione e deploy **non tentati**, perché il prerequisito seguente manca. Nessun ID di prova o DB dedicato attestato. |
| Migrazioni | `references/storage.md`: solo schema, applicate prima dell’upload Worker; seed/backfill fuori dalle migrazioni. Nessun hook amministrativo coordinato è documentato in quel riferimento. |
| SQL amministrativo / bootstrap | Nessuna operazione esposta. Overview restituisce binding/nomi tabelle; lettura righe non espone SQL arbitrario. Bootstrap gestito **non eseguito**. |
| Backup, export/import, restore | Nessuna operazione esposta per snapshot coerente, journal Sites, import in altro DB vuoto o riconciliazione migrazioni. Tutto **non eseguito**. |
| HTTPS e recupero isolati | **Non provati**. TLS attivo della produzione e vecchi test locali non soddisfano questa prova. Nessun RPO/RTO o retention attestato. |

## Riscontri esterni in sola lettura

Produzione `appgprj_6aa9bf5f9a00819189df944bf2d51850`: attiva, owner, pubblica, URL canonico https://ipagell.website, versione **39**, sorgente `a8cf046fe2cbe804cebdb80957e1ffa2c88893f1`. Deployment `appgdep_6ad08724fce481919307c0600ae82d82` **succeeded**; l’URL di deployment restituito è l’alias storico della stessa pubblicazione. Domini canonico/www, provider e TLS **active**. Overview DB: le **15 tabelle legacy**, nessuna omissione/troncamento. Nessuna riga utente letta. I nomi visibili non certificano colonne, journal o backup.

Le [osservazioni strutturate](evidence/sites-channel-20261017/observations.json) contengono input/metadati selezionati, inventario e limiti; [SHA256SUMS](evidence/sites-channel-20261017/SHA256SUMS) verifica i byte del file. Sono esclusi token, credenziali, cookie, URL firmati, identità personali e dati applicativi. Gli hash dei riferimenti locali identificano la documentazione esaminata. Le risposte complete non sono archiviate.

## Decisione e intervento esterno

Per il vincolo esplicito dell’utente, il gate resta chiuso: nessun progetto creato, source push, versione salvata, deploy, SQL remoto o modifica di produzione; nessuna 0008, cutover, provider, accesso Cloudflare diretto o endpoint SQL temporaneo. Nessuna suite locale ripetuta come surrogato. I soli nuovi controlli locali riguardano integrità degli artefatti e documentazione.

Il responsabile Sites deve fornire un canale ufficiale circoscritto al progetto per SQL parametrizzato, manutenzione coordinata schema → bootstrap → Worker → traffico, snapshot coerente e restore in DB gestito vuoto distinto, inclusa gestione del journal Sites. Deve indicare operatore, ubicazione protetta, retention e criteri RPO/RTO. Solo dopo si esegue il rehearsal sintetico sul progetto privato autorizzato, raccogliendo ID/binding, HTTPS, checkpoint pre/post, confronti e tempi. La [richiesta operativa](PLATFORM-REQUEST.md) è aggiornata e **non inviata**: non è stato aperto alcun ticket né contattato un terzo.
