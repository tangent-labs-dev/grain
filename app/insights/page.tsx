"use client";

import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/app/components/PageHeader";
import { Card } from "@/app/components/ui/Card";
import { SegmentedControl } from "@/app/components/ui/SegmentedControl";
import { getCategories, getPreferences, getTransactions } from "@/lib/db";
import { categoryBreakdown, monthKey } from "@/lib/finance";
import { formatCurrency } from "@/lib/format";
import type { Category, Preferences, Transaction } from "@/lib/types";

type TrendPoint = { label: string; income: number; expenses: number };
type Range = "daily" | "weekly" | "monthly" | "quarterly";

function bucketStartForRange(range: Range, date: Date) {
  const base = new Date(date);
  if (range === "daily") {
    base.setHours(0, 0, 0, 0);
    return base;
  }
  if (range === "weekly") {
    const day = base.getDay();
    const delta = (day + 6) % 7;
    base.setDate(base.getDate() - delta);
    base.setHours(0, 0, 0, 0);
    return base;
  }
  if (range === "monthly") {
    return new Date(base.getFullYear(), base.getMonth(), 1);
  }
  const quarterStart = Math.floor(base.getMonth() / 3) * 3;
  return new Date(base.getFullYear(), quarterStart, 1);
}

function moveBucket(range: Range, start: Date, delta: number) {
  const next = new Date(start);
  if (range === "daily") next.setDate(next.getDate() + delta);
  else if (range === "weekly") next.setDate(next.getDate() + delta * 7);
  else if (range === "monthly") next.setMonth(next.getMonth() + delta);
  else next.setMonth(next.getMonth() + delta * 3);
  return next;
}

function bucketKey(range: Range, date: Date) {
  if (range === "daily") return date.toISOString().slice(0, 10);
  if (range === "weekly") return `w-${date.toISOString().slice(0, 10)}`;
  if (range === "monthly") return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  return `q-${date.getFullYear()}-${Math.floor(date.getMonth() / 3) + 1}`;
}

function bucketLabel(range: Range, date: Date) {
  if (range === "daily") {
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }
  if (range === "weekly") {
    return `${date.toLocaleDateString("en-US", { month: "short" })} ${date.getDate()}`;
  }
  if (range === "monthly") {
    return date.toLocaleDateString("en-US", { month: "short" });
  }
  return `Q${Math.floor(date.getMonth() / 3) + 1} ${date.getFullYear()}`;
}

function pointsForRange(transactions: Transaction[], range: Range): TrendPoint[] {
  const buckets = range === "daily" ? 10 : range === "weekly" ? 8 : range === "monthly" ? 6 : 4;
  const now = bucketStartForRange(range, new Date());
  const starts = Array.from({ length: buckets }, (_, index) =>
    moveBucket(range, now, index - (buckets - 1)),
  );

  const map = new Map<string, { income: number; expenses: number }>();
  for (const tx of transactions) {
    const start = bucketStartForRange(range, new Date(tx.createdAt));
    const key = bucketKey(range, start);
    const current = map.get(key) ?? { income: 0, expenses: 0 };
    if (tx.type === "income") current.income += tx.amount;
    else current.expenses += tx.amount;
    map.set(key, current);
  }

  return starts.map((start) => {
    const key = bucketKey(range, start);
    const values = map.get(key) ?? { income: 0, expenses: 0 };
    return {
      label: bucketLabel(range, start),
      income: values.income,
      expenses: values.expenses,
    };
  });
}

function TrendBars({
  values,
  formatter,
}: {
  values: TrendPoint[];
  formatter: (value: number) => string;
}) {
  if (values.length === 0) return <p className="text-sm muted">No data available yet.</p>;
  const max = Math.max(1, ...values.flatMap((value) => [value.income, value.expenses]));

  return (
    <div className="space-y-3">
      <div
        className="grid gap-3 overflow-x-auto pb-2"
        style={{ gridTemplateColumns: `repeat(${values.length}, minmax(64px, 1fr))` }}
      >
        {values.map((item) => (
          <div key={item.label} className="space-y-2">
            <div className="h-32 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] p-2">
              <div className="flex h-full items-end justify-center gap-2">
                <div
                  className="w-3 bg-white"
                  style={{ height: `${Math.max(4, (item.expenses / max) * 100)}%` }}
                  title={`Expenses ${formatter(item.expenses)}`}
                />
                <div
                  className="w-3 bg-[var(--muted)]"
                  style={{ height: `${Math.max(4, (item.income / max) * 100)}%` }}
                  title={`Income ${formatter(item.income)}`}
                />
              </div>
            </div>
            <p className="text-center text-[0.62rem] matrix-label text-[var(--muted)]">
              {item.label}
            </p>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-4 text-[0.65rem] matrix-label text-[var(--muted)]">
        <span className="inline-flex items-center gap-1">
          <span className="h-2 w-2 bg-white" />
          Expense
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-2 w-2 bg-[var(--muted)]" />
          Income
        </span>
      </div>
    </div>
  );
}

function CategoryBars({
  values,
  formatter,
}: {
  values: { categoryId: string; label: string; total: number }[];
  formatter: (value: number) => string;
}) {
  if (values.length === 0) return <p className="text-sm muted">No expenses this month yet.</p>;
  const items = values.slice(0, 6);
  const total = items.reduce((sum, item) => sum + item.total, 0) || 1;
  return (
    <div className="space-y-3">
      {items.map((item) => {
        const ratio = item.total / total;
        return (
          <div key={item.categoryId} className="space-y-1">
            <div className="flex items-center justify-between text-xs matrix-label">
              <span>{item.label}</span>
              <span className="text-[var(--muted)]">
                {formatter(item.total)} ({Math.round(ratio * 100)}%)
              </span>
            </div>
            <div className="h-2 bg-[var(--surface-elevated)]">
              <div className="h-2 bg-white" style={{ width: `${ratio * 100}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function InsightsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [preferences, setPreferences] = useState<Preferences>({
    id: "prefs",
    currency: "USD",
    locale: "en-US",
  });
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<Range>("monthly");

  useEffect(() => {
    Promise.all([getTransactions(), getCategories(), getPreferences()])
      .then(([txRows, categoryRows, prefs]) => {
        setTransactions(txRows);
        setCategories(categoryRows);
        setPreferences(prefs);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const currentMonth = monthKey();
  const trend = useMemo(() => pointsForRange(transactions, range), [transactions, range]);
  const breakdown = useMemo(
    () => categoryBreakdown(transactions, categories, currentMonth),
    [transactions, categories, currentMonth],
  );

  const fmt = (value: number) =>
    formatCurrency(value, preferences.locale, preferences.currency);

  return (
    <main>
      <PageHeader title="Insights" subtitle="Spending Intelligence" />

      {loading ? <p className="muted text-sm">Loading insights...</p> : null}

      <section className="space-y-4">
        <Card>
          <SegmentedControl
            label="View"
            value={range}
            options={[
              { label: "Daily", value: "daily" },
              { label: "Weekly", value: "weekly" },
              { label: "Monthly", value: "monthly" },
              { label: "Quarterly", value: "quarterly" },
            ]}
            onChange={setRange}
          />
          <p className="mb-3 mt-4 text-xs matrix-label text-[var(--muted)]">
            Income vs Expense Trend
          </p>
          <TrendBars values={trend} formatter={fmt} />
        </Card>

        <Card>
          <p className="mb-3 text-xs matrix-label text-[var(--muted)]">
            Category Share (This Month)
          </p>
          <CategoryBars values={breakdown} formatter={fmt} />
        </Card>
      </section>
    </main>
  );
}
