"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/app/components/PageHeader";
import { Button } from "@/app/components/ui/Button";
import { Card } from "@/app/components/ui/Card";
import { Input } from "@/app/components/ui/Input";
import { Modal } from "@/app/components/ui/Modal";
import {
  addWallet,
  getPreferences,
  getTransactions,
  getTransfers,
  getWallets,
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
              <p className="text-sm matrix-label">
                {fmt(balances.get(wallet.id) ?? wallet.startingBalance)}
              </p>
            </div>
          </Card>
        ))}
      </section>

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
              <select
                value={form.type}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    type: event.target.value as WalletType,
                  }))
                }
                className="w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm matrix-label"
              >
                {WALLET_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
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
