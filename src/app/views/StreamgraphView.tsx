import { formatYen } from "../sankey/buildGraph.ts";
import { buildStream } from "../sankey/buildStreamgraph.ts";
import { StreamgraphChart } from "../sankey/StreamgraphChart.tsx";
import type { StreamScale } from "../../lib/permalink.ts";
import type { CityFinance, SeriesKind } from "../../lib/types.ts";

interface StreamgraphViewProps {
  data: CityFinance;
  kind: SeriesKind;
  scale: StreamScale;
  onScale: (scale: StreamScale) => void;
}

export function StreamgraphView({ data, kind, scale, onScale }: StreamgraphViewProps) {
  const graph = buildStream(data, kind, scale);
  const first = data.years[0];
  const last = data.years[data.years.length - 1];
  const noun = kind === "revenue" ? "歳入" : "歳出";
  return (
    <>
      <div className="stream-toolbar">
        <label className="stream-scale">
          <span className="visually-hidden">表示</span>
          <select
            className="place-select"
            value={scale}
            onChange={(event) => onScale(event.target.value as StreamScale)}
          >
            <option value="absolute">絶対額</option>
            <option value="relative">構成比</option>
          </select>
        </label>
      </div>
      <StreamgraphChart data={data} kind={kind} scale={scale} />
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
