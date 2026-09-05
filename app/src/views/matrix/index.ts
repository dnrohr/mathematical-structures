/**
 * The adjacency matrix (UI_REDESIGN.md §4.3, ROADMAP M12): every pair on
 * one screen — including the unconnected ones. A real <table> over the lens
 * filter grammar; an empty cell is information, and an empty block where
 * two communities meet is the missing-translation surface the M11 queue
 * counts as bridge deficits. Cells carry the strength line grammar (never
 * color-alone) and resolve to the shared edge-claim fragment in the pair
 * panel; the whole view state — filters, ordering, crosshair, selected
 * pair — lives in the URL.
 */
import type { Atlas } from '../../data/atlas';
import {
  MATRIX_DEFAULT_STRENGTH,
  MATRIX_FILTER_REQUIRED_ABOVE,
  matrixSelection,
  type LensFilters,
} from '../../data/subgraph';
import type { GraphEdge, GraphNode } from '../../data/types';
import { shortLabel } from '../../graph-render';
import { replaceHash } from '../../shell/router';
import { communityChip, typeBadge } from '../common/badges';
import { h, joinChildren, type Child } from '../common/dom';
import { edgeClaim, edgeSentenceText } from '../common/edge-claim';
import { GAP_EDGE_TYPE } from '../common/edge-sentence';
import { nodeLink } from '../common/node-link';
import type { View } from '../common/view';
import { pathHash } from '../path';
import { proposeHash } from '../propose';

export type MatrixOrder = 'community' | 'type' | 'az' | 'degree';
export const MATRIX_DEFAULT_ORDER: MatrixOrder = 'community';

const ORDERS: { id: MatrixOrder; label: string }[] = [
  { id: 'community', label: 'community blocks' },
  { id: 'type', label: 'node-type blocks' },
  { id: 'az', label: 'A–Z' },
  { id: 'degree', label: 'trusted degree' },
];

export interface MatrixState {
  filters: LensFilters;
  order?: string;
  /** Crosshair: highlight this concept's row and column. */
  focus?: string;
  /** Selected pair — the pair panel's endpoints. */
  a?: string;
  b?: string;
}

export function matrixHash(state: MatrixState): string {
  const params = new URLSearchParams();
  const { filters } = state;
  if (filters.edge) params.set('edge', filters.edge);
  if (filters.type) params.set('type', filters.type);
  if (filters.field) params.set('field', filters.field);
  if (filters.strength && filters.strength !== MATRIX_DEFAULT_STRENGTH)
    params.set('strength', filters.strength);
  if (state.order && state.order !== MATRIX_DEFAULT_ORDER) params.set('order', state.order);
  if (state.focus) params.set('focus', state.focus);
  if (state.a && state.b) {
    params.set('a', state.a);
    params.set('b', state.b);
  }
  const query = params.toString();
  return query ? `#/matrix?${query}` : '#/matrix';
}

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

/** One labeled run of rows/columns; a null label is an unblocked ordering. */
interface MatrixBlock {
  label: Child[] | null;
  nodes: GraphNode[];
}

/**
 * Order the node list into labeled blocks. Community and type orderings
 * group with labeled separators (the M5 community palette / type badges);
 * within a block — and for the flat orderings — the busiest concepts come
 * first, so the dense corner of every block is the top-left one.
 */
function orderBlocks(atlas: Atlas, nodes: GraphNode[], order: MatrixOrder): MatrixBlock[] {
  const degree = (n: GraphNode): number => atlas.nodeMetrics(n.slug)?.degree ?? 0;
  const byDegree = (a: GraphNode, b: GraphNode): number =>
    degree(b) - degree(a) || a.slug.localeCompare(b.slug);

  if (order === 'az') {
    return [
      {
        label: null,
        nodes: [...nodes].sort((a, b) => a.canonical_name.localeCompare(b.canonical_name)),
      },
    ];
  }
  if (order === 'degree') {
    return [{ label: null, nodes: [...nodes].sort(byDegree) }];
  }
  if (order === 'type') {
    return atlas.schema.node_types
      .map((t) => ({
        label: [typeBadge(atlas, t.id)] as Child[],
        nodes: nodes.filter((n) => n.node_type === t.id).sort(byDegree),
      }))
      .filter((block) => block.nodes.length > 0);
  }
  // community (default): numbered communities ascending, then the concepts
  // no trusted edge touches, labeled honestly as outside the partition.
  const community = (n: GraphNode): number | null => atlas.nodeMetrics(n.slug)?.community ?? null;
  const labels = [...new Set(nodes.map(community))]
    .filter((c): c is number => c !== null)
    .sort((a, b) => a - b);
  const blocks: MatrixBlock[] = labels.map((c) => ({
    label: [communityChip(c)] as Child[],
    nodes: nodes.filter((n) => community(n) === c).sort(byDegree),
  }));
  const outside = nodes.filter((n) => community(n) === null).sort(byDegree);
  if (outside.length > 0) blocks.push({ label: [communityChip(null)] as Child[], nodes: outside });
  return blocks;
}

