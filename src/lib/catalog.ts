export type GovKind = "municipality" | "prefecture";

/**
 * URL とデータファイルの対応。自治体を足すときはここに1行足す。
 * `code` は総務省「全国地方公共団体コード」（6桁）。
 * https://www.soumu.go.jp/denshijiti/code.html
 */
export interface LocalGov {
  slug: string;
  code: string;
  city: string;
  prefecture: string;
  kind: GovKind;
  dataUrl: string;
}

function muni(
  slug: string,
  code: string,
  city: string,
  prefecture: string,
  dataUrl?: string,
): LocalGov {
  return {
    slug,
    code,
    city,
    prefecture,
    kind: "municipality",
    dataUrl: dataUrl ?? `/data/${code}.json`,
  };
}

/** 沖縄県の現行市町村。コードは県の財政状況資料集ファイル名（全国地方公共団体コード）に一致。 */
const OKINAWA: readonly LocalGov[] = [
  muni("naha", "472018", "那覇市", "沖縄県"),
  muni("ginowan", "472051", "宜野湾市", "沖縄県"),
  muni("ishigaki", "472077", "石垣市", "沖縄県"),
  muni("urasoe", "472085", "浦添市", "沖縄県"),
  muni("nago", "472093", "名護市", "沖縄県"),
  muni("itoman", "472107", "糸満市", "沖縄県"),
  muni("okinawa", "472115", "沖縄市", "沖縄県"),
  muni("tomigusuku", "472123", "豊見城市", "沖縄県"),
  muni("uruma", "472131", "うるま市", "沖縄県"),
  muni("miyako", "472140", "宮古島市", "沖縄県"),
  muni("nanjo", "472158", "南城市", "沖縄県"),
  muni("kunigami", "473014", "国頭村", "沖縄県"),
  muni("ogimi", "473022", "大宜味村", "沖縄県"),
  muni("higashi", "473031", "東村", "沖縄県"),
  muni("nakijin", "473065", "今帰仁村", "沖縄県"),
  muni("motobu", "473081", "本部町", "沖縄県"),
  muni("onna", "473111", "恩納村", "沖縄県"),
  muni("ginoza", "473138", "宜野座村", "沖縄県"),
  muni("kin", "473146", "金武町", "沖縄県"),
  muni("ie", "473154", "伊江村", "沖縄県"),
  muni("yomitan", "473243", "読谷村", "沖縄県"),
  muni("kadena", "473251", "嘉手納町", "沖縄県"),
  muni("chatan", "473260", "北谷町", "沖縄県"),
  muni("kitanakagusuku", "473278", "北中城村", "沖縄県"),
  muni("nakagusuku", "473286", "中城村", "沖縄県"),
  muni("nishihara", "473294", "西原町", "沖縄県"),
  muni("yonabaru", "473481", "与那原町", "沖縄県"),
  muni("haebaru", "473502", "南風原町", "沖縄県"),
  muni("tokashiki", "473537", "渡嘉敷村", "沖縄県"),
  muni("zamami", "473545", "座間味村", "沖縄県"),
  muni("aguni", "473553", "粟国村", "沖縄県"),
  muni("tonaki", "473561", "渡名喜村", "沖縄県"),
  muni("minamidaito", "473570", "南大東村", "沖縄県"),
  muni("kitadaito", "473588", "北大東村", "沖縄県"),
  muni("iheya", "473596", "伊平屋村", "沖縄県"),
  muni("izena", "473600", "伊是名村", "沖縄県"),
  muni("kumejima", "473618", "久米島町", "沖縄県"),
  muni("yaese", "473626", "八重瀬町", "沖縄県"),
  muni("tarama", "473758", "多良間村", "沖縄県"),
  muni("taketomi", "473812", "竹富町", "沖縄県"),
  muni("yonaguni", "473821", "与那国町", "沖縄県"),
];

export const CATALOG: readonly LocalGov[] = [
  muni("hachioji", "132012", "八王子市", "東京都", "/data/hachioji.json"),
  ...OKINAWA,
];

export const DEFAULT_GOV = CATALOG[0]!;

/** e-Stat の市町村コードは全国地方公共団体コードの先頭5桁。 */
export function estatArea(code: string): string {
  if (!/^\d{6}$/.test(code)) throw new Error(`団体コードが6桁ではない: ${code}`);
  return code.slice(0, 5);
}

export function lookupGov(id: string): LocalGov | undefined {
  const code = id.trim();
  if (!/^\d{6}$/.test(code)) return undefined;
  return CATALOG.find((gov) => gov.code === code);
}

export function govsByPrefecture(): { prefecture: string; govs: readonly LocalGov[] }[] {
  const groups: { prefecture: string; govs: LocalGov[] }[] = [];
  for (const gov of CATALOG) {
    const last = groups.at(-1);
    if (last?.prefecture === gov.prefecture) last.govs.push(gov);
    else groups.push({ prefecture: gov.prefecture, govs: [gov] });
  }
  return groups;
}
