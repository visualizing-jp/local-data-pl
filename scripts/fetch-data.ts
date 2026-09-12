/**
 * 八王子市「財政状況資料集」Excel と e-Stat の 1989–2018 を data/raw/ に取得する。
 *
 *   npm run fetch
 *   npm run fetch -- --force
 */

import { mkdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { loadDotEnv } from "./env.ts";
import {
  DOWNLOAD_BASE,
  ESTAT_AREA,
  ESTAT_EXP_TOTAL,
  ESTAT_EXPENDITURE,
  ESTAT_REVENUE,
  EXCEL_SOURCES,
} from "./sources.ts";

const OUT_DIR = resolve(import.meta.dirname, "../data/raw");
const ESTAT_ENDPOINT = "https://api.e-stat.go.jp/rest/3.0/app/json/getStatsData";

async function download(url: string): Promise<Buffer> {
  const res = await fetch(url);
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

async function fetchEstat(
  appId: string,
  statsDataId: string,
  extra: Record<string, string>,
): Promise<string> {
  const url = new URL(ESTAT_ENDPOINT);
  url.searchParams.set("appId", appId);
  url.searchParams.set("statsDataId", statsDataId);
  url.searchParams.set("cdArea", ESTAT_AREA);
  url.searchParams.set("limit", "100000");
  for (const [key, value] of Object.entries(extra)) url.searchParams.set(key, value);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText} for ${statsDataId}`);
  const text = await res.text();
  const json = JSON.parse(text) as {
    GET_STATS_DATA?: { RESULT?: { STATUS?: number | string; ERROR_MSG?: string } };
  };
  const status = json.GET_STATS_DATA?.RESULT?.STATUS;
  if (status !== 0 && status !== "0") {
    throw new Error(`${statsDataId}: ${json.GET_STATS_DATA?.RESULT?.ERROR_MSG ?? "e-Stat エラー"}`);
  }
  return text;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main() {
  loadDotEnv();
  const force = process.argv.includes("--force");
  await mkdir(OUT_DIR, { recursive: true });

  for (const { year, file } of EXCEL_SOURCES) {
    const dest = resolve(OUT_DIR, file);
    if (!force && existsSync(dest)) {
      console.log(`cached ${year} ${file}`);
      continue;
    }
    const url = `${DOWNLOAD_BASE}/${file}`;
    console.log(`fetch ${year} ${url}`);
    const buf = await download(url);
    await writeFile(dest, buf);
    console.log(`  ${buf.length.toLocaleString()} bytes → data/raw/${file}`);
  }

  const appId = requireAppId();
  const jobs: { file: string; statsDataId: string; extra: Record<string, string> }[] = [
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

  for (const job of jobs) {
    const dest = resolve(OUT_DIR, job.file);
    if (!force && existsSync(dest)) {
      console.log(`cached ${job.file}`);
      continue;
    }
    console.log(`fetch e-Stat ${job.statsDataId} → ${job.file}`);
    const text = await fetchEstat(appId, job.statsDataId, job.extra);
    await writeFile(dest, text, "utf8");
    console.log(`  ${text.length.toLocaleString()} chars`);
    await sleep(400);
  }
}

await main();
