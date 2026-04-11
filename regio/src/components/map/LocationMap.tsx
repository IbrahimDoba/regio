"use client";

import dynamic from "next/dynamic";
import "leaflet/dist/leaflet.css";

interface LocationMapProps {
  lat: number;
  lng: number;
}

const LocationMap = dynamic(
  async () => {
    const L = (await import("leaflet")).default;
    const { MapContainer, TileLayer, Marker } = await import("react-leaflet");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
      iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
      shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    });

    function LocationMapInner({ lat, lng }: LocationMapProps) {
      return (
        <div
          style={{
            height: 200,
            borderRadius: 6,
            overflow: "hidden",
            border: "1px solid #eee",
          }}
        >
          <MapContainer
            center={[lat, lng]}
            zoom={13}
            style={{ height: "100%", width: "100%" }}
            scrollWheelZoom={false}
            zoomControl={false}
            dragging={false}
            doubleClickZoom={false}
            attributionControl={false}
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <Marker position={[lat, lng]} />
          </MapContainer>
        </div>
      );
    }

    return LocationMapInner;
  },
  {
    ssr: false,
    loading: () => (
      <div
        style={{
          height: 200,
          borderRadius: 6,
          background: "#f0f0f0",
          border: "1px solid #eee",
        }}
      />
    ),
  }
);

export default LocationMap;
