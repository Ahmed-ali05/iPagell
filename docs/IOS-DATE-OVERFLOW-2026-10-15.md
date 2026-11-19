# Campi data e scorrimento orizzontale su iOS — 15 ottobre 2026

[Architettura](ARCHITECTURE-CURRENT.md) · [Verifiche](VERIFICATION-MATRIX.md) · [Pubblicazione](DEPLOYMENT.md)

## Evidenza e causa

Screenshot dell'utente: nel nuovo voto il campo Data supera il margine destro degli altri campi; il pannello mostra una barra orizzontale. Il codice usava un input nativo con `width:100%` e padding orizzontale, dentro colonne Grid con minimo automatico.

Il comportamento è compatibile con il [bug WebKit 301648](https://bugs.webkit.org/show_bug.cgi?id=301648): su iOS, i controlli data/ora con larghezza percentuale e padding possono risultare più larghi degli altri input; il rapporto distingue questo caso dal rendering macOS. La compatibilità con il bug è una diagnosi basata sul codice e sulla schermata; non una riproduzione su dispositivo fisico.

## Correzione

`components/ui/native-date-input.tsx` mantiene input nativi `date`/`datetime-local`, label, attributi di validazione e valori del form. Bordo e padding appartengono a un contenitore esterno; l'input al 100% ha padding e bordo nulli, larghezza minima zero e appearance esplicita. Il valore interno WebKit conserva un'altezza anche quando vuoto, per il caso descritto nel [bug 198959](https://bugs.webkit.org/show_bug.cgi?id=198959).

Il controllo è riusato negli otto campi data/ora di Voti, Agenda, Assenze, Semestri, configurazione iniziale e attività di classe. `app/globals-new.css` consente alle colonne dei moduli e ai loro elementi di restringersi con `minmax(0,1fr)` e `min-width:0`. La correzione riguarda la geometria dei contenuti; il pannello conserva lo scorrimento verticale e non maschera la larghezza del controllo con un taglio orizzontale.

Sorgente di partenza: Sites 38, `2a946daea00a3b069a25809c52af3abc0875a061`, in una copia Sites isolata. Nessuna nuova dipendenza, migrazione, modifica ai payload o accesso ai dati reali.

## Verifica e limiti

- `npm run release:prepare`: lint, TypeScript, 128 test, 768 chiavi i18n, inventario e documentazione, build e precache superati. Restano gli avvisi preesistenti Vinext/chunk.
- Prove browser sulla build compilata e su account sintetico locale: larghezza dei campi rispetto al pannello, cambi data e invio del voto; moduli con data/ora e data vuota. Risultati: 320 px de → pannello 300/300 px e campo 256 px; 390 px fr → 370/370 e campo 326; 402 px it → 382/382 e campo 338; 1440 px en → 618/618 e campo 275,5. Le coppie sono clientWidth/scrollWidth del pannello: nessuna larghezza eccedente nei casi misurati. Campo vuoto alto 46 px e validazione required attiva; voto sintetico 5,5 salvato con data 14 ottobre 2026. Agenda e nuovo semestre senza overflow, data finale vuota alta 46 px.
- Il browser disponibile non riproduce il controllo nativo dell'iPhone. Lo screenshot dell'utente e il bug WebKit sono l'evidenza del difetto su iOS; il dispositivo reale resta necessario per confermare l'effetto del fix e il selettore data nativo su quella versione del sistema.

La pubblicazione segue il progetto Sites, il database, l'accesso e i domini esistenti; l'esito è registrato in [Pubblicazione](DEPLOYMENT.md).

Pubblicata come Sites **39**, sorgente `a8cf046fe2cbe804cebdb80957e1ffa2c88893f1`, deployment `appgdep_6ad08724fce481919307c0600ae82d82` **succeeded**. URL canonico https://ipagell.website confermato live/pubblico; `/app` HTTP 200 con il nuovo CSS.
