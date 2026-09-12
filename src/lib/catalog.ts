export type GovKind = "municipality" | "prefecture";

/** URL とデータファイルの対応。自治体を足すときはここに1行足す。 */
export interface LocalGov {
  slug: string;
  code: string;
  city: string;
  prefecture: string;
  kind: GovKind;
  dataUrl: string;
}

export const CATALOG: readonly LocalGov[] = [
  {
    slug: "hachioji",
    code: "132012",
    city: "八王子市",
    prefecture: "東京都",
    kind: "municipality",
    dataUrl: "/data/hachioji.json",
  },
];

export const DEFAULT_GOV = CATALOG[0]!;

export function lookupGov(raw: string): LocalGov | undefined {
  const key = raw.trim();
  if (key === "") return undefined;
  const lower = key.toLowerCase();
  return CATALOG.find(
    (gov) =>
      gov.slug === lower ||
      gov.code === key ||
      gov.city === key ||
      `${gov.prefecture}${gov.city}` === key ||
      `${gov.prefecture} ${gov.city}` === key,
  );
}
