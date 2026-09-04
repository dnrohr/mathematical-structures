/**
 * The metrics view (spec §7.3 "Atlas metrics", ROADMAP M5): the Researcher's
 * rankings — hubs, bridges, disciplinary span, dialect count — from the
 * build-time analysis, plus the community partition ("does the graph
 * rediscover the disciplines?") and the dataset downloads.
 *
 * Epistemic contract, stated in the UI because it is an exit criterion:
 * every structural metric is computed on the TRUSTED subgraph only, so
 * analogies and hypotheses cannot manufacture centrality.
 *
 * Sort state lives in the URL (ARCHITECTURE.md §5.2) — a ranking someone
 * cites is a link, not a screenshot. Values are printed as text; the inline
 * meters are magnitude reinforcement, never the only encoding.
 */
import type { Atlas } from '../../data/atlas';
import type { GraphNode, NodeMetrics } from '../../data/types';
import { replaceHash } from '../../shell/router';
import { communityChip } from '../common/badges';
import { h, joinChildren } from '../common/dom';
import { downloadBlock } from '../common/downloads';
import { nodeLink } from '../common/node-link';
import type { View } from '../common/view';

type SortKey = 'name' | 'degree' | 'betweenness' | 'span' | 'dialects';
type Dir = 'asc' | 'desc';

const DEFAULT_SORT: SortKey = 'degree';

const COLUMNS: { key: SortKey; label: string; title: string }[] = [
  { key: 'name', label: 'Concept', title: 'Canonical name' },
  { key: 'degree', label: 'Hub', title: 'Degree: incident trusted edges' },
  {
    key: 'betweenness',
    label: 'Bridge',
    title: 'Betweenness centrality on the trusted subgraph, normalized to [0, 1]',
  },
  {
    key: 'span',
    label: 'Span',
    title: 'Disciplinary span entropy in bits — log₂ of the fields the concept is used in',
  },
  { key: 'dialects', label: 'Dialects', title: 'Distinct fields with a named dialect (alias)' },
];

interface Row {
  node: GraphNode;
  m: NodeMetrics;
}

function sortValue(row: Row, key: SortKey): number | string {
  switch (key) {
    case 'name':
      return row.node.canonical_name.toLowerCase();
    case 'degree':
      return row.m.degree;
    case 'betweenness':
      return row.m.betweenness;
    case 'span':
      return row.m.span_entropy;
    case 'dialects':
      return row.m.dialect_count;
  }
}

export function metricsHash(sort: SortKey, dir: Dir): string {
  const params = new URLSearchParams();
  const defaultDir: Dir = sort === 'name' ? 'asc' : 'desc';
  if (sort !== DEFAULT_SORT) params.set('sort', sort);
  if (dir !== defaultDir) params.set('dir', dir);
  const query = params.toString();
  return query ? `#/metrics?${query}` : '#/metrics';
}

/** A magnitude meter behind a printed value; the number is the encoding. */
function meterCell(value: number, max: number, text: string): HTMLTableCellElement {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return h(
    'td',
    { class: 'num' },
    h(
      'span',
      { class: 'meter', 'aria-hidden': 'true' },
      h('span', { class: 'meter-fill', style: `width: ${String(pct)}%` }),
    ),
    h('span', { class: 'meter-value' }, text),
  );
}

