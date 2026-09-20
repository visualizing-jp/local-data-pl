import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import {
  ESTAT_EXP_TOTAL,
  ESTAT_EXPENDITURE,
  ESTAT_PURPOSE,
  ESTAT_REVENUE,
} from "./sources.ts";
import { revenueGroup } from "../src/lib/taxonomy.ts";
import type { FlowItem } from "../src/lib/types.ts";

const DEFAULT_DIR = resolve(import.meta.dirname, "../data/raw");

interface EstatValue {
  "@cat01"?: string;
  "@cat03"?: string;
  "@time"?: string;
  "@area"?: string;
  $?: string;
}

interface EstatStatsData {
  GET_STATS_DATA?: {
    RESULT?: { STATUS?: number | string; ERROR_MSG?: string };
    STATISTICAL_DATA?: {
      DATA_INF?: { VALUE?: EstatValue | EstatValue[] };
    };
  };
}

function valuesOf(json: EstatStatsData, file: string): EstatValue[] {
  const result = json.GET_STATS_DATA?.RESULT;
  const status = result?.STATUS;
  if (status !== 0 && status !== "0") {
    throw new Error(`${file}: e-Stat ${result?.ERROR_MSG ?? "取得失敗"}`);
  }
  const raw = json.GET_STATS_DATA?.STATISTICAL_DATA?.DATA_INF?.VALUE;
  if (raw == null) return [];
  return Array.isArray(raw) ? raw : [raw];
}

function parseYear(time: string | undefined): number | null {
  if (time == null || time.length < 4) return null;
  const year = Number(time.slice(0, 4));
  return Number.isInteger(year) ? year : null;
}

function parseAmount(raw: string | undefined): number | null {
  if (raw == null) return null;
  const t = raw.trim();
  if (t === "" || t === "-" || t === "***" || t === "X" || t === "…") return null;
  const n = Number(t.replaceAll(",", ""));
  return Number.isFinite(n) ? n : null;
}

async function readJson(dir: string, file: string): Promise<EstatStatsData> {
  const text = await readFile(resolve(dir, file), "utf8");
  return JSON.parse(text) as EstatStatsData;
}

export async function loadEstatFlows(opts: {
  dir?: string;
  area: string;
}): Promise<{ revenue: FlowItem[]; expenditure: FlowItem[] }> {
  const dir = opts.dir ?? DEFAULT_DIR;
  if (!existsSync(resolve(dir, ESTAT_REVENUE.file))) {
    return { revenue: [], expenditure: [] };
  }
  const revenueJson = await readJson(dir, ESTAT_REVENUE.file);
  const revenue: FlowItem[] = [];
  for (const row of valuesOf(revenueJson, ESTAT_REVENUE.file)) {
    if (row["@area"] != null && row["@area"] !== opts.area) continue;
    const year = parseYear(row["@time"]);
    const item = ESTAT_REVENUE.cat01[row["@cat01"] as keyof typeof ESTAT_REVENUE.cat01];
    const value = parseAmount(row.$);
    if (year == null || item == null || value == null || value === 0) continue;
    const existing = revenue.find((x) => x.year === year && x.item === item);
    if (existing) existing.value += value;
    else revenue.push({ year, item, value, group: revenueGroup(item) });
  }

  const expenditure: FlowItem[] = [];
  const seen = new Set<string>();
  for (const table of ESTAT_EXPENDITURE) {
    const json = await readJson(dir, table.file);
    for (const row of valuesOf(json, table.file)) {
      if (row["@area"] != null && row["@area"] !== opts.area) continue;
      if (row["@cat03"] != null && row["@cat03"] !== ESTAT_EXP_TOTAL) continue;
      const year = parseYear(row["@time"]);
      const item = ESTAT_PURPOSE[row["@cat01"] as keyof typeof ESTAT_PURPOSE];
      const value = parseAmount(row.$);
      if (year == null || item == null || value == null || value === 0) continue;
      const key = `${year}:${item}`;
      if (seen.has(key)) continue;
      seen.add(key);
      expenditure.push({ year, item, value });
    }
  }

  return { revenue, expenditure };
}
