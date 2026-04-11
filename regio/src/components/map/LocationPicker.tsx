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

    function LocationPickerMap({ lat, lng, onLocationSelect, onClear }: LocationPickerProps) {
      return (
        <div className="mb-[15px]">
          <div
            style={{
              height: 220,
              borderRadius: 4,
              overflow: "hidden",
              border: "1px solid #ccc",
            }}
          >
            <MapContainer
              center={[47.497, 19.04]}
              zoom={11}
              style={{ height: "100%", width: "100%" }}
              scrollWheelZoom={false}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <ClickHandler onSelect={onLocationSelect} />
              {lat !== null && lng !== null && (
                <Marker position={[lat, lng]} />
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
                onClick={onClear}
                className="text-[11px] text-red-500 hover:underline"
              >
                Clear location
              </button>
            </div>
          ) : (
            <p className="text-[11px] text-[#888] mt-[4px]">
              Click on the map to pin a location.
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
