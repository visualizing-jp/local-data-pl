/**
 * 財政状況資料集の「普通会計の状況」から歳入葉と目的別歳出を抜き、配信用 JSON にする。
 *
 *   npm run data
 */

import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import ExcelJS from "exceljs";
import { CATALOG, estatArea, type LocalGov } from "../src/lib/catalog.ts";
import { isPurposeLeaf, isRevenueLeaf, normalizeRevenueName, revenueGroup } from "../src/lib/taxonomy.ts";
import type { CityFinance, FlowItem } from "../src/lib/types.ts";
import { loadEstatFlows } from "./estat.ts";
import { EXCEL_SOURCES, OKINAWA_BOOKLET_PAGES } from "./sources.ts";

const RAW_DIR = resolve(import.meta.dirname, "../data/raw");
const OUT_DIR = resolve(import.meta.dirname, "../public/data");
const OKINAWA_ESTAT_DIR = resolve(RAW_DIR, "estat-okinawa");

function cellText(value: ExcelJS.CellValue): string {
  if (value == null) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "object" && "richText" in value) {
    return value.richText.map((t) => t.text).join("").trim();
  }
  if (typeof value === "object" && "text" in value && typeof value.text === "string") {
    return value.text.trim();
  }
  return "";
}

function cellNumber(value: ExcelJS.CellValue): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const t = value.trim().replaceAll(",", "");
    if (t === "" || t === "-") return null;
    const n = Number(t);
    return Number.isFinite(n) ? n : null;
  }
  if (value && typeof value === "object" && "result" in value) {
    return cellNumber(value.result as ExcelJS.CellValue);
  }
  return null;
}

interface SheetCell {
  r: number;
  c: number;
  text: string;
  num: number | null;
}

function flatten(ws: ExcelJS.Worksheet): SheetCell[] {
  const cells: SheetCell[] = [];
  ws.eachRow({ includeEmpty: false }, (row, r) => {
    row.eachCell({ includeEmpty: false }, (cell, c) => {
      const text = cellText(cell.value);
      const num = cellNumber(cell.value);
      if (text !== "" || num != null) cells.push({ r, c, text, num });
    });
  });
  return cells;
}

function firstNumberInBand(cells: SheetCell[], r: number, cMin: number, cMax: number): number | null {
  const same = cells
    .filter((x) => x.r === r && x.c > cMin && x.c < cMax && x.num != null)
    .sort((a, b) => a.c - b.c);
  return same[0]?.num ?? null;
}

function parseFiscalYear(cells: SheetCell[]): number {
  for (const cell of cells) {
    if (cell.text.includes("令和元年度")) return 2019;
    const reiwa = cell.text.match(/令和(\d+)年度/);
    if (reiwa) return 2018 + Number(reiwa[1]);
    if (cell.text.includes("平成元年度")) return 1989;
    const heisei = cell.text.match(/平成(\d+)年度/);
    if (heisei) return 1988 + Number(heisei[1]);
  }
  throw new Error("年度が見つからない");
}

function leftmost(cells: SheetCell[], pred: (cell: SheetCell) => boolean): SheetCell {
  const hits = cells.filter(pred).sort((a, b) => a.c - b.c || a.r - b.r);
  const hit = hits[0];
  if (!hit) throw new Error("必要な見出しセルがない");
  return hit;
}

function parseSheet(ws: ExcelJS.Worksheet, expectedYear: number): { revenue: FlowItem[]; expenditure: FlowItem[] } {
  const cells = flatten(ws);
  const year = parseFiscalYear(cells);
  if (year !== expectedYear) {
    throw new Error(`${ws.name}: ファイルは ${expectedYear} 年想定だがシートは ${year} 年度`);
  }

  const revenueHeader = leftmost(cells, (x) => x.text.includes("歳入の状況"));
  const taxDetail = leftmost(cells, (x) => x.text.includes("地方税の状況"));
  const purposeHeader = leftmost(cells, (x) => x.text.includes("目的別歳出"));
  const tax = leftmost(
    cells,
    (x) => x.text === "地方税" && x.c === revenueHeader.c && x.r > revenueHeader.r,
  );
  const revenueTotal = leftmost(
    cells,
    (x) => x.text === "歳入合計" && x.c === tax.c && x.r > tax.r,
  );

  const revenue: FlowItem[] = [];
  const seenRev = new Set<string>();
  for (const cell of cells) {
    if (cell.c !== tax.c) continue;
    if (cell.r < tax.r || cell.r > revenueTotal.r) continue;
    const raw = String(ws.getRow(cell.r).getCell(cell.c).value ?? "");
    if (!isRevenueLeaf(raw)) continue;
    const item = normalizeRevenueName(cell.text);
    if (seenRev.has(item)) continue;
    const value = firstNumberInBand(cells, cell.r, tax.c, taxDetail.c);
    if (value == null || value === 0) continue;
    seenRev.add(item);
    revenue.push({ year, item, value, group: revenueGroup(item) });
  }

  const natureHeader = cells.find((x) => x.text.includes("性質別歳出") && x.c >= purposeHeader.c);
  const gikai = leftmost(
    cells,
    (x) => x.text === "議会費" && x.c === purposeHeader.c && x.r >= purposeHeader.r,
  );
  const expTotal = leftmost(
    cells,
    (x) =>
      x.text === "歳出合計" &&
      x.c === gikai.c &&
      x.r > gikai.r &&
      (natureHeader == null || x.r < natureHeader.r),
  );

  const expenditure: FlowItem[] = [];
  for (const cell of cells) {
    if (cell.c !== gikai.c) continue;
    if (cell.r < gikai.r || cell.r >= expTotal.r) continue;
    if (!isPurposeLeaf(cell.text)) continue;
    const value = firstNumberInBand(cells, cell.r, gikai.c, gikai.c + 40);
    if (value == null || value === 0) continue;
    expenditure.push({ year, item: cell.text, value });
  }

  if (revenue.length === 0) throw new Error(`${year}: 歳入が空`);
  if (expenditure.length === 0) throw new Error(`${year}: 目的別歳出が空`);
  return { revenue, expenditure };
}

