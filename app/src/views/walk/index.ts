/**
 * The walk view (spec §8.3, ROADMAP M9): one guided walk, stepped through.
 * Position lives in the URL (#/walk/<id>?step=<n>, 1-based) so any step is
 * shareable and round-trips, like the M4 view states. Each hop shows the
 * typed claims it rides on — or the bridging note where the walk jumps
 * (the validator guarantees one exists) — and the whole chain renders in
 * the shared path graph preset.
 */
import type { Atlas } from '../../data/atlas';
import type { GraphEdge, GraphNode, GraphWalk } from '../../data/types';
import type { Subgraph } from '../../data/subgraph';
import { readWalkPosition, recordWalkPosition } from '../../shell/local';
import { statusBadge, typeBadge } from '../common/badges';
import { h } from '../common/dom';
import { edgeClaim } from '../common/edge-claim';
import { graphPanel } from '../common/graph-panel';
import { nodeLink } from '../common/node-link';
import type { View } from '../common/view';

export function walkHash(id: string, step: number): string {
  return step > 1 ? `#/walk/${id}?step=${String(step)}` : `#/walk/${id}`;
}

/** The walk's chain: its steps plus every typed edge between consecutive ones. */
function walkSubgraph(atlas: Atlas, walk: GraphWalk): Subgraph {
  const nodes = walk.steps
    .map((step) => atlas.node(step.slug))
    .filter((n): n is GraphNode => n !== undefined);
  const edges: GraphEdge[] = [];
  for (let i = 1; i < walk.steps.length; i++) {
    edges.push(...atlas.edgesBetween(walk.steps[i - 1]!.slug, walk.steps[i]!.slug));
  }
  return { nodes, edges };
}

/** How the walk arrives at step n: the connecting claims, or the flagged jump. */
function arrivalSection(atlas: Atlas, walk: GraphWalk, n: number): HTMLElement | null {
  if (n < 2) return null;
  const prev = walk.steps[n - 2]!.slug;
  const here = walk.steps[n - 1]!;
  const edges = atlas.edgesBetween(prev, here.slug);
  return h(
    'section',
    { class: 'walk-arrival' },
    h('h2', {}, 'How the walk gets here'),
    edges.length > 0
      ? h(
          'ul',
          { class: 'connection-list' },
          edges.map((edge) => edgeClaim(atlas, edge, { from: prev, notes: false })),
        )
      : h(
          'p',
          { class: 'walk-bridge' },
          h('strong', {}, 'The walk jumps here: '),
          `no typed edge connects ${atlas.node(prev)?.canonical_name ?? prev} to this step.`,
        ),
  );
}

export function walkView(atlas: Atlas, id: string, step?: number): View | null {
  const walk = atlas.walk(id);
  if (!walk) return null;
  const total = walk.steps.length;
  // Clamp rather than 404: a stale step link should still land on the walk.
  const n = Math.min(Math.max(step ?? 1, 1), total);
  const current = walk.steps[n - 1]!;
  const node = atlas.node(current.slug)!;

  // Walk resume (UI_REDESIGN.md §5, M14): remember where the reader is —
  // a per-browser convenience. Landing without a step offers the stored
  // position rather than jumping: the URL stays the only state the view
  // depends on. Read the old position BEFORE this visit overwrites it.
  const stored = readWalkPosition(id);
  const resume =
    step === undefined && stored !== null && stored > 1 && stored <= total
      ? h(
          'p',
          { class: 'walk-resume section-hint' },
          h(
            'a',
            { href: walkHash(id, stored), title: 'Position saved in this browser only' },
            `Resume where you left off: step ${String(stored)} →`,
          ),
        )
      : null;
  recordWalkPosition(id, n);

  const positionBar = h(
    'nav',
    { class: 'walk-position', 'aria-label': 'Walk position' },
    n > 1
      ? h('a', { class: 'walk-nav', href: walkHash(id, n - 1), rel: 'prev' }, '← Previous')
      : h('span', { class: 'walk-nav walk-nav-disabled', 'aria-hidden': 'true' }, '← Previous'),
    h('span', { class: 'walk-count' }, `Step ${String(n)} of ${String(total)}`),
    n < total
      ? h('a', { class: 'walk-nav', href: walkHash(id, n + 1), rel: 'next' }, 'Next →')
      : h('span', { class: 'walk-nav walk-nav-disabled', 'aria-hidden': 'true' }, 'Next →'),
  );

  const stops = h(
    'section',
    { class: 'walk-stops-section' },
    h('h2', {}, 'All steps'),
    h(
      'ol',
      { class: 'walk-stops' },
      walk.steps.map((s, i) =>
        h(
          'li',
          i === n - 1 ? { class: 'current' } : {},
          h(
            'a',
            {
              href: walkHash(id, i + 1),
              ...(i === n - 1 ? { 'aria-current': 'step' } : {}),
            },
            atlas.node(s.slug)?.canonical_name ?? s.slug,
          ),
        ),
      ),
    ),
  );

  const el = h(
    'div',
    { class: 'walk content' },
    h('header', { class: 'page-header' }, h('h1', {}, walk.title)),
    h('p', { class: 'tagline' }, walk.summary),
    resume,
    positionBar,
    arrivalSection(atlas, walk, n),
    h(
      'section',
      { class: 'walk-stop' },
      h(
        'p',
        { class: 'badges' },
        typeBadge(atlas, node.node_type),
        statusBadge(atlas, node.status),
      ),
      h('h2', { class: 'walk-stop-name' }, nodeLink(atlas, node.slug, { dot: false })),
      current.note && h('p', { class: 'walk-note' }, current.note),
      h('p', { class: 'summary' }, node.summary),
      h(
        'p',
        { class: 'section-hint' },
        'Open ',
        nodeLink(atlas, node.slug),
        ' for the dialect table, the full claim list, and its neighborhood.',
      ),
    ),
    graphPanel(atlas, walkSubgraph(atlas, walk), {
      preset: 'path',
      label: `The chain of ${walk.title}`,
      focus: [walk.steps[0]!.slug, walk.steps[total - 1]!.slug],
    }),
    stops,
    h('p', { class: 'section-hint' }, h('a', { href: '#/walks' }, '← All walks')),
  );

  return { title: `${walk.title} (step ${String(n)} of ${String(total)})`, el };
}
