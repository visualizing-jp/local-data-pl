/** 徳島県「徳島県内市町村の財政状況資料集」。1ページに全市町村の 2014–2024 が並ぶ。 */

import type { LocalGov } from "../src/lib/catalog.ts";
import { parseCityBooklet } from "./okinawa-booklet.ts";

const YEAR_SUFFIX: Readonly<Record<number, string>> = {
  2019: "R1",
  2020: "R2",
  2021: "R3",
  2022: "R4",
  2023: "R5",
  2024: "R6",
};

const FILE_HREF = /<a\s[^>]*href="([^"]+\.(?:xlsx|xlsb|xls|zip))"[^>]*>([\s\S]*?)<\/a>/gi;

function labelText(html: string): string {
  return html.replace(/<[^>]+>/g, "").replace(/\s+/g, "");
}

/** 指定年度（リンク文言の R1–R6）の団体コード → Excel URL。比較表は除く。 */
export function parseTokushimaBookletYear(
  html: string,
  pageUrl: string,
  govs: readonly LocalGov[],
  year: number,
): Map<string, string> {
  const suffix = YEAR_SUFFIX[year];
  if (suffix == null) throw new Error(`徳島県資料集: ${year}年度の接尾辞がない`);
  const kept: string[] = [];
  FILE_HREF.lastIndex = 0;
  for (const match of html.matchAll(FILE_HREF)) {
    const text = labelText(match[2] ?? "");
    if (!text.endsWith(suffix) || text.includes("比較表")) continue;
    kept.push(match[0]);
  }
  return parseCityBooklet(kept.join("\n"), pageUrl, govs);
}
