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

export function formatPrice(listing: ListingPublic): string {
  const attrs = listing.attributes as any;
  if (!attrs) return "";

  if (listing.category === "OFFER_SERVICE") {
    return attrs.time_factor ? `${attrs.time_factor}x Time` : "1.0x Time";
  }

  if (listing.category === "SELL_PRODUCT") {
    const parts = [];
    if (attrs.regio_amount) parts.push(`${attrs.regio_amount} R`);
    if (attrs.time_amount) parts.push(`${attrs.time_amount} Min`);
    return parts.join(" + ");
  }

  if (listing.category === "RIDE_SHARE") {
    // Rideshare attributes: start, destination (no price usually in attributes unless shared params?)
    // Mock data had '30,00 R'.
    // Schema doesn't strictly enforce price for rideshare in attributes, maybe just description.
    // Use attributes if available or 'Contact for price'
    return "Contact for details";
  }

  if (listing.category === "OFFER_RENTAL") {
    const parts = [];
    if (attrs.fee_regio) parts.push(`${attrs.fee_regio} R`);
    if (attrs.fee_time) parts.push(`${attrs.fee_time} Min`);
    return parts.length > 0 ? parts.join(" + ") : "Contact";
  }

  return "";
}
