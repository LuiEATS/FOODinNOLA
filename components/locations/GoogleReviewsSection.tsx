import type { PlaceReviews } from "@/lib/googlePlaces";

function stars(rating: number) {
  const rounded = Math.round(rating);
  return "★".repeat(rounded) + "☆".repeat(5 - rounded);
}

export default function GoogleReviewsSection({
  placeId,
  reviews,
}: {
  placeId: string | null;
  reviews: PlaceReviews | null;
}) {
  if (!placeId) return null;

  if (!reviews) {
    return (
      <section className="mt-10">
        <h2 className="font-heading text-2xl font-bold italic text-text">Google Reviews</h2>
        <p className="mt-2 text-sm text-muted">Reviews aren&apos;t available for this spot right now.</p>
      </section>
    );
  }

  const recentReviews = [...(reviews.reviews ?? [])].sort((a, b) => b.time - a.time).slice(0, 3);

  return (
    <section className="mt-10">
      <h2 className="font-heading text-2xl font-bold italic text-text">Google Reviews</h2>
      {reviews.rating !== undefined && (
        <p className="mt-2 text-gold-bright">
          <span className="text-lg">{stars(reviews.rating)}</span>{" "}
          <span className="text-sm text-muted">
            {reviews.rating.toFixed(1)} ({reviews.user_ratings_total ?? 0} ratings)
          </span>
        </p>
      )}

      <div className="mt-4 space-y-4">
        {recentReviews.map((review, index) => (
          <div key={index} className="rounded-xl border border-purple-soft/40 bg-white p-4">
            <div className="flex items-center justify-between">
              <span className="font-medium text-text">{review.author_name}</span>
              <span className="text-xs text-muted">{review.relative_time_description}</span>
            </div>
            <p className="mt-1 text-gold-bright">{stars(review.rating)}</p>
            <p className="mt-2 text-sm text-text/80">{review.text}</p>
          </div>
        ))}
      </div>

      <a
        href={`https://search.google.com/local/reviews?placeid=${encodeURIComponent(placeId)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 inline-block text-sm font-medium text-purple hover:text-purple-deep"
      >
        See all reviews on Google Maps →
      </a>
    </section>
  );
}
