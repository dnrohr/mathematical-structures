/**
 * Compare two concepts (UI_REDESIGN.md §4.5, ROADMAP M14): the translation
 * use-case made concrete — how do these two relate, in every register the
 * atlas knows? Side-by-side headers; the merged dialect table (one row per
 * field in the union of both nodes' aliases, so "what statisticians call X
 * vs. what engineers call Y" reads on one line); the direct claims; shared
 * neighbors grouped by kind with both connecting sentences; shared
 * assumptions; and the path finder for multi-hop chains. Two unrelated
 * concepts are a legitimate comparison — the view says so and implies no
 * claim the edge list does not make (spec §1). Endpoints live in the URL
 * (#/compare/<a>/<b>), with swap/replace controls mirroring the path view.
 */
import type { Atlas } from '../../data/atlas';
import type { GraphEdge, GraphNode } from '../../data/types';
import { PATH_DEFAULT_STRENGTH } from '../../data/subgraph';
import { statusBadge, typeBadge } from '../common/badges';
import { h } from '../common/dom';
import { edgeClaim } from '../common/edge-claim';
import { nodeLink } from '../common/node-link';
import type { View } from '../common/view';
import { endpointSelect, pathHash } from '../path';
import { proposeHash } from '../propose';

export function compareHash(a?: string, b?: string): string {
  return ['#/compare', a, b].filter(Boolean).join('/');
}

/** Normalize a free-text assumption for identity, as the M11 queue does. */
function normalizeText(text: string): string {
  return text.toLowerCase().replace(/\s+/g, ' ').trim();
}

function headerCard(atlas: Atlas, node: GraphNode): HTMLElement {
  return h(
    'div',
    { class: 'compare-head' },
    h('p', { class: 'badges' }, typeBadge(atlas, node.node_type), statusBadge(atlas, node.status)),
    h('h2', {}, nodeLink(atlas, node.slug, { dot: false })),
    h('p', { class: 'summary' }, node.summary),
  );
}

/**
 * The merged dialect table: one row per field in the union of both nodes'
 * aliases (schema field order), the two concepts as columns. This table
 * alone justifies the view (§4.5).
 */
function mergedDialects(atlas: Atlas, a: GraphNode, b: GraphNode): HTMLElement | null {
  const namesIn = (node: GraphNode, field: string): string[] =>
    node.aliases.filter((al) => al.field === field).map((al) => al.name);
  const fields = atlas.schema.fields.filter(
    (f) => namesIn(a, f.id).length > 0 || namesIn(b, f.id).length > 0,
  );
  if (fields.length === 0) return null;
  const cell = (node: GraphNode, field: string): HTMLElement => {
    const names = namesIn(node, field);
    return names.length > 0
      ? h('td', {}, names.join('; '))
      : h('td', { class: 'compare-noname' }, h('span', { title: 'no recorded local name' }, '—'));
  };
  return h(
    'table',
    { class: 'dialects compare-dialects' },
    h(
      'thead',
      {},
      h(
        'tr',
        {},
        h('th', { scope: 'col' }, 'Field'),
        h('th', { scope: 'col' }, a.canonical_name),
        h('th', { scope: 'col' }, b.canonical_name),
      ),
    ),
    h(
      'tbody',
      {},
      fields.map((f) =>
        h('tr', {}, h('th', { scope: 'row' }, f.label), cell(a, f.id), cell(b, f.id)),
      ),
    ),
  );
}

interface SharedNeighbor {
  node: GraphNode;
  viaA: GraphEdge[];
  viaB: GraphEdge[];
}

/**
 * Neighbors adjacent to both endpoints over edges at the path view's
 * default floor — a speculative hypothesis never manufactures a shared
 * neighbor (the same posture as chains and the matrix).
 */
function sharedNeighbors(atlas: Atlas, a: string, b: string): SharedNeighbor[] {
  const maxRank = atlas.strength(PATH_DEFAULT_STRENGTH)?.rank ?? 0;
  const trusted = (e: GraphEdge): boolean => (atlas.strength(e.strength)?.rank ?? 99) <= maxRank;
  const touching = (slug: string): Map<string, GraphEdge[]> => {
    const map = new Map<string, GraphEdge[]>();
    for (const edge of atlas.edges) {
      if (!trusted(edge)) continue;
      const other = edge.from === slug ? edge.to : edge.to === slug ? edge.from : null;
      if (other === null || other === a || other === b) continue;
      const list = map.get(other);
      if (list) list.push(edge);
      else map.set(other, [edge]);
    }
    return map;
  };
  const nearA = touching(a);
  const nearB = touching(b);
  return [...nearA.keys()]
    .filter((slug) => nearB.has(slug))
    .sort()
    .map((slug) => ({ node: atlas.node(slug), viaA: nearA.get(slug)!, viaB: nearB.get(slug)! }))
    .filter((s): s is SharedNeighbor => s.node !== undefined);
}

/** Shared assumptions: identical normalized front-matter strings on both. */
function sharedAssumptions(a: GraphNode, b: GraphNode): string[] {
  const bSet = new Set(b.assumptions.map(normalizeText));
  const seen = new Set<string>();
  const shared: string[] = [];
  for (const raw of a.assumptions) {
    const key = normalizeText(raw);
    if (bSet.has(key) && !seen.has(key)) {
      seen.add(key);
      shared.push(raw);
    }
  }
  return shared;
}

