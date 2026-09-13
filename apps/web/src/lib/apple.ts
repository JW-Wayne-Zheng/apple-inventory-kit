import type { ProductVariant } from "./types";

const APPLE_BUY_BASE =
  "https://www.apple.com/shop/buy-iphone/iphone-18-pro";

export function getAppleBuyUrl(variant: ProductVariant): string {
  const display =
    variant.product_id === "iphone-18-pro-max"
      ? "6.9-inch-display"
      : "6.3-inch-display";
  const storage = variant.attributes.Storage?.toLowerCase();
  const finish = variant.attributes.Color?.toLowerCase().replaceAll(" ", "-");

  if (!storage || !finish) return APPLE_BUY_BASE;
  return `${APPLE_BUY_BASE}/${display}-${storage}-${finish}-unlocked`;
}
