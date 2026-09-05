/**
 * The concept page — the atom of the app (spec §3.1, minus the ego-network,
 * which is M4): name + type badge, structural summary, dialect table,
 * assumptions with FAILS-WHEN / REPLACED-BY surfaced right beside them,
 * typed connections grouped by edge type, canonical examples, prose notes,
 * backlinks, provenance.
 */
import { REPO_URL } from '../../config';
import type { Atlas } from '../../data/atlas';
import type { GraphNode, NodeConnection } from '../../data/types';
import { statusBadge, typeBadge } from '../common/badges';
import { sourcesSection } from '../common/citations';
import { dialectTable } from '../common/dialect-table';
import { h, joinChildren } from '../common/dom';
import { connectionItem, GAP_EDGE_TYPE } from '../common/edge-sentence';
import { nodeLink } from '../common/node-link';
import type { View } from '../common/view';
import { egoSection } from './ego';

/** Edge types that belong beside the assumptions block (spec §3.1 item 4). */
const ASSUMPTION_ADJACENT = new Set(['ASSUMES', 'FAILS-WHEN', 'REPLACED-BY']);

interface ConnectionGroup {
  type: string;
  direction: NodeConnection['direction'];
  phrase: string;
  items: NodeConnection[];
}

function groupConnections(atlas: Atlas, conns: NodeConnection[]): ConnectionGroup[] {
  const groups = new Map<string, ConnectionGroup>();
  for (const conn of conns) {
    const key = `${conn.type}|${conn.direction}`;
    let group = groups.get(key);
    if (!group) {
      group = { type: conn.type, direction: conn.direction, phrase: conn.phrase, items: [] };
      groups.set(key, group);
    }
    group.items.push(conn);
  }
  const typeOrder = new Map(atlas.schema.edge_types.map((t, i) => [t.id, i]));
  const dirOrder = { out: 0, sym: 0, in: 1 } as const;
  const list = [...groups.values()];
  list.sort(
    (a, b) =>
      (typeOrder.get(a.type) ?? 99) - (typeOrder.get(b.type) ?? 99) ||
      dirOrder[a.direction] - dirOrder[b.direction],
  );
  for (const group of list) {
    group.items.sort(
      (a, b) =>
        (atlas.strength(a.strength)?.rank ?? 99) - (atlas.strength(b.strength)?.rank ?? 99) ||
        a.other.localeCompare(b.other),
    );
  }
  return list;
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function provenanceLink(section: string): HTMLElement {
  // 'notebook-v0#12-eigenvalues-...' → docs/notebook-v0.md#12-eigenvalues-...
  const m = /^([a-z0-9-]+)#(.+)$/.exec(section);
  if (!m) return h('span', {}, section);
  const [, doc, anchor] = m;
  const num = /^(\d+)-(.*)$/.exec(anchor!);
  const label = num ? `${doc} §${num[1]} ${num[2]!.replace(/-/g, ' ')}` : `${doc} #${anchor}`;
  return h('a', { href: `${REPO_URL}/blob/main/docs/${doc}.md#${anchor}` }, label);
}

function assumptionsSection(atlas: Atlas, node: GraphNode, adjacent: NodeConnection[]) {
  if (node.assumptions.length === 0 && adjacent.length === 0) return null;
  return h(
    'section',
    { class: 'concept-section assumptions' },
    h('h2', {}, 'Assumptions & breakdown'),
    node.assumptions.length > 0 &&
      h(
        'ul',
        { class: 'assumption-list' },
        node.assumptions.map((a) => h('li', {}, atlas.isSlug(a) ? nodeLink(atlas, a) : a)),
      ),
    adjacent.length > 0 &&
      h(
        'ul',
        { class: 'connection-list' },
        adjacent.map((conn) => connectionItem(atlas, conn, { phrase: true })),
      ),
  );
}

function connectionsSection(atlas: Atlas, groups: ConnectionGroup[]) {
  if (groups.length === 0) return null;
  return h(
    'section',
    { class: 'concept-section connections' },
    h('h2', {}, 'Connections'),
    groups.map((group) => {
      const gap = group.type === GAP_EDGE_TYPE;
      return h(
        'div',
        { class: `connection-group${gap ? ' gap-group' : ''}` },
        h('h3', { class: 'phrase-heading' }, capitalize(group.phrase)),
        gap &&
          h(
            'p',
            { class: 'gap-note' },
            'Research-gap hypothesis — a question under the ',
            h(
              'a',
              { href: `${REPO_URL}/blob/main/docs/research-gap-workflow.md` },
              'verification workflow',
            ),
            ', never a finding.',
          ),
        h(
          'ul',
          { class: 'connection-list' },
          group.items.map((conn) => connectionItem(atlas, conn)),
        ),
      );
    }),
  );
}

export function conceptView(atlas: Atlas, slug: string): View | null {
  const node = atlas.node(slug);
  if (!node) return null;

  const adjacent = node.connections.filter(
    (c) => c.direction === 'out' && ASSUMPTION_ADJACENT.has(c.type),
  );
  const grouped = groupConnections(
    atlas,
    node.connections.filter((c) => !(c.direction === 'out' && ASSUMPTION_ADJACENT.has(c.type))),
  );

  const dialects = dialectTable(atlas, node);
  const prose = h('article', { class: 'prose' });
  prose.innerHTML = node.html; // build-rendered, sanitized by construction
  const ego = egoSection(atlas, node.slug);

  const el = h(
    'div',
    { class: `concept content${ego ? ' has-ego' : ''}` },
    h(
      'header',
      { class: 'concept-header' },
      h(
        'p',
        { class: 'badges' },
        typeBadge(atlas, node.node_type),
        statusBadge(atlas, node.status),
      ),
      h('h1', {}, node.canonical_name),
      node.fields.length > 0 &&
        h(
          'p',
          { class: 'field-chips' },
          node.fields.map((f) => h('span', { class: 'chip field-chip' }, atlas.fieldLabel(f))),
        ),
    ),
    h('p', { class: 'summary' }, node.summary),
    dialects &&
      h(
        'section',
        { class: 'concept-section' },
        h('h2', {}, 'Dialects'),
        h('p', { class: 'section-hint' }, 'The same structure, as each field names it.'),
        dialects,
      ),
    assumptionsSection(atlas, node, adjacent),
    connectionsSection(atlas, grouped),
    ego,
    node.canonical_examples.length > 0 &&
      h(
        'section',
        { class: 'concept-section' },
        h('h2', {}, 'Canonical examples'),
        h(
          'ul',
          { class: 'example-list' },
          node.canonical_examples.map((ex) => h('li', {}, ex)),
        ),
      ),
    node.html.trim().length > 0 &&
      h('section', { class: 'concept-section' }, h('h2', {}, 'Notes'), prose),
    sourcesSection(atlas, node),
    node.backlinks.length > 0 &&
      h(
        'section',
        { class: 'concept-section' },
        h('h2', {}, 'Mentioned by'),
        h(
          'p',
          { class: 'backlinks' },
          joinChildren(
            node.backlinks.map((b) => nodeLink(atlas, b)),
            ' · ',
          ),
        ),
      ),
    node.sections.length > 0 &&
      h(
        'p',
        { class: 'provenance' },
        'Source: ',
        joinChildren(node.sections.map(provenanceLink), ' · '),
      ),
  );

  return { title: node.canonical_name, el };
}
