"use client";

import { useEffect, useRef, useState } from "react";
import { setOptions } from "@googlemaps/js-api-loader";
import { getCategory } from "@/lib/constants";

let mapsOptionsSet = false;

export type MapLocation = {
  id: string;
  name: string;
  category: string | null;
  address: string;
  latitude: number | null;
  longitude: number | null;
};

const PIN_HEX: Record<string, string> = {
  purple: "#7c3aed",
  gold: "#b8860b",
  green: "#16a34a",
};

const NEW_ORLEANS_CENTER = { lat: 29.9511, lng: -90.0715 };

function escapeHtml(input: string) {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  };
  return input.replace(/[&<>"']/g, (char) => map[char]);
}

export default function MapView({
  locations,
  selectedId = null,
  onSelect,
  center = NEW_ORLEANS_CENTER,
  zoom = 13,
}: {
  locations: MapLocation[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  center?: { lat: number; lng: number };
  zoom?: number;
}) {
  const mapDivRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<Map<string, google.maps.Marker>>(new Map());
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!mapsOptionsSet) {
      setOptions({ key: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!, v: "weekly" });
      mapsOptionsSet = true;
    }

    async function init() {
      // The bootstrap script installs google.maps.importLibrary asynchronously;
      // wait for it directly rather than relying on the npm wrapper's promise,
      // which doesn't reliably settle inside this component tree.
      while (!cancelled && !window.google?.maps?.importLibrary) {
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
      if (cancelled) return;

      await Promise.all([
        window.google.maps.importLibrary("maps"),
        window.google.maps.importLibrary("marker"),
      ]);
      if (cancelled || !mapDivRef.current) return;

      mapRef.current = new google.maps.Map(mapDivRef.current, {
        center,
        zoom,
        streetViewControl: false,
      });
      infoWindowRef.current = new google.maps.InfoWindow();
      setReady(true);
    }

    init();

    return () => {
      cancelled = true;
    };
    // Only the initial center/zoom matter — this effect creates the map once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!ready || !mapRef.current) return;

    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current.clear();

    for (const location of locations) {
      if (location.latitude == null || location.longitude == null) continue;
      const category = getCategory(location.category);
      const color = PIN_HEX[category?.pinColor ?? "purple"];
      const marker = new google.maps.Marker({
        position: { lat: location.latitude, lng: location.longitude },
        map: mapRef.current,
        title: location.name,
        icon: {
          url:
            "data:image/svg+xml;charset=UTF-8," +
            encodeURIComponent(
              `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28"><circle cx="14" cy="14" r="10" fill="${color}" stroke="white" stroke-width="3"/></svg>`,
            ),
          scaledSize: new google.maps.Size(28, 28),
        },
      });
      marker.addListener("click", () => {
        onSelect?.(location.id);
        openInfoWindow(marker, location, category?.label ?? "Uncategorized");
      });
      markersRef.current.set(location.id, marker);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, locations]);

  useEffect(() => {
    if (!ready || !selectedId) return;
    const marker = markersRef.current.get(selectedId);
    const location = locations.find((item) => item.id === selectedId);
    if (marker && location && mapRef.current) {
      mapRef.current.panTo(marker.getPosition()!);
      const category = getCategory(location.category);
      openInfoWindow(marker, location, category?.label ?? "Uncategorized");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, ready]);

  function openInfoWindow(marker: google.maps.Marker, location: MapLocation, categoryLabel: string) {
    infoWindowRef.current?.setContent(
      `<div style="font-family:sans-serif;max-width:220px">
        <strong>${escapeHtml(location.name)}</strong><br/>
        <span style="color:#6b7280;font-size:12px">${escapeHtml(categoryLabel)}</span>
        <p style="margin:6px 0;font-size:13px">${escapeHtml(location.address)}</p>
        <a href="/locations/${location.id}" style="color:#6b21a8;font-size:13px;margin-right:12px;font-weight:600">View Details</a>
        <a href="https://www.google.com/maps/dir/?api=1&destination=${location.latitude},${location.longitude}" target="_blank" rel="noopener noreferrer" style="color:#92680a;font-size:13px;font-weight:600">Directions</a>
      </div>`,
    );
    infoWindowRef.current?.open({ map: mapRef.current!, anchor: marker });
  }

  return <div ref={mapDivRef} className="h-full w-full" />;
}
