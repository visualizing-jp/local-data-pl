export type RevenueGroup = "自主財源" | "依存財源";
export type SeriesKind = "revenue" | "expenditure";

export interface FlowItem {
  year: number;
  item: string;
  value: number;
  group?: RevenueGroup;
}

export interface CityFinance {
  city: string;
  prefecture: string;
  code: string;
  unit: "千円";
  source: string;
  sourceDetail: string;
  years: number[];
  revenue: FlowItem[];
  expenditure: FlowItem[];
}
