/**
 * 財政状況資料集 Excel と e-Stat を data/raw/ に取得する。
 *
 *   npm run fetch
 *   npm run fetch -- --force
 */

import { execFile } from "node:child_process";
import { mkdir, readdir, copyFile, writeFile, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { promisify } from "node:util";
import { CATALOG, estatArea } from "../src/lib/catalog.ts";
import { loadDotEnv } from "./env.ts";
import { codeFromHokkaidoExcelName, parseHokkaidoBookletZips } from "./hokkaido-booklet.ts";
import { parseIwateBookletZips } from "./iwate-booklet.ts";
import { parseMiyagiBookletYear } from "./miyagi-booklet.ts";
import { parseFukushimaBooklet } from "./fukushima-booklet.ts";
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
  AOMORI_BOOKLET_PAGES,
  AKITA_BOOKLET_PAGES,
  FUKUSHIMA_BOOKLET_PAGES,
  YAMAGATA_BOOKLET_PAGES,
  HOKKAIDO_BOOKLET_PAGE,
  HOKKAIDO_BOOKLET_YEAR,
  IWATE_BOOKLET_PAGES,
  KANAGAWA_BOOKLET_PAGES,
  MIYAGI_BOOKLET_PAGE,
  MIYAGI_BOOKLET_YEARS,
  OKINAWA_BOOKLET_PAGES,
  SAPPORO_CODE,
  SAPPORO_MIC_EXCEL,
  SENDAI_CODE,
  SENDAI_MIC_EXCEL,
  TOKYO_BOOKLET_BASE,
  TOKYO_BOOKLET_YEARS,
  tokyoBookletPage,
} from "./sources.ts";

const execFileAsync = promisify(execFile);

const RAW_DIR = resolve(import.meta.dirname, "../data/raw");
const TOKYO_ESTAT_DIR = resolve(RAW_DIR, "estat-tokyo");
const KANAGAWA_ESTAT_DIR = resolve(RAW_DIR, "estat-kanagawa");
const HOKKAIDO_ESTAT_DIR = resolve(RAW_DIR, "estat-hokkaido");
const AOMORI_ESTAT_DIR = resolve(RAW_DIR, "estat-aomori");
const IWATE_ESTAT_DIR = resolve(RAW_DIR, "estat-iwate");
const MIYAGI_ESTAT_DIR = resolve(RAW_DIR, "estat-miyagi");
const AKITA_ESTAT_DIR = resolve(RAW_DIR, "estat-akita");
const YAMAGATA_ESTAT_DIR = resolve(RAW_DIR, "estat-yamagata");
const FUKUSHIMA_ESTAT_DIR = resolve(RAW_DIR, "estat-fukushima");
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

const ESTAT_AREA_LIMIT = 100;

