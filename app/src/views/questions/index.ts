/**
 * The open-questions view (spec §5.5, ROADMAP M5): the research-gap pipeline
 * as a page. Every POSSIBLE-MISSING-MIGRATION / speculative edge, grouped by
 * its §35 workflow status, with the claim, its notes, and the verification
 * checklist — hypotheses with a workflow, never findings (spec §1). The
 * wiki-linked-but-unedged pairs (the validator's info level) close the page
 * as the curation queue.
 */
import { REPO_URL } from '../../config';
import type { Atlas } from '../../data/atlas';
import { h, joinChildren } from '../common/dom';
import { downloadBlock } from '../common/downloads';
import { edgeClaim } from '../common/edge-claim';
import { nodeLink } from '../common/node-link';
import type { View } from '../common/view';
import { proposeHash } from '../propose';

const WORKFLOW_DOC = 'docs/research-gap-workflow.md';

/** The §35 checklist, compressed; the linked doc carries the full text. */
const WORKFLOW_STEPS: (string | HTMLElement)[][] = [
  ['Identify a structural analogy — shared operators or loop structure, not a shared metaphor.'],
  [
    'Search the target field under source terminology and likely local dialects (the ',
    h('a', { href: '#/dialects' }, 'dialect tables'),
    ' are the checklist of vocabularies to search under).',
  ],
  ['Decide: absent, renamed, technically inappropriate, or already standard?'],
  ['If rare, identify which assumptions fail in the target system (the ASSUMES edges).'],
  ['Ask whether a generalized version of the method survives those failures.'],
  [
    'Record the verdict as data: update the edge status, or convert it to MIGRATED-TO / FIELD-DIALECT-OF — and cite what the check found as `evidence` keys into graph/references.bib, so the literature trail renders here with the claim.',
  ],
];

export function questionsView(atlas: Atlas): View {
  const gaps = atlas.gapEdges();
  const byStatus = new Map<string, typeof gaps>();
  for (const edge of gaps) {
    const status = edge.status ?? 'open-candidate';
    const list = byStatus.get(status);
    if (list) list.push(edge);
    else byStatus.set(status, [edge]);
  }

  const sections = atlas.schema.gap_statuses
    .filter((status) => byStatus.has(status.id))
    .map((status) => {
      const edges = byStatus.get(status.id)!;
      return h(
        'section',
        { class: 'gap-group' },
        h(
          'h2',
          {},
          status.id.replace(/-/g, ' '),
          h('span', { class: 'dim' }, ` (${String(edges.length)})`),
        ),
        h('p', { class: 'section-hint' }, status.description.trim()),
        h(
          'ul',
          { class: 'connection-list' },
          edges.map((edge) => edgeClaim(atlas, edge)),
        ),
      );
    });

  const candidates = atlas.metrics.candidate_edges;

  const el = h(
    'div',
    { class: 'questions content' },
    h('header', { class: 'page-header' }, h('h1', {}, 'Open questions')),
    h(
      'p',
      { class: 'tagline' },
      'Candidate missing migrations — machinery mature in one field with no located counterpart in a structurally similar one. Each is a hypothesis with a verification workflow, never a finding.',
    ),
    h(
      'p',
      { class: 'trusted-note' },
      `${String(gaps.length)} speculative claims are tracked, every one carrying its workflow status below. `,
      'They are excluded from the ',
      h('a', { href: '#/metrics' }, 'metrics'),
      ' and from default ',
      h('a', { href: '#/path' }, 'path'),
      ' chains until verified.',
    ),
    sections,
    h(
      'section',
      { class: 'workflow' },
      h('h2', {}, 'How to investigate one'),
      h(
        'p',
        { class: 'section-hint' },
        'The §35 workflow keeps vocabulary differences from masquerading as research gaps:',
      ),
      h(
        'ol',
        { class: 'workflow-steps' },
        WORKFLOW_STEPS.map((step) => h('li', {}, step)),
      ),
      h(
        'p',
        { class: 'section-hint' },
        'Full workflow, with the worked margins-in-biology example: ',
        h('a', { href: `${REPO_URL}/blob/main/${WORKFLOW_DOC}` }, WORKFLOW_DOC),
        '.',
      ),
    ),
    h(
      'section',
      { class: 'candidate-edges' },
      h('h2', {}, `Candidate edges (${String(candidates.length)})`),
      h(
        'p',
        { class: 'section-hint' },
        'Wiki-linked in prose but not yet claimed as a typed edge — the build reports these at info level as the curation queue. Prose links are navigation; an edge is a deliberate claim. Each “propose” opens the composer with the pair filled in.',
      ),
      h(
        'ul',
        { class: 'candidate-list' },
        candidates.map((pair) =>
          h(
            'li',
            {},
            joinChildren([nodeLink(atlas, pair.a), nodeLink(atlas, pair.b)], ' ↔ '),
            ' · ',
            h(
              'a',
              { class: 'propose-candidate', href: proposeHash({ from: pair.a, to: pair.b }) },
              'propose',
            ),
          ),
        ),
      ),
    ),
    downloadBlock(),
  );

  return { title: 'Open questions', el };
}
