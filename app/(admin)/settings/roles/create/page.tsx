"use client";

import { useRouter } from "next/navigation";
import { useState, useMemo } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { ActionButton } from "@/components/ui/ActionButton";
import { API_ROUTES, PERMISSION_GROUPS, RISK_LEVELS, ALL_PERMISSIONS } from "@/lib/constants";
import { PERMISSION_META } from "@/lib/permission-meta";
import { SIDEBAR_PAGES } from "@/lib/sidebar";
import { Search, Shield, ChevronDown, ChevronRight, Info } from "lucide-react";

export default function CreateRolePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [riskLevel, setRiskLevel] = useState("Medium");
  const [protectedRole, setProtectedRole] = useState(false);
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(Object.keys(PERMISSION_GROUPS)));
  const [selectedPermInfo, setSelectedPermInfo] = useState<string | null>(null);

  const togglePermission = (p: string) => {
    setSelectedPermissions((prev) => {
      const next = new Set(prev);
      if (next.has(p)) next.delete(p);
      else next.add(p);
      return next;
    });
  };

  function toggleCategory(groupName: string, permissions: string[]) {
    const allSelected = permissions.every((p) => selectedPermissions.has(p));
    setSelectedPermissions((prev) => {
      const next = new Set(prev);
      if (allSelected) permissions.forEach((p) => next.delete(p));
      else permissions.forEach((p) => next.add(p));
      return next;
    });
  }

  function displayName(p: string): string {
    return PERMISSION_META[p]?.friendlyName || p;
  }

  const visiblePagesCount = useMemo(
    () => SIDEBAR_PAGES.filter((p) => p.permission && selectedPermissions.has(p.permission)).length,
    [selectedPermissions]
  );
  const restrictedPagesCount = SIDEBAR_PAGES.length - visiblePagesCount;

  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) return Object.entries(PERMISSION_GROUPS);
    const q = searchQuery.toLowerCase();
    return Object.entries(PERMISSION_GROUPS).filter(([group, perms]) => {
      const groupMatch = group.toLowerCase().includes(q);
      const permMatch = perms.some((p) => {
        const meta = PERMISSION_META[p];
        return p.toLowerCase().includes(q) || meta?.friendlyName.toLowerCase().includes(q) || meta?.description.toLowerCase().includes(q);
      });
      return groupMatch || permMatch;
    }).map(([group, perms]) => [
      group,
      perms.filter((p) => {
        const meta = PERMISSION_META[p];
        return p.toLowerCase().includes(q) || meta?.friendlyName.toLowerCase().includes(q) || meta?.description.toLowerCase().includes(q);
      }),
    ] as [string, string[]]);
  }, [searchQuery]);

  async function createRole() {
    setError("");
    if (!name.trim()) {
      setError("Role name is required");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(API_ROUTES.ROLES.CREATE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, riskLevel, protected: protectedRole }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Failed to create role");
        return;
      }

      await fetch(API_ROUTES.ROLES.UPDATE_PERMISSIONS, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roleId: data.id, permissions: [...selectedPermissions] }),
      });

      router.push("/settings/roles");
      router.refresh();
    } catch {
      setError("Failed to create role");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Create Enterprise Role"
        description="Define role hierarchy, permissions, risk profile and operational authority."
        actions={
          <ActionButton variant="secondary" onClick={() => router.push("/settings/roles")}>
            Cancel
          </ActionButton>
        }
      />

      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>
      )}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-8 lg:col-span-2">
          <h2 className="mb-6 text-xl font-bold">Role Information</h2>
          <div className="space-y-5">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Role Name"
              className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-3 text-zinc-100 outline-none focus:border-blue-500"
            />
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Role Description"
              className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-3 text-zinc-100 outline-none focus:border-blue-500"
            />
            <select
              value={riskLevel}
              onChange={(e) => setRiskLevel(e.target.value)}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-3 text-zinc-100 outline-none focus:border-blue-500"
            >
              {RISK_LEVELS.map((level) => (
                <option key={level} value={level}>{level}</option>
              ))}
            </select>
            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-zinc-700 bg-zinc-800 p-3">
              <input
                type="checkbox"
                checked={protectedRole}
                onChange={(e) => setProtectedRole(e.target.checked)}
                className="h-4 w-4"
              />
              <span className="text-sm font-medium">Protected Role (cannot be deleted)</span>
            </label>
          </div>
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-8">
          <h2 className="mb-6 text-xl font-bold">Role Summary</h2>
          <div className="space-y-4">
            <div className="rounded-xl border border-zinc-800 bg-zinc-950/30 p-4">
              <p className="text-sm text-zinc-500">Total Permissions</p>
              <p className="mt-1 font-medium">{selectedPermissions.size} of {ALL_PERMISSIONS.length}</p>
            </div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-950/30 p-4">
              <p className="text-sm text-zinc-500">Visible Pages</p>
              <p className="mt-1 font-medium text-green-400">{visiblePagesCount}</p>
            </div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-950/30 p-4">
              <p className="text-sm text-zinc-500">Restricted Pages</p>
              <p className="mt-1 font-medium text-red-400">{restrictedPagesCount}</p>
            </div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-950/30 p-4">
              <p className="text-sm text-zinc-500">Status</p>
              <p className="mt-1 font-medium text-green-400">Ready</p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-8">
        <h2 className="mb-6 text-xl font-bold">Visible Sidebar Pages</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {SIDEBAR_PAGES.map((page) => {
            const hasPermission = !!page.permission;
            const isSelected = page.permission ? selectedPermissions.has(page.permission) : true;
            return (
              <label
                key={page.key}
                className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-colors ${
                  isSelected
                    ? "border-blue-500/50 bg-blue-500/10"
                    : "border-zinc-800 bg-zinc-950/30 hover:bg-zinc-800"
                }`}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  disabled={!hasPermission}
                  onChange={() => page.permission && togglePermission(page.permission)}
                  className="h-4 w-4"
                />
                <span className="text-sm">{page.label}</span>
                {!hasPermission && <span className="ml-auto text-[10px] text-zinc-500">always visible</span>}
              </label>
            );
          })}
        </div>
      </div>

      <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-8">
        <h2 className="mb-6 text-xl font-bold">Permission Assignment</h2>
        <div className="mb-4 relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search permissions by name or description..."
            className="w-full rounded-xl border border-zinc-700 bg-zinc-800 py-2.5 pl-9 pr-3 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-blue-500"
          />
        </div>
        {selectedPermInfo && (
          <div className="mb-4 rounded-xl border border-blue-500/20 bg-blue-500/5 p-3">
            <div className="flex items-start gap-2">
              <Info size={14} className="mt-0.5 shrink-0 text-blue-400" />
              <div>
                <p className="text-sm font-medium text-blue-300">{displayName(selectedPermInfo)}</p>
                <p className="text-xs text-blue-200/70 mt-0.5">{PERMISSION_META[selectedPermInfo]?.description || "No description available."}</p>
              </div>
            </div>
          </div>
        )}
        <div className="space-y-4">
          {filteredGroups.length === 0 ? (
            <div className="flex items-center justify-center rounded-xl border border-dashed border-zinc-700 py-8">
              <p className="text-sm text-zinc-500">No permissions match your search.</p>
            </div>
          ) : filteredGroups.map(([group, permissions]) => {
            const perms = permissions as string[];
            const groupSelected = perms.every((p) => selectedPermissions.has(p));
            const groupPartial = perms.some((p) => selectedPermissions.has(p)) && !groupSelected;
            const isExpanded = expandedCategories.has(group);
            return (
              <div key={group} className="rounded-2xl border border-zinc-800 bg-zinc-950/30">
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    setExpandedCategories((prev) => {
                      const next = new Set(prev);
                      if (next.has(group)) next.delete(group);
                      else next.add(group);
                      return next;
                    });
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setExpandedCategories((prev) => {
                        const next = new Set(prev);
                        if (next.has(group)) next.delete(group);
                        else next.add(group);
                        return next;
                      });
                    }
                  }}
                  className="flex w-full items-center gap-3 px-5 py-3.5 text-left"
                >
                  <Shield size={14} className="shrink-0 text-zinc-500" />
                  <span className="flex-1 text-sm font-semibold text-zinc-200">{group}</span>
                  <span className="text-xs text-zinc-500">{perms.filter((p) => selectedPermissions.has(p)).length}/{perms.length}</span>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); toggleCategory(group, perms); }}
                    className={`rounded-lg border px-2 py-0.5 text-[10px] transition-colors ${
                      groupSelected ? "border-green-500/30 bg-green-500/10 text-green-400" : groupPartial ? "border-yellow-500/30 bg-yellow-500/10 text-yellow-400" : "border-zinc-700 bg-zinc-800 text-zinc-500 hover:border-zinc-600"
                    }`}
                  >
                    {groupSelected ? "Deselect All" : groupPartial ? "Select All" : "Select All"}
                  </button>
                  {isExpanded ? <ChevronDown size={14} className="shrink-0 text-zinc-500" /> : <ChevronRight size={14} className="shrink-0 text-zinc-500" />}
                </div>
                {isExpanded && (
                  <div className="border-t border-zinc-800 px-5 py-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {perms.map((permission) => {
                        const isSelected = selectedPermissions.has(permission);
                        const meta = PERMISSION_META[permission];
                        return (
                          <label
                            key={permission}
                            className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors ${
                              isSelected ? "border-blue-500/30 bg-blue-500/5" : "border-zinc-800 bg-zinc-900 hover:bg-zinc-800"
                            }`}
                            onMouseEnter={() => setSelectedPermInfo(permission)}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => togglePermission(permission)}
                              className="mt-0.5 h-4 w-4 shrink-0"
                            />
                            <div className="min-w-0 flex-1">
                              <span className="text-sm text-zinc-200">{displayName(permission)}</span>
                              {meta?.description && (
                                <p className="mt-0.5 text-[10px] text-zinc-500 leading-tight">{meta.description}</p>
                              )}
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-8 flex justify-end gap-3">
          <ActionButton variant="secondary" onClick={() => router.push("/settings/roles")}>
            Cancel
          </ActionButton>
          <ActionButton variant="primary" onClick={createRole} disabled={loading}>
            {loading ? "Creating..." : "Create Role"}
          </ActionButton>
        </div>
      </div>
    </div>
  );
}
