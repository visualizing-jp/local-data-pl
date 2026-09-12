/** 宮城県「財政状況資料集」。1ページに 2019–2024 が並ぶ。仙台市は載らない。 */

import type { LocalGov } from "../src/lib/catalog.ts";
import { parseCityBooklet } from "./okinawa-booklet.ts";

const YEAR_HEADING = /<h[1-6][^>]*>\s*令和(元|\d+)年度の県内各市町村の財政状況資料集/gi;

function reiwaToYear(token: string): number {
  return token === "元" ? 2019 : 2018 + Number(token);
}

function sectionForYear(html: string, year: number): string {
  const matches = [...html.matchAll(new RegExp(YEAR_HEADING.source, YEAR_HEADING.flags))];
  const idx = matches.findIndex((match) => match[1] != null && reiwaToYear(match[1]) === year);
  if (idx < 0) throw new Error(`宮城県資料集: ${year}年度の見出しがない`);
  const start = matches[idx]?.index;
  if (start == null) throw new Error(`宮城県資料集: ${year}年度の見出し位置がない`);
  const end = matches[idx + 1]?.index ?? html.length;
  return html.slice(start, end);
}

/** 指定年度の団体コード → Excel / ZIP URL。 */
export function parseMiyagiBookletYear(
  html: string,
  pageUrl: string,
  govs: readonly LocalGov[],
  year: number,
): Map<string, string> {
  return parseCityBooklet(sectionForYear(html, year), pageUrl, govs);
}
