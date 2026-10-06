// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ErrorBoundary from "../error";

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe("Root Error Boundary Component", () => {
  it("renders respectful error message, reset button, home link, and data-web-state", () => {
    const reset = vi.fn();
    const error = new Error("Test crash") as Error & { digest?: string };
    error.digest = "ERR-12345";

    const { container } = render(<ErrorBoundary error={error} reset={reset} />);

    // Assert data-web-state="error"
    const root = container.querySelector('[data-web-state="error"]');
    expect(root).toBeDefined();

    // Assert Arabic error message
    expect(screen.getByText("حدث خطأ غير متوقع أثناء تحميل الصفحة")).toBeDefined();

    // Assert reset button and execution
    const retryBtn = screen.getByRole("button", { name: /إعادة المحاولة/i });
    expect(retryBtn).toBeDefined();
    fireEvent.click(retryBtn);
    expect(reset).toHaveBeenCalledTimes(1);

    // Assert home link
    const homeLink = screen.getByRole("link", { name: /العودة للرئيسية/i });
    expect(homeLink).toBeDefined();
    expect(homeLink.getAttribute("href")).toBe("/");

    // Assert digest code display
    expect(screen.getByText(/ERR-12345/)).toBeDefined();
  });
});
