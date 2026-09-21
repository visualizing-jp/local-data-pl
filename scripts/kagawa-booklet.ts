/** 香川県「県内市町の財政状況資料集」。1ページに全市町の直近5年が並ぶ。リンク文言は R2 など年度のみ。 */

import type { LocalGov } from "../src/lib/catalog.ts";

const FILE_HREF = /<a\s[^>]*href="([^"]+\.(?:xlsx|xlsb|xls|zip))"[^>]*>([\s\S]*?)<\/a>/gi;

const LABEL_YEAR: Readonly<Record<string, number>> = {
  R元: 2019,
  R1: 2019,
  R2: 2020,
  R3: 2021,
  R4: 2022,
  R5: 2023,
  R6: 2024,
};

function decodeEntities(raw: string): string {
  return raw
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function yearFromLink(href: string, label: string): number | undefined {
  const fromFile = href.match(/_(2019|2020|2021|2022|2023|2024)\.(?:xlsx|xlsb|xls|zip)$/i)?.[1];
  if (fromFile != null) return Number(fromFile);
  const token = decodeEntities(label).match(/^R(?:元|[1-6])/u)?.[0];
  return token != null ? LABEL_YEAR[token] : undefined;
}

/** 指定年度の団体コード → Excel URL。表見出しの市町名で対応づける。Wayback URL は維持する。 */
export function parseKagawaBookletYear(
  html: string,
  pageUrl: string,
  govs: readonly LocalGov[],
  year: number,
): Map<string, string> {
  const byName = new Map(govs.map((gov) => [gov.city, gov.code]));
  const found = new Map<string, string>();
  for (const table of html.split(/<table/iu).slice(1)) {
    const heading = table.match(/<th[^>]*>([\s\S]*?)<\/th>/iu);
    const city = heading != null ? decodeEntities(heading[1] ?? "") : "";
    const code = byName.get(city);
    if (code == null) continue;
    FILE_HREF.lastIndex = 0;
    for (const match of table.matchAll(FILE_HREF)) {
      const href = match[1];
      const label = match[2];
      if (href == null || label == null) continue;
      if (yearFromLink(href, label) !== year) continue;
      found.set(code, new URL(href, pageUrl).href);
    }
  }
  return found;
}
