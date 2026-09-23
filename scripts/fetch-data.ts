/**
 * 財政状況資料集 Excel と e-Stat を data/raw/ に取得する。
 *
 *   npm run fetch
 *   npm run fetch -- --force
 *   npm run fetch -- --pref=群馬県
 */

import { execFile } from "node:child_process";
import { mkdir, readdir, copyFile, writeFile, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { promisify } from "node:util";
import { CATALOG, estatArea } from "../src/lib/catalog.ts";
import { cliPrefecture, requireCatalogPrefecture } from "./cli.ts";
import { loadDotEnv } from "./env.ts";
import { codeFromHokkaidoExcelName, parseHokkaidoBookletZips } from "./hokkaido-booklet.ts";
import { parseIwateBookletZips } from "./iwate-booklet.ts";
import { parseMiyagiBookletYear } from "./miyagi-booklet.ts";
import { parseFukushimaBooklet } from "./fukushima-booklet.ts";
import { parseHyogoBooklet } from "./hyogo-booklet.ts";
import { parseAichiBookletYear } from "./aichi-booklet.ts";
import { parseTokushimaBookletYear } from "./tokushima-booklet.ts";
import { parseKagawaBookletYear } from "./kagawa-booklet.ts";
import { parseEhimeBooklet } from "./ehime-booklet.ts";
import { parseKochiBooklet } from "./kochi-booklet.ts";
import { parseFukuokaBooklet } from "./fukuoka-booklet.ts";
import { parseNagasakiBooklet } from "./nagasaki-booklet.ts";
import { parseKumamotoBooklet } from "./kumamoto-booklet.ts";
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
  IBARAKI_BOOKLET_PAGES,
  TOCHIGI_BOOKLET_PAGES,
  GUNMA_BOOKLET_PAGES,
  SAITAMA_BOOKLET_PAGES,
  SAITAMA_CODE,
  SAITAMA_MIC_EXCEL,
  CHIBA_BOOKLET_PAGES,
  CHIBA_CODE,
  CHIBA_MIC_EXCEL,
  NIIGATA_BOOKLET_PAGES,
  TOYAMA_BOOKLET_PAGES,
  ISHIKAWA_BOOKLET_PAGES,
  FUKUI_BOOKLET_PAGES,
  YAMANASHI_BOOKLET_PAGES,
  NAGANO_BOOKLET_PAGES,
  GIFU_BOOKLET_PAGES,
  AICHI_BOOKLET_PAGES,
  MIE_BOOKLET_PAGES,
  SHIGA_BOOKLET_PAGES,
  KYOTO_BOOKLET_PAGES,
  KYOTO_CODE,
  KYOTO_MIC_EXCEL,
  OSAKA_BOOKLET_PAGES,
  OSAKA_CODE,
  OSAKA_MIC_EXCEL,
  HYOGO_BOOKLET_PAGES,
  NARA_BOOKLET_PAGES,
  WAKAYAMA_BOOKLET_PAGES,
  TOTTORI_BOOKLET_PAGES,
  SHIMANE_BOOKLET_PAGES,
  OKAYAMA_BOOKLET_PAGES,
  HIROSHIMA_BOOKLET_PAGES,
  YAMAGUCHI_BOOKLET_PAGES,
  TOKUSHIMA_BOOKLET_PAGES,
  KAGAWA_BOOKLET_PAGES,
  EHIME_BOOKLET_PAGES,
  KOCHI_BOOKLET_PAGES,
  KOCHI_SKIP_EXCEL,
  FUKUOKA_BOOKLET_PAGES,
  FUKUOKA_CODE,
  FUKUOKA_MIC_EXCEL,
  KITAKYUSHU_CODE,
  KITAKYUSHU_MIC_EXCEL,
  SAGA_BOOKLET_PAGES,
  NAGASAKI_BOOKLET_PAGES,
  KUMAMOTO_BOOKLET_PAGES,
  SAKAI_CODE,
  SAKAI_MIC_EXCEL,
  HAMAMATSU_CODE,
  HAMAMATSU_MIC_EXCEL,
  NAGOYA_CODE,
  NAGOYA_MIC_EXCEL,
  SHIZUOKA_BOOKLET_PAGES,
  SHIZUOKA_CODE,
  SHIZUOKA_MIC_EXCEL,
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
const PYTHON = existsSync(resolve(import.meta.dirname, "../.venv/bin/python3"))
  ? resolve(import.meta.dirname, "../.venv/bin/python3")
  : "python3";

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
const IBARAKI_ESTAT_DIR = resolve(RAW_DIR, "estat-ibaraki");
const TOCHIGI_ESTAT_DIR = resolve(RAW_DIR, "estat-tochigi");
const GUNMA_ESTAT_DIR = resolve(RAW_DIR, "estat-gunma");
const SAITAMA_ESTAT_DIR = resolve(RAW_DIR, "estat-saitama");
const CHIBA_ESTAT_DIR = resolve(RAW_DIR, "estat-chiba");
const NIIGATA_ESTAT_DIR = resolve(RAW_DIR, "estat-niigata");
const TOYAMA_ESTAT_DIR = resolve(RAW_DIR, "estat-toyama");
const ISHIKAWA_ESTAT_DIR = resolve(RAW_DIR, "estat-ishikawa");
const FUKUI_ESTAT_DIR = resolve(RAW_DIR, "estat-fukui");
const YAMANASHI_ESTAT_DIR = resolve(RAW_DIR, "estat-yamanashi");
const NAGANO_ESTAT_DIR = resolve(RAW_DIR, "estat-nagano");
const GIFU_ESTAT_DIR = resolve(RAW_DIR, "estat-gifu");
const SHIZUOKA_ESTAT_DIR = resolve(RAW_DIR, "estat-shizuoka");
const AICHI_ESTAT_DIR = resolve(RAW_DIR, "estat-aichi");
const MIE_ESTAT_DIR = resolve(RAW_DIR, "estat-mie");
const SHIGA_ESTAT_DIR = resolve(RAW_DIR, "estat-shiga");
const KYOTO_ESTAT_DIR = resolve(RAW_DIR, "estat-kyoto");
const OSAKA_ESTAT_DIR = resolve(RAW_DIR, "estat-osaka");
const HYOGO_ESTAT_DIR = resolve(RAW_DIR, "estat-hyogo");
const NARA_ESTAT_DIR = resolve(RAW_DIR, "estat-nara");
const WAKAYAMA_ESTAT_DIR = resolve(RAW_DIR, "estat-wakayama");
const TOTTORI_ESTAT_DIR = resolve(RAW_DIR, "estat-tottori");
const SHIMANE_ESTAT_DIR = resolve(RAW_DIR, "estat-shimane");
const OKAYAMA_ESTAT_DIR = resolve(RAW_DIR, "estat-okayama");
const HIROSHIMA_ESTAT_DIR = resolve(RAW_DIR, "estat-hiroshima");
const YAMAGUCHI_ESTAT_DIR = resolve(RAW_DIR, "estat-yamaguchi");
const TOKUSHIMA_ESTAT_DIR = resolve(RAW_DIR, "estat-tokushima");
const KAGAWA_ESTAT_DIR = resolve(RAW_DIR, "estat-kagawa");
const EHIME_ESTAT_DIR = resolve(RAW_DIR, "estat-ehime");
const KOCHI_ESTAT_DIR = resolve(RAW_DIR, "estat-kochi");
const FUKUOKA_ESTAT_DIR = resolve(RAW_DIR, "estat-fukuoka");
const SAGA_ESTAT_DIR = resolve(RAW_DIR, "estat-saga");
const NAGASAKI_ESTAT_DIR = resolve(RAW_DIR, "estat-nagasaki");
const KUMAMOTO_ESTAT_DIR = resolve(RAW_DIR, "estat-kumamoto");
const OKINAWA_ESTAT_DIR = resolve(RAW_DIR, "estat-okinawa");
const ESTAT_ENDPOINT = "https://api.e-stat.go.jp/rest/3.0/app/json/getStatsData";
const HACHIOJI_2019 = `${DOWNLOAD_BASE}/${HACHIOJI_2019_FILE}`;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function download(url: string, extraHeaders: Record<string, string> = {}): Promise<Buffer> {
  const res = await fetch(url, { headers: { "User-Agent": FETCH_UA, ...extraHeaders } });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText} for ${url}`);
  return Buffer.from(await res.arrayBuffer());
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
    const yearsPresent = TOKYO_BOOKLET_YEARS.every((year) => existsSync(resolve(RAW_DIR, gov.code, `${year}.xlsx`)));
    if (!force && yearsPresent) {
      console.log(`cached ${gov.city} 資料集`);
      continue;
    }
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
  exclude: readonly string[] = [],
) {
  const excluded = new Set(exclude);
  const expected = CATALOG.filter((gov) => gov.prefecture === prefecture && !excluded.has(gov.code));
  for (const [yearRaw, pageUrl] of Object.entries(pages)) {
    const year = Number(yearRaw);
    const allPresent = expected.every((gov) => existsSync(resolve(RAW_DIR, gov.code, `${year}.xlsx`)));
    const needsOverride = expected.some((gov) => EXCEL_OVERRIDES[`${gov.code}:${year}`]);
    if (!force && allPresent && !needsOverride) {
      console.log(`cached ${year} ${prefecture}資料集（${expected.length}団体）`);
      continue;
    }
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
      if (
        url.toLowerCase().endsWith(".xlsb") ||
        url.toLowerCase().endsWith(".xls") ||
        url.toLowerCase().endsWith(".zip")
      ) {
        await saveBookletExcel(url, dest, force || Boolean(override), `${year} ${gov.city}`);
      } else {
        await saveIfNeeded(dest, force || Boolean(override), () => download(url), `${year} ${gov.city}`);
        if (force || !existed) await sleep(80);
      }
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

async function fetchExcelIbaraki(force: boolean) {
  await fetchExcelPrefecture("茨城県", IBARAKI_BOOKLET_PAGES, force);
}

async function fetchExcelTochigi(force: boolean) {
  await fetchExcelPrefecture("栃木県", TOCHIGI_BOOKLET_PAGES, force);
}

async function fetchExcelGunma(force: boolean) {
  await fetchExcelPrefecture("群馬県", GUNMA_BOOKLET_PAGES, force);
}

async function fetchExcelSaitama(force: boolean) {
  await fetchExcelPrefecture("埼玉県", SAITAMA_BOOKLET_PAGES, force, parseCityBooklet, [SAITAMA_CODE]);
  for (const [yearRaw, url] of Object.entries(SAITAMA_MIC_EXCEL)) {
    const y = Number(yearRaw);
    const dest = resolve(RAW_DIR, SAITAMA_CODE, `${y}.xlsx`);
    const existed = existsSync(dest);
    await saveIfNeeded(dest, force, () => download(url), `${y} さいたま市（総務省）`);
    if (force || !existed) await sleep(80);
  }
}

async function fetchExcelChiba(force: boolean) {
  await fetchExcelPrefecture("千葉県", CHIBA_BOOKLET_PAGES, force, parseCityBooklet, [CHIBA_CODE]);
  for (const [yearRaw, url] of Object.entries(CHIBA_MIC_EXCEL)) {
    const y = Number(yearRaw);
    const dest = resolve(RAW_DIR, CHIBA_CODE, `${y}.xlsx`);
    const existed = existsSync(dest);
    await saveIfNeeded(dest, force, () => download(url), `${y} 千葉市（総務省）`);
    if (force || !existed) await sleep(80);
  }
}

async function fetchExcelNiigata(force: boolean) {
  await fetchExcelPrefecture("新潟県", NIIGATA_BOOKLET_PAGES, force);
}

async function fetchExcelToyama(force: boolean) {
  await fetchExcelPrefecture("富山県", TOYAMA_BOOKLET_PAGES, force);
}

async function fetchExcelIshikawa(force: boolean) {
  await fetchExcelPrefecture("石川県", ISHIKAWA_BOOKLET_PAGES, force);
}

async function fetchExcelFukui(force: boolean) {
  await fetchExcelPrefecture("福井県", FUKUI_BOOKLET_PAGES, force);
}

async function fetchExcelYamanashi(force: boolean) {
  await fetchExcelPrefecture("山梨県", YAMANASHI_BOOKLET_PAGES, force);
}

async function fetchExcelNagano(force: boolean) {
  await fetchExcelPrefecture("長野県", NAGANO_BOOKLET_PAGES, force);
}

async function fetchExcelGifu(force: boolean) {
  await fetchExcelPrefecture("岐阜県", GIFU_BOOKLET_PAGES, force);
}

async function fetchExcelMie(force: boolean) {
  await fetchExcelPrefecture("三重県", MIE_BOOKLET_PAGES, force);
}

async function fetchExcelShiga(force: boolean) {
  await fetchExcelPrefecture("滋賀県", SHIGA_BOOKLET_PAGES, force);
}

async function fetchExcelKyoto(force: boolean) {
  await fetchExcelPrefecture("京都府", KYOTO_BOOKLET_PAGES, force, parseCityBooklet, [KYOTO_CODE]);
  for (const [yearRaw, url] of Object.entries(KYOTO_MIC_EXCEL)) {
    const y = Number(yearRaw);
    const dest = resolve(RAW_DIR, KYOTO_CODE, `${y}.xlsx`);
    const existed = existsSync(dest);
    await saveIfNeeded(dest, force, () => download(url), `${y} 京都市（総務省）`);
    if (force || !existed) await sleep(80);
  }
}

async function fetchExcelHyogo(force: boolean) {
  await fetchExcelPrefecture("兵庫県", HYOGO_BOOKLET_PAGES, force, parseHyogoBooklet);
}

async function fetchExcelNara(force: boolean) {
  await fetchExcelPrefecture("奈良県", NARA_BOOKLET_PAGES, force);
}

async function fetchExcelWakayama(force: boolean) {
  await fetchExcelPrefecture("和歌山県", WAKAYAMA_BOOKLET_PAGES, force);
}

async function fetchExcelTottori(force: boolean) {
  await fetchExcelPrefecture("鳥取県", TOTTORI_BOOKLET_PAGES, force);
}

async function fetchExcelShimane(force: boolean) {
  await fetchExcelPrefecture("島根県", SHIMANE_BOOKLET_PAGES, force);
}

async function fetchExcelOkayama(force: boolean) {
  await fetchExcelPrefecture("岡山県", OKAYAMA_BOOKLET_PAGES, force);
}

async function fetchExcelHiroshima(force: boolean) {
  await fetchExcelPrefecture("広島県", HIROSHIMA_BOOKLET_PAGES, force);
}

async function fetchExcelYamaguchi(force: boolean) {
  await fetchExcelPrefecture("山口県", YAMAGUCHI_BOOKLET_PAGES, force);
}

async function fetchExcelTokushima(force: boolean) {
  const expected = CATALOG.filter((gov) => gov.prefecture === "徳島県");
  const htmlByUrl = new Map<string, string>();
  for (const [yearRaw, pageUrl] of Object.entries(TOKUSHIMA_BOOKLET_PAGES)) {
    const year = Number(yearRaw);
    const allPresent = expected.every((gov) => existsSync(resolve(RAW_DIR, gov.code, `${year}.xlsx`)));
    const needsOverride = expected.some((gov) => EXCEL_OVERRIDES[`${gov.code}:${year}`]);
    if (!force && allPresent && !needsOverride) {
      console.log(`cached ${year} 徳島県資料集（${expected.length}団体）`);
      continue;
    }
    let html = htmlByUrl.get(pageUrl);
    if (html == null) {
      console.log(`index ${year} ${pageUrl}`);
      html = (await download(pageUrl)).toString("utf8");
      htmlByUrl.set(pageUrl, html);
    } else {
      console.log(`index ${year} ${pageUrl}（再利用）`);
    }
    const links = parseTokushimaBookletYear(html, pageUrl, expected, year);
    const missing = expected.filter((gov) => !links.has(gov.code)).map((gov) => gov.city);
    if (missing.length > 0) {
      throw new Error(`徳島県 ${year}: 資料集に Excel がない: ${missing.join("、")}`);
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

async function fetchExcelEhime(force: boolean) {
  await fetchExcelPrefecture("愛媛県", EHIME_BOOKLET_PAGES, force, parseEhimeBooklet);
}

async function fetchExcelSaga(force: boolean) {
  await fetchExcelPrefecture("佐賀県", SAGA_BOOKLET_PAGES, force);
}

async function fetchExcelNagasaki(force: boolean) {
  await fetchExcelPrefecture("長崎県", NAGASAKI_BOOKLET_PAGES, force, parseNagasakiBooklet);
}

async function fetchExcelKumamoto(force: boolean) {
  await fetchExcelPrefecture("熊本県", KUMAMOTO_BOOKLET_PAGES, force, parseKumamotoBooklet);
}

async function fetchExcelFukuoka(force: boolean) {
  await fetchExcelPrefecture("福岡県", FUKUOKA_BOOKLET_PAGES, force, parseFukuokaBooklet, [
    KITAKYUSHU_CODE,
    FUKUOKA_CODE,
  ]);
  for (const [yearRaw, url] of Object.entries(KITAKYUSHU_MIC_EXCEL)) {
    const y = Number(yearRaw);
    const dest = resolve(RAW_DIR, KITAKYUSHU_CODE, `${y}.xlsx`);
    const existed = existsSync(dest);
    await saveIfNeeded(dest, force, () => download(url), `${y} 北九州市（総務省）`);
    if (force || !existed) await sleep(80);
  }
  for (const [yearRaw, url] of Object.entries(FUKUOKA_MIC_EXCEL)) {
    const y = Number(yearRaw);
    const dest = resolve(RAW_DIR, FUKUOKA_CODE, `${y}.xlsx`);
    const existed = existsSync(dest);
    await saveIfNeeded(dest, force, () => download(url), `${y} 福岡市（総務省）`);
    if (force || !existed) await sleep(80);
  }
}

async function fetchExcelKochi(force: boolean) {
  const expectedAll = CATALOG.filter((gov) => gov.prefecture === "高知県");
  for (const [yearRaw, pageUrl] of Object.entries(KOCHI_BOOKLET_PAGES)) {
    const year = Number(yearRaw);
    const expected = expectedAll.filter((gov) => !KOCHI_SKIP_EXCEL.has(`${gov.code}:${year}`));
    const allPresent = expected.every((gov) => existsSync(resolve(RAW_DIR, gov.code, `${year}.xlsx`)));
    const needsOverride = expected.some((gov) => EXCEL_OVERRIDES[`${gov.code}:${year}`]);
    if (!force && allPresent && !needsOverride) {
      console.log(`cached ${year} 高知県資料集（${expected.length}団体）`);
      continue;
    }
    console.log(`index ${year} ${pageUrl}`);
    const html = (await download(pageUrl)).toString("utf8");
    const links = parseKochiBooklet(html, pageUrl, expected);
    const missing = expected.filter((gov) => !links.has(gov.code)).map((gov) => gov.city);
    if (missing.length > 0) {
      throw new Error(`高知県 ${year}: 資料集に Excel がない: ${missing.join("、")}`);
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

async function fetchExcelKagawa(force: boolean) {
  const expected = CATALOG.filter((gov) => gov.prefecture === "香川県");
  const htmlByUrl = new Map<string, string>();
  for (const [yearRaw, pageUrl] of Object.entries(KAGAWA_BOOKLET_PAGES)) {
    const year = Number(yearRaw);
    const allPresent = expected.every((gov) => existsSync(resolve(RAW_DIR, gov.code, `${year}.xlsx`)));
    const needsOverride = expected.some((gov) => EXCEL_OVERRIDES[`${gov.code}:${year}`]);
    if (!force && allPresent && !needsOverride) {
      console.log(`cached ${year} 香川県資料集（${expected.length}団体）`);
      continue;
    }
    let html = htmlByUrl.get(pageUrl);
    if (html == null) {
      console.log(`index ${year} ${pageUrl}`);
      html = (await download(pageUrl)).toString("utf8");
      htmlByUrl.set(pageUrl, html);
    } else {
      console.log(`index ${year} ${pageUrl}（再利用）`);
    }
    const links = parseKagawaBookletYear(html, pageUrl, expected, year);
    const missing = expected.filter((gov) => !links.has(gov.code)).map((gov) => gov.city);
    if (missing.length > 0) {
      throw new Error(`香川県 ${year}: 資料集に Excel がない: ${missing.join("、")}`);
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

async function fetchExcelOsaka(force: boolean) {
  await fetchExcelPrefecture("大阪府", OSAKA_BOOKLET_PAGES, force, parseCityBooklet, [OSAKA_CODE, SAKAI_CODE]);
  for (const [yearRaw, url] of Object.entries(OSAKA_MIC_EXCEL)) {
    const y = Number(yearRaw);
    const dest = resolve(RAW_DIR, OSAKA_CODE, `${y}.xlsx`);
    const existed = existsSync(dest);
    await saveIfNeeded(dest, force, () => download(url), `${y} 大阪市（総務省）`);
    if (force || !existed) await sleep(80);
  }
  for (const [yearRaw, url] of Object.entries(SAKAI_MIC_EXCEL)) {
    const y = Number(yearRaw);
    const dest = resolve(RAW_DIR, SAKAI_CODE, `${y}.xlsx`);
    const existed = existsSync(dest);
    await saveIfNeeded(dest, force, () => download(url), `${y} 堺市（総務省）`);
    if (force || !existed) await sleep(80);
  }
}

async function fetchExcelShizuoka(force: boolean) {
  await fetchExcelPrefecture("静岡県", SHIZUOKA_BOOKLET_PAGES, force, parseCityBooklet, [
    SHIZUOKA_CODE,
    HAMAMATSU_CODE,
  ]);
  for (const [yearRaw, url] of Object.entries(SHIZUOKA_MIC_EXCEL)) {
    const y = Number(yearRaw);
    const dest = resolve(RAW_DIR, SHIZUOKA_CODE, `${y}.xlsx`);
    const existed = existsSync(dest);
    await saveIfNeeded(dest, force, () => download(url), `${y} 静岡市（総務省）`);
    if (force || !existed) await sleep(80);
  }
  for (const [yearRaw, url] of Object.entries(HAMAMATSU_MIC_EXCEL)) {
    const y = Number(yearRaw);
    const dest = resolve(RAW_DIR, HAMAMATSU_CODE, `${y}.xlsx`);
    const existed = existsSync(dest);
    await saveIfNeeded(dest, force, () => download(url), `${y} 浜松市（総務省）`);
    if (force || !existed) await sleep(80);
  }
}

async function fetchExcelAichi(force: boolean) {
  const expected = CATALOG.filter((gov) => gov.prefecture === "愛知県" && gov.code !== NAGOYA_CODE);
  const htmlByUrl = new Map<string, string>();
  for (const [yearRaw, pageUrl] of Object.entries(AICHI_BOOKLET_PAGES)) {
    const year = Number(yearRaw);
    const allPresent = expected.every((gov) => existsSync(resolve(RAW_DIR, gov.code, `${year}.xlsx`)));
    if (!force && allPresent) {
      console.log(`cached ${year} 愛知県資料集（${expected.length}団体）`);
      continue;
    }
    let html = htmlByUrl.get(pageUrl);
    if (html == null) {
      console.log(`index ${year} ${pageUrl}`);
      html = (await download(pageUrl)).toString("utf8");
      htmlByUrl.set(pageUrl, html);
    } else {
      console.log(`index ${year} ${pageUrl}（再利用）`);
    }
    const links = parseAichiBookletYear(html, pageUrl, expected, year);
    const missing = expected.filter((gov) => !links.has(gov.code)).map((gov) => gov.city);
    if (missing.length > 0) {
      throw new Error(`愛知県 ${year}: 資料集に Excel がない: ${missing.join("、")}`);
    }
    for (const gov of expected) {
      const url = links.get(gov.code);
      if (url == null) continue;
      const dest = resolve(RAW_DIR, gov.code, `${year}.xlsx`);
      const existed = existsSync(dest);
      await saveIfNeeded(dest, force, () => download(url), `${year} ${gov.city}`);
      if (force || !existed) await sleep(80);
    }
  }
  for (const [yearRaw, url] of Object.entries(NAGOYA_MIC_EXCEL)) {
    const y = Number(yearRaw);
    const dest = resolve(RAW_DIR, NAGOYA_CODE, `${y}.xlsx`);
    const existed = existsSync(dest);
    await saveIfNeeded(dest, force, () => download(url), `${y} 名古屋市（総務省）`);
    if (force || !existed) await sleep(80);
  }
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
      await execFileAsync(PYTHON, [resolve(import.meta.dirname, "extract-booklet-zip.py"), dest, extractDir]);
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
    await execFileAsync(PYTHON, [resolve(import.meta.dirname, "extract-booklet-zip.py"), zipDest, dest]);
    await sleep(80);
    return;
  }
  if (url.toLowerCase().endsWith(".xlsb")) {
    const xlsbDest = dest.replace(/\.xlsx$/i, ".xlsb");
    await saveIfNeeded(xlsbDest, force, () => download(url), `${label} XLSB`);
    if (force || !existsSync(dest)) {
      await execFileAsync(PYTHON, [resolve(import.meta.dirname, "convert-xlsb.py"), xlsbDest, dest]);
    }
    await sleep(80);
    return;
  }
  if (url.toLowerCase().endsWith(".xls")) {
    const xlsDest = dest.replace(/\.xlsx$/i, ".xls");
    await saveIfNeeded(xlsDest, force, () => download(url), `${label} XLS`);
    if (force || !existsSync(dest)) {
      await execFileAsync(PYTHON, [resolve(import.meta.dirname, "convert-xls.py"), xlsDest, dest]);
    }
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
  const pref = requireCatalogPrefecture(
    cliPrefecture(),
    CATALOG.map((gov) => gov.prefecture),
  );
  await mkdir(RAW_DIR, { recursive: true });

  const excelJobs: { pref: string; run: (force: boolean) => Promise<void> }[] = [
    {
      pref: "東京都",
      run: async (f) => {
        await fetchExcelHachioji2019(f);
        await fetchExcelTokyo(f);
      },
    },
    { pref: "神奈川県", run: fetchExcelKanagawa },
    { pref: "北海道", run: fetchExcelHokkaido },
    { pref: "青森県", run: fetchExcelAomori },
    { pref: "岩手県", run: fetchExcelIwate },
    { pref: "宮城県", run: fetchExcelMiyagi },
    { pref: "秋田県", run: fetchExcelAkita },
    { pref: "山形県", run: fetchExcelYamagata },
    { pref: "福島県", run: fetchExcelFukushima },
    { pref: "茨城県", run: fetchExcelIbaraki },
    { pref: "栃木県", run: fetchExcelTochigi },
    { pref: "群馬県", run: fetchExcelGunma },
    { pref: "埼玉県", run: fetchExcelSaitama },
    { pref: "千葉県", run: fetchExcelChiba },
    { pref: "新潟県", run: fetchExcelNiigata },
    { pref: "富山県", run: fetchExcelToyama },
    { pref: "石川県", run: fetchExcelIshikawa },
    { pref: "福井県", run: fetchExcelFukui },
    { pref: "山梨県", run: fetchExcelYamanashi },
    { pref: "長野県", run: fetchExcelNagano },
    { pref: "岐阜県", run: fetchExcelGifu },
    { pref: "静岡県", run: fetchExcelShizuoka },
    { pref: "愛知県", run: fetchExcelAichi },
    { pref: "三重県", run: fetchExcelMie },
    { pref: "滋賀県", run: fetchExcelShiga },
    { pref: "京都府", run: fetchExcelKyoto },
    { pref: "大阪府", run: fetchExcelOsaka },
    { pref: "兵庫県", run: fetchExcelHyogo },
    { pref: "奈良県", run: fetchExcelNara },
    { pref: "和歌山県", run: fetchExcelWakayama },
    { pref: "鳥取県", run: fetchExcelTottori },
    { pref: "島根県", run: fetchExcelShimane },
    { pref: "岡山県", run: fetchExcelOkayama },
    { pref: "広島県", run: fetchExcelHiroshima },
    { pref: "山口県", run: fetchExcelYamaguchi },
    { pref: "徳島県", run: fetchExcelTokushima },
    { pref: "香川県", run: fetchExcelKagawa },
    { pref: "愛媛県", run: fetchExcelEhime },
    { pref: "高知県", run: fetchExcelKochi },
    { pref: "福岡県", run: fetchExcelFukuoka },
    { pref: "佐賀県", run: fetchExcelSaga },
    { pref: "長崎県", run: fetchExcelNagasaki },
    { pref: "熊本県", run: fetchExcelKumamoto },
    { pref: "沖縄県", run: fetchExcelOkinawa },
  ];
  for (const job of excelJobs) {
    if (pref && job.pref !== pref) continue;
    await job.run(force);
  }

  const appId = process.env["ESTAT_APP_ID"]?.trim();
  if (!appId) {
    console.log("ESTAT_APP_ID がないので e-Stat（2018以前）はスキップ");
    return;
  }
  const estatJobs: { pref: string; dir: string }[] = [
    { pref: "北海道", dir: HOKKAIDO_ESTAT_DIR },
    { pref: "青森県", dir: AOMORI_ESTAT_DIR },
    { pref: "岩手県", dir: IWATE_ESTAT_DIR },
    { pref: "宮城県", dir: MIYAGI_ESTAT_DIR },
    { pref: "秋田県", dir: AKITA_ESTAT_DIR },
    { pref: "山形県", dir: YAMAGATA_ESTAT_DIR },
    { pref: "福島県", dir: FUKUSHIMA_ESTAT_DIR },
    { pref: "茨城県", dir: IBARAKI_ESTAT_DIR },
    { pref: "栃木県", dir: TOCHIGI_ESTAT_DIR },
    { pref: "群馬県", dir: GUNMA_ESTAT_DIR },
    { pref: "埼玉県", dir: SAITAMA_ESTAT_DIR },
    { pref: "千葉県", dir: CHIBA_ESTAT_DIR },
    { pref: "東京都", dir: TOKYO_ESTAT_DIR },
    { pref: "神奈川県", dir: KANAGAWA_ESTAT_DIR },
    { pref: "新潟県", dir: NIIGATA_ESTAT_DIR },
    { pref: "富山県", dir: TOYAMA_ESTAT_DIR },
    { pref: "石川県", dir: ISHIKAWA_ESTAT_DIR },
    { pref: "福井県", dir: FUKUI_ESTAT_DIR },
    { pref: "山梨県", dir: YAMANASHI_ESTAT_DIR },
    { pref: "長野県", dir: NAGANO_ESTAT_DIR },
    { pref: "岐阜県", dir: GIFU_ESTAT_DIR },
    { pref: "静岡県", dir: SHIZUOKA_ESTAT_DIR },
    { pref: "愛知県", dir: AICHI_ESTAT_DIR },
    { pref: "三重県", dir: MIE_ESTAT_DIR },
    { pref: "滋賀県", dir: SHIGA_ESTAT_DIR },
    { pref: "京都府", dir: KYOTO_ESTAT_DIR },
    { pref: "大阪府", dir: OSAKA_ESTAT_DIR },
    { pref: "兵庫県", dir: HYOGO_ESTAT_DIR },
    { pref: "奈良県", dir: NARA_ESTAT_DIR },
    { pref: "和歌山県", dir: WAKAYAMA_ESTAT_DIR },
    { pref: "鳥取県", dir: TOTTORI_ESTAT_DIR },
    { pref: "島根県", dir: SHIMANE_ESTAT_DIR },
    { pref: "岡山県", dir: OKAYAMA_ESTAT_DIR },
    { pref: "広島県", dir: HIROSHIMA_ESTAT_DIR },
    { pref: "山口県", dir: YAMAGUCHI_ESTAT_DIR },
    { pref: "徳島県", dir: TOKUSHIMA_ESTAT_DIR },
    { pref: "香川県", dir: KAGAWA_ESTAT_DIR },
    { pref: "愛媛県", dir: EHIME_ESTAT_DIR },
    { pref: "高知県", dir: KOCHI_ESTAT_DIR },
    { pref: "福岡県", dir: FUKUOKA_ESTAT_DIR },
    { pref: "佐賀県", dir: SAGA_ESTAT_DIR },
    { pref: "長崎県", dir: NAGASAKI_ESTAT_DIR },
    { pref: "熊本県", dir: KUMAMOTO_ESTAT_DIR },
    { pref: "沖縄県", dir: OKINAWA_ESTAT_DIR },
  ];
  for (const job of estatJobs) {
    if (pref && job.pref !== pref) continue;
    const areas = CATALOG.filter((gov) => gov.prefecture === job.pref).map((gov) => estatArea(gov.code));
    await fetchEstatBundle(appId, job.dir, areas, force);
  }
}

await main();
