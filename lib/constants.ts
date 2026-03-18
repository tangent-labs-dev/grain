import type { Category, Preferences, Wallet } from "@/lib/types";

const now = new Date().toISOString();

export const DEFAULT_CATEGORIES: Category[] = [
  { id: "food", name: "Food", archived: false, createdAt: now, updatedAt: now },
  {
    id: "transport",
    name: "Transport",
    archived: false,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "shopping",
    name: "Shopping",
    archived: false,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "salary",
    name: "Salary",
    archived: false,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "utilities",
    name: "Utilities",
    archived: false,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "other",
    name: "Other",
    archived: false,
    createdAt: now,
    updatedAt: now,
  },
];

export const DEFAULT_PREFERENCES: Preferences = {
  id: "prefs",
  currency: "USD",
  locale: "en-US",
  defaultWalletId: "wallet-main",
};

export const DEFAULT_WALLETS: Wallet[] = [
  {
    id: "wallet-main",
    name: "Main",
    type: "cash",
    startingBalance: 0,
    createdAt: now,
    updatedAt: now,
  },
];
