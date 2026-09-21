/**
 * 配信用 JSON の検算。八王子市 2022 年は参照 Sankey（237,366 百万円）と突合する。
 *
 *   npm run verify
 */

import { readdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { CATALOG } from "../src/lib/catalog.ts";
import type { CityFinance } from "../src/lib/types.ts";
import { PURPOSE_INDEX } from "../src/lib/taxonomy.ts";
import { FUKUSHIMA_SKIP_EXCEL, HYOGO_SKIP_EXCEL, KOCHI_SKIP_EXCEL, NARA_SKIP_EXCEL } from "./sources.ts";

const DIR = resolve(import.meta.dirname, "../public/data");
const REF_2022_MILLION = 237_366;

function fail(msg: string): never {
  throw new Error(msg);
}

function verifyOne(data: CityFinance, filename: string): void {
  const gov = CATALOG.find((g) => g.code === data.code);
  if (gov == null) fail(`${filename}: カタログにない団体 ${data.code}`);
  if (data.city !== gov.city) fail(`${filename}: 名称 ${data.city} ≠ ${gov.city}`);
  if (data.years.length === 0) fail(`${filename}: 年度がない`);
  if (data.years.at(-1) !== 2024) fail(`${filename}: 終了年 ${data.years.at(-1)} ≠ 2024`);
  for (let i = 1; i < data.years.length; i++) {
    const prev = data.years[i - 1];
    const curr = data.years[i];
    if (prev == null || curr == null) fail(`${filename}: 年度が空`);
    if (curr === prev + 1) continue;
    const tokyoGap2019 =
      gov.prefecture === "東京都" && gov.code !== "132012" && prev === 2018 && curr === 2020;
    const sagaGap2019 = gov.prefecture === "佐賀県" && prev === 2018 && curr === 2020;
    const hokkaidoGapBooklet =
      gov.prefecture === "北海道" && gov.code !== "011002" && prev === 2018 && curr === 2024;
    const fukushimaGap2019 =
      FUKUSHIMA_SKIP_EXCEL.has(`${gov.code}:2019`) && prev === 2018 && curr === 2020;
    const hyogoGap2021 = HYOGO_SKIP_EXCEL.has(`${gov.code}:2021`) && prev === 2020 && curr === 2022;
    const naraSkipGap = NARA_SKIP_EXCEL.has(`${gov.code}:${prev + 1}`) && curr === prev + 2;
    let kochiSkipGap = curr > prev + 1;
    if (kochiSkipGap) {
      for (let year = prev + 1; year < curr; year++) {
        if (!KOCHI_SKIP_EXCEL.has(`${gov.code}:${year}`)) {
          kochiSkipGap = false;
          break;
        }
      }
    }
    if (
      !tokyoGap2019 &&
      !sagaGap2019 &&
      !hokkaidoGapBooklet &&
      !fukushimaGap2019 &&
      !hyogoGap2021 &&
      !naraSkipGap &&
      !kochiSkipGap
    ) {
      fail(`${filename}: 年度が連続していない: ${prev} → ${curr}`);
    }
  }

  for (const year of data.years) {
    const rev = data.revenue.filter((x) => x.year === year);
    const exp = data.expenditure.filter((x) => x.year === year);
    const revSum = rev.reduce((s, x) => s + x.value, 0);
    const expSum = exp.reduce((s, x) => s + x.value, 0);
    const balance = revSum - expSum;
    if (revSum <= 0) fail(`${data.city} ${year}: 歳入合計が 0`);
    if (expSum <= 0) fail(`${data.city} ${year}: 歳出合計が 0`);
    const yubariReconstruction = data.code === "012092" && year >= 2006 && year <= 2008;
    const tohokuCarryover =
      (data.code === "042056" && year === 2015) ||
      (data.code === "044016" && year >= 2013 && year <= 2015);
    const oshinoCarryover = data.code === "194247" && year === 1990;
    const naraCarryover =
      (data.code === "293610" && year === 1995) || (data.code === "294535" && year === 2016);
    if (
      Math.abs(balance) / revSum > 0.3 &&
      !yubariReconstruction &&
      !tohokuCarryover &&
      !oshinoCarryover &&
      !naraCarryover
    ) {
      fail(`${data.city} ${year}: 形式収支が歳入の 30% 超`);
    }
    for (const row of exp) {
      if (!PURPOSE_INDEX.has(row.item)) fail(`${data.city} ${year}: 目的外の歳出 ${row.item}`);
    }
  }

  if (data.code === "132012") {
    if (data.years[0] !== 1989) fail(`八王子市: 開始年 ${data.years[0]} ≠ 1989`);
    if (!data.years.includes(2019)) fail("八王子市: 2019 年度がない");
    const rev2022 = data.revenue.filter((x) => x.year === 2022);
    const total2022 = rev2022.reduce((s, x) => s + x.value, 0);
    const million = Math.round(total2022 / 1000);
    if (million !== REF_2022_MILLION) {
      fail(`2022 歳入 ${million} 百万円 ≠ 参照図 ${REF_2022_MILLION} 百万円`);
    }
    const tax = rev2022.find((x) => x.item === "地方税");
    if (!tax) fail("2022 地方税がない");
    const taxPct = (tax.value / total2022) * 100;
    if (Math.abs(taxPct - 39.1) > 0.15) fail(`2022 地方税 ${taxPct.toFixed(1)}% ≠ 39.1%`);
    const exp2022 = data.expenditure.filter((x) => x.year === 2022);
    const welfare = exp2022.find((x) => x.item === "民生費");
    if (!welfare) fail("2022 民生費がない");
    const welfarePct = (welfare.value / total2022) * 100;
    if (Math.abs(welfarePct - 48.3) > 0.15) fail(`2022 民生費 ${welfarePct.toFixed(1)}% ≠ 48.3%`);
  }

  console.log(
    `${data.city} OK ${data.years[0]}–${data.years.at(-1)}（${data.years.length}年）`,
  );
}

const files = (await readdir(DIR)).filter((name) => name.endsWith(".json")).sort();
if (files.length !== CATALOG.length) {
  fail(`JSON ${files.length} 件 ≠ カタログ ${CATALOG.length} 件`);
}
for (const gov of CATALOG) {
  const name = gov.dataUrl.replace("/data/", "");
  if (!files.includes(name)) fail(`配信用ファイルがない: ${name}`);
}

for (const name of files) {
  const data = JSON.parse(await readFile(resolve(DIR, name), "utf8")) as CityFinance;
  verifyOne(data, name);
}

console.log("verify OK");
