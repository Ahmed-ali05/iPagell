/* eslint-disable @next/next/no-html-link-for-pages -- Full-page navigation avoids the Vinext client-router crash between the SEO page and the diary. */
import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  BarChart3,
  BookOpenCheck,
  CalendarCheck2,
  Check,
  CloudOff,
  GraduationCap,
  LockKeyhole,
  UsersRound,
} from "lucide-react";
import { LegacyEntryRedirect } from "@/components/legacy-entry-redirect";
import { identity } from "@/lib/server/auth";
import styles from "./marketing-page.module.css";

export async function generateMetadata(): Promise<Metadata> {
  const hostname = (await headers()).get("host")?.split(":")[0];
  const canonicalHost =
    hostname === "ipagell.website" || hostname === "www.ipagell.website";
  return {
    title: "Diario scolastico digitale per voti, agenda e classi",
    description:
      "Tieni sotto controllo voti, media scolastica, compiti, assenze e attività di classe. iPagell è il diario digitale privato, semplice e offline-first.",
    keywords: [
      "diario scolastico digitale",
      "calcolo media scolastica",
      "registro voti studenti",
      "agenda compiti",
      "gestione assenze",
      "app scuola",
    ],
    alternates: { canonical: "/" },
    openGraph: {
      type: "website",
      locale: "it_IT",
      url: "/",
      siteName: "iPagell",
      title: "iPagell — Il tuo semestre, sotto controllo",
      description:
        "Voti, medie, agenda, assenze e classi in un unico diario scolastico digitale.",
    },
    twitter: {
      card: "summary",
      title: "iPagell — Il tuo semestre, sotto controllo",
      description:
        "Voti, medie, agenda, assenze e classi in un unico diario scolastico digitale.",
    },
    robots: canonicalHost
      ? {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-image-preview": "large",
            "max-snippet": -1,
            "max-video-preview": -1,
          },
        }
      : { index: false, follow: false },
  };
}

const features = [
  {
    icon: GraduationCap,
    title: "Voti e medie, senza fogli sparsi",
    text: "Registra i voti per materia, segui l’andamento e scopri cosa ti serve per raggiungere il tuo obiettivo.",
  },
  {
    icon: CalendarCheck2,
    title: "Un’agenda che unisce tutto",
    text: "Compiti, verifiche ed eventi condivisi arrivano nella stessa vista, mantenendo personali promemoria e stato.",
  },
  {
    icon: UsersRound,
    title: "Classi condivise, spazio privato",
    text: "Collabora sugli eventi della classe senza esporre voti, assenze o organizzazione personale agli altri membri.",
  },
  {
    icon: CloudOff,
    title: "Pronto anche quando la rete non c’è",
    text: "L’ultima copia del diario resta disponibile sul dispositivo e si riallinea con il tuo account al ritorno online.",
  },
] as const;

const faqs = [
  {
    question: "iPagell sostituisce il registro elettronico della scuola?",
    answer:
      "No. iPagell è uno spazio personale per organizzare il semestre e capire meglio il proprio andamento; non sostituisce le comunicazioni ufficiali dell’istituto.",
  },
  {
    question: "Gli altri membri della classe vedono i miei voti?",
    answer:
      "No. La classe condivide solo le attività create per il gruppo. Voti, assenze, preferenze e avanzamento personale restano nel tuo spazio privato.",
  },
  {
    question: "Posso usare iPagell dal telefono?",
    answer:
      "Sì. L’interfaccia è adattiva e può essere installata dalla schermata Home come web app, senza passare da uno store.",
  },
  {
    question: "Cosa succede se perdo la connessione?",
    answer:
      "Puoi continuare a consultare l’ultima copia disponibile sul dispositivo. Le modifiche in attesa vengono sincronizzate quando torni online.",
  },
] as const;

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "SoftwareApplication",
      name: "iPagell",
      url: "https://ipagell.website/",
      applicationCategory: "EducationalApplication",
      applicationSubCategory: "Diario scolastico digitale",
      operatingSystem: "Web",
      inLanguage: "it",
      description:
        "Diario scolastico digitale per gestire voti, medie, agenda, assenze e attività di classe.",
      featureList: [
        "Registro personale dei voti",
        "Calcolo delle medie",
        "Agenda di compiti e verifiche",
        "Gestione delle assenze",
        "Eventi di classe condivisi",
        "Consultazione offline",
      ],
    },
    {
      "@type": "FAQPage",
      mainEntity: faqs.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: { "@type": "Answer", text: item.answer },
      })),
    },
  ],
};

