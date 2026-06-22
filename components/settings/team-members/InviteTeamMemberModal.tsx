"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { ActionButton } from "@/components/ui/ActionButton";
import {
  API_ROUTES, PERMISSION_GROUPS, ALL_PERMISSIONS, ROLE_PRICES as FALLBACK_PRICES, LICENSE_TIERS,
} from "@/lib/constants";
import {
  ACCESS_COST_PER_PERMISSION, getRolePrice, getRoleHierarchyLevel, getDefaultPermissions,
  getPermissionCounts, getCategoryCounts, calculateCosts,
} from "@/lib/permissions";
import { formatDate } from "@/lib/shared";
import {
  UserPlus, Shield, Mail, User, Check, DollarSign, Receipt, Activity,
  ChevronDown, ChevronRight, Search, Lock, Key, Monitor,
  AlertTriangle, ClipboardList, Building2,
  Coins, Gem, Crown, BookOpen, HelpCircle, Zap, Copy, Calendar, TrendingUp,
  Server, FileText, Eye, EyeOff, RefreshCw, CheckCircle, ArrowRight,
  Users, BarChart3, Settings, Megaphone, Headphones,
  Sparkles, Info, Clipboard, LogIn, Fingerprint,
} from "lucide-react";

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
  currentUserRole?: string;
}

function generateSecurePassword(length = 16): string {
  const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lower = "abcdefghijklmnopqrstuvwxyz";
  const digits = "0123456789";
  const all = upper + lower + digits;
  let password = "";
  password += upper[Math.floor(Math.random() * upper.length)];
  password += lower[Math.floor(Math.random() * lower.length)];
  password += digits[Math.floor(Math.random() * digits.length)];
  for (let i = password.length; i < length; i++) {
    password += all[Math.floor(Math.random() * all.length)];
  }
  return password.split("").sort(() => Math.random() - 0.5).join("");
}

function copyToClipboard(text: string) {
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(text).catch(() => {
      fallbackCopy(text);
    });
  } else {
    fallbackCopy(text);
  }
}

function fallbackCopy(text: string) {
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.style.position = "fixed";
  ta.style.left = "-9999px";
  document.body.appendChild(ta);
  ta.select();
  try { document.execCommand("copy"); } catch { /* silent */ }
  document.body.removeChild(ta);
}

function buildFullLoginInfo(email: string, username: string, password: string, licenseKey?: string) {
  const parts = [`Email: ${email}`];
  if (username) parts.push(`Username: ${username}`);
  if (password) parts.push(`Password: ${password}`);
  if (licenseKey) parts.push(`License Key: ${licenseKey}`);
  return parts.join("\n");
}

