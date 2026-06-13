// Small display helpers shared across pages. Pure functions, no side effects.

/** 0.611 -> "61%" */
export function pct(p: number | null | undefined): string {
  if (p == null) return '—';
  return `${Math.round(p * 100)}%`;
}

/** Which side the model favors, in plain words. */
export function favored(pHome: number, home: string, away: string): string {
  if (Math.abs(pHome - 0.5) < 0.02) return 'too close to call';
  return pHome > 0.5 ? home : away;
}

/**
 * Format a UTC ISO start time as a readable US Eastern clock time.
 * MLB schedules are most familiar in ET; this keeps it simple and consistent.
 */
export function firstPitch(iso: string | null): string {
  if (!iso) return 'TBD';
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString('en-US', {
      timeZone: 'America/New_York',
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short',
    });
  } catch {
    return 'TBD';
  }
}

/** "2026-06-13" -> "Friday, June 13, 2026" */
export function longDate(date: string): string {
  // Parse as local noon to avoid timezone slippage on the date itself.
  const d = new Date(`${date}T12:00:00`);
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
