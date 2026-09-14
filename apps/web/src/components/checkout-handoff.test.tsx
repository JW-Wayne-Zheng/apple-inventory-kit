import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { AvailabilityResult } from "@/lib/types";
import { CheckoutHandoff } from "./checkout-handoff";

const result: AvailabilityResult = {
  product: {
    id: "var-iphone-18-pro",
    product_id: "iphone-18-pro",
    sku: "IPH18P-256GB-BK",
    part_number: "IPH18P-256GB-BK",
    price: 1199,
    attributes: { Color: "Black", Storage: "256GB" },
  },
  store: {
    id: "R001",
    name: "Apple Test Store",
    address: "1 Apple Way",
    city: "New York",
    region: "NY",
    postal_code: "10001",
    distance_miles: 1.2,
    latitude: 40.75,
    longitude: -73.99,
    hours: null,
  },
  availability: {
    available: true,
    status: "AVAILABLE",
    pickup_message: "Available today",
    last_checked_at: "2026-09-13T12:00:00Z",
  },
};

describe("CheckoutHandoff", () => {
  it("opens a guided handoff with the exact Apple configuration", () => {
    HTMLDialogElement.prototype.showModal = function showModal() {
      this.setAttribute("open", "");
    };

    render(<CheckoutHandoff result={result} zip="10001" />);
    fireEvent.click(screen.getByRole("button", { name: "Continue at Apple" }));

    expect(screen.getByRole("dialog")).toHaveTextContent("Apple Test Store");
    expect(
      screen.getByRole("link", { name: /Open exact configuration/i }),
    ).toHaveAttribute(
      "href",
      "https://www.apple.com/shop/buy-iphone/iphone-18-pro/6.3-inch-display-256gb-black-unlocked",
    );
  });
});
