/**
 * Hash router (ARCHITECTURE.md §5.2): every view's full state lives in the
 * URL — filters included — so any screen is shareable by link. No rewrite
 * rules needed on Pages.
 */
import { SLUG_RE } from '../data/atlas';
import type { LensFilters } from '../data/subgraph';

export type Route =
  | { name: 'landing'; symptom?: string }
  | { name: 'concept'; slug: string }
  | { name: 'symptom'; id: string }
  | { name: 'moves' }
  | { name: 'atoz' }
  | { name: 'dialects'; query: string }
  | { name: 'lens'; filters: LensFilters; communities: boolean }
  | { name: 'path'; from?: string; to?: string; strength?: string }
  | { name: 'metrics'; sort?: string; dir?: 'asc' | 'desc' }
  | { name: 'questions' }
  | { name: 'notfound'; path: string };

export function parseHash(hash: string): Route {
  const raw = hash.startsWith('#') ? hash.slice(1) : hash;
  const qIndex = raw.indexOf('?');
  const path = qIndex === -1 ? raw : raw.slice(0, qIndex);
  const query = qIndex === -1 ? '' : raw.slice(qIndex + 1);
  const params = new URLSearchParams(query);
  const segs = path.split('/').filter((s) => s.length > 0);

  if (segs.length === 0) {
    const symptom = params.get('s');
    return { name: 'landing', ...(symptom ? { symptom } : {}) };
  }
  if (segs[0] === 'c' && segs.length === 2 && SLUG_RE.test(segs[1]!)) {
    return { name: 'concept', slug: segs[1]! };
  }
  if (segs[0] === 's' && segs.length === 2 && SLUG_RE.test(segs[1]!)) {
    return { name: 'symptom', id: segs[1]! };
  }
  if (segs[0] === 'moves' && segs.length === 1) return { name: 'moves' };
  if (segs[0] === 'index' && segs.length === 1) return { name: 'atoz' };
  if (segs[0] === 'dialects' && segs.length === 1) {
    return { name: 'dialects', query: params.get('q') ?? '' };
  }
  if (segs[0] === 'lens' && segs.length === 1) {
    const filters: LensFilters = {};
    const edge = params.get('edge');
    const type = params.get('type');
    const field = params.get('field');
    const strength = params.get('strength');
    if (edge) filters.edge = edge;
    if (type) filters.type = type;
    if (field) filters.field = field;
    if (strength) filters.strength = strength;
    return { name: 'lens', filters, communities: params.get('communities') === '1' };
  }
  if (segs[0] === 'metrics' && segs.length === 1) {
    const sort = params.get('sort');
    const dir = params.get('dir');
    return {
      name: 'metrics',
      ...(sort ? { sort } : {}),
      ...(dir === 'asc' || dir === 'desc' ? { dir } : {}),
    };
  }
  if (segs[0] === 'questions' && segs.length === 1) return { name: 'questions' };
  if (segs[0] === 'path' && segs.length <= 3) {
    const [, from, to] = segs;
    if ((from && !SLUG_RE.test(from)) || (to && !SLUG_RE.test(to))) {
      return { name: 'notfound', path: raw };
    }
    const strength = params.get('strength');
    return {
      name: 'path',
      ...(from ? { from } : {}),
      ...(to ? { to } : {}),
      ...(strength ? { strength } : {}),
    };
  }
  return { name: 'notfound', path: raw };
}

/** Subscribe to hash changes and fire once for the current location. */
export function startRouter(onRoute: (route: Route) => void): void {
  const fire = (): void => onRoute(parseHash(window.location.hash));
  window.addEventListener('hashchange', fire);
  fire();
}

/**
 * Sync in-view filter state to the URL without a navigation: the screen
 * stays shareable (ARCHITECTURE.md §5.2) while typing/adjusting doesn't
 * rebuild the view or spam history. `hash` includes the leading '#'.
 */
export function replaceHash(hash: string): void {
  history.replaceState(null, '', hash);
}
