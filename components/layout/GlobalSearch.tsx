"use client";

import { useState, useRef, useEffect } from "react";
import { Search, KeyRound, Users, Crown, Coins, Gem, ClipboardList, ArrowRight } from "lucide-react";
import Link from "next/link";

interface SearchResult {
  licenses: { id: string; key: string; organization: string; plan: string; status: string }[];
  teamMembers: { id: string; name: string; email: string; role: string; status: string }[];
  premium: { id: string; licenseId: string; plan: string; action: string }[];
  coins: { id: string; licenseId: string; balance: number }[];
  gems: { id: string; licenseId: string; balance: number }[];
  auditLogs: { id: string; action: string; description: string | null; createdAt: Date }[];
}

export function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      const t = setTimeout(() => {
        setResults(null);
        setOpen(false);
      }, 0);
      return () => clearTimeout(t);
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const json = await res.json();
        if (json.success) {
          setResults(json.data);
          setOpen(true);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
          inputRef.current && !inputRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  const hasResults = results && (
    results.licenses.length > 0 || results.teamMembers.length > 0 ||
    results.premium.length > 0 || results.coins.length > 0 ||
    results.gems.length > 0 || results.auditLogs.length > 0
  );

  function totalCount(): number {
    if (!results) return 0;
    return results.licenses.length + results.teamMembers.length + results.premium.length +
      results.coins.length + results.gems.length + results.auditLogs.length;
  }

  return (
    <div className="relative">
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => { if (results && totalCount() > 0) setOpen(true); }}
          placeholder="Search... (⌘K)"
          className="w-80 rounded-2xl border border-zinc-700 bg-zinc-900/70 py-2.5 pl-10 pr-4 text-sm outline-none transition-colors focus:border-zinc-500 focus:bg-zinc-900"
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-500 border-t-transparent" />
          </div>
        )}
      </div>

      {open && (
        <div
          ref={dropdownRef}
          className="absolute left-0 right-0 top-full z-50 mt-2 max-h-96 overflow-y-auto rounded-2xl border border-zinc-700 bg-zinc-900 shadow-2xl"
        >
          {!hasResults ? (
            <div className="p-6 text-center text-sm text-zinc-500">
              {query.length >= 2 ? "No results found" : "Type at least 2 characters"}
            </div>
          ) : (
            <div className="p-2">
              {results.licenses.length > 0 && (
                <Section title="Licenses" icon={KeyRound}>
                  {results.licenses.map((l) => (
                    <ResultItem key={l.id} href={`/licenses/${l.id}`} label={`${l.key} — ${l.organization}`} meta={`${l.plan} · ${l.status}`} />
                  ))}
                </Section>
              )}
              {results.teamMembers.length > 0 && (
                <Section title="Team Members" icon={Users}>
                  {results.teamMembers.map((m) => (
                    <ResultItem key={m.id} href={`/settings/team-members`} label={m.name} meta={`${m.email} · ${m.role}`} />
                  ))}
                </Section>
              )}
              {results.premium.length > 0 && (
                <Section title="Premium" icon={Crown}>
                  {results.premium.map((p) => (
                    <ResultItem key={p.id} href={`/premium`} label={`License ${p.licenseId.slice(0, 8)}...`} meta={`${p.plan} · ${p.action}`} />
                  ))}
                </Section>
              )}
              {results.coins.length > 0 && (
                <Section title="Coins" icon={Coins}>
                  {results.coins.map((c) => (
                    <ResultItem key={c.id} href={`/coins`} label={`License ${c.licenseId.slice(0, 8)}...`} meta={`Balance: ${c.balance}`} />
                  ))}
                </Section>
              )}
              {results.gems.length > 0 && (
                <Section title="Gems" icon={Gem}>
                  {results.gems.map((g) => (
                    <ResultItem key={g.id} href={`/gems`} label={`License ${g.licenseId.slice(0, 8)}...`} meta={`Balance: ${g.balance}`} />
                  ))}
                </Section>
              )}
              {results.auditLogs.length > 0 && (
                <Section title="Audit Logs" icon={ClipboardList}>
                  {results.auditLogs.map((a) => (
                    <ResultItem key={a.id} href={`/audit-logs`} label={a.action} meta={a.description || ""} />
                  ))}
                </Section>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Section({ title, icon: Icon, children }: { title: string; icon: React.ComponentType<{ size?: number }>; children: React.ReactNode }) {
  return (
    <div className="mb-1">
      <div className="flex items-center gap-2 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
        <Icon size={14} />
        {title}
      </div>
      {children}
    </div>
  );
}

function ResultItem({ href, label, meta }: { href: string; label: string; meta: string }) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm transition-colors hover:bg-zinc-800"
      onClick={() => { /* keep open */ }}
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-zinc-200">{label}</p>
        <p className="truncate text-xs text-zinc-500">{meta}</p>
      </div>
      <ArrowRight size={14} className="ml-2 shrink-0 text-zinc-600" />
    </Link>
  );
}
