/** 高知県「市町村財政状況資料集」。リンク文言は「01 高知市」や「01高知市[XLSX：794KB]」。 */

import type { LocalGov } from "../src/lib/catalog.ts";
import { parseCityBooklet } from "./okinawa-booklet.ts";

/** 団体コード → Excel URL。番号接頭辞・XLSX 括弧・旧字体の檮を正規化してから共通パーサへ。 */
export function parseKochiBooklet(
  html: string,
  pageUrl: string,
  govs: readonly LocalGov[],
): Map<string, string> {
  const normalized = html
    .replace(/檮/gu, "梼")
    .replace(/\[XLSX[^\]]*\]/giu, "[Excel]")
    .replace(/(市|町|村)_+(?=<\/)/gu, "$1");
  return parseCityBooklet(normalized, pageUrl, govs);
}
