import type { Metadata } from "next";
import { PublicFooter, PublicHeader } from "@/components/public-header";
import styles from "@/app/public-space.module.css";
import legal from "./legale.module.css";

/*
 * Testi per gli utenti tratti dalle bozze in docs/legal (informativa, regole d'uso,
 * cookie/archivi). Le note interne delle bozze non vanno pubblicate qui.
 * Se cambia un comportamento descritto, aggiornare insieme bozze e pagina.
 */
const updated = "25 novembre 2026";
const contact = "ipagell.service@gmail.com";

export const metadata: Metadata = {
  title: "Privacy e regole d’uso",
  description: "Informativa sulla protezione dei dati, regole d’uso, cookie e archivi del browser di iPagell.",
  alternates: { canonical: "/legale" },
};

function Mail() {
  return <a href={`mailto:${contact}`}>{contact}</a>;
}

export default function LegalPage() {
  return <div className={styles.page}><PublicHeader current="legal" /><main className={styles.main}>
    <article className={legal.document} lang="it">
      <h1>Privacy e regole d’uso</h1>
      <p className={legal.meta}>Ultimo aggiornamento: {updated}. Testo disponibile in italiano.</p>
      <ul className={legal.toc}>
        <li><a href="#privacy">Privacy</a></li>
        <li><a href="#regole">Regole d’uso</a></li>
        <li><a href="#cookie">Cookie e archivi</a></li>
      </ul>

      <h2 id="privacy">Informativa sulla protezione dei dati</h2>

      <h3>Responsabile e contatto</h3>
      <p>Il responsabile del trattamento è <strong>Ahmed Ali, residente nel Canton Ticino, Svizzera</strong>. Per domande, accesso ai dati, correzioni, cancellazioni e segnalazioni scrivi a <Mail />. Non inviare password o codice di recupero.</p>

      <h3>Dati e finalità</h3>
      <p>iPagell tratta i dati necessari alle funzioni che utilizzi:</p>
      <ul>
        <li><strong>Account e sicurezza:</strong> nome utente, identificativo, data di creazione, password protetta tramite hash, digest del codice di recupero e sessioni, per accesso e recupero. Se accedi con Google, iPagell riceve e conserva solo l’identificativo univoco del tuo account Google, per riconoscerti al rientro: non email, nome o foto, e nessuna password iPagell. Il controllo dei tentativi di accesso usa l’indirizzo IP; i contatori conservano solo chiavi hash. Per ogni sessione conserviamo quando è iniziata, l’ultima attività (con precisione di circa 15 minuti), il metodo d’accesso e il tipo di browser e sistema, per mostrarti i dispositivi connessi. Alla sessione non associamo l’indirizzo IP; questi dati vengono eliminati insieme alla sessione.</li>
        <li><strong>Diario e appunti:</strong> nome del diario, eventuali scuola e docenti, materie, voti, pesi, periodi, attività, assenze, testi e preferenze, per organizzarli e sincronizzarli con l’account.</li>
        <li><strong>Classi:</strong> nome e descrizione, nome visualizzato, ruoli, membri, inviti, attività e appunti condivisi, per il funzionamento dello spazio comune.</li>
        <li><strong>Registri tecnici:</strong> iPagell non registra un log per ogni visita. In caso di errore imprevisto del server viene annotato solo il tipo di errore, per correggerlo; questi registri restano 3 giorni. L’infrastruttura Cloudflare tratta i dati tecnici delle connessioni (come l’indirizzo IP) per consegnare il sito e proteggerlo da abusi.</li>
        <li><strong>Assistenza:</strong> mittente, messaggi e allegati che invii, per gestire la richiesta.</li>
      </ul>
      <p>Per l’account servono nome utente e password, oppure un account Google. Puoi usare uno pseudonimo e lasciare vuote le informazioni facoltative. Inserisci solo dati utili allo studio: <strong>non scrivere diagnosi, certificati o dati sanitari</strong> nelle note delle assenze, né informazioni riservate su altre persone.</p>

      <h3>Strumenti senza account e copie nel browser</h3>
      <p>Il calcolatore pubblico elabora i voti nel browser e li conserva solo durante la sessione della scheda. Gli appunti senza account salvano una bozza nel browser, separata dall’account e non sincronizzata. Le copie locali dell’account (diario, appunti, preferenze) non sono cifrate con la password: su un dispositivo condiviso esci dall’account al termine. I file JSON, PDF e Markdown che esporti restano sotto il tuo controllo.</p>

      <h3>Condivisioni, notifiche e assistenti</h3>
      <p>Voti, assenze e appunti personali non vengono condivisi automaticamente. In una classe i membri vedono nomi visualizzati, ruoli e contenuti condivisi; gli appunti richiedono una conferma prima della pubblicazione. Copie ed esportazioni fatte da altri possono restare dopo il ritiro dell’originale. Puoi scriverci anche per dati su di te inseriti da altre persone.</p>
      <p>Le notifiche, se le autorizzi, mostrano titoli di attività sul dispositivo e funzionano con l’app aperta; puoi revocarle dalle impostazioni del browser. Nei browser compatibili un assistente può leggere media, attività aperte e ore di assenza, oppure registrare un voto: la comunicazione a quell’assistente dipende dall’ambiente che usi e dai permessi che gli concedi.</p>

      <h3>Fornitori e trattamento all’estero</h3>
      <p>Sito, database e registri tecnici sono gestiti tramite <strong>Cloudflare, Inc.</strong> (Stati Uniti), che tratta i dati per conto del gestore secondo il <a href="https://www.cloudflare.com/cloudflare-customer-dpa/" rel="noopener noreferrer">contratto sul trattamento dei dati</a>. Il database con account, diari, appunti e classi è conservato nell’<strong>Unione europea</strong>. Le richieste sono elaborate dal centro dati Cloudflare più vicino a chi visita il sito, che può trovarsi fuori dalla Svizzera e dall’UE; i registri tecnici possono essere conservati nei centri dati Cloudflare nel mondo, compresi gli Stati Uniti.</p>
      <p>Per i trasferimenti negli Stati Uniti Cloudflare dichiara l’adesione allo Swiss-U.S. Data Privacy Framework; il contratto prevede in alternativa clausole contrattuali standard adattate al diritto svizzero. I fornitori di Cloudflare sono indicati nella <a href="https://www.cloudflare.com/gdpr/subprocessors/cloudflare-services/" rel="noopener noreferrer">lista dei subresponsabili</a>. Per alcuni dati di rete e di sicurezza Cloudflare agisce come titolare autonomo secondo la propria <a href="https://www.cloudflare.com/privacypolicy/" rel="noopener noreferrer">informativa</a>. Le email al contatto passano da Gmail (Google), secondo le <a href="https://policies.google.com/privacy?hl=it" rel="noopener noreferrer">norme Google</a>. Se scegli «Continua con Google», l’accesso avviene presso Google, che lo tratta come titolare autonomo secondo le stesse norme; iPagell non riceve la tua password Google.</p>

      <h3>Conservazione e cancellazione</h3>
      <p>Account e contenuti sono conservati finché li modifichi o li cancelli. Le sessioni valgono 14 giorni e puoi chiuderle in qualsiasi momento da Impostazioni → Dispositivi connessi; ogni account ne mantiene al massimo 20. Alcuni dati tecnici e metadati di cancellazione restano per sicurezza e sincronizzazione. Non è prevista una cancellazione automatica per inattività.</p>
      <p>Puoi eliminare l’account dalle impostazioni, confermando l’accesso (con la password oppure, per gli account Google, con «Conferma con Google» nelle impostazioni); se possiedi una classe, prima trasferiscila o eliminala, oppure scrivici. Dopo la cancellazione i dati possono restare nella cronologia di ripristino del database per 7 giorni e nei registri tecnici per 3 giorni, poi vengono rimossi. La cancellazione non elimina a distanza i file che hai scaricato o le copie su altri dispositivi.</p>

      <h3>Diritti</h3>
      <p>Puoi chiedere informazioni e accesso ai tuoi dati, correzione, cancellazione e gli altri diritti previsti nel tuo caso, compresa la consegna dei dati in un formato elettronico quando applicabile. Rispondiamo in linea di principio entro 30 giorni e gratuitamente; per proteggere il tuo account possiamo chiederti una verifica proporzionata, mai la password. Puoi anche rivolgerti all’<a href="https://www.edoeb.admin.ch/it" rel="noopener noreferrer">Incaricato federale della protezione dei dati (IFPDT)</a> o, se risiedi nell’Unione europea, all’autorità di controllo del tuo Paese.</p>

      <h3>Età</h3>
      <p>iPagell si rivolge a studenti dai <strong>14 anni</strong>. Prima di questa età serve l’autorizzazione di un genitore o di chi ha la responsabilità genitoriale: la registrazione chiede di confermarlo. Se qualcosa non è chiaro, chiedi aiuto a un adulto prima di condividere dati.</p>

      <h2 id="regole">Regole d’uso</h2>

      <h3>Servizio</h3>
      <p>iPagell aiuta a organizzare voti, attività, assenze e appunti. È gratuito e non è affiliato a scuole. I calcoli dipendono dai dati e dalle impostazioni inseriti: verifica risultati e scadenze con le comunicazioni ufficiali della scuola. Il servizio non sostituisce il registro scolastico.</p>

      <h3>Account</h3>
      <p>Puoi usare un nome utente diverso dal tuo nome reale. Proteggi password e codice di recupero e non usare account altrui. Il recupero avviene con il codice dedicato, senza email: se perdi password e codice, l’assistenza non può garantire di ripristinare l’accesso. Gli account creati con Google non hanno password né codice: l’accesso dipende dal tuo account Google, e senza di esso l’assistenza non può assegnarti l’account in base a nome o email.</p>

      <h3>Classi e contenuti</h3>
      <p>Distribuisci gli inviti solo alle persone che vuoi ammettere e controlla gli appunti prima di pubblicarli. Un ruolo nella classe non dà accesso al diario privato degli altri. Condividi materiali tuoi o che hai il diritto di usare, rispettando licenze e attribuzioni. Sono vietati molestie, minacce, impersonificazione, pubblicazione di dati altrui senza motivo e accessi non autorizzati.</p>
      <p>Conservi i diritti sui tuoi contenuti. Autorizzi il gestore e i fornitori tecnici solo alle operazioni necessarie per salvarli, sincronizzarli, mostrarli, esportarli e condividerli con i destinatari che scegli. Gli altri utenti non ricevono il permesso di ripubblicarli altrove.</p>

      <h3>Segnalazioni</h3>
      <p>Per segnalare un contenuto scrivi a <Mail /> indicando il riferimento e il problema, anche senza account. Ogni segnalazione viene esaminata; non comporta una rimozione automatica e puoi chiedere il riesame di un intervento.</p>

      <h3>Salvataggi e modifiche</h3>
      <p>Controlla gli avvisi di sincronizzazione e conserva copie dei contenuti importanti: possono verificarsi errori e interruzioni. Le modifiche sostanziali a queste regole vengono comunicate nell’app prima di applicarsi. Restano ferme le responsabilità e i diritti che la legge non permette di escludere.</p>

      <h2 id="cookie">Cookie e archivi del browser</h2>
      <p>iPagell usa il cookie <code>__Host-ipagell-session</code>, valido 14 giorni, per riconoscere l’account dopo l’accesso. Contiene un identificativo di sessione, non il diario, ed è protetto (HttpOnly, Secure, SameSite=Lax).</p>
      <p>Se usi «Continua con Google», il cookie <code>__Host-ipagell-oauth-browser</code>, valido 30 giorni, lega il ritorno da Google allo stesso browser e impedisce che un accesso avviato altrove venga completato qui. Contiene solo un valore casuale, con le stesse protezioni.</p>
      <p>Il browser conserva lingua, preferenze, copie offline del diario e degli appunti, bozze e marcatori per non ripetere promemoria e proposte di installazione. Servono al funzionamento delle funzioni che usi. Alcuni archivi non hanno una scadenza automatica e restano finché esci dall’account, li sostituisci o cancelli i dati del sito.</p>
      <p>iPagell non usa pubblicità, analytics commerciali o cookie di terze parti. Cloudflare non aggiunge cookie; produce statistiche aggregate sul traffico. Il sito chiede inoltre al browser di segnalare a Cloudflare eventuali errori di connessione (Network Error Logging), che secondo Cloudflare non conservano l’indirizzo IP.</p>
      <p>Puoi bloccare o cancellare cookie e dati del sito dalle impostazioni del browser: potresti uscire dall’account o perdere bozze non sincronizzate, quindi esporta prima ciò che vuoi conservare.</p>
    </article>
  </main><PublicFooter /></div>;
}
