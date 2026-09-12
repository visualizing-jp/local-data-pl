import { hcl } from "d3-color";
import { interpolatePiYG, schemePiYG } from "d3-scale-chromatic";
import type { GraphNode } from "./buildGraph.ts";
import type { SeriesKind, SeriesNode } from "./buildSeriesGraph.ts";

const piyg = schemePiYG[7]!;

/** ColorBrewer PiYG-7 のピンク極（歳入）。 */
export const COLOR_REVENUE = piyg[0]!;
/** ColorBrewer PiYG-7 の緑極（歳出）。 */
export const COLOR_EXPENDITURE = piyg[6]!;
export const COLOR_TOTAL = "#2c3338";

/** PiYG に無い色相。明度・彩度は歳出の緑極に合わせる。 */
const BALANCE_HUE = 250;

function retint(hex: string, hue: number): string {
  const src = hcl(hex);
  return hcl(hue, src.c, src.l).formatHex();
}

export const COLOR_BALANCE = retint(COLOR_EXPENDITURE, BALANCE_HUE);

export function nodeFill(node: GraphNode): string {
  if (node.kind === "revenue" || node.kind === "group") return COLOR_REVENUE;
  if (node.kind === "expenditure") return COLOR_EXPENDITURE;
  if (node.kind === "balance") return COLOR_BALANCE;
  return COLOR_TOTAL;
}

export function linkStroke(source: GraphNode, target: GraphNode): string {
  if (target.kind === "expenditure" || target.kind === "balance") return nodeFill(target);
  return nodeFill(source);
}

export function seriesItemFill(kind: SeriesKind, index: number, count: number): string {
  const t = count <= 1 ? 0 : index / (count - 1);
  if (kind === "revenue") return interpolatePiYG(0.12 + 0.28 * t);
  return interpolatePiYG(0.62 + 0.28 * t);
}

export function seriesFill(node: SeriesNode, items: readonly string[]): string {
  const index = items.indexOf(node.item);
  return seriesItemFill(node.kind, Math.max(0, index), items.length);
}
