/** 福島県「財政状況資料集」。リンク文言は「資料集」だけで、団体名は直前のセル。 */

import type { LocalGov } from "../src/lib/catalog.ts";

const TD = /<td\b[^>]*>([\s\S]*?)<\/td>/gi;

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

function foldCity(name: string): string {
  return name.replace(/[ヶケ]/gu, "ケ");
}

function absUrl(pageUrl: string, href: string): string {
  return new URL(href, pageUrl).href;
}

/** 県の資料集ページから、団体コード → Excel URL。団体名セルと隣の Excel リンクを組にする。 */
export function parseFukushimaBooklet(html: string, pageUrl: string, govs: readonly LocalGov[]): Map<string, string> {
  const allowed = new Set(govs.map((gov) => gov.code));
  const byName = new Map(govs.map((gov) => [foldCity(gov.city), gov.code]));
  const found = new Map<string, string>();
  let pending: string | null = null;
  for (const match of html.matchAll(TD)) {
    const inner = match[1];
    if (inner == null) continue;
    const href = inner.match(/href="([^"]+\.xlsx)"/i)?.[1];
    const text = decodeEntities(inner);
    if (href != null) {
      const code = pending == null ? undefined : byName.get(foldCity(pending));
      if (code != null && allowed.has(code)) found.set(code, absUrl(pageUrl, href));
      pending = null;
      continue;
    }
    if (text !== "" && byName.has(foldCity(text))) pending = text;
    else if (text !== "") pending = null;
  }
  return found;
}
