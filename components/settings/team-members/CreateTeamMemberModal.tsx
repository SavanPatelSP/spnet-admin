"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { ActionButton } from "@/components/ui/ActionButton";
import { API_ROUTES, PERMISSION_GROUPS, ALL_PERMISSIONS, ROLE_PRICES as FALLBACK_PRICES } from "@/lib/constants";
import { ACCESS_COST_PER_PERMISSION, getRolePrice, getRoleHierarchyLevel, getDefaultPermissions, getPermissionCounts, getCategoryCounts, calculateCosts } from "@/lib/permissions";
import { UserPlus, Shield, Mail, User, Check, DollarSign, Receipt, Activity, ChevronDown, ChevronRight, Search, Filter, Lock, Unlock, Info, FileText, Eye, EyeOff, TrendingUp, BarChart3, Settings, Users, Key, Monitor, AlertTriangle, Globe, Megaphone, ClipboardList, Building2, Headphones, Coins, Gem, Crown, BookOpen, HelpCircle } from "lucide-react";

const CATEGORY_ICONS: Record<string, typeof Shield> = {
  "License Management": Key,
  "Device Management": Monitor,
  "User Management": Users,
  "Team Management": Users,
  "Password Policy": Lock,
  "Role Management": Shield,
  Security: AlertTriangle,
  "Audit & Compliance": ClipboardList,
  "Billing & Revenue": DollarSign,
  Settings: Settings,
  Analytics: TrendingUp,
  Reports: BarChart3,
  Broadcasts: Megaphone,
  "Content Moderation": BookOpen,
  Organizations: Building2,
  Support: Headphones,
  "Gems Management": Gem,
  "Coins Management": Coins,
  "Premium Management": Crown,
};

interface Props {
  open?: boolean;
  onClose?: () => void;
}

