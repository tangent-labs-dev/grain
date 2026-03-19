"use client";

import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/app/components/PageHeader";
import { Button } from "@/app/components/ui/Button";
import { Card } from "@/app/components/ui/Card";
import { Input } from "@/app/components/ui/Input";
import { Modal } from "@/app/components/ui/Modal";
import { Select } from "@/app/components/ui/Select";
import {
  addTransfer,
  deleteTransfer,
  getPreferences,
  getTransfers,
  getWallets,
  updateTransfer,
} from "@/lib/db";
import { formatCurrency, formatDate } from "@/lib/format";
import type { Preferences, Transfer, Wallet } from "@/lib/types";

export default function TransfersPage() {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [preferences, setPreferences] = useState<Preferences>({
    id: "prefs",
    currency: "USD",
    locale: "en-US",
  });
  const [form, setForm] = useState({
    fromWalletId: "",
    toWalletId: "",
    amount: "",
    note: "",
  });
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [editingTransferId, setEditingTransferId] = useState<string | null>(null);
  const [editingForm, setEditingForm] = useState({
    fromWalletId: "",
    toWalletId: "",
    amount: "",
    note: "",
  });

  async function load() {
    const [walletRows, transferRows, prefs] = await Promise.all([
      getWallets(),
      getTransfers(),
      getPreferences(),
    ]);
    setWallets(walletRows);
    setTransfers(transferRows);
    setPreferences(prefs);
    if (!form.fromWalletId && walletRows.length > 0) {
      setForm((current) => ({
        ...current,
        fromWalletId: walletRows[0].id,
        toWalletId: walletRows[1]?.id ?? walletRows[0].id,
      }));
    }
  }

  useEffect(() => {
    let cancelled = false;
    Promise.all([getWallets(), getTransfers(), getPreferences()])
      .then(([walletRows, transferRows, prefs]) => {
        if (cancelled) return;
        setWallets(walletRows);
        setTransfers(transferRows);
        setPreferences(prefs);
        if (walletRows.length > 0) {
          setForm((current) =>
            current.fromWalletId
              ? current
              : {
                  ...current,
                  fromWalletId: walletRows[0].id,
                  toWalletId: walletRows[1]?.id ?? walletRows[0].id,
                },
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
        title="Transfers"
        subtitle="Move Between Wallets"
        actions={
          <Button className="text-xs" onClick={() => setShowTransferModal(true)}>
            Add
          </Button>
        }
      />

      <section className="mt-4 space-y-2">
        {transfers.map((transfer) => (
          <Card key={transfer.id}>
            <div className="flex flex-col items-start gap-3 min-[420px]:flex-row min-[420px]:items-center min-[420px]:justify-between">
              <div className="min-w-0">
                <p className="text-sm matrix-label">
                  {walletMap.get(transfer.fromWalletId)} →{" "}
                  {walletMap.get(transfer.toWalletId)}
                </p>
                <p className="text-xs matrix-label text-[var(--muted)]">
                  {formatDate(transfer.createdAt, preferences.locale)}
                  {transfer.note ? ` • ${transfer.note}` : ""}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm matrix-label">{fmt(transfer.amount)}</p>
                <Button
                  variant="ghost"
                  className="px-2 py-1 text-[0.64rem]"
                  onClick={() => {
                    setEditingTransferId(transfer.id);
                    setEditingForm({
                      fromWalletId: transfer.fromWalletId,
                      toWalletId: transfer.toWalletId,
                      amount: String(transfer.amount),
                      note: transfer.note ?? "",
                    });
                  }}
                >
                  Edit
                </Button>
                <Button
                  variant="danger"
                  className="px-2 py-1 text-[0.64rem]"
                  onClick={async () => {
                    const ok = window.confirm("Delete this transfer permanently?");
                    if (!ok) return;
                    await deleteTransfer(transfer.id);
                    await load();
                  }}
                >
                  Del
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </section>

      <Modal
        open={Boolean(editingTransferId)}
        onClose={() => {
          setEditingTransferId(null);
          setEditingForm({
            fromWalletId: "",
            toWalletId: "",
            amount: "",
            note: "",
          });
        }}
        title="Edit Transfer"
        subtitle="Update transfer details"
      >
        <div className="space-y-3">
          <div className="grid grid-cols-1 gap-2 min-[420px]:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-xs matrix-label text-[var(--muted)]">
                From
              </span>
              <Select
                value={editingForm.fromWalletId}
                onChange={(nextValue) =>
                  setEditingForm((current) => ({
                    ...current,
                    fromWalletId: nextValue,
                  }))
                }
                options={wallets.map((wallet) => ({
                  value: wallet.id,
                  label: wallet.name,
                }))}
                className="text-sm"
                ariaLabel="From wallet"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-xs matrix-label text-[var(--muted)]">
                To
              </span>
              <Select
                value={editingForm.toWalletId}
                onChange={(nextValue) =>
                  setEditingForm((current) => ({
                    ...current,
                    toWalletId: nextValue,
                  }))
                }
                options={wallets.map((wallet) => ({
                  value: wallet.id,
                  label: wallet.name,
                }))}
                className="text-sm"
                ariaLabel="To wallet"
              />
            </label>
          </div>

          <label className="block">
            <span className="mb-2 block text-xs matrix-label text-[var(--muted)]">
              Amount
            </span>
            <Input
              inputMode="decimal"
              value={editingForm.amount}
              onChange={(event) =>
                setEditingForm((current) => ({
                  ...current,
                  amount: event.target.value,
                }))
              }
              placeholder="0.00"
            />
          </label>
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
              if (!editingTransferId) return;
              const amount = Number(editingForm.amount);
              if (
                !Number.isFinite(amount) ||
                amount <= 0 ||
                !editingForm.fromWalletId ||
                !editingForm.toWalletId ||
                editingForm.fromWalletId === editingForm.toWalletId
              ) {
                return;
              }
              await updateTransfer(editingTransferId, {
                fromWalletId: editingForm.fromWalletId,
                toWalletId: editingForm.toWalletId,
                amount,
                note: editingForm.note.trim() || undefined,
              });
              setEditingTransferId(null);
              setEditingForm({
                fromWalletId: "",
                toWalletId: "",
                amount: "",
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
        open={showTransferModal}
        onClose={() => setShowTransferModal(false)}
        title="New Transfer"
        subtitle="Move between wallets"
      >
        <div className="space-y-3">
          <div className="grid grid-cols-1 gap-2 min-[420px]:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-xs matrix-label text-[var(--muted)]">
                From
              </span>
              <Select
                value={form.fromWalletId}
                onChange={(nextValue) =>
                  setForm((current) => ({
                    ...current,
                    fromWalletId: nextValue,
                  }))
                }
                options={wallets.map((wallet) => ({
                  value: wallet.id,
                  label: wallet.name,
                }))}
                className="text-sm"
                ariaLabel="From wallet"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-xs matrix-label text-[var(--muted)]">
                To
              </span>
              <Select
                value={form.toWalletId}
                onChange={(nextValue) =>
                  setForm((current) => ({ ...current, toWalletId: nextValue }))
                }
                options={wallets.map((wallet) => ({
                  value: wallet.id,
                  label: wallet.name,
                }))}
                className="text-sm"
                ariaLabel="To wallet"
              />
            </label>
          </div>

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
              const amount = Number(form.amount);
              if (
                !Number.isFinite(amount) ||
                amount <= 0 ||
                !form.fromWalletId ||
                !form.toWalletId ||
                form.fromWalletId === form.toWalletId
              ) {
                return;
              }
              await addTransfer({
                fromWalletId: form.fromWalletId,
                toWalletId: form.toWalletId,
                amount,
                note: form.note.trim() || undefined,
              });
              setForm((current) => ({ ...current, amount: "", note: "" }));
              setShowTransferModal(false);
              await load();
            }}
          >
            Save Transfer
          </Button>
        </div>
      </Modal>
    </main>
  );
}
