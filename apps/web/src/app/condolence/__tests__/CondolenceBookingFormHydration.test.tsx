// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { CondolenceBookingForm } from "../CondolenceBookingForm";

vi.mock("@/actions/condolence-actions", () => ({
  submitCondolenceBooking: vi.fn(),
  trackBooking: vi.fn(),
}));

vi.mock("@/components/security/TurnstileWidget", () => ({
  TurnstileWidget: () => <div data-testid="turnstile" />,
}));

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe("CondolenceBookingForm Hydration Guard", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("renders submit button disabled in pre-hydration SSR markup", () => {
    const { renderToString } = require("react-dom/server");
    const html = renderToString(<CondolenceBookingForm />);

    expect(html).toContain("disabled");
    expect(html).toContain("disabled:opacity-50");
    expect(html).toContain("disabled:cursor-not-allowed");
    expect(html).toContain("إرسال طلب حجز القاعة");
  });

  it("enables submit button after hydration mount completes", () => {
    render(<CondolenceBookingForm />);

    const submitButton = screen.getByRole("button", { name: /إرسال طلب حجز القاعة/i });
    expect(submitButton).toBeInTheDocument();
    expect(submitButton).not.toBeDisabled();
    expect(submitButton).toHaveAttribute("type", "submit");
    expect(submitButton).toHaveClass("disabled:opacity-50");
    expect(submitButton).toHaveClass("disabled:cursor-not-allowed");
  });

  it("renders form with method='post' and cancels default submission event", () => {
    render(<CondolenceBookingForm />);

    const submitButton = screen.getByRole("button", { name: /إرسال طلب حجز القاعة/i });
    const form = submitButton.closest("form");
    expect(form).not.toBeNull();
    expect(form).toHaveAttribute("method", "post");

    const submitEvent = new Event("submit", { cancelable: true, bubbles: true });
    fireEvent(form!, submitEvent);
    expect(submitEvent.defaultPrevented).toBe(true);
  });
});
