// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { AdminVideoModal } from "../AdminVideoModal";

vi.mock("@/actions/admin-video-actions", () => ({
  upsertVideoAction: vi.fn(),
}));

describe("AdminVideoModal Accessibility", () => {
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
});
