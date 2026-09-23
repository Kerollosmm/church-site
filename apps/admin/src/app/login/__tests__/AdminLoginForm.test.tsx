// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { AdminLoginForm } from "../AdminLoginForm";

const mockSignIn = vi.fn();
vi.mock("@/actions/auth-actions", () => ({
  signIn: (...args: unknown[]) => mockSignIn(...args),
  confirmSessionAction: vi.fn(),
}));

describe("AdminLoginForm submit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("navigates cleanly via window.location.assign on successful sign-in", async () => {
    const originalLocation = window.location;
    const assignMock = vi.fn();
    delete (window as any).location;
    (window as any).location = { assign: assignMock, href: "" };

    mockSignIn.mockResolvedValue({ success: true, targetUrl: "/masses" });

    render(<AdminLoginForm />);
    fireEvent.change(screen.getByLabelText(/البريد الإلكتروني الرسمي/i), {
      target: { value: "admin@saintsmaximos.org" },
    });
    fireEvent.change(screen.getByLabelText(/كلمة المرور/i), {
      target: { value: "SecretPass123!" },
    });
    fireEvent.click(screen.getByRole("button", { name: /تسجيل الدخول/i }));

    await waitFor(() => {
      expect(assignMock).toHaveBeenCalledWith("/masses");
    });

    (window as any).location = originalLocation;
  });
});
