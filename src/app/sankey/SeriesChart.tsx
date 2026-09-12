import { useEffect, useMemo, useRef, useState } from "react";
import { select } from "d3-selection";
import { sankey as d3Sankey, sankeyLinkHorizontal } from "d3-sankey";
import "d3-transition";
import type { SankeyLink, SankeyNode } from "d3-sankey";
import { useSize } from "../hooks/useSize.ts";
import { formatShare, formatYen, type GraphLink } from "./buildGraph.ts";
import { buildSeriesGraph, type SeriesKind, type SeriesNode } from "./buildSeriesGraph.ts";
import { LINK_STROKE_OPACITY, seriesFill } from "./colors.ts";
import type { CityFinance } from "../../lib/types.ts";

interface SeriesChartProps {
  data: CityFinance;
  kind: SeriesKind;
}

type SNode = SankeyNode<SeriesNode, GraphLink>;
type SLink = SankeyLink<SeriesNode, GraphLink>;

const EASE_OUT = (t: number) => 1 - (1 - t) ** 4;
const COL_GAP = 52;

function endpointId(end: SLink["source"] | SLink["target"]): string {
  if (typeof end === "object" && end !== null) return (end as SNode).id;
  return String(end);
}

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function nodeHeight(node: SNode): number {
  return (node.y1 ?? 0) - (node.y0 ?? 0);
}

function labeledYears(years: number[]): number[] {
  const first = years[0];
  const last = years[years.length - 1];
  const labels = new Set<number>();
  if (first != null) labels.add(first);
  if (last != null) labels.add(last);
  for (const y of years) {
    if (first == null || last == null) continue;
    if (y % 5 === 0 && y - first >= 3 && last - y >= 3) labels.add(y);
  }
  return [...labels].sort((a, b) => a - b);
}

/** d3-sankey は列の余り高さを科目の間に配る。時系列は上に詰めて帯を隣接させる。 */
function packColumns(nodes: SNode[], yTop: number, padding: number): void {
  const byYear = new Map<number, SNode[]>();
  for (const node of nodes) {
    const col = byYear.get(node.year);
    if (col) col.push(node);
    else byYear.set(node.year, [node]);
  }
  for (const col of byYear.values()) {
    col.sort((a, b) => a.order - b.order);
    let y = yTop;
    for (const node of col) {
      const h = nodeHeight(node);
      node.y0 = y;
      node.y1 = y + h;
      y = node.y1 + padding;
    }
  }
}

