import type { ViewId } from "../lib/permalink.ts";

const TABS: { id: ViewId; label: string }[] = [
  { id: "year", label: "年度" },
  { id: "revenue", label: "歳入" },
  { id: "expenditure", label: "歳出" },
];

interface ViewNavProps {
  view: ViewId;
  onView: (view: ViewId) => void;
  yearSpan: string | null;
}

function hint(id: ViewId, yearSpan: string | null): string {
  if (id === "year") return "歳入→歳出";
  return yearSpan ?? "時系列";
}

export function ViewNav({ view, onView, yearSpan }: ViewNavProps) {
  return (
    <nav className="view-nav" aria-label="ビュー">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          aria-current={view === tab.id ? "page" : undefined}
          onClick={() => onView(tab.id)}
        >
          {tab.label}
          <span className="view-nav__hint">{hint(tab.id, yearSpan)}</span>
        </button>
      ))}
    </nav>
  );
}
