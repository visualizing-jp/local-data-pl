/**
 * 財政状況資料集 Excel と e-Stat を data/raw/ に取得する。
 *
 *   npm run fetch
 *   npm run fetch -- --force
 */

import { mkdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { CATALOG, estatArea } from "../src/lib/catalog.ts";
import { loadDotEnv } from "./env.ts";
import { parseCityBooklet } from "./okinawa-booklet.ts";
import { parseTokyoBooklet } from "./tokyo-booklet.ts";
import {
  DOWNLOAD_BASE,
  HACHIOJI_2019_FILE,
  ESTAT_EXP_TOTAL,
  ESTAT_EXPENDITURE,
  ESTAT_REVENUE,
  EXCEL_OVERRIDES,
  FETCH_UA,
  KANAGAWA_BOOKLET_PAGES,
  OKINAWA_BOOKLET_PAGES,
  TOKYO_BOOKLET_BASE,
  TOKYO_BOOKLET_YEARS,
  tokyoBookletPage,
} from "./sources.ts";

const RAW_DIR = resolve(import.meta.dirname, "../data/raw");
const TOKYO_ESTAT_DIR = resolve(RAW_DIR, "estat-tokyo");
const KANAGAWA_ESTAT_DIR = resolve(RAW_DIR, "estat-kanagawa");
const OKINAWA_ESTAT_DIR = resolve(RAW_DIR, "estat-okinawa");
const ESTAT_ENDPOINT = "https://api.e-stat.go.jp/rest/3.0/app/json/getStatsData";
const HACHIOJI_2019 = `${DOWNLOAD_BASE}/${HACHIOJI_2019_FILE}`;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function download(url: string, extraHeaders: Record<string, string> = {}): Promise<Buffer> {
  const res = await fetch(url, { headers: { "User-Agent": FETCH_UA, ...extraHeaders } });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText} for ${url}`);
  return Buffer.from(await res.arrayBuffer());
}

function requireAppId(): string {
  const appId = process.env["ESTAT_APP_ID"]?.trim();
  if (!appId) {
    throw new Error(
      "ESTAT_APP_ID が未設定です。.env.example をコピーして .env を作り、e-Stat のアプリケーションIDを入れてください。",
    );
  }
  return appId;
}

interface EstatPage {
  GET_STATS_DATA?: {
    RESULT?: { STATUS?: number | string; ERROR_MSG?: string };
    STATISTICAL_DATA?: {
      RESULT_INF?: { TOTAL_NUMBER?: number; TO_NUMBER?: number; NEXT_KEY?: string };
      DATA_INF?: { VALUE?: unknown };
    };
  };
}

async function fetchEstatPage(
  appId: string,
  statsDataId: string,
  extra: Record<string, string>,
  startPosition: number,
): Promise<EstatPage> {
  const url = new URL(ESTAT_ENDPOINT);
  url.searchParams.set("appId", appId);
  url.searchParams.set("statsDataId", statsDataId);
  url.searchParams.set("limit", "100000");
  url.searchParams.set("startPosition", String(startPosition));
  for (const [key, value] of Object.entries(extra)) url.searchParams.set(key, value);
  const res = await fetch(url, { headers: { "User-Agent": FETCH_UA } });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText} for ${statsDataId}`);
  const json = (await res.json()) as EstatPage;
  const status = json.GET_STATS_DATA?.RESULT?.STATUS;
  if (status !== 0 && status !== "0") {
    throw new Error(`${statsDataId}: ${json.GET_STATS_DATA?.RESULT?.ERROR_MSG ?? "e-Stat エラー"}`);
  }
  return json;
}

async function fetchEstat(
  appId: string,
  statsDataId: string,
  extra: Record<string, string>,
): Promise<string> {
  const first = await fetchEstatPage(appId, statsDataId, extra, 1);
  const values: unknown[] = [];
  const take = (page: EstatPage) => {
    const raw = page.GET_STATS_DATA?.STATISTICAL_DATA?.DATA_INF?.VALUE;
    if (raw == null) return;
    if (Array.isArray(raw)) values.push(...raw);
    else values.push(raw);
  };
  take(first);
  let page = first;
  while (true) {
    const inf = page.GET_STATS_DATA?.STATISTICAL_DATA?.RESULT_INF;
    const total = inf?.TOTAL_NUMBER ?? 0;
    const to = inf?.TO_NUMBER ?? 0;
    const nextKey = inf?.NEXT_KEY;
    if (nextKey) {
      await sleep(400);
      page = await fetchEstatPage(appId, statsDataId, extra, Number(nextKey));
      take(page);
      continue;
    }
    if (total > 0 && to > 0 && to < total) {
      await sleep(400);
      page = await fetchEstatPage(appId, statsDataId, extra, to + 1);
      take(page);
      continue;
    }
    break;
  }
  const merged = structuredClone(first) as EstatPage;
  const dataInf = merged.GET_STATS_DATA?.STATISTICAL_DATA?.DATA_INF;
  if (dataInf) dataInf.VALUE = values;
  return JSON.stringify(merged);
}

const ESTAT_JOBS: { file: string; statsDataId: string; extra: Record<string, string> }[] = [
  {
    file: ESTAT_REVENUE.file,
    statsDataId: ESTAT_REVENUE.statsDataId,
    extra: {
      cdTab: ESTAT_REVENUE.cdTab,
      cdCat01: Object.keys(ESTAT_REVENUE.cat01).join(","),
    },
  },
  ...ESTAT_EXPENDITURE.map((table) => ({
    file: table.file,
    statsDataId: table.statsDataId,
    extra: {
      cdCat01: table.cat01.join(","),
      cdCat03: ESTAT_EXP_TOTAL,
    },
  })),
];

