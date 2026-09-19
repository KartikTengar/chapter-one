import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const origin = process.env.NEXT_PUBLIC_APP_URL;
  if (!origin) return { rules: { userAgent: "*", disallow: "/" } };
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/_dev", "/admin", "/api", "/dashboard"],
    },
    sitemap: new URL("/sitemap.xml", origin).toString(),
  };
}
