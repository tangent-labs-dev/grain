"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/app/components/PageHeader";
import { Button } from "@/app/components/ui/Button";
import { Card } from "@/app/components/ui/Card";
import { Input } from "@/app/components/ui/Input";
import { Modal } from "@/app/components/ui/Modal";
import { Select } from "@/app/components/ui/Select";
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
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [editingForm, setEditingForm] = useState({
    name: "",
    amount: "",
    type: "expense" as TransactionType,
    categoryId: "",
    walletId: "",
    frequency: "monthly" as RecurringFrequency,
    nextRunAt: new Date().toISOString().slice(0, 10),
    note: "",
  });

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
                  variant="ghost"
                  className="px-2 py-1 text-[0.64rem]"
                  onClick={() => {
                    setEditingTemplateId(template.id);
                    setEditingForm({
                      name: template.name,
                      amount: String(template.amount),
                      type: template.type,
                      categoryId: template.categoryId,
                      walletId: template.walletId,
                      frequency: template.frequency,
                      nextRunAt: template.nextRunAt.slice(0, 10),
                      note: template.note ?? "",
                    });
                  }}
                >
                  Edit
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
        open={Boolean(editingTemplateId)}
        onClose={() => {
          setEditingTemplateId(null);
          setEditingForm({
            name: "",
            amount: "",
            type: "expense",
            categoryId: "",
            walletId: "",
            frequency: "monthly",
            nextRunAt: new Date().toISOString().slice(0, 10),
            note: "",
          });
        }}
        title="Edit Recurring Template"
        subtitle="Update template details"
      >
        <div className="space-y-3">
          <label className="block">
            <span className="mb-2 block text-xs matrix-label text-[var(--muted)]">
              Name
            </span>
            <Input
              value={editingForm.name}
              onChange={(event) =>
                setEditingForm((current) => ({ ...current, name: event.target.value }))
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
                value={editingForm.amount}
                onChange={(event) =>
                  setEditingForm((current) => ({ ...current, amount: event.target.value }))
                }
                placeholder="0.00"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-xs matrix-label text-[var(--muted)]">
                Type
              </span>
              <Select
                value={editingForm.type}
                onChange={(nextValue) =>
                  setEditingForm((current) => ({
                    ...current,
                    type: nextValue as TransactionType,
                  }))
                }
                options={[
                  { value: "expense", label: "Expense" },
                  { value: "income", label: "Income" },
                ]}
                className="text-sm"
                ariaLabel="Template type"
              />
            </label>
          </div>

          <div className="grid grid-cols-1 gap-2 min-[420px]:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-xs matrix-label text-[var(--muted)]">
                Category
              </span>
              <Select
                value={editingForm.categoryId}
                onChange={(nextValue) =>
                  setEditingForm((current) => ({
                    ...current,
                    categoryId: nextValue,
                  }))
                }
                options={categories.map((category) => ({
                  value: category.id,
                  label: category.name,
                }))}
                className="text-sm"
                ariaLabel="Template category"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-xs matrix-label text-[var(--muted)]">
                Wallet
              </span>
              <Select
                value={editingForm.walletId}
                onChange={(nextValue) =>
                  setEditingForm((current) => ({
                    ...current,
                    walletId: nextValue,
                  }))
                }
                options={wallets.map((wallet) => ({
                  value: wallet.id,
                  label: wallet.name,
                }))}
                className="text-sm"
                ariaLabel="Template wallet"
              />
            </label>
          </div>

          <div className="grid grid-cols-1 gap-2 min-[420px]:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-xs matrix-label text-[var(--muted)]">
                Frequency
              </span>
              <Select
                value={editingForm.frequency}
                onChange={(nextValue) =>
                  setEditingForm((current) => ({
                    ...current,
                    frequency: nextValue as RecurringFrequency,
                  }))
                }
                options={[
                  { value: "weekly", label: "Weekly" },
                  { value: "monthly", label: "Monthly" },
                ]}
                className="text-sm"
                ariaLabel="Template frequency"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-xs matrix-label text-[var(--muted)]">
                Next Run
              </span>
              <Input
                type="date"
                value={editingForm.nextRunAt}
                onChange={(event) =>
                  setEditingForm((current) => ({
                    ...current,
                    nextRunAt: event.target.value,
                  }))
                }
              />
            </label>
          </div>

          <label className="block">
            <span className="mb-2 block text-xs matrix-label text-[var(--muted)]">
              Note
            </span>
            <Input
              value={editingForm.note}
              onChange={(event) =>
                setEditingForm((current) => ({ ...current, note: event.target.value }))
              }
              placeholder="Optional note"
            />
          </label>

          <Button
            className="w-full"
            onClick={async () => {
              if (!editingTemplateId) return;
              const parsedAmount = Number(editingForm.amount);
              if (
                !editingForm.name.trim() ||
                !Number.isFinite(parsedAmount) ||
                parsedAmount <= 0 ||
                !editingForm.categoryId ||
                !editingForm.walletId ||
                !editingForm.nextRunAt
              ) {
                return;
              }
              await updateRecurringTemplate(editingTemplateId, {
                name: editingForm.name,
                amount: parsedAmount,
                type: editingForm.type,
                categoryId: editingForm.categoryId,
                walletId: editingForm.walletId,
                frequency: editingForm.frequency,
                nextRunAt: new Date(`${editingForm.nextRunAt}T00:00:00`).toISOString(),
                note: editingForm.note.trim() || undefined,
              });
              setEditingTemplateId(null);
              setEditingForm({
                name: "",
                amount: "",
                type: "expense",
                categoryId: "",
                walletId: "",
                frequency: "monthly",
                nextRunAt: new Date().toISOString().slice(0, 10),
                note: "",
              });
              await load();
            }}
          >
            Save Changes
          </Button>
        </div>
      </Modal>

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
              <Select
                value={form.type}
                onChange={(nextValue) =>
                  setForm((current) => ({
                    ...current,
                    type: nextValue as TransactionType,
                  }))
                }
                options={[
                  { value: "expense", label: "Expense" },
                  { value: "income", label: "Income" },
                ]}
                className="text-sm"
                ariaLabel="Template type"
              />
            </label>
          </div>

          <div className="grid grid-cols-1 gap-2 min-[420px]:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-xs matrix-label text-[var(--muted)]">
                Category
              </span>
              <Select
                value={form.categoryId}
                onChange={(nextValue) =>
                  setForm((current) => ({ ...current, categoryId: nextValue }))
                }
                options={categories.map((category) => ({
                  value: category.id,
                  label: category.name,
                }))}
                className="text-sm"
                ariaLabel="Template category"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-xs matrix-label text-[var(--muted)]">
                Wallet
              </span>
              <Select
                value={form.walletId}
                onChange={(nextValue) =>
                  setForm((current) => ({ ...current, walletId: nextValue }))
                }
                options={wallets.map((wallet) => ({
                  value: wallet.id,
                  label: wallet.name,
                }))}
                className="text-sm"
                ariaLabel="Template wallet"
              />
            </label>
          </div>

          <div className="grid grid-cols-1 gap-2 min-[420px]:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-xs matrix-label text-[var(--muted)]">
                Frequency
              </span>
              <Select
                value={form.frequency}
                onChange={(nextValue) =>
                  setForm((current) => ({
                    ...current,
                    frequency: nextValue as RecurringFrequency,
                  }))
                }
                options={[
                  { value: "weekly", label: "Weekly" },
                  { value: "monthly", label: "Monthly" },
                ]}
                className="text-sm"
                ariaLabel="Template frequency"
              />
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
