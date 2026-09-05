/**
 * The path view (spec §3.3, ROADMAP M4): pick two concepts and see the
 * connecting chains — the notebook's §34 hand-written translation chains
 * as a computed feature. Chains are found by bounded-depth search in
 * data/ over strength-filtered edges and rendered as edge-sentence
 * sequences plus the shared graph preset. Whole state in the URL:
 * #/path/<a>/<b>?strength=<floor>.
 */
import type { Atlas } from '../../data/atlas';
import type { GraphEdge, GraphNode } from '../../data/types';
import {
  PATH_DEFAULT_STRENGTH,
  PATH_MAX_DEPTH,
  pathsBetween,
  type PathChain,
  type Subgraph,
} from '../../data/subgraph';
import { strengthBadge } from '../common/badges';
import { h } from '../common/dom';
import { edgeClaim } from '../common/edge-claim';
import { graphPanel } from '../common/graph-panel';
import type { View } from '../common/view';

export function pathHash(from?: string, to?: string, strength?: string): string {
  const path = ['#/path', from, to].filter(Boolean).join('/');
  return strength && strength !== PATH_DEFAULT_STRENGTH ? `${path}?strength=${strength}` : path;
}

/** Concept picker for two-endpoint views (shared with compare, M14). */
export function endpointSelect(
  atlas: Atlas,
  label: string,
  current: string | undefined,
  onChange: (slug: string) => void,
): HTMLElement {
  const nodes = [...atlas.nodes].sort((a, b) => a.canonical_name.localeCompare(b.canonical_name));
  const select = h('select', { class: 'lens-select', 'aria-label': label });
  select.append(
    new Option(`Choose…`, '', false, current === undefined),
    ...nodes.map((n) => new Option(n.canonical_name, n.slug, false, n.slug === current)),
  );
  select.addEventListener('change', () => {
    if (select.value) onChange(select.value);
  });
  return h(
    'label',
    { class: 'lens-filter' },
    h('span', { class: 'lens-filter-label' }, label),
    select,
  );
}

function chainSubgraph(atlas: Atlas, from: string, chains: PathChain[]): Subgraph {
  const slugs = new Set<string>([from]);
  const edges = new Set<GraphEdge>();
  for (const chain of chains) {
    for (const step of chain.steps) {
      slugs.add(step.from);
      slugs.add(step.to);
      edges.add(step.edge);
    }
  }
  const nodes = [...slugs]
    .sort()
    .map((slug) => atlas.node(slug))
    .filter((n): n is GraphNode => n !== undefined);
  return { nodes, edges: [...edges] };
}

function weakestStrength(atlas: Atlas, chain: PathChain): string {
  let weakest = chain.steps[0]!.edge.strength;
  for (const step of chain.steps) {
    if ((atlas.strength(step.edge.strength)?.rank ?? 0) > (atlas.strength(weakest)?.rank ?? 0)) {
      weakest = step.edge.strength;
    }
  }
  return weakest;
}

function chainItem(atlas: Atlas, chain: PathChain): HTMLElement {
  const n = chain.steps.length;
  return h(
    'li',
    { class: 'chain' },
    h(
      'p',
      { class: 'chain-meta' },
      `${String(n)} step${n === 1 ? '' : 's'} · weakest link `,
      strengthBadge(atlas, weakestStrength(atlas, chain)),
    ),
    h(
      'ol',
      { class: 'chain-steps connection-list' },
      chain.steps.map((step) => edgeClaim(atlas, step.edge, { from: step.from, notes: false })),
    ),
  );
}

