"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/app/components/PageHeader";
import { Button } from "@/app/components/ui/Button";
import { Card } from "@/app/components/ui/Card";
import { Input } from "@/app/components/ui/Input";
import { Modal } from "@/app/components/ui/Modal";
import {
  addRecurringTemplate,
  addTransaction,
  applyDueTemplates,
  deleteRecurringTemplate,
  getCategories,
  getPreferences,
  getRecurringTemplates,
  getWallets,
  updateRecurringTemplate,
} from "@/lib/db";
import { formatCurrency, formatDate } from "@/lib/format";
import type {
  Category,
  Preferences,
  RecurringFrequency,
  RecurringTemplate,
  TransactionType,
  Wallet,
} from "@/lib/types";

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<RecurringTemplate[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [preferences, setPreferences] = useState<Preferences>({
    id: "prefs",
    currency: "USD",
    locale: "en-US",
  });
  const [form, setForm] = useState({
    name: "",
    amount: "",
    type: "expense" as TransactionType,
    categoryId: "",
    walletId: "",
    frequency: "monthly" as RecurringFrequency,
    nextRunAt: new Date().toISOString().slice(0, 10),
    note: "",
  });
  const [showTemplateModal, setShowTemplateModal] = useState(false);

  async function load() {
    const [templateRows, categoryRows, walletRows, prefs] = await Promise.all([
      getRecurringTemplates(),
      getCategories(),
      getWallets(),
      getPreferences(),
    ]);
    setTemplates(templateRows);
    setCategories(categoryRows.filter((category) => !category.archived));
    setWallets(walletRows);
    setPreferences(prefs);
    if (!form.categoryId && categoryRows.length) {
      setForm((current) => ({ ...current, categoryId: categoryRows[0].id }));
    }
    if (!form.walletId && walletRows.length) {
      setForm((current) => ({ ...current, walletId: walletRows[0].id }));
    }
  }

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      getRecurringTemplates(),
      getCategories(),
      getWallets(),
      getPreferences(),
    ])
      .then(([templateRows, categoryRows, walletRows, prefs]) => {
        if (cancelled) return;
        setTemplates(templateRows);
        setCategories(categoryRows.filter((category) => !category.archived));
        setWallets(walletRows);
        setPreferences(prefs);
        if (categoryRows.length) {
          setForm((current) =>
            current.categoryId
              ? current
              : { ...current, categoryId: categoryRows[0].id },
          );
        }
        if (walletRows.length) {
          setForm((current) =>
            current.walletId ? current : { ...current, walletId: walletRows[0].id },
          );
        }
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  const categoryMap = useMemo(
    () => new Map(categories.map((category) => [category.id, category.name])),
    [categories],
  );
  const walletMap = useMemo(
    () => new Map(wallets.map((wallet) => [wallet.id, wallet.name])),
    [wallets],
  );
  const fmt = (value: number) =>
    formatCurrency(value, preferences.locale, preferences.currency);

  return (
    <main>
      <PageHeader
        title="Recurring"
        subtitle="Templates"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button className="text-xs" onClick={() => setShowTemplateModal(true)}>
              Add
            </Button>
            <Button
              variant="secondary"
              className="text-xs"
              onClick={async () => {
                await applyDueTemplates();
                await load();
              }}
            >
              Run Due
            </Button>
          </div>
        }
      />

      <section className="mt-4 space-y-2">
        {templates.map((template) => (
          <Card key={template.id} className="space-y-2">
            <div className="flex flex-col items-start gap-3 min-[420px]:flex-row min-[420px]:items-center min-[420px]:justify-between">
              <p className="text-sm matrix-label">{template.name}</p>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="ghost"
                  className="px-2 py-1 text-[0.64rem]"
                  onClick={async () => {
                    await addTransaction({
                      amount: template.amount,
                      type: template.type,
                      categoryId: template.categoryId,
                      walletId: template.walletId,
                      note: template.note,
                      templateId: template.id,
                    });
                  }}
                >
                  Use
                </Button>
                <Button
                  variant={template.active ? "secondary" : "primary"}
                  className="px-2 py-1 text-[0.64rem]"
                  onClick={async () => {
                    await updateRecurringTemplate(template.id, {
                      active: !template.active,
                    });
                    await load();
                  }}
                >
                  {template.active ? "Pause" : "Resume"}
                </Button>
                <Button
                  variant="danger"
                  className="px-2 py-1 text-[0.64rem]"
                  onClick={async () => {
                    await deleteRecurringTemplate(template.id);
                    await load();
                  }}
                >
                  Del
                </Button>
              </div>
            </div>
            <p className="text-xs matrix-label text-[var(--muted)]">
              {template.type} • {categoryMap.get(template.categoryId)} •{" "}
              {walletMap.get(template.walletId)}
            </p>
            <p className="text-xs matrix-label text-[var(--muted)]">
              {fmt(template.amount)} • {template.frequency} • Next{" "}
              {formatDate(template.nextRunAt, preferences.locale)}
            </p>
          </Card>
        ))}
        {templates.length === 0 ? (
          <Card>
            <p className="text-sm muted">
              No recurring templates yet. Add one to automate repeated entries.
            </p>
            <Link href="/transactions/new" className="mt-3 inline-block">
              <Button variant="secondary">Manual Entry</Button>
            </Link>
          </Card>
        ) : null}
      </section>

      <Modal
        open={showTemplateModal}
        onClose={() => setShowTemplateModal(false)}
        title="Add Recurring Template"
        subtitle="Automate repeated entries"
      >
        <div className="space-y-3">
          <label className="block">
            <span className="mb-2 block text-xs matrix-label text-[var(--muted)]">
              Name
            </span>
            <Input
              value={form.name}
              onChange={(event) =>
                setForm((current) => ({ ...current, name: event.target.value }))
              }
              placeholder="Rent / Salary"
            />
          </label>

          <div className="grid grid-cols-1 gap-2 min-[420px]:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-xs matrix-label text-[var(--muted)]">
                Amount
              </span>
              <Input
                inputMode="decimal"
                value={form.amount}
                onChange={(event) =>
                  setForm((current) => ({ ...current, amount: event.target.value }))
                }
                placeholder="0.00"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-xs matrix-label text-[var(--muted)]">
                Type
              </span>
              <select
                value={form.type}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    type: event.target.value as TransactionType,
                  }))
                }
                className="w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm matrix-label"
              >
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
            </label>
          </div>

          <div className="grid grid-cols-1 gap-2 min-[420px]:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-xs matrix-label text-[var(--muted)]">
                Category
              </span>
              <select
                value={form.categoryId}
                onChange={(event) =>
                  setForm((current) => ({ ...current, categoryId: event.target.value }))
                }
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
                Wallet
              </span>
              <select
                value={form.walletId}
                onChange={(event) =>
                  setForm((current) => ({ ...current, walletId: event.target.value }))
                }
                className="w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm matrix-label"
              >
                {wallets.map((wallet) => (
                  <option key={wallet.id} value={wallet.id}>
                    {wallet.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid grid-cols-1 gap-2 min-[420px]:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-xs matrix-label text-[var(--muted)]">
                Frequency
              </span>
              <select
                value={form.frequency}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    frequency: event.target.value as RecurringFrequency,
                  }))
                }
                className="w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm matrix-label"
              >
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </label>
            <label className="block">
              <span className="mb-2 block text-xs matrix-label text-[var(--muted)]">
                Next Run
              </span>
              <Input
                type="date"
                value={form.nextRunAt}
                onChange={(event) =>
                  setForm((current) => ({ ...current, nextRunAt: event.target.value }))
                }
              />
            </label>
          </div>

          <label className="block">
            <span className="mb-2 block text-xs matrix-label text-[var(--muted)]">
              Note
            </span>
            <Input
              value={form.note}
              onChange={(event) =>
                setForm((current) => ({ ...current, note: event.target.value }))
              }
              placeholder="Optional note"
            />
          </label>

          <Button
            className="w-full"
            onClick={async () => {
              const parsedAmount = Number(form.amount);
              if (
                !form.name.trim() ||
                !Number.isFinite(parsedAmount) ||
                parsedAmount <= 0 ||
                !form.categoryId ||
                !form.walletId
              ) {
                return;
              }
              await addRecurringTemplate({
                name: form.name,
                amount: parsedAmount,
                type: form.type,
                categoryId: form.categoryId,
                walletId: form.walletId,
                frequency: form.frequency,
                nextRunAt: new Date(`${form.nextRunAt}T00:00:00`).toISOString(),
                note: form.note.trim() || undefined,
              });
              setForm((current) => ({ ...current, name: "", amount: "", note: "" }));
              setShowTemplateModal(false);
              await load();
            }}
          >
            Save Template
          </Button>
        </div>
      </Modal>
    </main>
  );
}
