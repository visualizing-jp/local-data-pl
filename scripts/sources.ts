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
  "252140:2019": "https://www.city.maibara.lg.jp/material/files/group/8/R1zaiseizyoukyousiryou_01.xlsx",
  "282057:2022": "https://www.city.sumoto.lg.jp/uploaded/attachment/17401.xlsx",
  "282197:2021": "https://www.city.sanda.lg.jp/material/files/group/10/2021_zaiseijokyoshiryosyu.xlsx",
};

/** 県掲載が公会計シートのみで、市サイトも PDF しか無い。 */
export const HYOGO_SKIP_EXCEL: ReadonlySet<string> = new Set(["282251:2021"]);

/** 北海道内市町村の財政状況資料集。道サイトは最新年の ZIP だけを残す。札幌市は載らない。 */
export const HOKKAIDO_BOOKLET_PAGE =
  "https://www.pref.hokkaido.lg.jp/ss/scs/zaisei/shi-zaisei-4-1-0.html";

export const HOKKAIDO_BOOKLET_YEAR = 2024;

/** 札幌市は政令市のため道の ZIP に無い。総務省の政令指定都市資料集。 */
export const SAPPORO_MIC_EXCEL: Readonly<Record<number, string>> = {
  2019: "https://www.soumu.go.jp/main_content/000740640.xlsx",
  2020: "https://www.soumu.go.jp/main_content/000840033.xlsx",
  2021: "https://www.soumu.go.jp/main_content/000873233.xlsx",
  2022: "https://www.soumu.go.jp/main_content/000970303.xlsx",
  2023: "https://www.soumu.go.jp/main_content/000999765.xlsx",
  2024: "https://www.soumu.go.jp/main_content/001063423.xlsx",
};

export const SAPPORO_CODE = "011002";

/** 岩手県「財政状況資料集」（県内市町村 ZIP）。2019–2024。 */
export const IWATE_BOOKLET_INDEX =
  "https://www.pref.iwate.jp/kensei/seisaku/shichouson/zaisei/joukyou/index.html";

export const IWATE_BOOKLET_PAGES: Readonly<Record<number, string>> = {
  2019: "https://www.pref.iwate.jp/kensei/seisaku/shichouson/zaisei/joukyou/1040859.html",
  2020: "https://www.pref.iwate.jp/kensei/seisaku/shichouson/zaisei/joukyou/1053314.html",
  2021: "https://www.pref.iwate.jp/kensei/seisaku/shichouson/zaisei/joukyou/1063639.html",
  2022: "https://www.pref.iwate.jp/kensei/seisaku/shichouson/zaisei/joukyou/1073053.html",
  2023: "https://www.pref.iwate.jp/kensei/seisaku/shichouson/zaisei/joukyou/1082232.html",
  2024: "https://www.pref.iwate.jp/kensei/seisaku/shichouson/zaisei/joukyou/1097113.html",
};

/** 宮城県「財政状況資料集」。1ページに 2019–2024。仙台市は載らない。 */
export const MIYAGI_BOOKLET_PAGE = "https://www.pref.miyagi.jp/soshiki/sichouson/mieruka.html";

export const MIYAGI_BOOKLET_YEARS = [2019, 2020, 2021, 2022, 2023, 2024] as const;

/** 仙台市は政令市のため県ページに無い。総務省の政令指定都市資料集。 */
export const SENDAI_MIC_EXCEL: Readonly<Record<number, string>> = {
  2019: "https://www.soumu.go.jp/main_content/000740641.xlsx",
  2020: "https://www.soumu.go.jp/main_content/000839175.xlsx",
  2021: "https://www.soumu.go.jp/main_content/000873234.xlsx",
  2022: "https://www.soumu.go.jp/main_content/000970304.xlsx",
  2023: "https://www.soumu.go.jp/main_content/000999766.xlsx",
  2024: "https://www.soumu.go.jp/main_content/001063424.xlsx",
};

export const SENDAI_CODE = "041009";

