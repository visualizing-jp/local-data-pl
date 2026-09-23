import { useEffect, useMemo, useRef, useState } from "react";
import { select } from "d3-selection";
import { area, curveBasis } from "d3-shape";
import "d3-transition";
import { useSize } from "../hooks/useSize.ts";
import { formatShare, formatYen } from "./buildGraph.ts";
import { chartFrame, estimateTextWidth, tipPoint } from "./chartFrame.ts";
import type { StreamScale } from "../../lib/permalink.ts";
import type { CityFinance, SeriesKind } from "../../lib/types.ts";
import { buildStream, type StreamLayer } from "./buildStreamgraph.ts";
import { streamFill } from "./colors.ts";

interface StreamgraphChartProps {
  data: CityFinance;
  kind: SeriesKind;
  scale: StreamScale;
}

const EASE_OUT = (t: number) => 1 - (1 - t) ** 4;

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function labeledYears(years: number[], step: number): number[] {
  const first = years[0];
  const last = years[years.length - 1];
  const labels = new Set<number>();
  if (first != null) labels.add(first);
  if (last != null) labels.add(last);
  for (const y of years) {
    if (first == null || last == null) continue;
    if (y % step === 0 && y - first >= 3 && last - y >= 3) labels.add(y);
  }
  return [...labels].sort((a, b) => a - b);
}

function yearIndex(years: number[], year: number): number {
  const i = years.indexOf(year);
  return i < 0 ? 0 : i;
}

function nearestYear(years: number[], x: number, xOf: (year: number) => number): number {
  const first = years[0];
  if (first == null) return 0;
  return years.reduce((best, year) =>
    Math.abs(xOf(year) - x) < Math.abs(xOf(best) - x) ? year : best,
  );
}