export function SeriesChart({ data, kind }: SeriesChartProps) {
  const [wrapRef, size] = useSize<HTMLDivElement>();
  const svgRef = useRef<SVGSVGElement>(null);
  const firstDraw = useRef(true);
  const codeRef = useRef(data.code);
  const [hover, setHover] = useState<{ title: string; body: string; x: number; y: number } | null>(
    null,
  );
  const graph = useMemo(() => buildSeriesGraph(data, kind), [data, kind]);
  const layoutWidth = Math.max(size.width, 140 + graph.years.length * COL_GAP);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg || size.width < 40 || size.height < 40 || graph.nodes.length === 0) return;

    const govChanged = codeRef.current !== data.code;
    const duration =
      !firstDraw.current && govChanged && !prefersReducedMotion() ? 600 : 0;
    firstDraw.current = false;
    codeRef.current = data.code;
    setHover(null);

    const margin = { top: 28, right: 124, bottom: 16, left: 140 };
    const padding = 2;
    const yearCol = new Map(graph.years.map((y, i) => [y, i]));
    const layout = d3Sankey<SeriesNode, GraphLink>()
      .nodeId((d) => d.id)
      .nodeWidth(12)
      .nodePadding(padding)
      .nodeSort((a, b) => a.order - b.order)
      .nodeAlign((node) => yearCol.get(node.year) ?? 0)
      .iterations(0)
      .extent([
        [margin.left, margin.top],
        [layoutWidth - margin.right, size.height - margin.bottom],
      ]);

    const laid = layout({
      nodes: graph.nodes.map((node) => ({ ...node })),
      links: graph.links.map((link) => ({ ...link })),
    });
    packColumns(laid.nodes, margin.top, padding);
    layout.update(laid);
    const nodes = laid.nodes;
    const links = laid.links;
    const path = sankeyLinkHorizontal<SNode, SLink>();
    const root = select(svg);
    const fill = seriesFill(kind);

    const linkSel = root
      .select<SVGGElement>("g.links")
      .selectAll<SVGPathElement, SLink>("path")
      .data(links, (d) => `${endpointId(d.source)}>${endpointId(d.target)}`);

    linkSel.exit().transition().duration(duration).style("opacity", 0).remove();

    const linkEnter = linkSel
      .enter()
      .append("path")
      .attr("d", path)
      .attr("fill", "none")
      .attr("stroke-opacity", LINK_STROKE_OPACITY)
      .style("opacity", 0);

    const linkMerge = linkEnter.merge(linkSel);
    linkMerge
      .attr("stroke", fill)
      .transition()
      .duration(duration)
      .ease(EASE_OUT)
      .attr("d", path)
      .attr("stroke-width", (d) => Math.max(1, d.width ?? 1))
      .style("opacity", 1);

    const nodeSel = root
      .select<SVGGElement>("g.nodes")
      .selectAll<SVGRectElement, SNode>("rect")
      .data(nodes, (d) => d.id);

    nodeSel.exit().transition().duration(duration).style("opacity", 0).remove();

    const nodeEnter = nodeSel
      .enter()
      .append("rect")
      .attr("x", (d) => d.x0 ?? 0)
      .attr("y", (d) => d.y0 ?? 0)
      .attr("width", (d) => Math.max(1, (d.x1 ?? 0) - (d.x0 ?? 0)))
      .attr("height", (d) => Math.max(1, (d.y1 ?? 0) - (d.y0 ?? 0)))
      .style("opacity", 0);

    const nodeMerge = nodeEnter.merge(nodeSel);
    nodeMerge
      .attr("fill", fill)
      .transition()
      .duration(duration)
      .ease(EASE_OUT)
      .attr("x", (d) => d.x0 ?? 0)
      .attr("y", (d) => d.y0 ?? 0)
      .attr("width", (d) => Math.max(1, (d.x1 ?? 0) - (d.x0 ?? 0)))
      .attr("height", (d) => Math.max(1, (d.y1 ?? 0) - (d.y0 ?? 0)))
      .style("opacity", 1);

    const edgeNodes = nodes.filter((d) => d.edge !== "mid");
    const labelSel = root
      .select<SVGGElement>("g.labels")
      .selectAll<SVGGElement, SNode>("g.label")
      .data(edgeNodes, (d) => d.id);

    labelSel.exit().remove();

    const labelEnter = labelSel.enter().append("g").attr("class", "label");
    labelEnter.append("text").attr("class", "label-name");
    labelEnter.append("text").attr("class", "label-meta");

    const labelPos = (d: SNode) => {
      const y = ((d.y0 ?? 0) + (d.y1 ?? 0)) / 2;
      const x = d.edge === "first" ? (d.x0 ?? 0) - 8 : (d.x1 ?? 0) + 8;
      return `translate(${x},${y})`;
    };

    const labelMerge = labelEnter.merge(labelSel);
    labelMerge.attr("transform", labelPos).style("opacity", 1);
    labelMerge.select(".label-name")
      .attr("text-anchor", (d) => (d.edge === "first" ? "end" : "start"))
      .attr("dy", "-0.15em")
      .text((d) => (nodeHeight(d) >= 11 ? d.label : ""));
    labelMerge.select(".label-meta")
      .attr("text-anchor", (d) => (d.edge === "first" ? "end" : "start"))
      .attr("dy", "1.05em")
      .text((d) =>
        nodeHeight(d) >= 11 ? `${formatShare(d.value, d.yearTotal)}  ${formatYen(d.value)}` : "",
      );

    const yearX = new Map<number, number>();
    for (const node of nodes) {
      if (!yearX.has(node.year)) yearX.set(node.year, ((node.x0 ?? 0) + (node.x1 ?? 0)) / 2);
    }
    const yearSel = root
      .select<SVGGElement>("g.years")
      .selectAll<SVGTextElement, number>("text")
      .data(labeledYears(graph.years), (d) => String(d));

    yearSel.exit().remove();
    yearSel
      .enter()
      .append("text")
      .attr("class", "year-col")
      .attr("text-anchor", "middle")
      .attr("dy", "0.9em")
      .merge(yearSel)
      .attr("x", (d) => yearX.get(d) ?? 0)
      .attr("y", 0)
      .text((d) => String(d));

    const highlight = (item: string | null) => {
      if (item == null) {
        linkMerge.style("opacity", 1);
        nodeMerge.style("opacity", 1);
        return;
      }
      linkMerge.style("opacity", (d) => ((d.source as SNode).item === item ? 0.78 : 0.06));
      nodeMerge.style("opacity", (d) => (d.item === item ? 1 : 0.22));
    };

    const showTip = (event: PointerEvent, node: SNode) => {
      const box = svg.getBoundingClientRect();
      setHover({
        title: `${node.year}　${node.label}`,
        body: `${formatYen(node.value)}（${formatShare(node.value, node.yearTotal)}）`,
        x: event.clientX - box.left,
        y: event.clientY - box.top,
      });
    };

    nodeMerge
      .on("pointerenter", (event, node) => {
        highlight(node.item);
        showTip(event, node);
      })
      .on("pointermove", (event, node) => showTip(event, node))
      .on("pointerleave", () => {
        highlight(null);
        setHover(null);
      });

    linkMerge
      .on("pointerenter", (event, link) => {
        const node = link.target as SNode;
        highlight(node.item);
        showTip(event, node);
      })
      .on("pointermove", (event, link) => showTip(event, link.target as SNode))
      .on("pointerleave", () => {
        highlight(null);
        setHover(null);
      });
  }, [data.code, graph, kind, layoutWidth, size.height, size.width]);

  const title = kind === "revenue" ? "歳入の時系列" : "歳出の時系列";

  return (
    <div className="sankey-wrap sankey-wrap--series" ref={wrapRef}>
      <svg ref={svgRef} width={layoutWidth} height={size.height} role="img" aria-label={title}>
        <g className="years" />
        <g className="links" />
        <g className="nodes" />
        <g className="labels" />
      </svg>
      {hover ? (
        <div className="sankey-tip" style={{ left: hover.x, top: hover.y }}>
          <strong>{hover.title}</strong>
          <span>{hover.body}</span>
        </div>
      ) : null}
    </div>
  );
}