export function metricsView(
  atlas: Atlas,
  initial: { sort?: string; dir?: 'asc' | 'desc' } = {},
): View {
  const keys = new Set<string>(COLUMNS.map((c) => c.key));
  let sort: SortKey = keys.has(initial.sort ?? '') ? (initial.sort as SortKey) : DEFAULT_SORT;
  let dir: Dir = initial.dir ?? (sort === 'name' ? 'asc' : 'desc');

  const metrics = atlas.metrics;
  const rows: Row[] = atlas.nodes.map((node) => ({
    node,
    m: atlas.nodeMetrics(node.slug)!,
  }));
  const max = {
    degree: Math.max(0, ...rows.map((r) => r.m.degree)),
    betweenness: Math.max(0, ...rows.map((r) => r.m.betweenness)),
  };

  const tbody = h('tbody', {});
  const headerCells = new Map<SortKey, HTMLTableCellElement>();

  const render = (): void => {
    replaceHash(metricsHash(sort, dir));
    const sign = dir === 'asc' ? 1 : -1;
    const sorted = [...rows].sort((a, b) => {
      const va = sortValue(a, sort);
      const vb = sortValue(b, sort);
      const cmp = typeof va === 'number' ? va - (vb as number) : va.localeCompare(vb as string);
      return sign * cmp || a.node.slug.localeCompare(b.node.slug);
    });
    for (const [key, th] of headerCells) {
      th.setAttribute(
        'aria-sort',
        key === sort ? (dir === 'asc' ? 'ascending' : 'descending') : 'none',
      );
    }
    tbody.replaceChildren(
      ...sorted.map((row) =>
        h(
          'tr',
          {},
          h('td', { class: 'metric-name' }, nodeLink(atlas, row.node.slug)),
          meterCell(row.m.degree, max.degree, String(row.m.degree)),
          meterCell(row.m.betweenness, max.betweenness, row.m.betweenness.toFixed(3)),
          h(
            'td',
            { class: 'num', title: `${String(row.m.field_count)} fields` },
            row.m.span_entropy.toFixed(2),
          ),
          h('td', { class: 'num' }, String(row.m.dialect_count)),
          h('td', {}, communityChip(row.m.community)),
        ),
      ),
    );
  };

  const headRow = h(
    'tr',
    {},
    COLUMNS.map((col) => {
      const button = h('button', { class: 'sort-button', type: 'button', title: col.title }, [
        col.label,
      ]);
      button.addEventListener('click', () => {
        if (sort === col.key) dir = dir === 'asc' ? 'desc' : 'asc';
        else {
          sort = col.key;
          dir = col.key === 'name' ? 'asc' : 'desc';
        }
        render();
      });
      const th = h('th', { scope: 'col' }, button);
      headerCells.set(col.key, th);
      return th;
    }),
    h('th', { scope: 'col' }, 'Community'),
  );

  render();

  // --- communities: the partition as text (the graph never stands alone) ---
  const byCommunity = new Map<number, Row[]>();
  const outside: Row[] = [];
  for (const row of rows) {
    if (row.m.community === null) outside.push(row);
    else {
      const list = byCommunity.get(row.m.community);
      if (list) list.push(row);
      else byCommunity.set(row.m.community, [row]);
    }
  }
  const communityCards = [...byCommunity.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([community, members]) => {
      members.sort((a, b) => b.m.degree - a.m.degree || a.node.slug.localeCompare(b.node.slug));
      const fieldCounts = new Map<string, number>();
      for (const row of members) {
        for (const field of row.node.fields) {
          fieldCounts.set(field, (fieldCounts.get(field) ?? 0) + 1);
        }
      }
      const dominant = [...fieldCounts.entries()]
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
        .slice(0, 3)
        .map(([field]) => atlas.fieldLabel(field));
      return h(
        'li',
        { class: 'community-card' },
        h(
          'h3',
          {},
          communityChip(community),
          ` ${String(members.length)} concepts`,
          h('span', { class: 'dim' }, ` — mostly ${dominant.join(', ')}`),
        ),
        h(
          'p',
          {},
          joinChildren(
            members.map((row) => nodeLink(atlas, row.node.slug)),
            ' · ',
          ),
        ),
      );
    });

  const trusted = metrics.trusted;
  const el = h(
    'div',
    { class: 'metrics content wide' },
    h('header', { class: 'page-header' }, h('h1', {}, 'Atlas metrics')),
    h(
      'p',
      { class: 'tagline' },
      'The map analyzing itself: which concepts carry the structure, and where the graph is dense or thin.',
    ),
    h(
      'p',
      { class: 'trusted-note' },
      h('strong', {}, 'Computed on the trusted subgraph only. '),
      `Degree, betweenness, and communities use the ${String(trusted.edge_count)} edges of strength `,
      h('em', {}, trusted.min_strength.replace(/-/g, ' ')),
      ` or stronger, touching ${String(trusted.node_count)} of ${String(atlas.nodes.length)} concepts. `,
      `The other ${String(trusted.excluded_edge_count)} edges — analogies and hypotheses — are shown in the map `,
      'but cannot manufacture centrality here.',
    ),
    h(
      'section',
      { class: 'rankings' },
      h('h2', {}, 'Rankings'),
      h(
        'p',
        { class: 'section-hint' },
        'Click a column to sort; the URL carries the ranking. Hubs collect trusted edges; bridges sit between clusters; span and dialects measure how many disciplines share the concept.',
      ),
      h(
        'div',
        { class: 'table-scroll' },
        h('table', { class: 'metrics-table' }, h('thead', {}, headRow), tbody),
      ),
    ),
    h(
      'section',
      { class: 'communities' },
      h('h2', {}, 'Does the graph rediscover the disciplines?'),
      h(
        'p',
        { class: 'section-hint' },
        `Community detection on the trusted subgraph found ${String(metrics.community_count)} clusters, labeled C0–C${String(metrics.community_count - 1)}. `,
        'Color them onto any composed subgraph with the “Color by community” toggle in the ',
        h('a', { href: '#/lens?field=biology&communities=1' }, 'lens'),
        '.',
      ),
      h('ul', { class: 'community-list' }, communityCards),
      outside.length > 0 &&
        h(
          'p',
          { class: 'section-hint' },
          'Held only by analogy or hypothesis so far — outside the trusted subgraph: ',
          joinChildren(
            outside.map((row) => nodeLink(atlas, row.node.slug)),
            ' · ',
          ),
          '.',
        ),
    ),
    downloadBlock(),
  );

  return { title: 'Atlas metrics', el };
}
