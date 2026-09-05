/**
 * The propose-an-edge composer (spec §8.1, ROADMAP M10): the contribution
 * front door. A reader composes a typed claim with pickers constrained to
 * the schema vocabularies already embedded in graph.json, reads it back as
 * a sentence and as the exact edges.yaml entry, and files it as a prefilled
 * GitHub issue — a static form deep-linking into the edge-proposal issue
 * template (the ARCHITECTURE.md §9 mechanism). Still no server and no
 * accounts on this side (spec §6); the validator remains the only gate.
 * Draft state lives entirely in the URL, like every view (§5.2).
 */
import { REPO_URL } from '../../config';
import type { Atlas } from '../../data/atlas';
import type { GraphEdge } from '../../data/types';
import { replaceHash } from '../../shell/router';
import { h } from '../common/dom';
import { edgeClaim } from '../common/edge-claim';
import { GAP_EDGE_TYPE } from '../common/edge-sentence';
import type { View } from '../common/view';

/** A proposal in progress; fields stay optional until the composer completes them. */
export interface ProposalDraft {
  from?: string;
  to?: string;
  type?: string;
  strength?: string;
  context?: string;
}

/** A draft with everything the issue prefill needs (context stays optional). */
export type CompleteProposal = ProposalDraft & {
  from: string;
  to: string;
  type: string;
  strength: string;
};

/** The issue-form file the prefill link addresses (`.github/ISSUE_TEMPLATE/`). */
export const EDGE_ISSUE_TEMPLATE = 'edge-proposal.yml';
/** Gap hypotheses go through their own form — they need the §35 workflow fields. */
export const GAP_ISSUE_TEMPLATE = 'gap-proposal.yml';

export function proposeHash(draft: ProposalDraft): string {
  const params = new URLSearchParams();
  if (draft.from) params.set('from', draft.from);
  if (draft.to) params.set('to', draft.to);
  if (draft.type) params.set('type', draft.type);
  if (draft.strength) params.set('strength', draft.strength);
  if (draft.context) params.set('context', draft.context);
  const query = params.toString();
  return query ? `#/propose?${query}` : '#/propose';
}

/**
 * The exact graph/edges.yaml entry the proposal lands as. Slugs, type and
 * strength ids are schema-constrained identifiers; the free-text context is
 * double-quoted via JSON string escaping, which is valid YAML quoting.
 */
export function edgeYamlBlock(p: CompleteProposal): string {
  const lines = [`- from: ${p.from}`, `  to: ${p.to}`, `  type: ${p.type}`];
  lines.push(`  strength: ${p.strength}`);
  const context = p.context?.trim();
  if (context) lines.push(`  context: ${JSON.stringify(context)}`);
  return lines.join('\n');
}

/** The claim read aloud, qualifiers included — the issue form's first field. */
export function claimSentence(
  p: CompleteProposal,
  reading: { fromName: string; toName: string; phrase: string },
): string {
  const context = p.context?.trim();
  const qualifier = p.strength.replace(/-/g, ' ') + (context ? `, ${context}` : '');
  return `${reading.fromName} ${reading.phrase} ${reading.toName} (${qualifier})`;
}

/**
 * The prefilled GitHub issue URL: query parameters address the edge-proposal
 * form's fields by id — `claim` (the sentence) and `edge` (the copy-pasteable
 * edges.yaml block a maintainer lands as an ordinary validated PR).
 */
export function proposalIssueUrl(
  p: CompleteProposal,
  reading: { fromName: string; toName: string; phrase: string },
): string {
  const params = new URLSearchParams({
    template: EDGE_ISSUE_TEMPLATE,
    title: `edge: ${p.from} —${p.type}→ ${p.to}`,
    claim: claimSentence(p, reading),
    edge: edgeYamlBlock(p),
  });
  return `${REPO_URL}/issues/new?${params.toString()}`;
}

/** Drop draft values the schema does not know (stale or mistyped URLs). */
function sanitize(atlas: Atlas, draft: ProposalDraft): ProposalDraft {
  const out: ProposalDraft = {};
  if (draft.from && atlas.node(draft.from)) out.from = draft.from;
  if (draft.to && atlas.node(draft.to)) out.to = draft.to;
  if (draft.type && draft.type !== GAP_EDGE_TYPE && atlas.edgeType(draft.type)) {
    out.type = draft.type;
  }
  if (draft.strength && draft.strength !== 'speculative' && atlas.strength(draft.strength)) {
    out.strength = draft.strength;
  }
  if (draft.context) out.context = draft.context;
  return out;
}

