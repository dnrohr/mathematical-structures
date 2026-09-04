/**
 * The ego-network on a concept page (spec §3.1 item 7, ROADMAP M4): 1 hop
 * by default with an expand-to-2-hops control, capped at ~25 rendered
 * nodes with the rest listed as text ("and N more"), never the full graph.
 * Every graph-visible relationship is also present as text: edges touching
 * this node are the page's Connections/Assumptions sections, and edges
 * between neighbors get their own claim list right below the graph.
 */
import type { Atlas } from '../../data/atlas';
import { egoNetwork } from '../../data/subgraph';
import { h, joinChildren } from '../common/dom';
import { edgeClaim } from '../common/edge-claim';
import { graphPanel } from '../common/graph-panel';
import { nodeLink } from '../common/node-link';

export function egoSection(atlas: Atlas, slug: string): HTMLElement | null {
  if ((egoNetwork(atlas, slug, 1)?.edges.length ?? 0) === 0) return null;

  const body = h('div', { class: 'ego-body' });
  const render = (hops: 1 | 2): void => {
    const ego = egoNetwork(atlas, slug, hops);
    if (!ego) return;
    const betweenNeighbors = ego.edges.filter((e) => e.from !== slug && e.to !== slug);
    const toggle =
      hops === 1
        ? ego.expandable &&
          h(
            'button',
            { type: 'button', class: 'ego-toggle', onclick: () => render(2) },
            'Expand to 2 hops',
          )
        : h(
            'button',
            { type: 'button', class: 'ego-toggle', onclick: () => render(1) },
            'Back to 1 hop',
          );
    const parts = [
      graphPanel(atlas, ego, {
        preset: 'ego',
        label: `Neighborhood of ${atlas.node(slug)?.canonical_name ?? slug}, ${String(hops)} hop${hops === 2 ? 's' : ''}`,
        focus: [slug],
      }),
      toggle && h('p', { class: 'ego-controls' }, toggle),
      ego.overflow.length > 0 &&
        h(
          'p',
          { class: 'ego-overflow' },
          `…and ${String(ego.overflow.length)} more nearby: `,
          joinChildren(
            ego.overflow.map((n) => nodeLink(atlas, n.slug)),
            ' · ',
          ),
        ),
      betweenNeighbors.length > 0 &&
        h(
          'div',
          { class: 'ego-between' },
          h('h3', {}, 'Between the neighbors'),
          h(
            'ul',
            { class: 'connection-list compact' },
            betweenNeighbors.map((e) => edgeClaim(atlas, e, { context: false, notes: false })),
          ),
        ),
    ];
    body.replaceChildren(...parts.filter((p): p is HTMLElement => Boolean(p)));
  };
  render(1);

  return h(
    'aside',
    { class: 'concept-ego', 'aria-label': 'Neighborhood graph' },
    h('h2', {}, 'Neighborhood'),
    body,
  );
}
