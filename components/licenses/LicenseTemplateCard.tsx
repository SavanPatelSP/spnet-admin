"use client";

import { ActionButton } from "@/components/ui/ActionButton";
import { FileText, Calendar, Monitor } from "lucide-react";

interface Template {
  id: string;
  name: string;
  description?: string;
  plan: string;
  maxDevices: number;
  durationDays: number;
  isActive: boolean;
}

interface Props {
  template: Template;
  onApply?: (template: Template) => void;
}

export default function LicenseTemplateCard({ template, onApply }: Props) {
  return (
    <div className={`rounded-2xl border p-5 transition-all ${template.isActive ? "border-zinc-700 bg-zinc-900" : "border-zinc-800/50 bg-zinc-900/50 opacity-60"}`}>
      <div className="mb-3 flex items-start justify-between">
        <div className="flex items-center gap-2">
          <FileText size={18} className="text-blue-400" />
          <h3 className="font-semibold">{template.name}</h3>
        </div>
        {!template.isActive && (
          <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-500">Inactive</span>
        )}
      </div>

      {template.description && (
        <p className="mb-3 text-sm text-zinc-400">{template.description}</p>
      )}

      <div className="mb-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-zinc-500">
        <span className="flex items-center gap-1">
          <Monitor size={12} /> Plan: {template.plan}
        </span>
        <span className="flex items-center gap-1">
          <Monitor size={12} /> Max Devices: {template.maxDevices}
        </span>
        <span className="flex items-center gap-1">
          <Calendar size={12} /> Duration: {template.durationDays} days
        </span>
      </div>

      {onApply && template.isActive && (
        <ActionButton onClick={() => onApply(template)} variant="secondary" size="sm">
          Apply
        </ActionButton>
      )}
    </div>
  );
}