function logYear(gov: LocalGov, year: number, origin: string, revenue: FlowItem[], expenditure: FlowItem[]): void {
  const total = revenue.reduce((s, x) => s + x.value, 0);
  console.log(
    `${gov.city} ${year} [${origin}] 歳入 ${revenue.length} 項目 / 歳出 ${expenditure.length} 項目 / 歳入計 ${(total / 1000).toFixed(0)} 百万円`,
  );
}

function sourceDetail(gov: LocalGov): string {
  if (gov.code === "132012") {
    return "2019–2024年度は八王子市「財政状況資料集」の「普通会計の状況」。1989–2018年度はe-Stat APIの地方財政状況調査（市町村分）歳入内訳・歳出内訳。いずれも全国統一様式。";
  }
  return "2019–2024年度は沖縄県「財政状況資料集」の「普通会計の状況」。それ以前は現行団体コードで e-Stat に載る年度の地方財政状況調査（市町村分）。いずれも全国統一様式。";
}

async function parseExcel(path: string, year: number): Promise<{ revenue: FlowItem[]; expenditure: FlowItem[] }> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(path);
  const ws =
    wb.worksheets.find((sheet) => sheet.name.trim() === "普通会計の状況") ??
    wb.worksheets.find((sheet) => sheet.name.includes("普通会計の状況"));
  if (!ws) throw new Error(`${path}: シート「普通会計の状況」がない`);
  return parseSheet(ws, year);
}

async function buildGov(gov: LocalGov): Promise<CityFinance> {
  const estatDir = gov.prefecture === "沖縄県" ? OKINAWA_ESTAT_DIR : RAW_DIR;
  const revenueByYear = new Map<number, FlowItem[]>();
  const expenditureByYear = new Map<number, FlowItem[]>();

  const estat = await loadEstatFlows({ dir: estatDir, area: estatArea(gov.code) });
  for (const row of estat.revenue) {
    const list = revenueByYear.get(row.year) ?? [];
    list.push(row);
    revenueByYear.set(row.year, list);
  }
  for (const row of estat.expenditure) {
    const list = expenditureByYear.get(row.year) ?? [];
    list.push(row);
    expenditureByYear.set(row.year, list);
  }

  const excelYears =
    gov.code === "132012"
      ? EXCEL_SOURCES.map((s) => ({ year: s.year, path: resolve(RAW_DIR, s.file) }))
      : Object.keys(OKINAWA_BOOKLET_PAGES).map((y) => ({
          year: Number(y),
          path: resolve(RAW_DIR, gov.code, `${y}.xlsx`),
        }));

  for (const { year, path } of excelYears) {
    const parsed = await parseExcel(path, year);
    logYear(gov, year, "資料集", parsed.revenue, parsed.expenditure);
    revenueByYear.set(year, parsed.revenue);
    expenditureByYear.set(year, parsed.expenditure);
  }

  const years = [...new Set([...revenueByYear.keys(), ...expenditureByYear.keys()])]
    .sort((a, b) => a - b)
    .filter((year) => (revenueByYear.get(year)?.length ?? 0) > 0 && (expenditureByYear.get(year)?.length ?? 0) > 0);

  const revenue: FlowItem[] = [];
  const expenditure: FlowItem[] = [];
  for (const year of years) {
    revenue.push(...(revenueByYear.get(year) ?? []));
    expenditure.push(...(expenditureByYear.get(year) ?? []));
  }

  return {
    city: gov.city,
    prefecture: gov.prefecture,
    code: gov.code,
    unit: "千円",
    source: "総務省「地方財政状況調査」（市町村別決算状況調）",
    sourceDetail: sourceDetail(gov),
    years,
    revenue,
    expenditure,
  };
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  for (const gov of CATALOG) {
    const data = await buildGov(gov);
    const out = resolve(import.meta.dirname, `../public${gov.dataUrl}`);
    await writeFile(out, `${JSON.stringify(data, null, 2)}\n`, "utf8");
    console.log(`wrote ${out} (${data.years[0]}–${data.years.at(-1)}, ${data.years.length}年)`);
  }
}

await main();
