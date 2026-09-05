/**
 * The work queue (UI_REDESIGN.md §4.6, ROADMAP M11): #/questions' sibling
 * for MECHANICAL curation signals. What should the atlas grow next, and on
 * what evidence? Every item is computed at build time from the data itself
 * (metrics.queue) and carries its machine-checkable "why" inline — plain
 * shared-neighbor counting, edge counting, exact string identity — plus a
 * prefilled action. The queue is the anti-arbitrariness instrument: growth
 * is demand-driven, and drafting assistance never gets selection authority.
 *
 * The reject ledger (graph/non-edges.yaml → non_edges) renders at the end
 * as deliberate non-connections: for this project, "we checked, and these
 * are false friends" is content, not bookkeeping.
 */
import { REPO_URL } from '../../config';
import type { Atlas } from '../../data/atlas';
import type { BridgeDeficit, GraphEdge } from '../../data/types';
import { communityChip } from '../common/badges';
import { h, joinChildren, type Child } from '../common/dom';
import { edgeClaim } from '../common/edge-claim';
import { nodeLink } from '../common/node-link';
import type { View } from '../common/view';
import { proposeHash } from '../propose';

function issueUrl(params: Record<string, string>): string {
  return `${REPO_URL}/issues/new?${new URLSearchParams(params).toString()}`;
}

/** The graph/non-edges.yaml entry a "record a non-edge" action lands as. */
export function nonEdgeYamlBlock(a: string, b: string): string {
  const [x, y] = [a, b].sort();
  return [
    `- between: [${x}, ${y}]`,
    `  reason: "why the pair stays unconnected — false friends? already represented through a third concept?"`,
  ].join('\n');
}

/**
 * Prefilled issue for recording a reviewed non-connection. No dedicated
 * form exists (the ledger is a maintainer file), so this is a plain
 * prefilled issue carrying the ready-to-paste ledger entry — the M10
 * mechanism, one artifact smaller.
 */
export function nonEdgeIssueUrl(atlas: Atlas, a: string, b: string, why: string): string {
  const name = (slug: string): string => atlas.node(slug)?.canonical_name ?? slug;
  return issueUrl({
    title: `non-edge: ${a} ↔ ${b}`,
    labels: 'content',
    body:
      `A reviewed decision NOT to connect **${name(a)}** and **${name(b)}** ` +
      `(the \`graph/non-edges.yaml\` ledger — ARCHITECTURE.md §3.8). ` +
      `Recording it suppresses the pair from the work queue for good.\n\n` +
      '```yaml\n' +
      nonEdgeYamlBlock(a, b) +
      '\n```\n\n' +
      `Queue evidence at filing time: ${why}\n`,
  });
}

/** Prefilled alias-wanted issue for a dialect-gap item. */
export function aliasIssueUrl(atlas: Atlas, slug: string, field: string): string {
  const name = atlas.node(slug)?.canonical_name ?? slug;
  return issueUrl({
    title: `alias: ${slug} in ${field}`,
    labels: 'content',
    body:
      `The atlas lists **${name}** (\`${slug}\`) as used in ` +
      `**${atlas.fieldLabel(field)}** but records no local name for it there — ` +
      `a dialect-gap item from the work queue. If the field has a standard ` +
      `name for this structure, add it to \`concepts/${slug}.md\`:\n\n` +
      '```yaml\naliases:\n  - name: <the local term>\n    field: ' +
      field +
      '\n```\n\n' +
      `If the field genuinely uses the canonical name unchanged, say so here ` +
      `so the gap can be closed as reviewed.\n`,
  });
}

/** Prefilled node-proposal issue for a recurring-assumptions item. */
export function assumptionIssueUrl(atlas: Atlas, assumption: string, slugs: string[]): string {
  const names = slugs.map((s) => atlas.node(s)?.canonical_name ?? s);
  return issueUrl({
    template: 'node-proposal.yml',
    title: `node: ${assumption}`,
    summary:
      `Written identically as a free-text assumption on ${String(slugs.length)} concepts ` +
      `(${names.join('; ')}) — the work queue's recurring-assumptions signal. ` +
      `An assumption shared this widely may deserve its own page, so its ` +
      `failure modes and replacements can be recorded once.`,
    connections: slugs.map((s) => `${s} —ASSUMES→ <the new node>`).join('\n'),
  });
}

