"use client";

import { useMemo, useState } from "react";
import { Button } from "@/app/components/ui/Button";
import { Card } from "@/app/components/ui/Card";
import { Input } from "@/app/components/ui/Input";
import { Select } from "@/app/components/ui/Select";
import { SegmentedControl } from "@/app/components/ui/SegmentedControl";
import type { Category, SplitItem, TransactionType, Wallet } from "@/lib/types";
import { dateTimeLocalValue } from "@/lib/format";

type TransactionFormValues = {
  amount: string;
  type: TransactionType;
  categoryId: string;
  walletId: string;
  createdAt: string;
  note: string;
  useSplit: boolean;
  splits: Array<{ id: string; categoryId: string; amount: string }>;
};

type Props = {
  categories: Category[];
  wallets: Wallet[];
  initialValues?: Partial<TransactionFormValues>;
  submitLabel?: string;
  onSubmit: (values: {
    amount: number;
    type: TransactionType;
    categoryId: string;
    walletId: string;
    splits?: SplitItem[];
    createdAt: string;
    note?: string;
  }) => Promise<void>;
};

export function TransactionForm({
  categories,
  wallets,
  initialValues,
  submitLabel = "Save",
  onSubmit,
}: Props) {
  const activeCategories = useMemo(
    () => categories.filter((category) => !category.archived),
    [categories],
  );
  const [values, setValues] = useState<TransactionFormValues>({
    amount: initialValues?.amount ?? "",
    type: initialValues?.type ?? "expense",
    categoryId: initialValues?.categoryId ?? activeCategories[0]?.id ?? "",
    walletId: initialValues?.walletId ?? wallets[0]?.id ?? "",
    createdAt:
      initialValues?.createdAt ?? dateTimeLocalValue(new Date().toISOString()),
    note: initialValues?.note ?? "",
    useSplit: initialValues?.useSplit ?? false,
    splits:
      initialValues?.splits?.map((split) => ({
        id: split.id,
        categoryId: split.categoryId,
        amount: split.amount,
      })) ?? [],
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function updateField<Key extends keyof TransactionFormValues>(
    key: Key,
    value: TransactionFormValues[Key],
  ) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function addSplitLine() {
    setValues((current) => ({
      ...current,
      splits: [
        ...current.splits,
        {
          id: crypto.randomUUID(),
          categoryId: activeCategories[0]?.id ?? current.categoryId,
          amount: "",
        },
      ],
    }));
  }

  function updateSplitLine(
    id: string,
    key: "categoryId" | "amount",
    value: string,
  ) {
    setValues((current) => ({
      ...current,
      splits: current.splits.map((split) =>
        split.id === id ? { ...split, [key]: value } : split,
      ),
    }));
  }

  function removeSplitLine(id: string) {
    setValues((current) => ({
      ...current,
      splits: current.splits.filter((split) => split.id !== id),
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const parsedAmount = Number(values.amount);

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError("Amount must be a positive number.");
      return;
    }
    if (!values.categoryId) {
      setError("Choose a category before saving.");
      return;
    }
    if (!values.walletId) {
      setError("Choose a wallet before saving.");
      return;
    }

    let splits: SplitItem[] | undefined;
    if (values.useSplit) {
      if (!values.splits.length) {
        setError("Add at least one split line.");
        return;
      }
      const normalizedSplits = values.splits.map((split) => ({
        id: split.id,
        categoryId: split.categoryId,
        amount: Number(split.amount),
      }));
      if (
        normalizedSplits.some(
          (split) => !split.categoryId || !Number.isFinite(split.amount),
        )
      ) {
        setError("All split lines need category and amount.");
        return;
      }
      const splitTotal = normalizedSplits.reduce(
        (sum, split) => sum + split.amount,
        0,
      );
      if (Math.abs(splitTotal - parsedAmount) > 0.01) {
        setError("Split total must match transaction amount.");
        return;
      }
      splits = normalizedSplits;
    }

    setSaving(true);
    try {
      await onSubmit({
        amount: parsedAmount,
        type: values.type,
        categoryId: values.categoryId,
        walletId: values.walletId,
        splits,
        createdAt: new Date(values.createdAt).toISOString(),
        note: values.note.trim() || undefined,
      });
    } catch {
      setError("Could not save transaction. Try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <label className="block">
          <span className="mb-2 block text-xs uppercase tracking-[0.12em] text-[var(--muted)]">
            Amount
          </span>
          <Input
            inputMode="decimal"
            autoFocus
            value={values.amount}
            onChange={(event) => updateField("amount", event.target.value)}
            placeholder="0.00"
            aria-label="Amount"
          />
        </label>

        <SegmentedControl
          label="Type"
          value={values.type}
          options={[
            { label: "Expense", value: "expense" },
            { label: "Income", value: "income" },
          ]}
          onChange={(next) => updateField("type", next)}
        />

        <label className="block">
          <span className="mb-2 block text-xs uppercase tracking-[0.12em] text-[var(--muted)]">
            Category
          </span>
          <Select
            value={values.categoryId}
            onChange={(nextValue) => updateField("categoryId", nextValue)}
            options={activeCategories.map((category) => ({
              value: category.id,
              label: category.name,
            }))}
            className="text-sm"
            ariaLabel="Select category"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-xs uppercase tracking-[0.12em] text-[var(--muted)]">
            Wallet
          </span>
          <Select
            value={values.walletId}
            onChange={(nextValue) => updateField("walletId", nextValue)}
            options={wallets.map((wallet) => ({
              value: wallet.id,
              label: wallet.name,
            }))}
            className="text-sm"
            ariaLabel="Select wallet"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-xs uppercase tracking-[0.12em] text-[var(--muted)]">
            Date & Time
          </span>
          <Input
            type="datetime-local"
            value={values.createdAt}
            onChange={(event) => updateField("createdAt", event.target.value)}
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-xs uppercase tracking-[0.12em] text-[var(--muted)]">
            Note (Optional)
          </span>
          <Input
            value={values.note}
            onChange={(event) => updateField("note", event.target.value)}
            placeholder="Coffee with team"
          />
        </label>

        <div>
          <div className="mb-2 flex flex-col items-start gap-2 min-[420px]:flex-row min-[420px]:items-center min-[420px]:justify-between">
            <p className="text-xs uppercase tracking-[0.12em] text-[var(--muted)]">
              Split Transaction
            </p>
            <Button
              variant={values.useSplit ? "primary" : "secondary"}
              className="w-full px-2 py-1 text-[0.64rem] min-[420px]:w-auto"
              onClick={() => {
                const next = !values.useSplit;
                setValues((current) => ({
                  ...current,
                  useSplit: next,
                  splits:
                    next && current.splits.length === 0
                      ? [
                          {
                            id: crypto.randomUUID(),
                            categoryId:
                              activeCategories[0]?.id ?? current.categoryId,
                            amount: "",
                          },
                        ]
                      : current.splits,
                }));
              }}
            >
              {values.useSplit ? "On" : "Off"}
            </Button>
          </div>

          {values.useSplit ? (
            <div className="space-y-2">
              {values.splits.map((split) => (
                <div
                  key={split.id}
                  className="grid grid-cols-1 gap-2 min-[420px]:grid-cols-[minmax(0,1fr)_110px_64px]"
                >
                  <Select
                    value={split.categoryId}
                    onChange={(nextValue) =>
                      updateSplitLine(split.id, "categoryId", nextValue)
                    }
                    options={activeCategories.map((category) => ({
                      value: category.id,
                      label: category.name,
                    }))}
                    className="text-sm"
                    ariaLabel="Split category"
                  />
                  <Input
                    inputMode="decimal"
                    value={split.amount}
                    onChange={(event) =>
                      updateSplitLine(split.id, "amount", event.target.value)
                    }
                    placeholder="0.00"
                  />
                  <Button
                    variant="danger"
                    className="px-2 py-1 text-[0.64rem]"
                    onClick={() => removeSplitLine(split.id)}
                  >
                    Del
                  </Button>
                </div>
              ))}
              <Button
                variant="secondary"
                className="w-full"
                onClick={addSplitLine}
              >
                Add Split Line
              </Button>
            </div>
          ) : null}
        </div>

        {error ? (
          <p className="text-sm text-[var(--danger)]" role="alert">
            {error}
          </p>
        ) : null}

        <Button type="submit" className="w-full" disabled={saving}>
          {saving ? "Saving..." : submitLabel}
        </Button>
      </form>
    </Card>
  );
}
