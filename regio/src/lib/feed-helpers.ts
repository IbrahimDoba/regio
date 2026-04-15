import { ListingCategory, ListingPublic } from "@/lib/api/types";

export const CATEGORY_CONFIG: Record<
  ListingCategory,
  { color: string; colorVar: string; icon: string; label: string }
> = {
  OFFER_SERVICE: {
    color: "green",
    colorVar: "var(--color-green-offer)",
    icon: "fa-screwdriver-wrench",
    label: "Offer Service",
  },
  SEARCH_SERVICE: {
    color: "red",
    colorVar: "var(--color-red-search)",
    icon: "fa-magnifying-glass",
    label: "Search Service",
  },
  SELL_PRODUCT: {
    color: "blue",
    colorVar: "var(--color-blue)",
    icon: "fa-tags",
    label: "Sell Product",
  },
  SEARCH_PRODUCT: {
    color: "orange",
    colorVar: "var(--color-orange)",
    icon: "fa-magnifying-glass-dollar",
    label: "Search Product",
  },
  OFFER_RENTAL: {
    color: "purple",
    colorVar: "var(--color-purple)",
    icon: "fa-hand-holding-hand",
    label: "Offer Rental",
  },
  RIDE_SHARE: {
    color: "turquoise",
    colorVar: "var(--color-turquoise)",
    icon: "fa-car",
    label: "Ride Share",
  },
  EVENT_WORKSHOP: {
    color: "yellow",
    colorVar: "var(--color-yellow)",
    icon: "fa-calendar-days",
    label: "Event / Workshop",
  },
};

export function getCategoryDetails(category: ListingCategory) {
  return (
    CATEGORY_CONFIG[category] || {
      color: "gray",
      colorVar: "var(--color-gray)", // Fallback, make sure this var exists or use straight hex
      icon: "fa-question",
      label: "Unknown",
    }
  );
}

export interface ListingAttributes {
  // OFFER_SERVICE
  time_factor?: number;
  location?: string;
  // SELL_PRODUCT
  time_amount?: number;
  regio_amount?: number;
  condition?: string;
  stock?: number;
  // OFFER_RENTAL
  handling_fee_time?: number;
  usage_fee_regio?: number;
  max_rental_duration?: string;
  deposit_required?: boolean;
  // RIDE_SHARE
  from_location?: string;
  to_location?: string;
  departure_datetime?: string;
  seats_available?: number;
  price_time?: number;
  price_regio?: number;
  // EVENT_WORKSHOP
  event_start_date?: string;
  event_end_date?: string;
  event_location?: string;
  max_participants?: number;
  price_regio_event?: number; // aliased below via price_regio
  // SEARCH_SERVICE
  deadline?: string;
  // SEARCH_PRODUCT
  urgency_deadline?: string;
  // shared
  price_notes?: string;
}

export function formatPriceNode(listing: ListingPublic): string {
  const attrs = listing.attributes as ListingAttributes | undefined;
  if (!attrs) return "";

  switch (listing.category) {
    case "OFFER_SERVICE":
      return `${attrs.time_factor ?? 1.0}x Time`;

    case "SELL_PRODUCT": {
      const parts = [];
      if (attrs.time_amount) parts.push(`${attrs.time_amount} Min`);
      if (attrs.regio_amount) parts.push(`${attrs.regio_amount} G`);
      return parts.join(" + ") || "Negotiable";
    }

    case "OFFER_RENTAL": {
      const parts = [];
      if (attrs.handling_fee_time) parts.push(`${attrs.handling_fee_time} Min`);
      if (attrs.usage_fee_regio) parts.push(`${attrs.usage_fee_regio} G`);
      return parts.join(" + ") || "Contact";
    }

    case "RIDE_SHARE": {
      const parts = [];
      if (attrs.price_time) parts.push(`${attrs.price_time} Min`);
      if (attrs.price_regio) parts.push(`${attrs.price_regio} G`);
      return parts.join(" + ") || "Contact for price";
    }

    case "EVENT_WORKSHOP": {
      const parts = [];
      if (attrs.price_time) parts.push(`${attrs.price_time} Min`);
      if (attrs.price_regio) parts.push(`${attrs.price_regio} G`);
      return parts.join(" + ") || "Free";
    }

    case "SEARCH_SERVICE":
    case "SEARCH_PRODUCT":
      return "Wanted";

    default:
      return "";
  }
}
