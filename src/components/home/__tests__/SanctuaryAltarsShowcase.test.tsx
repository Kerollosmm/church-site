// @vitest-environment jsdom
import React from "react";
import { afterEach, describe, it, expect, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { SanctuaryAltarsShowcase } from "../SanctuaryAltarsShowcase";

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("lucide-react", () => ({
  Church: () => <span data-testid="icon" />,
  Sparkles: () => <span data-testid="icon" />,
  Calendar: () => <span data-testid="icon" />,
  ArrowLeft: () => <span data-testid="icon" />,
  Flame: () => <span data-testid="icon" />,
  Award: () => <span data-testid="icon" />,
  BookOpen: () => <span data-testid="icon" />,
  Check: () => <span data-testid="icon" />,
}));

describe("SanctuaryAltarsShowcase Component", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders the showcase title and badge for consecrated altars", () => {
    render(<SanctuaryAltarsShowcase />);

    const heading = screen.getByRole("heading", {
      name: "مذابح كنيستنا الثلاثة",
      level: 2,
    });
    expect(heading).toBeDefined();
    expect(heading.textContent).toContain("مذابح كنيستنا الثلاثة");

    expect(screen.getByText("المذابح المقدسة المدشنة بالميرون")).toBeDefined();
    expect(
      screen.getByText(/ثلاثة هياكل مقدسة مدشنة بمسحة الميرون الغالي/i)
    ).toBeDefined();
  });

  it("renders the Middle Consecrated Altar (Virgin Mary and Sts. Maximus & Domadius)", () => {
    render(<SanctuaryAltarsShowcase />);

    // Orientation label & English subtitle
    expect(screen.getByText("المذبح الأوسط الرئيسي")).toBeDefined();
    expect(screen.getByText("The Main Central Altar")).toBeDefined();

    // Patron Saint
    expect(
      screen.getByRole("heading", {
        name: "السيدة العذراء مريم والقديسان مكسيموس ودوماديوس",
        level: 3,
      })
    ).toBeDefined();

    // Consecration by Pope Shenouda III (1985)
    expect(screen.getByText("دُشن بيد البابا شنودة الثالث (1985)")).toBeDefined();

    // Liturgical usage
    expect(
      screen.getByText(/تقام عليه قداسات الآحاد الرئيسية، الأعياد السيدية الكبرى/i)
    ).toBeDefined();
  });

  it("renders the Marine Consecrated Altar (St. George)", () => {
    render(<SanctuaryAltarsShowcase />);

    // Orientation label & English subtitle
    expect(screen.getByText("المذبح البحري")).toBeDefined();
    expect(screen.getByText("The Northern Altar")).toBeDefined();

    // Patron Saint
    expect(
      screen.getByRole("heading", {
        name: "الشهيد العظيم مارجرجس الروماني",
        level: 3,
      })
    ).toBeDefined();

    // Consecration note
    expect(screen.getByText("مدشن بزيت الميرون المقدس")).toBeDefined();

    // Liturgical usage
    expect(
      screen.getByText(/تقام عليه القداسات الإلهية الأسبوعية، صلوات العشيات/i)
    ).toBeDefined();
  });

  it("renders the Qibli Consecrated Altar (St. Moses the Black)", () => {
    render(<SanctuaryAltarsShowcase />);

    // Orientation label & English subtitle
    expect(screen.getByText("المذبح القبلي")).toBeDefined();
    expect(screen.getByText("The Southern Altar")).toBeDefined();

    // Patron Saint
    expect(
      screen.getByRole("heading", {
        name: "القوي القديس الأنبا موسى الأسود",
        level: 3,
      })
    ).toBeDefined();

    // Consecration note
    expect(screen.getByText("مدشن ومجاور لمزار الرفات المقدسة")).toBeDefined();

    // Liturgical usage
    expect(
      screen.getByText(/تقام عليه قداسات الفجر، نهضة الأنبا موسى الأسود السنوية/i)
    ).toBeDefined();
  });

  it("renders the Coptic Orthodox liturgical canon explanation box and navigation links", () => {
    render(<SanctuaryAltarsShowcase />);

    expect(
      screen.getByText("النظام الطقسي للمذابح في الكنيسة القبطية الأرثوذكسية")
    ).toBeDefined();

    expect(
      screen.getByText(/وفقاً للقوانين الكنسية الرسولية، لا تُقام الذبيحة الإلهية أكثر من مرة واحدة/i)
    ).toBeDefined();

    // Links to masses and altars detail
    const massScheduleLinks = screen.getAllByRole("link", { name: /قداسات هذا المذبح|جدول القداسات الأسبوعي/i });
    expect(massScheduleLinks.length).toBeGreaterThanOrEqual(1);
    expect(massScheduleLinks[0]?.getAttribute("href")).toBe("/masses");

    const altarsLinks = screen.getAllByRole("link", { name: /تفاصيل التدشين|استعراض مزارات المذابح/i });
    expect(altarsLinks.length).toBeGreaterThanOrEqual(1);
    expect(altarsLinks[0]?.getAttribute("href")).toBe("/about/altars");
  });
});
