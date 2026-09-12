import { formatYen } from "../sankey/buildGraph.ts";
import { buildSeriesGraph, type SeriesKind } from "../sankey/buildSeriesGraph.ts";
import { SeriesChart } from "../sankey/SeriesChart.tsx";
import type { CityFinance } from "../../lib/types.ts";

interface SeriesViewProps {
  data: CityFinance;
  kind: SeriesKind;
}

export function SeriesView({ data, kind }: SeriesViewProps) {
  const graph = buildSeriesGraph(data, kind);
  const first = data.years[0];
  const last = data.years[data.years.length - 1];
  const noun = kind === "revenue" ? "歳入" : "歳出";
  return (
    <>
      <SeriesChart data={data} kind={kind} />
      <dl className="facts">
        <div>
          <dt>期間</dt>
          <dd>
            {first}–{last}
          </dd>
        </div>
        <div>
          <dt>{first}年度の{noun}</dt>
          <dd>{formatYen(graph.firstTotal)}</dd>
        </div>
        <div>
          <dt>{last}年度の{noun}</dt>
          <dd>{formatYen(graph.lastTotal)}</dd>
        </div>
      </dl>
    </>
  );
}
