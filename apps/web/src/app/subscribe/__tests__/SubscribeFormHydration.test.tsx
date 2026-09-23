// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { SubscribeForm } from "../SubscribeForm";

vi.mock("@/actions/subscription-actions", () => ({
  subscribeToEventsAction: vi.fn(),
}));

vi.mock("@/components/security/TurnstileWidget", () => ({
  TurnstileWidget: () => <div data-testid="turnstile" />,
}));

describe("SubscribeForm Hydration Guard", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("renders submit button disabled in pre-hydration SSR markup", () => {
    const { renderToString } = require("react-dom/server");
    const html = renderToString(<SubscribeForm locale="ar" groups={[]} emailDeliveryEnabled={false} />);

    expect(html).toContain("disabled");
    expect(html).toContain("disabled:opacity-50");
    expect(html).toContain("disabled:cursor-not-allowed");
    expect(html).toContain("تسجيل الاشتراك");
  });

  it("enables submit button after hydration mount completes", () => {
    render(<SubscribeForm locale="ar" groups={[]} emailDeliveryEnabled={false} />);

    const submitButton = screen.getByRole("button", { name: /تسجيل الاشتراك/i });
    expect(submitButton).toBeInTheDocument();
    expect(submitButton).not.toBeDisabled();
    expect(submitButton).toHaveAttribute("type", "submit");
    expect(submitButton).toHaveClass("disabled:opacity-50");
    expect(submitButton).toHaveClass("disabled:cursor-not-allowed");
  });

  it("renders form with method='post' and cancels default submission event", () => {
    render(<SubscribeForm locale="ar" groups={[]} emailDeliveryEnabled={false} />);

    const submitButton = screen.getByRole("button", { name: /تسجيل الاشتراك/i });
    const form = submitButton.closest("form");
    expect(form).not.toBeNull();
    expect(form).toHaveAttribute("method", "post");

    const submitEvent = new Event("submit", { cancelable: true, bubbles: true });
    fireEvent(form!, submitEvent);
    expect(submitEvent.defaultPrevented).toBe(true);
  });
});
