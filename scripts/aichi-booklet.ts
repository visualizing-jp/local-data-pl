/** 愛知県「財政状況資料集」。令和6年度は単独ページ、令和5–元は1ページに並ぶ。名古屋市は載らない。 */

import type { LocalGov } from "../src/lib/catalog.ts";
import { parseCityBooklet } from "./okinawa-booklet.ts";

const YEAR_HEADING = /<h[1-6][^>]*>\s*(?:令和(元|\d+)|平成(\d+))年度財政状況資料集/gi;

function reiwaToYear(token: string): number {
  return token === "元" ? 2019 : 2018 + Number(token);
}

function sectionForYear(html: string, year: number): string {
  const matches = [...html.matchAll(new RegExp(YEAR_HEADING.source, YEAR_HEADING.flags))];
  const idx = matches.findIndex((match) => match[1] != null && reiwaToYear(match[1]) === year);
  if (idx < 0) throw new Error(`愛知県資料集: ${year}年度の見出しがない`);
  const start = matches[idx]?.index;
  if (start == null) throw new Error(`愛知県資料集: ${year}年度の見出し位置がない`);
  const end = matches[idx + 1]?.index ?? html.length;
  return html.slice(start, end);
}

/** 指定年度の団体コード → Excel URL。平成の見出しで区切り、令和元が古い年を巻き込まない。 */
export function parseAichiBookletYear(
  html: string,
  pageUrl: string,
  govs: readonly LocalGov[],
  year: number,
): Map<string, string> {
  return parseCityBooklet(sectionForYear(html, year), pageUrl, govs);
}