function conceptSelect(
  atlas: Atlas,
  cls: string,
  label: string,
  current: string | undefined,
  onChange: (slug: string | undefined) => void,
): { wrap: HTMLElement; select: HTMLSelectElement } {
  const nodes = [...atlas.nodes].sort((a, b) => a.canonical_name.localeCompare(b.canonical_name));
  const select = h('select', { class: `lens-select ${cls}`, 'aria-label': label });
  select.append(
    new Option('Choose…', '', false, current === undefined),
    ...nodes.map((n) => new Option(n.canonical_name, n.slug, false, n.slug === current)),
  );
  select.addEventListener('change', () => onChange(select.value || undefined));
  return {
    wrap: h(
      'label',
      { class: 'lens-filter' },
      h('span', { class: 'lens-filter-label' }, label),
      select,
    ),
    select,
  };
}

export function proposeView(atlas: Atlas, initial: ProposalDraft): View {
  const draft = sanitize(atlas, initial);
  const preview = h('div', { class: 'propose-preview' });
  const action = h('div', { class: 'propose-action' });

  // Pickers constrained to the schema vocabularies already in graph.json.
  // POSSIBLE-MISSING-MIGRATION and `speculative` are deliberately absent:
  // gap hypotheses carry workflow fields this form doesn't collect, so the
  // composer routes them to the research-gap issue form instead.
  const edgeTypes = atlas.schema.edge_types.filter((t) => t.id !== GAP_EDGE_TYPE);
  const strengths = atlas.schema.strengths.filter((s) => s.id !== 'speculative');

  const fromPicker = conceptSelect(atlas, 'propose-from', 'From concept', draft.from, (slug) => {
    draft.from = slug;
    render();
  });
  const toPicker = conceptSelect(atlas, 'propose-to', 'To concept', draft.to, (slug) => {
    draft.to = slug;
    render();
  });

  const typeSelect = h('select', { class: 'lens-select propose-type', 'aria-label': 'Edge type' });
  typeSelect.append(
    new Option('Choose…', '', false, draft.type === undefined),
    ...edgeTypes.map(
      (t) =>
        new Option(
          `${t.label} — ${t.directionality === 'symmetric' ? (t.phrase ?? '') : (t.forward ?? '')}`,
          t.id,
          false,
          t.id === draft.type,
        ),
    ),
  );
  typeSelect.addEventListener('change', () => {
    draft.type = typeSelect.value || undefined;
    render();
  });

  const strengthSelect = h('select', {
    class: 'lens-select propose-strength',
    'aria-label': 'Strength',
  });
  strengthSelect.append(
    new Option('Choose…', '', false, draft.strength === undefined),
    ...strengths.map(
      (s) => new Option(s.id.replace(/-/g, ' '), s.id, false, s.id === draft.strength),
    ),
  );
  const strengthHint = h('p', { class: 'section-hint strength-hint' });
  strengthSelect.addEventListener('change', () => {
    draft.strength = strengthSelect.value || undefined;
    render();
  });

  const contextInput = h('input', {
    class: 'propose-context',
    type: 'text',
    'aria-label': 'Context',
    placeholder: 'the conditions under which the claim holds',
    ...(draft.context ? { value: draft.context } : {}),
  });
  if (draft.context) contextInput.value = draft.context;
  contextInput.addEventListener('input', () => {
    draft.context = contextInput.value || undefined;
    render();
  });

  const swap = h(
    'button',
    {
      type: 'button',
      class: 'link-button propose-swap',
      onclick: () => {
        [draft.from, draft.to] = [draft.to, draft.from];
        fromPicker.select.value = draft.from ?? '';
        toPicker.select.value = draft.to ?? '';
        render();
      },
    },
    '⇄ swap',
  );

  const render = (): void => {
    replaceHash(proposeHash(draft));
    swap.hidden = !(draft.from ?? draft.to);
    strengthHint.textContent = draft.strength
      ? (atlas.strength(draft.strength)?.description ?? '')
      : 'Strengths are the map’s epistemic core: analogies must say they are analogies.';

    // What the map already claims between the chosen endpoints — the honest
    // check against proposing a duplicate (an exact one fails validation).
    const existing = draft.from && draft.to ? atlas.edgesBetween(draft.from, draft.to) : [];
    const existingBlock: HTMLElement | null =
      existing.length === 0
        ? null
        : h(
            'section',
            { class: 'propose-existing' },
            h('h2', {}, 'Already on the map between these two'),
            existing.some((e) => e.type === draft.type) &&
              h(
                'p',
                { class: 'section-hint' },
                'One of these has the same type — an exact duplicate fails validation. Propose a different relationship, or open an issue to amend the existing claim.',
              ),
            h(
              'ul',
              { class: 'connection-list' },
              existing.map((edge) => edgeClaim(atlas, edge, { from: draft.from })),
            ),
          );

    if (draft.from && draft.to && draft.from === draft.to) {
      preview.replaceChildren(
        h('p', { class: 'empty-state' }, 'Those are the same concept — pick two different ends.'),
      );
      action.replaceChildren();
      return;
    }
    if (!draft.from || !draft.to || !draft.type || !draft.strength) {
      const missing = [
        !draft.from && 'a from-concept',
        !draft.to && 'a to-concept',
        !draft.type && 'an edge type',
        !draft.strength && 'a strength',
      ].filter((m): m is string => typeof m === 'string');
      preview.replaceChildren(
        ...(existingBlock ? [existingBlock] : []),
        h(
          'p',
          { class: 'empty-state propose-missing' },
          `Still to pick: ${missing.join(', ')} — then the claim preview and the prefilled issue link appear here.`,
        ),
      );
      action.replaceChildren();
      return;
    }

    const complete = draft as CompleteProposal;
    const context = complete.context?.trim();
    // A claim is previewed exactly as it will render everywhere once landed,
    // via the shared fragment over a synthetic edge (evidence comes later,
    // through the issue's evidence field).
    const type = atlas.edgeType(complete.type);
    const claim: GraphEdge = {
      from: complete.from,
      to: complete.to,
      type: complete.type,
      strength: complete.strength,
      symmetric: type?.directionality === 'symmetric',
      evidence: [],
      ...(context ? { context } : {}),
    };
    const reading = {
      fromName: atlas.node(complete.from)!.canonical_name,
      toName: atlas.node(complete.to)!.canonical_name,
      phrase:
        type?.directionality === 'symmetric'
          ? (type.phrase ?? complete.type)
          : (type?.forward ?? complete.type),
    };

    preview.replaceChildren(
      h(
        'section',
        { class: 'propose-claim' },
        h('h2', {}, 'The claim, read aloud'),
        h('ul', { class: 'connection-list' }, edgeClaim(atlas, claim, { from: complete.from })),
      ),
      ...(existingBlock ? [existingBlock] : []),
      h(
        'section',
        { class: 'propose-as-data' },
        h('h2', {}, 'The edge, as data'),
        h(
          'p',
          { class: 'section-hint' },
          'The graph/edges.yaml entry this proposal lands as — the issue arrives with it prefilled, ready to copy-paste.',
        ),
        h('pre', { class: 'propose-yaml' }, h('code', {}, edgeYamlBlock(complete))),
      ),
    );
    action.replaceChildren(
      h(
        'a',
        { class: 'propose-file', href: proposalIssueUrl(complete, reading) },
        'File the prefilled proposal on GitHub →',
      ),
      h(
        'p',
        { class: 'section-hint' },
        'Opens the edge-proposal issue form with everything above filled in (a free GitHub account is all it takes). A maintainer lands accepted proposals as ordinary PRs — ',
        h('a', { href: `${REPO_URL}/blob/main/CONTRIBUTING.md` }, 'or open the PR yourself'),
        '; either way the validator is the review gate.',
      ),
    );
  };

  render();

  const el = h(
    'div',
    { class: 'propose content' },
    h('header', { class: 'page-header' }, h('h1', {}, 'Propose an edge')),
    h(
      'p',
      { class: 'tagline' },
      'An edge is a claim, and it is reviewed as one. Compose it here — no repository knowledge needed — and file it as a prefilled GitHub issue.',
    ),
    h(
      'div',
      { class: 'lens-controls', role: 'group', 'aria-label': 'Proposal fields' },
      fromPicker.wrap,
      toPicker.wrap,
      swap,
      h(
        'label',
        { class: 'lens-filter' },
        h('span', { class: 'lens-filter-label' }, 'Edge type'),
        typeSelect,
      ),
      h(
        'label',
        { class: 'lens-filter' },
        h('span', { class: 'lens-filter-label' }, 'Strength'),
        strengthSelect,
      ),
    ),
    strengthHint,
    h(
      'label',
      { class: 'lens-filter propose-context-field' },
      h('span', { class: 'lens-filter-label' }, 'Context / caveats (optional)'),
      contextInput,
    ),
    h(
      'p',
      { class: 'section-hint propose-gap-note' },
      'Hypothesizing a missing migration instead? Research-gap candidates carry a verification workflow, so they have ',
      h(
        'a',
        { href: `${REPO_URL}/issues/new?template=${GAP_ISSUE_TEMPLATE}` },
        'their own proposal form',
      ),
      '.',
    ),
    preview,
    action,
  );

  return { title: 'Propose an edge', el };
}
