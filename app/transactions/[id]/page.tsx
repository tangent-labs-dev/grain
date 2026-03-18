"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { PageHeader } from "@/app/components/PageHeader";
import { TransactionForm } from "@/app/components/transactions/TransactionForm";
import { Button } from "@/app/components/ui/Button";
import { Card } from "@/app/components/ui/Card";
import { Modal } from "@/app/components/ui/Modal";
import {
  getCategories,
  getTransactionById,
  getWallets,
  updateTransaction,
} from "@/lib/db";
import { dateTimeLocalValue } from "@/lib/format";
import type { Category, Transaction, Wallet } from "@/lib/types";

export default function EditTransactionPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [showFormModal, setShowFormModal] = useState(true);

  useEffect(() => {
    async function load() {
      const [categoryRows, walletRows, tx] = await Promise.all([
        getCategories(),
        getWallets(),
        getTransactionById(params.id),
      ]);
      setCategories(categoryRows);
      setWallets(walletRows);
      setTransaction(tx ?? null);
      setLoading(false);
    }
    load().catch(() => setLoading(false));
  }, [params.id]);

  if (loading) {
    return <p className="muted text-sm">Loading transaction...</p>;
  }

  if (!transaction) {
    return (
      <main>
        <PageHeader title="Edit Transaction" subtitle="Not Found" />
        <Card>
          <p className="text-sm muted">Transaction no longer exists.</p>
          <Link href="/transactions" className="mt-4 inline-block">
            <Button>Back to History</Button>
          </Link>
        </Card>
      </main>
    );
  }

  return (
    <main>
      <PageHeader title="Edit Transaction" subtitle="History Update" />
      <Card className="space-y-3">
        <p className="text-sm muted">
          Edit form opens in a popup for better mobile spacing.
        </p>
        <Button className="w-full" onClick={() => setShowFormModal(true)}>
          Open Edit Form
        </Button>
      </Card>
      <Modal
        open={showFormModal}
        onClose={() => setShowFormModal(false)}
        title="Edit Transaction"
        subtitle="History Update"
      >
        <TransactionForm
          categories={categories}
          wallets={wallets}
          submitLabel="Update Transaction"
          initialValues={{
            amount: transaction.amount.toString(),
            type: transaction.type,
            categoryId: transaction.categoryId,
            walletId: transaction.walletId ?? wallets[0]?.id ?? "",
            useSplit: Boolean(transaction.splits?.length),
            splits:
              transaction.splits?.map((split) => ({
                id: split.id,
                categoryId: split.categoryId,
                amount: split.amount.toString(),
              })) ?? [],
            note: transaction.note ?? "",
            createdAt: dateTimeLocalValue(transaction.createdAt),
          }}
          onSubmit={async (values) => {
            await updateTransaction(transaction.id, values);
            router.push("/transactions");
          }}
        />
      </Modal>
    </main>
  );
}
