/**
 * Hash router (ARCHITECTURE.md §5.2): every view's full state lives in the
 * URL, so any screen is shareable by link. No rewrite rules needed on Pages.
 */
import { SLUG_RE } from '../data/atlas';

export type Route =
  | { name: 'landing'; symptom?: string }
  | { name: 'concept'; slug: string }
  | { name: 'moves' }
  | { name: 'atoz' }
  | { name: 'notfound'; path: string };

export function parseHash(hash: string): Route {
  const raw = hash.startsWith('#') ? hash.slice(1) : hash;
  const qIndex = raw.indexOf('?');
  const path = qIndex === -1 ? raw : raw.slice(0, qIndex);
  const query = qIndex === -1 ? '' : raw.slice(qIndex + 1);
  const segs = path.split('/').filter((s) => s.length > 0);

  if (segs.length === 0) {
    const symptom = new URLSearchParams(query).get('s');
    return { name: 'landing', ...(symptom ? { symptom } : {}) };
  }
  if (segs[0] === 'c' && segs.length === 2 && SLUG_RE.test(segs[1]!)) {
    return { name: 'concept', slug: segs[1]! };
  }
  if (segs[0] === 'moves' && segs.length === 1) return { name: 'moves' };
  if (segs[0] === 'index' && segs.length === 1) return { name: 'atoz' };
  return { name: 'notfound', path: raw };
}

/** Subscribe to hash changes and fire once for the current location. */
export function startRouter(onRoute: (route: Route) => void): void {
  const fire = (): void => onRoute(parseHash(window.location.hash));
  window.addEventListener('hashchange', fire);
  fire();
}