export function pathView(
  atlas: Atlas,
  opts: { from?: string; to?: string; strength?: string },
): View {
  const from = opts.from && atlas.node(opts.from) ? opts.from : undefined;
  const to = opts.to && atlas.node(opts.to) ? opts.to : undefined;
  const strength =
    opts.strength && atlas.strength(opts.strength) ? opts.strength : PATH_DEFAULT_STRENGTH;
  const navigate = (f?: string, t?: string, s?: string): void => {
    window.location.hash = pathHash(f, t, s);
  };

  const controls = h(
    'div',
    { class: 'lens-controls', role: 'group', 'aria-label': 'Path endpoints' },
    endpointSelect(atlas, 'From', from, (slug) => navigate(slug, to, strength)),
    endpointSelect(atlas, 'To', to, (slug) => navigate(from, slug, strength)),
    (() => {
      const select = h('select', { class: 'lens-select', 'aria-label': 'Strength floor' });
      select.append(
        ...atlas.schema.strengths.map(
          (s) =>
            new Option(
              s.id === 'speculative'
                ? 'include unverified hypotheses'
                : `at least ${s.id.replace(/-/g, ' ')}`,
              s.id,
              false,
              s.id === strength,
            ),
        ),
      );
      select.addEventListener('change', () => navigate(from, to, select.value));
      return h(
        'label',
        { class: 'lens-filter' },
        h('span', { class: 'lens-filter-label' }, 'Strength floor'),
        select,
      );
    })(),
    from && to && h('a', { class: 'lens-clear', href: pathHash(to, from, strength) }, '⇄ swap'),
  );

  const results = h('div', { class: 'path-results' });
  if (!from || !to) {
    results.replaceChildren(
      h(
        'p',
        { class: 'empty-state' },
        'Pick two concepts to trace the translation chains between them — for example ',
        h(
          'a',
          { href: '#/path/harmonic-oscillator/markov-chains' },
          'normal modes → relaxation modes',
        ),
        ' or ',
        h(
          'a',
          { href: '#/path/variational-principles/optimization' },
          'least action → loss functional',
        ),
        '.',
      ),
    );
  } else if (from === to) {
    results.replaceChildren(
      h('p', { class: 'empty-state' }, 'Those are the same concept — pick two different ends.'),
    );
  } else {
    const found = pathsBetween(atlas, from, to, { strength });
    if (found.chains.length === 0) {
      results.replaceChildren(
        h(
          'p',
          { class: 'empty-state' },
          `No chain of ≤ ${String(PATH_MAX_DEPTH)} steps connects these at this strength floor. `,
          strength !== 'speculative'
            ? h(
                'a',
                { href: pathHash(from, to, 'speculative') },
                'Loosen the floor to include unverified hypotheses',
              )
            : 'They may simply be far apart in the current atlas.',
        ),
      );
    } else {
      results.replaceChildren(
        graphPanel(atlas, chainSubgraph(atlas, from, found.chains), {
          preset: 'path',
          label: `Chains from ${atlas.node(from)!.canonical_name} to ${atlas.node(to)!.canonical_name}`,
          focus: [from, to],
        }),
        h(
          'section',
          { class: 'path-chains' },
          h('h2', {}, `Chains (${String(found.total)})`),
          h(
            'ul',
            { class: 'chain-list' },
            found.chains.map((chain) => chainItem(atlas, chain)),
          ),
          found.total > found.chains.length &&
            h(
              'p',
              { class: 'section-hint' },
              `Showing the ${String(found.chains.length)} strongest; ` +
                `${String(found.total - found.chains.length)} more exist at this depth.`,
            ),
        ),
      );
    }
  }

  const title =
    from && to
      ? `${atlas.node(from)!.canonical_name} ⇄ ${atlas.node(to)!.canonical_name}`
      : 'Path finder';
  const el = h(
    'div',
    { class: 'path content wide' },
    h('header', { class: 'page-header' }, h('h1', {}, 'Path finder')),
    h(
      'p',
      { class: 'tagline' },
      'Trace how one field’s concept translates into another’s, one typed claim at a time. ' +
        'Speculative gap edges are excluded unless you opt in.',
    ),
    controls,
    results,
  );
  return { title, el };
}
