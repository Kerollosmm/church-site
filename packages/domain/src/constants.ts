// packages/domain/src/constants.ts
// Fixed parish facts that are not part of the seeded database rows.

/** The parish's civil timezone. */
export const PARISH_TIME_ZONE = "Africa/Cairo";

/** Parish street address — the single source for address text and map links. */
export const PARISH_ADDRESS_AR = "شارع 45 بحري — العصافرة، حي ثان المنتزه، الإسكندرية";

/**
 * The parish's official display name (AGENTS.md "Project Identity"), for the places where the parish
 * itself is the subject rather than the website — e.g. the JSON-LD `Place` of an event held on parish
 * ground that names no smaller venue.
 */
export const PARISH_NAME_AR = "كنيسة القديسين مكسيموس ودوماديوس والشهيد الأنبا موسى الأسود";

/**
 * Google Maps search URL for the parish address, optionally narrowed by a venue/place name.
 *
 * A SEARCH url (not a routing URL) on purpose: the visitor's own starting point is unknown and must
 * never be inferred, so the link opens the map centred on the place. `encodeURIComponent` handles the
 * Arabic text and the comma the query contains.
 */
export function googleMapsDirectionsUrl(place?: string | null): string {
  const trimmed = place?.trim();
  const query = trimmed ? `${trimmed}، ${PARISH_ADDRESS_AR}` : PARISH_ADDRESS_AR;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}
