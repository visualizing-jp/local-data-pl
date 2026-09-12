/** 北海道「財政状況資料集」の ZIP 一覧。決算カード（団体名の ZIP）は除く。 */

const ZIP_HREF = /<a\s[^>]*href="([^"]+\.zip)"[^>]*>([\s\S]*?)<\/a>/gi;

function absUrl(pageUrl: string, href: string): string {
  return new URL(href, pageUrl).href;
}

function zipFile(url: string): string {
  try {
    return decodeURIComponent(url.split("/").pop() ?? "");
  } catch {
    return url.split("/").pop() ?? "";
  }
}

/** 資料集 ZIP の URL。ファイル名が `1_8.zip` のように ASCII のものだけ。 */
export function parseHokkaidoBookletZips(html: string, pageUrl: string): string[] {
  const found: string[] = [];
  const seen = new Set<string>();
  for (const match of html.matchAll(ZIP_HREF)) {
    const href = match[1];
    if (href == null) continue;
    const url = absUrl(pageUrl, href);
    const file = zipFile(url);
    if (!/^[0-9_]+\.zip$/i.test(file)) continue;
    if (seen.has(url)) continue;
    seen.add(url);
    found.push(url);
  }
  return found;
}

/** ZIP 内 Excel 名 `【財政状況資料集】_012092_夕張市_2024.xlsx` から団体コード。 */
export function codeFromHokkaidoExcelName(name: string): string | null {
  const hit = name.match(/_(\d{6})_/);
  return hit?.[1] ?? null;
}
