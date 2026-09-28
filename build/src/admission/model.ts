import type { Severity } from '../model.js';

export type RuleKind = 'deterministic' | 'retrieval-dependent' | 'model-assisted';

export interface AdmissionRuleResult {
  rule_id: string;
  severity: Severity;
  kind: RuleKind;
  outcome: 'fail' | 'signal';
  subject: string;
  reason: string;
  provenance: string[];
}

export interface AdmissionMatch {
  slug: string;
  relationship: 'canonical-name' | 'alias' | 'acronym' | 'near-name';
  trigger: string;
  atlas_value: string;
  reason: string;
  provenance: string;
}

export interface GraphValueDimension {
  id: string;
  signal: 'present' | 'absent' | 'unknown';
  reason: string;
  provenance: string[];
}

export interface AdmissionReport {
  report_version: '1.0.0';
  dossier: {
    id: string;
    file: string;
    schema_version: string;
    workflow_state: string;
  };
  atlas: { schema_version: string; root: string };
  recommendation: {
    disposition: string;
    rationale: string;
    basis_rule_ids: string[];
    human_decision_required: boolean;
  };
  summary: { errors: number; warnings: number; signals: number };
  matches: AdmissionMatch[];
  graph_value: GraphValueDimension[];
  rule_results: AdmissionRuleResult[];
  supplied_judgments: {
    generated_hypotheses: unknown[];
    automated_judgments: unknown[];
    adversarial_reviews: unknown[];
    human_decisions: unknown[];
  };
}

export const DISPOSITIONS = new Set([
  'propose-node',
  'propose-edge',
  'add-alias',
  'merge-or-refine',
  'retain-example',
  'propose-application',
  'weaken-edge',
  'defer',
  'deliberate-non-edge',
  'reject',
]);

export const EVIDENCE_STATUSES = new Set([
  'direct-support',
  'qualified-support',
  'background-only',
  'contradiction',
  'irrelevant-co-mention',
  'unable-to-assess',
]);

export const TERMINAL_STATES = new Set([
  'accepted-as-node',
  'accepted-as-edge',
  'accepted-as-alias',
  'accepted-as-example',
  'accepted-as-application',
  'deliberate-non-edge',
  'deferred',
  'rejected',
]);

export const WORKFLOW_TRANSITIONS = new Map<string, Set<string>>([
  ['<start>', new Set(['harvested'])],
  ['harvested', new Set(['normalized'])],
  ['normalized', new Set(['dossier-ready'])],
  ['dossier-ready', new Set(['evidence-collected'])],
  ['evidence-collected', new Set(['assessed'])],
  [
    'assessed',
    new Set(['automated-review-passed', 'needs-revision', 'insufficient-evidence', 'rejected']),
  ],
  ['automated-review-passed', new Set(['human-review'])],
  ['needs-revision', new Set(['dossier-ready'])],
  ['insufficient-evidence', new Set(['evidence-collected'])],
  [
    'human-review',
    new Set([
      'accepted-as-node',
      'accepted-as-edge',
      'accepted-as-alias',
      'accepted-as-example',
      'accepted-as-application',
      'deliberate-non-edge',
      'deferred',
      'rejected',
    ]),
  ],
]);