/** 秋田県「財政状況資料集」（県内市町村）。2019–2024。 */
export const AKITA_BOOKLET_PAGES: Readonly<Record<number, string>> = {
  2019: "https://www.pref.akita.lg.jp/pages/archive/55843",
  2020: "https://www.pref.akita.lg.jp/pages/archive/63273",
  2021: "https://www.pref.akita.lg.jp/pages/archive/71434",
  2022: "https://www.pref.akita.lg.jp/pages/archive/80350",
  2023: "https://www.pref.akita.lg.jp/pages/archive/87876",
  2024: "https://www.pref.akita.lg.jp/pages/archive/94258",
};

/** 山形県「財政状況資料集」（県内市町村）。2019–2024。 */
export const YAMAGATA_BOOKLET_PAGES: Readonly<Record<number, string>> = {
  2019: "https://www.pref.yamagata.jp/020024/kensei/information/zaisei/zaiseijoukyou/siryou01.html",
  2020: "https://www.pref.yamagata.jp/020024/kensei/information/zaisei/zaiseijoukyou/siryou02.html",
  2021: "https://www.pref.yamagata.jp/020024/kensei/information/zaisei/zaiseijoukyou/shiryo03.html",
  2022: "https://www.pref.yamagata.jp/020024/kensei/information/zaisei/zaiseijoukyou/shiryo04.html",
  2023: "https://www.pref.yamagata.jp/020024/kensei/information/zaisei/zaiseijoukyou/shiryo05.html",
  2024: "https://www.pref.yamagata.jp/020024/kensei/information/zaisei/zaiseijoukyou/shiryo06.html",
};

/** 福島県「財政状況資料集」（県内市町村）。2019–2024。 */
export const FUKUSHIMA_BOOKLET_PAGES: Readonly<Record<number, string>> = {
  2019: "https://www.pref.fukushima.lg.jp/sec/01145b/31dantaibetsu-index.html",
  2020: "https://www.pref.fukushima.lg.jp/sec/01145b/02dantaibetsu-index.html",
  2021: "https://www.pref.fukushima.lg.jp/sec/01145b/03dantaibetsu-index.html",
  2022: "https://www.pref.fukushima.lg.jp/sec/01145b/04dantaibetsu-index.html",
  2023: "https://www.pref.fukushima.lg.jp/sec/01145b/05dantaibetsu-index.html",
  2024: "https://www.pref.fukushima.lg.jp/sec/01145b/06dantaibetsu-index.html",
};

/** 県の2019掲載が公会計シートのみで「普通会計の状況」が無い。 */
export const FUKUSHIMA_SKIP_EXCEL: ReadonlySet<string> = new Set(["073628:2019", "073644:2019", "074071:2019"]);

/** 現行団体としては載せない e-Stat の下限。揖斐川町は合併前の揖斐町コードを引き継ぐが、2004–2018 が無く途切れる。 */
export const ESTAT_MIN_YEAR: Readonly<Record<string, number>> = {
  "214021": 2019,
};

/** 茨城県「財政状況資料集」（県内市町村）。2019–2024。 */
export const IBARAKI_BOOKLET_PAGES: Readonly<Record<number, string>> = {
  2019: "https://www.pref.ibaraki.jp/somu/shichoson/zaisei/saisyutsubunnseki/r1/zaisei-jyokyo-shiryosyu.html",
  2020: "https://www.pref.ibaraki.jp/somu/shichoson/zaisei/saisyutsubunnseki/r2/zaisei-jyokyo-shiryosyu.html",
  2021: "https://www.pref.ibaraki.jp/somu/shichoson/zaisei/zaisei_jokyo_shiryoshu/r3.html",
  2022: "https://www.pref.ibaraki.jp/somu/shichoson/zaisei/zaisei_jokyo_shiryoshu/r4.html",
  2023: "https://www.pref.ibaraki.jp/somu/shichoson/zaisei/zaisei_jokyo_shiryoshu/r5.html",
  2024: "https://www.pref.ibaraki.jp/somu/shichoson/zaisei/zaisei_jokyo_shiryoshu/r6.html",
};

