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
  addWallet,
  getPreferences,
  getTransactions,
  getTransfers,
  getWallets,
  updateWallet,
} from "@/lib/db";
import { computeWalletBalances } from "@/lib/finance";
import { formatCurrency } from "@/lib/format";
import type {
  Preferences,
  Transaction,
  Transfer,
  Wallet,
  WalletType,
} from "@/lib/types";

const WALLET_TYPE_OPTIONS: Array<{ value: WalletType; label: string }> = [
  { value: "cash", label: "Cash" },
  { value: "bank", label: "Bank" },
  { value: "card", label: "Card" },
];

export default function WalletsPage() {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [preferences, setPreferences] = useState<Preferences>({
    id: "prefs",
    currency: "USD",
    locale: "en-US",
  });
  const [form, setForm] = useState({
    name: "",
    type: WALLET_TYPE_OPTIONS[0].value,
    startingBalance: "",
  });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingWalletId, setEditingWalletId] = useState<string | null>(null);
  const [editingForm, setEditingForm] = useState({
    name: "",
    type: WALLET_TYPE_OPTIONS[0].value,
    startingBalance: "",
  });

  async function load() {
    const [walletRows, txRows, transferRows, prefs] = await Promise.all([
      getWallets(),
      getTransactions(),
      getTransfers(),
      getPreferences(),
    ]);
    setWallets(walletRows);
    setTransactions(txRows);
    setTransfers(transferRows);
    setPreferences(prefs);
  }

  useEffect(() => {
    let cancelled = false;
    Promise.all([getWallets(), getTransactions(), getTransfers(), getPreferences()])
      .then(([walletRows, txRows, transferRows, prefs]) => {
        if (cancelled) return;
        setWallets(walletRows);
        setTransactions(txRows);
        setTransfers(transferRows);
        setPreferences(prefs);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  const balances = useMemo(
    () => computeWalletBalances(wallets, transactions, transfers),
    [wallets, transactions, transfers],
  );
  const walletTypeLabelMap = useMemo(
    () =>
      new Map(
        WALLET_TYPE_OPTIONS.map((option) => [option.value, option.label]),
      ),
    [],
  );
  const fmt = (value: number) =>
    formatCurrency(value, preferences.locale, preferences.currency);

  return (
    <main>
      <PageHeader
        title="Wallets"
        subtitle="Accounts"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button className="text-xs" onClick={() => setShowCreateModal(true)}>
              Add
            </Button>
            <Link href="/transfers">
              <Button variant="secondary" className="text-xs">
                Transfer
              </Button>
            </Link>
          </div>
        }
      />

      <section className="mt-4 space-y-2">
        {wallets.map((wallet) => (
          <Card key={wallet.id}>
            <div className="flex flex-col items-start gap-3 min-[420px]:flex-row min-[420px]:items-center min-[420px]:justify-between">
              <div className="min-w-0">
                <p className="text-sm matrix-label">{wallet.name}</p>
                <p className="text-xs matrix-label text-[var(--muted)]">
                  {walletTypeLabelMap.get(wallet.type) ?? wallet.type}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm matrix-label">
                  {fmt(balances.get(wallet.id) ?? wallet.startingBalance)}
                </p>
                <Button
                  variant="ghost"
                  className="px-2 py-1 text-[0.64rem]"
                  onClick={() => {
                    setEditingWalletId(wallet.id);
                    setEditingForm({
                      name: wallet.name,
                      type: wallet.type,
                      startingBalance: String(wallet.startingBalance),
                    });
                  }}
                >
                  Edit
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </section>

      <Modal
        open={Boolean(editingWalletId)}
        onClose={() => {
          setEditingWalletId(null);
          setEditingForm({
            name: "",
            type: WALLET_TYPE_OPTIONS[0].value,
            startingBalance: "",
          });
        }}
        title="Edit Wallet"
        subtitle="Update account details"
      >
        <div className="space-y-3">
          <label className="block">
            <span className="mb-2 block text-xs matrix-label text-[var(--muted)]">
              Wallet Name
            </span>
            <Input
              value={editingForm.name}
              onChange={(event) =>
                setEditingForm((current) => ({ ...current, name: event.target.value }))
              }
              placeholder="Cash / Debit / Credit"
            />
          </label>
          <div className="grid grid-cols-1 gap-2 min-[420px]:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-xs matrix-label text-[var(--muted)]">
                Type
              </span>
              <Select
                value={editingForm.type}
                onChange={(nextValue) =>
                  setEditingForm((current) => ({
                    ...current,
                    type: nextValue as WalletType,
                  }))
                }
                options={WALLET_TYPE_OPTIONS}
                className="text-sm"
                ariaLabel="Wallet type"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-xs matrix-label text-[var(--muted)]">
                Starting Balance
              </span>
              <Input
                inputMode="decimal"
                value={editingForm.startingBalance}
                onChange={(event) =>
                  setEditingForm((current) => ({
                    ...current,
                    startingBalance: event.target.value,
                  }))
                }
                placeholder="0.00"
              />
            </label>
          </div>
          <Button
            className="w-full"
            onClick={async () => {
              if (!editingWalletId || !editingForm.name.trim()) return;
              const parsedBalance = Number(editingForm.startingBalance || "0");
              await updateWallet(editingWalletId, {
                name: editingForm.name,
                type: editingForm.type,
                startingBalance: Number.isFinite(parsedBalance) ? parsedBalance : 0,
              });
              setEditingWalletId(null);
              setEditingForm({
                name: "",
                type: WALLET_TYPE_OPTIONS[0].value,
                startingBalance: "",
              });
              await load();
            }}
          >
            Save Changes
          </Button>
        </div>
      </Modal>

      <Modal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Add Wallet"
        subtitle="Create an account bucket"
      >
        <div className="space-y-3">
          <label className="block">
            <span className="mb-2 block text-xs matrix-label text-[var(--muted)]">
              Wallet Name
            </span>
            <Input
              value={form.name}
              onChange={(event) =>
                setForm((current) => ({ ...current, name: event.target.value }))
              }
              placeholder="Cash / Debit / Credit"
            />
          </label>
          <div className="grid grid-cols-1 gap-2 min-[420px]:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-xs matrix-label text-[var(--muted)]">
                Type
              </span>
              <Select
                value={form.type}
                onChange={(nextValue) =>
                  setForm((current) => ({
                    ...current,
                    type: nextValue as WalletType,
                  }))
                }
                options={WALLET_TYPE_OPTIONS}
                className="text-sm"
                ariaLabel="Wallet type"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-xs matrix-label text-[var(--muted)]">
                Starting Balance
              </span>
              <Input
                inputMode="decimal"
                value={form.startingBalance}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    startingBalance: event.target.value,
                  }))
                }
                placeholder="0.00"
              />
            </label>
          </div>
          <Button
            className="w-full"
            onClick={async () => {
              const startingBalance = Number(form.startingBalance || "0");
              if (!form.name.trim()) return;
              await addWallet({
                name: form.name,
                type: form.type,
                startingBalance: Number.isFinite(startingBalance)
                  ? startingBalance
                  : 0,
              });
              setForm({
                name: "",
                type: WALLET_TYPE_OPTIONS[0].value,
                startingBalance: "",
              });
              setShowCreateModal(false);
              await load();
            }}
          >
            Save Wallet
          </Button>
        </div>
      </Modal>
    </main>
  );
}
