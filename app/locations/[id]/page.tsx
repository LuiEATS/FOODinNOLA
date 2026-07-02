import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPlaceReviews } from "@/lib/googlePlaces";
import { getCategory, getNeighborhood } from "@/lib/constants";
import PhotoGallery from "@/components/locations/PhotoGallery";
import GoogleReviewsSection from "@/components/locations/GoogleReviewsSection";
import CommunityComments from "@/components/locations/CommunityComments";
import SuggestEditButton from "@/components/locations/SuggestEditButton";
import MapView from "@/components/explore/MapView";
import AdBanner from "@/components/AdBanner";

export default async function LocationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: location } = await supabase
    .from("locations")
    .select(
      "id, name, description, address, city, state, zip, latitude, longitude, phone, website, hours, payment_info, tags, category, neighborhood, google_place_id",
    )
    .eq("id", id)
    .eq("site", "foodinnola")
    .eq("is_published", true)
    .single();

  if (!location) notFound();

  const [{ data: photos }, { data: commentRows }, { data: userData }] = await Promise.all([
    supabase
      .from("location_photos")
      .select("id, photo_url, is_primary")
      .eq("location_id", id),
    supabase
      .from("comments")
      .select("id, body, photo_url, created_at, user_id, profiles(display_name, avatar_color)")
      .eq("location_id", id)
      .order("created_at", { ascending: false }),
    supabase.auth.getUser(),
  ]);

  const comments = (commentRows ?? []).map((comment) => {
    // Supabase's untyped client infers embedded to-one relations as arrays;
    // Postgrest actually returns a single object at runtime for this FK.
    const profile = Array.isArray(comment.profiles) ? comment.profiles[0] : comment.profiles;
    return {
      id: comment.id,
      body: comment.body,
      photo_url: comment.photo_url,
      created_at: comment.created_at,
      user_id: comment.user_id,
      display_name: profile?.display_name ?? null,
      avatar_color: profile?.avatar_color ?? null,
    };
  });

  let currentUser = null;
  if (userData.user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name, avatar_color, role")
      .eq("id", userData.user.id)
      .single();
    currentUser = {
      id: userData.user.id,
      display_name: profile?.display_name ?? null,
      avatar_color: profile?.avatar_color ?? null,
      role: profile?.role ?? "user",
    };
  }

  const reviews = location.google_place_id ? await getPlaceReviews(location.google_place_id) : null;
  const category = getCategory(location.category);
  const neighborhood = getNeighborhood(location.neighborhood);

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-10">
      <PhotoGallery locationId={location.id} photos={photos ?? []} currentUserId={currentUser?.id ?? null} />

      <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/explore?category=${category?.slug ?? ""}`}
              className="rounded-full bg-purple-light px-3 py-1 text-xs font-medium text-purple hover:bg-purple-soft"
            >
              {category ? `${category.emoji} ${category.label}` : "Uncategorized"}
            </Link>
            {neighborhood && (
              <Link
                href={`/explore?neighborhood=${neighborhood.slug}`}
                className="rounded-full bg-gold-light px-3 py-1 text-xs font-medium text-gold hover:bg-gold-light/70"
              >
                📍 {neighborhood.label}
              </Link>
            )}
          </div>
          <h1 className="mt-2 font-heading text-4xl font-bold italic text-text">{location.name}</h1>
          {location.description && <p className="mt-3 text-text/80">{location.description}</p>}

          {location.tags && location.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {location.tags.map((tag: string) => (
                <Link
                  key={tag}
                  href={`/explore?tag=${encodeURIComponent(tag)}`}
                  className="rounded-full bg-purple-light px-3 py-1 text-xs font-medium text-purple hover:bg-purple-soft"
                >
                  #{tag}
                </Link>
              ))}
            </div>
          )}

          <GoogleReviewsSection placeId={location.google_place_id} reviews={reviews} />
          <CommunityComments locationId={location.id} initialComments={comments} currentUser={currentUser} />
        </div>

        <aside className="space-y-6">
          {location.latitude != null && location.longitude != null && (
            <div className="h-56 overflow-hidden rounded-2xl">
              <MapView
                locations={[
                  {
                    id: location.id,
                    name: location.name,
                    category: location.category,
                    address: location.address,
                    latitude: location.latitude,
                    longitude: location.longitude,
                  },
                ]}
                center={{ lat: location.latitude, lng: location.longitude }}
                zoom={15}
              />
            </div>
          )}

          <div className="rounded-2xl border border-purple-soft/40 bg-white p-5">
            <h2 className="font-heading text-lg font-bold text-text">Quick Info</h2>
            <dl className="mt-3 space-y-2 text-sm">
              <div>
                <dt className="text-muted">Address</dt>
                <dd className="text-text">
                  {location.address}, {location.city}, {location.state} {location.zip}
                </dd>
              </div>
              {location.phone && (
                <div>
                  <dt className="text-muted">Phone</dt>
                  <dd className="text-text">{location.phone}</dd>
                </div>
              )}
              {location.website && (
                <div>
                  <dt className="text-muted">Website</dt>
                  <dd>
                    <a
                      href={location.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple hover:text-purple-deep"
                    >
                      {location.website}
                    </a>
                  </dd>
                </div>
              )}
              {location.hours && (
                <div>
                  <dt className="text-muted">Hours</dt>
                  <dd className="text-text">{location.hours}</dd>
                </div>
              )}
              {location.payment_info && (
                <div>
                  <dt className="text-muted">Payment</dt>
                  <dd className="text-text">{location.payment_info}</dd>
                </div>
              )}
            </dl>

            {location.latitude != null && location.longitude != null && (
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${location.latitude},${location.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 block w-full rounded-full bg-gold-bright px-4 py-2 text-center text-sm font-semibold text-purple-deep"
              >
                Get Directions
              </a>
            )}
          </div>

          <SuggestEditButton
            locationId={location.id}
            currentUserId={currentUser?.id ?? null}
            currentValues={{
              name: location.name,
              description: location.description,
              address: location.address,
              neighborhood: location.neighborhood,
              phone: location.phone,
              website: location.website,
              hours: location.hours,
              payment_info: location.payment_info,
            }}
          />
        </aside>
      </div>

      <AdBanner />
    </main>
  );
}
