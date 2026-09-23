import { useEffect, useMemo, useRef, useState } from "react";
import { select } from "d3-selection";
import { sankey as d3Sankey, sankeyLinkHorizontal } from "d3-sankey";
import "d3-transition";
import type { SankeyLink, SankeyNode } from "d3-sankey";
import { useSize } from "../hooks/useSize.ts";
import {
  buildYearGraph,
  formatYen,
  formatShare,
  type GraphLink,
  type GraphNode,
} from "./buildGraph.ts";
import { chartFrame, estimateTextWidth, tipPoint } from "./chartFrame.ts";
import { linkStroke, nodeFill, LINK_STROKE_OPACITY } from "./colors.ts";
import type { CityFinance } from "../../lib/types.ts";

interface SankeyChartProps {
  data: CityFinance;
  year: number;
}

type SNode = SankeyNode<GraphNode, GraphLink>;
type SLink = SankeyLink<GraphNode, GraphLink>;

const EASE_OUT = (t: number) => 1 - (1 - t) ** 4;

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

function showLabel(node: SNode): boolean {
  return node.kind === "balance" || nodeHeight(node) >= 11;
}

function textFits(text: string, node: SNode, fontSize: number, layoutWidth: number): boolean {
  if (text === "") return true;
  const width = estimateTextWidth(text, fontSize);
  if (node.kind === "total") {
    const x = ((node.x0 ?? 0) + (node.x1 ?? 0)) / 2;
    return x - width / 2 >= 2 && x + width / 2 <= layoutWidth - 2;
  }
  if (node.kind === "revenue") return (node.x0 ?? 0) - 8 - width >= 2;
  return (node.x1 ?? 0) + 8 + width <= layoutWidth - 2;
}

function layoutBox(width: number, height: number) {
  const phone = width <= 480;
  const tablet = width <= 768;
  const nodeWidth = phone ? 12 : 18;
  const minInner = nodeWidth * 4 + (phone ? 40 : 80);
  let left = phone ? 112 : tablet ? 156 : width >= 1000 ? 216 : 180;
  let right = phone ? 104 : tablet ? 132 : width >= 1000 ? 168 : 140;
  if (width - left - right < minInner) {
    const side = Math.max(0, width - minInner);
    left = Math.round(side * 0.52);
    right = side - left;
  }
  return {
    nodeWidth,
    margin: { top: 20, right, bottom: 32, left },
    nameSize: phone ? 10 : 11,
    metaSize: phone ? 9 : 10,
    nodePadding: height < 520 ? 5 : 10,
  };
}