/** 栃木県「財政状況資料集」（県内市町）。2019–2024。 */
export const TOCHIGI_BOOKLET_PAGES: Readonly<Record<number, string>> = {
  2019: "https://www.pref.tochigi.lg.jp/a02/pref/shichouson/zaisei/r01zaiseisiryousyu.html",
  2020: "https://www.pref.tochigi.lg.jp/a02/pref/shichouson/zaisei/r02zaiseijoukyou.html",
  2021: "https://www.pref.tochigi.lg.jp/a02/pref/shichouson/zaisei/r03zaiseijoukyou.html",
  2022: "https://www.pref.tochigi.lg.jp/a02/pref/shichouson/zaisei/r04zaiseijoukyou.html",
  2023: "https://www.pref.tochigi.lg.jp/a02/pref/shichouson/zaisei/r05zaiseijoukyou.html",
  2024: "https://www.pref.tochigi.lg.jp/a02/pref/shichouson/zaisei/r06zaiseijoukyou.html",
};

/** 埼玉県「財政状況資料集」（県内市町村）。2019–2024。さいたま市は載らない。 */
export const SAITAMA_BOOKLET_PAGES: Readonly<Record<number, string>> = {
  2019: "https://www.pref.saitama.lg.jp/a0107/zaiseitantou/zaiseijyoukyousiryousyu-r1nendo.html",
  2020: "https://www.pref.saitama.lg.jp/a0107/zaiseitantou/zaiseijyoukyousiryousyu-r2nendo.html",
  2021: "https://www.pref.saitama.lg.jp/a0107/zaiseitantou/zaiseijyoukyousiryousyu-r3nendo.html",
  2022: "https://www.pref.saitama.lg.jp/a0107/zaiseitantou/zaiseijyoukyousiryousyu-r4nendo.html",
  2023: "https://www.pref.saitama.lg.jp/a0107/zaiseitantou/zaiseijyoukyousiryousyu-r5nendo.html",
  2024: "https://www.pref.saitama.lg.jp/a0107/zaiseitantou/zaiseijyoukyousiryousyu-r6nendo.html",
};

/** さいたま市は政令市のため県ページに無い。総務省の政令指定都市資料集。 */
export const SAITAMA_MIC_EXCEL: Readonly<Record<number, string>> = {
  2019: "https://www.soumu.go.jp/main_content/000740642.xlsx",
  2020: "https://www.soumu.go.jp/main_content/000841929.xlsx",
  2021: "https://www.soumu.go.jp/main_content/000873240.xlsx",
  2022: "https://www.soumu.go.jp/main_content/000970305.xlsx",
  2023: "https://www.soumu.go.jp/main_content/000999767.xlsx",
  2024: "https://www.soumu.go.jp/main_content/001063425.xlsx",
};

export const SAITAMA_CODE = "111007";

/** 千葉県「財政状況資料集」（県内市町村）。2019–2024。千葉市は載らない。 */
export const CHIBA_BOOKLET_PAGES: Readonly<Record<number, string>> = {
  2019: "https://www.pref.chiba.lg.jp/shichou/zaisei/zaiseijouhou/r1-zaiseijokyou.html",
  /** 県サイトの一覧は 404。Excel 本体は残っているので Wayback の目次から辿る。 */
  2020: "https://web.archive.org/web/20260130105019/https://www.pref.chiba.lg.jp/shichou/zaisei/zaiseijouhou/r2-zaiseijokyou.html",
  2021: "https://www.pref.chiba.lg.jp/shichou/zaisei/zaiseijouhou/r3-zaiseijokyou.html",
  2022: "https://www.pref.chiba.lg.jp/shichou/zaisei/zaiseijouhou/r4-zaiseijokyou.html",
  2023: "https://www.pref.chiba.lg.jp/shichou/zaisei/zaiseijouhou/r5-zaiseijokyou.html",
  2024: "https://www.pref.chiba.lg.jp/shichou/zaisei/zaiseijouhou/r6-zaiseijokyou.html",
};

