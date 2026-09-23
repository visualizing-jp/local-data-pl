/** 福岡県「財政状況資料集」。政令市を除く市町村。リンク文言は市町名。 */

import type { LocalGov } from "../src/lib/catalog.ts";
import { parseCityBooklet } from "./okinawa-booklet.ts";

/** 団体コード → Excel URL。ゼロ幅文字を除いてから共通パーサへ。 */
export function parseFukuokaBooklet(
  html: string,
  pageUrl: string,
  govs: readonly LocalGov[],
): Map<string, string> {
  return parseCityBooklet(html.replace(/\u200b/gu, ""), pageUrl, govs);
}
