export function calculateTrend(current: number, previous: number): {
  direction: 'up' | 'down' | 'flat';
  percentage: number;
} {
  if (previous === 0) {
    return { direction: current > 0 ? 'up' : 'flat', percentage: current > 0 ? 100 : 0 };
  }
  const change = ((current - previous) / previous) * 100;
  if (Math.abs(change) < 0.1) return { direction: 'flat', percentage: 0 };
  return {
    direction: change > 0 ? 'up' : 'down',
    percentage: Math.abs(Math.round(change * 10) / 10),
  };
}

export function formatTrend(trend: ReturnType<typeof calculateTrend>): string {
  if (trend.direction === 'flat') return 'No change';
  const arrow = trend.direction === 'up' ? '\u2191' : '\u2193';
  return `${arrow} ${trend.percentage}%`;
}
