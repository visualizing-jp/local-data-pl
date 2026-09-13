/**
 * 財政状況資料集の「普通会計の状況」から歳入葉と目的別歳出を抜き、配信用 JSON にする。
 *
 *   npm run data
 */

import { mkdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import ExcelJS from "exceljs";
import { CATALOG, estatArea, type LocalGov } from "../src/lib/catalog.ts";
import { isPurposeLeaf, isRevenueLeaf, normalizeRevenueName, revenueGroup } from "../src/lib/taxonomy.ts";
import type { CityFinance, FlowItem } from "../src/lib/types.ts";
import { loadEstatFlows } from "./estat.ts";
import { AKITA_BOOKLET_PAGES, AOMORI_BOOKLET_PAGES, FUKUSHIMA_BOOKLET_PAGES, FUKUSHIMA_SKIP_EXCEL, HOKKAIDO_BOOKLET_YEAR, IBARAKI_BOOKLET_PAGES, IWATE_BOOKLET_PAGES, KANAGAWA_BOOKLET_PAGES, MIYAGI_BOOKLET_YEARS, OKINAWA_BOOKLET_PAGES, SAPPORO_CODE, SAPPORO_MIC_EXCEL, SENDAI_CODE, SENDAI_MIC_EXCEL, TOCHIGI_BOOKLET_PAGES, TOKYO_BOOKLET_YEARS, YAMAGATA_BOOKLET_PAGES } from "./sources.ts";

const RAW_DIR = resolve(import.meta.dirname, "../data/raw");
const OUT_DIR = resolve(import.meta.dirname, "../public/data");
const TOKYO_ESTAT_DIR = resolve(RAW_DIR, "estat-tokyo");
const KANAGAWA_ESTAT_DIR = resolve(RAW_DIR, "estat-kanagawa");
const HOKKAIDO_ESTAT_DIR = resolve(RAW_DIR, "estat-hokkaido");
const AOMORI_ESTAT_DIR = resolve(RAW_DIR, "estat-aomori");
const IWATE_ESTAT_DIR = resolve(RAW_DIR, "estat-iwate");
const MIYAGI_ESTAT_DIR = resolve(RAW_DIR, "estat-miyagi");
const AKITA_ESTAT_DIR = resolve(RAW_DIR, "estat-akita");
const YAMAGATA_ESTAT_DIR = resolve(RAW_DIR, "estat-yamagata");
const FUKUSHIMA_ESTAT_DIR = resolve(RAW_DIR, "estat-fukushima");
const IBARAKI_ESTAT_DIR = resolve(RAW_DIR, "estat-ibaraki");
const TOCHIGI_ESTAT_DIR = resolve(RAW_DIR, "estat-tochigi");
const OKINAWA_ESTAT_DIR = resolve(RAW_DIR, "estat-okinawa");
const TOKYO_EXCEL_YEARS = [2019, ...TOKYO_BOOKLET_YEARS] as const;

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
  if (gov.prefecture === "沖縄県") {
    return "2019–2024年度は沖縄県「財政状況資料集」の「普通会計の状況」。それ以前は現行団体コードで e-Stat に載る年度の地方財政状況調査（市町村分）。いずれも全国統一様式。";
  }
  if (gov.prefecture === "神奈川県") {
    return "2019–2024年度は神奈川県「財政状況資料集」の「普通会計の状況」。それ以前は現行団体コードで e-Stat に載る年度の地方財政状況調査（市町村分）。いずれも全国統一様式。";
  }
  if (gov.prefecture === "青森県") {
    return "2019–2024年度は青森県「財政状況資料集」の「普通会計の状況」。それ以前は現行団体コードで e-Stat に載る年度の地方財政状況調査（市町村分）。いずれも全国統一様式。";
  }
  if (gov.prefecture === "岩手県") {
    return "2019–2024年度は岩手県「財政状況資料集」の「普通会計の状況」。それ以前は現行団体コードで e-Stat に載る年度の地方財政状況調査（市町村分）。いずれも全国統一様式。";
  }
  if (gov.code === SENDAI_CODE) {
    return "2019–2024年度は総務省「財政状況資料集」（政令指定都市）の「普通会計の状況」。それ以前は現行団体コードで e-Stat に載る年度の地方財政状況調査（市町村分）。いずれも全国統一様式。";
  }
  if (gov.prefecture === "宮城県") {
    return "2019–2024年度は宮城県「財政状況資料集」の「普通会計の状況」。それ以前は現行団体コードで e-Stat に載る年度の地方財政状況調査（市町村分）。いずれも全国統一様式。";
  }
  if (gov.prefecture === "秋田県") {
    return "2019–2024年度は秋田県「財政状況資料集」の「普通会計の状況」。それ以前は現行団体コードで e-Stat に載る年度の地方財政状況調査（市町村分）。いずれも全国統一様式。";
  }
  if (gov.prefecture === "山形県") {
    return "2019–2024年度は山形県「財政状況資料集」の「普通会計の状況」。それ以前は現行団体コードで e-Stat に載る年度の地方財政状況調査（市町村分）。いずれも全国統一様式。";
  }
  if (gov.prefecture === "福島県") {
    return "2019–2024年度は福島県「財政状況資料集」の「普通会計の状況」。それ以前は現行団体コードで e-Stat に載る年度の地方財政状況調査（市町村分）。いずれも全国統一様式。";
  }
  if (gov.prefecture === "茨城県") {
    return "2019–2024年度は茨城県「財政状況資料集」の「普通会計の状況」。それ以前は現行団体コードで e-Stat に載る年度の地方財政状況調査（市町村分）。いずれも全国統一様式。";
  }
  if (gov.prefecture === "栃木県") {
    return "2019–2024年度は栃木県「財政状況資料集」の「普通会計の状況」。それ以前は現行団体コードで e-Stat に載る年度の地方財政状況調査（市町村分）。いずれも全国統一様式。";
  }
  if (gov.code === SAPPORO_CODE) {
    return "2019–2024年度は総務省「財政状況資料集」（政令指定都市）の「普通会計の状況」。それ以前は現行団体コードで e-Stat に載る年度の地方財政状況調査（市町村分）。いずれも全国統一様式。";
  }
  if (gov.prefecture === "北海道") {
    return "2024年度は北海道「財政状況資料集」の「普通会計の状況」。2019–2023年度は道が最新年の ZIP だけを残すため公開がない。それ以前は現行団体コードで e-Stat に載る年度の地方財政状況調査（市町村分）。いずれも全国統一様式。";
  }
  if (gov.code === "132012") {
    return "2019年度は八王子市「財政状況資料集」、2020–2024年度は東京都「団体別資料集」の「普通会計の状況」。1989–2018年度はe-Stat APIの地方財政状況調査（市町村分）歳入内訳・歳出内訳。いずれも全国統一様式。";
  }
  if (gov.prefecture === "東京都") {
    return "2020–2024年度は東京都「団体別資料集」の「普通会計の状況」。2019年度は都の公開対象外。それ以前は現行団体コードで e-Stat に載る年度の地方財政状況調査（市町村分）。いずれも全国統一様式。";
  }
  throw new Error(`出典文がない: ${gov.prefecture} ${gov.city}`);
}

