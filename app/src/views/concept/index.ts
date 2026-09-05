/**
 * The concept page — the atom of the app (spec §3.1, minus the ego-network,
 * which is M4): name + type badge, structural summary, dialect table,
 * assumptions with FAILS-WHEN / REPLACED-BY surfaced right beside them,
 * typed connections grouped by edge type, canonical examples, prose notes,
 * backlinks, provenance. On `application` nodes the connections block leads
 * with the Practitioner's anatomy — incoming structure claims grouped by
 * the structure's kind, roles first — and the derived assumption surface
 * (UI_REDESIGN.md §4.2, ROADMAP M13).
 */
import { REPO_URL } from '../../config';
import { APPLICATION_EDGE_TYPES, type Atlas } from '../../data/atlas';
import { assumptionTrail, trailUnfolds, type TrailStep } from '../../data/subgraph';
import type { GraphNode, NodeConnection } from '../../data/types';
import { clearTrail, readTrail, recordVisit } from '../../shell/local';
import { statusBadge, strengthBadge, typeBadge } from '../common/badges';
import { citeDetails, sourcesSection } from '../common/citations';
import { dialectTable } from '../common/dialect-table';
import { h, joinChildren } from '../common/dom';
import { connectionItem, GAP_EDGE_TYPE } from '../common/edge-sentence';
import { nodeLink } from '../common/node-link';
import type { View } from '../common/view';
import { atlasHash } from '../atlas';
import { compareHash } from '../compare';
import { mapHash } from '../map';
import { matrixHash } from '../matrix';
import { proposeHash } from '../propose';
import { walkHash } from '../walk';
import { egoSection } from './ego';
import { conceptMinimap } from './minimap';

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

/**
 * The assumption trail (UI_REDESIGN.md §4.2, ROADMAP M15): the ASSUMES
 * chain unfolded transitively as an indented claim tree — each line the
 * shared connection fragment, a branch that revisits a node stopping with
 * a label (cycles terminate on first revisit). Rendered as a disclosure
 * only when unfolding goes beyond the one-hop list already shown above it.
 */
function trailTree(atlas: Atlas, steps: TrailStep[]): HTMLUListElement {
  return h(
    'ul',
    { class: 'connection-list trail-level' },
    steps.map((step) => {
      const item = connectionItem(atlas, step.conn, { phrase: true });
      if (step.cycle)
        item.appendChild(
          h('span', { class: 'trail-cycle' }, ' — cycles back to an assumption on this branch'),
        );
      if (step.children.length > 0) item.appendChild(trailTree(atlas, step.children));
      return item;
    }),
  );
}

function countSteps(steps: TrailStep[]): number {
  return steps.reduce((sum, step) => sum + 1 + countSteps(step.children), 0);
}

function trailDisclosure(atlas: Atlas, slug: string): HTMLElement | null {
  const trail = assumptionTrail(atlas, slug);
  if (!trailUnfolds(trail)) return null;
  return h(
    'details',
    { class: 'assumption-trail' },
    h(
      'summary',
      {},
      `Trace assumptions — the transitive chain (${String(countSteps(trail))} claims)`,
    ),
    h(
      'p',
      { class: 'section-hint' },
      'What the assumptions themselves assume, unfolded until the chain bottoms out.',
    ),
    trailTree(atlas, trail),
  );
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
    trailDisclosure(atlas, node.slug),
  );
}

/**
 * "Appears in walks" backlinks (ROADMAP M9): every guided walk that steps
 * on this concept, linking straight to its step.
 */
function walksSection(atlas: Atlas, node: GraphNode) {
  const positions = atlas.walksThrough(node.slug);
  if (positions.length === 0) return null;
  return h(
    'section',
    { class: 'concept-section' },
    h('h2', {}, 'Appears in walks'),
    h(
      'p',
      { class: 'walk-backlinks' },
      joinChildren(
        positions.map(({ walk, index }) =>
          h(
            'span',
            { class: 'walk-backlink' },
            h('a', { href: walkHash(walk.id, index + 1) }, walk.title),
            ` (step ${String(index + 1)} of ${String(walk.steps.length)})`,
          ),
        ),
        ' · ',
      ),
    ),
  );
}

/**
 * Application anatomy (UI_REDESIGN.md §4.2, ROADMAP M13): the incoming
 * APPLIED-IN / MIGRATED-TO claims, grouped by the *structure's* node type,
 * each claim led by its edge context — the Practitioner reads roles first,
 * names second. A context written as "role: elaboration" gets its role
 * lead emphasized; the claim itself is the same typed sentence as
 * everywhere else (strength, citations, notes attached).
 */
