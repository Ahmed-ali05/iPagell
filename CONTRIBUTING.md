# Lavorare su iPagell

[Indice](README.md) · [Roadmap e checklist](docs/PRODOTTO.md)

Grazie per l'interesse nel progetto. Issue e pull request mirate sono benvenute; prima di iniziare un cambiamento ampio, aprire una discussione descrivendo problema, obiettivo e perimetro.

## Prima di cambiare il codice

Leggere architettura, sicurezza e il percorso utente interessato. Descrivere problema, destinatario, comportamento atteso e ciò che resta fuori scope. Usare account/dati sintetici; non inserire diari reali nel repository. Conservare le licenze dei componenti vendorizzati.

## Criterio di completamento

1. Aggiungere un test riproducibile per bug di calcolo, validazione, proprietà o sincronizzazione.
2. Implementare il minimo cambiamento coerente, preservando modifiche altrui e ID/riferimenti dati.
3. Verificare stati vuoti, caricamento, errore e successo, non solo il percorso ideale.
4. Eseguire i controlli indicati in [Manutenzione](docs/MANUTENZIONE.md), proporzionati al cambiamento; per documentazione eseguire almeno `npm run docs:check` e `git diff --check`.
5. Aggiornare i documenti collegati e la sezione Non rilasciato del changelog. Separare verificato, previsto e non verificato.
6. Per cambi persistenti, includere migrazione, compatibilità dei vecchi dati e piano di recupero. Nessuna cancellazione implicita.

Non promettere un miglioramento di sicurezza solo perché una dipendenza è aggiornata. Non modificare manualmente asset compilati o migrazioni già pubblicate. Per modifiche solo documentali non serve ripubblicare il runtime del sito.

## Scheda problema

```text
Titolo:
Ambiente e versione:
Obiettivo dell’utente:
Passaggi (con dati sintetici):
Atteso / osservato:
Stato rete e sincronizzazione:
Impatto e recuperabilità:
Prova allegata, privata dei dati personali:
```

Per vulnerabilità usare il percorso riservato in [SECURITY](SECURITY.md), non una segnalazione pubblica con credenziali.
