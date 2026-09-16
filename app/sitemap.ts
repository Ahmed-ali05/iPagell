import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://ipagell.website/",
      lastModified: new Date("2026-09-16"),
      changeFrequency: "monthly",
      priority: 1,
    },
  ];
}
