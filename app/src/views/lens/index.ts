/**
 * The lens view (spec §3.3, ROADMAP M4): a user-composed subgraph — filter
 * by edge type, node type, field, and minimum strength. Filter state lives
 * entirely in the URL, so every lens is shareable. A lens with no filters
 * renders guidance, not the full graph (spec §9); an over-wide lens falls
 * back to the claim list, which is always rendered in full — the graph is
 * a shortcut, never the only path (ARCHITECTURE.md §5.4).
 */
import type { Atlas } from '../../data/atlas';
import { hasLensFilter, lensSubgraph, type LensFilters } from '../../data/subgraph';
import { replaceHash } from '../../shell/router';
import { h } from '../common/dom';
import { edgeClaim } from '../common/edge-claim';
import { graphPanel } from '../common/graph-panel';
import type { View } from '../common/view';

/** Above this many nodes a lens is a hairball; the text list carries it. */
const LENS_GRAPH_NODE_CAP = 32;

const EXAMPLE_LENSES: { label: string; hash: string }[] = [
  { label: 'Only field dialects', hash: '#/lens?edge=FIELD-DIALECT-OF' },
  { label: 'Everything used in biology', hash: '#/lens?field=biology' },
  { label: 'The reusable moves and what they touch', hash: '#/lens?type=move' },
  { label: 'Theorem-grade structure only', hash: '#/lens?strength=theorem' },
  { label: 'Open research-gap hypotheses', hash: '#/lens?edge=POSSIBLE-MISSING-MIGRATION' },
];

/** Drop filter values the schema does not know (stale or mistyped URLs). */
function sanitize(atlas: Atlas, filters: LensFilters): LensFilters {
  const out: LensFilters = {};
  if (filters.edge && atlas.edgeType(filters.edge)) out.edge = filters.edge;
  if (filters.type && atlas.nodeType(filters.type)) out.type = filters.type;
  if (filters.field && atlas.schema.fields.some((f) => f.id === filters.field))
    out.field = filters.field;
  if (filters.strength && atlas.strength(filters.strength)) out.strength = filters.strength;
  return out;
}

export function lensHash(filters: LensFilters): string {
  const params = new URLSearchParams();
  if (filters.edge) params.set('edge', filters.edge);
  if (filters.type) params.set('type', filters.type);
  if (filters.field) params.set('field', filters.field);
  if (filters.strength) params.set('strength', filters.strength);
  const query = params.toString();
  return query ? `#/lens?${query}` : '#/lens';
}

function filterSelect(
  label: string,
  anyLabel: string,
  options: { value: string; label: string }[],
  current: string | undefined,
  onChange: (value: string | undefined) => void,
): HTMLElement {
  const select = h('select', { class: 'lens-select', 'aria-label': label });
  select.append(
    new Option(anyLabel, ''),
    ...options.map((o) => new Option(o.label, o.value, false, o.value === current)),
  );
  select.addEventListener('change', () => onChange(select.value || undefined));
  return h(
    'label',
    { class: 'lens-filter' },
    h('span', { class: 'lens-filter-label' }, label),
    select,
  );
}

export function lensView(atlas: Atlas, initial: LensFilters): View {
  const filters = sanitize(atlas, initial);
  const results = h('div', { class: 'lens-results' });

  const render = (): void => {
    replaceHash(lensHash(filters));
    if (!hasLensFilter(filters)) {
      results.replaceChildren(
        h(
          'div',
          { class: 'empty-state' },
          h('p', {}, 'Choose at least one filter to compose a lens — some to try:'),
          h(
            'ul',
            {},
            EXAMPLE_LENSES.map((ex) => h('li', {}, h('a', { href: ex.hash }, ex.label))),
          ),
        ),
      );
      return;
    }
    const sub = lensSubgraph(atlas, filters);
    if (sub.edges.length === 0) {
      results.replaceChildren(
        h(
          'p',
          { class: 'empty-state' },
          'No edges match this lens. Loosen a filter — lowering the strength floor or ',
          'clearing the node filters usually helps.',
        ),
      );
      return;
    }
    const tooWide = sub.nodes.length > LENS_GRAPH_NODE_CAP;
    results.replaceChildren(
      tooWide
        ? h(
            'p',
            { class: 'section-hint' },
            `${String(sub.nodes.length)} concepts match — too many to draw legibly, so this lens ` +
              'is shown as claims only. Narrow a filter to see the graph.',
          )
        : graphPanel(atlas, sub, { preset: 'lens', label: 'Lens subgraph' }),
      h(
        'section',
        { class: 'lens-claims' },
        h('h2', {}, `As claims (${String(sub.edges.length)})`),
        (filters.type || filters.field) &&
          h(
            'p',
            { class: 'section-hint' },
            'Edges touching at least one concept that matches the node filters.',
          ),
        h(
          'ul',
          { class: 'connection-list' },
          sub.edges.map((edge) => edgeClaim(atlas, edge)),
        ),
      ),
    );
  };

  const set = (key: keyof LensFilters) => (value: string | undefined) => {
    if (value === undefined) delete filters[key];
    else filters[key] = value;
    render();
  };

  const controls = h(
    'div',
    { class: 'lens-controls', role: 'group', 'aria-label': 'Lens filters' },
    filterSelect(
      'Edge type',
      'Any edge type',
      atlas.schema.edge_types.map((t) => ({ value: t.id, label: t.label })),
      filters.edge,
      set('edge'),
    ),
    filterSelect(
      'Node type',
      'Any node type',
      atlas.schema.node_types.map((t) => ({ value: t.id, label: t.label })),
      filters.type,
      set('type'),
    ),
    filterSelect(
      'Field',
      'Any field',
      atlas.schema.fields.map((f) => ({ value: f.id, label: f.label })),
      filters.field,
      set('field'),
    ),
    filterSelect(
      'Strength floor',
      'Any strength',
      atlas.schema.strengths.map((s) => ({
        value: s.id,
        label: `at least ${s.id.replace(/-/g, ' ')}`,
      })),
      filters.strength,
      set('strength'),
    ),
    h('a', { class: 'lens-clear', href: '#/lens' }, 'Clear'),
  );

  render();

  const el = h(
    'div',
    { class: 'lens content wide' },
    h('header', { class: 'page-header' }, h('h1', {}, 'Lens')),
    h(
      'p',
      { class: 'tagline' },
      'Compose a filtered view of the typed graph. The URL carries the whole lens — share it.',
    ),
    controls,
    results,
  );

  return { title: 'Lens', el };
}
