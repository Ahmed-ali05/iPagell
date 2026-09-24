export function localizedManifest(template, messages, locale, intlLocale) {
  return {
    ...template,
    related_applications: [{
      platform: "webapp",
      url: `/manifest-${locale}.webmanifest`,
      id: "https://ipagell.website/",
    }],
    name: `iPagell — ${messages["landing.title"]}`,
    description: messages["landing.lead"],
    lang: intlLocale,
    start_url: `/app?source=pwa&uiLocale=${locale}`,
    shortcuts: [
      { name: messages["grades.add"], short_name: messages["nav.grades"], url: `/app?action=grade&uiLocale=${locale}`, icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: messages["nav.agenda"], short_name: messages["nav.agenda"], url: `/app?view=agenda&uiLocale=${locale}`, icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: messages["classes.title"], short_name: messages["nav.classes"], url: `/app?view=classes&uiLocale=${locale}`, icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
    ],
  };
}
