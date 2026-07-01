import Link from "next/link";
import { getCategory, getNeighborhood } from "@/lib/constants";

type LocationSummary = {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  neighborhood: string | null;
};

export default function LocationCard({ location }: { location: LocationSummary }) {
  const category = getCategory(location.category);
  const neighborhood = getNeighborhood(location.neighborhood);

  return (
    <Link
      href={`/locations/${location.id}`}
      className="block rounded-2xl border border-purple-soft/40 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-purple-mid hover:shadow-md"
    >
      <span className="text-3xl">{category?.emoji ?? "📍"}</span>
      <h3 className="mt-3 font-heading text-xl font-bold text-text">{location.name}</h3>
      <p className="mt-1 text-sm text-muted">
        {category?.label ?? "Uncategorized"}
        {neighborhood ? ` · ${neighborhood.label}` : ""}
      </p>
      {location.description && (
        <p className="mt-2 line-clamp-2 text-sm text-text/80">{location.description}</p>
      )}
    </Link>
  );
}
