import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { CATEGORIES, NEIGHBORHOODS } from "@/lib/constants";
import HeroSearch from "@/components/HeroSearch";
import LocationCard from "@/components/LocationCard";
import AdBanner from "@/components/AdBanner";

const NEIGHBORHOOD_COLORS = [
  "bg-purple",
  "bg-gold-bright",
  "bg-green",
  "bg-purple-mid",
  "bg-gold",
  "bg-green-bright",
  "bg-purple-deep",
  "bg-gold-bright",
];

export default async function Home() {
  const supabase = await createClient();

  const [{ data: featured }, { data: recent }, { data: categoryRows }] = await Promise.all([
    supabase
      .from("locations")
      .select("id, name, description, category, neighborhood")
      .eq("site", "foodinnola")
      .eq("is_published", true)
      .order("updated_at", { ascending: false })
      .limit(3),
    supabase
      .from("locations")
      .select("id, name, description, category, neighborhood")
      .eq("site", "foodinnola")
      .eq("is_published", true)
      .order("created_at", { ascending: false })
      .limit(6),
    supabase
      .from("locations")
      .select("category")
      .eq("site", "foodinnola")
      .eq("is_published", true),
  ]);

  const featuredIds = new Set((featured ?? []).map((location) => location.id));
  const recentlyAdded = (recent ?? [])
    .filter((location) => !featuredIds.has(location.id))
    .slice(0, 3);

  const categoryCounts = new Map<string, number>();
  for (const row of categoryRows ?? []) {
    if (!row.category) continue;
    categoryCounts.set(row.category, (categoryCounts.get(row.category) ?? 0) + 1);
  }

  return (
    <main className="flex flex-1 flex-col bg-cream">
      {/* Hero */}
      <section className="relative overflow-hidden bg-purple-deep px-6 py-24 text-cream">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(45deg,rgba(255,253,247,0.07)_0px,rgba(255,253,247,0.07)_1px,transparent_1px,transparent_18px)]"
        />
        <div className="relative mx-auto flex max-w-3xl flex-col items-center gap-6 text-center">
          <p className="font-caveat text-3xl text-gold-light">Your guide to eating &amp; drinking in</p>
          <h1 className="font-heading text-5xl font-bold italic sm:text-6xl">New Orleans</h1>
          <p className="max-w-xl text-lg text-purple-soft">
            Restaurants, bars, live music, food trucks, cafés, and pop-ups — curated by locals, not
            algorithms.
          </p>
          <HeroSearch />
        </div>
      </section>

      {/* Category pill strip */}
      <section className="border-b border-purple-soft/40 bg-cream px-6 py-6">
        <div className="mx-auto flex max-w-5xl flex-wrap justify-center gap-3">
          {CATEGORIES.map((category) => (
            <Link
              key={category.slug}
              href={`/explore?category=${category.slug}`}
              className="rounded-full border border-purple-soft bg-white px-5 py-2 text-sm font-medium text-purple transition hover:border-purple hover:bg-purple-light"
            >
              {category.emoji} {category.label}
            </Link>
          ))}
        </div>
      </section>

      {/* Featured spots */}
      <section className="mx-auto w-full max-w-5xl px-6 py-16">
        <h2 className="font-heading text-3xl font-bold italic text-text">Featured Spots</h2>
        {featured && featured.length > 0 ? (
          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            {featured.map((location) => (
              <LocationCard key={location.id} location={location} />
            ))}
          </div>
        ) : (
          <p className="mt-8 text-muted">No featured spots yet — check back soon.</p>
        )}
      </section>

      {/* Category grid */}
      <section className="bg-purple-light/40 px-6 py-16">
        <div className="mx-auto max-w-5xl">
          <h2 className="font-heading text-3xl font-bold italic text-text">Browse by Category</h2>
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
            {CATEGORIES.map((category) => (
              <Link
                key={category.slug}
                href={`/explore?category=${category.slug}`}
                className="rounded-2xl bg-white p-6 text-center shadow-sm transition hover:shadow-md"
              >
                <div className="text-4xl">{category.emoji}</div>
                <div className="mt-2 font-heading text-lg font-bold text-text">{category.label}</div>
                <div className="text-sm text-muted">
                  {categoryCounts.get(category.slug) ?? 0} spots
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Neighborhood grid */}
      <section className="mx-auto w-full max-w-5xl px-6 py-16">
        <h2 className="font-heading text-3xl font-bold italic text-text">Explore by Neighborhood</h2>
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {NEIGHBORHOODS.map((neighborhood, index) => (
            <Link
              key={neighborhood.slug}
              href={`/explore?neighborhood=${neighborhood.slug}`}
              className={`${NEIGHBORHOOD_COLORS[index % NEIGHBORHOOD_COLORS.length]} rounded-2xl p-6 text-center font-heading font-bold text-cream shadow-sm transition hover:opacity-90`}
            >
              {neighborhood.label}
            </Link>
          ))}
        </div>
      </section>

      {/* Recently added */}
      <section className="bg-cream px-6 py-16">
        <div className="mx-auto max-w-5xl">
          <h2 className="font-heading text-3xl font-bold italic text-text">Recently Added</h2>
          {recentlyAdded.length > 0 ? (
            <div className="mt-8 grid gap-6 sm:grid-cols-3">
              {recentlyAdded.map((location) => (
                <LocationCard key={location.id} location={location} />
              ))}
            </div>
          ) : (
            <p className="mt-8 text-muted">Nothing new yet — be the first to submit a spot!</p>
          )}
        </div>
      </section>

      <AdBanner />
    </main>
  );
}
