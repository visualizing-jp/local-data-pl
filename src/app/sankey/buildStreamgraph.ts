import { stack, stackOffsetWiggle, stackOrderInsideOut } from "d3-shape";
import type { CityFinance } from "../../lib/types.ts";
import { PURPOSE_EXPENDITURE, PURPOSE_INDEX, STREAM_REVENUE_ITEMS } from "../../lib/taxonomy.ts";
import type { SeriesKind } from "../../lib/types.ts";

const REVENUE_INDEX = new Map<string, number>(STREAM_REVENUE_ITEMS.map((name, i) => [name, i]));

export interface StreamPoint {
  year: number;
  value: number;
  y0: number;
  y1: number;
}

export interface StreamLayer {
  item: string;
  order: number;
  points: StreamPoint[];
}

export interface StreamGraph {
  years: number[];
  totals: ReadonlyMap<number, number>;
  firstTotal: number;
  lastTotal: number;
  yMin: number;
  yMax: number;
  layers: StreamLayer[];
}

type StreamRow = { year: number } & Record<string, number>;

function itemOrder(kind: SeriesKind, item: string): number {
  if (kind === "expenditure") return PURPOSE_INDEX.get(item) ?? 99;
  return REVENUE_INDEX.get(item) ?? 99;
}

export function buildStream(data: CityFinance, kind: SeriesKind): StreamGraph {
  const years = data.years;
  const source = kind === "revenue" ? data.revenue : data.expenditure;
  const byYearItem = new Map<string, number>();
  const totals = new Map<number, number>();
  for (const row of source) {
    if (row.value <= 0) continue;
    byYearItem.set(`${row.year}:${row.item}`, row.value);
    totals.set(row.year, (totals.get(row.year) ?? 0) + row.value);
  }
  const items = kind === "revenue" ? [...STREAM_REVENUE_ITEMS] : [...PURPOSE_EXPENDITURE];
  const rows: StreamRow[] = years.map((year) => {
    const row: StreamRow = { year };
    for (const item of items) row[item] = byYearItem.get(`${year}:${item}`) ?? 0;
    return row;
  });

  const series = stack<StreamRow, string>()
    .keys(items)
    .value((d, key) => d[key] ?? 0)
    .order(stackOrderInsideOut)
    .offset(stackOffsetWiggle)(rows);

  const layers: StreamLayer[] = series.map((layer) => ({
    item: String(layer.key),
    order: itemOrder(kind, String(layer.key)),
    points: layer.map((point, i) => {
      const year = rows[i]?.year ?? 0;
      return {
        year,
        value: byYearItem.get(`${year}:${layer.key}`) ?? 0,
        y0: point[0],
        y1: point[1],
      };
    }),
  }));

  let yMin = Number.POSITIVE_INFINITY;
  let yMax = Number.NEGATIVE_INFINITY;
  for (const layer of layers) {
    for (const point of layer.points) {
      yMin = Math.min(yMin, point.y0, point.y1);
      yMax = Math.max(yMax, point.y0, point.y1);
    }
  }
  if (!Number.isFinite(yMin) || !Number.isFinite(yMax) || yMin === yMax) {
    yMin = 0;
    yMax = 1;
  }

  const firstYear = years[0];
  const lastYear = years[years.length - 1];
  return {
    years,
    totals,
    firstTotal: firstYear == null ? 0 : (totals.get(firstYear) ?? 0),
    lastTotal: lastYear == null ? 0 : (totals.get(lastYear) ?? 0),
    yMin,
    yMax,
    layers,
  };
}