/** One queue section: the machine rule as the hint, then the items. */
function section(
  title: string,
  count: number,
  why: Child[],
  list: HTMLElement | null,
  empty: string,
): HTMLElement {
  return h(
    'section',
    { class: 'queue-signal' },
    h('h2', {}, title, h('span', { class: 'dim' }, ` (${String(count)})`)),
    h('p', { class: 'section-hint' }, why),
    count > 0 && list,
    count === 0 && h('p', { class: 'empty-state' }, empty),
  );
}

const actionSep = ' · ';

export function queueView(atlas: Atlas, opts: { bridge?: string } = {}): View {
  const queue = atlas.queue;
  const metrics = atlas.metrics;
  const bridge = opts.bridge && /^\d+-\d+$/.test(opts.bridge) ? `bridge-${opts.bridge}` : undefined;

  // ---- candidate edges (wiki-linked, unedged — exists since M1) ----------
  const candidates = metrics.candidate_edges;
  const candidateSection = section(
    'Candidate edges',
    candidates.length,
    [
      'Wiki-linked in prose but not yet claimed as a typed edge. Prose links are navigation; an edge is a deliberate claim — each “propose” opens the ',
      h('a', { href: '#/propose' }, 'composer'),
      ' with the pair filled in.',
    ],
    h(
      'ul',
      { class: 'candidate-list' },
      candidates.map((pair) =>
        h(
          'li',
          {},
          joinChildren([nodeLink(atlas, pair.a), nodeLink(atlas, pair.b)], ' ↔ '),
          actionSep,
          h(
            'a',
            { class: 'propose-candidate', href: proposeHash({ from: pair.a, to: pair.b }) },
            'propose',
          ),
        ),
      ),
    ),
    'Every wiki-linked pair carries a typed edge — the prose and the graph agree.',
  );

  // ---- link suggestions (shared trusted witnesses) ------------------------
  const suggestions = queue.link_suggestions;
  const suggestionSection = section(
    'Link suggestions',
    suggestions.length,
    [
      'Unconnected pairs sharing at least two neighbors in the ',
      h('a', { href: '#/metrics' }, 'trusted subgraph'),
      ' — plain shared-neighbor counting, witnesses listed. A suggestion is a question, never a claim: the honest answers are a typed edge or a recorded non-edge.',
    ],
    h(
      'ul',
      { class: 'queue-list suggestion-list' },
      suggestions.map((s) => {
        const witnessesText = `${String(s.witnesses.length)} shared trusted neighbors`;
        return h(
          'li',
          {},
          joinChildren([nodeLink(atlas, s.a), nodeLink(atlas, s.b)], ' ↔ '),
          h(
            'span',
            { class: 'dim' },
            ` — ${witnessesText}: `,
            joinChildren(
              s.witnesses.map((w) => nodeLink(atlas, w)),
              ', ',
            ),
          ),
          actionSep,
          h(
            'a',
            { class: 'propose-candidate', href: proposeHash({ from: s.a, to: s.b }) },
            'propose',
          ),
          actionSep,
          h(
            'a',
            {
              class: 'propose-candidate',
              href: nonEdgeIssueUrl(
                atlas,
                s.a,
                s.b,
                `${witnessesText} (${s.witnesses.join(', ')})`,
              ),
            },
            'record a non-edge',
          ),
        );
      }),
    ),
    'No unconnected pair shares two trusted neighbors.',
  );

  // ---- bridge deficits (community pairs with ≤ 1 trusted edge) -----------
  // Members and hubs are display joins over metrics.nodes: the hub is the
  // community's highest trusted degree (ties alphabetical), the honest
  // starting point for inspecting or proposing a crossing.
  const byCommunity = new Map<number, { slug: string; degree: number }[]>();
  for (const node of atlas.nodes) {
    const m = atlas.nodeMetrics(node.slug);
    if (!m || m.community === null) continue;
    const list = byCommunity.get(m.community) ?? [];
    list.push({ slug: node.slug, degree: m.degree });
    byCommunity.set(m.community, list);
  }
  for (const list of byCommunity.values()) {
    list.sort((a, b) => b.degree - a.degree || a.slug.localeCompare(b.slug));
  }
  const hubOf = (community: number): string | undefined => byCommunity.get(community)?.[0]?.slug;
  const bridgeEdge = (ref: BridgeDeficit['edges'][number]): GraphEdge | undefined =>
    atlas
      .edgesBetween(ref.from, ref.to)
      .find((e) => e.type === ref.type && e.from === ref.from && e.to === ref.to);

  const deficits = queue.bridge_deficits;
  const deficitSection = section(
    'Bridge deficits',
    deficits.length,
    [
      'Pairs of trusted-subgraph communities (the clusters named in ',
      h('a', { href: '#/metrics' }, 'metrics'),
      ') joined by at most one trusted edge — the map’s structural holes, counted. The busiest members of each side are the honest place to start looking for the missing translation.',
    ],
    h(
      'ul',
      { class: 'deficit-list' },
      deficits.map((d) => {
        const [ca, cb] = d.communities;
        const members = (c: number): Child[] =>
          joinChildren(
            (byCommunity.get(c) ?? []).slice(0, 3).map((m) => nodeLink(atlas, m.slug)),
            ', ',
          );
        const hubA = hubOf(ca);
        const hubB = hubOf(cb);
        const bridges = d.edges.map(bridgeEdge).filter((e): e is GraphEdge => e !== undefined);
        const id = `bridge-${String(ca)}-${String(cb)}`;
        return h(
          'li',
          // The matrix's "empty between two communities?" links land here
          // (#/queue?bridge=<a>-<b>), on the exact deficit item (M12).
          { id, ...(bridge === id ? { class: 'highlight' } : {}) },
          h(
            'p',
            { class: 'deficit-head' },
            communityChip(ca),
            ' ↔ ',
            communityChip(cb),
            h(
              'span',
              { class: 'dim' },
              d.edges.length === 0
                ? ' — no trusted edge joins these clusters.'
                : ' — one trusted edge joins these clusters:',
            ),
          ),
          bridges.length > 0 &&
            h(
              'ul',
              { class: 'connection-list compact' },
              bridges.map((e) => edgeClaim(atlas, e, { notes: false })),
            ),
          h(
            'p',
            { class: 'deficit-members dim' },
            'Busiest members — ',
            communityChip(ca),
            ' ',
            members(ca),
            ' · ',
            communityChip(cb),
            ' ',
            members(cb),
          ),
          hubA &&
            hubB &&
            h(
              'p',
              { class: 'deficit-actions' },
              h(
                'a',
                { class: 'propose-candidate', href: `#/path/${hubA}/${hubB}` },
                'today’s chains between the hubs',
              ),
              actionSep,
              h(
                'a',
                { class: 'propose-candidate', href: proposeHash({ from: hubA, to: hubB }) },
                'propose an edge',
              ),
            ),
        );
      }),
    ),
    'Every pair of communities is joined by at least two trusted edges.',
  );

  // ---- recurring assumptions ----------------------------------------------
  const recurring = queue.recurring_assumptions;
  const recurringSection = section(
    'Recurring assumptions',
    recurring.length,
    [
      'The identical free-text ',
      h('code', {}, 'assumptions'),
      ' string (normalized for case and spacing) on two or more nodes. A license shared that widely may deserve its own page, so its failure modes are recorded once — assumption tracking is a spec priority (§5.3).',
    ],
    h(
      'ul',
      { class: 'queue-list' },
      recurring.map((item) =>
        h(
          'li',
          {},
          h('q', {}, item.assumption),
          h('span', { class: 'dim' }, ' — written identically on: '),
          joinChildren(
            item.slugs.map((s) => nodeLink(atlas, s)),
            ', ',
          ),
          actionSep,
          h(
            'a',
            {
              class: 'propose-candidate',
              href: assumptionIssueUrl(atlas, item.assumption, item.slugs),
            },
            'propose a node',
          ),
        ),
      ),
    ),
    'No free-text assumption recurs verbatim across nodes.',
  );

  // ---- dialect gaps, grouped by node --------------------------------------
  const gapsByNode = new Map<string, string[]>();
  for (const gap of queue.dialect_gaps) {
    const list = gapsByNode.get(gap.slug) ?? [];
    list.push(gap.field);
    gapsByNode.set(gap.slug, list);
  }
  const dialectSection = section(
    'Dialect gaps',
    queue.dialect_gaps.length,
    [
      'Fields a concept claims membership in with no recorded local name, on concepts that already carry two or more dialects (see the ',
      h('a', { href: '#/dialects' }, 'dialect lookup'),
      ') — holes in real dialect tables. Each field links an alias-wanted issue; “the field uses the canonical name” is also an answer.',
    ],
    h(
      'ul',
      { class: 'queue-list' },
      [...gapsByNode.entries()].map(([slug, fields]) =>
        h(
          'li',
          {},
          nodeLink(atlas, slug),
          h('span', { class: 'dim' }, ' — no local name recorded for: '),
          joinChildren(
            fields.map((field) =>
              h(
                'a',
                {
                  class: 'propose-candidate',
                  href: aliasIssueUrl(atlas, slug, field),
                  title: `Propose the ${atlas.fieldLabel(field)} name for this concept`,
                },
                atlas.fieldLabel(field),
              ),
            ),
            ', ',
          ),
        ),
      ),
    ),
    'Every multi-dialect concept names all of its fields.',
  );

  // ---- thin symptoms -------------------------------------------------------
  const thin = queue.thin_symptoms;
  const thinSection = section(
    'Thin symptoms',
    thin.length,
    [
      'Symptoms below the useful floor for the recognition index: fewer than two moves, or no worked example. The fix is content, so the action is the file itself.',
    ],
    h(
      'ul',
      { class: 'queue-list' },
      thin.map((s) => {
        const why = [
          s.move_count < 2 ? `${String(s.move_count)} move${s.move_count === 1 ? '' : 's'}` : '',
          s.has_worked_example ? '' : 'no worked example',
        ]
          .filter((part) => part.length > 0)
          .join(', ');
        return h(
          'li',
          {},
          h('a', { href: `#/s/${s.id}` }, atlas.symptom(s.id)?.symptom ?? s.id),
          h('span', { class: 'dim' }, ` — ${why}`),
          actionSep,
          h(
            'a',
            {
              class: 'propose-candidate',
              href: `${REPO_URL}/blob/main/graph/symptoms.yaml`,
            },
            'edit symptoms.yaml',
          ),
        );
      }),
    ),
    'Every symptom carries at least two moves and a worked example.',
  );

  // ---- underconnected applications (the M7 warn, as a display join) -------
  const underconnected = atlas
    .nodesOfType('application')
    .map((node) => ({ node, structures: atlas.convergingStructures(node.slug) }))
    .filter((entry) => entry.structures.length < 2);
  const underconnectedSection = section(
    'Underconnected applications',
    underconnected.length,
    [
      'Application nodes with fewer than two distinct structures converging on them over APPLIED-IN / MIGRATED-TO edges — the validator’s spec §8.8 warning, rendered. Below the bar, the content belongs on the structure’s page as a canonical example.',
    ],
    h(
      'ul',
      { class: 'queue-list' },
      underconnected.map(({ node, structures }) =>
        h(
          'li',
          {},
          nodeLink(atlas, node.slug),
          h(
            'span',
            { class: 'dim' },
            ` — ${String(structures.length)} converging structure${structures.length === 1 ? '' : 's'}`,
          ),
          actionSep,
          h(
            'a',
            { class: 'propose-candidate', href: proposeHash({ to: node.slug }) },
            'propose a converging edge',
          ),
        ),
      ),
    ),
    'Every application clears the two-structures bar.',
  );

  // ---- unused references (the M8 info rule, as a display join) ------------
  const citedKeys = new Set(atlas.edges.flatMap((e) => e.evidence));
  const unused = atlas.data.references.filter((ref) => !citedKeys.has(ref.key));
  const unusedSection = section(
    'Unused references',
    unused.length,
    [
      'Entries in ',
      h('code', {}, 'graph/references.bib'),
      ' cited by no edge — either a claim deserves the citation, or the entry can go.',
    ],
    h(
      'ul',
      { class: 'queue-list' },
      unused.map((ref) =>
        h(
          'li',
          {},
          h('code', {}, ref.key),
          h('span', { class: 'dim' }, ` — ${ref.fields['title'] ?? ''}`),
          actionSep,
          h(
            'a',
            { class: 'propose-candidate', href: `${REPO_URL}/blob/main/graph/references.bib` },
            'cite it or remove it',
          ),
        ),
      ),
    ),
    'Every reference is cited by at least one edge.',
  );

  // ---- deliberate non-connections (the ledger, rendered as content) -------
  const nonEdges = atlas.nonEdges;
  const nonEdgeList = h(
    'ul',
    { class: 'queue-list non-edge-list' },
    nonEdges.map((entry) =>
      h(
        'li',
        {},
        // Prose, not an arrow glyph: "A and B" under this section's heading
        // already reads as "reviewed and not connected".
        joinChildren(
          [nodeLink(atlas, entry.between[0]), nodeLink(atlas, entry.between[1])],
          ' and ',
        ),
        h('span', { class: 'dim' }, ` — ${entry.reason}`),
        entry.see &&
          h(
            'span',
            {},
            ' See ',
            atlas.node(entry.see)
              ? nodeLink(atlas, entry.see)
              : h('a', { href: entry.see }, entry.see.replace(/^https?:\/\//, '')),
            '.',
          ),
      ),
    ),
  );
  const nonEdgeSection = h(
    'section',
    { class: 'queue-signal non-edges' },
    h(
      'h2',
      {},
      'Deliberate non-connections',
      h('span', { class: 'dim' }, ` (${String(nonEdges.length)})`),
    ),
    h(
      'p',
      { class: 'section-hint' },
      'The reject ledger (',
      h('code', {}, 'graph/non-edges.yaml'),
      '): pairs reviewed and deliberately NOT connected, each with its reason. “We checked — false friends” is content here, not bookkeeping; a recorded pair never reappears above, and the validator fails the build if an edge ever contradicts an entry.',
    ),
    nonEdges.length > 0
      ? nonEdgeList
      : h('p', { class: 'empty-state' }, 'No non-connections recorded yet.'),
  );

  const el = h(
    'div',
    { class: 'queue content' },
    h('header', { class: 'page-header' }, h('h1', {}, 'Work queue')),
    h(
      'p',
      { class: 'tagline' },
      'What should this atlas grow next, and on what evidence? Every item below is a mechanical signal computed from the data at build time, shown with the evidence that produced it — selection without arbitrariness. Research-gap hypotheses keep their own epistemology in ',
      h('a', { href: '#/questions' }, 'Open questions'),
      '.',
    ),
    candidateSection,
    suggestionSection,
    deficitSection,
    recurringSection,
    dialectSection,
    thinSection,
    underconnectedSection,
    unusedSection,
    nonEdgeSection,
  );

  const onMount = bridge
    ? (): void => {
        el.querySelector(`#${bridge}`)?.scrollIntoView({ block: 'center' });
      }
    : undefined;

  return { title: 'Work queue', el, ...(onMount ? { onMount } : {}) };
}
