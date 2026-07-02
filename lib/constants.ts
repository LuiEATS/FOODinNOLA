export type Category = {
  slug: string;
  label: string;
  emoji: string;
  pinColor: "purple" | "gold" | "green";
};

// Add or edit categories here — every filter, pill, and grid on the site reads from this list.
export const CATEGORIES: Category[] = [
  { slug: "restaurants", label: "Restaurants", emoji: "🍽️", pinColor: "purple" },
  { slug: "bars", label: "Bars", emoji: "🍸", pinColor: "gold" },
  { slug: "live-music", label: "Live Music", emoji: "🎷", pinColor: "gold" },
  { slug: "food-trucks", label: "Food Trucks", emoji: "🚚", pinColor: "green" },
  { slug: "cafes", label: "Cafés", emoji: "☕", pinColor: "green" },
  { slug: "snoballs", label: "Snoballs", emoji: "🍧", pinColor: "green" },
  { slug: "experiences", label: "Experiences", emoji: "✨", pinColor: "purple" },
];

export type Neighborhood = {
  slug: string;
  label: string;
};

// Add more neighborhoods here anytime — no database change needed.
export const NEIGHBORHOODS: Neighborhood[] = [
  { slug: "french-quarter", label: "French Quarter" },
  { slug: "marigny-bywater", label: "Marigny/Bywater" },
  { slug: "uptown", label: "Uptown" },
  { slug: "garden-district", label: "Garden District" },
  { slug: "mid-city", label: "Mid-City" },
  { slug: "cbd-warehouse", label: "CBD/Warehouse District" },
  { slug: "treme", label: "Tremé" },
  { slug: "bayou-st-john", label: "Bayou St. John/Fairgrounds" },
];

export function getCategory(slug: string | null) {
  return CATEGORIES.find((c) => c.slug === slug) ?? null;
}

export function getNeighborhood(slug: string | null) {
  return NEIGHBORHOODS.find((n) => n.slug === slug) ?? null;
}
