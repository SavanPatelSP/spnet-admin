"use client";

import { useState, useRef } from "react";
import { cn } from "@/lib/shared";

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  position?: "top" | "bottom" | "left" | "right";
  className?: string;
}

export function Tooltip({ content, children, position = "top", className }: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const positionClasses = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  };

  const arrowClasses = {
    top: "top-full left-1/2 -translate-x-1/2 border-l-zinc-700 border-r-transparent border-b-transparent border-t-transparent border-4",
    bottom: "bottom-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-t-zinc-700 border-b-transparent border-4",
    left: "left-full top-1/2 -translate-y-1/2 border-t-zinc-700 border-b-transparent border-l-transparent border-r-transparent border-4",
    right: "right-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-l-zinc-700 border-r-transparent border-4",
  };

  function show() {
    clearTimeout(timeoutRef.current);
    setVisible(true);
  }

  function hide() {
    timeoutRef.current = setTimeout(() => setVisible(false), 100);
  }

  return (
    <div className={cn("relative inline-flex", className)} onMouseEnter={show} onMouseLeave={hide} onFocus={show} onBlur={hide}>
      {children}
      {visible && (
        <div
          role="tooltip"
          className={cn(
            "pointer-events-none absolute z-50 whitespace-nowrap rounded-lg bg-zinc-700 px-2.5 py-1.5 text-xs text-zinc-100 shadow-lg",
            positionClasses[position],
          )}
        >
          {content}
          <div className={cn("absolute", arrowClasses[position])} />
        </div>
      )}
    </div>
  );
}
