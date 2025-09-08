// src/components/MapWithStyleSwitcher.tsx

import React, { useState } from "react";
import { MapContainer, TileLayer } from "react-leaflet";

// Tüm stiller burada
const TILE_STYLES = {
  "Carto Light": {
    url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    subdomains: ["a", "b", "c", "d"],
    attribution: "&copy; OSM &copy; CARTO",
  },
  "Carto Dark": {
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    subdomains: ["a", "b", "c", "d"],
    attribution: "&copy; OSM &copy; CARTO",
  },
  "Carto Voyager": {
    url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
    subdomains: ["a", "b", "c", "d"],
    attribution: "&copy; OSM &copy; CARTO",
  },
  "Google Maps": {
    url: `https://mts{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}&key=${import.meta.env.VITE_GOOGLE_CLOUD_API_KEY}`,
    subdomains: ["0", "1", "2", "3"],
    attribution: "&copy; Google",
  },
  "Google Satellite": {
    url: `https://mts{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}&key=${import.meta.env.VITE_GOOGLE_CLOUD_API_KEY}`,
    subdomains: ["0", "1", "2", "3"],
    attribution: "&copy; Google",
  },
  "Google Hybrid": {
    url: `https://mts{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}&key=${import.meta.env.VITE_GOOGLE_CLOUD_API_KEY}`,
    subdomains: ["0", "1", "2", "3"],
    attribution: "&copy; Google",
  },
  "Google Terrain": {
    url: `https://mts{s}.google.com/vt/lyrs=t&x={x}&y={y}&z={z}&key=${import.meta.env.VITE_GOOGLE_CLOUD_API_KEY}`,
    subdomains: ["0", "1", "2", "3"],
    attribution: "&copy; Google",
  },
} as const;

type StyleKey = keyof typeof TILE_STYLES;

export default function MapWithStyleSwitcher() {
  const [style, setStyle] = useState<StyleKey>("Carto Light");
  const tile = TILE_STYLES[style];

  return (
    <div style={{ height: "100vh" }}>
      {/* Stil seçici */}
      <div
        style={{
          position: "absolute",
          zIndex: 1000,
          top: 12,
          left: 12,
          background: "white",
          padding: 8,
          borderRadius: 8,
          boxShadow: "0 2px 8px rgba(0,0,0,.15)",
        }}
      >
        <label style={{ fontSize: 12, marginRight: 6 }}>Harita stili:</label>
        <select value={style} onChange={(e) => setStyle(e.target.value as StyleKey)}>
          {Object.keys(TILE_STYLES).map((k) => (
            <option key={k} value={k}>
              {k}
            </option>
          ))}
        </select>
      </div>

      {/* Harita */}
      <MapContainer
        center={[41.0, 29.0]}
        zoom={12}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          url={tile.url}
          attribution={tile.attribution}
          // @ts-ignore
          subdomains={tile.subdomains}
        />
      </MapContainer>
    </div>
  );
}
