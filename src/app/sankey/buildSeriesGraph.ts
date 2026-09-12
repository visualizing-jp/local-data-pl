import type { CityFinance, FlowItem } from "../../lib/types.ts";
import { PURPOSE_INDEX, REVENUE_ITEMS } from "../../lib/taxonomy.ts";
import { MIN_SHARE, itemsForYear, type GraphLink } from "./buildGraph.ts";

export type SeriesKind = "revenue" | "expenditure";

export interface SeriesNode {
  id: string;
  label: string;
  item: string;
  year: number;
  kind: SeriesKind;
  value: number;
  order: number;
  yearTotal: number;
  edge: "first" | "last" | "mid";
}

export interface SeriesGraph {
  kind: SeriesKind;
  years: number[];
  firstTotal: number;
  lastTotal: number;
  nodes: SeriesNode[];
  links: GraphLink[];
}

const REVENUE_INDEX = new Map<string, number>(REVENUE_ITEMS.map((name, i) => [name, i]));

function itemOrder(kind: SeriesKind, item: string): number {
  if (kind === "expenditure") return PURPOSE_INDEX.get(item) ?? 99;
  return REVENUE_INDEX.get(item) ?? 99;
}

function yearTotal(rows: FlowItem[]): number {
  return rows.reduce((sum, row) => sum + row.value, 0);
}

export function buildSeriesGraph(data: CityFinance, kind: SeriesKind): SeriesGraph {
  const source = kind === "revenue" ? data.revenue : data.expenditure;
  const years = data.years;
  const nodes: SeriesNode[] = [];
  const links: GraphLink[] = [];
  const present = new Set<string>();
  const totals = new Map<number, number>();
  const firstYear = years[0];
  const lastYear = years[years.length - 1];

  for (const year of years) {
    const rows = itemsForYear(source, year);
    const total = yearTotal(rows);
    totals.set(year, total);
    const threshold = total * MIN_SHARE;
    const edge = year === firstYear ? "first" : year === lastYear ? "last" : "mid";
    for (const row of rows) {
      if (row.value < threshold) continue;
      const id = `${year}:${row.item}`;
      nodes.push({
        id,
        label: row.item,
        item: row.item,
        year,
        kind,
        value: row.value,
        order: itemOrder(kind, row.item),
        yearTotal: total,
        edge,
      });
      present.add(id);
    }
  }

  for (let i = 0; i < years.length - 1; i++) {
    const from = years[i];
    const to = years[i + 1];
    if (from == null || to == null) continue;
    const nextRows = itemsForYear(source, to);
    const nextTotal = totals.get(to) ?? 0;
    const threshold = nextTotal * MIN_SHARE;
    for (const row of nextRows) {
      if (row.value < threshold) continue;
      const sourceId = `${from}:${row.item}`;
      const targetId = `${to}:${row.item}`;
      if (!present.has(sourceId) || !present.has(targetId)) continue;
      links.push({ source: sourceId, target: targetId, value: row.value });
    }
  }

  return {
    kind,
    years,
    firstTotal: totals.get(firstYear ?? 0) ?? 0,
    lastTotal: totals.get(lastYear ?? 0) ?? 0,
    nodes,
    links,
  };
}
