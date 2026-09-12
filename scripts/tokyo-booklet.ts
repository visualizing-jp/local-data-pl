const XLSX_HREF = /<a\s[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;

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

function toAsciiDigits(raw: string): string {
  return raw.replace(/[０-９]/g, (ch) => String(ch.charCodeAt(0) - 0xff10));
}

function absUrl(pageUrl: string, href: string): string {
  return new URL(href, pageUrl).href;
}

function fiscalYear(label: string): number | null {
  const text = toAsciiDigits(decodeEntities(label));
  if (text.includes("令和元")) return 2019;
  const reiwa = text.match(/令和\s*(\d+)\s*年度/);
  if (reiwa) return 2018 + Number(reiwa[1]);
  return null;
}

/** 都の団体別資料集ページから、年度 → Excel URL。直近5年が載る。 */
export function parseTokyoBooklet(html: string, pageUrl: string): Map<number, string> {
  const start = html.indexOf("財政状況資料集");
  if (start < 0) throw new Error(`財政状況資料集の見出しがない: ${pageUrl}`);
  let chunk = html.slice(start);
  for (const stop of ["財務書類", "公営企業に係る", "○ 公営企業"]) {
    const at = chunk.indexOf(stop, 20);
    if (at > 0) {
      chunk = chunk.slice(0, at);
      break;
    }
  }
  const found = new Map<number, string>();
  for (const match of chunk.matchAll(XLSX_HREF)) {
    const href = match[1];
    const label = match[2];
    if (href == null || label == null) continue;
    const year = fiscalYear(label);
    if (year == null) continue;
    found.set(year, absUrl(pageUrl, href));
  }
  return found;
}
