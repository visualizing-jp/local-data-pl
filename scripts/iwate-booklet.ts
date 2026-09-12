/** 岩手県「財政状況資料集」の ZIP 一覧。分割 ZIP より全市町村一括を優先する。 */

const ZIP_HREF = /<a\s[^>]*href="([^"]+\.zip)"[^>]*>([\s\S]*?)<\/a>/gi;

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

function absUrl(pageUrl: string, href: string): string {
  return new URL(href, pageUrl).href;
}

function isBulk(label: string): boolean {
  return label.includes("一括");
}

/** 資料集 ZIP の URL。一括があればそれだけ、なければ分割 ZIP。 */
export function parseIwateBookletZips(html: string, pageUrl: string): string[] {
  const found: { url: string; bulk: boolean }[] = [];
  const seen = new Set<string>();
  for (const match of html.matchAll(ZIP_HREF)) {
    const href = match[1];
    const label = match[2];
    if (href == null || label == null) continue;
    const url = absUrl(pageUrl, href);
    if (seen.has(url)) continue;
    seen.add(url);
    found.push({ url, bulk: isBulk(decodeEntities(label)) });
  }
  const bulk = found.filter((item) => item.bulk);
  return (bulk.length > 0 ? bulk : found).map((item) => item.url);
}
