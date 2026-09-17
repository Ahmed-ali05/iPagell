import type { Metadata, Viewport } from "next";
import "./globals-new.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://ipagell.website"),
  title: {
    default: "iPagell — Diario scolastico digitale per studenti",
    template: "%s | iPagell",
  },
  description:
    "Organizza voti, medie, compiti, assenze e classi in un diario scolastico digitale, privato e disponibile anche offline.",
  manifest: "/manifest.webmanifest",
  applicationName: "iPagell",
  creator: "iPagell",
  category: "education",
  openGraph: {
    type: "website",
    locale: "it_IT",
    url: "/",
    siteName: "iPagell",
    title: "iPagell — Il tuo diario scolastico",
    description:
      "Voti, medie, agenda, assenze e classi in un unico diario scolastico digitale.",
    images: [{
      url: "/og.png",
      width: 1733,
      height: 907,
      type: "image/png",
      alt: "iPagell — Il tuo diario scolastico. Voti, agenda e classi, con un diario viola e simboli di calendario, statistiche e collaborazione.",
    }],
  },
  twitter: {
    card: "summary_large_image",
    title: "iPagell — Il tuo diario scolastico",
    description:
      "Voti, medie, agenda, assenze e classi in un unico diario scolastico digitale.",
    images: [{ url: "/og.png", alt: "iPagell — Il tuo diario scolastico. Voti, agenda e classi." }],
  },
  formatDetection: { email: false, address: false, telephone: false },
  appleWebApp: { capable: true, statusBarStyle: "default", title: "iPagell" },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/icons/apple-touch-icon-180.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f6fb" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0d14" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it" suppressHydrationWarning>
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <link rel="apple-touch-startup-image" href="/splash/iphone-750x1334.png" media="(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)" />
        <link rel="apple-touch-startup-image" href="/splash/iphone-828x1792.png" media="(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2)" />
        <link rel="apple-touch-startup-image" href="/splash/iphone-1170x2532.png" media="(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3)" />
        <link rel="apple-touch-startup-image" href="/splash/iphone-1179x2556.png" media="(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3)" />
        <link rel="apple-touch-startup-image" href="/splash/iphone-1206x2622.png" media="(device-width: 402px) and (device-height: 874px) and (-webkit-device-pixel-ratio: 3)" />
        <link rel="apple-touch-startup-image" href="/splash/iphone-1284x2778.png" media="(device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3)" />
        <link rel="apple-touch-startup-image" href="/splash/iphone-1290x2796.png" media="(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3)" />
      </head>
      <body>{children}</body>
    </html>
  );
}
