import { describe, expect, it } from "vitest";
import { validateSearch } from "./search";

describe("search validation", () => {
  it("accepts a product and five-digit ZIP", () => {
    expect(validateSearch("iPhone", "10001")).toEqual({ success: true });
  });

  it("rejects a malformed ZIP before a request is sent", () => {
    expect(validateSearch("iPhone", "100")).toEqual({
      success: false,
      error: "Enter a 5-digit ZIP code",
    });
  });
});

