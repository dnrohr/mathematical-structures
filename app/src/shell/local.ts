/**
 * Per-viewer conveniences in localStorage (UI_REDESIGN.md §5, ROADMAP M14):
 * the recently-visited trail and walk resume positions. Conveniences only,
 * never state the app depends on — storage can be absent or throwing
 * (private windows, blocked site data), so every access is guarded and
 * every caller renders correctly with nothing stored.
 */

const PREFIX = 'atlas:';

export function readLocal(key: string): string | null {
  try {
    return localStorage.getItem(PREFIX + key);
  } catch {
    return null;
  }
}

export function writeLocal(key: string, value: string): void {
  try {
    localStorage.setItem(PREFIX + key, value);
  } catch {
    // Convenience only: losing it must never break the page.
  }
}

export function removeLocal(key: string): void {
  try {
    localStorage.removeItem(PREFIX + key);
  } catch {
    // Convenience only.
  }
}

// ---------------------------------------------------------------------------
// The recently-visited trail (concept pages): last TRAIL_LIMIT slugs,
// most recent first, deduplicated.
// ---------------------------------------------------------------------------

const TRAIL_KEY = 'trail';
export const TRAIL_LIMIT = 7;

export function readTrail(): string[] {
  const raw = readLocal(TRAIL_KEY);
  if (raw === null) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((s): s is string => typeof s === 'string') : [];
  } catch {
    return [];
  }
}

export function recordVisit(slug: string): void {
  const trail = [slug, ...readTrail().filter((s) => s !== slug)].slice(0, TRAIL_LIMIT);
  writeLocal(TRAIL_KEY, JSON.stringify(trail));
}

export function clearTrail(): void {
  removeLocal(TRAIL_KEY);
}

// ---------------------------------------------------------------------------
// Walk resume positions: one 1-based step per walk id.
// ---------------------------------------------------------------------------

export function readWalkPosition(id: string): number | null {
  const raw = readLocal(`walk:${id}`);
  const step = raw === null ? NaN : Number(raw);
  return Number.isInteger(step) && step >= 1 ? step : null;
}

export function recordWalkPosition(id: string, step: number): void {
  writeLocal(`walk:${id}`, String(step));
}
