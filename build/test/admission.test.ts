import { fileURLToPath } from 'node:url';
import { stringify } from 'yaml';
import { describe, expect, it } from 'vitest';
import { renderJson, renderText } from '../src/admission/report.js';
import { normalizeName, validateDossier } from '../src/admission/validate.js';
import { makeTree } from './helpers.js';

const ROOT = fileURLToPath(new URL('../..', import.meta.url));

function baseDossier(): Record<string, unknown> {
  return {
    dossier_schema: '1.0.0',
    candidate: {
      id: 'test-decomposition',
      canonical_name: 'Test decomposition',
      local_names: [],
      acronyms: ['TD'],
      originating_fields: ['numerical-analysis'],
      proposed_node_type: 'operation',
      proposed_disposition: 'propose-node',
      possible_matches: [],
    },
    source_inventory: [
      {
        id: 'source-one',
        kind: 'textbook',
        title: 'A source',
        year: 2020,
        locator: 'p. 1',
        supplied_by: 'test',
      },
    ],
    claims: [
      {
        id: 'claim-one',
        proposition: 'Test decomposition is a change of representation.',
        endpoints: { from: 'test-decomposition', to: 'change-of-representation' },
        proposed_edge: { type: 'IS-A', strength: 'special-case', context: 'Test context.' },
        mathematical_skeleton: 'A basis changes.',
        scope: 'Finite test objects.',
        assumptions: ['test assumption'],
        validity_regime: 'Test regime.',
        caveats: ['test caveat'],
        counterexamples: ['test counterexample'],
        source_assessments: [
          {
            source_id: 'source-one',
            proposition: 'The exact proposition.',
            status: 'direct-support',
            location: 'p. 1',
            assessor: { kind: 'human', identity: 'tester', version: '1' },
          },
        ],
        possible_falsifiers: ['A counterexample.'],
        alternative_interpretations: ['An example instead.'],
      },
    ],
    search: {
      queries: [{ id: 'query-one', query: 'test', dialects: ['TD'], designed_by: 'tester' }],
      history: [
        {
          query_id: 'query-one',
          result: 'located',
          source_ids: ['source-one'],
          executed_by: 'tester',
        },
      ],
    },
    generated_hypotheses: [],
    automated_judgments: [],
    adversarial_reviews: [],
    human_decisions: [],
    workflow: {
      state: 'assessed',
      history: [
        { from: null, to: 'harvested', reason: 'test', actor: 'tester' },
        { from: 'harvested', to: 'normalized', reason: 'test', actor: 'tester' },
        { from: 'normalized', to: 'dossier-ready', reason: 'test', actor: 'tester' },
        { from: 'dossier-ready', to: 'evidence-collected', reason: 'test', actor: 'tester' },
        { from: 'evidence-collected', to: 'assessed', reason: 'test', actor: 'tester' },
      ],
    },
  };
}

function writeDossier(dossier: Record<string, unknown>): string {
  const directory = makeTree({ 'candidate.yaml': stringify(dossier) });
  return `${directory}/candidate.yaml`;
}

function ruleIds(dossier: Record<string, unknown>): string[] {
  return validateDossier(ROOT, writeDossier(dossier)).rule_results.map((rule) => rule.rule_id);
}

function acceptDossier(
  dossier: Record<string, unknown>,
  disposition: 'accepted-as-node' | 'accepted-as-edge',
): void {
  dossier.human_decisions = [
    { id: 'decision-one', reviewer: 'tester', disposition, reason: 'Approved for testing.' },
  ];
  const workflow = dossier.workflow as {
    state: string;
    history: Record<string, unknown>[];
  };
  workflow.history.push(
    { from: 'assessed', to: 'automated-review-passed', reason: 'test', actor: 'tester' },
    {
      from: 'automated-review-passed',
      to: 'human-review',
      reason: 'test',
      actor: 'tester',
    },
    { from: 'human-review', to: disposition, reason: 'test', actor: 'tester' },
  );
  workflow.state = disposition;
}

