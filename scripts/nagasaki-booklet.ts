/** 長崎県「財政状況資料集」(県内市町)。リンク文言は市町名。 */

import type { LocalGov } from "../src/lib/catalog.ts";
import { parseCityBooklet } from "./okinawa-booklet.ts";

/** 団体コード → Excel URL。諌/全角括弧/XLSX 表記を揃えてから共通パーサへ。 */
export function parseNagasakiBooklet(
  html: string,
  pageUrl: string,
  govs: readonly LocalGov[],
): Map<string, string> {
  const cleaned = html
    .replace(/諌/gu, "諫")
    .replace(/［/gu, "[")
    .replace(/］/gu, "]")
    .replace(/\(XLSX[^)]*\)/giu, "[Excel]");
  return parseCityBooklet(cleaned, pageUrl, govs);
}
