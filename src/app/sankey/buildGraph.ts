import type { CityFinance, FlowItem } from "../../lib/types.ts";
import { PURPOSE_INDEX } from "../../lib/taxonomy.ts";

export type NodeKind = "revenue" | "group" | "total" | "expenditure" | "balance";

export interface GraphNode {
  id: string;
  label: string;
  kind: NodeKind;
  value: number;
  order: number;
}

export interface GraphLink {
  source: string;
  target: string;
  value: number;
}

export interface YearGraph {
  year: number;
  total: number;
  expenditureTotal: number;
  balance: number;
  nodes: GraphNode[];
  links: GraphLink[];
}

export const MIN_SHARE = 0.0004;

export function itemsForYear(rows: FlowItem[], year: number): FlowItem[] {
  return rows.filter((row) => row.year === year && row.value > 0);
}

export function buildYearGraph(data: CityFinance, year: number): YearGraph {
  const revenue = itemsForYear(data.revenue, year);
  const expenditure = itemsForYear(data.expenditure, year).sort(
    (a, b) => (PURPOSE_INDEX.get(a.item) ?? 99) - (PURPOSE_INDEX.get(b.item) ?? 99),
  );
  const total = revenue.reduce((sum, row) => sum + row.value, 0);
  const expenditureTotal = expenditure.reduce((sum, row) => sum + row.value, 0);
  const balance = total - expenditureTotal;
  const threshold = total * MIN_SHARE;

  const nodes: GraphNode[] = [];
  const links: GraphLink[] = [];
  const addNode = (node: GraphNode) => {
    nodes.push(node);
  };

  const autonomous = revenue.filter((row) => row.group === "自主財源" && row.value >= threshold);
  const dependent = revenue.filter((row) => row.group !== "自主財源" && row.value >= threshold);
  const autoSum = autonomous.reduce((sum, row) => sum + row.value, 0);
  const depSum = dependent.reduce((sum, row) => sum + row.value, 0);

  autonomous.forEach((row, i) => {
    addNode({ id: `rev:${row.item}`, label: row.item, kind: "revenue", value: row.value, order: i });
    links.push({ source: `rev:${row.item}`, target: "group:自主財源", value: row.value });
  });
  dependent.forEach((row, i) => {
    addNode({
      id: `rev:${row.item}`,
      label: row.item,
      kind: "revenue",
      value: row.value,
      order: 100 + i,
    });
    links.push({ source: `rev:${row.item}`, target: "group:依存財源", value: row.value });
  });

  addNode({ id: "group:自主財源", label: "自主財源", kind: "group", value: autoSum, order: 0 });
  addNode({ id: "group:依存財源", label: "依存財源", kind: "group", value: depSum, order: 1 });
  addNode({ id: "total", label: "歳入歳出", kind: "total", value: total, order: 0 });
  links.push({ source: "group:自主財源", target: "total", value: autoSum });
  links.push({ source: "group:依存財源", target: "total", value: depSum });

  expenditure
    .filter((row) => row.value >= threshold)
    .forEach((row, i) => {
      addNode({
        id: `exp:${row.item}`,
        label: row.item,
        kind: "expenditure",
        value: row.value,
        order: PURPOSE_INDEX.get(row.item) ?? 50 + i,
      });
      links.push({ source: "total", target: `exp:${row.item}`, value: row.value });
    });

  if (Math.abs(balance) >= threshold) {
    addNode({
      id: "balance",
      label: balance >= 0 ? "形式収支（黒字）" : "形式収支（赤字）",
      kind: "balance",
      value: Math.abs(balance),
      order: 80,
    });
    links.push({ source: "total", target: "balance", value: Math.abs(balance) });
  }

  return { year, total, expenditureTotal, balance, nodes, links };
}

export function senToMillion(value: number): number {
  return Math.round(value / 1000);
}

const YEN_PER_MAN = 10_000;
const YEN_PER_OKU = 100_000_000;
const YEN_PER_CHO = 1_000_000_000_000;

function groupInt(n: number): string {
  return n.toLocaleString("ja-JP");
}

/** 千円を百万円に四捨五入し、兆・億・万で表記する。 */
export function formatYen(sen: number): string {
  const yen = senToMillion(sen) * 1_000_000;
  const abs = Math.abs(yen);
  if (abs === 0) return "0円";
  const cho = Math.floor(abs / YEN_PER_CHO);
  const oku = Math.floor((abs % YEN_PER_CHO) / YEN_PER_OKU);
  const man = Math.floor((abs % YEN_PER_OKU) / YEN_PER_MAN);
  let out = "";
  if (cho > 0) out += `${groupInt(cho)}兆`;
  if (oku > 0) out += `${groupInt(oku)}億`;
  if (man > 0) out += `${groupInt(man)}万`;
  return `${out}円`;
}

export function formatShare(value: number, total: number): string {
  if (total <= 0) return "—";
  return `${((value / total) * 100).toFixed(1)}%`;
}
