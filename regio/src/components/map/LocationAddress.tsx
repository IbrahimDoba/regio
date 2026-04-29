"use client";

import React, { useEffect, useState } from "react";
import LocationMap from "@/components/map/LocationMap";

interface NominatimAddress {
  road?: string;
  house_number?: string;
  city?: string;
  town?: string;
  village?: string;
  suburb?: string;
}

interface LocationAddressProps {
  lat: number;
  lng: number;
  showMapLabel: string;
  hideMapLabel: string;
}

export default function LocationAddress({ lat, lng, showMapLabel, hideMapLabel }: LocationAddressProps) {
  const [addressState, setAddressState] = useState<{
    lat: number;
    lng: number;
    address: NominatimAddress | null;
    loading: boolean;
  }>({ lat, lng, address: null, loading: true });
  const [showMap, setShowMap] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
      { headers: { "Accept-Language": "en" } }
    )
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) {
          setAddressState({
            lat,
            lng,
            address: (data.address as NominatimAddress) ?? null,
            loading: false,
          });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setAddressState({ lat, lng, address: null, loading: false });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [lat, lng]);

  const loading = addressState.loading || addressState.lat !== lat || addressState.lng !== lng;
  const address = addressState.lat === lat && addressState.lng === lng ? addressState.address : null;
  const city =
    address?.city ??
    address?.town ??
    address?.village ??
    address?.suburb ??
    "";
  const street = address?.road
    ? `${address.road}${address.house_number ? ` ${address.house_number}` : ""}`
    : "";

  return (
    <div className="mb-[20px]">
      <div className="flex items-start justify-between gap-2 mb-[6px]">
        <div className="text-[13px] text-[#444] leading-[1.5]">
          {loading ? (
            <span className="text-[#aaa]">...</span>
          ) : (
            <>
              {city && <div className="font-[600]">{city}</div>}
              {street && <div>{street}</div>}
              {!city && !street && (
                <span className="text-[#aaa]">
                  {lat.toFixed(4)}, {lng.toFixed(4)}
                </span>
              )}
            </>
          )}
        </div>
        <button
          type="button"
          onClick={() => setShowMap((v) => !v)}
          className="text-[11px] text-[#888] underline shrink-0 hover:text-[#555]"
        >
          {showMap ? hideMapLabel : showMapLabel}
        </button>
      </div>
      {showMap && <LocationMap lat={lat} lng={lng} />}
    </div>
  );
}
