import { Suspense } from "react";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import ExploreClient from "@/components/explore/ExploreClient";
import AdBanner from "@/components/AdBanner";

export const metadata: Metadata = {
  title: "Explore",
  description:
    "Browse restaurants, bars, live music, food trucks, cafés, and snoball stands across New Orleans on an interactive map.",
};

export default async function ExplorePage() {
  const supabase = await createClient();
  const { data: locations } = await supabase
    .from("locations")
    .select("id, name, description, category, neighborhood, address, latitude, longitude, tags")
    .eq("site", "foodinnola")
    .eq("is_published", true);

  return (
    <div className="flex flex-1 flex-col">
      <Suspense>
        <ExploreClient locations={locations ?? []} />
      </Suspense>
      <AdBanner />
    </div>
  );
}
