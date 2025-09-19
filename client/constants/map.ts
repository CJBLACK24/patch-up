import Constants from "expo-constants";

// Read from app.json -> expo.extra.MAPTILER_KEY (your key stays)
const MAPTILER_KEY: string =
  (Constants.expoConfig?.extra as any)?.MAPTILER_KEY || "iNtS1QIPq27RGWxB2TSX";

// 👉 Light, Google-like streets style (already includes road & place names)
export const MAP_STYLE_URL = `https://api.maptiler.com/maps/streets-v2/style.json?key=${MAPTILER_KEY}`;

// Iloilo City (lng, lat)
export const ILOILO_CENTER: [number, number] = [122.564, 10.72];

// Default zoom for the city
export const DEFAULT_ZOOM = 13;

// Keep bounds (Panay) if you want to avoid accidental “world view”
export const PANAY_MAX_BOUNDS = {
  sw: [121.70, 10.10] as [number, number],
  ne: [123.30, 11.90] as [number, number],
};

// ⬇️ Your MapTiler Data (GeoJSON features) URL
export const AOI_GEOJSON_URL =
  "https://api.maptiler.com/data/01995add-ca9b-7d86-8d6e-399e76080e68/features.json?key=iNtS1QIPq27RGWxB2TSX";
