import { useEffect, useRef, useState } from "react";
import { DEFAULT_GOV, lookupGov, type LocalGov } from "../lib/catalog.ts";
import { formatEraYear } from "../lib/era.ts";
import { formatPermalink, parsePermalink, snapYear } from "../lib/permalink.ts";
import type { CityFinance } from "../lib/types.ts";
import { GovSelect } from "./GovSelect.tsx";
import { buildYearGraph, formatMillion, formatShare } from "./sankey/buildGraph.ts";
import { SankeyChart } from "./sankey/SankeyChart.tsx";
import { YearSlider } from "./sankey/YearSlider.tsx";

function applyPermalink(id: string, year: number): void {
  const next = formatPermalink(id, year);
  if (window.location.search === next) return;
  window.history.replaceState({ id, year }, "", `${window.location.pathname}${next}`);
}

function govFromSearch(): { gov: LocalGov | null; unknownId: string | null } {
  const query = parsePermalink(window.location.search);
  if (query.id == null) return { gov: DEFAULT_GOV, unknownId: null };
  const matched = lookupGov(query.id);
  return matched == null ? { gov: null, unknownId: query.id } : { gov: matched, unknownId: null };
}

export function App() {
  const boot = govFromSearch();
  const [gov, setGov] = useState<LocalGov | null>(boot.gov);
  const [unknownId] = useState<string | null>(boot.unknownId);
  const [data, setData] = useState<CityFinance | null>(null);
  const [error, setError] = useState<string | null>(unknownId ? `団体コード「${unknownId}」はまだありません。` : null);
  const [year, setYear] = useState<number | null>(null);
  const yearRef = useRef<number | null>(parsePermalink(window.location.search).year);

  useEffect(() => {
    if (year != null) yearRef.current = year;
  }, [year]);

  useEffect(() => {
    if (gov == null) return;
    let cancelled = false;
    setError(null);
    fetch(gov.dataUrl)
      .then((res) => {
        if (!res.ok) throw new Error(`データの読み込みに失敗しました（${res.status}）`);
        return res.json() as Promise<CityFinance>;
      })
      .then((json) => {
        if (cancelled) return;
        setData(json);
        setYear(snapYear(json.years, yearRef.current));
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "読み込みに失敗しました");
      });
    return () => {
      cancelled = true;
    };
  }, [gov]);

  useEffect(() => {
    if (gov == null || year == null) return;
    applyPermalink(gov.code, year);
    document.title = `${gov.prefecture} ${gov.city} ${year}年度の財政収支`;
  }, [gov, year]);

  const chooseGov = (code: string) => {
    const next = lookupGov(code);
    if (next == null || next.code === gov?.code) return;
    setGov(next);
  };

  if (error && gov == null) {
    return (
      <main className="page">
        <p className="status">{error}</p>
      </main>
    );
  }
  if (gov == null) {
    return (
      <main className="page">
        <p className="status">読み込み中</p>
      </main>
    );
  }

  const graph = data && year != null ? buildYearGraph(data, year) : null;
  const era = year != null ? formatEraYear(year) : "";

  return (
    <div className="page">
      <header className="masthead">
        <p className="eyebrow">普通会計決算 · マネーフロー</p>
        <div className="masthead__row">
          <h1>
            <span className="place-pref">{gov.prefecture}</span>
            <GovSelect gov={gov} onGov={chooseGov} />
            <span className="sep">の財政収支</span>
          </h1>
          {year != null ? (
            <p className="yearblock">
              <span className="yearblock__n">{year}</span>
              <span className="yearblock__era">{era}</span>
            </p>
          ) : null}
        </div>
        <p className="lede">
          {graph
            ? `歳入 ${formatMillion(graph.total)} が、目的別歳出と形式収支へどう分かれたか。タイムラインでひとつの年度を選ぶ。`
            : "歳入が、目的別歳出と形式収支へどう分かれたか。タイムラインでひとつの年度を選ぶ。"}
        </p>
      </header>

      {error ? <p className="status">{error}</p> : null}

      {data && year != null && graph ? (
        <>
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
        </>
      ) : error ? null : (
        <p className="status">読み込み中</p>
      )}
    </div>
  );
}
