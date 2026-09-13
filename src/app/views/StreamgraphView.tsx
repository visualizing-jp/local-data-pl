import { formatYen } from "../sankey/buildGraph.ts";
import { buildStream } from "../sankey/buildStreamgraph.ts";
import { StreamgraphChart } from "../sankey/StreamgraphChart.tsx";
import type { CityFinance, SeriesKind } from "../../lib/types.ts";

interface StreamgraphViewProps {
  data: CityFinance;
  kind: SeriesKind;
}

export function StreamgraphView({ data, kind }: StreamgraphViewProps) {
  const graph = buildStream(data, kind);
  const first = data.years[0];
  const last = data.years[data.years.length - 1];
  const noun = kind === "revenue" ? "歳入" : "歳出";
  return (
    <>
      <StreamgraphChart data={data} kind={kind} />
      <dl className="facts">
        <div>
          <dt>期間</dt>
          <dd>
            {first}–{last}
          </dd>
        </div>
        <div>
          <dt>
            {first}年度の{noun}
          </dt>
          <dd>{formatYen(graph.firstTotal)}</dd>
        </div>
        <div>
          <dt>
            {last}年度の{noun}
          </dt>
          <dd>{formatYen(graph.lastTotal)}</dd>
        </div>
      </dl>
    </>
  );
}