async function saveIfNeeded(dest: string, force: boolean, run: () => Promise<string | Buffer>, label: string) {
  if (!force && existsSync(dest)) {
    console.log(`cached ${label}`);
    return;
  }
  console.log(`fetch ${label}`);
  const body = await run();
  await mkdir(resolve(dest, ".."), { recursive: true });
  if (typeof body === "string") await writeFile(dest, body, "utf8");
  else await writeFile(dest, body);
  const size = typeof body === "string" ? body.length : body.length;
  console.log(`  ${size.toLocaleString()} → ${dest.replace(RAW_DIR + "/", "data/raw/")}`);
}

async function fetchExcelHachioji2019(force: boolean) {
  const dest = resolve(RAW_DIR, "132012", "2019.xlsx");
  await saveIfNeeded(dest, force, () => download(HACHIOJI_2019), "2019 八王子市（市サイト）");
}

async function fetchExcelTokyo(force: boolean) {
  const expected = CATALOG.filter((gov) => gov.prefecture === "東京都");
  const indexReferer = `${TOKYO_BOOKLET_BASE}/`;
  for (const gov of expected) {
    const pageUrl = tokyoBookletPage(gov.slug);
    console.log(`index ${gov.city} ${pageUrl}`);
    const html = (await download(pageUrl, { Referer: indexReferer })).toString("utf8");
    const links = parseTokyoBooklet(html, pageUrl);
    const missing = TOKYO_BOOKLET_YEARS.filter((year) => !links.has(year));
    if (missing.length > 0) {
      throw new Error(`${gov.city}: 資料集にない年度: ${missing.join("、")}`);
    }
    for (const year of TOKYO_BOOKLET_YEARS) {
      const url = links.get(year);
      if (url == null) continue;
      const dest = resolve(RAW_DIR, gov.code, `${year}.xlsx`);
      const existed = existsSync(dest);
      await saveIfNeeded(dest, force, () => download(url, { Referer: pageUrl }), `${year} ${gov.city}`);
      if (force || !existed) await sleep(80);
    }
  }
}

async function fetchExcelPrefecture(
  prefecture: string,
  pages: Readonly<Record<number, string>>,
  force: boolean,
) {
  const expected = CATALOG.filter((gov) => gov.prefecture === prefecture);
  for (const [yearRaw, pageUrl] of Object.entries(pages)) {
    const year = Number(yearRaw);
    console.log(`index ${year} ${pageUrl}`);
    const html = (await download(pageUrl)).toString("utf8");
    const links = parseCityBooklet(html, pageUrl, expected);
    const missing = expected.filter((gov) => !links.has(gov.code)).map((gov) => gov.city);
    if (missing.length > 0) {
      throw new Error(`${prefecture} ${year}: 資料集に Excel がない: ${missing.join("、")}`);
    }
    for (const gov of expected) {
      const override = EXCEL_OVERRIDES[`${gov.code}:${year}`];
      const url = override ?? links.get(gov.code);
      if (url == null) continue;
      const dest = resolve(RAW_DIR, gov.code, `${year}.xlsx`);
      const existed = existsSync(dest);
      await saveIfNeeded(dest, force || Boolean(override), () => download(url), `${year} ${gov.city}`);
      if (force || !existed) await sleep(80);
    }
  }
}

async function fetchExcelOkinawa(force: boolean) {
  await fetchExcelPrefecture("沖縄県", OKINAWA_BOOKLET_PAGES, force);
}

async function fetchExcelKanagawa(force: boolean) {
  await fetchExcelPrefecture("神奈川県", KANAGAWA_BOOKLET_PAGES, force);
}

async function fetchEstatBundle(appId: string, destDir: string, areas: string[], force: boolean) {
  await mkdir(destDir, { recursive: true });
  for (const job of ESTAT_JOBS) {
    const dest = resolve(destDir, job.file);
    await saveIfNeeded(
      dest,
      force,
      async () => {
        const extra: Record<string, string> = { ...job.extra, cdArea: areas.join(",") };
        const text = await fetchEstat(appId, job.statsDataId, extra);
        await sleep(400);
        return text;
      },
      `e-Stat ${job.file} (${areas.length}団体)`,
    );
  }
}

async function main() {
  loadDotEnv();
  const force = process.argv.includes("--force");
  await mkdir(RAW_DIR, { recursive: true });

  await fetchExcelHachioji2019(force);
  await fetchExcelTokyo(force);
  await fetchExcelKanagawa(force);
  await fetchExcelOkinawa(force);

  const appId = requireAppId();
  const tokyoAreas = CATALOG.filter((gov) => gov.prefecture === "東京都").map((gov) => estatArea(gov.code));
  await fetchEstatBundle(appId, TOKYO_ESTAT_DIR, tokyoAreas, force);
  const kanagawaAreas = CATALOG.filter((gov) => gov.prefecture === "神奈川県").map((gov) => estatArea(gov.code));
  await fetchEstatBundle(appId, KANAGAWA_ESTAT_DIR, kanagawaAreas, force);
  const okinawaAreas = CATALOG.filter((gov) => gov.prefecture === "沖縄県").map((gov) => estatArea(gov.code));
  await fetchEstatBundle(appId, OKINAWA_ESTAT_DIR, okinawaAreas, force);
}

await main();
