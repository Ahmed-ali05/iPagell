# Gesti e movimento sul web

Leggi questo riferimento quando la richiesta include un'interazione trascinabile o interrompibile. Non trasformare una normale navigazione o un dialogo in un gesto per applicare la skill.

## Tracciamento e annullamento

- Gestisci un puntatore attivo, ignora pulsanti non pertinenti e conserva l'offset del punto afferrato; l'elemento non deve saltare al centro sotto il dito.
- Prima di iniziare una nuova animazione ferma quella precedente e leggi/conserva posizione e velocità correnti. Mantieni distinta la geometria di layout dalla trasformazione animata.
- Quando il drag viene riconosciuto, usa Pointer Events e pointer capture; definisci `touch-action` coerente con l'asse senza disabilitare globalmente scroll o pinch-to-zoom. Se lo scroll nativo vince, gestisci `pointercancel`.
- Una piccola soglia di movimento può distinguere tap e drag; tarala sul controllo, non fissarla universalmente. Dopo un drag riconosciuto evita un clic accidentale al rilascio.
- Segui il puntatore senza transizioni che inseguano in ritardo. Aggiorna il rendering al ritmo del display e non causare letture/scritture di layout ripetute nel ciclo.
- Mantieni una breve storia di posizione e timestamp per stimare la velocità; elimina campioni vecchi dopo una pausa e gestisci intervalli nulli. Usa unità coerenti, per esempio px/s.
- Ripulisci capture, listener e frame su rilascio, perdita della capture, cancellazione e smontaggio. Definisci un esito prevedibile anche quando il gesto non termina con `pointerup`.

## Molle e trasferimento della velocità

Una molla senza rimbalzo è un buon punto di partenza. Aggiungi overshoot moderato solo se comunica il rilascio di un oggetto fisico e resta entro limiti utili. Risposta, durata percepita, damping ratio e damping fisico non sono parametri intercambiabili.

Controlla l'API e la versione della libreria realmente in uso prima di mappare i parametri. Non assumere che `bounce: 0.2` equivalga a damping ratio `0.8`, o che una `duration` sia il tempo fisico di assestamento. Non aggiungere una dipendenza se CSS o un'implementazione esistente soddisfano il caso concreto.

Trasferisci la velocità al rilascio nelle unità richieste dalla libreria. Solo se l'API richiede una velocità normalizzata usa `v / (target - current)`, con una gestione esplicita della distanza prossima a zero. Per un movimento libero in due dimensioni conserva posizione e velocità di ciascun asse. Un nuovo input deve poter cambiare la destinazione senza un salto visivo.

## Proiezione e limiti

Per uno snap con inerzia, scegli la destinazione fra punti ammessi usando posizione e velocità, poi applica i limiti. Il segno della velocità da solo non basta per decidere chiusura o conferma di un'azione.

Come modello opzionale di decadimento esponenziale, con `v` in px/s e `d` fattore di decadimento per millisecondo:

```text
spostamentoProiettato = (v / 1000) * d / (1 - d)
destinazione = snapAmmesso(posizione + spostamentoProiettato)
```

Richiede `0 < d < 1`; valori vicini a 1 possono produrre distanze molto grandi. Taralo sul caso d'uso, limita la proiezione e non usarlo come replica certificata dello scrolling di sistema. Per lo scorrimento ordinario preferisci quello nativo.

Ai limiti del drag puoi comprimere lo spostamento con resistenza progressiva. Con dimensione positiva e coefficiente positivo, una possibile funzione è:

```text
resistenza(overshoot) = (overshoot * dimensione * coefficiente)
                       / (dimensione + coefficiente * abs(overshoot))
```

Applica la resistenza alla rappresentazione visiva, senza cambiare i dati sottostanti; al rilascio rientra in un punto valido. Con movimento ridotto usa lo stato finale statico. Un gesto di chiusura o navigazione deve rispettare gli stessi controlli di salvataggio e conferma dell'azione esplicita equivalente.
