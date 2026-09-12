export interface PermalinkQuery {
  city: string | null;
  year: number | null;
}

export function parsePermalink(search: string): PermalinkQuery {
  const q = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  const cityRaw = q.get("city");
  const yearRaw = q.get("year");
  const city = cityRaw != null && cityRaw.trim() !== "" ? cityRaw.trim() : null;
  const year = yearRaw != null && /^\d{4}$/.test(yearRaw) ? Number(yearRaw) : null;
  return { city, year };
}

export function formatPermalink(city: string, year: number): string {
  const q = new URLSearchParams();
  q.set("city", city);
  q.set("year", String(year));
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
