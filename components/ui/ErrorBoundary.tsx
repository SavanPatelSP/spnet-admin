"use client";

import { Component, useState, type ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-red-900 bg-red-950/20 p-12 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10">
            <AlertTriangle size={32} className="text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-red-400">Something went wrong</h2>
          <p className="mt-2 max-w-md text-sm text-zinc-400">
            {this.state.error?.message || "An unexpected error occurred."}
          </p>
          <button
            onClick={this.handleRetry}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-3 font-medium text-white transition-colors hover:bg-red-500"
          >
            <RefreshCw size={16} />
            Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export function LoadingSkeleton({ rows = 3 }: { rows?: number }) {
  const [randomWidths] = useState(() => Array.from({ length: rows }, () => 70 + Math.random() * 30));
  return (
    <div className="space-y-4">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-6 animate-pulse rounded-xl bg-zinc-800" style={{ width: `${randomWidths[i]}%` }} />
      ))}
    </div>
  );
}
