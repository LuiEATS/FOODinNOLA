export type PlaceReview = {
  author_name: string;
  rating: number;
  relative_time_description: string;
  text: string;
  time: number;
  profile_photo_url?: string;
};

export type PlaceReviews = {
  name?: string;
  rating?: number;
  user_ratings_total?: number;
  reviews?: PlaceReview[];
};

export async function getPlaceReviews(placeId: string): Promise<PlaceReviews | null> {
  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(placeId)}&fields=name,rating,reviews,user_ratings_total&key=${process.env.GOOGLE_PLACES_API_KEY}`;

  const res = await fetch(url, { next: { revalidate: 86400 } });
  if (!res.ok) return null;

  const data = await res.json();
  if (data.status !== "OK") return null;

  return data.result as PlaceReviews;
}
