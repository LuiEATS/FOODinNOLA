import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";
import { SITE_URL } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient();
  const { data: locations } = await supabase
    .from("locations")
    .select("id, updated_at")
    .eq("site", "foodinnola")
    .eq("is_published", true);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/explore`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/submit`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
  ];

  const locationRoutes: MetadataRoute.Sitemap = (locations ?? []).map((location) => ({
    url: `${SITE_URL}/locations/${location.id}`,
    lastModified: location.updated_at ? new Date(location.updated_at) : new Date(),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [...staticRoutes, ...locationRoutes];
}
