/**
 * The migration map (UI_REDESIGN.md §4.4, ROADMAP M12): structures × fields
 * incidence — where does each structure live, under what local name, and
 * where has it never migrated? Three visibly distinct, text-equivalent cell
 * states: named (a dialect row exists), present-unnamed (membership with no
 * local name — the dialect-gap warn made spatial, linking the alias-wanted
 * queue action), and empty. The map draws memberships, not claims: it never
 * implies an edge, and empty cells in a wide row are questions, not
 * absences of fact. State (ordering, column highlight, row focus) lives in
 * the URL.
 */
import type { Atlas } from '../../data/atlas';
import type { GraphNode } from '../../data/types';
import { shortLabel } from '../../graph-render';
import { typeBadge } from '../common/badges';
import { h, type Child } from '../common/dom';
import { csvOf, downloadViewLine, saveBlobButton } from '../common/save';
import type { View } from '../common/view';
import { lensHash } from '../lens';
import { aliasIssueUrl } from '../queue';

export type MapOrder = 'span' | 'type' | 'az';
export const MAP_DEFAULT_ORDER: MapOrder = 'span';

const ORDERS: { id: MapOrder; label: string }[] = [
  { id: 'span', label: 'widest travelers first' },
  { id: 'type', label: 'node-type blocks' },
  { id: 'az', label: 'A–Z' },
];

export interface MapState {
  order?: string;
  /** Highlight one field's column — "what does my field have?" */
  field?: string;
  /** Highlight one concept's row. */
  focus?: string;
}

export function mapHash(state: MapState): string {
  const params = new URLSearchParams();
  if (state.order && state.order !== MAP_DEFAULT_ORDER) params.set('order', state.order);
  if (state.field) params.set('field', state.field);
  if (state.focus) params.set('focus', state.focus);
  const query = params.toString();
  return query ? `#/map?${query}` : '#/map';
}

interface MapBlock {
  label: Child[] | null;
  nodes: GraphNode[];
}

/**
 * Row order. Span (default) puts the widest travelers on top — the nodes
 * claiming the most field memberships, dialect count breaking ties, so the
 * emptiest interesting rows are the first thing the eye crosses.
 */
function orderBlocks(atlas: Atlas, nodes: GraphNode[], order: MapOrder): MapBlock[] {
  const dialects = (n: GraphNode): number => new Set(n.aliases.map((a) => a.field)).size;
  const bySpan = (a: GraphNode, b: GraphNode): number =>
    b.fields.length - a.fields.length ||
    dialects(b) - dialects(a) ||
    a.canonical_name.localeCompare(b.canonical_name);
  if (order === 'az') {
    return [
      {
        label: null,
        nodes: [...nodes].sort((a, b) => a.canonical_name.localeCompare(b.canonical_name)),
      },
    ];
  }
  if (order === 'type') {
    return atlas.schema.node_types
      .map((t) => ({
        label: [typeBadge(atlas, t.id)] as Child[],
        nodes: nodes.filter((n) => n.node_type === t.id).sort(bySpan),
      }))
      .filter((block) => block.nodes.length > 0);
  }
  return [{ label: null, nodes: [...nodes].sort(bySpan) }];
}

