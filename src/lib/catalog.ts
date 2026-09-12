export type GovKind = "municipality" | "prefecture";

/**
 * URL とデータファイルの対応。自治体を足すときはここに1行足す。
 * `code` は総務省「全国地方公共団体コード」（6桁）。配信用 JSON は `/data/{code}.json`。
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

function muni(slug: string, code: string, city: string, prefecture: string): LocalGov {
  return {
    slug,
    code,
    city,
    prefecture,
    kind: "municipality",
    dataUrl: `/data/${code}.json`,
  };
}

/** 東京都の現行区市町村。slug は都「団体別資料集」のパス。 */
const TOKYO: readonly LocalGov[] = [
  muni("chiyoda", "131016", "千代田区", "東京都"),
  muni("chuo", "131024", "中央区", "東京都"),
  muni("minato", "131032", "港区", "東京都"),
  muni("shinzyuku", "131041", "新宿区", "東京都"),
  muni("bunkyo", "131059", "文京区", "東京都"),
  muni("taito", "131067", "台東区", "東京都"),
  muni("sumida", "131075", "墨田区", "東京都"),
  muni("koto", "131083", "江東区", "東京都"),
  muni("shinagawa", "131091", "品川区", "東京都"),
  muni("meguro", "131105", "目黒区", "東京都"),
  muni("ohta", "131113", "大田区", "東京都"),
  muni("setagaya", "131121", "世田谷区", "東京都"),
  muni("shibuya", "131130", "渋谷区", "東京都"),
  muni("nakano", "131148", "中野区", "東京都"),
  muni("suginami", "131156", "杉並区", "東京都"),
  muni("toshima", "131164", "豊島区", "東京都"),
  muni("kita", "131172", "北区", "東京都"),
  muni("arakawa", "131181", "荒川区", "東京都"),
  muni("itabashi", "131199", "板橋区", "東京都"),
  muni("nerima", "131202", "練馬区", "東京都"),
  muni("adachi", "131211", "足立区", "東京都"),
  muni("katsushika", "131229", "葛飾区", "東京都"),
  muni("edogawa", "131237", "江戸川区", "東京都"),
  muni("hachiouzi", "132012", "八王子市", "東京都"),
  muni("tachikawa", "132021", "立川市", "東京都"),
  muni("musashino", "132039", "武蔵野市", "東京都"),
  muni("mitaka", "132047", "三鷹市", "東京都"),
  muni("ome", "132055", "青梅市", "東京都"),
  muni("huchu", "132063", "府中市", "東京都"),
  muni("akishima", "132071", "昭島市", "東京都"),
  muni("chouhu", "132080", "調布市", "東京都"),
  muni("machida", "132098", "町田市", "東京都"),
  muni("koganei", "132101", "小金井市", "東京都"),
  muni("kodaira", "132110", "小平市", "東京都"),
  muni("hino", "132128", "日野市", "東京都"),
  muni("higashimurayama", "132136", "東村山市", "東京都"),
  muni("kokubunzi", "132144", "国分寺市", "東京都"),
  muni("kunitachi", "132152", "国立市", "東京都"),
  muni("hussa", "132187", "福生市", "東京都"),
  muni("komae", "132195", "狛江市", "東京都"),
  muni("higasiyamato", "132209", "東大和市", "東京都"),
  muni("kiyose", "132217", "清瀬市", "東京都"),
  muni("higasikurume", "132225", "東久留米市", "東京都"),
  muni("musashimurayama", "132233", "武蔵村山市", "東京都"),
  muni("tama", "132241", "多摩市", "東京都"),
  muni("inagi", "132250", "稲城市", "東京都"),
  muni("hamura", "132276", "羽村市", "東京都"),
  muni("akiruno", "132284", "あきる野市", "東京都"),
  muni("nishitoukyo", "132292", "西東京市", "東京都"),
  muni("mizuhomati", "133035", "瑞穂町", "東京都"),
  muni("hinode", "133051", "日の出町", "東京都"),
  muni("hinohara", "133078", "檜原村", "東京都"),
  muni("okutama", "133086", "奥多摩町", "東京都"),
  muni("oshima", "133612", "大島町", "東京都"),
  muni("toshimamura", "133621", "利島村", "東京都"),
  muni("nijima", "133639", "新島村", "東京都"),
  muni("koudushima", "133647", "神津島村", "東京都"),
  muni("miyake", "133817", "三宅村", "東京都"),
  muni("mikura", "133825", "御蔵島村", "東京都"),
  muni("hachijo", "134015", "八丈町", "東京都"),
  muni("aogashima", "134023", "青ヶ島村", "東京都"),
  muni("ogasawara", "134210", "小笠原村", "東京都"),
];

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

export const CATALOG: readonly LocalGov[] = [...TOKYO, ...OKINAWA];

const HACHIOJI = TOKYO.find((gov) => gov.code === "132012");
if (HACHIOJI == null) throw new Error("八王子市がカタログにない");
export const DEFAULT_GOV = HACHIOJI;

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