function anatomyItem(atlas: Atlas, conn: NodeConnection): HTMLLIElement {
  const context = conn.context?.trim() ?? '';
  const split = context.indexOf(': ');
  const role = split > 0 ? context.slice(0, split) : null;
  const rest = role ? context.slice(split + 1).trimStart() : context;
  return h(
    'li',
    { class: 'connection anatomy-claim' },
    role && h('span', { class: 'anatomy-role' }, `${role}: `),
    rest && `${rest} `,
    h(
      'span',
      { class: 'anatomy-via' },
      context ? '— ' : '',
      conn.phrase,
      ' ',
      nodeLink(atlas, conn.other),
      ' ',
      strengthBadge(atlas, conn.strength),
    ),
    ' ',
    citeDetails(atlas, conn.evidence),
    conn.notes && h('p', { class: 'connection-notes' }, conn.notes.trim()),
  );
}

function anatomySection(atlas: Atlas, anatomy: NodeConnection[]): HTMLElement | null {
  if (anatomy.length === 0) return null;
  const rank = (id: string): number => atlas.strength(id)?.rank ?? 99;
  const groups = atlas.schema.node_types
    .map((t) => ({
      def: t,
      items: anatomy
        .filter((c) => atlas.node(c.other)?.node_type === t.id)
        .sort((a, b) => rank(a.strength) - rank(b.strength) || a.other.localeCompare(b.other)),
    }))
    .filter((g) => g.items.length > 0);
  return h(
    'section',
    { class: 'concept-section anatomy' },
    h('h2', {}, 'Application anatomy'),
    h(
      'p',
      { class: 'section-hint' },
      'The structures meeting in this system, grouped by kind — roles first, names second. Every line is a typed claim carrying its strength.',
    ),
    groups.map((group) =>
      h(
        'div',
        { class: 'anatomy-group' },
        h('h3', { class: 'anatomy-kind' }, typeBadge(atlas, group.def.id)),
        h(
          'ul',
          { class: 'connection-list' },
          group.items.map((conn) => anatomyItem(atlas, conn)),
        ),
      ),
    ),
  );
}

/**
 * The assumption surface (UI_REDESIGN.md §4.2, ROADMAP M13): what this
 * application leans on — the union of the one-hop ASSUMES edges of every
 * connected structure, FAILS-WHEN / REPLACED-BY beside them exactly as on
 * structure pages. A pure display join over loaded data, and labeled as
 * derived: nothing here is stored on the application node.
 */
function assumptionSurface(atlas: Atlas, node: GraphNode): HTMLElement | null {
  interface Imported {
    via: string;
    conn: NodeConnection;
  }
  const leans: Imported[] = [];
  const breakdowns: Imported[] = [];
  for (const structure of atlas.convergingStructures(node.slug)) {
    const other = atlas.node(structure.other);
    if (!other) continue;
    for (const conn of other.connections) {
      if (conn.direction !== 'out') continue;
      if (conn.type === 'ASSUMES') leans.push({ via: structure.other, conn });
      else if (conn.type === 'FAILS-WHEN' || conn.type === 'REPLACED-BY')
        breakdowns.push({ via: structure.other, conn });
    }
  }
  if (leans.length === 0 && breakdowns.length === 0) return null;

  const byName = (a: Imported, b: Imported): number =>
    a.via.localeCompare(b.via) || a.conn.other.localeCompare(b.conn.other);
  const item = ({ via, conn }: Imported): HTMLLIElement =>
    h(
      'li',
      { class: `connection surface-item${conn.type === 'ASSUMES' ? '' : ' surface-breakdown'}` },
      nodeLink(atlas, via),
      ' ',
      h('span', { class: 'phrase' }, `${conn.phrase} `),
      nodeLink(atlas, conn.other),
      ' ',
      strengthBadge(atlas, conn.strength),
      conn.context && h('span', { class: 'context' }, ` — ${conn.context.trim()}`),
      ' ',
      citeDetails(atlas, conn.evidence),
    );

  return h(
    'section',
    { class: 'concept-section assumption-surface' },
    h('h2', {}, 'What this application leans on'),
    h(
      'p',
      { class: 'section-hint' },
      h('span', { class: 'chip derived-chip' }, 'derived'),
      ' Not stored on this node: the assumption (ASSUMES) claims of every structure above, with their breakdown edges beside them — the licensing conditions of the whole pipeline on one screen.',
    ),
    leans.length > 0 && h('ul', { class: 'connection-list' }, leans.sort(byName).map(item)),
    breakdowns.length > 0 && [
      h('p', { class: 'section-hint surface-breakdown-lead' }, 'And what breaks them:'),
      h('ul', { class: 'connection-list' }, breakdowns.sort(byName).map(item)),
    ],
  );
}

