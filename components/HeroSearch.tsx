"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function HeroSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  function handleSearch(event: FormEvent) {
    event.preventDefault();
    const trimmed = query.trim();
    router.push(trimmed ? `/explore?q=${encodeURIComponent(trimmed)}` : "/explore");
  }

  function handleFindNearMe() {
    if (!("geolocation" in navigator)) {
      setLocationError("Your browser doesn't support location.");
      return;
    }
    setLocating(true);
    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        router.push(`/explore?lat=${latitude}&lng=${longitude}`);
      },
      () => {
        setLocating(false);
        setLocationError("Couldn't get your location — check your browser's location permissions.");
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  return (
    <div className="flex w-full max-w-xl flex-col items-center gap-4">
      <button
        type="button"
        onClick={handleFindNearMe}
        disabled={locating}
        className="rounded-full bg-gold-bright px-8 py-3 font-semibold text-purple-deep shadow-lg transition hover:brightness-105 disabled:opacity-60"
      >
        {locating ? "Finding you…" : "📍 Find Something Near Me"}
      </button>
      {locationError && <p className="text-sm text-gold-light">{locationError}</p>}
      <form onSubmit={handleSearch} className="flex w-full gap-2">
        <input
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search restaurants, bars, live music…"
          className="flex-1 rounded-full border-0 px-5 py-3 text-purple-deep placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-gold-bright"
        />
        <button
          type="submit"
          className="rounded-full bg-purple-mid px-6 py-3 font-semibold text-white transition hover:bg-purple"
        >
          Search
        </button>
      </form>
    </div>
  );
}
