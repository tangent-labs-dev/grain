"use client";

import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/app/components/PageHeader";
import { Button } from "@/app/components/ui/Button";
import { Card } from "@/app/components/ui/Card";
import { Input } from "@/app/components/ui/Input";
import { Modal } from "@/app/components/ui/Modal";
import {
  deleteBudget,
  getBudgets,
  getCategories,
  getPreferences,
  getTransactions,
  upsertBudget,
} from "@/lib/db";
import { budgetProgress, monthKey } from "@/lib/finance";
import { formatCurrency } from "@/lib/format";
import type { Budget, Category, Preferences, Transaction } from "@/lib/types";

export default function BudgetsPage() {
  const [month, setMonth] = useState(monthKey());
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [preferences, setPreferences] = useState<Preferences>({
    id: "prefs",
    currency: "USD",
    locale: "en-US",
  });
  const [categoryId, setCategoryId] = useState("");
  const [limitAmount, setLimitAmount] = useState("");
  const [loading, setLoading] = useState(true);
  const [showBudgetModal, setShowBudgetModal] = useState(false);

  async function load(targetMonth = month) {
    const [categoryRows, txRows, budgetRows, prefs] = await Promise.all([
      getCategories(),
      getTransactions(),
      getBudgets(targetMonth),
      getPreferences(),
    ]);
    setCategories(categoryRows.filter((category) => !category.archived));
    setTransactions(txRows);
    setBudgets(budgetRows);
    setPreferences(prefs);
    setLoading(false);
    if (!categoryId && categoryRows.length) setCategoryId(categoryRows[0].id);
  }

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      getCategories(),
      getTransactions(),
      getBudgets(month),
      getPreferences(),
    ])
      .then(([categoryRows, txRows, budgetRows, prefs]) => {
        if (cancelled) return;
        setCategories(categoryRows.filter((category) => !category.archived));
        setTransactions(txRows);
        setBudgets(budgetRows);
        setPreferences(prefs);
        setLoading(false);
        if (categoryRows.length) {
          setCategoryId((current) => current || categoryRows[0].id);
        }
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [month]);

  const progress = useMemo(
    () => budgetProgress(budgets, transactions, categories, month),
    [budgets, transactions, categories, month],
  );

  const fmt = (value: number) =>
    formatCurrency(value, preferences.locale, preferences.currency);

  return (
    <main>
      <PageHeader
        title="Budgets"
        subtitle="Monthly Limits"
        actions={
          <Button className="text-xs" onClick={() => setShowBudgetModal(true)}>
            Add
          </Button>
        }
      />

      <section className="mt-4 space-y-3">
        {loading ? <p className="muted text-sm">Loading budgets...</p> : null}
        {progress.map((item) => (
          <Card key={item.id} className="space-y-2">
            <div className="flex flex-col items-start gap-3 min-[420px]:flex-row min-[420px]:items-center min-[420px]:justify-between">
              <p className="text-sm matrix-label">{item.categoryName}</p>
              <Button
                variant="danger"
                className="px-2 py-1 text-[0.64rem]"
                onClick={async () => {
                  await deleteBudget(item.id);
                  await load(month);
                }}
              >
                Remove
              </Button>
            </div>
            <p className="text-xs matrix-label text-[var(--muted)]">
              {fmt(item.spent)} / {fmt(item.limitAmount)}
            </p>
            <div className="h-2 rounded bg-[var(--surface-elevated)]">
              <div
                className={`h-2 rounded ${item.overLimit ? "bg-[var(--danger)]" : "bg-white"}`}
                style={{ width: `${Math.min(item.progress, 1) * 100}%` }}
              />
            </div>
            {item.overLimit ? (
              <p className="text-xs matrix-label text-[var(--danger)]">
                Over limit by {fmt(item.spent - item.limitAmount)}
              </p>
            ) : null}
          </Card>
        ))}
        {!loading && progress.length === 0 ? (
          <Card>
            <p className="text-sm muted">No budgets set for this month.</p>
          </Card>
        ) : null}
      </section>

      <Modal
        open={showBudgetModal}
        onClose={() => setShowBudgetModal(false)}
        title="Set Budget"
        subtitle="Monthly category limit"
      >
        <div className="space-y-3">
          <label className="block">
            <span className="mb-2 block text-xs matrix-label text-[var(--muted)]">
              Month
            </span>
            <Input
              type="month"
              value={month}
              onChange={(event) => setMonth(event.target.value)}
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-xs matrix-label text-[var(--muted)]">
              Category
            </span>
            <select
              value={categoryId}
              onChange={(event) => setCategoryId(event.target.value)}
              className="w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm matrix-label"
            >
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-xs matrix-label text-[var(--muted)]">
              Limit Amount
            </span>
            <Input
              inputMode="decimal"
              value={limitAmount}
              onChange={(event) => setLimitAmount(event.target.value)}
              placeholder="0.00"
            />
          </label>

          <Button
            className="w-full"
            onClick={async () => {
              const parsed = Number(limitAmount);
              if (!categoryId || !Number.isFinite(parsed) || parsed <= 0) return;
              await upsertBudget({ month, categoryId, limitAmount: parsed });
              setLimitAmount("");
              setShowBudgetModal(false);
              await load(month);
            }}
          >
            Save Budget
          </Button>
        </div>
      </Modal>
    </main>
  );
}
