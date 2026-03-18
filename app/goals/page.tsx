"use client";

import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/app/components/PageHeader";
import { Button } from "@/app/components/ui/Button";
import { Card } from "@/app/components/ui/Card";
import { Input } from "@/app/components/ui/Input";
import { Modal } from "@/app/components/ui/Modal";
import {
  addGoal,
  deleteGoal,
  getGoals,
  getPreferences,
  getWallets,
  updateGoal,
} from "@/lib/db";
import { goalProgress } from "@/lib/finance";
import { formatCurrency } from "@/lib/format";
import type { Goal, Preferences, Wallet } from "@/lib/types";

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [preferences, setPreferences] = useState<Preferences>({
    id: "prefs",
    currency: "USD",
    locale: "en-US",
  });
  const [form, setForm] = useState({
    name: "",
    targetAmount: "",
    currentAmount: "",
    walletId: "",
    deadline: "",
  });
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [editingGoalAmount, setEditingGoalAmount] = useState("");

  async function load() {
    const [goalRows, walletRows, prefs] = await Promise.all([
      getGoals(),
      getWallets(),
      getPreferences(),
    ]);
    setGoals(goalRows);
    setWallets(walletRows);
    setPreferences(prefs);
    if (!form.walletId && walletRows.length) {
      setForm((current) => ({ ...current, walletId: walletRows[0].id }));
    }
  }

  useEffect(() => {
    let cancelled = false;
    Promise.all([getGoals(), getWallets(), getPreferences()])
      .then(([goalRows, walletRows, prefs]) => {
        if (cancelled) return;
        setGoals(goalRows);
        setWallets(walletRows);
        setPreferences(prefs);
        if (walletRows.length) {
          setForm((current) =>
            current.walletId
              ? current
              : { ...current, walletId: walletRows[0].id },
          );
        }
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  const walletMap = useMemo(
    () => new Map(wallets.map((wallet) => [wallet.id, wallet.name])),
    [wallets],
  );
  const fmt = (value: number) =>
    formatCurrency(value, preferences.locale, preferences.currency);

  return (
    <main>
      <PageHeader
        title="Goals"
        subtitle="Savings Tracker"
        actions={
          <Button className="text-xs" onClick={() => setShowGoalModal(true)}>
            Add
          </Button>
        }
      />

      <section className="mt-4 space-y-2">
        {goals.map((goal) => {
          const progress = goalProgress(goal);
          return (
            <Card key={goal.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm matrix-label">{goal.name}</p>
                  <p className="text-xs matrix-label text-[var(--muted)]">
                    {fmt(goal.currentAmount)} / {fmt(goal.targetAmount)}
                  </p>
                  {goal.walletId ? (
                    <p className="text-xs matrix-label text-[var(--muted)]">
                      Wallet: {walletMap.get(goal.walletId) ?? "Unknown"}
                    </p>
                  ) : null}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    className="px-2 py-1 text-[0.64rem]"
                    onClick={() => {
                      setEditingGoalId(goal.id);
                      setEditingGoalAmount(String(goal.currentAmount));
                    }}
                  >
                    Update
                  </Button>
                  <Button
                    variant="danger"
                    className="px-2 py-1 text-[0.64rem]"
                    onClick={async () => {
                      await deleteGoal(goal.id);
                      await load();
                    }}
                  >
                    Del
                  </Button>
                </div>
              </div>
              <div className="h-2 rounded bg-[var(--surface-elevated)]">
                <div
                  className="h-2 rounded bg-white"
                  style={{ width: `${progress * 100}%` }}
                />
              </div>
            </Card>
          );
        })}
      </section>

      <Modal
        open={showGoalModal}
        onClose={() => setShowGoalModal(false)}
        title="Add Goal"
        subtitle="Track savings progress"
      >
        <div className="space-y-3">
          <label className="block">
            <span className="mb-2 block text-xs matrix-label text-[var(--muted)]">
              Goal Name
            </span>
            <Input
              value={form.name}
              onChange={(event) =>
                setForm((current) => ({ ...current, name: event.target.value }))
              }
              placeholder="Emergency fund"
            />
          </label>
          <div className="grid grid-cols-2 gap-2">
            <label className="block">
              <span className="mb-2 block text-xs matrix-label text-[var(--muted)]">
                Target
              </span>
              <Input
                inputMode="decimal"
                value={form.targetAmount}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    targetAmount: event.target.value,
                  }))
                }
                placeholder="1000"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-xs matrix-label text-[var(--muted)]">
                Current
              </span>
              <Input
                inputMode="decimal"
                value={form.currentAmount}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    currentAmount: event.target.value,
                  }))
                }
                placeholder="0"
              />
            </label>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <label className="block">
              <span className="mb-2 block text-xs matrix-label text-[var(--muted)]">
                Wallet (Optional)
              </span>
              <select
                value={form.walletId}
                onChange={(event) =>
                  setForm((current) => ({ ...current, walletId: event.target.value }))
                }
                className="w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm matrix-label"
              >
                <option value="">None</option>
                {wallets.map((wallet) => (
                  <option key={wallet.id} value={wallet.id}>
                    {wallet.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-2 block text-xs matrix-label text-[var(--muted)]">
                Deadline (Optional)
              </span>
              <Input
                type="date"
                value={form.deadline}
                onChange={(event) =>
                  setForm((current) => ({ ...current, deadline: event.target.value }))
                }
              />
            </label>
          </div>

          <Button
            className="w-full"
            onClick={async () => {
              const target = Number(form.targetAmount);
              const current = Number(form.currentAmount || "0");
              if (!form.name.trim() || !Number.isFinite(target) || target <= 0) return;
              await addGoal({
                name: form.name,
                targetAmount: target,
                currentAmount: Number.isFinite(current) ? current : 0,
                walletId: form.walletId || undefined,
                deadline: form.deadline
                  ? new Date(`${form.deadline}T00:00:00`).toISOString()
                  : undefined,
              });
              setForm({
                name: "",
                targetAmount: "",
                currentAmount: "",
                walletId: "",
                deadline: "",
              });
              setShowGoalModal(false);
              await load();
            }}
          >
            Save Goal
          </Button>
        </div>
      </Modal>

      <Modal
        open={Boolean(editingGoalId)}
        onClose={() => {
          setEditingGoalId(null);
          setEditingGoalAmount("");
        }}
        title="Update Goal Progress"
      >
        <div className="space-y-3">
          <label className="block">
            <span className="mb-2 block text-xs matrix-label text-[var(--muted)]">
              Current Saved Amount
            </span>
            <Input
              inputMode="decimal"
              value={editingGoalAmount}
              onChange={(event) => setEditingGoalAmount(event.target.value)}
              placeholder="0.00"
            />
          </label>
          <Button
            className="w-full"
            onClick={async () => {
              if (!editingGoalId) return;
              const parsed = Number(editingGoalAmount);
              if (!Number.isFinite(parsed) || parsed < 0) return;
              await updateGoal(editingGoalId, { currentAmount: parsed });
              setEditingGoalId(null);
              setEditingGoalAmount("");
              await load();
            }}
          >
            Save Progress
          </Button>
        </div>
      </Modal>
    </main>
  );
}
