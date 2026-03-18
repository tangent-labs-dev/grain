"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/app/components/PageHeader";
import { Button } from "@/app/components/ui/Button";
import { Card } from "@/app/components/ui/Card";
import { ListRow } from "@/app/components/ui/ListRow";
import {
  applyDueTemplates,
  getBudgets,
  getCategories,
  getPreferences,
  getTransactions,
} from "@/lib/db";
import {
  budgetProgress,
  categoryLabelMap,
  getMonthToDateDelta,
  monthKey,
  summarizeTransactions,
} from "@/lib/finance";
import { formatCurrency, formatDate } from "@/lib/format";
import type { Budget, Category, Preferences, Transaction } from "@/lib/types";

function MatrixMeter({
  value,
  danger = false,
  cells = 18,
}: {
  value: number;
  danger?: boolean;
  cells?: number;
}) {
  const clamped = Math.max(0, Math.min(1, value));
  const active = Math.round(clamped * cells);

  return (
    <div
      className="grid gap-1"
      style={{ gridTemplateColumns: `repeat(${cells}, minmax(0, 1fr))` }}
    >
      {Array.from({ length: cells }).map((_, index) => (
        <span
          key={index}
          className={`h-2 border border-(--border) ${
            index < active
              ? danger
                ? "bg-(--danger)"
                : "bg-white"
              : "bg-transparent"
          }`}
        />
      ))}
    </div>
  );
}

export default function Home() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [preferences, setPreferences] = useState<Preferences>({
    id: "prefs",
    currency: "USD",
    locale: "en-US",
  });
  const [loading, setLoading] = useState(true);
  const [runningDue, setRunningDue] = useState(false);

  useEffect(() => {
    async function load() {
      const month = monthKey();
      const [txRows, categoryRows, prefs, budgetRows] = await Promise.all([
        getTransactions(),
        getCategories(),
        getPreferences(),
        getBudgets(month),
      ]);
      setTransactions(txRows);
      setCategories(categoryRows);
      setPreferences(prefs);
      setBudgets(budgetRows);
      setLoading(false);
    }

    load().catch(() => setLoading(false));
  }, []);

  const summary = useMemo(
    () => summarizeTransactions(transactions),
    [transactions],
  );
  const mtdDelta = useMemo(
    () => getMonthToDateDelta(transactions),
    [transactions],
  );
  const labels = useMemo(() => categoryLabelMap(categories), [categories]);
  const currentMonth = monthKey();
  const budgetItems = useMemo(
    () => budgetProgress(budgets, transactions, categories, currentMonth),
    [budgets, transactions, categories, currentMonth],
  );
  const focusedBudgets = useMemo(
    () => budgetItems.filter((item) => item.progress >= 0.6).slice(0, 3),
    [budgetItems],
  );

  return (
    <main>
      <PageHeader
        title="Dashboard"
        subtitle="Grain Finance"
        actions={
          <div className="flex gap-2">
            <Button
              variant="secondary"
              className="text-xs"
              disabled={runningDue}
              onClick={async () => {
                setRunningDue(true);
                try {
                  const count = await applyDueTemplates();
                  if (count > 0) {
                    const refreshed = await getTransactions();
                    setTransactions(refreshed);
                  }
                } finally {
                  setRunningDue(false);
                }
              }}
            >
              {runningDue ? "Running..." : "Run Due"}
            </Button>
          </div>
        }
      />

      <section className="space-y-4">
        <Card className="space-y-3">
          <p className="text-xs uppercase tracking-[0.12em] text-(--muted)">
            Current Balance
          </p>
          <p className="text-4xl font-semibold tracking-[0.05em]">
            {formatCurrency(summary.net, preferences.locale, preferences.currency)}
          </p>
          <p className="text-xs uppercase tracking-[0.12em] text-(--muted)">
            Month To Date:{" "}
            {formatCurrency(mtdDelta, preferences.locale, preferences.currency)}
          </p>
          <div className="grid grid-cols-2 gap-3 border-y border-(--border) py-2 text-xs matrix-label">
            <div>
              <p className="text-(--muted)">Income</p>
              <p className="mt-1">
                {formatCurrency(
                  summary.income,
                  preferences.locale,
                  preferences.currency,
                )}
              </p>
            </div>
            <div>
              <p className="text-(--muted)">Expenses</p>
              <p className="mt-1">
                {formatCurrency(
                  summary.expenses,
                  preferences.locale,
                  preferences.currency,
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between text-xs matrix-label">
            <Link href="/transactions/new">
              <Button className="px-3">Add Transaction</Button>
            </Link>
            <div className="flex gap-3 text-(--muted)">
              <Link href="/insights">Insights</Link>
              <Link href="/budgets">Budgets</Link>
              <Link href="/wallets">Wallets</Link>
            </div>
          </div>
        </Card>

        <Card className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs matrix-label text-(--muted)">Budget Focus</p>
            <Link href="/budgets" className="text-xs matrix-label">
              Manage
            </Link>
          </div>
          {budgetItems.length === 0 ? (
            <p className="text-sm muted">No budgets set for this month.</p>
          ) : focusedBudgets.length === 0 ? (
            <p className="text-sm muted">
              Budgets look healthy. No category is near the limit.
            </p>
          ) : (
            focusedBudgets.map((item) => (
              <div key={item.id}>
                <div className="mb-1 flex justify-between text-xs matrix-label">
                  <span>{item.categoryName}</span>
                  <span>
                    {formatCurrency(
                      item.spent,
                      preferences.locale,
                      preferences.currency,
                    )}{" "}
                    /{" "}
                    {formatCurrency(
                      item.limitAmount,
                      preferences.locale,
                      preferences.currency,
                    )}
                  </span>
                </div>
                <MatrixMeter value={item.progress} danger={item.overLimit} />
              </div>
            ))
          )}
        </Card>

        <Card>
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs uppercase tracking-[0.12em] text-(--muted)">
              Recent Transactions
            </p>
            <Link href="/transactions" className="text-xs uppercase tracking-widest">
              View all
            </Link>
          </div>

          {loading ? <p className="muted text-sm">Loading...</p> : null}

          {!loading && transactions.length === 0 ? (
            <div className="space-y-3">
              <p className="text-sm muted">
                No transactions yet. Add your first entry to start tracking.
              </p>
              <Link href="/transactions/new">
                <Button className="w-full">Add First Transaction</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {transactions.slice(0, 4).map((transaction) => (
                <ListRow
                  key={transaction.id}
                  title={labels.get(transaction.categoryId) ?? "Unknown"}
                  subtitle={formatDate(transaction.createdAt, preferences.locale)}
                  trailing={
                    <span className="text-xs uppercase tracking-widest">
                      {transaction.type === "expense" ? "-" : "+"}
                      {formatCurrency(
                        transaction.amount,
                        preferences.locale,
                        preferences.currency,
                      )}
                    </span>
                  }
                />
              ))}
            </div>
          )}
        </Card>
      </section>
    </main>
  );
}