export function mapView(atlas: Atlas, initial: MapState): View {
  const order: MapOrder = ORDERS.some((o) => o.id === initial.order)
    ? (initial.order as MapOrder)
    : MAP_DEFAULT_ORDER;
  const field =
    initial.field && atlas.schema.fields.some((f) => f.id === initial.field)
      ? initial.field
      : undefined;
  const focus = initial.focus && atlas.node(initial.focus) ? initial.focus : undefined;

  const navigate = (next: Partial<MapState>): void => {
    window.location.hash = mapHash({
      order,
      ...(field ? { field } : {}),
      ...(focus ? { focus } : {}),
      ...next,
    });
  };

  // Rows are structure nodes: applications have fields too, but the map's
  // question is where structures live (UI_REDESIGN.md §4.4 defers the
  // application sweep until the wave lands).
  const structures = atlas.nodes.filter((n) => n.node_type !== 'application');
  const fields = atlas.schema.fields;
  const blocks = orderBlocks(atlas, structures, order);
  const ordered = blocks.flatMap((b) => b.nodes);

  const caption = h('p', { class: 'graph-caption', 'aria-live': 'polite' });
  const idleCaption = 'Point at or tab to a named cell to read the local name.';
  caption.textContent = idleCaption;

  const headRow = h(
    'tr',
    {},
    h('th', { class: 'matrix-corner', scope: 'col' }, h('span', { class: 'dim' }, 'structure ↓')),
    fields.map((f) =>
      h(
        'th',
        {
          class: `matrix-col-head${f.id === field ? ' focus-col' : ''}`,
          scope: 'col',
        },
        h(
          'span',
          { class: 'matrix-col-label' },
          h(
            'a',
            {
              href: lensHash({ field: f.id }),
              title: `${f.label} — open the lens filtered to this field`,
            },
            f.label,
          ),
        ),
      ),
    ),
  );

  const body = h('tbody', {});
  for (const block of blocks) {
    if (block.label) {
      body.appendChild(
        h(
          'tr',
          { class: 'matrix-block-row' },
          h('th', { class: 'matrix-row-head', scope: 'rowgroup' }, block.label),
          h('td', { class: 'matrix-block-filler', colspan: String(fields.length) }),
        ),
      );
    }
    for (const node of block.nodes) {
      const aliasFor = new Map(node.aliases.map((a) => [a.field, a.name]));
      const tr = h(
        'tr',
        { class: node.slug === focus ? 'focus-row' : '' },
        h(
          'th',
          { class: 'matrix-row-head', scope: 'row' },
          h(
            'a',
            {
              href: `#/c/${node.slug}?at=dialects`,
              title: `${node.canonical_name} — its dialect table`,
            },
            shortLabel(node.canonical_name, 28),
          ),
        ),
      );
      for (const f of fields) {
        const alias = aliasFor.get(f.id);
        const member = node.fields.includes(f.id);
        const highlight = f.id === field ? ' focus-col' : '';
        if (alias !== undefined) {
          const label = `In ${f.label}, ${node.canonical_name} is called “${alias}”.`;
          const glyph = h(
            'span',
            { class: 'map-glyph', role: 'img', tabindex: '0', 'aria-label': label, title: label },
            '●',
          );
          glyph.addEventListener('mouseenter', () => {
            caption.textContent = label;
          });
          glyph.addEventListener('mouseleave', () => {
            caption.textContent = idleCaption;
          });
          glyph.addEventListener('focus', () => {
            caption.textContent = label;
          });
          glyph.addEventListener('blur', () => {
            caption.textContent = idleCaption;
          });
          tr.appendChild(h('td', { class: `map-cell map-named${highlight}` }, glyph));
        } else if (member) {
          const label =
            `${node.canonical_name} is used in ${f.label}, but the map lacks its local name — ` +
            'propose the alias.';
          tr.appendChild(
            h(
              'td',
              { class: `map-cell map-unnamed${highlight}` },
              h(
                'a',
                {
                  class: 'map-glyph',
                  href: aliasIssueUrl(atlas, node.slug, f.id),
                  'aria-label': label,
                  title: label,
                },
                '◌',
              ),
            ),
          );
        } else {
          tr.appendChild(h('td', { class: `map-cell map-empty${highlight}` }));
        }
      }
      body.appendChild(tr);
    }
  }

  const scroll = h(
    'div',
    { class: 'matrix-scroll map-scroll', role: 'group', 'aria-label': 'Migration map' },
    h(
      'table',
      {
        class: 'matrix-table map-table',
        'aria-label': `Migration map: ${String(ordered.length)} structures by ${String(fields.length)} fields.`,
      },
      h('thead', {}, headRow),
      body,
    ),
  );

  const named = ordered.reduce((sum, n) => sum + new Set(n.aliases.map((a) => a.field)).size, 0);
  const unnamed = ordered.reduce(
    (sum, n) => sum + n.fields.filter((f) => !n.aliases.some((a) => a.field === f)).length,
    0,
  );

  const legend = h(
    'p',
    { class: 'section-hint map-legend' },
    h('span', { class: 'map-glyph', 'aria-hidden': 'true' }, '●'),
    ` named — a dialect row exists (${String(named)}). `,
    h('span', { class: 'map-glyph map-legend-unnamed', 'aria-hidden': 'true' }, '◌'),
    ` present, unnamed — membership with no recorded local name (${String(unnamed)}), each linking ` +
      'the alias-wanted action from the ',
    h('a', { href: '#/queue' }, 'work queue'),
    '. Blank — no claimed presence. The map draws memberships, never claims: it does not imply ' +
      'an edge, and an empty cell in a wide row is a question, not a finding of absence.',
  );

  const controls = h(
    'div',
    { class: 'lens-controls', role: 'group', 'aria-label': 'Map ordering and highlight' },
    (() => {
      const select = h('select', { class: 'lens-select', 'aria-label': 'Row order' });
      select.append(...ORDERS.map((o) => new Option(o.label, o.id, false, o.id === order)));
      select.addEventListener('change', () => {
        navigate({ order: select.value });
      });
      return h(
        'label',
        { class: 'lens-filter' },
        h('span', { class: 'lens-filter-label' }, 'Row order'),
        select,
      );
    })(),
    (() => {
      const select = h('select', { class: 'lens-select', 'aria-label': 'Highlight field' });
      select.append(
        new Option('No column highlight', '', false, field === undefined),
        ...fields.map((f) => new Option(f.label, f.id, false, f.id === field)),
      );
      select.addEventListener('change', () => {
        navigate({ field: select.value || undefined });
      });
      return h(
        'label',
        { class: 'lens-filter' },
        h('span', { class: 'lens-filter-label' }, 'Highlight field'),
        select,
      );
    })(),
    h('a', { class: 'lens-clear', href: '#/map' }, 'Clear'),
  );

  // Download what you see (UI_REDESIGN.md §5, M14): the incidence table as
  // CSV — one row per structure, one column per field, cells carrying the
  // local name, the present-unnamed marker, or nothing.
  const mapCsv = (): string =>
    csvOf([
      ['slug', 'canonical_name', ...fields.map((f) => f.id)],
      ...ordered.map((node) => [
        node.slug,
        node.canonical_name,
        ...fields.map((f) => {
          const names = node.aliases.filter((a) => a.field === f.id).map((a) => a.name);
          if (names.length > 0) return names.join('; ');
          return node.fields.includes(f.id) ? '(present, unnamed)' : '';
        }),
      ]),
    ]);

  const el = h(
    'div',
    { class: 'map content wide' },
    h('header', { class: 'page-header' }, h('h1', {}, 'Migration map')),
    h(
      'p',
      { class: 'tagline' },
      'Where does each structure live, under what local name — and where has it never migrated? ' +
        'Row headers open the concept at its dialect table; column headers open the lens ' +
        'filtered to that field.',
    ),
    controls,
    legend,
    scroll,
    caption,
    downloadViewLine(
      atlas,
      saveBlobButton('Download this map (CSV)', 'migration-map.csv', 'text/csv', mapCsv),
    ),
  );

  const onMount = (): void => {
    if (!focus) return;
    const row = el.querySelector('tr.focus-row');
    row?.scrollIntoView({ block: 'center' });
  };

  return { title: 'Migration map', el, onMount };
}
