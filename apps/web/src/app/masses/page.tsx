import React from "react";
import { Metadata } from "next";
import { getAltars, getWeeklyMasses } from "@/lib/queries";
import { MassesExplorer } from "./MassesExplorer";

export const metadata: Metadata = {
  title: "جداول القداسات الإلهية والعشيات",
  description:
    "مواعيد القداسات الإلهية والعشيات الأسبوعية على مذابح كنيسة القديسين مكسيموس ودوماديوس والأنبا موسى الأسود بالعصافرة.",
};

/**
 * `/masses` — the schedule and the altar filter come from the typed data layer
 * (`getWeeklyMasses()`, `getAltars()`), which read the database and fall back to the seeded
 * baseline. The filters and the print view are interactive, so the view lives in a client child
 * that receives the data as props.
 */
export default async function MassesPage() {
  const [masses, altars] = await Promise.all([getWeeklyMasses(), getAltars()]);

  return (
    <MassesExplorer
      masses={masses}
      altars={altars.map((altar) => ({ id: altar.id, name_ar: altar.name_ar }))}
    />
  );
}
