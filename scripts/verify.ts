/**
 * 配信用 JSON の検算。2022 年は参照 Sankey（237,366 百万円）と突合する。
 *
 *   npm run verify
 */

import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import type { CityFinance } from "../src/lib/types.ts";
import { PURPOSE_INDEX } from "../src/lib/taxonomy.ts";

const PATH = resolve(import.meta.dirname, "../public/data/hachioji.json");
const REF_2022_MILLION = 237_366;

function fail(msg: string): never {
  throw new Error(msg);
}

const data = JSON.parse(await readFile(PATH, "utf8")) as CityFinance;
if (data.code !== "132012") fail(`団体コード ${data.code}`);
if (data.years[0] !== 1989) fail(`開始年 ${data.years[0]} ≠ 1989`);
if (data.years[data.years.length - 1] !== 2024) fail(`終了年 ${data.years.at(-1)} ≠ 2024`);
if (!data.years.includes(2019)) fail("2019 年度がない");
for (let i = 1; i < data.years.length; i++) {
  const prev = data.years[i - 1];
  const curr = data.years[i];
  if (prev == null || curr == null || curr !== prev + 1) fail(`年度が連続していない: ${prev} → ${curr}`);
}

for (const year of data.years) {
  const rev = data.revenue.filter((x) => x.year === year);
  const exp = data.expenditure.filter((x) => x.year === year);
  const revSum = rev.reduce((s, x) => s + x.value, 0);
  const expSum = exp.reduce((s, x) => s + x.value, 0);
  const balance = revSum - expSum;
  if (revSum <= 0) fail(`${year}: 歳入合計が 0`);
  if (expSum <= 0) fail(`${year}: 歳出合計が 0`);
  if (Math.abs(balance) / revSum > 0.2) fail(`${year}: 形式収支が歳入の 20% 超`);
  for (const row of exp) {
    if (!PURPOSE_INDEX.has(row.item)) fail(`${year}: 目的外の歳出 ${row.item}`);
  }
  console.log(
    `${year} 歳入 ${Math.round(revSum / 1000).toLocaleString()} 百万円 / 歳出 ${Math.round(expSum / 1000).toLocaleString()} 百万円 / 形式収支 ${Math.round(balance / 1000).toLocaleString()} 百万円 (${((balance / revSum) * 100).toFixed(1)}%)`,
  );
}

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

console.log("verify OK");
