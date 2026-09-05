/**
 * A–Z index — the plain fallback when search isn't the right tool
 * (ROADMAP M3), grown three facet chip rows in M14 (UI_REDESIGN.md §4.8):
 * node type, field, and status, with counts, combining as AND, state in the
 * URL (#/index?type=&field=&status=). Quietly covers what the nav can't:
 * "all moves used in biology", "everything still marked hypothesis". The
 * landing type groups deep-link pre-filtered states.
 */
import type { Atlas } from '../../data/atlas';
import type { GraphNode } from '../../data/types';
import { replaceHash } from '../../shell/router';
import { h } from '../common/dom';
import { nodeLink } from '../common/node-link';
import type { View } from '../common/view';

export interface AtozFacets {
  type?: string;
  field?: string;
  status?: string;
}

export function atozHash(facets: AtozFacets): string {
  const params = new URLSearchParams();
  if (facets.type) params.set('type', facets.type);
  if (facets.field) params.set('field', facets.field);
  if (facets.status) params.set('status', facets.status);
  const query = params.toString();
  return query ? `#/index?${query}` : '#/index';
}

function matches(node: GraphNode, facets: AtozFacets): boolean {
  if (facets.type && node.node_type !== facets.type) return false;
  if (facets.field && !node.fields.includes(facets.field)) return false;
  if (facets.status && node.status !== facets.status) return false;
  return true;
}

interface Dimension {
  key: keyof AtozFacets;
  label: string;
  /** Values that exist on at least one node — an id with zero members overall is noise here. */
  options: { id: string; label: string }[];
}

export function atozView(atlas: Atlas, initial: AtozFacets = {}): View {
  const facets: AtozFacets = {};
  if (initial.type && atlas.nodeType(initial.type)) facets.type = initial.type;
  if (initial.field && atlas.schema.fields.some((f) => f.id === initial.field))
    facets.field = initial.field;
  if (initial.status && atlas.nodeStatus(initial.status)) facets.status = initial.status;

  const dimensions: Dimension[] = [
    {
      key: 'type',
      label: 'Kind',
      options: atlas.schema.node_types
        .filter((t) => atlas.nodes.some((n) => n.node_type === t.id))
        .map((t) => ({ id: t.id, label: t.label })),
    },
    {
      key: 'field',
      label: 'Field',
      options: atlas.schema.fields
        .filter((f) => atlas.nodes.some((n) => n.fields.includes(f.id)))
        .map((f) => ({ id: f.id, label: f.label })),
    },
    {
      key: 'status',
      label: 'Status',
      options: atlas.schema.node_statuses
        .filter((s) => atlas.nodes.some((n) => n.status === s.id))
        .map((s) => ({ id: s.id, label: s.id.replace(/-/g, ' ') })),
    },
  ];

  const chipHost = h('div', { class: 'facet-rows' });
  const countLine = h('p', { class: 'tagline', 'aria-live': 'polite' });
  const results = h('div', { class: 'atoz-results' });

  const render = (focusKey?: string): void => {
    replaceHash(atozHash(facets));

    chipHost.replaceChildren(
      ...dimensions.map((dim) => {
        const active = facets[dim.key];
        const chip = (label: string, value?: string, count?: number): HTMLElement => {
          const isActive = value === active;
          const next: AtozFacets = { ...facets, [dim.key]: value };
          const el = h(
            'a',
            {
              class: `chip af-chip facet-chip${isActive ? ' active' : ''}${count === 0 ? ' facet-zero' : ''}`,
              href: atozHash(next),
              'data-facet': `${dim.key}:${value ?? ''}`,
              ...(isActive ? { 'aria-current': 'true' } : {}),
            },
            label,
            count !== undefined && h('span', { class: 'count' }, ` ${String(count)}`),
          );
          el.addEventListener('click', (e) => {
            // Plain click filters in place; modified clicks keep link behavior.
            if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
            e.preventDefault();
            if (value === undefined) delete facets[dim.key];
            else facets[dim.key] = value;
            render(`${dim.key}:${value ?? ''}`);
          });
          return el;
        };
        // Counts answer "what would this chip show?": the OTHER active
        // facets stay applied, this dimension takes the chip's value.
        const others: AtozFacets = { ...facets };
        delete others[dim.key];
        return h(
          'p',
          {
            class: 'af-chips facet-row',
            role: 'group',
            'aria-label': `Filter by ${dim.label.toLowerCase()}`,
          },
          h('span', { class: 'facet-label' }, `${dim.label}: `),
          chip(`any`, undefined),
          ...dim.options.map((o) =>
            chip(
              o.label,
              o.id,
              atlas.nodes.filter((n) => matches(n, { ...others, [dim.key]: o.id })).length,
            ),
          ),
        );
      }),
    );

    const filtered = atlas.nodes.filter((n) => matches(n, facets));
    const anyFacet = Boolean(facets.type ?? facets.field ?? facets.status);
    countLine.textContent = anyFacet
      ? `${String(filtered.length)} of ${String(atlas.nodes.length)} concepts match — facets combine as AND; the URL carries them.`
      : `Every concept in the atlas (${String(atlas.nodes.length)}), with the names other fields use for it.`;

    if (filtered.length === 0) {
      results.replaceChildren(
        h('p', { class: 'empty-state' }, 'No concepts match this combination — clear a facet.'),
      );
    } else {
      const sorted = [...filtered].sort((a, b) =>
        a.canonical_name.localeCompare(b.canonical_name, 'en', { sensitivity: 'base' }),
      );
      const groups = new Map<string, typeof sorted>();
      for (const node of sorted) {
        const letter = /^[a-z]/i.test(node.canonical_name)
          ? node.canonical_name.charAt(0).toUpperCase()
          : '#';
        if (!groups.has(letter)) groups.set(letter, []);
        groups.get(letter)!.push(node);
      }
      results.replaceChildren(
        ...[...groups.entries()].map(([letter, nodes]) =>
          h(
            'section',
            { class: 'atoz-group' },
            h('h2', {}, letter),
            h(
              'ul',
              { class: 'atoz-list' },
              nodes.map((node) =>
                h(
                  'li',
                  {},
                  nodeLink(atlas, node.slug),
                  node.aliases.length > 0 &&
                    h(
                      'span',
                      { class: 'atoz-aliases' },
                      ` — ${node.aliases.map((a) => a.name).join('; ')}`,
                    ),
                ),
              ),
            ),
          ),
        ),
      );
    }

    // In-place filtering must not strand keyboard focus (the landing chip
    // rows set the pattern): put it back on the chip just chosen.
    if (focusKey !== undefined) {
      chipHost.querySelector<HTMLElement>(`[data-facet="${focusKey}"]`)?.focus();
    }
  };
  render();

  const el = h(
    'div',
    { class: 'atoz content' },
    h('header', { class: 'page-header' }, h('h1', {}, 'A–Z index')),
    countLine,
    chipHost,
    results,
  );

  return { title: 'A–Z index', el };
}
