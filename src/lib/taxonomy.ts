/** 普通会計の自主財源。それ以外の歳入葉は依存財源。 */
export const AUTONOMOUS_REVENUE = new Set([
  "地方税",
  "分担金・負担金",
  "使用料",
  "手数料",
  "財産収入",
  "寄附金",
  "繰入金",
  "繰越金",
  "諸収入",
]);

/** 財政状況資料集「歳入の状況」の葉。内訳行は含めない。 */
export const REVENUE_ITEMS = [
  "地方税",
  "地方譲与税",
  "利子割交付金",
  "配当割交付金",
  "株式等譲渡所得割交付金",
  "分離課税所得割交付金",
  "道府県民税所得割臨時交付金",
  "地方消費税交付金",
  "ゴルフ場利用税交付金",
  "特別地方消費税交付金",
  "自動車取得税交付金",
  "軽油引取税交付金",
  "自動車税環境性能割交付金",
  "法人事業税交付金",
  "地方特例交付金",
  "地方特例交付金等",
  "地方交付税",
  "交通安全対策特別交付金",
  "分担金・負担金",
  "使用料",
  "手数料",
  "国庫支出金",
  "国有提供交付金(特別区財調交付金)",
  "都道府県支出金",
  "財産収入",
  "寄附金",
  "繰入金",
  "繰越金",
  "諸収入",
  "地方債",
] as const;

const REVENUE_ITEM_SET = new Set<string>(REVENUE_ITEMS);

/** 目的別歳出の公式順。性質別は含めない。 */
export const PURPOSE_EXPENDITURE = [
  "議会費",
  "総務費",
  "民生費",
  "衛生費",
  "労働費",
  "農林水産業費",
  "商工費",
  "土木費",
  "消防費",
  "教育費",
  "災害復旧費",
  "公債費",
  "諸支出金",
  "前年度繰上充用金",
] as const;

export const PURPOSE_INDEX = new Map<string, number>(
  PURPOSE_EXPENDITURE.map((name, i) => [name, i]),
);

export function revenueGroup(item: string): "自主財源" | "依存財源" {
  return AUTONOMOUS_REVENUE.has(item) ? "自主財源" : "依存財源";
}

export function isRevenueLeaf(label: string): boolean {
  return REVENUE_ITEM_SET.has(label.trim());
}

export function normalizeRevenueName(label: string): string {
  const name = label.trim();
  if (name === "地方特例交付金") return "地方特例交付金等";
  return name;
}

/** streamgraph の層と色の正本。資料集の歳入葉から正規化前の別名を除く。 */
export const STREAM_REVENUE_ITEMS = REVENUE_ITEMS.filter(
  (name) => name === normalizeRevenueName(name),
);

export function isPurposeLeaf(label: string): boolean {
  return PURPOSE_INDEX.has(label.trim());
}
