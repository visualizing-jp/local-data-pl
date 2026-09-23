/** 大分県「財政状況資料集」。1ページに 2019–2024 が並ぶ。 */

import type { LocalGov } from "../src/lib/catalog.ts";
import { parseCityBooklet } from "./okinawa-booklet.ts";

const FW_DIGITS: Readonly<Record<string, string>> = {
  "０": "0",
  "１": "1",
  "２": "2",
  "３": "3",
  "４": "4",
  "５": "5",
  "６": "6",
  "７": "7",
  "８": "8",
  "９": "9",
};

function headingText(inner: string): string {
  return inner
    .replace(/<[^>]+>/g, "")
    .replace(/[０-９]/gu, (ch) => FW_DIGITS[ch] ?? ch)
    .replace(/\s+/gu, "");
}

function headingYear(inner: string): number | undefined {
  const text = headingText(inner);
  const reiwa = text.match(/^令和(元|\d+)年度財政状況資料集/);
  if (reiwa?.[1] != null) return reiwa[1] === "元" ? 2019 : 2018 + Number(reiwa[1]);
  const heisei = text.match(/^平成(\d+)年度財政状況資料集/);
  if (heisei?.[1] != null) return 1988 + Number(heisei[1]);
  return undefined;
}

function sectionForYear(html: string, year: number): string {
  const matches = [...html.matchAll(/<h3[^>]*>([\s\S]*?)<\/h3>/gi)].filter(
    (match) => headingYear(match[1] ?? "") != null,
  );
  const idx = matches.findIndex((match) => headingYear(match[1] ?? "") === year);
  if (idx < 0) throw new Error(`大分県資料集: ${year}年度の見出しがない`);
  const start = matches[idx]?.index;
  if (start == null) throw new Error(`大分県資料集: ${year}年度の見出し位置がない`);
  const end = matches[idx + 1]?.index ?? html.length;
  return html.slice(start, end);
}

/** 指定年度の団体コード → Excel URL。全角数字と見出し内のアンカーを揃える。 */
export function parseOitaBookletYear(
  html: string,
  pageUrl: string,
  govs: readonly LocalGov[],
  year: number,
): Map<string, string> {
  return parseCityBooklet(sectionForYear(html, year), pageUrl, govs);
}
