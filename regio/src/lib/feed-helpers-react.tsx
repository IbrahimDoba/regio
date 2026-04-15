import React from "react";
import { ListingPublic } from "@/lib/api/types";
import { ListingAttributes } from "@/lib/feed-helpers";

const TI = <img src="/time.png" style={{ width: 14, height: 14, display: "inline-block", verticalAlign: "middle", marginRight: 2 }} alt="" />;
const GI = <img src="/garas.png" style={{ width: 14, height: 14, display: "inline-block", verticalAlign: "middle", marginRight: 2 }} alt="" />;
const TFI = <img src="/timefactor.png" style={{ width: 14, height: 14, display: "inline-block", verticalAlign: "middle", marginRight: 2 }} alt="" />;

export function formatPriceNode(listing: ListingPublic): React.ReactNode {
  const attrs = listing.attributes as ListingAttributes | undefined;
  if (!attrs) return null;

  switch (listing.category) {
    case "OFFER_SERVICE":
      return <span style={{ display: "inline-flex", alignItems: "center" }}>{TFI}{attrs.time_factor ?? 1.0}x Time</span>;

    case "SELL_PRODUCT": {
      const parts: React.ReactNode[] = [];
      if (attrs.time_amount) parts.push(<span key="t" style={{ display: "inline-flex", alignItems: "center" }}>{TI}{attrs.time_amount} Min</span>);
      if (attrs.regio_amount) parts.push(<span key="g" style={{ display: "inline-flex", alignItems: "center" }}>{GI}{attrs.regio_amount} G</span>);
      if (!parts.length) return "Negotiable";
      return <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>{parts}</span>;
    }

    case "OFFER_RENTAL": {
      const parts: React.ReactNode[] = [];
      if (attrs.handling_fee_time) parts.push(<span key="t" style={{ display: "inline-flex", alignItems: "center" }}>{TI}{attrs.handling_fee_time} Min</span>);
      if (attrs.usage_fee_regio) parts.push(<span key="g" style={{ display: "inline-flex", alignItems: "center" }}>{GI}{attrs.usage_fee_regio} G</span>);
      if (!parts.length) return "Contact";
      return <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>{parts}</span>;
    }

    case "RIDE_SHARE": {
      const parts: React.ReactNode[] = [];
      if (attrs.price_time) parts.push(<span key="t" style={{ display: "inline-flex", alignItems: "center" }}>{TI}{attrs.price_time} Min</span>);
      if (attrs.price_regio) parts.push(<span key="g" style={{ display: "inline-flex", alignItems: "center" }}>{GI}{attrs.price_regio} G</span>);
      if (!parts.length) return "Contact for price";
      return <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>{parts}</span>;
    }

    case "EVENT_WORKSHOP": {
      const parts: React.ReactNode[] = [];
      if (attrs.price_time) parts.push(<span key="t" style={{ display: "inline-flex", alignItems: "center" }}>{TI}{attrs.price_time} Min</span>);
      if (attrs.price_regio) parts.push(<span key="g" style={{ display: "inline-flex", alignItems: "center" }}>{GI}{attrs.price_regio} G</span>);
      if (!parts.length) return "Free";
      return <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>{parts}</span>;
    }

    case "SEARCH_SERVICE":
    case "SEARCH_PRODUCT":
      return "Wanted";

    default:
      return null;
  }
}
