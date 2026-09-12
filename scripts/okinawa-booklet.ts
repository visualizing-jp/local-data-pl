import type { LocalGov } from "../src/lib/catalog.ts";

const FILE_HREF = /<a\s[^>]*href="([^"]+\.(?:xlsx|zip))"[^>]*>([\s\S]*?)<\/a>/gi;

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
  return decodeEntities(html)
    .replace(/[（(](?:Excel|エクセル|ZIP|zip).*$/iu, "")
    .replace(/[、,]+$/u, "")
    .trim();
}

function foldCity(name: string): string {
  return name.replace(/[ヶケ]/gu, "ケ");
}

function absUrl(pageUrl: string, href: string): string {
  return new URL(href, pageUrl).href;
}

/** 県の資料集ページから、団体コード → Excel URL。ファイル名の6桁か団体名で対応づける。 */
export function parseCityBooklet(html: string, pageUrl: string, govs: readonly LocalGov[]): Map<string, string> {
  const allowed = new Set(govs.map((gov) => gov.code));
  const byName = new Map(govs.map((gov) => [foldCity(gov.city), gov.code]));
  const found = new Map<string, string>();
  for (const match of html.matchAll(FILE_HREF)) {
    const href = match[1];
    const label = match[2];
    if (href == null || label == null) continue;
    const url = absUrl(pageUrl, href);
    const file = url.split("/").pop() ?? "";
    const coded = file.match(/^(\d{6})_/);
    const byFile = coded?.[1];
    const byCity = byName.get(foldCity(cityLabel(label)));
    const code = byFile ?? byCity;
    if (code == null || !allowed.has(code)) continue;
    found.set(code, url);
  }
  return found;
}
