import { useEffect, useRef, useState } from "react";
import { DEFAULT_GOV, lookupGov, type LocalGov } from "../lib/catalog.ts";
import {
  formatPermalink,
  parsePermalink,
  snapYear,
  type ViewId,
} from "../lib/permalink.ts";
import type { CityFinance } from "../lib/types.ts";
import { GovSelect } from "./GovSelect.tsx";
import { ViewNav } from "./ViewNav.tsx";
import { buildYearGraph, formatYen } from "./sankey/buildGraph.ts";
import { StreamgraphView } from "./views/StreamgraphView.tsx";
import { YearView } from "./views/YearView.tsx";

function applyPermalink(id: string, year: number, view: ViewId): void {
  const next = formatPermalink(id, year, view);
  if (window.location.search === next) return;
  window.history.replaceState({ id, year, view }, "", `${window.location.pathname}${next}`);
}

function govFromSearch(): { gov: LocalGov | null; unknownId: string | null } {
  const query = parsePermalink(window.location.search);
  if (query.id == null) return { gov: DEFAULT_GOV, unknownId: null };
  const matched = lookupGov(query.id);
  return matched == null ? { gov: null, unknownId: query.id } : { gov: matched, unknownId: null };
}

function pageTitle(gov: LocalGov, year: number, view: ViewId): string {
  if (view === "revenue") return `${gov.prefecture} ${gov.city} 歳入の時系列（streamgraph）`;
  if (view === "expenditure") return `${gov.prefecture} ${gov.city} 歳出の時系列（streamgraph）`;
  return `${gov.prefecture} ${gov.city} ${year}年度の財政収支`;
}

function ledeText(
  view: ViewId,
  data: CityFinance | null,
  year: number | null,
): string {
  if (view === "revenue") {
    return "歳入の科目が、どう変化したか。";
  }
  if (view === "expenditure") {
    return "歳出の科目が、どう変化したか。";
  }
  if (data != null && year != null) {
    const graph = buildYearGraph(data, year);
    return `歳入 ${formatYen(graph.total)} が、目的別歳出と形式収支へどう分かれたか。`;
  }
  return "歳入が、目的別歳出と形式収支へどう分かれたか。";
}

export function App() {
  const boot = govFromSearch();
  const [gov, setGov] = useState<LocalGov | null>(boot.gov);
  const [unknownId] = useState<string | null>(boot.unknownId);
  const [data, setData] = useState<CityFinance | null>(null);
  const [error, setError] = useState<string | null>(unknownId ? `団体コード「${unknownId}」はまだありません。` : null);
  const [year, setYear] = useState<number | null>(null);
  const [view, setView] = useState<ViewId>(parsePermalink(window.location.search).view);
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
    applyPermalink(gov.code, year, view);
    document.title = pageTitle(gov, year, view);
  }, [gov, year, view]);

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

  const yearSpan =
    data != null && data.years.length > 0
      ? `${data.years[0]}–${data.years[data.years.length - 1]}`
      : null;

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
          <ViewNav view={view} onView={setView} yearSpan={yearSpan} />
        </div>
      </header>
      <p className="lede">{ledeText(view, data, year)}</p>

      {error ? <p className="status">{error}</p> : null}

      {data && year != null ? (
        <>
          {view === "year" ? (
            <YearView key="year" data={data} year={year} onYear={setYear} />
          ) : (
            <StreamgraphView key={view} data={data} kind={view} />
          )}
          <footer className="source">
            出典: {data.source}。{data.sourceDetail} 千円を百万円に四捨五入し、億・万で表記。形式収支は歳入合計−歳出合計。
          </footer>
        </>
      ) : error ? null : (
        <p className="status">読み込み中</p>
      )}
    </div>
  );
}
