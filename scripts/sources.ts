export const DOWNLOAD_BASE =
  "https://www.city.hachioji.tokyo.jp/shisei/001/010/001/003/p007494_d/fil";

/** 都の公開対象外である 2019 年度を埋める八王子市サイトのファイル。 */
export const HACHIOJI_2019_FILE = "01zaiseijyoukyousyuu.xlsx";

/** 都の資料集は bot 風 UA を 403 にする。 */
export const FETCH_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

/** 東京都「団体別資料集」。slug はカタログと同じ。直近5か年（2020–2024）。 */
export const TOKYO_BOOKLET_BASE =
  "https://www.soumu.metro.tokyo.lg.jp/05gyousei/04kusichousonindex/04kusichousonzaisei/dantaibetsu";

export const TOKYO_BOOKLET_YEARS = [2020, 2021, 2022, 2023, 2024] as const;

export function tokyoBookletPage(slug: string): string {
  return `${TOKYO_BOOKLET_BASE}/${slug}/`;
}

/** 県の資料集が普通会計シートを欠く年は、団体サイトの完全版を使う。 */
export const EXCEL_OVERRIDES: Readonly<Record<string, string>> = {
  "472093:2023":
    "https://www.city.nago.okinawa.jp/articles/2018071000056/file_contents/R5_47293_2023.xlsx",
  "473600:2021": "https://www.vill.izena.okinawa.jp/userfiles/files/R3_zaiseisiryou.xlsx",
};

/** 神奈川県「財政状況資料集」（県内市町村）。2019–2024。 */
export const KANAGAWA_BOOKLET_PAGES: Readonly<Record<number, string>> = {
  2019: "https://www.pref.kanagawa.jp/docs/v2x/cnt/f360417/p1223729.html",
  2020: "https://www.pref.kanagawa.jp/docs/v2x/cnt/f360417/p1223734.html",
  2021: "https://www.pref.kanagawa.jp/docs/v2x/cnt/f360417/p1223741.html",
  2022: "https://www.pref.kanagawa.jp/docs/v2x/cnt/f360417/p1223744.html",
  2023: "https://www.pref.kanagawa.jp/docs/v2x/cnt/f360417/p1223748.html",
  2024: "https://www.pref.kanagawa.jp/docs/v2x/cnt/f360417/p1223752.html",
};

/** 沖縄県「財政状況資料集」（県内市町村）。2019–2024。 */
export const OKINAWA_BOOKLET_PAGES: Readonly<Record<number, string>> = {
  2019: "https://www.pref.okinawa.lg.jp/kensei/shinko/1016703/1016705/1016706/1022600/1016725/1016727.html",
  2020: "https://www.pref.okinawa.lg.jp/kensei/shinko/1016703/1016705/1016706/1022600/1016725/1016726.html",
  2021: "https://www.pref.okinawa.lg.jp/kensei/shinko/1016703/1016705/1016706/1022600/1016725/1026999.html",
  2022: "https://www.pref.okinawa.lg.jp/kensei/shinko/1016703/1016705/1016706/1022600/1016725/1028535.html",
  2023: "https://www.pref.okinawa.lg.jp/kensei/shinko/1016703/1016705/1016706/1022600/1016725/1034163.html",
  2024: "https://www.pref.okinawa.lg.jp/kensei/shinko/1016703/1016705/1016706/1022600/1016725/1039311.html",
};

export const ESTAT_REVENUE = {
  statsDataId: "0003173261",
  file: "estat-revenue.json",
  cdTab: "105900",
  /** 歳入の葉。合計・参考・一般財源等は含めない。 */
  cat01: {
    "1010": "地方税",
    "1020": "地方譲与税",
    "1130": "利子割交付金",
    "1140": "配当割交付金",
    "1150": "株式等譲渡所得割交付金",
    "1153": "分離課税所得割交付金",
    "1157": "道府県民税所得割臨時交付金",
    "1160": "地方消費税交付金",
    "1170": "ゴルフ場利用税交付金",
    "1180": "特別地方消費税交付金",
    "1190": "自動車取得税交付金",
    "1200": "軽油引取税交付金",
    "1210": "地方特例交付金等",
    "1300": "地方交付税",
    "1340": "交通安全対策特別交付金",
    "1350": "分担金・負担金",
    "1400": "使用料",
    "1490": "手数料",
    "1540": "国庫支出金",
    /** 資料集は国有提供と特別区財調を1行にしている。 */
    "1910": "国有提供交付金(特別区財調交付金)",
    "2450": "国有提供交付金(特別区財調交付金)",
    "1920": "都道府県支出金",
    "2130": "財産収入",
    "2190": "寄附金",
    "2220": "繰入金",
    "2230": "繰越金",
    "2260": "諸収入",
    "2440": "地方債",
  },
} as const;

export const ESTAT_PURPOSE = {
  "1010": "議会費",
  "1020": "総務費",
  "1090": "民生費",
  "1150": "衛生費",
  "1200": "労働費",
  "1230": "農林水産業費",
  "1290": "商工費",
  "1300": "土木費",
  "1410": "消防費",
  "1420": "教育費",
  "1540": "災害復旧費",
  "1760": "公債費",
  "1770": "諸支出金",
  "1810": "前年度繰上充用金",
} as const;

/** 性質別の「歳出合計」。目的別の総額だけを取る。 */
export const ESTAT_EXP_TOTAL = "130";

export const ESTAT_EXPENDITURE = [
  { statsDataId: "0003172923", file: "estat-exp-1.json", cat01: ["1010", "1020"] },
  { statsDataId: "0003172943", file: "estat-exp-2.json", cat01: ["1090", "1150"] },
  { statsDataId: "0003172924", file: "estat-exp-3.json", cat01: ["1200", "1230", "1290"] },
  { statsDataId: "0003172944", file: "estat-exp-4.json", cat01: ["1300"] },
  { statsDataId: "0003172925", file: "estat-exp-5.json", cat01: ["1410", "1420"] },
  { statsDataId: "0003172945", file: "estat-exp-6-late.json", cat01: ["1540", "1760", "1770", "1810"] },
  { statsDataId: "0003172926", file: "estat-exp-6-early.json", cat01: ["1540", "1760", "1770", "1810"] },
] as const;