export function compareView(atlas: Atlas, opts: { a?: string; b?: string }): View {
  const a = opts.a && atlas.node(opts.a) ? opts.a : undefined;
  const b = opts.b && atlas.node(opts.b) ? opts.b : undefined;
  const navigate = (x?: string, y?: string): void => {
    window.location.hash = compareHash(x, y);
  };

  const controls = h(
    'div',
    { class: 'lens-controls', role: 'group', 'aria-label': 'Concepts to compare' },
    endpointSelect(atlas, 'Compare', a, (slug) => navigate(slug, b)),
    endpointSelect(atlas, 'With', b, (slug) => navigate(a, slug)),
    a && b && h('a', { class: 'lens-clear', href: compareHash(b, a) }, '⇄ swap'),
  );

  const results = h('div', { class: 'compare-results' });
  if (!a || !b) {
    results.replaceChildren(
      h(
        'p',
        { class: 'empty-state' },
        'Pick two concepts to read them side by side — the merged dialect table, the direct ' +
          'claims, and what they share. For example ',
        h('a', { href: '#/compare/shannon-entropy/thermodynamic-entropy' }, 'the two entropies'),
        ' or ',
        h('a', { href: '#/compare/kalman-filter/hidden-markov-model' }, 'Kalman filter vs. HMM'),
        '.',
      ),
    );
  } else if (a === b) {
    results.replaceChildren(
      h('p', { class: 'empty-state' }, 'That is the same concept twice — pick two different ones.'),
    );
  } else {
    const nodeA = atlas.node(a)!;
    const nodeB = atlas.node(b)!;
    const direct = atlas.edgesBetween(a, b);
    const shared = sharedNeighbors(atlas, a, b);
    const assumptions = sharedAssumptions(nodeA, nodeB);
    const dialects = mergedDialects(atlas, nodeA, nodeB);
    const unrelated = direct.length === 0 && shared.length === 0;

    const neighborGroups = atlas.schema.node_types
      .map((t) => ({ def: t, items: shared.filter((s) => s.node.node_type === t.id) }))
      .filter((g) => g.items.length > 0);

    const parts: (HTMLElement | null | false)[] = [
      h('div', { class: 'compare-headers' }, headerCard(atlas, nodeA), headerCard(atlas, nodeB)),
      dialects &&
        h(
          'section',
          { class: 'concept-section' },
          h('h2', {}, 'Dialects, side by side'),
          h(
            'p',
            { class: 'section-hint' },
            'One row per field either concept has a local name in — the translation table for the pair.',
          ),
          dialects,
        ),
      h(
        'section',
        { class: 'concept-section' },
        h('h2', {}, `Between the two (${String(direct.length)})`),
        direct.length > 0
          ? h(
              'ul',
              { class: 'connection-list' },
              direct.map((edge) => edgeClaim(atlas, edge, { from: a })),
            )
          : h(
              'p',
              { class: 'section-hint' },
              'No typed claim connects these two directly — which may itself be the finding. ',
              h('a', { href: proposeHash({ from: a, to: b }) }, 'Propose an edge'),
              ' if the atlas is missing one.',
            ),
      ),
      shared.length > 0 &&
        h(
          'section',
          { class: 'concept-section' },
          h('h2', {}, `Shared neighbors (${String(shared.length)})`),
          h(
            'p',
            { class: 'section-hint' },
            `Concepts connected to both, at ${PATH_DEFAULT_STRENGTH.replace(/-/g, ' ')} strength or ` +
              'stronger, with both connecting claims — speculative hypotheses never count here.',
          ),
          neighborGroups.map((group) =>
            h(
              'div',
              { class: 'compare-neighbor-group' },
              h('h3', { class: 'anatomy-kind' }, typeBadge(atlas, group.def.id)),
              group.items.map((s) =>
                h(
                  'div',
                  { class: 'compare-neighbor' },
                  h('p', { class: 'compare-neighbor-name' }, nodeLink(atlas, s.node.slug)),
                  h(
                    'ul',
                    { class: 'connection-list compact' },
                    s.viaA.map((e) => edgeClaim(atlas, e, { from: a, notes: false })),
                    s.viaB.map((e) => edgeClaim(atlas, e, { from: b, notes: false })),
                  ),
                ),
              ),
            ),
          ),
        ),
      assumptions.length > 0 &&
        h(
          'section',
          { class: 'concept-section' },
          h('h2', {}, 'Shared assumptions'),
          h(
            'ul',
            { class: 'assumption-list' },
            assumptions.map((raw) =>
              h(
                'li',
                {},
                atlas.isSlug(normalizeText(raw)) ? nodeLink(atlas, normalizeText(raw)) : raw,
              ),
            ),
          ),
        ),
      unrelated &&
        h(
          'p',
          { class: 'empty-state' },
          `No direct claims, and no shared neighbors at ${PATH_DEFAULT_STRENGTH.replace(/-/g, ' ')} ` +
            'or stronger — a legitimate comparison: the atlas records no relationship here, and ' +
            'this view will not imply one. ',
          h('a', { href: pathHash(a, b) }, 'Look for longer chains'),
          ' or ',
          h('a', { href: proposeHash({ from: a, to: b }) }, 'propose an edge'),
          ' if you know one.',
        ),
      !unrelated &&
        h(
          'p',
          { class: 'section-hint compare-path-link' },
          'Multi-hop translation chains between the two: ',
          h('a', { href: pathHash(a, b) }, 'open the path finder'),
          '.',
        ),
    ];
    results.replaceChildren(...parts.filter((p): p is HTMLElement => Boolean(p)));
  }

  const title =
    a && b
      ? `Compare: ${atlas.node(a)!.canonical_name} vs. ${atlas.node(b)!.canonical_name}`
      : 'Compare';
  const el = h(
    'div',
    { class: 'compare content wide' },
    h('header', { class: 'page-header' }, h('h1', {}, 'Compare')),
    h(
      'p',
      { class: 'tagline' },
      'Two concepts in every register the atlas knows: names by field, direct claims, shared ' +
        'ground. The URL carries the pair — share it.',
    ),
    controls,
    results,
  );
  return { title, el };
}
