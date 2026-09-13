export const VIEW_IDS = ["year", "revenue", "expenditure"] as const;
export type ViewId = (typeof VIEW_IDS)[number];
export const DEFAULT_VIEW: ViewId = "year";

export const STREAM_SCALES = ["absolute", "relative"] as const;
export type StreamScale = (typeof STREAM_SCALES)[number];
export const DEFAULT_SCALE: StreamScale = "absolute";

const VIEW_QUERY: Record<string, ViewId> = {
  year: "year",
  revenue: "revenue",
  expenditure: "expenditure",
  "revenue-stream": "revenue",
  "expenditure-stream": "expenditure",
};

export interface PermalinkQuery {
  id: string | null;
  year: number | null;
  view: ViewId;
  scale: StreamScale;
}

export function parseView(raw: string | null): ViewId {
  return (raw != null ? VIEW_QUERY[raw] : undefined) ?? DEFAULT_VIEW;
}

export function parseScale(raw: string | null): StreamScale {
  return raw === "relative" ? "relative" : DEFAULT_SCALE;
}

export function parsePermalink(search: string): PermalinkQuery {
  const q = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  const idRaw = q.get("id");
  const yearRaw = q.get("year");
  const id = idRaw != null && idRaw.trim() !== "" ? idRaw.trim() : null;
  const year = yearRaw != null && /^\d{4}$/.test(yearRaw) ? Number(yearRaw) : null;
  return { id, year, view: parseView(q.get("view")), scale: parseScale(q.get("scale")) };
}

export function formatPermalink(
  id: string,
  year: number,
  view: ViewId = DEFAULT_VIEW,
  scale: StreamScale = DEFAULT_SCALE,
): string {
  const q = new URLSearchParams();
  q.set("id", id);
  q.set("year", String(year));
  if (view !== DEFAULT_VIEW) q.set("view", view);
  if (scale !== DEFAULT_SCALE) q.set("scale", scale);
  return `?${q.toString()}`;
}

export function snapYear(years: number[], requested: number | null): number {
  const last = years[years.length - 1];
  if (last == null) throw new Error("年度がない");
  if (requested == null) return last;
  if (years.includes(requested)) return requested;
  return years.reduce((best, year) =>
    Math.abs(year - requested) < Math.abs(best - requested) ? year : best,
  );
}
