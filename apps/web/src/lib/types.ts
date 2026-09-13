export type AvailabilityStatus = "AVAILABLE" | "LIMITED" | "UNAVAILABLE" | "UNKNOWN";

export interface ProductVariant {
  id: string;
  product_id: string;
  sku: string;
  part_number: string | null;
  price: number | null;
  attributes: Record<string, string>;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  description: string | null;
  image_url: string | null;
  product_url: string | null;
  variants: ProductVariant[];
}

export interface Store {
  id: string;
  name: string;
  address: string;
  city: string;
  region: string;
  postal_code: string;
  distance_miles: number;
  latitude: number | null;
  longitude: number | null;
  hours: Record<string, string> | null;
}

export interface AvailabilityResult {
  product: ProductVariant;
  store: Store;
  availability: {
    available: boolean;
    status: AvailabilityStatus;
    pickup_message: string;
    last_checked_at: string;
  };
}

export interface AvailabilityResponse {
  results: AvailabilityResult[];
  is_cached: boolean;
  is_stale: boolean;
  provider: string;
}

export interface ApiErrorShape {
  error?: { code?: string; message?: string };
}