function estatDir(gov: LocalGov): string {
  if (gov.prefecture === "沖縄県") return OKINAWA_ESTAT_DIR;
  if (gov.prefecture === "神奈川県") return KANAGAWA_ESTAT_DIR;
  if (gov.prefecture === "北海道") return HOKKAIDO_ESTAT_DIR;
  if (gov.prefecture === "青森県") return AOMORI_ESTAT_DIR;
  if (gov.prefecture === "岩手県") return IWATE_ESTAT_DIR;
  if (gov.prefecture === "宮城県") return MIYAGI_ESTAT_DIR;
  if (gov.prefecture === "秋田県") return AKITA_ESTAT_DIR;
  if (gov.prefecture === "山形県") return YAMAGATA_ESTAT_DIR;
  if (gov.prefecture === "福島県") return FUKUSHIMA_ESTAT_DIR;
  if (gov.prefecture === "茨城県") return IBARAKI_ESTAT_DIR;
  if (gov.prefecture === "栃木県") return TOCHIGI_ESTAT_DIR;
  if (gov.prefecture === "東京都") return TOKYO_ESTAT_DIR;
  throw new Error(`e-Stat の置き場がない: ${gov.prefecture}`);
}

function excelJobs(gov: LocalGov): { year: number; path: string }[] {
  if (gov.prefecture === "沖縄県") {
    return Object.keys(OKINAWA_BOOKLET_PAGES).map((year) => ({
      year: Number(year),
      path: resolve(RAW_DIR, gov.code, `${year}.xlsx`),
    }));
  }
  if (gov.prefecture === "神奈川県") {
    return Object.keys(KANAGAWA_BOOKLET_PAGES).map((year) => ({
      year: Number(year),
      path: resolve(RAW_DIR, gov.code, `${year}.xlsx`),
    }));
  }
  if (gov.prefecture === "青森県") {
    return Object.keys(AOMORI_BOOKLET_PAGES).map((year) => ({
      year: Number(year),
      path: resolve(RAW_DIR, gov.code, `${year}.xlsx`),
    }));
  }
  if (gov.prefecture === "岩手県") {
    return Object.keys(IWATE_BOOKLET_PAGES).map((year) => ({
      year: Number(year),
      path: resolve(RAW_DIR, gov.code, `${year}.xlsx`),
    }));
  }
  if (gov.code === SENDAI_CODE) {
    return Object.keys(SENDAI_MIC_EXCEL).map((year) => ({
      year: Number(year),
      path: resolve(RAW_DIR, gov.code, `${year}.xlsx`),
    }));
  }
  if (gov.prefecture === "宮城県") {
    return MIYAGI_BOOKLET_YEARS.map((year) => ({
      year,
      path: resolve(RAW_DIR, gov.code, `${year}.xlsx`),
    }));
  }
  if (gov.prefecture === "秋田県") {
    return Object.keys(AKITA_BOOKLET_PAGES).map((year) => ({
      year: Number(year),
      path: resolve(RAW_DIR, gov.code, `${year}.xlsx`),
    }));
  }
  if (gov.prefecture === "山形県") {
    return Object.keys(YAMAGATA_BOOKLET_PAGES).map((year) => ({
      year: Number(year),
      path: resolve(RAW_DIR, gov.code, `${year}.xlsx`),
    }));
  }
  if (gov.prefecture === "福島県") {
    return Object.keys(FUKUSHIMA_BOOKLET_PAGES)
      .map((year) => ({
        year: Number(year),
        path: resolve(RAW_DIR, gov.code, `${year}.xlsx`),
      }))
      .filter((job) => !FUKUSHIMA_SKIP_EXCEL.has(`${gov.code}:${job.year}`));
  }
  if (gov.prefecture === "茨城県") {
    return Object.keys(IBARAKI_BOOKLET_PAGES).map((year) => ({
      year: Number(year),
      path: resolve(RAW_DIR, gov.code, `${year}.xlsx`),
    }));
  }
  if (gov.prefecture === "栃木県") {
    return Object.keys(TOCHIGI_BOOKLET_PAGES).map((year) => ({
      year: Number(year),
      path: resolve(RAW_DIR, gov.code, `${year}.xlsx`),
    }));
  }
  if (gov.code === SAPPORO_CODE) {
    return Object.keys(SAPPORO_MIC_EXCEL).map((year) => ({
      year: Number(year),
      path: resolve(RAW_DIR, gov.code, `${year}.xlsx`),
    }));
  }
  if (gov.prefecture === "北海道") {
    return [
      {
        year: HOKKAIDO_BOOKLET_YEAR,
        path: resolve(RAW_DIR, gov.code, `${HOKKAIDO_BOOKLET_YEAR}.xlsx`),
      },
    ];
  }
  if (gov.prefecture === "東京都") {
    return TOKYO_EXCEL_YEARS.map((year) => ({
      year,
      path: resolve(RAW_DIR, gov.code, `${year}.xlsx`),
    })).filter((job) => existsSync(job.path));
  }
  throw new Error(`資料集の置き場がない: ${gov.prefecture}`);
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
  const revenueByYear = new Map<number, FlowItem[]>();
  const expenditureByYear = new Map<number, FlowItem[]>();

  const estat = await loadEstatFlows({ dir: estatDir(gov), area: estatArea(gov.code) });
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

  for (const { year, path } of excelJobs(gov)) {
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
