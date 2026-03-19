"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/app/components/PageHeader";
import { Button } from "@/app/components/ui/Button";
import { Card } from "@/app/components/ui/Card";
import { Input } from "@/app/components/ui/Input";
import { Modal } from "@/app/components/ui/Modal";
import {
  exportData,
  getPreferences,
  importData,
  resetData,
  updatePreferences,
} from "@/lib/db";
import type { ExportPayload, Preferences } from "@/lib/types";

export default function SettingsPage() {
  const [preferences, setPreferences] = useState<Preferences>({
    id: "prefs",
    currency: "USD",
    locale: "en-US",
  });
  const [status, setStatus] = useState("");
  const [showPreferencesModal, setShowPreferencesModal] = useState(false);

  useEffect(() => {
    getPreferences().then(setPreferences).catch(() => undefined);
  }, []);

  return (
    <main>
      <PageHeader title="Settings" subtitle="App Preferences" />

      <section className="space-y-4">
        <Card className="space-y-3">
          <p className="text-xs uppercase tracking-[0.12em] text-[var(--muted)]">
            Currency & Locale
          </p>
          <p className="text-sm muted">
            {preferences.currency} • {preferences.locale}
          </p>
          <Button
            className="w-full"
            onClick={() => {
              setShowPreferencesModal(true);
              setStatus("");
            }}
          >
            Edit Preferences
          </Button>
        </Card>

        <Card className="space-y-3">
          <p className="text-xs uppercase tracking-[0.12em] text-[var(--muted)]">
            Backup
          </p>
          <Button
            className="w-full"
            onClick={async () => {
              const payload = await exportData();
              const blob = new Blob([JSON.stringify(payload, null, 2)], {
                type: "application/json",
              });
              const url = URL.createObjectURL(blob);
              const anchor = document.createElement("a");
              anchor.href = url;
              anchor.download = `grain-backup-${new Date().toISOString().slice(0, 10)}.json`;
              anchor.click();
              URL.revokeObjectURL(url);
              setStatus("Backup exported.");
            }}
          >
            Export JSON
          </Button>

          <label className="block">
            <span className="mb-2 block text-xs uppercase tracking-[0.12em] text-[var(--muted)]">
              Import JSON
            </span>
            <input
              type="file"
              accept="application/json"
              onChange={async (event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                try {
                  const payload = JSON.parse(
                    await file.text(),
                  ) as ExportPayload;
                  await importData(payload);
                  setStatus("Backup imported.");
                } catch {
                  setStatus("Import failed. Check JSON format.");
                }
              }}
              className="w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] p-2 text-sm"
            />
          </label>
        </Card>

        <Card className="space-y-3">
          <p className="text-xs uppercase tracking-[0.12em] text-[var(--muted)]">
            Danger Zone
          </p>
          <Button
            variant="danger"
            className="w-full"
            onClick={async () => {
              const ok = window.confirm(
                "Reset all local data? This cannot be undone.",
              );
              if (!ok) return;
              await resetData();
              setStatus("All data reset.");
            }}
          >
            Reset Local Data
          </Button>
        </Card>

        <Card>
          <p className="text-xs uppercase tracking-[0.12em] text-[var(--muted)]">
            PWA Install
          </p>
          <p className="mt-2 text-sm muted">
            Use your browser menu and choose &quot;Add to Home Screen&quot; or
            &quot;Install App&quot; for standalone mode.
          </p>
        </Card>

        {status ? <p className="text-sm">{status}</p> : null}
      </section>

      <Modal
        open={showPreferencesModal}
        onClose={() => setShowPreferencesModal(false)}
        title="Preferences"
        subtitle="Currency and locale"
      >
        <div className="space-y-3">
          <label className="block">
            <span className="mb-2 block text-xs uppercase tracking-[0.12em] text-[var(--muted)]">
              Currency
            </span>
            <Input
              value={preferences.currency}
              maxLength={3}
              onChange={(event) =>
                setPreferences((prev) => ({
                  ...prev,
                  currency: event.target.value.toUpperCase(),
                }))
              }
              placeholder="USD"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-xs uppercase tracking-[0.12em] text-[var(--muted)]">
              Locale
            </span>
            <Input
              value={preferences.locale}
              onChange={(event) =>
                setPreferences((prev) => ({ ...prev, locale: event.target.value }))
              }
              placeholder="en-US"
            />
          </label>

          <Button
            className="w-full"
            onClick={async () => {
              const next = await updatePreferences(preferences);
              setPreferences(next);
              setShowPreferencesModal(false);
              setStatus("Preferences saved.");
            }}
          >
            Save Preferences
          </Button>
        </div>
      </Modal>
    </main>
  );
}