/** 千葉市は政令市のため県ページに無い。総務省の政令指定都市資料集。 */
export const CHIBA_MIC_EXCEL: Readonly<Record<number, string>> = {
  2019: "https://www.soumu.go.jp/main_content/000740643.xlsx",
  2020: "https://www.soumu.go.jp/main_content/000839176.xlsx",
  2021: "https://www.soumu.go.jp/main_content/000873242.xlsx",
  2022: "https://www.soumu.go.jp/main_content/000970306.xlsx",
  2023: "https://www.soumu.go.jp/main_content/000999768.xlsx",
  2024: "https://www.soumu.go.jp/main_content/001063426.xlsx",
};

export const CHIBA_CODE = "121002";

/** 新潟県「財政状況資料集」（県内市町村）。2019–2024。新潟市も県ページにある。 */
export const NIIGATA_BOOKLET_PAGES: Readonly<Record<number, string>> = {
  2019: "https://www.pref.niigata.lg.jp/sec/shichouson/zaiseijyoukyou-shiryousyuu-r1.html",
  2020: "https://www.pref.niigata.lg.jp/sec/shichouson/zaiseijyoukyou-shiryousyuu-r2.html",
  2021: "https://www.pref.niigata.lg.jp/sec/shichouson/zaiseijyoukyou-shiryousyuu-r3.html",
  2022: "https://www.pref.niigata.lg.jp/sec/shichouson/zaiseijyoukyou-shiryousyuu-r4.html",
  2023: "https://www.pref.niigata.lg.jp/sec/shichouson/zaiseijyoukyou-shiryousyuu-r5.html",
  2024: "https://www.pref.niigata.lg.jp/sec/shichouson/zaiseijyoukyou-shiryousyuu-r6.html",
};

/** 富山県「財政状況資料集」（県内市町村）。2019–2024。政令市は無い。 */
export const TOYAMA_BOOKLET_PAGES: Readonly<Record<number, string>> = {
  2019: "https://www.pref.toyama.jp/140403/r1zaiseijoukyou.html",
  2020: "https://www.pref.toyama.jp/140403/r2zaiseijoukyou.html",
  2021: "https://www.pref.toyama.jp/140403/r3zaiseijoukyou.html",
  2022: "https://www.pref.toyama.jp/140403/r4zaiseijyoukyou.html",
  2023: "https://www.pref.toyama.jp/140403/r5zaiseijoukyou.html",
  2024: "https://www.pref.toyama.jp/140403/r6zaiseijoukyou.html",
};

/** 石川県「市町財政状況資料集」（県内市町）。2019–2024。政令市は無い。 */
export const ISHIKAWA_BOOKLET_PAGES: Readonly<Record<number, string>> = {
  2019: "https://www.pref.ishikawa.lg.jp/sichousien/hikakubunseki/r1.html",
  2020: "https://www.pref.ishikawa.lg.jp/sichousien/hikakubunseki/r2.html",
  2021: "https://www.pref.ishikawa.lg.jp/sichousien/hikakubunseki/r3.html",
  2022: "https://www.pref.ishikawa.lg.jp/sichousien/hikakubunseki/r4.html",
  2023: "https://www.pref.ishikawa.lg.jp/sichousien/hikakubunseki/r5.html",
  2024: "https://www.pref.ishikawa.lg.jp/sichousien/hikakubunseki/r6.html",
};

/** 福井県「財政状況資料集」（県内市町）。2019–2024。政令市は無い。令和元・2年度のパスだけ syuu。 */
export const FUKUI_BOOKLET_PAGES: Readonly<Record<number, string>> = {
  2019: "https://www.pref.fukui.lg.jp/doc/sityousinkou/r01zaiseisiryousyuu.html",
  2020: "https://www.pref.fukui.lg.jp/doc/sityousinkou/r02zaiseisiryousyuu.html",
  2021: "https://www.pref.fukui.lg.jp/doc/sityousinkou/r03zaiseisiryoushuu.html",
  2022: "https://www.pref.fukui.lg.jp/doc/sityousinkou/r04zaiseisiryoushuu.html",
  2023: "https://www.pref.fukui.lg.jp/doc/sityousinkou/r05zaiseisiryoushuu.html",
  2024: "https://www.pref.fukui.lg.jp/doc/sityousinkou/r06zaiseisiryoushuu.html",
};

