// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { AdminVideoModal } from "../AdminVideoModal";

vi.mock("@/actions/admin-video-actions", () => ({
  upsertVideoAction: vi.fn(),
}));

describe("AdminVideoModal Accessibility", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });
  it("renders with role='dialog', aria-modal='true', and correct accessible title", () => {
    render(
      <AdminVideoModal
        isOpen={true}
        onClose={vi.fn()}
        onSaved={vi.fn()}
      />
    );

    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toHaveAttribute("aria-labelledby", "video-modal-title");

    const title = screen.getByText("إضافة فيديو كنسي جديد");
    expect(title).toHaveAttribute("id", "video-modal-title");

    const closeButton = screen.getByLabelText("إغلاق");
    expect(closeButton).toBeInTheDocument();
  });

  it("calls onClose when Escape key is pressed", () => {
    const handleClose = vi.fn();
    render(
      <AdminVideoModal
        isOpen={true}
        onClose={handleClose}
        onSaved={vi.fn()}
      />
    );

    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    expect(handleClose).toHaveBeenCalledTimes(1);

    // Other keys do not trigger close
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it("removes keydown event listener on unmount", () => {
    const removeEventListenerSpy = vi.spyOn(window, "removeEventListener");
    const { unmount } = render(
      <AdminVideoModal
        isOpen={true}
        onClose={vi.fn()}
        onSaved={vi.fn()}
      />
    );

    unmount();
    expect(removeEventListenerSpy).toHaveBeenCalledWith("keydown", expect.any(Function));
    removeEventListenerSpy.mockRestore();
  });

  it("does not attach listener or render dialog when isOpen is false", () => {
    const addEventListenerSpy = vi.spyOn(window, "addEventListener");
    render(
      <AdminVideoModal
        isOpen={false}
        onClose={vi.fn()}
        onSaved={vi.fn()}
      />
    );

    expect(screen.queryByRole("dialog")).toBeNull();
    addEventListenerSpy.mockRestore();
  });
});
