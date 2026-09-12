import { buildYearGraph, formatShare, formatYen } from "../sankey/buildGraph.ts";
import { SankeyChart } from "../sankey/SankeyChart.tsx";
import { YearSlider } from "../sankey/YearSlider.tsx";
import type { CityFinance } from "../../lib/types.ts";

interface YearViewProps {
  data: CityFinance;
  year: number;
  onYear: (year: number) => void;
}

export function YearView({ data, year, onYear }: YearViewProps) {
  const graph = buildYearGraph(data, year);
  return (
    <>
      <YearSlider years={data.years} year={year} onYear={onYear} />
      <SankeyChart data={data} year={year} />
      <dl className="facts">
        <div>
          <dt>歳出</dt>
          <dd>{formatYen(graph.expenditureTotal)}</dd>
        </div>
        <div>
          <dt>{graph.balance >= 0 ? "形式収支（黒字）" : "形式収支（赤字）"}</dt>
          <dd>{formatYen(Math.abs(graph.balance))}</dd>
        </div>
        <div>
          <dt>黒字の割合</dt>
          <dd>{formatShare(Math.abs(graph.balance), graph.total)}</dd>
        </div>
      </dl>
    </>
  );
}