/** 山梨県「財政状況資料集」（県内市町村）。2019–2024。政令市は無い。 */
export const YAMANASHI_BOOKLET_PAGES: Readonly<Record<number, string>> = {
  2019: "https://www.pref.yamanashi.jp/zaisei-k/r1zaiseijyoukyoushiryousyu.html",
  2020: "https://www.pref.yamanashi.jp/zaisei-k/r2zaiseijyoukyoushiryousyu.html",
  2021: "https://www.pref.yamanashi.jp/zaisei-k/r3zaiseijyoukyoushiryousyu.html",
  2022: "https://www.pref.yamanashi.jp/zaisei-k/r4zaiseijyoukyoushiryousyu.html",
  2023: "https://www.pref.yamanashi.jp/zaisei-k/r5zaiseijyoukyoushiryousyu.html",
  2024: "https://www.pref.yamanashi.jp/zaisei-k/r6zaiseijyoukyoushiryousyu.html",
};

/** 長野県「市町村財政状況資料集」（県内市町村）。2019–2024。政令市は無い。令和元年度のパスだけ siryosyu。 */
export const NAGANO_BOOKLET_PAGES: Readonly<Record<number, string>> = {
  2019: "https://www.pref.nagano.lg.jp/shichoson/kensei/shichoson/zaise/shiryo/r1zaiseisiryosyu.html",
  2020: "https://www.pref.nagano.lg.jp/shichoson/kensei/shichoson/zaise/shiryo/r2zaiseishiryoshu.html",
  2021: "https://www.pref.nagano.lg.jp/shichoson/kensei/shichoson/zaise/shiryo/r3zaiseishiryoshu.html",
  2022: "https://www.pref.nagano.lg.jp/shichoson/kensei/shichoson/zaise/shiryo/r4zaiseishiryoshu.html",
  2023: "https://www.pref.nagano.lg.jp/shichoson/kensei/shichoson/zaise/shiryo/r5zaiseishiryoshu.html",
  2024: "https://www.pref.nagano.lg.jp/shichoson/kensei/shichoson/zaise/shiryo/r6zaiseishiryoshu.html",
};

/** 岐阜県「財政状況資料集」（県内市町村）。2019–2024。政令市は無い。 */
export const GIFU_BOOKLET_PAGES: Readonly<Record<number, string>> = {
  2019: "https://www.pref.gifu.lg.jp/page/138476.html",
  2020: "https://www.pref.gifu.lg.jp/page/205378.html",
  2021: "https://www.pref.gifu.lg.jp/page/278047.html",
  2022: "https://www.pref.gifu.lg.jp/page/349680.html",
  2023: "https://www.pref.gifu.lg.jp/page/422551.html",
  2024: "https://www.pref.gifu.lg.jp/page/488987.html",
};

/** 静岡県「財政状況資料集」（県内市町）。2019–2024。静岡市・浜松市は載らない。 */
export const SHIZUOKA_BOOKLET_PAGES: Readonly<Record<number, string>> = {
  2019: "https://www.pref.shizuoka.jp/kensei/zaiseisuito/zaisei/1044537/1046000/1012199.html",
  2020: "https://www.pref.shizuoka.jp/kensei/zaiseisuito/zaisei/1044537/1046000/1012119.html",
  2021: "https://www.pref.shizuoka.jp/kensei/zaiseisuito/zaisei/1044537/1046000/1052939.html",
  2022: "https://www.pref.shizuoka.jp/kensei/zaiseisuito/zaisei/1044537/1046000/1062353.html",
  2023: "https://www.pref.shizuoka.jp/kensei/zaiseisuito/zaisei/1044537/1046000/1071186.html",
  2024: "https://www.pref.shizuoka.jp/kensei/zaiseisuito/zaisei/1044537/1046000/1081111.html",
};