export default function CreateTeamMemberModal({
  open: externalOpen, onClose: externalOnClose,
}: Props) {
  const router = useRouter();
  const [internalOpen, setInternalOpen] = useState(false);
  const open = externalOpen !== undefined ? externalOpen : internalOpen;
  const setOpen = (v: boolean) => {
    setInternalOpen(v);
    if (!v) externalOnClose?.();
  };
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [roleId, setRoleId] = useState("");
  const [notes, setNotes] = useState("");
  const [roles, setRoles] = useState<{ id: string; name: string }[]>([]);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [viewMode, setViewMode] = useState<"all" | "granted" | "restricted">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(Object.keys(PERMISSION_GROUPS)));
  const [customEnabled, setCustomEnabled] = useState<Set<string>>(new Set());
  const [showPermissions, setShowPermissions] = useState(false);
  const [rolePricing, setRolePricing] = useState<Record<string, number> | null>(null);
  const [pricingLoading, setPricingLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setRolesLoading(true);
    setPricingLoading(true);
    setCustomEnabled(new Set());
    setShowPermissions(false);
    setSearchQuery("");
    setViewMode("all");
    setExpandedCategories(new Set(Object.keys(PERMISSION_GROUPS)));
    Promise.all([
      fetch(API_ROUTES.ROLES.LIST).then((r) => r.json()),
      fetch("/api/roles/pricing").then((r) => r.json()).catch(() => ({ success: false })),
    ]).then(([roleData, pricingData]) => {
      setRoles(Array.isArray(roleData) ? roleData : []);
      if (pricingData.success && Array.isArray(pricingData.data)) {
        const map: Record<string, number> = {};
        pricingData.data.forEach((item: { role: string; price: number }) => { map[item.role] = item.price; });
        setRolePricing(map);
      }
    }).catch(() => setError("Failed to load roles"))
      .finally(() => { setRolesLoading(false); setPricingLoading(false); });
  }, [open]);

  const valid = name.trim() && email.trim() && roleId;

  const selectedRole = roles.find((r) => r.id === roleId);
  const roleName = selectedRole?.name ?? "";
  const effectivePrices = rolePricing ?? FALLBACK_PRICES;
  const rolePrice = getRolePrice(roleName);
  const roleLevel = getRoleHierarchyLevel(roleName);

  const defaultPerms = useMemo(() => roleName ? getDefaultPermissions(roleName) : [], [roleName]);
  const counts = useMemo(() => roleName ? getPermissionCounts(roleName) : { total: 0, default: 0, restricted: 0, custom: 0, coveragePercent: 0 }, [roleName]);
  const categories = useMemo(() => roleName ? getCategoryCounts(roleName) : [], [roleName]);
  const allPerms = useMemo(() => {
    const all = ALL_PERMISSIONS as readonly string[];
    const granted = new Set(defaultPerms);
    const restricted = new Set(all.filter((p) => !granted.has(p)));
    const effective = new Set(defaultPerms);
    customEnabled.forEach((p) => {
      if (restricted.has(p)) effective.add(p);
      else effective.delete(p);
    });
    return { granted: [...granted], restricted: [...restricted], effective: [...effective] };
  }, [defaultPerms, customEnabled]);

  const effectiveCount = allPerms.effective.length;
  const { seatCost, accessCost, grandTotal } = calculateCosts(roleName, effectiveCount);

  const filteredCategories = useMemo(() => {
    return categories.map((cat) => ({
      ...cat,
      permissions: cat.permissions.filter((p) => {
        const matchesSearch = searchQuery === "" || p.toLowerCase().includes(searchQuery.toLowerCase());
        if (!matchesSearch) return false;
        if (viewMode === "granted") return defaultPerms.includes(p);
        if (viewMode === "restricted") return !defaultPerms.includes(p);
        return true;
      }),
    })).filter((cat) => cat.permissions.length > 0);
  }, [categories, searchQuery, viewMode, defaultPerms]);

  const toggleCategory = (name: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const togglePermission = (perm: string) => {
    setCustomEnabled((prev) => {
      const next = new Set(prev);
      if (next.has(perm)) next.delete(perm);
      else next.add(perm);
      return next;
    });
  };

  const customChanges = [...customEnabled].filter((p) => !defaultPerms.includes(p));
  const customRemovals = [...customEnabled].filter((p) => defaultPerms.includes(p));
  const customChangeCount = customChanges.length + customRemovals.length;
  const customGrantedCount = effectiveCount;
  const customRestrictedCount = counts.total - effectiveCount;
  const customCoverage = counts.total > 0 ? Math.round((effectiveCount / counts.total) * 100) : 0;

  const hasPermissionChanges = customChangeCount > 0;
  const restoredCount = customChanges.filter((p) => defaultPerms.includes(p)).length;

  async function handleCreate() {
    if (!valid) return;
    setError("");
    setLoading(true);
    try {
      const res = await fetch(API_ROUTES.TEAM_MEMBERS.CREATE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), roleId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create team member");
        return;
      }
      setOpen(false);
      setName("");
      setEmail("");
      setRoleId("");
      setNotes("");
      router.refresh();
    } catch {
      setError("Failed to create team member");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {externalOpen === undefined && (
        <ActionButton onClick={() => setOpen(true)} variant="primary">
          <UserPlus size={16} /> Invite Member
        </ActionButton>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Invite Team Member"
        description="Create a new administrator account with platform role assignment and custom permissions."
        size="lg"
        footer={
          <>
            <ActionButton variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </ActionButton>
            <ActionButton variant="primary" onClick={handleCreate} disabled={loading || !valid}>
              {loading ? "Creating..." : "Create Member"}
            </ActionButton>
          </>
        }
      >
        <div className="space-y-6">
          {error && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>
          )}

          {/* Step 1: Basic Info */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
            <div className="mb-3 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-700 text-xs font-bold text-zinc-200">1</span>
              <h4 className="text-sm font-semibold text-zinc-100">Account Information</h4>
            </div>
            <div className="space-y-3">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">Full Name</label>
                <div className="relative">
                  <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Jane Smith"
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-800 py-2.5 pl-9 pr-3 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">Email Address</label>
                <div className="relative">
                  <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. jane@example.com"
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-800 py-2.5 pl-9 pr-3 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Step 2: Role Selection */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
            <div className="mb-3 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-700 text-xs font-bold text-zinc-200">2</span>
              <h4 className="text-sm font-semibold text-zinc-100">Role Assignment</h4>
            </div>

            {rolesLoading ? (
              <div className="text-sm text-zinc-500">Loading roles...</div>
            ) : roles.length === 0 ? (
              <div className="text-sm text-zinc-500">No roles available. Create a role first.</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {roles.map((role) => {
                  const isSelected = roleId === role.id;
                  const upper = role.name.toUpperCase().replace(/\s+/g, "_");
                  const rp = (rolePricing ?? FALLBACK_PRICES)[upper] ?? getRolePrice(role.name);
                  const rc = getPermissionCounts(role.name);
                  return (
                    <button
                      key={role.id}
                      type="button"
                      onClick={() => { setRoleId(role.id); setShowPermissions(false); setCustomEnabled(new Set()); }}
                      className={`flex items-center gap-3 rounded-xl border p-3.5 text-left transition-all ${
                        isSelected
                          ? "border-blue-500/50 bg-blue-500/10"
                          : "border-zinc-800 bg-zinc-900 hover:border-zinc-700"
                      }`}
                    >
                      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                        isSelected ? "bg-blue-500/20" : "bg-zinc-800"
                      }`}>
                        <Shield size={16} className={isSelected ? "text-blue-400" : "text-zinc-500"} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={`text-sm font-medium truncate ${isSelected ? "text-blue-300" : "text-zinc-200"}`}>
                          {role.name}
                        </div>
                        {rp > 0 && (
                          <div className="text-[10px] text-zinc-500 mt-0.5">
                            ${rp.toLocaleString()}/mo &middot; {rc.coveragePercent}% coverage
                          </div>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-xs font-semibold text-zinc-400">{rc.default}/{rc.total}</div>
                        <div className="text-[9px] text-zinc-600">perms</div>
                      </div>
                      {isSelected && (
                        <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-500">
                          <Check size={12} className="text-white" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {selectedRole && (
              <div className="mt-3 rounded-lg border border-blue-500/20 bg-blue-500/5 p-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-3">
                    <p className="text-xs text-blue-300">
                      <span className="font-medium">Selected Role:</span> {selectedRole.name}
                    </p>
                    <span className="text-[10px] text-zinc-500">Level {roleLevel}/100</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowPermissions(!showPermissions)}
                    className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300"
                  >
                    {showPermissions ? <EyeOff size={12} /> : <Eye size={12} />}
                    {showPermissions ? "Hide Permissions" : `Manage Permissions (${counts.default}/${counts.total} default)`}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Permission Management */}
          {selectedRole && showPermissions && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
              <div className="mb-3 flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-500/20 text-xs font-bold text-purple-400">+</span>
                <h4 className="text-sm font-semibold text-zinc-100">
                  Permission Management
                  {hasPermissionChanges && (
                    <span className="ml-2 text-[10px] text-yellow-400 font-normal">
                      ({customChangeCount} custom change{customChangeCount > 1 ? "s" : ""})
                    </span>
                  )}
                </h4>
              </div>

              {/* Permission Summary Bar */}
              <div className="mb-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2">
                  <span className="text-[9px] text-zinc-500">Granted</span>
                  <p className="text-sm font-semibold text-emerald-400">{effectiveCount}/{counts.total}</p>
                </div>
                <div className="rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2">
                  <span className="text-[9px] text-zinc-500">Restricted</span>
                  <p className="text-sm font-semibold text-red-400">{customRestrictedCount}/{counts.total}</p>
                </div>
                <div className="rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2">
                  <span className="text-[9px] text-zinc-500">Custom</span>
                  <p className="text-sm font-semibold text-yellow-400">{customChangeCount}</p>
                </div>
                <div className="rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2">
                  <span className="text-[9px] text-zinc-500">Coverage</span>
                  <p className="text-sm font-semibold text-blue-400">{customCoverage}%</p>
                </div>
              </div>

              {/* Coverage Bar */}
              <div className="mb-4">
                <div className="flex items-center justify-between text-[10px] text-zinc-500 mb-1">
                  <span>Permission Coverage</span>
                  <span>{customCoverage}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-700">
                  <div
                    className="h-full rounded-full bg-blue-500 transition-all"
                    style={{ width: `${customCoverage}%` }}
                  />
                </div>
              </div>

              {/* Search & Filter */}
              <div className="mb-4 flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search permissions..."
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-800 py-2 pl-9 pr-3 text-xs text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-blue-500"
                  />
                </div>
                <div className="flex gap-2">
                  {(["all", "granted", "restricted"] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setViewMode(mode)}
                      className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                        viewMode === mode
                          ? "border-blue-500/50 bg-blue-500/20 text-blue-300"
                          : "border-zinc-700 bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                      }`}
                    >
                      {mode === "all" ? "All" : mode === "granted" ? "Granted" : "Restricted"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Permission Categories */}
              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {filteredCategories.length === 0 ? (
                  <div className="flex items-center justify-center rounded-lg border border-dashed border-zinc-700 py-8">
                    <p className="text-xs text-zinc-500">No permissions match your filters.</p>
                  </div>
                ) : filteredCategories.map((cat) => {
                  const Icon = CATEGORY_ICONS[cat.name] || Shield;
                  const isExpanded = expandedCategories.has(cat.name);
                  const catGranted = cat.permissions.filter((p) => allPerms.effective.includes(p)).length;
                  return (
                    <div key={cat.name} className="rounded-lg border border-zinc-800 bg-zinc-900/80">
                      <button
                        type="button"
                        onClick={() => toggleCategory(cat.name)}
                        className="flex w-full items-center gap-2 px-3 py-2.5 text-left"
                      >
                        <Icon size={12} className="shrink-0 text-zinc-400" />
                        <span className="flex-1 text-xs font-medium text-zinc-200">{cat.name}</span>
                        <span className="text-[10px] text-zinc-500">{catGranted}/{cat.total}</span>
                        <div className="h-1.5 w-12 overflow-hidden rounded-full bg-zinc-700">
                          <div
                            className="h-full rounded-full bg-blue-500"
                            style={{ width: `${cat.total > 0 ? (catGranted / cat.total) * 100 : 0}%` }}
                          />
                        </div>
                        {isExpanded ? <ChevronDown size={12} className="shrink-0 text-zinc-500" /> : <ChevronRight size={12} className="shrink-0 text-zinc-500" />}
                      </button>
                      {isExpanded && (
                        <div className="border-t border-zinc-800 px-3 py-2 space-y-1">
                          {cat.permissions.map((perm) => {
                            const isDefault = defaultPerms.includes(perm);
                            const isCustomEnabled = customEnabled.has(perm);
                            const effectivelyGranted = allPerms.effective.includes(perm);
                            return (
                              <label
                                key={perm}
                                className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-zinc-800 cursor-pointer"
                              >
                                <input
                                  type="checkbox"
                                  checked={effectivelyGranted}
                                  onChange={() => togglePermission(perm)}
                                  className="h-3.5 w-3.5 rounded border-zinc-600 bg-zinc-700 text-blue-500 focus:ring-blue-500/20"
                                />
                                <span className={`flex-1 text-xs ${effectivelyGranted ? "text-zinc-200" : "text-zinc-500"}`}>
                                  {perm}
                                </span>
                                {isCustomEnabled && !isDefault && (
                                  <span className="rounded bg-yellow-500/10 px-1.5 py-0.5 text-[9px] text-yellow-400">added</span>
                                )}
                                {isCustomEnabled && isDefault && (
                                  <span className="rounded bg-red-500/10 px-1.5 py-0.5 text-[9px] text-red-400">removed</span>
                                )}
                                {!isCustomEnabled && !isDefault && (
                                  <span className="rounded bg-zinc-700/50 px-1.5 py-0.5 text-[9px] text-zinc-500">restricted</span>
                                )}
                              </label>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 3: Cost & Value Summary */}
          <div className="rounded-xl border border-green-500/20 bg-green-500/[0.03] p-5">
            <div className="mb-3 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-green-500/20 text-xs font-bold text-green-400">3</span>
              <h4 className="flex items-center gap-1.5 text-sm font-semibold text-green-300">
                <DollarSign size={14} />
                Cost &amp; Value Summary
              </h4>
            </div>

            {selectedRole ? (
              <div className="space-y-4">
                {/* Role, Seat Cost, Access Cost Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2.5">
                    <span className="text-[10px] text-zinc-500">Role</span>
                    <p className="text-sm font-semibold text-zinc-100">{selectedRole.name}</p>
                    <p className="text-[10px] text-zinc-500">Level {roleLevel}/100 in hierarchy</p>
                  </div>
                  <div className="rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2.5">
                    <span className="text-[10px] text-zinc-500">Seat Cost</span>
                    <p className="text-sm font-semibold text-zinc-100">${seatCost.toLocaleString()}/mo</p>
                    <p className="text-[10px] text-zinc-500">Base price for {selectedRole.name}</p>
                  </div>
                  <div className="rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2.5">
                    <span className="text-[10px] text-zinc-500">Permission Level</span>
                    <p className="text-sm font-semibold text-zinc-100">{effectiveCount}/{counts.total}</p>
                    <p className="text-[10px] text-zinc-500">{customCoverage}% coverage</p>
                  </div>
                </div>

                {/* Access Cost */}
                <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 px-4 py-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <div>
                      <span className="text-[10px] font-medium text-blue-400">Access Cost</span>
                      <p className="text-xs text-blue-300/70">{effectiveCount} permissions &times; ${ACCESS_COST_PER_PERMISSION.toFixed(2)} = ${accessCost.toFixed(2)}</p>
                    </div>
                    <span className="text-sm font-semibold text-blue-300">${accessCost.toFixed(2)}</span>
                  </div>
                </div>

                {/* Cost Breakdown */}
                <div className="rounded-lg border border-zinc-700 bg-zinc-800/30 p-4">
                  <div className="mb-2 flex items-center gap-1.5">
                    <Receipt size={12} className="text-zinc-400" />
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Cost Breakdown</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-400">Base Seat ({selectedRole.name})</span>
                      <span className="text-zinc-200">${seatCost.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-400">Access ({effectiveCount} &times; ${ACCESS_COST_PER_PERMISSION.toFixed(2)})</span>
                      <span className="text-zinc-200">${accessCost.toFixed(2)}</span>
                    </div>
                    <div className="border-t border-zinc-700 pt-2">
                      <div className="flex items-center justify-between text-sm font-bold">
                        <span className="text-green-400">Grand Total</span>
                        <span className="text-green-400">${grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/mo</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Value Summary */}
                <div className="rounded-lg border border-zinc-700 bg-zinc-800/30 p-4">
                  <div className="mb-2 flex items-center gap-1.5">
                    <Activity size={12} className="text-zinc-400" />
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Value Summary</span>
                  </div>
                  {grandTotal > 0 ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                        <div className="rounded bg-zinc-800/50 px-2 py-1.5">
                          <span className="block text-[9px] text-zinc-500">Role</span>
                          <span className="text-xs font-semibold text-zinc-200">{selectedRole.name}</span>
                        </div>
                        <div className="rounded bg-zinc-800/50 px-2 py-1.5">
                          <span className="block text-[9px] text-zinc-500">Seat Cost</span>
                          <span className="text-xs font-semibold text-zinc-200">${seatCost.toLocaleString()}</span>
                        </div>
                        <div className="rounded bg-zinc-800/50 px-2 py-1.5">
                          <span className="block text-[9px] text-zinc-500">Access Cost</span>
                          <span className="text-xs font-semibold text-zinc-200">${accessCost.toFixed(2)}</span>
                        </div>
                        <div className="rounded bg-zinc-800/50 px-2 py-1.5">
                          <span className="block text-[9px] text-zinc-500">Total Perms</span>
                          <span className="text-xs font-semibold text-zinc-200">{effectiveCount}</span>
                        </div>
                      </div>
                      <div>
                        <div className="mb-1 flex items-center justify-between text-xs">
                          <span className="text-zinc-400">Seat Allocation</span>
                          <span className="text-zinc-300">{grandTotal > 0 ? ((seatCost / grandTotal) * 100).toFixed(0) : 0}%</span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-700">
                          <div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: `${grandTotal > 0 ? (seatCost / grandTotal) * 100 : 0}%` }} />
                        </div>
                      </div>
                      <div>
                        <div className="mb-1 flex items-center justify-between text-xs">
                          <span className="text-zinc-400">Access Permissions</span>
                          <span className="text-zinc-300">{grandTotal > 0 ? ((accessCost / grandTotal) * 100).toFixed(0) : 0}%</span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-700">
                          <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${grandTotal > 0 ? (accessCost / grandTotal) * 100 : 0}%` }} />
                        </div>
                      </div>
                      <div>
                        <div className="mb-1 flex items-center justify-between text-xs">
                          <span className="text-zinc-400">Permission Coverage</span>
                          <span className="text-zinc-300">{customCoverage}%</span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-700">
                          <div className="h-full rounded-full bg-purple-500 transition-all" style={{ width: `${customCoverage}%` }} />
                        </div>
                      </div>
                      {hasPermissionChanges && (
                        <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 px-3 py-2">
                          <p className="text-[10px] text-yellow-400">
                            Custom permission changes ({customChangeCount}): {customChanges.length} added, {customRemovals.length} removed
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-zinc-500">No costs to display.</p>
                  )}
                </div>

                {/* Audit Preview */}
                <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-yellow-400" />
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Audit Preview</h4>
                  </div>
                  <div className="space-y-1.5 font-mono text-xs">
                    <div className="flex flex-col sm:flex-row sm:gap-0 gap-0.5">
                      <span className="text-zinc-500 sm:w-28 shrink-0">Action</span>
                      <span className="text-yellow-400">TEAM_MEMBER_CREATED</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:gap-0 gap-0.5">
                      <span className="text-zinc-500 sm:w-28 shrink-0">Name</span>
                      <span className="text-zinc-300">{name || "\u2014"}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:gap-0 gap-0.5">
                      <span className="text-zinc-500 sm:w-28 shrink-0">Email</span>
                      <span className="text-zinc-300">{email || "\u2014"}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:gap-0 gap-0.5">
                      <span className="text-zinc-500 sm:w-28 shrink-0">Role</span>
                      <span className="text-zinc-300">{selectedRole.name} (Level {roleLevel})</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:gap-0 gap-0.5">
                      <span className="text-zinc-500 sm:w-28 shrink-0">Permissions</span>
                      <span className="text-zinc-300">{effectiveCount}/{counts.total} ({customCoverage}% coverage)</span>
                    </div>
                    {hasPermissionChanges && (
                      <div className="flex flex-col sm:flex-row sm:gap-0 gap-0.5">
                        <span className="text-zinc-500 sm:w-28 shrink-0">Custom Changes</span>
                        <span className="text-yellow-400">{customChanges.length} added, {customRemovals.length} removed</span>
                      </div>
                    )}
                    <div className="flex flex-col sm:flex-row sm:gap-0 gap-0.5">
                      <span className="text-zinc-500 sm:w-28 shrink-0">Seat Cost</span>
                      <span className="text-zinc-300">${seatCost.toLocaleString()}/mo</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:gap-0 gap-0.5">
                      <span className="text-zinc-500 sm:w-28 shrink-0">Access Cost</span>
                      <span className="text-zinc-300">${accessCost.toFixed(2)}/mo</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:gap-0 gap-0.5">
                      <span className="text-zinc-500 sm:w-28 shrink-0">Final Cost</span>
                      <span className="text-green-400">${grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/mo</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center rounded-lg border border-dashed border-zinc-700 bg-zinc-800/20 px-4 py-8">
                <p className="text-sm text-zinc-500">Select a role above to see the cost breakdown and manage permissions.</p>
              </div>
            )}
          </div>

          {/* Step 4: Notes */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
            <div className="mb-3 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-700 text-xs font-bold text-zinc-200">4</span>
              <h4 className="text-sm font-semibold text-zinc-100">Notes (optional)</h4>
            </div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes about this invitation..."
              rows={2}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-2.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-blue-500"
            />
          </div>
        </div>
      </Modal>
    </>
  );
}

