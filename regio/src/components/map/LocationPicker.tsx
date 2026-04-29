"use client";

import dynamic from "next/dynamic";
// CSS is handled by Next.js webpack — safe to import at module level
import "leaflet/dist/leaflet.css";

export interface LocationPickerProps {
  lat: number | null;
  lng: number | null;
  onLocationSelect: (lat: number, lng: number) => void;
  onClear: () => void;
}

// Leaflet JS uses `window` at import time, so load it lazily inside dynamic()
const LocationPicker = dynamic(
  async () => {
    const L = (await import("leaflet")).default;
    const { MapContainer, TileLayer, Marker, useMapEvents } = await import("react-leaflet");

    // Fix Webpack/Next.js asset resolution for default marker icons
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
      iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
      shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    });

    function ClickHandler({ onSelect }: { onSelect: (lat: number, lng: number) => void }) {
      useMapEvents({
        click(e) {
          onSelect(e.latlng.lat, e.latlng.lng);
        },
      });
      return null;
    }

    const { useState: useLocalState } = await import("react");
    const { useMap } = await import("react-leaflet");

    function MapFlyTo({ lat, lng }: { lat: number; lng: number }) {
      const map = useMap();
      map.flyTo([lat, lng], Math.max(map.getZoom(), 13), { duration: 0.8 });
      return null;
    }

    function LocationPickerMap({ lat, lng, onLocationSelect, onClear }: LocationPickerProps) {
      const [latInput, setLatInput] = useLocalState(lat !== null ? String(lat) : "");
      const [lngInput, setLngInput] = useLocalState(lng !== null ? String(lng) : "");
      const [flyTarget, setFlyTarget] = useLocalState<{ lat: number; lng: number } | null>(null);
      const [flyKey, setFlyKey] = useLocalState(0);

      const handleMapClick = (clat: number, clng: number) => {
        setLatInput(clat.toFixed(6));
        setLngInput(clng.toFixed(6));
        onLocationSelect(clat, clng);
      };

      const handleApply = () => {
        const parsedLat = parseFloat(latInput);
        const parsedLng = parseFloat(lngInput);
        if (isNaN(parsedLat) || isNaN(parsedLng)) return;
        if (parsedLat < -90 || parsedLat > 90 || parsedLng < -180 || parsedLng > 180) return;
        setFlyKey((key) => key + 1);
        setFlyTarget({ lat: parsedLat, lng: parsedLng });
        onLocationSelect(parsedLat, parsedLng);
      };

      return (
        <div className="mb-[15px]">
          {/* Lat / Lng inputs */}
          <div className="flex gap-2 mb-[8px]">
            <div className="flex-1">
              <label className="text-[12px] font-[600] text-[#555] block mb-[3px]">Latitude</label>
              <input
                type="number"
                step="any"
                value={latInput}
                onChange={(e) => setLatInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleApply()}
                placeholder="e.g. 47.4979"
                className="w-full p-[8px] border border-[#ccc] rounded-[4px] text-[13px] bg-[var(--input-bg)]"
              />
            </div>
            <div className="flex-1">
              <label className="text-[12px] font-[600] text-[#555] block mb-[3px]">Longitude</label>
              <input
                type="number"
                step="any"
                value={lngInput}
                onChange={(e) => setLngInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleApply()}
                placeholder="e.g. 19.0402"
                className="w-full p-[8px] border border-[#ccc] rounded-[4px] text-[13px] bg-[var(--input-bg)]"
              />
            </div>
            <div className="flex items-end">
              <button
                type="button"
                onClick={handleApply}
                className="px-[12px] py-[8px] bg-[#333] text-white text-[12px] font-[600] rounded-[4px] hover:bg-[#555] transition-colors"
              >
                Set
              </button>
            </div>
          </div>

          {/* Map */}
          <div
            style={{
              height: 200,
              borderRadius: 4,
              overflow: "hidden",
              border: "1px solid #ccc",
            }}
          >
            <MapContainer
              center={[lat ?? 47.497, lng ?? 19.04]}
              zoom={lat !== null ? 13 : 11}
              style={{ height: "100%", width: "100%" }}
              scrollWheelZoom={false}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <ClickHandler onSelect={handleMapClick} />
              {lat !== null && lng !== null && (
                <Marker position={[lat, lng]} />
              )}
              {flyTarget && (
                <MapFlyTo key={flyKey} lat={flyTarget.lat} lng={flyTarget.lng} />
              )}
            </MapContainer>
          </div>

          {lat !== null && lng !== null ? (
            <div className="flex items-center justify-between mt-[6px]">
              <span className="text-[11px] text-[#555]">
                {lat.toFixed(5)}, {lng.toFixed(5)}
              </span>
              <button
                type="button"
                onClick={() => {
                  setLatInput("");
                  setLngInput("");
                  setFlyTarget(null);
                  onClear();
                }}
                className="text-[11px] text-red-500 hover:underline"
              >
                Clear
              </button>
            </div>
          ) : (
            <p className="text-[11px] text-[#888] mt-[4px]">
              Type coordinates above or click the map to pin a location.
            </p>
          )}
        </div>
      );
    }

    return LocationPickerMap;
  },
  {
    ssr: false,
    loading: () => (
      <div
        style={{
          height: 220,
          borderRadius: 4,
          background: "#f0f0f0",
          border: "1px solid #ccc",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 12,
          color: "#888",
        }}
      >
        Loading map…
      </div>
    ),
  }
);

export default LocationPicker;