/** 静岡市は政令市のため県ページに無い。総務省の政令指定都市資料集。 */
export const SHIZUOKA_MIC_EXCEL: Readonly<Record<number, string>> = {
  2019: "https://www.soumu.go.jp/main_content/000740648.xlsx",
  2020: "https://www.soumu.go.jp/main_content/000843289.xlsx",
  2021: "https://www.soumu.go.jp/main_content/000873249.xlsx",
  2022: "https://www.soumu.go.jp/main_content/000970310.xlsx",
  2023: "https://www.soumu.go.jp/main_content/000999773.xlsx",
  2024: "https://www.soumu.go.jp/main_content/001063431.xlsx",
};

export const SHIZUOKA_CODE = "221007";

/** 浜松市は政令市のため県ページに無い。総務省の政令指定都市資料集。 */
export const HAMAMATSU_MIC_EXCEL: Readonly<Record<number, string>> = {
  2019: "https://www.soumu.go.jp/main_content/000740649.xlsx",
  2020: "https://www.soumu.go.jp/main_content/000839180.xlsx",
  2021: "https://www.soumu.go.jp/main_content/000873250.xlsx",
  2022: "https://www.soumu.go.jp/main_content/000970311.xlsx",
  2023: "https://www.soumu.go.jp/main_content/000999774.xlsx",
  2024: "https://www.soumu.go.jp/main_content/001063432.xlsx",
};

export const HAMAMATSU_CODE = "221309";

/** 愛知県「財政状況資料集」（県内市町村）。2019–2024。名古屋市は載らない。令和5–元は1ページ。 */
export const AICHI_BOOKLET_PAGES: Readonly<Record<number, string>> = {
  2019: "https://www.pref.aichi.jp/soshiki/shichoson/0000054848.html",
  2020: "https://www.pref.aichi.jp/soshiki/shichoson/0000054848.html",
  2021: "https://www.pref.aichi.jp/soshiki/shichoson/0000054848.html",
  2022: "https://www.pref.aichi.jp/soshiki/shichoson/0000054848.html",
  2023: "https://www.pref.aichi.jp/soshiki/shichoson/0000054848.html",
  2024: "https://www.pref.aichi.jp/soshiki/shichoson/0000061122.html",
};

/** 名古屋市は政令市のため県ページに無い。総務省の政令指定都市資料集。 */
export const NAGOYA_MIC_EXCEL: Readonly<Record<number, string>> = {
  2019: "https://www.soumu.go.jp/main_content/000740650.xlsx",
  2020: "https://www.soumu.go.jp/main_content/000839181.xlsx",
  2021: "https://www.soumu.go.jp/main_content/000873252.xlsx",
  2022: "https://www.soumu.go.jp/main_content/000970312.xlsx",
  2023: "https://www.soumu.go.jp/main_content/000999775.xlsx",
  2024: "https://www.soumu.go.jp/main_content/001063433.xlsx",
};

export const NAGOYA_CODE = "231002";

/** 三重県「財政状況資料集」（県内市町）。2019–2024。政令市は無い。令和3年度だけ番号が飛ぶ。 */
export const MIE_BOOKLET_PAGES: Readonly<Record<number, string>> = {
  2019: "https://www.pref.mie.lg.jp/SHICHOS/HP/89248000001_00008.htm",
  2020: "https://www.pref.mie.lg.jp/SHICHOS/HP/89248000001_00009.htm",
  2021: "https://www.pref.mie.lg.jp/SHICHOS/HP/89248000001_00010.htm",
  2022: "https://www.pref.mie.lg.jp/SHICHOS/HP/89248000001_00012.htm",
  2023: "https://www.pref.mie.lg.jp/SHICHOS/HP/89248000001_00013.htm",
  2024: "https://www.pref.mie.lg.jp/SHICHOS/HP/89248000001_00014.htm",
};

