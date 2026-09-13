import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StatusBadge } from "./status-badge";

describe("StatusBadge", () => {
  it("renders the normalized status label", () => {
    render(<StatusBadge status="LIMITED" />);
    expect(screen.getByText("Limited")).toBeInTheDocument();
  });
});

