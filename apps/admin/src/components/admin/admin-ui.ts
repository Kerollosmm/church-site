// apps/admin/src/components/admin/admin-ui.ts
// The admin area's shared class strings and layout constants — PURE (no React, no state).

/** The project-wide visible focus ring (same treatment the events surfaces use). */
export const ADMIN_FOCUS_RING =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-copticNavy-500";

/** The shell every admin panel is drawn in. */
export const ADMIN_PANEL = "rounded-2xl border border-slate-200 bg-white p-5 shadow-xs sm:p-6";

/** A section heading inside a panel (the page's own `<h1>` is drawn by the page header). */
export const ADMIN_SECTION_HEADING = "font-heading text-base font-bold text-copticNavy";

export const ADMIN_LABEL = "block font-heading text-xs font-bold text-slate-700";

export const ADMIN_INPUT =
  "w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-copticNavy placeholder:text-slate-400 transition focus:border-copticNavy-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-copticNavy-500 disabled:bg-slate-100";

/** Added to a control whose field carries an error (the border, not just the message, changes). */
export const ADMIN_INPUT_INVALID = "border-red-400 bg-red-50";

export const ADMIN_HINT = "mt-1 text-[11px] leading-relaxed text-slate-500";

export const ADMIN_ERROR_TEXT = "mt-1 flex items-start gap-1 text-[11px] font-bold text-red-700";

export const ADMIN_BUTTON_BASE = `inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-2 font-heading text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none ${ADMIN_FOCUS_RING}`;

export const ADMIN_BUTTON_PRIMARY = `${ADMIN_BUTTON_BASE} bg-copticNavy text-white hover:bg-copticNavy-700`;

export const ADMIN_BUTTON_SECONDARY = `${ADMIN_BUTTON_BASE} border border-slate-300 bg-white text-copticNavy hover:bg-slate-50`;

export const ADMIN_BUTTON_DANGER = `${ADMIN_BUTTON_BASE} bg-red-600 text-white hover:bg-red-700`;

export const ADMIN_BUTTON_QUIET = `inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 font-heading text-[11px] font-bold text-copticNavy transition hover:bg-copticGold-50 disabled:cursor-not-allowed disabled:opacity-60 ${ADMIN_FOCUS_RING}`;

export const ADMIN_BADGE = "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold";

/** The table treatment the admin lists share (not the public cards). */
export const ADMIN_TABLE = "w-full border-collapse text-right text-xs";
export const ADMIN_TH = "border-b border-slate-200 pb-2 pe-3 font-heading text-[11px] font-bold text-slate-500";
export const ADMIN_TD = "border-b border-slate-100 py-3 pe-3 align-top text-slate-700";