async function fetchEstatForAreas(
  appId: string,
  statsDataId: string,
  extra: Record<string, string>,
  areas: string[],
): Promise<string> {
  if (areas.length <= ESTAT_AREA_LIMIT) {
    return fetchEstat(appId, statsDataId, { ...extra, cdArea: areas.join(",") });
  }
  const values: unknown[] = [];
  let first: EstatPage | null = null;
  for (let i = 0; i < areas.length; i += ESTAT_AREA_LIMIT) {
    const chunk = areas.slice(i, i + ESTAT_AREA_LIMIT);
    if (i > 0) await sleep(400);
    const text = await fetchEstat(appId, statsDataId, { ...extra, cdArea: chunk.join(",") });
    const json = JSON.parse(text) as EstatPage;
    first ??= json;
    const raw = json.GET_STATS_DATA?.STATISTICAL_DATA?.DATA_INF?.VALUE;
    if (raw == null) continue;
    if (Array.isArray(raw)) values.push(...raw);
    else values.push(raw);
  }
  if (first == null) throw new Error(`${statsDataId}: e-Stat が空`);
  const merged = structuredClone(first);
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
  parse = parseCityBooklet,
) {
  const expected = CATALOG.filter((gov) => gov.prefecture === prefecture);
  for (const [yearRaw, pageUrl] of Object.entries(pages)) {
    const year = Number(yearRaw);
    console.log(`index ${year} ${pageUrl}`);
    const html = (await download(pageUrl)).toString("utf8");
    const links = parse(html, pageUrl, expected);
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

async function fetchExcelAomori(force: boolean) {
  await fetchExcelPrefecture("青森県", AOMORI_BOOKLET_PAGES, force);
}

async function fetchExcelAkita(force: boolean) {
  await fetchExcelPrefecture("秋田県", AKITA_BOOKLET_PAGES, force);
}

async function fetchExcelYamagata(force: boolean) {
  await fetchExcelPrefecture("山形県", YAMAGATA_BOOKLET_PAGES, force);
}

async function fetchExcelFukushima(force: boolean) {
  await fetchExcelPrefecture("福島県", FUKUSHIMA_BOOKLET_PAGES, force, parseFukushimaBooklet);
}

async function fetchExcelIwate(force: boolean) {
  const expected = CATALOG.filter((gov) => gov.prefecture === "岩手県");
  for (const [yearRaw, pageUrl] of Object.entries(IWATE_BOOKLET_PAGES)) {
    const year = Number(yearRaw);
    const allPresent = expected.every((gov) => existsSync(resolve(RAW_DIR, gov.code, `${year}.xlsx`)));
    if (!force && allPresent) {
      console.log(`cached ${year} 岩手県資料集（${expected.length}団体）`);
      continue;
    }
    console.log(`index ${year} ${pageUrl}`);
    const html = (await download(pageUrl)).toString("utf8");
    const zips = parseIwateBookletZips(html, pageUrl);
    if (zips.length === 0) throw new Error(`岩手県 ${year}: 資料集 ZIP が1本もない`);

    const zipDir = resolve(RAW_DIR, "iwate-zips", String(year));
    const extractDir = resolve(zipDir, "_extract");
    await rm(extractDir, { recursive: true, force: true });
    await mkdir(extractDir, { recursive: true });

    const found = new Set<string>();
    for (const [i, url] of zips.entries()) {
      const file = `${String(i + 1).padStart(2, "0")}_${url.split("/").pop() ?? `part.zip`}`;
      const dest = resolve(zipDir, file);
      const existed = existsSync(dest);
      await saveIfNeeded(dest, force, () => download(url), `${year} ZIP ${file}`);
      if (force || !existed) await sleep(80);
      await execFileAsync("python3", [resolve(import.meta.dirname, "extract-booklet-zip.py"), dest, extractDir]);
    }

    const names = await readdir(extractDir);
    for (const name of names) {
      const code = name.match(/^(\d{6})\.xlsx$/i)?.[1];
      if (code == null) continue;
      const dest = resolve(RAW_DIR, code, `${year}.xlsx`);
      await mkdir(resolve(dest, ".."), { recursive: true });
      await copyFile(resolve(extractDir, name), dest);
      found.add(code);
    }

    const missing = expected.filter((gov) => !found.has(gov.code)).map((gov) => gov.city);
    if (missing.length > 0) {
      throw new Error(`岩手県 ${year}: 資料集に Excel がない: ${missing.join("、")}`);
    }
  }
}

async function saveBookletExcel(url: string, dest: string, force: boolean, label: string) {
  if (!force && existsSync(dest)) {
    console.log(`cached ${label}`);
    return;
  }
  if (url.toLowerCase().endsWith(".zip")) {
    const zipDest = dest.replace(/\.xlsx$/i, ".zip");
    await saveIfNeeded(zipDest, force, () => download(url), `${label} ZIP`);
    await execFileAsync("python3", [resolve(import.meta.dirname, "extract-booklet-zip.py"), zipDest, dest]);
    await sleep(80);
    return;
  }
  await saveIfNeeded(dest, force, () => download(url), label);
  await sleep(80);
}

async function fetchExcelMiyagi(force: boolean) {
  const expected = CATALOG.filter((gov) => gov.prefecture === "宮城県" && gov.code !== SENDAI_CODE);
  const allPresent = expected.every((gov) =>
    MIYAGI_BOOKLET_YEARS.every((year) => existsSync(resolve(RAW_DIR, gov.code, `${year}.xlsx`))),
  );
  if (!force && allPresent) {
    console.log(`cached 2019–2024 宮城県資料集（${expected.length}団体）`);
  } else {
    const pageUrl = MIYAGI_BOOKLET_PAGE;
    console.log(`index 宮城県 ${pageUrl}`);
    const html = (await download(pageUrl)).toString("utf8");
    for (const year of MIYAGI_BOOKLET_YEARS) {
      const links = parseMiyagiBookletYear(html, pageUrl, expected, year);
      const missing = expected.filter((gov) => !links.has(gov.code)).map((gov) => gov.city);
      if (missing.length > 0) {
        throw new Error(`宮城県 ${year}: 資料集に Excel がない: ${missing.join("、")}`);
      }
      for (const gov of expected) {
        const url = links.get(gov.code);
        if (url == null) continue;
        const dest = resolve(RAW_DIR, gov.code, `${year}.xlsx`);
        await saveBookletExcel(url, dest, force, `${year} ${gov.city}`);
      }
    }
  }

  for (const [yearRaw, url] of Object.entries(SENDAI_MIC_EXCEL)) {
    const y = Number(yearRaw);
    const dest = resolve(RAW_DIR, SENDAI_CODE, `${y}.xlsx`);
    const existed = existsSync(dest);
    await saveIfNeeded(dest, force, () => download(url), `${y} 仙台市（総務省）`);
    if (force || !existed) await sleep(80);
  }
}

async function fetchExcelHokkaido(force: boolean) {
  const expected = CATALOG.filter((gov) => gov.prefecture === "北海道" && gov.code !== SAPPORO_CODE);
  const year = HOKKAIDO_BOOKLET_YEAR;
  const allPresent = expected.every((gov) => existsSync(resolve(RAW_DIR, gov.code, `${year}.xlsx`)));
  if (!force && allPresent) {
    console.log(`cached ${year} 北海道資料集（${expected.length}団体）`);
  } else {
    console.log(`index ${year} ${HOKKAIDO_BOOKLET_PAGE}`);
    const html = (await download(HOKKAIDO_BOOKLET_PAGE)).toString("utf8");
    const zips = parseHokkaidoBookletZips(html, HOKKAIDO_BOOKLET_PAGE);
    if (zips.length === 0) throw new Error("北海道の資料集 ZIP が1本もない");

    const zipDir = resolve(RAW_DIR, "hokkaido-zips", String(year));
    const extractDir = resolve(zipDir, "_extract");
    await rm(extractDir, { recursive: true, force: true });
    await mkdir(extractDir, { recursive: true });

    const found = new Set<string>();
    for (const [i, url] of zips.entries()) {
      const file = `${String(i + 1).padStart(2, "0")}_${url.split("/").pop() ?? `part.zip`}`;
      const dest = resolve(zipDir, file);
      const existed = existsSync(dest);
      await saveIfNeeded(dest, force, () => download(url), `${year} ZIP ${file}`);
      if (force || !existed) await sleep(80);
      await execFileAsync("unzip", ["-o", "-q", dest, "-d", extractDir]);
    }

    const names = await readdir(extractDir);
    for (const name of names) {
      if (!name.toLowerCase().endsWith(".xlsx")) continue;
      const code = codeFromHokkaidoExcelName(name);
      if (code == null || code === SAPPORO_CODE) continue;
      const dest = resolve(RAW_DIR, code, `${year}.xlsx`);
      await mkdir(resolve(dest, ".."), { recursive: true });
      await copyFile(resolve(extractDir, name), dest);
      found.add(code);
    }

    const missing = expected.filter((gov) => !found.has(gov.code)).map((gov) => gov.city);
    if (missing.length > 0) {
      throw new Error(`北海道 ${year}: 資料集に Excel がない: ${missing.join("、")}`);
    }
  }

  for (const [yearRaw, url] of Object.entries(SAPPORO_MIC_EXCEL)) {
    const y = Number(yearRaw);
    const dest = resolve(RAW_DIR, SAPPORO_CODE, `${y}.xlsx`);
    const existed = existsSync(dest);
    await saveIfNeeded(dest, force, () => download(url), `${y} 札幌市（総務省）`);
    if (force || !existed) await sleep(80);
  }
}

async function fetchEstatBundle(appId: string, destDir: string, areas: string[], force: boolean) {
  await mkdir(destDir, { recursive: true });
  for (const job of ESTAT_JOBS) {
    const dest = resolve(destDir, job.file);
    await saveIfNeeded(
      dest,
      force,
      async () => {
        const text = await fetchEstatForAreas(appId, job.statsDataId, job.extra, areas);
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
  await fetchExcelHokkaido(force);
  await fetchExcelAomori(force);
  await fetchExcelIwate(force);
  await fetchExcelMiyagi(force);
  await fetchExcelAkita(force);
  await fetchExcelYamagata(force);
  await fetchExcelFukushima(force);
  await fetchExcelOkinawa(force);

  const appId = requireAppId();
  const hokkaidoAreas = CATALOG.filter((gov) => gov.prefecture === "北海道").map((gov) => estatArea(gov.code));
  await fetchEstatBundle(appId, HOKKAIDO_ESTAT_DIR, hokkaidoAreas, force);
  const aomoriAreas = CATALOG.filter((gov) => gov.prefecture === "青森県").map((gov) => estatArea(gov.code));
  await fetchEstatBundle(appId, AOMORI_ESTAT_DIR, aomoriAreas, force);
  const iwateAreas = CATALOG.filter((gov) => gov.prefecture === "岩手県").map((gov) => estatArea(gov.code));
  await fetchEstatBundle(appId, IWATE_ESTAT_DIR, iwateAreas, force);
  const miyagiAreas = CATALOG.filter((gov) => gov.prefecture === "宮城県").map((gov) => estatArea(gov.code));
  await fetchEstatBundle(appId, MIYAGI_ESTAT_DIR, miyagiAreas, force);
  const akitaAreas = CATALOG.filter((gov) => gov.prefecture === "秋田県").map((gov) => estatArea(gov.code));
  await fetchEstatBundle(appId, AKITA_ESTAT_DIR, akitaAreas, force);
  const yamagataAreas = CATALOG.filter((gov) => gov.prefecture === "山形県").map((gov) => estatArea(gov.code));
  await fetchEstatBundle(appId, YAMAGATA_ESTAT_DIR, yamagataAreas, force);
  const fukushimaAreas = CATALOG.filter((gov) => gov.prefecture === "福島県").map((gov) => estatArea(gov.code));
  await fetchEstatBundle(appId, FUKUSHIMA_ESTAT_DIR, fukushimaAreas, force);
  const tokyoAreas = CATALOG.filter((gov) => gov.prefecture === "東京都").map((gov) => estatArea(gov.code));
  await fetchEstatBundle(appId, TOKYO_ESTAT_DIR, tokyoAreas, force);
  const kanagawaAreas = CATALOG.filter((gov) => gov.prefecture === "神奈川県").map((gov) => estatArea(gov.code));
  await fetchEstatBundle(appId, KANAGAWA_ESTAT_DIR, kanagawaAreas, force);
  const okinawaAreas = CATALOG.filter((gov) => gov.prefecture === "沖縄県").map((gov) => estatArea(gov.code));
  await fetchEstatBundle(appId, OKINAWA_ESTAT_DIR, okinawaAreas, force);
}

await main();
