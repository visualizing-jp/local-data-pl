import { CATALOG } from "../src/lib/catalog.ts";

const XLSX_HREF = /<a\s[^>]*href="([^"]+\.xlsx)"[^>]*>([\s\S]*?)<\/a>/gi;

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

function cityLabel(html: string): string {
  return decodeEntities(html).replace(/（Excel.*$/u, "").trim();
}

function absUrl(pageUrl: string, href: string): string {
  return new URL(href, pageUrl).href;
}

const OKINAWA = CATALOG.filter((gov) => gov.prefecture === "沖縄県");

/** 県の資料集ページから、団体コード → Excel URL。 */
export function parseOkinawaBooklet(html: string, pageUrl: string): Map<string, string> {
  const byName = new Map(OKINAWA.map((gov) => [gov.city, gov.code]));
  const found = new Map<string, string>();
  for (const match of html.matchAll(XLSX_HREF)) {
    const href = match[1];
    const label = match[2];
    if (href == null || label == null) continue;
    const url = absUrl(pageUrl, href);
    const file = url.split("/").pop() ?? "";
    const coded = file.match(/^(\d{6})_/);
    const byFile = coded?.[1];
    const byCity = byName.get(cityLabel(label));
    const code = byFile ?? byCity;
    if (code == null) continue;
    if (!OKINAWA.some((gov) => gov.code === code)) continue;
    found.set(code, url);
  }
  return found;
}
