/**
 * Hash router (ARCHITECTURE.md §5.2): every view's full state lives in the
 * URL — filters included — so any screen is shareable by link. No rewrite
 * rules needed on Pages.
 */
import { SLUG_RE } from '../data/atlas';
import type { LensFilters } from '../data/subgraph';

export type Route =
  | { name: 'landing'; symptom?: string; appField?: string }
  | { name: 'concept'; slug: string; at?: string }
  | { name: 'symptom'; id: string }
  | { name: 'moves' }
  | { name: 'applications' }
  | { name: 'atoz'; type?: string; field?: string; status?: string }
  | { name: 'dialects'; query: string }
  | { name: 'lens'; filters: LensFilters; communities: boolean }
  | { name: 'atlas'; communities: boolean; focus?: string }
  | { name: 'compare'; a?: string; b?: string }
  | { name: 'matrix'; filters: LensFilters; order?: string; focus?: string; a?: string; b?: string }
  | { name: 'map'; order?: string; field?: string; focus?: string }
  | { name: 'path'; from?: string; to?: string; strength?: string }
  | { name: 'metrics'; sort?: string; dir?: 'asc' | 'desc' }
  | { name: 'questions' }
  | { name: 'queue'; bridge?: string }
  | {
      name: 'propose';
      from?: string;
      to?: string;
      type?: string;
      strength?: string;
      context?: string;
    }
  | { name: 'walks' }
  | { name: 'walk'; id: string; step?: number }
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
    // af = the applications door's field filter (UI_REDESIGN.md §4.1, M13).
    const appField = params.get('af');
    return {
      name: 'landing',
      ...(symptom ? { symptom } : {}),
      ...(appField ? { appField } : {}),
    };
  }
  if (segs[0] === 'c' && segs.length === 2 && SLUG_RE.test(segs[1]!)) {
    const at = params.get('at');
    return { name: 'concept', slug: segs[1]!, ...(at ? { at } : {}) };
  }
  if (segs[0] === 's' && segs.length === 2 && SLUG_RE.test(segs[1]!)) {
    return { name: 'symptom', id: segs[1]! };
  }
  if (segs[0] === 'moves' && segs.length === 1) return { name: 'moves' };
  if (segs[0] === 'applications' && segs.length === 1) return { name: 'applications' };
  if (segs[0] === 'index' && segs.length === 1) {
    // Facet chips (UI_REDESIGN.md §4.8, M14): AND-combining, state in URL.
    const type = params.get('type');
    const field = params.get('field');
    const status = params.get('status');
    return {
      name: 'atoz',
      ...(type ? { type } : {}),
      ...(field ? { field } : {}),
      ...(status ? { status } : {}),
    };
  }
  if (segs[0] === 'atlas' && segs.length === 1) {
    const focus = params.get('focus');
    return {
      name: 'atlas',
      communities: params.get('communities') === '1',
      ...(focus ? { focus } : {}),
    };
  }
  if (segs[0] === 'compare' && segs.length <= 3) {
    const [, a, b] = segs;
    if ((a && !SLUG_RE.test(a)) || (b && !SLUG_RE.test(b))) {
      return { name: 'notfound', path: raw };
    }
    return { name: 'compare', ...(a ? { a } : {}), ...(b ? { b } : {}) };
  }
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
  if (segs[0] === 'matrix' && segs.length === 1) {
    const filters: LensFilters = {};
    const edge = params.get('edge');
    const type = params.get('type');
    const field = params.get('field');
    const strength = params.get('strength');
    if (edge) filters.edge = edge;
    if (type) filters.type = type;
    if (field) filters.field = field;
    if (strength) filters.strength = strength;
    const order = params.get('order');
    const focus = params.get('focus');
    const a = params.get('a');
    const b = params.get('b');
    return {
      name: 'matrix',
      filters,
      ...(order ? { order } : {}),
      ...(focus ? { focus } : {}),
      ...(a ? { a } : {}),
      ...(b ? { b } : {}),
    };
  }
  if (segs[0] === 'map' && segs.length === 1) {
    const order = params.get('order');
    const field = params.get('field');
    const focus = params.get('focus');
    return {
      name: 'map',
      ...(order ? { order } : {}),
      ...(field ? { field } : {}),
      ...(focus ? { focus } : {}),
    };
  }
  if (segs[0] === 'questions' && segs.length === 1) return { name: 'questions' };
  if (segs[0] === 'queue' && segs.length === 1) {
    const bridge = params.get('bridge');
    return { name: 'queue', ...(bridge ? { bridge } : {}) };
  }
  if (segs[0] === 'propose' && segs.length === 1) {
    const from = params.get('from');
    const to = params.get('to');
    const type = params.get('type');
    const strength = params.get('strength');
    const context = params.get('context');
    return {
      name: 'propose',
      ...(from ? { from } : {}),
      ...(to ? { to } : {}),
      ...(type ? { type } : {}),
      ...(strength ? { strength } : {}),
      ...(context ? { context } : {}),
    };
  }
  if (segs[0] === 'walks' && segs.length === 1) return { name: 'walks' };
  if (segs[0] === 'walk' && segs.length === 2 && SLUG_RE.test(segs[1]!)) {
    // Position is 1-based in the URL; anything unparseable means step 1.
    const step = Number(params.get('step'));
    return {
      name: 'walk',
      id: segs[1]!,
      ...(Number.isInteger(step) && step >= 1 ? { step } : {}),
    };
  }
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
