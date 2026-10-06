// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { ContactForm } from "../ContactForm";

vi.mock("@/actions/contact-actions", () => ({
  submitContactMessage: vi.fn(),
}));

vi.mock("@/components/security/TurnstileWidget", () => ({
  TurnstileWidget: () => <div data-testid="turnstile" />,
}));

describe("ContactForm Email Disclosure", () => {
  it("renders honest delivery disclosure explaining response methods", () => {
    render(<ContactForm />);
    expect(
      screen.getByText(/المتابعة تتم هاتفياً أو عبر واتساب/i)
    ).toBeInTheDocument();
  });
});
