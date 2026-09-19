import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const origin = process.env.NEXT_PUBLIC_APP_URL;
  if (!origin) return [];
  return ["/", "/events"].map((path) => ({
    url: new URL(path, origin).toString(),
  }));
}
