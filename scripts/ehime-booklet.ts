/** 愛媛県「財政状況資料集」。2022– はリンク文言に市町名。2019–2021 は表の団体名列。 */

import type { LocalGov } from "../src/lib/catalog.ts";
import { parseCityBooklet } from "./okinawa-booklet.ts";

const FILE_HREF = /<a\s[^>]*href="([^"]+\.(?:xlsx|xlsb|xls|zip))"[^>]*>/gi;

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

/** 団体コード → Excel URL。リンク文言の市町名、なければ表の先頭セル。 */
export function parseEhimeBooklet(
  html: string,
  pageUrl: string,
  govs: readonly LocalGov[],
): Map<string, string> {
  const found = parseCityBooklet(html, pageUrl, govs);
  if (found.size === govs.length) return found;
  const byName = new Map(govs.map((gov) => [gov.city, gov.code]));
  for (const row of html.split(/<tr/iu).slice(1)) {
    const cells = [...row.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/giu)].map((m) => decodeEntities(m[1] ?? ""));
    const code = cells.map((cell) => byName.get(cell)).find((c) => c != null);
    if (code == null || found.has(code)) continue;
    FILE_HREF.lastIndex = 0;
    const href = FILE_HREF.exec(row)?.[1];
    if (href == null) continue;
    found.set(code, new URL(href, pageUrl).href);
  }
  return found;
}
