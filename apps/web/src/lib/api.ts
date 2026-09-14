import type { ApiErrorShape, AvailabilityResponse, Product, Store } from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as ApiErrorShape;
    throw new ApiError(body.error?.message ?? "Something went wrong. Please try again.", response.status);
  }
  return response.json() as Promise<T>;
}

export const api = {
  searchProducts: (query: string) =>
    request<Product[]>(`/products/search?q=${encodeURIComponent(query)}`),
  getProduct: (id: string) => request<Product>(`/products/${encodeURIComponent(id)}`),
  getStores: (zip: string) => request<Store[]>(`/stores?postal_code=${encodeURIComponent(zip)}`),
  getStore: (id: string, zip: string) =>
    request<Store>(`/stores/${encodeURIComponent(id)}?postal_code=${encodeURIComponent(zip)}`),
  getAvailability: (productId: string, zip: string) =>
    request<AvailabilityResponse>(
      `/availability?product_id=${encodeURIComponent(productId)}&postal_code=${encodeURIComponent(zip)}`,
    ),
  availabilityStreamUrl: (productId: string, zip: string) =>
    `${API_URL}/availability/stream?product_id=${encodeURIComponent(productId)}&postal_code=${encodeURIComponent(zip)}`,
  refreshAvailability: (productId: string, zip: string) =>
    request<AvailabilityResponse>("/availability/refresh", {
      method: "POST",
      body: JSON.stringify({ product_id: productId, postal_code: zip }),
    }),
  createAlert: (payload: {
    contact: string;
    product_variant_id: string;
    postal_code: string;
    store_id?: string;
  }) => request("/alerts", { method: "POST", body: JSON.stringify(payload) }),
};