/** Edges readable row → column: directed edges at (from, to), symmetric in both mirrored cells. */
function cellIndex(edges: GraphEdge[], rank: (id: string) => number): Map<string, GraphEdge[]> {
  const cells = new Map<string, GraphEdge[]>();
  const add = (key: string, edge: GraphEdge): void => {
    const list = cells.get(key);
    if (list) list.push(edge);
    else cells.set(key, [edge]);
  };
  for (const edge of edges) {
    add(`${edge.from}|${edge.to}`, edge);
    if (edge.symmetric) add(`${edge.to}|${edge.from}`, edge);
  }
  for (const list of cells.values()) {
    list.sort((a, b) => rank(a.strength) - rank(b.strength) || a.type.localeCompare(b.type));
  }
  return cells;
}

export function matrixView(atlas: Atlas, initial: MatrixState): View {
  const filters = sanitize(atlas, initial.filters);
  const order: MatrixOrder = ORDERS.some((o) => o.id === initial.order)
    ? (initial.order as MatrixOrder)
    : MATRIX_DEFAULT_ORDER;
  const focus = initial.focus && atlas.node(initial.focus) ? initial.focus : undefined;
  let selected: { a: string; b: string } | null =
    initial.a &&
    initial.b &&
    atlas.node(initial.a) &&
    atlas.node(initial.b) &&
    initial.a !== initial.b
      ? { a: initial.a, b: initial.b }
      : null;

  const state = (): MatrixState => ({
    filters,
    order,
    ...(focus ? { focus } : {}),
    ...(selected ? { a: selected.a, b: selected.b } : {}),
  });
  const navigate = (next: Partial<MatrixState>): void => {
    window.location.hash = matrixHash({ ...state(), ...next });
  };

  const rank = (id: string): number => atlas.strength(id)?.rank ?? 99;
  const selection = matrixSelection(atlas, filters);
  const results = h('div', { class: 'matrix-results' });
  const pairPanel = h('div', { class: 'matrix-pair' });

  // ---- pair panel -----------------------------------------------------------
  const renderPair = (): void => {
    replaceHash(matrixHash(state()));
    if (!selected) {
      pairPanel.replaceChildren();
      return;
    }
    const { a, b } = selected;
    const claims = atlas.edgesBetween(a, b);
    const deficit = bridgeDeficitOf(atlas, a, b);
    pairPanel.replaceChildren(
      h(
        'section',
        { class: 'matrix-pair-panel', 'aria-label': 'Selected pair' },
        h(
          'h2',
          {},
          'The pair: ',
          nodeLink(atlas, a),
          ' ↔ ',
          nodeLink(atlas, b),
          ' ',
          (() => {
            const close = h('button', { type: 'button', class: 'link-button dim' }, 'close');
            close.addEventListener('click', () => {
              selected = null;
              renderPair();
            });
            return close;
          })(),
        ),
        claims.length > 0
          ? h(
              'div',
              {},
              h(
                'p',
                { class: 'section-hint' },
                `Every claim between the two, either direction, any strength (${String(claims.length)}):`,
              ),
              h(
                'ul',
                { class: 'connection-list' },
                claims.map((edge) => edgeClaim(atlas, edge, { from: a, notes: false })),
              ),
            )
          : h(
              'p',
              { class: 'section-hint' },
              'No claim connects these two — which is exactly what the matrix is for. ',
              deficit &&
                h(
                  'span',
                  {},
                  'They sit in communities the work queue flags as a bridge deficit (',
                  h(
                    'a',
                    { href: `#/queue?bridge=${String(deficit[0])}-${String(deficit[1])}` },
                    `C${String(deficit[0])} ↔ C${String(deficit[1])}`,
                  ),
                  '). ',
                ),
            ),
        h(
          'p',
          { class: 'matrix-pair-actions' },
          claims.length === 0 &&
            h(
              'a',
              { class: 'propose-candidate', href: proposeHash({ from: a, to: b }) },
              'propose an edge',
            ),
          claims.length === 0 && ' · ',
          h('a', { class: 'propose-candidate', href: pathHash(a, b) }, 'chains between them'),
        ),
      ),
    );
  };

  // ---- the table ------------------------------------------------------------
  const render = (): void => {
    replaceHash(matrixHash(state()));
    if (selection.nodes.length === 0) {
      results.replaceChildren(
        h('p', { class: 'empty-state' }, 'No concepts match these filters — loosen one.'),
      );
      return;
    }
    if (selection.nodes.length > MATRIX_FILTER_REQUIRED_ABOVE) {
      results.replaceChildren(
        h(
          'p',
          { class: 'empty-state' },
          `${String(selection.nodes.length)} concepts — more cells than one table can carry ` +
            'legibly, so the matrix now requires at least one node filter before rendering ' +
            '(the same posture as the lens fallback). Narrow by node type or field above.',
        ),
      );
      return;
    }

    const blocks = orderBlocks(atlas, selection.nodes, order);
    const ordered = blocks.flatMap((b) => b.nodes);
    const cells = cellIndex(selection.edges, rank);
    const blockStart = new Set<string>();
    for (const block of blocks) {
      if (block.label && block.nodes.length > 0) blockStart.add(block.nodes[0]!.slug);
    }

    const caption = h('p', { class: 'graph-caption', 'aria-live': 'polite' });
    const idleCaption =
      'Point at or arrow across cells to read the claims; Enter or click opens the pair.';
    caption.textContent = idleCaption;

    // Roving focus: one cell is tabbable; arrows move it, skipping the
    // diagonal (a concept has no claims about itself).
    const cellEls: HTMLTableCellElement[][] = ordered.map(() => []);
    let current: [number, number] = [0, ordered.length > 1 ? 1 : 0];
    const focusIndex = focus ? ordered.findIndex((n) => n.slug === focus) : -1;
    if (focusIndex >= 0) current = [focusIndex, focusIndex === 0 ? 1 : 0];
    const setCurrent = (r: number, c: number, moveFocus: boolean): void => {
      cellEls[current[0]]?.[current[1]]?.setAttribute('tabindex', '-1');
      current = [r, c];
      const cell = cellEls[r]?.[c];
      if (!cell) return;
      cell.setAttribute('tabindex', '0');
      if (moveFocus) cell.focus();
    };

    const headRow = h(
      'tr',
      {},
      h('th', { class: 'matrix-corner', scope: 'col' }, h('span', { class: 'dim' }, 'row → col')),
      ordered.map((n) =>
        h(
          'th',
          {
            class: `matrix-col-head${blockStart.has(n.slug) ? ' block-start' : ''}${n.slug === focus ? ' focus-col' : ''}`,
            scope: 'col',
          },
          h(
            'span',
            { class: 'matrix-col-label' },
            h(
              'a',
              { href: `#/c/${n.slug}`, title: n.canonical_name },
              shortLabel(n.canonical_name, 20),
            ),
          ),
        ),
      ),
    );

    const body = h('tbody', {});
    blocks.forEach((block) => {
      if (block.label) {
        body.appendChild(
          h(
            'tr',
            { class: 'matrix-block-row' },
            h('th', { class: 'matrix-row-head', scope: 'rowgroup' }, block.label),
            h('td', { class: 'matrix-block-filler', colspan: String(ordered.length) }),
          ),
        );
      }
      for (const row of block.nodes) {
        const r = ordered.indexOf(row);
        const tr = h(
          'tr',
          {
            class:
              `${blockStart.has(row.slug) ? 'block-start ' : ''}${row.slug === focus ? 'focus-row' : ''}`.trim(),
          },
          h(
            'th',
            { class: 'matrix-row-head', scope: 'row' },
            h(
              'a',
              { href: `#/c/${row.slug}`, title: row.canonical_name },
              shortLabel(row.canonical_name, 28),
            ),
          ),
        );
        ordered.forEach((col, c) => {
          const diag = row.slug === col.slug;
          const list = diag ? [] : (cells.get(`${row.slug}|${col.slug}`) ?? []);
          const strongest = list[0];
          const gap = strongest !== undefined && strongest.type === GAP_EDGE_TYPE;
          const classes = [
            'matrix-cell',
            diag ? 'diag' : strongest ? 'filled' : 'empty',
            gap ? 'gap' : '',
            blockStart.has(col.slug) ? 'block-start' : '',
            col.slug === focus ? 'focus-col' : '',
          ]
            .filter(Boolean)
            .join(' ');
          const label = diag
            ? ''
            : list.length > 0
              ? list.map((e) => edgeSentenceText(atlas, e, row.slug)).join('; ')
              : `${row.canonical_name} and ${col.canonical_name}: no claim.`;
          const td = h(
            'td',
            {
              class: classes,
              ...(diag
                ? {}
                : {
                    'aria-label': label,
                    title: label,
                    tabindex: '-1',
                    'data-r': String(r),
                    'data-c': String(c),
                    'data-row': row.slug,
                    'data-col': col.slug,
                  }),
            },
            strongest &&
              h('span', {
                class: `cell-glyph line-${atlas.strength(strongest.strength)?.line ?? 'solid'} emph-${atlas.strength(strongest.strength)?.emphasis ?? 'medium'}`,
                'aria-hidden': 'true',
              }),
            list.length > 1 && h('span', { class: 'cell-count' }, `×${String(list.length)}`),
          );
          if (!diag) {
            cellEls[r]![c] = td;
            td.addEventListener('click', () => {
              setCurrent(r, c, true);
              selected = { a: row.slug, b: col.slug };
              renderPair();
            });
            td.addEventListener('mouseenter', () => (caption.textContent = label));
            td.addEventListener('mouseleave', () => (caption.textContent = idleCaption));
            td.addEventListener('focus', () => (caption.textContent = label));
            td.addEventListener('blur', () => (caption.textContent = idleCaption));
          }
          tr.appendChild(td);
        });
        body.appendChild(tr);
      }
    });
    setCurrent(current[0], current[1], false);

    body.addEventListener('keydown', (e) => {
      const moves: Record<string, [number, number]> = {
        ArrowUp: [-1, 0],
        ArrowDown: [1, 0],
        ArrowLeft: [0, -1],
        ArrowRight: [0, 1],
      };
      const target = e.target as HTMLElement;
      if (!target.classList.contains('matrix-cell')) return;
      const r0 = Number(target.dataset['r']);
      const c0 = Number(target.dataset['c']);
      if (!Number.isInteger(r0) || !Number.isInteger(c0)) return;
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const [a, b] = [ordered[r0], ordered[c0]];
        if (a && b && a.slug !== b.slug) {
          selected = { a: a.slug, b: b.slug };
          renderPair();
        }
        return;
      }
      const move = moves[e.key];
      if (!move) return;
      e.preventDefault();
      const max = ordered.length - 1;
      let [r, c] = [r0, c0];
      const step = (): void => {
        r = Math.min(max, Math.max(0, r + move[0]));
        c = Math.min(max, Math.max(0, c + move[1]));
      };
      step();
      if (r === c) step(); // skip the diagonal
      if (r === c) return; // cornered against an edge: stay put
      setCurrent(r, c, true);
    });

    const scroll = h(
      'div',
      { class: 'matrix-scroll', role: 'group', 'aria-label': 'Adjacency matrix' },
      h(
        'table',
        {
          class: 'matrix-table',
          'aria-label': `Adjacency matrix: ${String(ordered.length)} concepts by ${String(ordered.length)} concepts; a filled cell is the strongest claim, read row to column.`,
        },
        h('thead', {}, headRow),
        body,
      ),
    );

    const deficits = atlas.queue.bridge_deficits;
    results.replaceChildren(
      h(
        'p',
        { class: 'section-hint' },
        `${String(ordered.length)} concepts × ${String(ordered.length)} concepts, ` +
          `${String(selection.edges.length)} claims shown. Cells read row → column; a symmetric claim fills both mirrored cells; `,
        h('span', { class: 'cell-glyph line-dotted emph-light gap-hint', 'aria-hidden': 'true' }),
        ' warn-tinted cells are research-gap hypotheses, never findings.',
      ),
      scroll,
      caption,
      ...(deficits.length > 0
        ? [
            h(
              'p',
              { class: 'section-hint matrix-deficits' },
              'Reading absence: an empty block where two communities meet is a measured hole — the ',
              h('a', { href: '#/queue' }, 'work queue'),
              ` counts ${String(deficits.length)} community pair${deficits.length === 1 ? '' : 's'} joined by at most one trusted edge: `,
              joinChildren(
                deficits.map((d) =>
                  h(
                    'a',
                    {
                      class: 'propose-candidate',
                      href: `#/queue?bridge=${String(d.communities[0])}-${String(d.communities[1])}`,
                    },
                    `C${String(d.communities[0])} ↔ C${String(d.communities[1])}`,
                  ),
                ),
                ' · ',
              ),
              '.',
            ),
          ]
        : []),
      pairPanel,
    );
    renderPair();

    // The crosshair should be in view when the URL carries a focus concept.
    if (focusIndex >= 0) {
      requestAnimationFrame(() => {
        const cell = cellEls[focusIndex]?.[focusIndex === 0 ? 1 : 0] ?? null;
        const rowHead = cell?.parentElement?.querySelector('.matrix-row-head');
        (rowHead ?? cell)?.scrollIntoView({ block: 'nearest' });
        const inner = scroll.querySelector('.focus-col');
        if (inner instanceof HTMLElement) {
          scroll.scrollLeft = Math.max(0, inner.offsetLeft - scroll.clientWidth / 2);
        }
      });
    }
  };

  // ---- filter + order controls ---------------------------------------------
  const select = (
    label: string,
    options: { value: string; label: string }[],
    currentValue: string,
    onChange: (value: string) => void,
  ): HTMLElement => {
    const el = h('select', { class: 'lens-select', 'aria-label': label });
    el.append(...options.map((o) => new Option(o.label, o.value, false, o.value === currentValue)));
    el.addEventListener('change', () => onChange(el.value));
    return h(
      'label',
      { class: 'lens-filter' },
      h('span', { class: 'lens-filter-label' }, label),
      el,
    );
  };

  const controls = h(
    'div',
    { class: 'lens-controls', role: 'group', 'aria-label': 'Matrix filters' },
    select(
      'Order',
      ORDERS.map((o) => ({ value: o.id, label: o.label })),
      order,
      (value) => navigate({ order: value }),
    ),
    select(
      'Edge type',
      [{ value: '', label: 'Any edge type' }].concat(
        atlas.schema.edge_types.map((t) => ({ value: t.id, label: t.label })),
      ),
      filters.edge ?? '',
      (value) => navigate({ filters: { ...filters, edge: value || undefined } }),
    ),
    select(
      'Node type',
      [{ value: '', label: 'Any node type' }].concat(
        atlas.schema.node_types.map((t) => ({ value: t.id, label: t.label })),
      ),
      filters.type ?? '',
      (value) => navigate({ filters: { ...filters, type: value || undefined } }),
    ),
    select(
      'Field',
      [{ value: '', label: 'Any field' }].concat(
        atlas.schema.fields.map((f) => ({ value: f.id, label: f.label })),
      ),
      filters.field ?? '',
      (value) => navigate({ filters: { ...filters, field: value || undefined } }),
    ),
    select(
      'Strength floor',
      atlas.schema.strengths.map((s) => ({
        value: s.id,
        label:
          s.id === 'speculative'
            ? 'include unverified hypotheses'
            : `at least ${s.id.replace(/-/g, ' ')}`,
      })),
      filters.strength ?? MATRIX_DEFAULT_STRENGTH,
      (value) => navigate({ filters: { ...filters, strength: value } }),
    ),
    h('a', { class: 'lens-clear', href: '#/matrix' }, 'Clear'),
  );

  render();

  const el = h(
    'div',
    { class: 'matrix content wide' },
    h('header', { class: 'page-header' }, h('h1', {}, 'Matrix')),
    h(
      'p',
      { class: 'tagline' },
      'Which pairs are connected, how strongly — and which are not? Every concept against ' +
        'every concept, absence included. Speculative gap edges are excluded unless you opt in; ' +
        'the URL carries the whole view — share it.',
    ),
    controls,
    results,
  );

  return { title: 'Matrix', el };
}

/** The M11 bridge-deficit item covering this pair's communities, if any. */
function bridgeDeficitOf(atlas: Atlas, a: string, b: string): [number, number] | null {
  const ca = atlas.nodeMetrics(a)?.community ?? null;
  const cb = atlas.nodeMetrics(b)?.community ?? null;
  if (ca === null || cb === null || ca === cb) return null;
  const pair: [number, number] = ca < cb ? [ca, cb] : [cb, ca];
  const hit = atlas.queue.bridge_deficits.find(
    (d) => d.communities[0] === pair[0] && d.communities[1] === pair[1],
  );
  return hit ? pair : null;
}
