"use client";

import { useEffect, useCallback, useState, useRef } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/shared";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeStyles = {
  sm: "max-w-md",
  md: "max-w-xl",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
};

export function Modal({ open, onClose, title, description, children, footer, size = "md", className }: ModalProps) {
  const [visible, setVisible] = useState(false);
  const frameIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (open) {
      frameIdRef.current = requestAnimationFrame(() => setVisible(true));
    } else {
      setVisible(false);
    }

    return () => {
      if (frameIdRef.current !== null) {
        cancelAnimationFrame(frameIdRef.current);
      }
    };
  }, [open]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (open) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, handleKeyDown]);

  if (!open) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center transition-colors duration-200",
        visible ? "bg-black/70 backdrop-blur-sm" : "bg-transparent",
      )}
      onClick={onClose}
    >
      <div
        className={cn(
          "flex flex-col w-full rounded-xl border border-zinc-800 bg-zinc-900 shadow-2xl max-h-[90vh] transition-all duration-200",
          visible ? "scale-100 opacity-100" : "scale-95 opacity-0",
          sizeStyles[size],
          className,
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-zinc-800/50 px-6 py-5 shrink-0">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-zinc-100">{title}</h2>
            {description && <p className="mt-0.5 text-sm text-zinc-500">{description}</p>}
          </div>
          <button
            onClick={onClose}
            className="shrink-0 rounded-lg p-1.5 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5 scrollbar-thin">{children}</div>
        {footer && (
          <div className="flex items-center justify-end gap-3 border-t border-zinc-800/50 px-6 py-4 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
