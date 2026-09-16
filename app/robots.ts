import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/app", "/api/"],
    },
    sitemap: "https://ipagell.website/sitemap.xml",
    host: "https://ipagell.website",
  };
}