describe('candidate dossier validation', () => {
  it('normalizes case, punctuation, whitespace, diacritics, and transparent plurals', () => {
    expect(normalizeName('  Singular-values & Décompositions ')).toBe(
      'singular value and decomposition',
    );
  });

  it('reports schema failures', () => {
    const dossier = baseDossier();
    dossier.dossier_schema = '2.0.0';
    expect(ruleIds(dossier)).toContain('admission/schema-version');
  });

  it('reuses the trusted validator for exact duplicate edges', () => {
    const dossier = baseDossier();
    const claim = (dossier.claims as Record<string, unknown>[])[0]!;
    claim.endpoints = { from: 'eigenvalues', to: 'stability' };
    claim.proposed_edge = { type: 'GOVERNS', strength: 'theorem', context: 'duplicate test' };
    const report = validateDossier(ROOT, writeDossier(dossier));
    expect(
      report.rule_results.some(
        (rule) =>
          rule.rule_id === 'admission/trusted-rule' && rule.reason.includes('edge/duplicate'),
      ),
    ).toBe(true);
  });

  it('reuses schema directionality for reversed symmetric duplicates', () => {
    const dossier = baseDossier();
    const claim = (dossier.claims as Record<string, unknown>[])[0]!;
    claim.endpoints = { from: 'complex-analysis', to: 'eigenvalues' };
    claim.proposed_edge = {
      type: 'SAME-SKELETON',
      strength: 'strong-analogy',
      context: 'reversed duplicate test',
    };
    const report = validateDossier(ROOT, writeDossier(dossier));
    expect(
      report.rule_results.some(
        (rule) =>
          rule.rule_id === 'admission/trusted-rule' && rule.reason.includes('edge/duplicate'),
      ),
    ).toBe(true);
  });

  it('verifies promoted terminal content instead of re-proposing it as a duplicate', () => {
    const dossier = baseDossier();
    const candidate = dossier.candidate as Record<string, unknown>;
    candidate.id = 'eigenvalues';
    candidate.canonical_name = 'Eigenvalues and spectral decomposition';
    candidate.proposed_node_type = 'operation';
    candidate.proposed_disposition = 'merge-or-refine';
    const claim = (dossier.claims as Record<string, unknown>[])[0]!;
    claim.endpoints = { from: 'eigenvalues', to: 'stability' };
    claim.proposed_edge = {
      type: 'GOVERNS',
      strength: 'theorem',
      context:
        'Local stability of linear(ized) dynamics is the sign pattern of the eigenvalue real parts; imaginary parts add oscillation.',
    };
    acceptDossier(dossier, 'accepted-as-node');

    const report = validateDossier(ROOT, writeDossier(dossier));
    expect(
      report.rule_results.filter((rule) => rule.rule_id === 'admission/promotion-present'),
    ).toHaveLength(2);
    expect(report.rule_results.some((rule) => rule.reason.includes('edge/duplicate'))).toBe(false);
    expect(report.recommendation).toMatchObject({
      disposition: 'accepted-as-node',
      human_decision_required: false,
    });
  });

  it('fails a terminal dossier when approved content is absent from the trusted atlas', () => {
    const dossier = baseDossier();
    acceptDossier(dossier, 'accepted-as-node');
    const report = validateDossier(ROOT, writeDossier(dossier));
    expect(report.rule_results.some((rule) => rule.rule_id === 'admission/promotion-missing')).toBe(
      true,
    );
  });

  it('reuses the trusted deliberate non-edge ledger', () => {
    const dossier = baseDossier();
    const claim = (dossier.claims as Record<string, unknown>[])[0]!;
    claim.endpoints = { from: 'kalman-filter', to: 'hidden-markov-model' };
    claim.proposed_edge = {
      type: 'ANALOGOUS-TO',
      strength: 'heuristic-analogy',
      context: 'deliberate non-edge test',
    };
    const report = validateDossier(ROOT, writeDossier(dossier));
    expect(
      report.rule_results.some(
        (rule) =>
          rule.rule_id === 'admission/trusted-rule' &&
          rule.reason.includes('non-edge/contradiction'),
      ),
    ).toBe(true);
  });

  it('recommends an existing record for an exact supplied alias', () => {
    const dossier = baseDossier();
    const candidate = dossier.candidate as Record<string, unknown>;
    candidate.local_names = [
      {
        name: 'principal components / explained variance / singular values',
        field: 'statistics',
        source_ids: ['source-one'],
      },
    ];
    const report = validateDossier(ROOT, writeDossier(dossier));
    expect(report.matches.some((match) => match.slug === 'eigenvalues')).toBe(true);
    expect(report.recommendation.disposition).toBe('merge-or-refine');
  });

  it('rejects invalid workflow transitions', () => {
    const dossier = baseDossier();
    dossier.workflow = {
      state: 'assessed',
      history: [{ from: null, to: 'assessed', reason: 'skipped every state', actor: 'tester' }],
    };
    expect(ruleIds(dossier)).toContain('admission/workflow-transition');
  });

  it('keeps co-mention separate from support and validates evidence statuses', () => {
    const dossier = baseDossier();
    const claim = (dossier.claims as Record<string, unknown>[])[0]!;
    const assessment = (claim.source_assessments as Record<string, unknown>[])[0]!;
    assessment.status = 'irrelevant-co-mention';
    const ids = ruleIds(dossier);
    expect(ids).toContain('admission/evidence-co-mention');
    expect(ids).toContain('admission/claim-support');

    assessment.status = 'popular-vote';
    expect(ruleIds(dossier)).toContain('admission/evidence-status');
  });

  it('requires a pinpoint locator for supporting evidence', () => {
    const dossier = baseDossier();
    const claim = (dossier.claims as Record<string, unknown>[])[0]!;
    const assessment = (claim.source_assessments as Record<string, unknown>[])[0]!;
    assessment.location = 'the relevant stability chapter';
    expect(ruleIds(dossier)).toContain('admission/evidence-pinpoint');

    assessment.location = 'Chapter 4, §4.2, pp. 126–132';
    expect(ruleIds(dossier)).not.toContain('admission/evidence-pinpoint');
  });

  it('reports failed retrieval only as bounded search history', () => {
    const dossier = baseDossier();
    const search = dossier.search as Record<string, unknown>;
    search.history = [
      {
        query_id: 'query-one',
        result: 'not-located',
        source_ids: [],
        executed_by: 'tester',
      },
    ];
    const report = validateDossier(ROOT, writeDossier(dossier));
    expect(report.rule_results.map((rule) => rule.rule_id)).toContain(
      'admission/retrieval-not-absence',
    );
    expect(
      report.rule_results.find((rule) => rule.rule_id === 'admission/retrieval-not-absence')
        ?.reason,
    ).toContain('not evidence');
  });

  it('renders byte-stable JSON and text for identical input', () => {
    const file = writeDossier(baseDossier());
    const first = validateDossier(ROOT, file);
    const second = validateDossier(ROOT, file);
    expect(renderJson([first])).toBe(renderJson([second]));
    expect(renderText([first])).toBe(renderText([second]));
  });
});
