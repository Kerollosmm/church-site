import React from "react";
import { getWeeklyMasses } from "@/lib/queries";
import { getNextMass, type ScheduledMassLike } from "@/lib/utils/mass-schedule";
import { MassCountdownTicker } from "@/components/home/MassCountdownTicker";

/**
 * "Next liturgy" card.
 *
 * The liturgy, its day, its altar and its start time all come from the published weekly
 * schedule (database when configured, seeded baseline otherwise) and are resolved in the
 * parish timezone by `getNextMass`. When no active liturgy is scheduled the card renders
 * nothing — a decorative countdown that invents a "next mass" is never shown.
 */
export async function NextMassCountdown() {
  let masses: readonly ScheduledMassLike[] = [];

  try {
    masses = await getWeeklyMasses();
  } catch (err) {
    console.error("Next mass lookup failed:", err);
    return null;
  }

  const nextMass = getNextMass(masses);
  if (!nextMass) return null;

  return <MassCountdownTicker nextMass={nextMass} />;
}
