"use client";

import { useState } from "react";
import { cn } from "@/lib/shared";
import { Loader2 } from "lucide-react";

interface ActionButtonProps {
  onClick: () => Promise<void> | void;
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  className?: string;
  confirmText?: string;
  loading?: boolean;
}

const variantStyles = {
  primary: "bg-blue-600 text-white hover:bg-blue-500 disabled:bg-blue-600/50",
  secondary: "bg-zinc-800 text-zinc-200 hover:bg-zinc-700 disabled:bg-zinc-800/50",
  danger: "bg-red-600 text-white hover:bg-red-500 disabled:bg-red-600/50",
  ghost: "bg-transparent text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 disabled:opacity-30",
};

const sizeStyles = {
  sm: "px-3 py-1.5 text-xs rounded-lg",
  md: "px-4 py-2 text-sm rounded-xl",
  lg: "px-5 py-3 text-base rounded-xl",
};

export function ActionButton({ onClick, children, variant = "primary", size = "md", disabled, className, confirmText, loading: externalLoading }: ActionButtonProps) {
  const [localLoading, setLoading] = useState(false);
  const loading = externalLoading ?? localLoading;
  const [confirming, setConfirming] = useState(false);

  async function handleClick() {
    if (confirmText && !confirming) {
      setConfirming(true);
      setTimeout(() => setConfirming(false), 3000);
      return;
    }
    setConfirming(false);
    setLoading(true);
    try {
      await onClick();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center gap-2 font-medium transition-all",
        variantStyles[variant],
        sizeStyles[size],
        loading && "cursor-not-allowed",
        className,
      )}
    >
      {loading && <Loader2 size={size === "sm" ? 14 : 16} className="animate-spin" />}
      {confirming ? confirmText : children}
    </button>
  );
}
