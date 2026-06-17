"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { ActionButton } from "@/components/ui/ActionButton";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { API_ROUTES, PLANS } from "@/lib/constants";
import LicenseTemplateCard from "./LicenseTemplateCard";
import { LayoutTemplate, Plus, Edit3, Trash2 } from "lucide-react";

interface Template {
  id: string;
  name: string;
  description?: string;
  plan: string;
  maxDevices: number;
  durationDays: number;
  isActive: boolean;
  featureFlags?: string;
}

const emptyForm = { name: "", description: "", plan: "FREE", maxDevices: 1, durationDays: 30, featureFlags: "{}" };

export default function LicenseTemplatesManager() {
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Template | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<Template | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(API_ROUTES.LICENSES.TEMPLATES);
      const data = await response.json();
      if (response.ok) setTemplates(data.templates ?? data ?? []);
    } catch {
      setError("Failed to load templates");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => fetchTemplates(), 0);
    return () => clearTimeout(t);
  }, [fetchTemplates]);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setError("");
    setModalOpen(true);
  }

  function openEdit(tpl: Template) {
    setEditing(tpl);
    setForm({
      name: tpl.name,
      description: tpl.description ?? "",
      plan: tpl.plan,
      maxDevices: tpl.maxDevices,
      durationDays: tpl.durationDays,
      featureFlags: tpl.featureFlags ?? "{}",
    });
    setError("");
    setModalOpen(true);
  }

  async function save() {
    if (!form.name.trim()) { setError("Name is required"); return; }
    setError("");
    setSaving(true);
    try {
      const url = editing
        ? `${API_ROUTES.LICENSES.TEMPLATES}/update`
        : API_ROUTES.LICENSES.TEMPLATES;
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editing ? { id: editing.id, ...form } : form),
      });
      const data = await response.json();
      if (!response.ok) { setError(data.error || "Failed to save template"); return; }
      setModalOpen(false);
      router.refresh();
      fetchTemplates();
    } catch {
      setError("Failed to save template");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const response = await fetch(`${API_ROUTES.LICENSES.TEMPLATES}/delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: deleteTarget.id }),
      });
      if (!response.ok) { setError("Failed to delete template"); return; }
      setDeleteTarget(null);
      router.refresh();
      fetchTemplates();
    } catch {
      setError("Failed to delete template");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <LayoutTemplate size={20} className="text-blue-400" />
          <h2 className="text-lg font-bold">License Templates</h2>
        </div>
        <ActionButton onClick={openCreate} variant="primary" size="sm">
          <Plus size={14} /> Create Template
        </ActionButton>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>
      )}

      {loading ? (
        <p className="text-sm text-zinc-500">Loading templates...</p>
      ) : templates.length === 0 ? (
        <p className="text-sm text-zinc-500">No templates yet.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((tpl) => (
            <div key={tpl.id} className="relative">
              <LicenseTemplateCard template={tpl} />
              <div className="mt-2 flex gap-2">
                <ActionButton onClick={() => openEdit(tpl)} variant="ghost" size="sm">
                  <Edit3 size={14} /> Edit
                </ActionButton>
                <ActionButton
                  onClick={() => setDeleteTarget(tpl)}
                  variant="ghost"
                  size="sm"
                >
                  <Trash2 size={14} /> Delete
                </ActionButton>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Edit Template" : "Create Template"}
        description="Configure license template defaults."
        size="lg"
        footer={
          <>
            <ActionButton variant="secondary" onClick={() => setModalOpen(false)}>Cancel</ActionButton>
            <ActionButton variant="primary" onClick={save} loading={saving}>
              {editing ? "Update" : "Create"}
            </ActionButton>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-400">Name</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-3 text-zinc-100 outline-none focus:border-blue-500" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-400">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-3 text-zinc-100 outline-none focus:border-blue-500" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-400">Plan</label>
              <select value={form.plan} onChange={(e) => setForm({ ...form, plan: e.target.value })}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-3 text-zinc-100 outline-none focus:border-blue-500">
                {PLANS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-400">Max Devices</label>
              <input type="number" min="1" value={form.maxDevices}
                onChange={(e) => setForm({ ...form, maxDevices: Number(e.target.value) })}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-3 text-zinc-100 outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-400">Duration (days)</label>
              <input type="number" min="1" value={form.durationDays}
                onChange={(e) => setForm({ ...form, durationDays: Number(e.target.value) })}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-3 text-zinc-100 outline-none focus:border-blue-500" />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-400">Feature Flags (JSON)</label>
            <textarea value={form.featureFlags} onChange={(e) => setForm({ ...form, featureFlags: e.target.value })}
              rows={3}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-3 font-mono text-sm text-zinc-100 outline-none focus:border-blue-500" />
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Template"
        description={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        loading={deleting}
      />
    </div>
  );
}