export function StreamgraphChart({ data, kind, scale }: StreamgraphChartProps) {
  const [wrapRef, size] = useSize<HTMLDivElement>();
  const svgRef = useRef<SVGSVGElement>(null);
  const firstDraw = useRef(true);
  const codeRef = useRef(data.code);
  const scaleRef = useRef(scale);
  const [hover, setHover] = useState<{ title: string; body: string; x: number; y: number } | null>(
    null,
  );
  const graph = useMemo(() => buildStream(data, kind, scale), [data, kind, scale]);
  const frame = chartFrame(size.width);
  const noun = kind === "revenue" ? "歳入" : "歳出";

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg || frame.width < 40 || frame.height < 40 || graph.layers.length === 0) return;

    const govChanged = codeRef.current !== data.code;
    const scaleChanged = scaleRef.current !== scale;
    const duration =
      !firstDraw.current && (govChanged || scaleChanged) && !prefersReducedMotion() ? 600 : 0;
    firstDraw.current = false;
    codeRef.current = data.code;
    scaleRef.current = scale;
    setHover(null);

    const margin = { top: 28, right: 24, bottom: 12, left: 24 };
    const innerW = Math.max(40, frame.width - margin.left - margin.right);
    const innerH = Math.max(40, frame.height - margin.top - margin.bottom);
    const ySpan = graph.yMax - graph.yMin || 1;
    const xOf = (year: number) => {
      if (graph.years.length <= 1) return margin.left + innerW / 2;
      return margin.left + (yearIndex(graph.years, year) / (graph.years.length - 1)) * innerW;
    };
    const yOf = (v: number) => margin.top + ((graph.yMax - v) / ySpan) * innerH;

    const path = area<StreamLayer["points"][number]>()
      .x((d) => xOf(d.year))
      .y0((d) => yOf(d.y0))
      .y1((d) => yOf(d.y1))
      .curve(curveBasis);

    const root = select(svg);
    const layerSel = root
      .select<SVGGElement>("g.layers")
      .selectAll<SVGPathElement, StreamLayer>("path")
      .data(graph.layers, (d) => d.item);

    layerSel.exit().transition().duration(duration).style("opacity", 0).remove();

    const layerEnter = layerSel
      .enter()
      .append("path")
      .attr("d", (d) => path(d.points) ?? "")
      .style("opacity", 0);

    const layerMerge = layerEnter.merge(layerSel);
    layerMerge
      .attr("fill", (d) => streamFill(kind, d.item))
      .transition()
      .duration(duration)
      .ease(EASE_OUT)
      .attr("d", (d) => path(d.points) ?? "")
      .style("opacity", 1);

    const labelSize = frame.width <= 480 ? 10 : 11;
    const labelData = graph.layers.flatMap((layer) => {
      let best = layer.points[0];
      if (best == null) return [];
      for (const point of layer.points) {
        if (point.y1 - point.y0 > best.y1 - best.y0) best = point;
      }
      const h = Math.abs(yOf(best.y1) - yOf(best.y0));
      if (h < 12) return [];
      const textWidth = estimateTextWidth(layer.item, labelSize);
      if (textWidth > frame.width - 4) return [];
      const mid = xOf(best.year);
      let x = mid;
      let anchor: "start" | "middle" | "end" = "middle";
      if (mid - textWidth / 2 < 2) {
        x = 2;
        anchor = "start";
      } else if (mid + textWidth / 2 > frame.width - 2) {
        x = frame.width - 2;
        anchor = "end";
      }
      return [{ item: layer.item, point: best, x, anchor }];
    });

    const labelSel = root
      .select<SVGGElement>("g.labels")
      .selectAll<SVGTextElement, (typeof labelData)[number]>("text")
      .data(labelData, (d) => d.item);

    labelSel.exit().remove();
    labelSel
      .enter()
      .append("text")
      .attr("class", "label-name")
      .merge(labelSel)
      .attr("x", (d) => d.x)
      .attr("y", (d) => (yOf(d.point.y0) + yOf(d.point.y1)) / 2)
      .attr("dy", "0.35em")
      .attr("text-anchor", (d) => d.anchor)
      .style("font-size", `${labelSize}px`)
      .text((d) => d.item);

    const yearSel = root
      .select<SVGGElement>("g.years")
      .selectAll<SVGTextElement, number>("text")
      .data(labeledYears(graph.years, frame.width <= 480 ? 10 : 5), (d) => String(d));

    const firstYear = graph.years[0];
    const lastYear = graph.years[graph.years.length - 1];
    yearSel.exit().remove();
    yearSel
      .enter()
      .append("text")
      .attr("class", "year-col")
      .attr("dy", "0.85em")
      .merge(yearSel)
      .attr("text-anchor", (d) => (d === firstYear ? "start" : d === lastYear ? "end" : "middle"))
      .attr("x", (d) => (d === firstYear ? 4 : d === lastYear ? frame.width - 4 : xOf(d)))
      .attr("y", 8)
      .text((d) => String(d));

    const highlight = (item: string | null) => {
      if (item == null) {
        layerMerge.style("opacity", 1);
        return;
      }
      layerMerge.style("opacity", (d) => (d.item === item ? 1 : 0.18));
    };

    const showTip = (event: PointerEvent, layer: StreamLayer) => {
      const bounds = svg.getBoundingClientRect();
      const localX = ((event.clientX - bounds.left) / Math.max(bounds.width, 1)) * frame.width;
      const year = nearestYear(graph.years, localX, xOf);
      const point = layer.points.find((p) => p.year === year);
      const yearTotal = graph.totals.get(year) ?? 0;
      const yen = formatYen(point?.value ?? 0);
      const share = formatShare(point?.value ?? 0, yearTotal);
      const tip = tipPoint(event, bounds);
      setHover({
        title: `${year}　${layer.item}`,
        body: scale === "relative" ? `${share}（${yen}）` : `${yen}（${share}）`,
        x: tip.x,
        y: tip.y,
      });
    };

    layerMerge
      .on("pointerenter", (event, layer) => {
        highlight(layer.item);
        showTip(event, layer);
      })
      .on("pointermove", (event, layer) => showTip(event, layer))
      .on("pointerleave", () => {
        highlight(null);
        setHover(null);
      });
  }, [data.code, frame.height, frame.width, graph, kind, scale]);

  return (
    <div className="sankey-wrap sankey-wrap--series" ref={wrapRef}>
      <svg
        ref={svgRef}
        viewBox={frame.width > 0 ? `0 0 ${frame.width} ${frame.height}` : undefined}
        preserveAspectRatio="xMidYMid"
        width={frame.width || undefined}
        height={frame.height || undefined}
        role="img"
        aria-label={`${noun}の時系列（streamgraph）`}
      >
        <g className="years" />
        <g className="layers" />
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
