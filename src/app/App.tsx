import { useEffect, useState } from "react";
import { DEFAULT_GOV, lookupGov, type LocalGov } from "../lib/catalog.ts";
import { formatEraYear } from "../lib/era.ts";
import { formatPermalink, parsePermalink, snapYear } from "../lib/permalink.ts";
import type { CityFinance } from "../lib/types.ts";
import { buildYearGraph, formatMillion, formatShare } from "./sankey/buildGraph.ts";
import { SankeyChart } from "./sankey/SankeyChart.tsx";
import { YearSlider } from "./sankey/YearSlider.tsx";

function applyPermalink(city: string, year: number): void {
  const next = formatPermalink(city, year);
  if (window.location.search === next) return;
  window.history.replaceState({ city, year }, "", `${window.location.pathname}${next}`);
}

export function App() {
  const [gov, setGov] = useState<LocalGov | null>(null);
  const [data, setData] = useState<CityFinance | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [year, setYear] = useState<number | null>(null);

  useEffect(() => {
    const query = parsePermalink(window.location.search);
    const matched = query.city == null ? DEFAULT_GOV : lookupGov(query.city);
    if (matched == null) {
      document.title = "自治体が見つかりません";
      setError(`自治体「${query.city}」はまだありません。`);
      return;
    }

    let cancelled = false;
    setGov(matched);
    fetch(matched.dataUrl)
      .then((res) => {
        if (!res.ok) throw new Error(`データの読み込みに失敗しました（${res.status}）`);
        return res.json() as Promise<CityFinance>;
      })
      .then((json) => {
        if (cancelled) return;
        setData(json);
        setYear(snapYear(json.years, query.year));
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "読み込みに失敗しました");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (gov == null || year == null) return;
    applyPermalink(gov.slug, year);
    document.title = `${gov.prefecture} ${gov.city} ${year}年度の財政収支`;
  }, [gov, year]);

  if (error) {
    return (
      <main className="page">
        <p className="status">{error}</p>
      </main>
    );
  }
  if (!gov || !data || year == null) {
    return (
      <main className="page">
        <p className="status">読み込み中</p>
      </main>
    );
  }

  const graph = buildYearGraph(data, year);
  const era = formatEraYear(year);

  return (
    <div className="page">
      <header className="masthead">
        <p className="eyebrow">普通会計決算 · マネーフロー</p>
        <div className="masthead__row">
          <h1>
            <span className="place">
              {gov.prefecture} {gov.city}
            </span>
            <span className="sep">の財政収支</span>
          </h1>
          <p className="yearblock">
            <span className="yearblock__n">{year}</span>
            <span className="yearblock__era">{era}</span>
          </p>
        </div>
        <p className="lede">
          歳入 {formatMillion(graph.total)} が、目的別歳出と形式収支へどう分かれたか。タイムラインでひとつの年度を選ぶ。
        </p>
      </header>

      <YearSlider years={data.years} year={year} onYear={setYear} />

      <SankeyChart data={data} year={year} />

      <dl className="facts">
        <div>
          <dt>歳出</dt>
          <dd>{formatMillion(graph.expenditureTotal)}</dd>
        </div>
        <div>
          <dt>{graph.balance >= 0 ? "形式収支（黒字）" : "形式収支（赤字）"}</dt>
          <dd>{formatMillion(Math.abs(graph.balance))}</dd>
        </div>
        <div>
          <dt>黒字の割合</dt>
          <dd>{formatShare(Math.abs(graph.balance), graph.total)}</dd>
        </div>
      </dl>

      <footer className="source">
        出典: {data.source}。{data.sourceDetail} 単位は千円を百万円に四捨五入。形式収支は歳入合計−歳出合計。
      </footer>
    </div>
  );
}
