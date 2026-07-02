"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { getCategory, getNeighborhood } from "@/lib/constants";
import MapView from "./MapView";

type ExploreLocation = {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  neighborhood: string | null;
  address: string;
  latitude: number | null;
  longitude: number | null;
  tags: string[] | null;
};

type FilteredLocation = ExploreLocation & { _distance?: number };

const FILTER_PILLS: { key: string; label: string; categorySlug: string | null }[] = [
  { key: "all", label: "All", categorySlug: null },
  { key: "food", label: "Food", categorySlug: "restaurants" },
  { key: "bars", label: "Bars", categorySlug: "bars" },
  { key: "music", label: "Music", categorySlug: "live-music" },
  { key: "trucks", label: "Trucks", categorySlug: "food-trucks" },
  { key: "cafe", label: "Café", categorySlug: "cafes" },
  { key: "snoballs", label: "Snoballs", categorySlug: "snoballs" },
  { key: "experiences", label: "Experiences", categorySlug: "experiences" },
];

function distanceMiles(lat1: number, lng1: number, lat2: number, lng2: number) {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const earthRadiusMiles = 3958.8;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return earthRadiusMiles * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function ExploreClient({ locations }: { locations: ExploreLocation[] }) {
  const searchParams = useSearchParams();

  const initialCategory = searchParams.get("category");
  const initialNeighborhood = searchParams.get("neighborhood");
  const initialQuery = searchParams.get("q") ?? "";
  const tagFilter = searchParams.get("tag");
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");
  const userLocation = lat && lng ? { lat: Number(lat), lng: Number(lng) } : null;

  const initialPill = FILTER_PILLS.find((pill) => pill.categorySlug === initialCategory)?.key ?? "all";

  const [activePill, setActivePill] = useState(initialPill);
  const [neighborhoodFilter, setNeighborhoodFilter] = useState<string | null>(initialNeighborhood);
  const [tag, setTag] = useState<string | null>(tagFilter);
  const [query, setQuery] = useState(initialQuery);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const activeCategorySlug = FILTER_PILLS.find((pill) => pill.key === activePill)?.categorySlug ?? null;

  const filtered = useMemo<FilteredLocation[]>(() => {
    const q = query.trim().toLowerCase();
    let result: FilteredLocation[] = locations.filter((location) => {
      if (activeCategorySlug && location.category !== activeCategorySlug) return false;
      if (neighborhoodFilter && location.neighborhood !== neighborhoodFilter) return false;
      if (tag && !(location.tags ?? []).some((t) => t.toLowerCase() === tag.toLowerCase())) return false;
      if (q) {
        const haystack = [location.name, ...(location.tags ?? [])].join(" ").toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });

    if (userLocation) {
      result = result
        .filter((location) => location.latitude != null && location.longitude != null)
        .map((location) => ({
          ...location,
          _distance: distanceMiles(userLocation.lat, userLocation.lng, location.latitude!, location.longitude!),
        }))
        .sort((a, b) => (a._distance ?? 0) - (b._distance ?? 0));
    }

    return result;
  }, [locations, activeCategorySlug, neighborhoodFilter, tag, query, userLocation]);

  return (
    <div className="flex flex-1 flex-col">
      {userLocation && (
        <div className="bg-gold-light px-6 py-3 text-center text-sm font-medium text-gold">
          📍 {filtered.length} spot{filtered.length === 1 ? "" : "s"} near you
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 border-b border-purple-soft/40 bg-white px-6 py-4">
        {FILTER_PILLS.map((pill) => (
          <button
            key={pill.key}
            type="button"
            onClick={() => setActivePill(pill.key)}
            className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${
              activePill === pill.key
                ? "border-purple bg-purple text-white"
                : "border-purple-soft bg-white text-purple hover:bg-purple-light"
            }`}
          >
            {pill.label}
          </button>
        ))}
        {neighborhoodFilter && (
          <button
            type="button"
            onClick={() => setNeighborhoodFilter(null)}
            className="rounded-full border border-gold bg-gold-light px-4 py-1.5 text-sm font-medium text-gold"
          >
            {getNeighborhood(neighborhoodFilter)?.label ?? neighborhoodFilter} ✕
          </button>
        )}
        {tag && (
          <button
            type="button"
            onClick={() => setTag(null)}
            className="rounded-full border border-gold bg-gold-light px-4 py-1.5 text-sm font-medium text-gold"
          >
            #{tag} ✕
          </button>
        )}
        <input
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by name…"
          className="ml-auto w-full max-w-xs rounded-full border border-purple-soft px-4 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-mid sm:w-64"
        />
      </div>

      <div className="flex h-[75vh]">
        <aside className="w-full max-w-sm overflow-y-auto border-r border-purple-soft/40 bg-white">
          {filtered.length === 0 ? (
            <p className="p-6 text-sm text-muted">No spots match your filters yet.</p>
          ) : (
            <ul>
              {filtered.map((location) => {
                const category = getCategory(location.category);
                return (
                  <li key={location.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(location.id)}
                      className={`flex w-full items-start gap-3 border-b border-purple-soft/20 px-4 py-3 text-left transition hover:bg-purple-light/50 ${
                        selectedId === location.id ? "bg-purple-light" : ""
                      }`}
                    >
                      <span className="text-2xl">{category?.emoji ?? "📍"}</span>
                      <span className="flex-1">
                        <span className="block font-heading font-bold text-text">{location.name}</span>
                        <span className="block text-xs text-muted">
                          {category?.label ?? "Uncategorized"}
                          {location._distance !== undefined && ` · ${location._distance.toFixed(1)} mi`}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </aside>

        <div className="hidden flex-1 sm:block">
          <MapView locations={filtered} selectedId={selectedId} onSelect={setSelectedId} />
        </div>
      </div>
    </div>
  );
}