/** 滋賀県「財政状況資料集」（県内市町）。2019–2024。政令市は無い。 */
export const SHIGA_BOOKLET_PAGES: Readonly<Record<number, string>> = {
  2019: "https://www.pref.shiga.lg.jp/bh00/9201.html",
  2020: "https://www.pref.shiga.lg.jp/bh00/9200.html",
  2021: "https://www.pref.shiga.lg.jp/bh00/9199.html",
  2022: "https://www.pref.shiga.lg.jp/bh00/9198.html",
  2023: "https://www.pref.shiga.lg.jp/bh00/9197.html",
  2024: "https://www.pref.shiga.lg.jp/bh00/23158.html",
};

/** 京都府「財政状況資料集」（府内市町村）。2019–2024。京都市は載らない。令和3だけパスが違う。 */
export const KYOTO_BOOKLET_PAGES: Readonly<Record<number, string>> = {
  2019: "https://www.pref.kyoto.jp/tiho/01zaiseijoukyou.html",
  2020: "https://www.pref.kyoto.jp/tiho/02zaiseijoukyou.html",
  2021: "https://www.pref.kyoto.jp/tiho/3nenndo/03zaiseizyoukyousiryousyuu.html",
  2022: "https://www.pref.kyoto.jp/tiho/04zaiseijoukyou.html",
  2023: "https://www.pref.kyoto.jp/tiho/05zaiseijoukyou.html",
  2024: "https://www.pref.kyoto.jp/tiho/06zaiseijoukyou.html",
};

/** 京都市は政令市のため府ページに無い。総務省の政令指定都市資料集。 */
export const KYOTO_MIC_EXCEL: Readonly<Record<number, string>> = {
  2019: "https://www.soumu.go.jp/main_content/000740651.xlsx",
  2020: "https://www.soumu.go.jp/main_content/000841930.xlsx",
  2021: "https://www.soumu.go.jp/main_content/000873253.xlsx",
  2022: "https://www.soumu.go.jp/main_content/000970897.xlsx",
  2023: "https://www.soumu.go.jp/main_content/000999776.xlsx",
  2024: "https://www.soumu.go.jp/main_content/001063434.xlsx",
};

export const KYOTO_CODE = "261009";

/** 大阪府「財政状況資料集」（府内市町村）。2019–2024。大阪市・堺市は載らない。年によってファイル名の表記が揺れる。 */
export const OSAKA_BOOKLET_PAGES: Readonly<Record<number, string>> = {
  2019: "https://www.pref.osaka.lg.jp/o040050/shichoson/zaiseijoukyo/01zaiseijyoukyou.html",
  2020: "https://www.pref.osaka.lg.jp/o040050/shichoson/zaiseijoukyo/02zaiseijyoukyou.html",
  2021: "https://www.pref.osaka.lg.jp/o040050/shichoson/zaiseijoukyo/03zaiseijyoukyou.html",
  2022: "https://www.pref.osaka.lg.jp/o040050/shichoson/zaiseijoukyo/04zaiseijyoukyo.html",
  2023: "https://www.pref.osaka.lg.jp/o040050/shichoson/zaiseijoukyo/05zaiseijyoukyo.html",
  2024: "https://www.pref.osaka.lg.jp/o040050/shichoson/zaiseijoukyo/06zaiseijoukyo.html",
};

/** 大阪市は政令市のため府ページに無い。総務省の政令指定都市資料集。 */
export const OSAKA_MIC_EXCEL: Readonly<Record<number, string>> = {
  2019: "https://www.soumu.go.jp/main_content/000740652.xlsx",
  2020: "https://www.soumu.go.jp/main_content/000839182.xlsx",
  2021: "https://www.soumu.go.jp/main_content/000873254.xlsx",
  2022: "https://www.soumu.go.jp/main_content/001001817.xlsx",
  2023: "https://www.soumu.go.jp/main_content/000999777.xlsx",
  2024: "https://www.soumu.go.jp/main_content/001063435.xlsx",
};

export const OSAKA_CODE = "271004";

