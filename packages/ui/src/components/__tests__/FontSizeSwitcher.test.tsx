// @vitest-environment jsdom
import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { FontSizeSwitcher } from "../FontSizeSwitcher";

describe("FontSizeSwitcher Accessibility", () => {
  it("renders buttons with explicit aria-label and data attributes", () => {
    render(<FontSizeSwitcher />);

    const group = screen.getByRole("group", { name: "تغيير حجم خط الموقع" });
    expect(group).toBeInTheDocument();

    const normalBtn = screen.getByRole("button", { name: "حجم الخط العادي" });
    const largeBtn = screen.getByRole("button", { name: "حجم الخط كبير" });
    const xlargeBtn = screen.getByRole("button", { name: "حجم الخط كبير جداً" });

    expect(normalBtn).toHaveAttribute("data-font-size-btn", "normal");
    expect(largeBtn).toHaveAttribute("data-font-size-btn", "large");
    expect(xlargeBtn).toHaveAttribute("data-font-size-btn", "xlarge");
  });
});