export function SankeyChart({ data, year }: SankeyChartProps) {
  const [wrapRef, size] = useSize<HTMLDivElement>();
  const svgRef = useRef<SVGSVGElement>(null);
  const firstDraw = useRef(true);
  const yearRef = useRef(year);
  const codeRef = useRef(data.code);
  const [hover, setHover] = useState<{ title: string; body: string; x: number; y: number } | null>(
    null,
  );
  const graph = useMemo(() => buildYearGraph(data, year), [data, year]);
  const frame = chartFrame(size.width);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg || frame.width < 40 || frame.height < 40) return;

    const yearChanged = yearRef.current !== year;
    const govChanged = codeRef.current !== data.code;
    const duration =
      !firstDraw.current && (yearChanged || govChanged) && !prefersReducedMotion() ? 600 : 0;
    firstDraw.current = false;
    yearRef.current = year;
    codeRef.current = data.code;
    setHover(null);

    const box = layoutBox(frame.width, frame.height);
    const { margin } = box;
    const layout = d3Sankey<GraphNode, GraphLink>()
      .nodeId((d) => d.id)
      .nodeWidth(box.nodeWidth)
      .nodePadding(box.nodePadding)
      .nodeSort((a, b) => a.order - b.order)
      .extent([
        [margin.left, margin.top],
        [frame.width - margin.right, frame.height - margin.bottom],
      ]);

    const laid = layout({
      nodes: graph.nodes.map((node) => ({ ...node })),
      links: graph.links.map((link) => ({ ...link })),
    });
    const nodes = laid.nodes;
    const links = laid.links;
    const path = sankeyLinkHorizontal<SNode, SLink>();
    const root = select(svg);

    const linkSel = root
      .select<SVGGElement>("g.links")
      .selectAll<SVGPathElement, SLink>("path")
      .data(links, (d) => `${endpointId(d.source)}>${endpointId(d.target)}`);

    linkSel
      .exit()
      .transition()
      .duration(duration)
      .style("opacity", 0)
      .remove();

    const linkEnter = linkSel
      .enter()
      .append("path")
      .attr("d", path)
      .attr("fill", "none")
      .attr("stroke-opacity", LINK_STROKE_OPACITY)
      .style("opacity", 0);

    const linkMerge = linkEnter.merge(linkSel);
    linkMerge
      .attr("stroke", (d) => linkStroke(d.source as SNode, d.target as SNode))
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

    nodeSel
      .exit()
      .transition()
      .duration(duration)
      .style("opacity", 0)
      .remove();

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
      .attr("fill", (d) => nodeFill(d))
      .transition()
      .duration(duration)
      .ease(EASE_OUT)
      .attr("x", (d) => d.x0 ?? 0)
      .attr("y", (d) => d.y0 ?? 0)
      .attr("width", (d) => Math.max(1, (d.x1 ?? 0) - (d.x0 ?? 0)))
      .attr("height", (d) => Math.max(1, (d.y1 ?? 0) - (d.y0 ?? 0)))
      .style("opacity", 1);

    const labelSel = root
      .select<SVGGElement>("g.labels")
      .selectAll<SVGGElement, SNode>("g.label")
      .data(nodes, (d) => d.id);

    labelSel
      .exit()
      .transition()
      .duration(duration)
      .style("opacity", 0)
      .remove();

    const labelEnter = labelSel.enter().append("g").attr("class", "label");
    labelEnter.append("text").attr("class", "label-name");
    labelEnter.append("text").attr("class", "label-meta");

    const labelPos = (d: SNode) => {
      const h = nodeHeight(d);
      let y = ((d.y0 ?? 0) + (d.y1 ?? 0)) / 2;
      if (d.kind === "balance" && h < 22) y = (d.y1 ?? 0) + 8;
      if (d.kind === "total") {
        const x = ((d.x0 ?? 0) + (d.x1 ?? 0)) / 2;
        return `translate(${x},${y})`;
      }
      const left = d.kind === "revenue";
      const x = left ? (d.x0 ?? 0) - 8 : (d.x1 ?? 0) + 8;
      return `translate(${x},${y})`;
    };

    labelEnter.attr("transform", labelPos).style("opacity", 0);

    const labelMerge = labelEnter.merge(labelSel);
    labelMerge
      .transition()
      .duration(duration)
      .ease(EASE_OUT)
      .attr("transform", labelPos)
      .style("opacity", 1);
    labelMerge.select(".label-name")
      .attr("class", (d) => (d.kind === "total" ? "label-name is-on-ink" : "label-name"))
      .attr("text-anchor", (d) => {
        if (d.kind === "total") return "middle";
        return d.kind === "revenue" ? "end" : "start";
      })
      .attr("dy", "-0.15em")
      .style("font-size", `${box.nameSize}px`)
      .text((d) => {
        if (!showLabel(d)) return "";
        return textFits(d.label, d, box.nameSize, frame.width) ? d.label : "";
      });
    labelMerge.select(".label-meta")
      .attr("class", (d) => (d.kind === "total" ? "label-meta is-on-ink" : "label-meta"))
      .attr("text-anchor", (d) => {
        if (d.kind === "total") return "middle";
        return d.kind === "revenue" ? "end" : "start";
      })
      .attr("dy", "1.05em")
      .style("font-size", `${box.metaSize}px`)
      .text((d) => {
        if (!showLabel(d) || !textFits(d.label, d, box.nameSize, frame.width)) return "";
        const text =
          d.kind === "total"
            ? formatYen(graph.total)
            : `${formatShare(d.value, graph.total)}  ${formatYen(d.value)}`;
        return textFits(text, d, box.metaSize, frame.width) ? text : "";
      });

    const relatedIds = (node: SNode) => {
      const ids = new Set<string>([node.id]);
      for (const link of links) {
        const s = link.source as SNode;
        const t = link.target as SNode;
        if (s.id === node.id || t.id === node.id) {
          ids.add(s.id);
          ids.add(t.id);
        }
      }
      return ids;
    };

    const showTip = (event: PointerEvent, node: SNode) => {
      const point = tipPoint(event, svg.getBoundingClientRect());
      setHover({
        title: node.label,
        body: `${formatYen(node.value)}（歳入比 ${formatShare(node.value, graph.total)}）`,
        x: point.x,
        y: point.y,
      });
    };

    nodeMerge
      .on("pointerenter", function (event, node) {
        const ids = relatedIds(node);
        linkMerge.style("opacity", (d) => {
          const s = d.source as SNode;
          const t = d.target as SNode;
          return ids.has(s.id) && ids.has(t.id) ? 0.72 : 0.08;
        });
        nodeMerge.style("opacity", (d) => (ids.has(d.id) ? 1 : 0.28));
        showTip(event as PointerEvent, node);
      })
      .on("pointermove", function (event, node) {
        showTip(event as PointerEvent, node);
      })
      .on("pointerleave", () => {
        linkMerge.style("opacity", 1);
        nodeMerge.style("opacity", 1);
        setHover(null);
      });
  }, [data.code, frame.height, frame.width, graph, year]);

  return (
    <div className="sankey-wrap" ref={wrapRef}>
      <svg
        ref={svgRef}
        viewBox={frame.width > 0 ? `0 0 ${frame.width} ${frame.height}` : undefined}
        preserveAspectRatio="xMidYMid"
        width={frame.width || undefined}
        height={frame.height || undefined}
        role="img"
        aria-label={`${year}年度の歳入歳出`}
      >
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
