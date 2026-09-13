import { describe, expect, it } from "vitest";
import { getAppleBuyUrl } from "./apple";
import type { ProductVariant } from "./types";

function configuredVariant(
  productId: string,
  color: string,
  storage: string,
): ProductVariant {
  return {
    id: "variant",
    product_id: productId,
    sku: "SKU",
    part_number: null,
    price: 1199,
    attributes: { Color: color, Storage: storage },
  };
}

describe("getAppleBuyUrl", () => {
  it("links an exact Pro configuration to Apple", () => {
    expect(
      getAppleBuyUrl(configuredVariant("iphone-18-pro", "Burgundy", "1TB")),
    ).toBe(
      "https://www.apple.com/shop/buy-iphone/iphone-18-pro/6.3-inch-display-1tb-burgundy-unlocked",
    );
  });

  it("uses the larger display for Pro Max", () => {
    expect(
      getAppleBuyUrl(
        configuredVariant("iphone-18-pro-max", "Black", "256GB"),
      ),
    ).toContain("/6.9-inch-display-256gb-black-unlocked");
  });
});
