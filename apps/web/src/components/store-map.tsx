"use client";

import * as maplibregl from "maplibre-gl";
import type { StyleSpecification } from "maplibre-gl";
import { MapPin } from "lucide-react";
import { useEffect, useMemo, useRef } from "react";
import { getAppleBuyUrl } from "@/lib/apple";
import { useI18n } from "@/lib/i18n";
import type { AvailabilityResult, AvailabilityStatus } from "@/lib/types";

const statusPresentation: Record<
  AvailabilityStatus,
  { color: string; label: "available" | "limited" | "unavailable" | "unknown" }
> = {
  AVAILABLE: { color: "#237a4b", label: "available" },
  LIMITED: { color: "#b46a0a", label: "limited" },
  UNAVAILABLE: { color: "#6b6b70", label: "unavailable" },
  UNKNOWN: { color: "#8a8a90", label: "unknown" },
};

const tileUrl =
  process.env.NEXT_PUBLIC_MAP_TILE_URL ??
  "https://tile.openstreetmap.org/{z}/{x}/{y}.png";

const mapStyle: StyleSpecification = {
  version: 8,
  sources: {
    "orchard-base": {
      type: "raster",
      tiles: [tileUrl],
      tileSize: 256,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap contributors</a>',
    },
  },
  layers: [
    {
      id: "orchard-base",
      type: "raster",
      source: "orchard-base",
      minzoom: 0,
      maxzoom: 19,
    },
  ],
};

export function StoreMap({ results }: { results: AvailabilityResult[] }) {
  const { t } = useI18n();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const locatedResults = useMemo(
    () =>
      results.filter(
        (result) =>
          result.store.latitude !== null && result.store.longitude !== null,
      ),
    [results],
  );

  useEffect(() => {
    if (!containerRef.current || locatedResults.length === 0) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: mapStyle,
      center: [
        locatedResults[0].store.longitude!,
        locatedResults[0].store.latitude!,
      ],
      zoom: 10,
      attributionControl: false,
    });
    mapRef.current = map;
    map.addControl(
      new maplibregl.NavigationControl({ showCompass: false }),
      "top-right",
    );
    map.addControl(
      new maplibregl.AttributionControl({ compact: false }),
      "bottom-right",
    );

    const bounds = new maplibregl.LngLatBounds();
    markersRef.current = locatedResults.map((result, index) => {
      const { latitude, longitude } = result.store;
      const presentation = statusPresentation[result.availability.status];
      const marker = document.createElement("button");
      marker.type = "button";
      marker.className =
        "grid h-10 w-10 cursor-pointer place-items-center rounded-full border-[3px] border-white text-sm font-bold text-white shadow-lg transition-transform hover:scale-110 focus:outline-none focus:ring-4 focus:ring-white/80";
      marker.style.backgroundColor = presentation.color;
      marker.textContent = String(index + 1);
      marker.setAttribute(
        "aria-label",
        `${result.store.name}: ${t(presentation.label)}`,
      );

      const popup = document.createElement("div");
      popup.className = "min-w-52 p-1 font-sans";

      const name = document.createElement("p");
      name.className = "text-sm font-semibold text-ink";
      name.textContent = result.store.name;

      const status = document.createElement("p");
      status.className = "mt-1 text-xs font-semibold";
      status.style.color = presentation.color;
      status.textContent = `${t(presentation.label)} · ${t("milesShort", { distance: result.store.distance_miles.toFixed(1) })}`;

      const address = document.createElement("p");
      address.className = "mt-2 text-xs leading-relaxed text-black/55";
      address.textContent = `${result.store.address}, ${result.store.city}`;

      popup.append(name, status, address);
      if (result.availability.available) {
        const orderLink = document.createElement("a");
        orderLink.href = getAppleBuyUrl(result.product);
        orderLink.target = "_blank";
        orderLink.rel = "noreferrer";
        orderLink.className =
          "mt-3 inline-flex rounded-full bg-ink px-3 py-2 text-xs font-semibold text-white";
        orderLink.textContent = t("orderAtApple");
        popup.append(orderLink);
      }
      bounds.extend([longitude!, latitude!]);

      return new maplibregl.Marker({ element: marker, anchor: "bottom" })
        .setLngLat([longitude!, latitude!])
        .setPopup(
          new maplibregl.Popup({ offset: 18, closeButton: false }).setDOMContent(
            popup,
          ),
        )
        .addTo(map);
    });

    if (locatedResults.length === 1) {
      map.setCenter(bounds.getCenter());
      map.setZoom(12);
    } else {
      map.fitBounds(bounds, { padding: 70, maxZoom: 12, duration: 0 });
    }

    return () => {
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
      map.remove();
      mapRef.current = null;
    };
  }, [locatedResults, t]);

  if (locatedResults.length === 0) {
    return (
      <div className="grid min-h-[430px] place-items-center rounded-[2rem] border border-black/[.07] bg-white px-6 text-center shadow-card">
        <div>
          <MapPin className="mx-auto h-7 w-7 text-black/30" />
          <p className="mt-3 font-semibold">{t("noCoordinates")}</p>
          <p className="mt-1 text-sm text-black/45">
            {t("noCoordinatesHelp")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-[430px] overflow-hidden rounded-[2rem] border border-black/[.07] bg-[#e8e8e4] shadow-card">
      <div
        ref={containerRef}
        className="absolute inset-0"
        role="region"
        aria-label={t("mapLabel", { count: locatedResults.length })}
      />
      <div className="pointer-events-none absolute left-4 top-4 z-10 rounded-2xl border border-black/[.07] bg-white/95 px-4 py-3 shadow-card backdrop-blur">
        <p className="text-xs font-bold uppercase tracking-[.12em] text-black/35">
          {t("nearbyStores")}
        </p>
        <p className="mt-1 text-sm font-semibold">
          {t("locations", { count: locatedResults.length })}
        </p>
      </div>
      <ul className="sr-only">
        {locatedResults.map((result) => (
          <li key={result.store.id}>
            {result.store.name}: {t(statusPresentation[result.availability.status].label)}
          </li>
        ))}
      </ul>
    </div>
  );
}