export default async function Home() {
  const requestHeaders = await headers();
  const hostname = requestHeaders.get("host") ?? "ipagell.website";
  const forwardedProtocol = requestHeaders.get("x-forwarded-proto");
  const protocol =
    forwardedProtocol === "http" || forwardedProtocol === "https"
      ? forwardedProtocol
      : hostname.startsWith("localhost") || hostname.startsWith("127.0.0.1")
        ? "http"
        : "https";
  const user = await identity(
    new Request(`${protocol}://${hostname}/`, {
      headers: { cookie: requestHeaders.get("cookie") ?? "" },
    }),
  );
  if (user) redirect("/app");

  return (
    <main className={styles.page}>
      <LegacyEntryRedirect />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <header className={styles.header}>
        <a className={styles.brand} href="/" aria-label="iPagell, pagina iniziale">
          <span className={styles.logo}>iP</span>
          <span>iPagell</span>
        </a>
        <nav className={styles.nav} aria-label="Navigazione principale">
          <a href="#funzioni">Funzioni</a>
          <a href="#privacy">Privacy</a>
          <a href="#domande">Domande</a>
        </nav>
        <a className={styles.headerCta} href="/app">
          Apri il diario <ArrowRight size={16} aria-hidden="true" />
        </a>
      </header>

      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>
            <span /> Diario scolastico digitale
          </p>
          <h1>Il semestre è più semplice quando vedi tutto insieme.</h1>
          <p className={styles.lead}>
            Voti, media, compiti, assenze e attività della classe in uno spazio
            ordinato. Tu decidi cosa resta privato e cosa condividere.
          </p>
          <div className={styles.heroActions}>
            <a className={styles.primaryCta} href="/app">
              Inizia con iPagell <ArrowRight size={18} aria-hidden="true" />
            </a>
            <a className={styles.secondaryCta} href="#come-funziona">
              Scopri come funziona
            </a>
          </div>
          <ul className={styles.trustList} aria-label="Vantaggi principali">
            <li><Check size={15} aria-hidden="true" /> Nessun download obbligatorio</li>
            <li><Check size={15} aria-hidden="true" /> Spazio personale separato</li>
            <li><Check size={15} aria-hidden="true" /> Pensato per mobile e desktop</li>
          </ul>
        </div>

        <div className={styles.productPreview} aria-label="Anteprima della dashboard iPagell">
          <div className={styles.previewTopbar}>
            <span className={styles.previewBrand}>iP</span>
            <span>Il mio semestre</span>
            <span className={styles.previewAvatar}>AA</span>
          </div>
          <div className={styles.previewGrid}>
            <article className={styles.nextCard}>
              <span className={styles.miniLabel}>PROSSIMO IMPEGNO</span>
              <p>Matematica</p>
              <h2>Verifica di funzioni</h2>
              <small>Domani · 09:45</small>
              <span className={styles.dayBadge}><b>1</b> giorno</span>
            </article>
            <article className={styles.averageCard}>
              <span className={styles.miniLabel}>MEDIA GENERALE</span>
              <strong>5.32</strong>
              <span className={styles.trend}>+0.18</span>
              <span className={styles.progress}><i /></span>
            </article>
            <article className={styles.agendaCard}>
              <div>
                <CalendarCheck2 size={19} aria-hidden="true" />
                <b>Questa settimana</b>
              </div>
              <ul>
                <li><span className={styles.purpleDot} /><p><b>Consegna relazione</b><small>Chimica · personale</small></p><time>Mer 18</time></li>
                <li><span className={styles.orangeDot} /><p><b>Ripasso capitolo 4</b><small>Storia · classe 3B</small></p><time>Ven 20</time></li>
              </ul>
            </article>
          </div>
        </div>
      </section>

      <section className={styles.featureSection} id="funzioni">
        <div className={styles.sectionHeading}>
          <p className={styles.eyebrow}>Tutto al posto giusto</p>
          <h2>Un diario che ti aiuta a decidere, non solo a ricordare.</h2>
          <p>iPagell trasforma i dati del semestre in una vista semplice e utile ogni giorno.</p>
        </div>
        <div className={styles.featureGrid}>
          {features.map(({ icon: Icon, title, text }) => (
            <article className={styles.featureCard} key={title}>
              <span className={styles.featureIcon}><Icon size={22} aria-hidden="true" /></span>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.privacySection} id="privacy">
        <div className={styles.privacyVisual} aria-hidden="true">
          <div className={styles.privateCard}>
            <span><LockKeyhole size={17} /> Solo tu</span>
            <b>Voti, assenze e obiettivi</b>
            <small>Il tuo spazio personale</small>
          </div>
          <div className={styles.separator}><span /></div>
          <div className={styles.sharedCard}>
            <span><UsersRound size={17} /> Classe 3B</span>
            <b>Verifiche e consegne</b>
            <small>Solo ciò che serve al gruppo</small>
          </div>
        </div>
        <div className={styles.privacyCopy}>
          <p className={styles.eyebrow}>Una divisione sottile, ma netta</p>
          <h2>Collaborare non significa rinunciare alla privacy.</h2>
          <p>
            Le classi condividono il calendario comune. Il tuo diario conserva
            separatamente voti, assenze, note e avanzamento: gli altri vedono
            l’attività, non come la stai gestendo.
          </p>
          <ul>
            <li><LockKeyhole size={18} aria-hidden="true" /> Dati personali non visibili alla classe</li>
            <li><UsersRound size={18} aria-hidden="true" /> Eventi comuni aggiornati per tutti</li>
            <li><BookOpenCheck size={18} aria-hidden="true" /> Stato e promemoria restano individuali</li>
          </ul>
        </div>
      </section>

      <section className={styles.stepsSection} id="come-funziona">
        <div className={styles.sectionHeading}>
          <p className={styles.eyebrow}>Come funziona</p>
          <h2>Dal primo voto a una visione completa.</h2>
        </div>
        <ol className={styles.steps}>
          <li><span>01</span><div><h3>Crea il tuo semestre</h3><p>Imposta date e materie per costruire uno spazio adatto alla tua scuola.</p></div></li>
          <li><span>02</span><div><h3>Aggiungi ciò che conta</h3><p>Registra voti, compiti e assenze; iPagell aggiorna subito riepiloghi e statistiche.</p></div></li>
          <li><span>03</span><div><h3>Condividi solo il calendario</h3><p>Entra in una classe per ricevere gli eventi comuni senza aprire il tuo diario agli altri.</p></div></li>
        </ol>
      </section>

      <section className={styles.faqSection} id="domande">
        <div className={styles.faqIntro}>
          <p className={styles.eyebrow}>Domande frequenti</p>
          <h2>Le cose importanti, subito chiare.</h2>
          <p>iPagell è uno strumento personale: semplice da iniziare, trasparente nel modo in cui separa gli spazi.</p>
        </div>
        <div className={styles.faqList}>
          {faqs.map((item) => (
            <details key={item.question}>
              <summary>{item.question}<span>+</span></summary>
              <p>{item.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className={styles.finalCta}>
        <div>
          <BarChart3 size={26} aria-hidden="true" />
          <h2>Metti a fuoco il tuo semestre.</h2>
          <p>Apri il diario, aggiungi la prima materia e costruisci una routine più leggera.</p>
        </div>
        <a className={styles.lightCta} href="/app">
          Apri iPagell <ArrowRight size={18} aria-hidden="true" />
        </a>
      </section>

      <footer className={styles.footer}>
        <div className={styles.brand}><span className={styles.logo}>iP</span><span>iPagell</span></div>
        <p>Il diario scolastico personale per vedere il semestre con più chiarezza.</p>
        <a href="/app">Accedi all’app</a>
      </footer>
    </main>
  );
}
