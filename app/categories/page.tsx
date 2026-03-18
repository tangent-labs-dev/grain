"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/app/components/PageHeader";
import { Button } from "@/app/components/ui/Button";
import { Input } from "@/app/components/ui/Input";
import { ListRow } from "@/app/components/ui/ListRow";
import { Modal } from "@/app/components/ui/Modal";
import { addCategory, getCategories, updateCategory } from "@/lib/db";
import type { Category } from "@/lib/types";

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const rows = await getCategories();
    setCategories(rows);
    setLoading(false);
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
        {loading ? <p className="muted text-sm">Loading categories...</p> : null}
        {categories.map((category) => (
          <ListRow
            key={category.id}
            title={category.name}
            subtitle={category.archived ? "Archived" : "Active"}
            trailing={
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  className="px-2 py-1 text-[0.65rem]"
                  onClick={() => {
                    setEditingId(category.id);
                    setEditingName(category.name);
                  }}
                >
                  Rename
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
                  }}
                >
                  {category.archived ? "Unarchive" : "Archive"}
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
          setError(null);
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
          {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}
          <Button
            className="w-full"
            onClick={async () => {
              setError(null);
              if (!newName.trim()) {
                setError("Category name is required.");
                return;
              }
              await addCategory({ name: newName });
              setNewName("");
              setShowCreateModal(false);
              await load();
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
        }}
        title="Rename Category"
      >
        <div className="space-y-3">
          <Input
            value={editingName}
            onChange={(event) => setEditingName(event.target.value)}
          />
          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={async () => {
                if (!editingId || !editingName.trim()) return;
                await updateCategory({ id: editingId, name: editingName });
                setEditingId(null);
                setEditingName("");
                await load();
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
    </main>
  );
}