export default function InviteTeamMemberModal({
  open: externalOpen, onClose: externalOnClose, currentUserRole = "",
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
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [roleId, setRoleId] = useState("");
  const [organization, setOrganization] = useState("");
  const [notes, setNotes] = useState("");
  const [createLicense, setCreateLicense] = useState(false);
  const [tierLabel, setTierLabel] = useState(LICENSE_TIERS[0].label);
  const [maxDevices, setMaxDevices] = useState(LICENSE_TIERS[0].maxDevices);
  const [durationDays, setDurationDays] = useState(LICENSE_TIERS[0].durationDays);
  const [expiresAt, setExpiresAt] = useState("");
  const [copiedField, setCopiedField] = useState("");

  const [roles, setRoles] = useState<{ id: string; name: string }[]>([]);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [viewMode, setViewMode] = useState<"all" | "granted" | "restricted">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(Object.keys(PERMISSION_GROUPS)));
  const [customEnabled, setCustomEnabled] = useState<Set<string>>(new Set());
  const [showPermissions, setShowPermissions] = useState(false);
  const [rolePricing, setRolePricing] = useState<Record<string, number> | null>(null);
  const [pricingLoading, setPricingLoading] = useState(false);

  const [result, setResult] = useState<{
    member: { id: string; name: string; email: string };
    licenseKey?: string;
    tempPassword?: string;
    password?: string;
  } | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [regeneratingPassword, setRegeneratingPassword] = useState(false);

  const isAdmin = currentUserRole === "OWNER" || currentUserRole === "SUPER_ADMIN";
  const effectivePassword = result ? (result.tempPassword || result.password || "") : password;

  useEffect(() => {
    if (!open) return;
    setRolesLoading(true);
    setPricingLoading(true);
    setCustomEnabled(new Set());
    setShowPermissions(false);
    setSearchQuery("");
    setViewMode("all");
    setExpandedCategories(new Set(Object.keys(PERMISSION_GROUPS)));
    setName("");
    setEmail("");
    setUsername("");
    setPassword(generateSecurePassword());
    setRoleId("");
    setOrganization("");
    setNotes("");
    setCreateLicense(false);
    setTierLabel(LICENSE_TIERS[0].label);
    setMaxDevices(LICENSE_TIERS[0].maxDevices);
    setDurationDays(LICENSE_TIERS[0].durationDays);
    setExpiresAt("");
    setResult(null);
    setShowPassword(false);
    setError("");
    setCopiedField("");
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

  const selectedRole = roles.find((r) => r.id === roleId);
  const roleName = selectedRole?.name ?? "";
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
  const { seatCost, accessCost, grandTotal: roleTotal } = calculateCosts(roleName, effectiveCount);

  const tier = LICENSE_TIERS.find((t) => t.label === tierLabel) || LICENSE_TIERS[0];
  const licenseValue = tier.price;

  function handleTierChange(newLabel: string) {
    const newTier = LICENSE_TIERS.find((t) => t.label === newLabel) || LICENSE_TIERS[0];
    setTierLabel(newLabel);
    setMaxDevices(newTier.maxDevices);
    setDurationDays(newTier.durationDays);
    if (!expiresAt) {
      const d = new Date();
      d.setDate(d.getDate() + newTier.durationDays);
      setExpiresAt(d.toISOString().split("T")[0]);
    }
  }

  const licenceExpiryDate = useMemo(() => {
    if (expiresAt) return new Date(expiresAt);
    const d = new Date();
    d.setDate(d.getDate() + durationDays);
    return d;
  }, [expiresAt, durationDays]);

  const totalCost = roleTotal + (createLicense ? licenseValue : 0);
  const hasLicenseCost = createLicense && licenseValue > 0;

  const valid = name.trim() && email.trim() && roleId && (!createLicense || organization.trim());

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
  const customCoverage = counts.total > 0 ? Math.round((effectiveCount / counts.total) * 100) : 0;

  const hasPermissionChanges = customChangeCount > 0;

  const handleCopy = useCallback((text: string, field: string) => {
    copyToClipboard(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(""), 2000);
  }, []);

  function copyCredentials() {
    const text = buildFullLoginInfo(
      result?.member.email || email,
      username,
      effectivePassword,
      result?.licenseKey
    );
    handleCopy(text, "all");
  }

  async function handleCreate() {
    if (!valid) return;
    setError("");
    setLoading(true);
    try {
      if (createLicense) {
        const res = await fetch(API_ROUTES.TEAM_MEMBERS.CREATE_WITH_LICENSE, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name.trim(),
            email: email.trim(),
            roleId,
            organization: organization.trim(),
            plan: tier.label,
            maxDevices,
            expiresAt: expiresAt || undefined,
            notes,
            sendInvite: false,
            tempPassword: password,
          }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          setError(data.error || "Failed to create team member with license");
          return;
        }
        setResult({
          member: data.data.member || data.data,
          licenseKey: data.data.license?.key,
          tempPassword: data.data.tempPassword || "",
        });
      } else {
        const res = await fetch(API_ROUTES.TEAM_MEMBERS.CREATE, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: name.trim(), email: email.trim(), roleId, tempPassword: password }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Failed to create team member");
          return;
        }
        setResult({
          member: data.data,
          tempPassword: data.tempPassword || "",
        });
      }

      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  async function handleRegeneratePassword() {
    if (!result?.member?.id) {
      setPassword(generateSecurePassword());
      return;
    }
    setRegeneratingPassword(true);
    try {
      const res = await fetch("/api/team-members/temp-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: result.member.id }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error("Failed");
      setResult((prev) => prev ? { ...prev, tempPassword: data.tempPassword } : prev);
    } catch {
      setError("Failed to regenerate password");
    } finally {
      setRegeneratingPassword(false);
    }
  }

  function handleClose() {
    setOpen(false);
    setResult(null);
    setName("");
    setEmail("");
    setUsername("");
    setPassword(generateSecurePassword());
    setRoleId("");
    setOrganization("");
    setNotes("");
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
        onClose={handleClose}
        title={result ? "Login Credentials" : "Invite Team Member"}
        description={
          result
            ? "Share credentials securely with the new team member."
            : "Create a new team member with direct login credentials."
        }
        size="lg"
        footer={
          !result ? (
            <>
              <ActionButton variant="secondary" onClick={handleClose}>
                Cancel
              </ActionButton>
              <ActionButton variant="primary" onClick={handleCreate} disabled={loading || !valid}>
                {loading ? "Creating..." : createLicense ? "Create Member & License" : "Create Member"}
              </ActionButton>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <ActionButton variant="secondary" onClick={() => { setResult(null); }}>
                Back
              </ActionButton>
              <ActionButton variant="primary" onClick={handleClose}>
                Done
              </ActionButton>
            </div>
          )
        }
      >
        {!result ? (
          <div className="space-y-6">
            {error && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>
            )}

            <div className="rounded-xl border border-purple-500/20 bg-purple-500/[0.03] p-5">
              <div className="mb-3 flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-500/20 text-xs font-bold text-purple-400">
                  <LogIn size={12} />
                </span>
                <h4 className="text-sm font-semibold text-zinc-100">Login Credentials</h4>
                {!isAdmin && (
                  <span className="ml-auto rounded-full bg-zinc-700/50 px-2 py-0.5 text-[9px] text-zinc-500">
                    Admin only
                  </span>
                )}
              </div>

              {isAdmin ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-zinc-400">Email</label>
                      <div className="relative">
                        <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="e.g. jane@example.com"
                          className="w-full rounded-xl border border-zinc-700 bg-zinc-800 py-2.5 pl-9 pr-3 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-purple-500" />
                      </div>
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-zinc-400">Username (optional)</label>
                      <div className="relative">
                        <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                        <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="e.g. jsmith"
                          className="w-full rounded-xl border border-zinc-700 bg-zinc-800 py-2.5 pl-9 pr-3 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-purple-500" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-zinc-400">Password</label>
                    <div className="relative">
                      <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Secure password"
                        className="w-full rounded-xl border border-zinc-700 bg-zinc-800 py-2.5 pl-9 pr-24 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-purple-500"
                      />
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                        <button onClick={() => setShowPassword(!showPassword)}
                          className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-700">
                          {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                        <button onClick={() => { setPassword(generateSecurePassword()); }}
                          className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-700" title="Generate secure password">
                          <RefreshCw size={14} />
                        </button>
                      </div>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <button onClick={() => setPassword(generateSecurePassword(12))}
                        className="rounded-lg border border-zinc-700 bg-zinc-800/50 px-2.5 py-1 text-[10px] text-zinc-400 hover:bg-zinc-700">
                        12-char
                      </button>
                      <button onClick={() => setPassword(generateSecurePassword(16))}
                        className="rounded-lg border border-zinc-700 bg-zinc-800/50 px-2.5 py-1 text-[10px] text-zinc-400 hover:bg-zinc-700">
                        16-char (default)
                      </button>
                      <button onClick={() => setPassword(generateSecurePassword(24))}
                        className="rounded-lg border border-zinc-700 bg-zinc-800/50 px-2.5 py-1 text-[10px] text-zinc-400 hover:bg-zinc-700">
                        24-char
                      </button>
                      <button onClick={() => setPassword(generateSecurePassword(32))}
                        className="rounded-lg border border-zinc-700 bg-zinc-800/50 px-2.5 py-1 text-[10px] text-zinc-400 hover:bg-zinc-700">
                        32-char
                      </button>
                    </div>
                  </div>

                  {password && (
                    <div className="rounded-xl border border-purple-500/10 bg-purple-500/5 p-3">
                      <p className="mb-2 text-[10px] font-medium text-purple-300">Credential Preview</p>
                      <div className="space-y-1.5 font-mono text-xs">
                        <div className="flex items-center gap-2">
                          <span className="w-20 text-zinc-500">Email:</span>
                          <span className="text-zinc-200">{email || "\u2014"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-20 text-zinc-500">Username:</span>
                          <span className="text-zinc-200">{username || "\u2014"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-20 text-zinc-500">Password:</span>
                          <span className="text-zinc-200">{showPassword ? effectivePassword : "\u2022".repeat(effectivePassword.length || 8)}</span>
                          <button onClick={() => handleCopy(effectivePassword, "password")}
                            className="ml-auto rounded-lg bg-purple-500/10 p-1 text-purple-400 hover:bg-purple-500/20">
                            {copiedField === "password" ? <CheckCircle size={10} /> : <Copy size={10} />}
                          </button>
                        </div>
                        {createLicense && (
                          <div className="flex items-center gap-2">
                            <span className="w-20 text-zinc-500">License:</span>
                            <span className="text-emerald-400">Will be generated</span>
                          </div>
                        )}
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-2 border-t border-purple-500/10 pt-2">
                        <button onClick={() => handleCopy(effectivePassword, "password")}
                          className="rounded-lg bg-purple-500/10 px-2.5 py-1 text-[10px] font-medium text-purple-400 hover:bg-purple-500/20">
                          {copiedField === "password" ? <CheckCircle size={10} className="mr-1 inline" /> : <Copy size={10} className="mr-1 inline" />}
                          Copy Password
                        </button>
                        <button onClick={() => handleCopy(email || "", "email")}
                          className="rounded-lg bg-blue-500/10 px-2.5 py-1 text-[10px] font-medium text-blue-400 hover:bg-blue-500/20">
                          {copiedField === "email" ? <CheckCircle size={10} className="mr-1 inline" /> : <Copy size={10} className="mr-1 inline" />}
                          Copy Email
                        </button>
                        <button onClick={copyCredentials}
                          className="rounded-lg bg-emerald-500/10 px-2.5 py-1 text-[10px] font-medium text-emerald-400 hover:bg-emerald-500/20">
                          {copiedField === "all" ? <CheckCircle size={10} className="mr-1 inline" /> : <Copy size={10} className="mr-1 inline" />}
                          Copy All
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center rounded-lg border border-dashed border-zinc-700 bg-zinc-800/20 px-4 py-6">
                  <Lock size={14} className="mr-2 text-zinc-500" />
                  <p className="text-xs text-zinc-500">Login credentials management is available for Owner and Super Admin roles only.</p>
                </div>
              )}
            </div>

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
                    <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Jane Smith"
                      className="w-full rounded-xl border border-zinc-700 bg-zinc-800 py-2.5 pl-9 pr-3 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-blue-500" />
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
              <div className="mb-3 flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-700 text-xs font-bold text-zinc-200">2</span>
                <h4 className="text-sm font-semibold text-zinc-100">Role Assignment</h4>
              </div>

              {rolesLoading ? (
                <div className="text-sm text-zinc-500">Loading roles...</div>
              ) : roles.length === 0 ? (
                <div className="text-sm text-zinc-500">No roles available.</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {roles.map((role) => {
                    const isSelected = roleId === role.id;
                    const upper = role.name.toUpperCase().replace(/\s+/g, "_");
                    const rp = (rolePricing ?? FALLBACK_PRICES)[upper] ?? getRolePrice(role.name);
                    const rc = getPermissionCounts(role.name);
                    return (
                      <button key={role.id} type="button"
                        onClick={() => { setRoleId(role.id); setShowPermissions(false); setCustomEnabled(new Set()); }}
                        className={`flex items-center gap-3 rounded-xl border p-3.5 text-left transition-all ${
                          isSelected ? "border-blue-500/50 bg-blue-500/10" : "border-zinc-800 bg-zinc-900 hover:border-zinc-700"
                        }`}>
                        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${isSelected ? "bg-blue-500/20" : "bg-zinc-800"}`}>
                          <Shield size={16} className={isSelected ? "text-blue-400" : "text-zinc-500"} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className={`text-sm font-medium truncate ${isSelected ? "text-blue-300" : "text-zinc-200"}`}>{role.name}</div>
                          {rp > 0 && <div className="text-[10px] text-zinc-500 mt-0.5">${rp.toLocaleString()}/mo &middot; {rc.coveragePercent}% coverage</div>}
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-xs font-semibold text-zinc-400">{rc.default}/{rc.total}</div>
                          <div className="text-[9px] text-zinc-600">perms</div>
                        </div>
                        {isSelected && <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-500"><Check size={12} className="text-white" /></div>}
                      </button>
                    );
                  })}
                </div>
              )}

              {selectedRole && (
                <div className="mt-3 rounded-lg border border-blue-500/20 bg-blue-500/5 p-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-3">
                      <p className="text-xs text-blue-300"><span className="font-medium">Selected Role:</span> {selectedRole.name}</p>
                      <span className="text-[10px] text-zinc-500">Level {roleLevel}/100</span>
                    </div>
                    <button type="button" onClick={() => setShowPermissions(!showPermissions)}
                      className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300">
                      {showPermissions ? <EyeOff size={12} /> : <Eye size={12} />}
                      {showPermissions ? "Hide Permissions" : `Manage Permissions (${counts.default}/${counts.total} default)`}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {selectedRole && showPermissions && (
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
                <div className="mb-3 flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-500/20 text-xs font-bold text-purple-400">+</span>
                  <h4 className="text-sm font-semibold text-zinc-100">
                    Permission Management
                    {hasPermissionChanges && <span className="ml-2 text-[10px] text-yellow-400 font-normal">({customChangeCount} custom change{customChangeCount > 1 ? "s" : ""})</span>}
                  </h4>
                </div>
                <div className="mb-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div className="rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2">
                    <span className="text-[9px] text-zinc-500">Granted</span>
                    <p className="text-sm font-semibold text-emerald-400">{effectiveCount}/{counts.total}</p>
                  </div>
                  <div className="rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2">
                    <span className="text-[9px] text-zinc-500">Restricted</span>
                    <p className="text-sm font-semibold text-red-400">{counts.total - effectiveCount}/{counts.total}</p>
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
                <div className="mb-4">
                  <div className="flex items-center justify-between text-[10px] text-zinc-500 mb-1">
                    <span>Permission Coverage</span><span>{customCoverage}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-700">
                    <div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: `${customCoverage}%` }} />
                  </div>
                </div>
                <div className="mb-4 flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                    <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search permissions..."
                      className="w-full rounded-lg border border-zinc-700 bg-zinc-800 py-2 pl-9 pr-3 text-xs text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-blue-500" />
                  </div>
                  <div className="flex gap-2">
                    {(["all", "granted", "restricted"] as const).map((mode) => (
                      <button key={mode} type="button" onClick={() => setViewMode(mode)}
                        className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                          viewMode === mode ? "border-blue-500/50 bg-blue-500/20 text-blue-300" : "border-zinc-700 bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                        }`}>{mode === "all" ? "All" : mode === "granted" ? "Granted" : "Restricted"}</button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
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
                        <button type="button" onClick={() => toggleCategory(cat.name)} className="flex w-full items-center gap-2 px-3 py-2.5 text-left">
                          <Icon size={12} className="shrink-0 text-zinc-400" />
                          <span className="flex-1 text-xs font-medium text-zinc-200">{cat.name}</span>
                          <span className="text-[10px] text-zinc-500">{catGranted}/{cat.total}</span>
                          <div className="h-1.5 w-12 overflow-hidden rounded-full bg-zinc-700">
                            <div className="h-full rounded-full bg-blue-500" style={{ width: `${cat.total > 0 ? (catGranted / cat.total) * 100 : 0}%` }} />
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
                                <label key={perm} className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-zinc-800 cursor-pointer">
                                  <input type="checkbox" checked={effectivelyGranted} onChange={() => togglePermission(perm)}
                                    className="h-3.5 w-3.5 rounded border-zinc-600 bg-zinc-700 text-blue-500 focus:ring-blue-500/20" />
                                  <span className={`flex-1 text-xs ${effectivelyGranted ? "text-zinc-200" : "text-zinc-500"}`}>{perm}</span>
                                  {isCustomEnabled && !isDefault && <span className="rounded bg-yellow-500/10 px-1.5 py-0.5 text-[9px] text-yellow-400">added</span>}
                                  {isCustomEnabled && isDefault && <span className="rounded bg-red-500/10 px-1.5 py-0.5 text-[9px] text-red-400">removed</span>}
                                  {!isCustomEnabled && !isDefault && <span className="rounded bg-zinc-700/50 px-1.5 py-0.5 text-[9px] text-zinc-500">restricted</span>}
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

            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.03] p-5">
              <div className="mb-3 flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20 text-xs font-bold text-emerald-400">3</span>
                <h4 className="text-sm font-semibold text-zinc-100">License (optional)</h4>
              </div>
              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-zinc-700 bg-zinc-800/50 p-3">
                <input type="checkbox" checked={createLicense} onChange={(e) => {
                  setCreateLicense(e.target.checked);
                  if (e.target.checked && !expiresAt) {
                    const d = new Date();
                    d.setDate(d.getDate() + LICENSE_TIERS[0].durationDays);
                    setExpiresAt(d.toISOString().split("T")[0]);
                  }
                }}
                  className="h-4 w-4 rounded border-zinc-600 bg-zinc-700 text-emerald-500 focus:ring-emerald-500/20" />
                <div>
                  <p className="text-sm font-medium text-zinc-200">Create license for this member</p>
                  <p className="text-xs text-zinc-500">Generate a license key, assign it, and enable product access.</p>
                </div>
              </label>
              {createLicense && (
                <div className="mt-4 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-zinc-400">Organization</label>
                      <div className="relative">
                        <Building2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                        <input value={organization} onChange={(e) => setOrganization(e.target.value)} placeholder="Acme Inc"
                          className="w-full rounded-xl border border-zinc-700 bg-zinc-800 py-2.5 pl-9 pr-3 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-emerald-500" />
                      </div>
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-zinc-400">License Tier</label>
                      <div className="relative">
                        <Key size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                        <select value={tierLabel} onChange={(e) => handleTierChange(e.target.value)}
                          className="w-full rounded-xl border border-zinc-700 bg-zinc-800 py-2.5 pl-9 pr-3 text-sm text-zinc-100 outline-none focus:border-emerald-500">
                          {LICENSE_TIERS.map((t) => (<option key={t.label} value={t.label}>{t.label} &mdash; ${t.price}</option>))}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-zinc-400">Max Devices</label>
                      <input type="number" value={maxDevices} onChange={(e) => setMaxDevices(Number(e.target.value))}
                        className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-emerald-500" />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-zinc-400">Duration (days)</label>
                      <input type="number" value={durationDays} onChange={(e) => {
                        const days = Number(e.target.value); setDurationDays(days);
                        const d = new Date(); d.setDate(d.getDate() + days); setExpiresAt(d.toISOString().split("T")[0]);
                      }}
                        className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-emerald-500" />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="mb-1.5 block text-xs font-medium text-zinc-400">Expiry Date</label>
                      <div className="relative">
                        <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                        <input type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)}
                          className="w-full rounded-xl border border-zinc-700 bg-zinc-800 py-2.5 pl-9 pr-3 text-sm text-zinc-100 outline-none focus:border-emerald-500" />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
              <div className="mb-3 flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-700 text-xs font-bold text-zinc-200">4</span>
                <h4 className="text-sm font-semibold text-zinc-100">Notes</h4>
              </div>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Additional notes..."
                rows={2}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-2.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-blue-500" />
            </div>

            {selectedRole && (
              <div className="rounded-xl border border-green-500/20 bg-green-500/[0.03] p-5">
                <div className="mb-3 flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-green-500/20 text-xs font-bold text-green-400">
                    <TrendingUp size={12} />
                  </span>
                  <h4 className="flex items-center gap-1.5 text-sm font-semibold text-green-300">
                    Impact Analysis
                  </h4>
                </div>
                <div className="space-y-4">
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

                  <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 px-4 py-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <div>
                        <span className="text-[10px] font-medium text-blue-400">Access Cost</span>
                        <p className="text-xs text-blue-300/70">{effectiveCount} permissions &times; ${ACCESS_COST_PER_PERMISSION.toFixed(2)} = ${accessCost.toFixed(2)}</p>
                      </div>
                      <span className="text-sm font-semibold text-blue-300">${accessCost.toFixed(2)}</span>
                    </div>
                  </div>

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
                      {createLicense && (
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-zinc-400">License ({tier.label})</span>
                          <span className="text-zinc-200">${licenseValue.toLocaleString()}</span>
                        </div>
                      )}
                      <div className="border-t border-zinc-700 pt-2">
                        <div className="flex items-center justify-between text-sm font-bold">
                          <span className="text-green-400">Grand Total</span>
                          <span className="text-green-400">${totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/mo</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg border border-zinc-700 bg-zinc-800/30 px-3 py-2.5">
                      <span className="flex items-center gap-1 text-[10px] text-zinc-500"><Server size={10} /> Resource Impact</span>
                      <p className="mt-1 text-sm font-medium text-zinc-200">{createLicense ? `${tier.label} license` : "No license"}</p>
                      <p className="text-[10px] text-zinc-500">{createLicense ? `${maxDevices} device limit` : "System access only"}</p>
                    </div>
                    <div className="rounded-lg border border-zinc-700 bg-zinc-800/30 px-3 py-2.5">
                      <span className="flex items-center gap-1 text-[10px] text-zinc-500"><TrendingUp size={10} /> Revenue Impact</span>
                      <p className="mt-1 text-sm font-medium text-emerald-400">+${(createLicense ? licenseValue : 0).toLocaleString()}</p>
                      <p className="text-[10px] text-zinc-500">{createLicense ? "License revenue generated" : "No direct revenue"}</p>
                    </div>
                  </div>

                  <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
                    <div className="mb-3 flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-yellow-400" />
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Audit Preview</h4>
                    </div>
                    <div className="space-y-2 font-mono text-xs">
                      <div className="flex items-center gap-2 rounded-lg bg-zinc-800/40 px-3 py-2">
                        <span className="w-28 text-zinc-500">Action Type</span>
                        <span className="rounded bg-yellow-500/10 px-2 py-0.5 text-yellow-400">TEAM_MEMBER_CREATED</span>
                      </div>
                      <div className="flex items-center gap-2 px-3">
                        <span className="w-28 text-zinc-500">Actor</span>
                        <span className="text-blue-400">{currentUserRole || "Current User"}</span>
                      </div>
                      <div className="flex items-center gap-2 px-3">
                        <span className="w-28 text-zinc-500">Target User</span>
                        <span className="text-zinc-300">{name || "\u2014"} ({email || "\u2014"})</span>
                      </div>
                      <div className="flex items-center gap-2 px-3">
                        <span className="w-28 text-zinc-500">Role Assignment</span>
                        <span className="text-zinc-300">{selectedRole.name} (Level {roleLevel}/100)</span>
                      </div>
                      <div className="flex items-center gap-2 px-3">
                        <span className="w-28 text-zinc-500">Permissions</span>
                        <span className="text-zinc-300">{effectiveCount}/{counts.total} ({customCoverage}% coverage)</span>
                      </div>
                      {hasPermissionChanges && (
                        <div className="flex items-center gap-2 px-3">
                          <span className="w-28 text-zinc-500">Custom Changes</span>
                          <span className="text-yellow-400">
                            {customChanges.length > 0 && <span>+{customChanges.length} added</span>}
                            {customChanges.length > 0 && customRemovals.length > 0 && <span> &middot; </span>}
                            {customRemovals.length > 0 && <span>-{customRemovals.length} removed</span>}
                            {customChanges.length === 0 && customRemovals.length === 0 && <span className="text-zinc-500">None</span>}
                          </span>
                        </div>
                      )}
                      {createLicense && (
                        <div className="flex items-center gap-2 px-3">
                          <span className="w-28 text-zinc-500">License Assignment</span>
                          <span className="text-emerald-400">{tier.label} &middot; {maxDevices} devices &middot; ${licenseValue.toLocaleString()}</span>
                        </div>
                      )}
                      {isAdmin && (
                        <div className="flex items-center gap-2 px-3">
                          <span className="w-28 text-zinc-500">Credential</span>
                          <span className="text-zinc-300">Password {password ? `generated (${password.length} chars)` : "not set"}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 px-3">
                        <span className="w-28 text-zinc-500">Security Impact</span>
                        <span className="text-amber-400">
                          {createLicense ? "New license + credentials" : "New account"}
                          {hasPermissionChanges && " + custom permissions"}
                          {isAdmin ? " (admin-managed)" : ""}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 px-3">
                        <span className="w-28 text-zinc-500">Resource Impact</span>
                        <span className="text-zinc-300">{createLicense ? "1 seat + 1 license" : "1 seat added"}</span>
                      </div>
                      <div className="flex items-center gap-2 px-3">
                        <span className="w-28 text-zinc-500">Revenue Impact</span>
                        <span className="text-emerald-400">+${totalCost.toFixed(2)}/mo</span>
                      </div>
                    </div>
                  </div>

                  {createLicense && (
                    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
                      <div className="mb-3 flex items-center gap-2">
                        <FileText size={12} className="text-zinc-500" />
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Invoice Preview</h4>
                      </div>
                      <div className="space-y-2 text-xs">
                        <div className="flex items-center justify-between rounded-lg bg-zinc-800/40 px-3 py-2">
                          <span className="text-zinc-400">License Cost &mdash; {tier.label}</span>
                          <span className="text-zinc-200">${licenseValue.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center justify-between px-3">
                          <span className="text-zinc-400">Team Member Setup</span>
                          <span className="text-zinc-200">${seatCost.toLocaleString()}/mo</span>
                        </div>
                        <div className="flex items-center justify-between px-3">
                          <span className="text-zinc-400">Access Configuration</span>
                          <span className="text-zinc-200">${accessCost.toFixed(2)}/mo</span>
                        </div>
                        <div className="flex items-center justify-between border-t border-zinc-700 px-3 pt-2 font-medium">
                          <span className="text-zinc-300">Final Total</span>
                          <span className="text-green-400">
                            ${totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                        <p className="text-[10px] text-zinc-500 px-3">Auto-generated invoice. Category: Team Member - License. Due in 30 days.</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-5">
            <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-b from-emerald-950/20 to-zinc-900 p-5">
              <div className="mb-4 flex items-center gap-2">
                <CheckCircle size={16} className="text-emerald-400" />
                <h4 className="text-sm font-semibold text-emerald-300">Login Credentials</h4>
              </div>
              <div className="space-y-3">
                <div className="rounded-xl border border-zinc-700 bg-zinc-800/80 p-3">
                  <p className="text-[10px] text-zinc-500">Email</p>
                  <p className="text-sm font-medium text-zinc-200">{result?.member?.email ?? ""}</p>
                </div>
                {username && (
                  <div className="rounded-xl border border-zinc-700 bg-zinc-800/80 p-3">
                    <p className="text-[10px] text-zinc-500">Username</p>
                    <p className="text-sm font-medium text-zinc-200">{username}</p>
                  </div>
                )}
                <div className="rounded-xl border border-zinc-700 bg-zinc-800/80 p-3">
                  <p className="text-[10px] text-zinc-500">Password</p>
                  <div className="flex items-center gap-2">
                    <input readOnly type={showPassword ? "text" : "password"}
                      value={effectivePassword}
                      className="flex-1 bg-transparent text-sm font-mono text-zinc-200 outline-none" />
                    <button onClick={() => setShowPassword(!showPassword)}
                      className="rounded-lg bg-zinc-700 p-1.5 text-zinc-400 hover:bg-zinc-600">
                      {showPassword ? <EyeOff size={12} /> : <Eye size={12} />}
                    </button>
                    <button onClick={() => handleCopy(effectivePassword, "result-password")}
                      className="rounded-lg bg-blue-500/10 p-1.5 text-blue-400 hover:bg-blue-500/20">
                      {copiedField === "result-password" ? <CheckCircle size={12} /> : <Copy size={12} />}
                    </button>
                  </div>
                </div>
                {result.licenseKey && (
                  <div className="rounded-xl border border-zinc-700 bg-zinc-800/80 p-3">
                    <p className="text-[10px] text-zinc-500">License Key</p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 text-sm font-mono text-zinc-200">{result.licenseKey}</code>
                      <button onClick={() => handleCopy(result.licenseKey ?? "", "result-license")}
                        className="rounded-lg bg-blue-500/10 p-1.5 text-blue-400 hover:bg-blue-500/20">
                        {copiedField === "result-license" ? <CheckCircle size={12} /> : <Copy size={12} />}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <button onClick={() => handleCopy(effectivePassword, "result-password")}
                  className="rounded-lg bg-blue-500/10 px-3 py-1.5 text-xs font-medium text-blue-400 hover:bg-blue-500/20">
                  {copiedField === "result-password" ? <CheckCircle size={12} className="mr-1 inline" /> : <Copy size={12} className="mr-1 inline" />}
                  Copy Password
                </button>
                {result.licenseKey && (
                  <button onClick={() => handleCopy(result.licenseKey ?? "", "result-license")}
                    className="rounded-lg bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-400 hover:bg-emerald-500/20">
                    {copiedField === "result-license" ? <CheckCircle size={12} className="mr-1 inline" /> : <Key size={12} className="mr-1 inline" />}
                    Copy License Key
                  </button>
                )}
                <button onClick={copyCredentials}
                  className="rounded-lg bg-purple-500/10 px-3 py-1.5 text-xs font-medium text-purple-400 hover:bg-purple-500/20">
                  {copiedField === "all" ? <CheckCircle size={12} className="mr-1 inline" /> : <Clipboard size={12} className="mr-1 inline" />}
                  Copy All Credentials
                </button>
                <button onClick={() => {
                  const heading = "Login Credentials\n" + "=".repeat(18) + "\n";
                  handleCopy(heading + buildFullLoginInfo(
                    result?.member?.email ?? "", username, effectivePassword, result?.licenseKey
                  ), "result-full");
                }}
                  className="rounded-lg bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-400 hover:bg-amber-500/20">
                  {copiedField === "result-full" ? <CheckCircle size={12} className="mr-1 inline" /> : <FileText size={12} className="mr-1 inline" />}
                  Copy Full Login Info
                </button>
                <button onClick={() => { if (!result?.member?.id) { setPassword(generateSecurePassword()); return; } handleRegeneratePassword(); }} disabled={regeneratingPassword}
                  className="rounded-lg bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-400 hover:bg-amber-500/20 disabled:opacity-50">
                  <RefreshCw size={12} className={`mr-1 inline ${regeneratingPassword ? "animate-spin" : ""}`} />
                  {regeneratingPassword ? "Regenerating..." : "Regenerate Password"}
                </button>
              </div>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">Member Summary</h4>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between"><span className="text-zinc-500">Name</span><span className="text-zinc-200">{result?.member?.name ?? "\u2014"}</span></div>
                <div className="flex justify-between"><span className="text-zinc-500">Email</span><span className="text-zinc-200">{result?.member?.email ?? "\u2014"}</span></div>
                <div className="flex justify-between"><span className="text-zinc-500">Role</span><span className="text-zinc-200">{selectedRole?.name || "\u2014"}</span></div>
                <div className="flex justify-between"><span className="text-zinc-500">License</span><span className="text-zinc-200">{result?.licenseKey ? "Active" : "None"}</span></div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
