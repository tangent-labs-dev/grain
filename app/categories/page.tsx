"use client";

import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/app/components/PageHeader";
import { Button } from "@/app/components/ui/Button";
import { Input } from "@/app/components/ui/Input";
import { ListRow } from "@/app/components/ui/ListRow";
import { Modal } from "@/app/components/ui/Modal";
import { Select } from "@/app/components/ui/Select";
import {
  addCategory,
  getCategories,
  removeCategory,
  updateCategory,
} from "@/lib/db";
import type { Category } from "@/lib/types";

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [replacementId, setReplacementId] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [createError, setCreateError] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const replacementOptions = useMemo(
    () => categories.filter((category) => category.id !== deletingId),
    [categories, deletingId],
  );

  async function load() {
    const rows = await getCategories();
    setCategories(rows);
    setLoading(false);
  }

  function hasDuplicateName(name: string, excludeId?: string) {
    const normalized = name.trim().toLowerCase();
    return categories.some(
      (category) =>
        category.id !== excludeId &&
        category.name.trim().toLowerCase() === normalized,
    );
  }

  useEffect(() => {
    let cancelled = false;
    getCategories()
      .then((rows) => {
        if (cancelled) return;
        setCategories(rows);
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function preferredReplacement(excludedId: string) {
    const options = categories.filter((category) => category.id !== excludedId);
    return (
      options.find((category) => !category.archived)?.id ?? options[0]?.id ?? ""
    );
  }

  return (
    <main>
      <PageHeader
        title="Categories"
        subtitle="Manage Labels"
        actions={
          <Button className="text-xs" onClick={() => setShowCreateModal(true)}>
            Add
          </Button>
        }
      />

      <section className="mt-4 space-y-2">
        {status ? <p className="text-sm matrix-label">{status}</p> : null}
        {loading ? <p className="muted text-sm">Loading categories...</p> : null}
        {categories.map((category) => (
          <ListRow
            key={category.id}
            title={category.name}
            subtitle={category.archived ? "Archived" : "Active"}
            trailing={
              <div className="grid grid-cols-2 gap-2 min-[420px]:flex min-[420px]:flex-wrap min-[420px]:justify-end">
                <Button
                  variant="ghost"
                  className="px-2 py-1 text-[0.65rem]"
                  onClick={() => {
                    setEditingId(category.id);
                    setEditingName(category.name);
                    setEditError(null);
                    setStatus(null);
                  }}
                >
                  Edit
                </Button>
                <Button
                  variant="secondary"
                  className="px-2 py-1 text-[0.65rem]"
                  onClick={async () => {
                    await updateCategory({
                      id: category.id,
                      archived: !category.archived,
                    });
                    await load();
                    setStatus(
                      category.archived
                        ? `${category.name} restored.`
                        : `${category.name} archived.`,
                    );
                  }}
                >
                  {category.archived ? "Unarchive" : "Archive"}
                </Button>
                <Button
                  variant="danger"
                  className="px-2 py-1 text-[0.65rem]"
                  disabled={categories.length <= 1}
                  onClick={() => {
                    setDeletingId(category.id);
                    setReplacementId(preferredReplacement(category.id));
                    setDeleteError(null);
                    setStatus(null);
                  }}
                >
                  Remove
                </Button>
              </div>
            }
          />
        ))}
      </section>

      <Modal
        open={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setCreateError(null);
          setNewName("");
        }}
        title="Add Category"
        subtitle="Create a new label"
      >
        <div className="space-y-3">
          <Input
            value={newName}
            onChange={(event) => setNewName(event.target.value)}
            placeholder="Category name"
          />
          {createError ? (
            <p className="text-sm text-[var(--danger)]">{createError}</p>
          ) : null}
          <Button
            className="w-full"
            onClick={async () => {
              setCreateError(null);
              const trimmed = newName.trim();
              if (!trimmed) {
                setCreateError("Category name is required.");
                return;
              }
              if (hasDuplicateName(trimmed)) {
                setCreateError("A category with this name already exists.");
                return;
              }
              await addCategory({ name: trimmed });
              setNewName("");
              setShowCreateModal(false);
              await load();
              setStatus(`Category "${trimmed}" added.`);
            }}
          >
            Save Category
          </Button>
        </div>
      </Modal>

      <Modal
        open={Boolean(editingId)}
        onClose={() => {
          setEditingId(null);
          setEditingName("");
          setEditError(null);
        }}
        title="Edit Category"
      >
        <div className="space-y-3">
          <Input
            value={editingName}
            onChange={(event) => setEditingName(event.target.value)}
          />
          {editError ? <p className="text-sm text-[var(--danger)]">{editError}</p> : null}
          <div className="grid grid-cols-1 gap-2 min-[420px]:grid-cols-2">
            <Button
              onClick={async () => {
                if (!editingId) return;
                const trimmed = editingName.trim();
                if (!trimmed) {
                  setEditError("Category name is required.");
                  return;
                }
                if (hasDuplicateName(trimmed, editingId)) {
                  setEditError("A category with this name already exists.");
                  return;
                }
                const current = categories.find((category) => category.id === editingId);
                await updateCategory({ id: editingId, name: trimmed });
                setEditingId(null);
                setEditingName("");
                await load();
                setStatus(
                  current && current.name !== trimmed
                    ? `Category renamed to "${trimmed}".`
                    : "Category updated.",
                );
              }}
            >
              Save
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setEditingId(null);
                setEditingName("");
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={Boolean(deletingId)}
        onClose={() => {
          setDeletingId(null);
          setReplacementId("");
          setDeleteError(null);
        }}
        title="Remove Category"
        subtitle="Move existing entries before deleting"
      >
        <div className="space-y-3">
          {replacementOptions.length ? (
            <label className="block">
              <span className="mb-2 block text-xs uppercase tracking-[0.12em] text-[var(--muted)]">
                Move entries to
              </span>
              <Select
                value={replacementId}
                onChange={setReplacementId}
                options={replacementOptions.map((category) => ({
                  value: category.id,
                  label: category.name,
                }))}
                className="text-sm"
                ariaLabel="Move entries to category"
              />
            </label>
          ) : (
            <p className="text-sm muted">At least one category must remain.</p>
          )}

          {deleteError ? (
            <p className="text-sm text-[var(--danger)]">{deleteError}</p>
          ) : null}

          <div className="grid grid-cols-1 gap-2 min-[420px]:grid-cols-2">
            <Button
              variant="danger"
              disabled={!deletingId || !replacementId}
              onClick={async () => {
                if (!deletingId || !replacementId) return;
                const category = categories.find((item) => item.id === deletingId);
                const replacement = categories.find(
                  (item) => item.id === replacementId,
                );
                try {
                  setDeleteError(null);
                  await removeCategory({
                    id: deletingId,
                    replacementCategoryId: replacementId,
                  });
                  setDeletingId(null);
                  setReplacementId("");
                  await load();
                  setStatus(
                    category && replacement
                      ? `${category.name} removed. Existing entries moved to ${replacement.name}.`
                      : "Category removed.",
                  );
                } catch (error) {
                  setDeleteError(
                    error instanceof Error
                      ? error.message
                      : "Couldn't remove this category.",
                  );
                }
              }}
            >
              Remove
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setDeletingId(null);
                setReplacementId("");
                setDeleteError(null);
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </main>
  );
}