/**
 * The recently-visited trail (UI_REDESIGN.md §4.2, M14): a per-viewer
 * localStorage convenience — last few concept pages, clearable, rendered
 * only when something is stored and never state the app depends on.
 */
function trailStrip(atlas: Atlas, current: string): HTMLElement | null {
  const visited = readTrail().filter((slug) => slug !== current && atlas.node(slug));
  if (visited.length === 0) return null;
  const strip = h(
    'p',
    { class: 'visit-trail' },
    h('span', { class: 'dim' }, 'Recently visited: '),
    joinChildren(
      visited.map((slug) => nodeLink(atlas, slug)),
      ' · ',
    ),
    ' ',
  );
  const clear = h(
    'button',
    { type: 'button', class: 'link-button dim', title: 'Stored only in this browser' },
    'clear',
  );
  clear.addEventListener('click', () => {
    clearTrail();
    strip.remove();
  });
  strip.appendChild(clear);
  return strip;
}

/** The contribution front door (ROADMAP M10), one hop from every edge list. */
function proposeLine(slug: string): HTMLElement {
  return h(
    'p',
    { class: 'propose-line' },
    'Missing a connection? ',
    h('a', { href: proposeHash({ from: slug }) }, 'Propose an edge'),
    ' — composed against the schema, filed as a prefilled GitHub issue, reviewed as a claim.',
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

export function conceptView(atlas: Atlas, slug: string, at?: string): View | null {
  const node = atlas.node(slug);
  if (!node) return null;
  // The trail renders what was stored BEFORE this visit lands in it.
  const el = buildConcept(atlas, node);
  recordVisit(slug);

  // ?at=dialects (the map's row headers) lands the reader at the dialect
  // table; anything else — or a node without one — stays at the top.
  const onMount =
    at === 'dialects'
      ? (): void => {
          el.querySelector('#dialects')?.scrollIntoView();
        }
      : undefined;

  return { title: node.canonical_name, el, ...(onMount ? { onMount } : {}) };
}

function buildConcept(atlas: Atlas, node: GraphNode): HTMLElement {
  const adjacent = node.connections.filter(
    (c) => c.direction === 'out' && ASSUMPTION_ADJACENT.has(c.type),
  );
  // On application nodes the incoming structure claims move up into the
  // anatomy section (same neighbor definition as convergingStructures and
  // the validator's ≥ 2-structures bar); everything else stays grouped.
  const anatomy =
    node.node_type === 'application'
      ? node.connections.filter(
          (c) =>
            c.direction === 'in' &&
            APPLICATION_EDGE_TYPES.has(c.type) &&
            atlas.node(c.other)?.node_type !== 'application',
        )
      : [];
  const inAnatomy = new Set(anatomy);
  const grouped = groupConnections(
    atlas,
    node.connections.filter(
      (c) => !(c.direction === 'out' && ASSUMPTION_ADJACENT.has(c.type)) && !inAnatomy.has(c),
    ),
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
      // Situating links (UI_REDESIGN.md §4.2, ROADMAP M12 + M14): the survey
      // views with this concept highlighted. The map draws structure rows
      // only, so application nodes situate in the matrix alone; the atlas
      // link exists only for nodes the trusted constellation places.
      h(
        'p',
        { class: 'situate' },
        'See this concept in: ',
        h('a', { href: matrixHash({ filters: {}, focus: node.slug }) }, 'the matrix'),
        node.node_type !== 'application' && [
          ' · ',
          h('a', { href: mapHash({ focus: node.slug }) }, 'the map'),
        ],
        atlas.layout[node.slug] !== undefined && [
          ' · ',
          h('a', { href: atlasHash({ focus: node.slug }) }, 'the atlas'),
        ],
        ' — or ',
        h('a', { href: compareHash(node.slug) }, 'compare it with another concept'),
        '.',
      ),
      conceptMinimap(atlas, node.slug),
      trailStrip(atlas, node.slug),
    ),
    h('p', { class: 'summary' }, node.summary),
    dialects &&
      h(
        'section',
        { class: 'concept-section', id: 'dialects' },
        h('h2', {}, 'Dialects'),
        h('p', { class: 'section-hint' }, 'The same structure, as each field names it.'),
        dialects,
      ),
    assumptionsSection(atlas, node, adjacent),
    anatomySection(atlas, anatomy),
    anatomy.length > 0 && assumptionSurface(atlas, node),
    connectionsSection(atlas, grouped),
    proposeLine(node.slug),
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
    walksSection(atlas, node),
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

  return el;
}
