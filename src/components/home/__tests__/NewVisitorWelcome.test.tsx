// @vitest-environment jsdom
import React from "react";
import { afterEach, describe, it, expect, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { NewVisitorWelcome } from "../NewVisitorWelcome";

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("lucide-react", () => ({
  Calendar: () => <span data-testid="icon" />,
  MapPin: () => <span data-testid="icon" />,
  Users: () => <span data-testid="icon" />,
  Church: () => <span data-testid="icon" />,
  ArrowLeft: () => <span data-testid="icon" />,
  Sparkles: () => <span data-testid="icon" />,
  Heart: () => <span data-testid="icon" />,
  HelpCircle: () => <span data-testid="icon" />,
  CheckCircle2: () => <span data-testid="icon" />,
}));

describe("NewVisitorWelcome Component", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders the welcome heading and Arabic welcoming badge", () => {
    render(<NewVisitorWelcome />);

    // Arabic welcome heading
    const heading = screen.getByRole("heading", { name: "أول مرة تزور كنيستنا؟", level: 2 });
    expect(heading).toBeDefined();
    expect(heading.textContent).toContain("أول مرة تزور كنيستنا؟");

    // Welcome badge
    const badge = screen.getByText("أهلاً بك في بيتك الروحي");
    expect(badge).toBeDefined();

    // Friendly subtitle
    const subtitle = screen.getByText(/نرحب بك بفرح في بيت الله/i);
    expect(subtitle).toBeDefined();
  });

  it("renders the Psalm 5:7 scripture verse and citation", () => {
    render(<NewVisitorWelcome />);

    // Psalm 5:7 verse text
    const verse = screen.getByText(
      /«أَمَّا أَنَا فَبِكَثْرَةِ رَحْمَتِكَ أَدْخُلُ بَيْتَكَ\. أَسْجُدُ فِي هَيْكَلِ قُدْسِكَ بِخَوْفِكَ»/
    );
    expect(verse).toBeDefined();

    // Scripture reference
    const citation = screen.getByText("(مزمور 5: 7)");
    expect(citation).toBeDefined();
  });

  it("renders navigation links to /masses, /contact, /about/clergy, and /about/altars", () => {
    render(<NewVisitorWelcome />);

    // Masses link
    const massesLink = screen.getByRole("link", { name: /جدول القداسات الأسبوعي/i });
    expect(massesLink).toBeDefined();
    expect(massesLink.getAttribute("href")).toBe("/masses");

    // Contact links (card cta and bottom cta)
    const primaryContactLink = screen.getByRole("link", { name: /العنوان ووسائل التواصل/i });
    expect(primaryContactLink).toBeDefined();
    expect(primaryContactLink.getAttribute("href")).toBe("/contact");

    // Clergy guide link
    const clergyLink = screen.getByRole("link", { name: /دليل الكهنة ومواعيدهم/i });
    expect(clergyLink).toBeDefined();
    expect(clergyLink.getAttribute("href")).toBe("/about/clergy");

    // Altars link
    const altarsLink = screen.getByRole("link", { name: /المذابح وتاريخ الكنيسة/i });
    expect(altarsLink).toBeDefined();
    expect(altarsLink.getAttribute("href")).toBe("/about/altars");
  });

  it("renders the liturgical etiquette tips box with practical guidelines", () => {
    render(<NewVisitorWelcome />);

    // Etiquette section title
    const tipsHeader = screen.getByText("دليل الزائر لحضور الصلوات والقداسات الإلهية بسلام وخشوع");
    expect(tipsHeader).toBeDefined();

    // Etiquette tips points
    expect(screen.getByText("الحضور المبكر والسكينة")).toBeDefined();
    expect(screen.getByText("الوقار والحشمة في بيت الرب")).toBeDefined();
    expect(screen.getByText("الخشوع والوقوف أثناء الصلوات")).toBeDefined();
    expect(screen.getByText("نوال البركة المقدسة")).toBeDefined();
    expect(screen.getByText("الترحيب بالأسر والأطفال")).toBeDefined();
  });
});
