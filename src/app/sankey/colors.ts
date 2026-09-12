import { hcl } from "d3-color";
import { schemePiYG } from "d3-scale-chromatic";
import { revenueGroup } from "../../lib/taxonomy.ts";
import type { GraphNode } from "./buildGraph.ts";
import type { SeriesKind } from "./buildSeriesGraph.ts";

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

/** ノードは不透明、リンクは同じ色の薄い帯。年度・時系列で共通。 */
export const LINK_STROKE_OPACITY = 0.38;

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

export function seriesFill(kind: SeriesKind): string {
  return kind === "revenue" ? COLOR_REVENUE : COLOR_EXPENDITURE;
}

/** streamgraph の層。歳入は自主／依存で色相を分け、歳出は緑の濃淡。 */
export function streamFill(kind: SeriesKind, item: string, index: number, count: number): string {
  const base = hcl(kind === "revenue" ? COLOR_REVENUE : COLOR_EXPENDITURE);
  const t = count <= 1 ? 0.45 : index / (count - 1);
  const hue =
    kind === "revenue" ? (revenueGroup(item) === "自主財源" ? base.h : base.h + 26) : base.h;
  return hcl(hue, Math.max(18, base.c * (0.62 + 0.38 * t)), 40 + t * 30).formatHex();
}