/** 堺市は政令市のため府ページに無い。総務省の政令指定都市資料集。 */
export const SAKAI_MIC_EXCEL: Readonly<Record<number, string>> = {
  2019: "https://www.soumu.go.jp/main_content/000740653.xlsx",
  2020: "https://www.soumu.go.jp/main_content/000839183.xlsx",
  2021: "https://www.soumu.go.jp/main_content/000873255.xlsx",
  2022: "https://www.soumu.go.jp/main_content/000970899.xlsx",
  2023: "https://www.soumu.go.jp/main_content/000999778.xlsx",
  2024: "https://www.soumu.go.jp/main_content/001063436.xlsx",
};

export const SAKAI_CODE = "271403";

/** 兵庫県「財政状況資料集」（県内市町）。2019–2024。神戸市も県ページに載る。令和元年度だけパスが違う。 */
export const HYOGO_BOOKLET_PAGES: Readonly<Record<number, string>> = {
  2019: "https://web.pref.hyogo.lg.jp/kk25/01zaiseijoukyou1.html",
  2020: "https://web.pref.hyogo.lg.jp/kk25/zaiseijoukyoushiryou02.html",
  2021: "https://web.pref.hyogo.lg.jp/kk25/zaiseijoukyoushiryou03.html",
  2022: "https://web.pref.hyogo.lg.jp/kk25/zaiseijoukyoushiryou04.html",
  2023: "https://web.pref.hyogo.lg.jp/kk25/zaiseijoukyoushiryou05.html",
  2024: "https://web.pref.hyogo.lg.jp/kk25/zaiseijoukyoushiryou06.html",
};

/** 奈良県「財政状況資料集」（県内市町村）。2019–2024。令和5年度だけ古いパス。 */
export const NARA_BOOKLET_PAGES: Readonly<Record<number, string>> = {
  2019: "https://www.pref.nara.lg.jp/n006/p152010.html",
  2020: "https://www.pref.nara.lg.jp/n006/p152009.html",
  2021: "https://www.pref.nara.lg.jp/n006/p152008.html",
  2022: "https://www.pref.nara.lg.jp/n006/p152007.html",
  2023: "https://www.pref.nara.lg.jp/n006/68615.html",
  2024: "https://www.pref.nara.lg.jp/n006/p152004.html",
};

/** 群馬県「財政状況資料集」（県内市町村）。2019–2024。 */
export const GUNMA_BOOKLET_PAGES: Readonly<Record<number, string>> = {
  2019: "https://www.pref.gunma.jp/site/shichousonzai/14499.html",
  2020: "https://www.pref.gunma.jp/site/shichousonzai/14513.html",
  2021: "https://www.pref.gunma.jp/site/shichousonzai/197482.html",
  2022: "https://www.pref.gunma.jp/site/shichousonzai/636041.html",
  2023: "https://www.pref.gunma.jp/site/shichousonzai/692573.html",
  2024: "https://www.pref.gunma.jp/site/shichousonzai/749582.html",
};

/** 青森県「財政状況資料集」（県内市町村）。2019–2024。 */
export const AOMORI_BOOKLET_PAGES: Readonly<Record<number, string>> = {
  2019: "https://www.pref.aomori.lg.jp/soshiki/zaimu/shichoson/2019_zaisei_shiryousyuu.html",
  2020: "https://www.pref.aomori.lg.jp/soshiki/zaimu/shichoson/2020_zaisei_shiryousyuu.html",
  2021: "https://www.pref.aomori.lg.jp/soshiki/zaimu/shichoson/2021_zaisei_shiryousyuu.html",
  2022: "https://www.pref.aomori.lg.jp/soshiki/zaimu/shichoson/2022_zaisei_shiryousyuu.html",
  2023: "https://www.pref.aomori.lg.jp/soshiki/zaimu/shichoson/2023_zaisei_shiryousyuu.html",
  2024: "https://www.pref.aomori.lg.jp/soshiki/zaimu/shichoson/2024_zaisei_shiryousyuu.html",
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
