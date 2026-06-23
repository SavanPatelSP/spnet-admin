const marks = new Map<string, number>();

function emit(line: string): void {
  process.stdout.write(line + "\n");
}

export function markStart(label: string): void {
  marks.set(label, performance.now());
}

export function markEnd(label: string, rows?: number): number {
  const start = marks.get(label);
  if (start === undefined) return -1;
  const duration = performance.now() - start;
  marks.delete(label);
  emit(`[PERF] ${label} ${duration.toFixed(1)}ms${rows !== undefined ? ` rows=${rows}` : ""}`);
  return duration;
}
