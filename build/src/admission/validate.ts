import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parse } from 'yaml';
import { analyzeGraph } from '../analyze.js';
import type { EdgeRecord, GraphNode } from '../model.js';
import { APPLICATION_EDGE_TYPES, APPLICATION_NODE_TYPE, SLUG } from '../model.js';
import { parseTree } from '../parse.js';
import { runPipeline } from '../pipeline.js';
import type { AtlasSchema } from '../schema.js';
import { validateContent } from '../validate.js';
import {
  DISPOSITIONS,
  EVIDENCE_STATUSES,
  TERMINAL_STATES,
  WORKFLOW_TRANSITIONS,
  type AdmissionMatch,
  type AdmissionReport,
  type AdmissionRuleResult,
  type GraphValueDimension,
} from './model.js';

type RecordValue = Record<string, unknown>;

function isRecord(value: unknown): value is RecordValue {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function nonEmpty(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function records(value: unknown): RecordValue[] {
  return Array.isArray(value) ? value.filter(isRecord) : [];
}

function strings(value: unknown): string[] {
  return Array.isArray(value) ? value.filter(nonEmpty) : [];
}

function add(
  rules: AdmissionRuleResult[],
  rule_id: string,
  severity: AdmissionRuleResult['severity'],
  subject: string,
  reason: string,
  provenance: string[],
): void {
  rules.push({
    rule_id,
    severity,
    kind: 'deterministic',
    outcome: severity === 'info' ? 'signal' : 'fail',
    subject,
    reason,
    provenance,
  });
}

/** Punctuation/case folding only. Suitable for stable identifiers, never semantic identity. */
export function foldName(value: string): string {
  return value
    .replace(/[\u2018\u2019']/g, "'")
    .replace(/'s\b/gi, '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('en-US')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

/** Conservative morphology for candidate clustering; never a semantic identity test. */
export function normalizeName(value: string): string {
  const acronymTokens = new Set(
    (value.match(/\b[A-Z][A-Z0-9]{1,}\b/g) ?? []).map((token) => token.toLocaleLowerCase('en-US')),
  );
  const folded = foldName(value);
  return folded
    .split(' ')
    .map((token) => {
      if (acronymTokens.has(token)) return token;
      if (token.length > 4 && token.endsWith('ies') && !/^(series|species)$/.test(token))
        return `${token.slice(0, -3)}y`;
      if (token.length > 4 && /(ches|shes|xes|zes)$/.test(token)) return token.slice(0, -2);
      if (
        token.length > 3 &&
        token.endsWith('s') &&
        !/(ss|us|is|ics|ness|ous|news|series|species|bayes)$/.test(token)
      )
        return token.slice(0, -1);
      return token;
    })
    .join(' ');
}

function tokenSimilarity(a: string, b: string): number {
  const left = new Set(normalizeName(a).split(' ').filter(Boolean));
  const right = new Set(normalizeName(b).split(' ').filter(Boolean));
  if (left.size === 0 || right.size === 0) return 0;
  const overlap = [...left].filter((token) => right.has(token)).length;
  return overlap / new Set([...left, ...right]).size;
}

function findMatches(dossier: RecordValue, nodes: GraphNode[]): AdmissionMatch[] {
  const candidate = isRecord(dossier.candidate) ? dossier.candidate : {};
  const names: { value: string; relationship: 'canonical-name' | 'alias' | 'acronym' }[] = [];
  if (nonEmpty(candidate.canonical_name)) {
    names.push({ value: candidate.canonical_name, relationship: 'canonical-name' });
  }
  for (const entry of records(candidate.local_names)) {
    if (nonEmpty(entry.name)) names.push({ value: entry.name, relationship: 'alias' });
  }
  for (const acronym of strings(candidate.acronyms)) {
    names.push({ value: acronym, relationship: 'acronym' });
  }

  const matches: AdmissionMatch[] = [];
  const seen = new Set<string>();
  for (const node of nodes) {
    const atlasNames = [
      { value: node.canonical_name, source: 'canonical_name' },
      ...node.aliases.map((alias, index) => ({ value: alias.name, source: `aliases[${index}]` })),
    ];
    for (const supplied of names) {
      for (const atlas of atlasNames) {
        const exact = normalizeName(supplied.value) === normalizeName(atlas.value);
        const similarity = tokenSimilarity(supplied.value, atlas.value);
        if (!exact && similarity < 0.6) continue;
        const relationship = exact ? supplied.relationship : 'near-name';
        const key = `${node.slug}|${relationship}|${supplied.value}|${atlas.value}`;
        if (seen.has(key)) continue;
        seen.add(key);
        matches.push({
          slug: node.slug,
          relationship,
          trigger: supplied.value,
          atlas_value: atlas.value,
          reason: exact
            ? `normalized lexical equality with atlas ${atlas.source}`
            : `token Jaccard similarity ${similarity.toFixed(2)} with atlas ${atlas.source}; review signal only`,
          provenance: `concepts/${node.slug}.md#${atlas.source}`,
        });
      }
    }
  }
  return matches.sort(
    (a, b) =>
      a.slug.localeCompare(b.slug) ||
      a.relationship.localeCompare(b.relationship) ||
      a.trigger.localeCompare(b.trigger),
  );
}

function validateShape(
  dossier: RecordValue,
  file: string,
  schema: AtlasSchema,
  rules: AdmissionRuleResult[],
): void {
  if (dossier.dossier_schema !== '1.0.0') {
    add(rules, 'admission/schema-version', 'error', file, 'dossier_schema must be "1.0.0"', [
      `${file}#dossier_schema`,
      'admission/dossier-schema-v1.yaml',
    ]);
  }
  const requiredArrays = [
    'source_inventory',
    'claims',
    'generated_hypotheses',
    'automated_judgments',
    'adversarial_reviews',
    'human_decisions',
  ];
  for (const key of requiredArrays) {
    if (!Array.isArray(dossier[key])) {
      add(rules, 'admission/required', 'error', `${file}#${key}`, `"${key}" must be a list`, [
        `${file}#${key}`,
        `admission/dossier-schema-v1.yaml#/properties/${key}`,
      ]);
    }
  }
  const candidate = isRecord(dossier.candidate) ? dossier.candidate : undefined;
  if (!candidate) {
    add(rules, 'admission/required', 'error', `${file}#candidate`, 'candidate must be a mapping', [
      `${file}#candidate`,
    ]);
    return;
  }
  if (!nonEmpty(candidate.id) || !SLUG.test(candidate.id)) {
    add(
      rules,
      'admission/id',
      'error',
      `${file}#candidate.id`,
      'candidate id must be lowercase-kebab',
      [`${file}#candidate.id`],
    );
  }
  if (!nonEmpty(candidate.canonical_name)) {
    add(
      rules,
      'admission/required',
      'error',
      `${file}#candidate.canonical_name`,
      'canonical_name is required',
      [`${file}#candidate.canonical_name`],
    );
  }
  for (const key of ['local_names', 'acronyms', 'originating_fields', 'possible_matches']) {
    if (!Array.isArray(candidate[key])) {
      add(
        rules,
        'admission/required',
        'error',
        `${file}#candidate.${key}`,
        `candidate.${key} must be a list`,
        [`${file}#candidate.${key}`, 'admission/dossier-schema-v1.yaml'],
      );
    }
  }
  if (
    !nonEmpty(candidate.proposed_disposition) ||
    !DISPOSITIONS.has(candidate.proposed_disposition)
  ) {
    add(
      rules,
      'admission/required',
      'error',
      `${file}#candidate.proposed_disposition`,
      'proposed_disposition is missing or unsupported',
      [`${file}#candidate.proposed_disposition`, 'admission/dossier-schema-v1.yaml'],
    );
  }

  const fieldIds = new Set(schema.fields.map((entry) => entry.id));
  const nodeTypeIds = new Set(schema.node_types.map((entry) => entry.id));
  for (const field of strings(candidate.originating_fields)) {
    if (!fieldIds.has(field)) {
      add(
        rules,
        'admission/vocabulary',
        'error',
        `${file}#candidate.originating_fields`,
        `field "${field}" is not in graph/schema.yaml`,
        [`${file}#candidate.originating_fields`, 'graph/schema.yaml#fields'],
      );
    }
  }
  for (const [index, local] of records(candidate.local_names).entries()) {
    if (!nonEmpty(local.name) || !nonEmpty(local.field)) {
      add(
        rules,
        'admission/required',
        'error',
        `${file}#candidate.local_names[${index}]`,
        'local name needs name and field',
        [`${file}#candidate.local_names[${index}]`],
      );
    } else if (!fieldIds.has(local.field)) {
      add(
        rules,
        'admission/vocabulary',
        'error',
        `${file}#candidate.local_names[${index}].field`,
        `field "${local.field}" is not in graph/schema.yaml`,
        [`${file}#candidate.local_names[${index}].field`, 'graph/schema.yaml#fields'],
      );
    }
  }
  if (
    candidate.proposed_node_type !== undefined &&
    (!nonEmpty(candidate.proposed_node_type) || !nodeTypeIds.has(candidate.proposed_node_type))
  ) {
    add(
      rules,
      'admission/vocabulary',
      'error',
      `${file}#candidate.proposed_node_type`,
      `node type "${String(candidate.proposed_node_type)}" is not in graph/schema.yaml`,
      [`${file}#candidate.proposed_node_type`, 'graph/schema.yaml#node_types'],
    );
  }
  if (!isRecord(dossier.search)) {
    add(rules, 'admission/required', 'error', `${file}#search`, 'search must be a mapping', [
      `${file}#search`,
    ]);
  }
  if (Array.isArray(dossier.source_inventory) && dossier.source_inventory.length === 0) {
    add(
      rules,
      'admission/required',
      'error',
      `${file}#source_inventory`,
      'source_inventory must contain at least one source',
      [`${file}#source_inventory`],
    );
  }
  const workflowState = isRecord(dossier.workflow) ? dossier.workflow.state : undefined;
  if (
    Array.isArray(dossier.claims) &&
    dossier.claims.length === 0 &&
    workflowState !== 'harvested' &&
    workflowState !== 'normalized'
  ) {
    add(
      rules,
      'admission/required',
      'error',
      `${file}#claims`,
      'claims must contain at least one atomic claim',
      [`${file}#claims`],
    );
  }
  const judgmentMethods = new Set(['retrieval-dependent', 'heuristic', 'model-assisted']);
  for (const [index, judgment] of records(dossier.automated_judgments).entries()) {
    if (
      !nonEmpty(judgment.id) ||
      !nonEmpty(judgment.method) ||
      !judgmentMethods.has(judgment.method) ||
      !nonEmpty(judgment.subject) ||
      !nonEmpty(judgment.recommendation) ||
      !nonEmpty(judgment.rationale) ||
      strings(judgment.provenance).length === 0
    ) {
      add(
        rules,
        'admission/required',
        'error',
        `${file}#automated_judgments[${index}]`,
        'untrusted automated judgment needs id, allowed method, subject, recommendation, rationale, and provenance',
        [`${file}#automated_judgments[${index}]`, 'admission/dossier-schema-v1.yaml'],
      );
    }
  }
  for (const [index, review] of records(dossier.adversarial_reviews).entries()) {
    if (
      !nonEmpty(review.id) ||
      !['human', 'model-assisted'].includes(String(review.method)) ||
      !nonEmpty(review.reviewer) ||
      !nonEmpty(review.challenge) ||
      !nonEmpty(review.response) ||
      !nonEmpty(review.recommended_action) ||
      strings(review.provenance).length === 0
    ) {
      add(
        rules,
        'admission/required',
        'error',
        `${file}#adversarial_reviews[${index}]`,
        'adversarial review needs method, reviewer, challenge, response, action, and provenance',
        [`${file}#adversarial_reviews[${index}]`, 'admission/dossier-schema-v1.yaml'],
      );
    }
  }
}

function validateReferencesAndEvidence(
  dossier: RecordValue,
  file: string,
  rules: AdmissionRuleResult[],
): { supportedClaims: Set<string>; qualifiedOnly: Set<string>; hasContradiction: boolean } {
  const sourceIds = new Set<string>();
  const sourceKinds = new Set([
    'primary-literature',
    'textbook',
    'handbook',
    'standard',
    'review',
    'syllabus',
    'glossary',
    'taxonomy',
    'web',
    'model-output',
    'other',
  ]);
  for (const [index, source] of records(dossier.source_inventory).entries()) {
    if (!nonEmpty(source.id) || !SLUG.test(source.id) || sourceIds.has(source.id)) {
      add(
        rules,
        'admission/id',
        'error',
        `${file}#source_inventory[${index}]`,
        'source id must be unique lowercase-kebab',
        [`${file}#source_inventory[${index}].id`],
      );
    } else sourceIds.add(source.id);
    if (
      !nonEmpty(source.kind) ||
      !sourceKinds.has(source.kind) ||
      !nonEmpty(source.title) ||
      !nonEmpty(source.locator) ||
      !nonEmpty(source.supplied_by)
    ) {
      add(
        rules,
        'admission/required',
        'error',
        `${file}#source_inventory[${index}]`,
        'source needs a supported kind, title, locator, and supplied_by',
        [`${file}#source_inventory[${index}]`, 'admission/dossier-schema-v1.yaml'],
      );
    }
  }
  const candidate = isRecord(dossier.candidate) ? dossier.candidate : {};
  for (const [index, localName] of records(candidate.local_names).entries()) {
    for (const sourceId of strings(localName.source_ids)) {
      if (!sourceIds.has(sourceId)) {
        add(
          rules,
          'admission/source-reference',
          'error',
          `${file}#candidate.local_names[${index}]`,
          `source_id "${sourceId}" is not in source_inventory`,
          [`${file}#candidate.local_names[${index}].source_ids`],
        );
      }
    }
  }
  for (const [index, match] of records(candidate.possible_matches).entries()) {
    for (const sourceId of strings(match.source_ids)) {
      if (!sourceIds.has(sourceId)) {
        add(
          rules,
          'admission/source-reference',
          'error',
          `${file}#candidate.possible_matches[${index}]`,
          `source_id "${sourceId}" is not in source_inventory`,
          [`${file}#candidate.possible_matches[${index}].source_ids`],
        );
      }
    }
  }
  for (const [index, hypothesis] of records(dossier.generated_hypotheses).entries()) {
    for (const sourceId of strings(hypothesis.input_source_ids)) {
      if (!sourceIds.has(sourceId)) {
        add(
          rules,
          'admission/source-reference',
          'error',
          `${file}#generated_hypotheses[${index}]`,
          `source_id "${sourceId}" is not in source_inventory`,
          [`${file}#generated_hypotheses[${index}].input_source_ids`],
        );
      }
    }
  }
  const claimIds = new Set<string>();
  const supportedClaims = new Set<string>();
  const qualifiedOnly = new Set<string>();
  let hasContradiction = false;
  for (const [claimIndex, claim] of records(dossier.claims).entries()) {
    const claimId = nonEmpty(claim.id) ? claim.id : `claim-${claimIndex}`;
    if (!SLUG.test(claimId) || claimIds.has(claimId)) {
      add(
        rules,
        'admission/id',
        'error',
        `${file}#claims[${claimIndex}]`,
        'claim id must be unique lowercase-kebab',
        [`${file}#claims[${claimIndex}].id`],
      );
    }
    claimIds.add(claimId);
    if (
      !nonEmpty(claim.proposition) ||
      !isRecord(claim.endpoints) ||
      !isRecord(claim.proposed_edge) ||
      !nonEmpty(claim.mathematical_skeleton)
    ) {
      add(
        rules,
        'admission/required',
        'error',
        `${file}#claims[${claimIndex}]`,
        'claim needs proposition, endpoints, proposed_edge, and mathematical_skeleton',
        [`${file}#claims[${claimIndex}]`],
      );
    }
    for (const key of ['scope', 'validity_regime'] as const) {
      if (!nonEmpty(claim[key])) {
        add(
          rules,
          'admission/required',
          'error',
          `${file}#claims[${claimIndex}].${key}`,
          `claim needs non-empty ${key}`,
          [`${file}#claims[${claimIndex}].${key}`],
        );
      }
    }
    for (const key of [
      'assumptions',
      'caveats',
      'counterexamples',
      'source_assessments',
      'possible_falsifiers',
      'alternative_interpretations',
    ] as const) {
      if (!Array.isArray(claim[key])) {
        add(
          rules,
          'admission/required',
          'error',
          `${file}#claims[${claimIndex}].${key}`,
          `claim.${key} must be a list`,
          [`${file}#claims[${claimIndex}].${key}`],
        );
      }
    }
    let direct = false;
    let qualified = false;
    for (const [assessmentIndex, assessment] of records(claim.source_assessments).entries()) {
      const subject = `${file}#claims[${claimIndex}].source_assessments[${assessmentIndex}]`;
      if (!nonEmpty(assessment.source_id) || !sourceIds.has(assessment.source_id)) {
        add(
          rules,
          'admission/source-reference',
          'error',
          subject,
          `source_id "${String(assessment.source_id)}" is not in source_inventory`,
          [subject],
        );
      }
      if (!nonEmpty(assessment.status) || !EVIDENCE_STATUSES.has(assessment.status)) {
        add(
          rules,
          'admission/evidence-status',
          'error',
          subject,
          `unknown evidence status "${String(assessment.status)}"`,
          [subject],
        );
      }
      if (!nonEmpty(assessment.proposition)) {
        add(
          rules,
          'admission/evidence-proposition',
          'error',
          subject,
          'assessment must name the exact proposition being checked',
          [subject],
        );
      }
      if (!nonEmpty(assessment.location) && !nonEmpty(assessment.excerpt)) {
        add(
          rules,
          'admission/evidence-location',
          'error',
          subject,
          'assessment needs a source location or excerpt',
          [subject],
        );
      }
      if (
        !isRecord(assessment.assessor) ||
        !nonEmpty(assessment.assessor.kind) ||
        !nonEmpty(assessment.assessor.identity) ||
        !nonEmpty(assessment.assessor.version)
      ) {
        add(
          rules,
          'admission/required',
          'error',
          subject,
          'assessment needs assessor kind, identity, and version',
          [subject],
        );
      }
      if (assessment.status === 'direct-support') direct = true;
      if (assessment.status === 'qualified-support') qualified = true;
      if (assessment.status === 'contradiction') hasContradiction = true;
      if (
        assessment.status === 'background-only' ||
        assessment.status === 'irrelevant-co-mention'
      ) {
        add(
          rules,
          'admission/evidence-co-mention',
          'info',
          subject,
          `"${assessment.status}" is recorded but does not support the claim`,
          [subject],
        );
      }
    }
    if (direct || qualified) supportedClaims.add(claimId);
    if (!direct && qualified) qualifiedOnly.add(claimId);
    if (!direct && !qualified) {
      add(
        rules,
        'admission/claim-support',
        'warn',
        `${file}#claims[${claimIndex}]`,
        'claim has no direct-support or qualified-support assessment',
        [`${file}#claims[${claimIndex}].source_assessments`],
      );
    }
  }

  const queryIds = new Set<string>();
  const search = isRecord(dossier.search) ? dossier.search : {};
  for (const [index, query] of records(search.queries).entries()) {
    if (!nonEmpty(query.id) || queryIds.has(query.id)) {
      add(
        rules,
        'admission/id',
        'error',
        `${file}#search.queries[${index}]`,
        'query id must be unique and non-empty',
        [`${file}#search.queries[${index}].id`],
      );
    } else queryIds.add(query.id);
  }
  for (const [index, entry] of records(search.history).entries()) {
    const subject = `${file}#search.history[${index}]`;
    if (!nonEmpty(entry.query_id) || !queryIds.has(entry.query_id)) {
      add(
        rules,
        'admission/source-reference',
        'error',
        subject,
        `query_id "${String(entry.query_id)}" is not in search.queries`,
        [subject],
      );
    }
    if (!['located', 'not-located', 'error'].includes(String(entry.result))) {
      add(
        rules,
        'admission/required',
        'error',
        subject,
        `search result "${String(entry.result)}" is unsupported`,
        [subject, 'admission/dossier-schema-v1.yaml'],
      );
    }
    for (const sourceId of strings(entry.source_ids)) {
      if (!sourceIds.has(sourceId))
        add(
          rules,
          'admission/source-reference',
          'error',
          subject,
          `source_id "${sourceId}" is not in source_inventory`,
          [subject],
        );
    }
    if (entry.result === 'not-located') {
      add(
        rules,
        'admission/retrieval-not-absence',
        'warn',
        subject,
        'not located under this recorded query; this is not evidence that a migration is absent',
        [subject, 'docs/research-gap-workflow.md'],
      );
    }
  }
  return { supportedClaims, qualifiedOnly, hasContradiction };
}

function validateWorkflow(
  dossier: RecordValue,
  file: string,
  rules: AdmissionRuleResult[],
): string {
  const workflow = isRecord(dossier.workflow) ? dossier.workflow : undefined;
  if (!workflow || !nonEmpty(workflow.state) || !Array.isArray(workflow.history)) {
    add(
      rules,
      'admission/required',
      'error',
      `${file}#workflow`,
      'workflow needs state and append-only history',
      [`${file}#workflow`],
    );
    return '';
  }
  let current = '<start>';
  for (const [index, transition] of records(workflow.history).entries()) {
    const subject = `${file}#workflow.history[${index}]`;
    const from = transition.from === null ? '<start>' : String(transition.from ?? '');
    const to = String(transition.to ?? '');
    if (from !== current || !WORKFLOW_TRANSITIONS.get(current)?.has(to)) {
      add(
        rules,
        'admission/workflow-transition',
        'error',
        subject,
        `transition ${from} -> ${to} is not allowed after ${current}`,
        [subject, 'docs/candidate-validation.md#workflow'],
      );
    }
    if (!nonEmpty(transition.reason) || !nonEmpty(transition.actor)) {
      add(rules, 'admission/required', 'error', subject, 'transition needs reason and actor', [
        subject,
      ]);
    }
    current = to;
  }
  if (workflow.state !== current) {
    add(
      rules,
      'admission/workflow-state',
      'error',
      `${file}#workflow.state`,
      `state "${workflow.state}" does not match history state "${current}"`,
      [`${file}#workflow.state`, `${file}#workflow.history`],
    );
  }
  if (TERMINAL_STATES.has(workflow.state) && records(dossier.human_decisions).length === 0) {
    add(
      rules,
      'admission/workflow-state',
      'error',
      `${file}#human_decisions`,
      'terminal human state requires a recorded human decision',
      [`${file}#human_decisions`],
    );
  }
  return workflow.state;
}

function adaptTrustedRules(
  dossier: RecordValue,
  file: string,
  schema: AtlasSchema,
  parsed: ReturnType<typeof parseTree>,
  rules: AdmissionRuleResult[],
  workflowState: string,
): void {
  const candidate = isRecord(dossier.candidate) ? dossier.candidate : {};
  const candidateId =
    nonEmpty(candidate.id) && SLUG.test(candidate.id) ? candidate.id : 'invalid-candidate';
  const claims = records(dossier.claims);
  if (workflowState === 'accepted-as-node' || workflowState === 'accepted-as-edge') {
    if (workflowState === 'accepted-as-node') {
      const promoted = parsed.concepts.find((concept) => concept.slug === candidateId);
      add(
        rules,
        promoted ? 'admission/promotion-present' : 'admission/promotion-missing',
        promoted ? 'info' : 'error',
        `${file}#candidate`,
        promoted
          ? `accepted node is present in trusted content as "${candidateId}"`
          : `accepted node "${candidateId}" is missing from trusted content`,
        [file, promoted?.file ?? `concepts/${candidateId}.md`],
      );
    }
    for (const [index, claim] of claims.entries()) {
      const endpoints = isRecord(claim.endpoints) ? claim.endpoints : {};
      const proposedEdge = isRecord(claim.proposed_edge) ? claim.proposed_edge : {};
      const expected = {
        from: endpoints.from === '$candidate' ? candidateId : endpoints.from,
        to: endpoints.to === '$candidate' ? candidateId : endpoints.to,
        type: proposedEdge.type,
        strength: proposedEdge.strength,
        context: proposedEdge.context,
      };
      const promoted = parsed.edges.find(
        (edge) =>
          edge.raw.from === expected.from &&
          edge.raw.to === expected.to &&
          edge.raw.type === expected.type &&
          edge.raw.strength === expected.strength &&
          edge.raw.context === expected.context,
      );
      add(
        rules,
        promoted ? 'admission/promotion-present' : 'admission/promotion-missing',
        promoted ? 'info' : 'error',
        `${file}#claims[${index}]`,
        promoted
          ? `accepted edge is present in trusted content: ${String(expected.from)} -${String(expected.type)}-> ${String(expected.to)}`
          : `accepted edge is missing from trusted content: ${String(expected.from)} -${String(expected.type)}-> ${String(expected.to)}`,
        [file, promoted ? `${promoted.file}[${promoted.index}]` : 'graph/edges.yaml'],
      );
    }
    return;
  }
  const usesCandidate = claims.some((claim) => {
    const endpoints = isRecord(claim.endpoints) ? claim.endpoints : {};
    return (
      endpoints.from === '$candidate' ||
      endpoints.to === '$candidate' ||
      endpoints.from === candidateId ||
      endpoints.to === candidateId
    );
  });
  const concepts = [...parsed.concepts];
  if (usesCandidate) {
    concepts.push({
      slug: candidateId,
      file: `${file}#candidate`,
      body: '',
      front: {
        canonical_name: candidate.canonical_name,
        node_type: candidate.proposed_node_type,
        status: 'stub',
        summary: 'Untrusted candidate adapter; never emitted.',
      },
    });
  }
  const proposed: EdgeRecord[] = claims.map((claim, index) => {
    const endpoints = isRecord(claim.endpoints) ? claim.endpoints : {};
    const edge = isRecord(claim.proposed_edge) ? claim.proposed_edge : {};
    return {
      file,
      index,
      raw: {
        from: endpoints.from === '$candidate' ? candidateId : endpoints.from,
        to: endpoints.to === '$candidate' ? candidateId : endpoints.to,
        type: edge.type,
        strength: edge.strength,
        context: edge.context,
        status: edge.status,
      },
    };
  });
  const inherited = validateContent(
    schema,
    concepts,
    [...parsed.edges, ...proposed],
    [],
    parsed.references,
    [],
    parsed.nonEdges,
  ).filter((issue) => issue.file.startsWith(file) || issue.rule === 'non-edge/contradiction');
  for (const issue of inherited) {
    add(
      rules,
      'admission/trusted-rule',
      issue.severity,
      issue.file,
      `${issue.rule}: ${issue.message}`,
      [issue.file, `build/src/validate.ts#${issue.rule}`, 'graph/schema.yaml'],
    );
  }
}

function graphValue(
  dossier: RecordValue,
  reportMatches: AdmissionMatch[],
  metrics: ReturnType<typeof analyzeGraph>,
  supportedClaims: Set<string>,
): GraphValueDimension[] {
  const candidate = isRecord(dossier.candidate) ? dossier.candidate : {};
  const localFields = new Set(
    records(candidate.local_names)
      .map((entry) => entry.field)
      .filter(nonEmpty),
  );
  const aliasMatch = reportMatches.some((match) => match.relationship === 'alias');
  const claims = records(dossier.claims);
  const communities = new Set<number>();
  for (const claim of claims) {
    const endpoints = isRecord(claim.endpoints) ? claim.endpoints : {};
    for (const endpoint of [endpoints.from, endpoints.to]) {
      if (!nonEmpty(endpoint) || endpoint === '$candidate') continue;
      const community = metrics.nodes[endpoint]?.community;
      if (community !== null && community !== undefined) communities.add(community);
    }
  }
  const candidatePairs = new Set(
    [
      ...metrics.candidate_edges,
      ...metrics.queue.link_suggestions.map((pair) => ({ a: pair.a, b: pair.b })),
    ].map((pair) => `${pair.a}|${pair.b}`),
  );
  const fillsQueue = claims.some((claim) => {
    const endpoints = isRecord(claim.endpoints) ? claim.endpoints : {};
    if (
      !nonEmpty(endpoints.from) ||
      !nonEmpty(endpoints.to) ||
      endpoints.from === '$candidate' ||
      endpoints.to === '$candidate'
    )
      return false;
    return candidatePairs.has([endpoints.from, endpoints.to].sort().join('|'));
  });
  const specialRelations = claims.some((claim) => {
    const edge = isRecord(claim.proposed_edge) ? claim.proposed_edge : {};
    return ['ASSUMES', 'FAILS-WHEN', 'REPLACED-BY'].includes(String(edge.type));
  });
  return [
    {
      id: 'dialect-translation',
      signal: localFields.size >= 2 || aliasMatch ? 'present' : 'absent',
      reason:
        localFields.size >= 2
          ? `${localFields.size} sourced local-name fields are recorded`
          : aliasMatch
            ? 'a supplied local name matches an existing atlas dialect alias'
            : 'fewer than two sourced local-name fields are recorded',
      provenance: ['dossier#candidate.local_names'],
    },
    {
      id: 'defensible-connections',
      signal: supportedClaims.size > 0 ? 'present' : 'absent',
      reason: `${supportedClaims.size} claim(s) have direct or qualified source assessment`,
      provenance: ['dossier#claims[*].source_assessments'],
    },
    {
      id: 'cross-community-bridge',
      signal: communities.size >= 2 ? 'present' : communities.size === 1 ? 'absent' : 'unknown',
      reason: `${communities.size} existing trusted graph communit${communities.size === 1 ? 'y' : 'ies'} touched by proposed endpoints`,
      provenance: ['build/src/analyze.ts#communities', 'trusted graph metrics only'],
    },
    {
      id: 'documented-structural-hole',
      signal: fillsQueue ? 'present' : 'absent',
      reason: fillsQueue
        ? 'an endpoint pair appears in the existing wiki-link candidate queue'
        : 'no proposed existing-node pair appears in the candidate-edge queue',
      provenance: [
        'graph.json#metrics.candidate_edges',
        'graph.json#metrics.queue.link_suggestions',
        'build/src/link.ts#link/candidate-edge',
      ],
    },
    {
      id: 'assumption-or-failure-value',
      signal: specialRelations ? 'present' : 'absent',
      reason: specialRelations
        ? 'claim adds an assumption, failure, or replacement relationship'
        : 'no ASSUMES, FAILS-WHEN, or REPLACED-BY claim is proposed',
      provenance: ['dossier#claims[*].proposed_edge.type'],
    },
    {
      id: 'rich-connectivity',
      signal: claims.length >= 2 ? 'present' : 'absent',
      reason: `${claims.length} atomic proposed claim(s); raw popularity and speculative count are not rewarded`,
      provenance: ['dossier#claims'],
    },
  ];
}

function chooseRecommendation(
  dossier: RecordValue,
  rules: AdmissionRuleResult[],
  matches: AdmissionMatch[],
  supportedClaims: Set<string>,
  qualifiedOnly: Set<string>,
  hasContradiction: boolean,
  workflowState: string,
): AdmissionReport['recommendation'] {
  if (TERMINAL_STATES.has(workflowState)) {
    return {
      disposition: workflowState,
      rationale:
        'A human decision is recorded; deterministic validation now verifies the terminal disposition and any promoted trusted content.',
      basis_rule_ids: [
        rules.some((rule) => rule.rule_id === 'admission/promotion-missing')
          ? 'admission/promotion-missing'
          : 'admission/promotion-present',
      ],
      human_decision_required: false,
    };
  }
  const candidate = isRecord(dossier.candidate) ? dossier.candidate : {};
  const proposed = nonEmpty(candidate.proposed_disposition)
    ? candidate.proposed_disposition
    : 'defer';
  const basis = new Set<string>();
  let disposition = proposed;
  let rationale =
    'The supplied disposition is structurally reviewable; a human must decide whether to promote it.';
  if (rules.some((rule) => rule.severity === 'error')) {
    disposition = 'reject';
    rationale =
      'Deterministic dossier or trusted-content adapter errors must be corrected before review.';
    for (const rule of rules.filter((entry) => entry.severity === 'error')) basis.add(rule.rule_id);
  } else if (hasContradiction) {
    disposition = 'defer';
    rationale =
      'At least one source assessment contradicts a proposed claim; resolve the disagreement explicitly.';
    basis.add('admission/evidence-status');
  } else if (matches.some((match) => match.relationship !== 'near-name')) {
    disposition = proposed === 'add-alias' ? 'add-alias' : 'merge-or-refine';
    rationale =
      'A transparent lexical match points to an existing atlas record; prefer the economical existing-node disposition.';
    basis.add('admission/name-match');
  } else if (supportedClaims.size === 0 && records(dossier.claims).length > 0) {
    disposition = 'defer';
    rationale = 'No atomic claim has direct or qualified source support.';
    basis.add('admission/claim-support');
  } else if (qualifiedOnly.size > 0) {
    disposition = 'weaken-edge';
    rationale =
      'One or more claims have qualified support only; review a weaker edge type or strength.';
    basis.add('admission/qualified-strength');
  } else if (candidate.proposed_node_type === APPLICATION_NODE_TYPE) {
    const neighbors = new Set<string>();
    for (const claim of records(dossier.claims)) {
      const endpoints = isRecord(claim.endpoints) ? claim.endpoints : {};
      const edge = isRecord(claim.proposed_edge) ? claim.proposed_edge : {};
      if (!APPLICATION_EDGE_TYPES.has(String(edge.type))) continue;
      const other =
        endpoints.from === '$candidate' || endpoints.from === candidate.id
          ? endpoints.to
          : endpoints.to === '$candidate' || endpoints.to === candidate.id
            ? endpoints.from
            : undefined;
      if (nonEmpty(other)) neighbors.add(other);
    }
    if (neighbors.size < 2) {
      disposition = 'retain-example';
      rationale = `Application has ${neighbors.size} distinct structure neighbor(s); the existing atlas bar requires at least two.`;
      basis.add('admission/application-connectivity');
    }
  }
  if (basis.size === 0) basis.add('admission/review-ready');
  return {
    disposition,
    rationale,
    basis_rule_ids: [...basis].sort(),
    human_decision_required: true,
  };
}

function emptyReport(file: string, root: string, reason: AdmissionRuleResult): AdmissionReport {
  return {
    report_version: '1.0.0',
    dossier: { id: '<unreadable>', file, schema_version: '<unknown>', workflow_state: '<unknown>' },
    atlas: { schema_version: '<unknown>', root },
    recommendation: {
      disposition: 'reject',
      rationale: 'Candidate review could not run.',
      basis_rule_ids: [reason.rule_id],
      human_decision_required: true,
    },
    summary: { errors: 1, warnings: 0, signals: 0 },
    matches: [],
    graph_value: [],
    rule_results: [reason],
    supplied_judgments: {
      generated_hypotheses: [],
      automated_judgments: [],
      adversarial_reviews: [],
      human_decisions: [],
    },
  };
}

export function validateDossier(rootInput: string, fileInput: string): AdmissionReport {
  const root = resolve(rootInput);
  const file = resolve(fileInput);
  let dossier: unknown;
  try {
    dossier = parse(readFileSync(file, 'utf8'));
  } catch (error) {
    return emptyReport(file, root, {
      rule_id: 'admission/yaml',
      severity: 'error',
      kind: 'deterministic',
      outcome: 'fail',
      subject: file,
      reason: `cannot parse dossier YAML: ${(error as Error).message}`,
      provenance: [file],
    });
  }
  if (!isRecord(dossier)) {
    return emptyReport(file, root, {
      rule_id: 'admission/root',
      severity: 'error',
      kind: 'deterministic',
      outcome: 'fail',
      subject: file,
      reason: 'dossier root must be a mapping',
      provenance: [file, 'admission/dossier-schema-v1.yaml'],
    });
  }

  const pipeline = runPipeline(root);
  const atlasErrors = pipeline.issues.filter((issue) => issue.severity === 'error');
  const rules: AdmissionRuleResult[] = [];
  if (!pipeline.schema || !pipeline.graph || atlasErrors.length > 0) {
    for (const issue of atlasErrors.length > 0 ? atlasErrors : pipeline.issues) {
      add(
        rules,
        'admission/atlas-invalid',
        'error',
        issue.file,
        `${issue.rule}: ${issue.message}`,
        [issue.file, 'npm run atlas -- --check'],
      );
    }
    const first = rules[0] ?? {
      rule_id: 'admission/atlas-invalid',
      severity: 'error' as const,
      kind: 'deterministic' as const,
      outcome: 'fail' as const,
      subject: root,
      reason: 'trusted atlas did not produce a linked graph',
      provenance: [root],
    };
    return emptyReport(file, root, first);
  }

  validateShape(dossier, file, pipeline.schema, rules);
  const evidence = validateReferencesAndEvidence(dossier, file, rules);
  const workflowState = validateWorkflow(dossier, file, rules);
  const parsed = parseTree(root);
  adaptTrustedRules(dossier, file, pipeline.schema, parsed, rules, workflowState);
  const matches = findMatches(dossier, pipeline.graph.nodes);
  for (const match of matches) {
    add(
      rules,
      match.relationship === 'near-name' ? 'admission/near-name' : 'admission/name-match',
      'info',
      `${file}#candidate`,
      `${match.relationship} match to "${match.slug}" triggered by "${match.trigger}": ${match.reason}`,
      [`${file}#candidate`, match.provenance],
    );
  }
  const candidate = isRecord(dossier.candidate) ? dossier.candidate : {};
  if (candidate.proposed_node_type === APPLICATION_NODE_TYPE) {
    const neighbors = new Set<string>();
    for (const claim of records(dossier.claims)) {
      const endpoints = isRecord(claim.endpoints) ? claim.endpoints : {};
      const edge = isRecord(claim.proposed_edge) ? claim.proposed_edge : {};
      if (APPLICATION_EDGE_TYPES.has(String(edge.type))) {
        const other =
          endpoints.from === '$candidate' || endpoints.from === candidate.id
            ? endpoints.to
            : endpoints.to === '$candidate' || endpoints.to === candidate.id
              ? endpoints.from
              : undefined;
        if (nonEmpty(other)) neighbors.add(other);
      }
    }
    if (neighbors.size < 2)
      add(
        rules,
        'admission/application-connectivity',
        'warn',
        `${file}#candidate`,
        `application has ${neighbors.size} distinct structure neighbor(s); existing rule requires at least two`,
        [`${file}#claims`, 'build/src/validate.ts#application/underconnected'],
      );
  }
  if (
    workflowState === 'automated-review-passed' &&
    records(dossier.adversarial_reviews).length === 0
  ) {
    add(
      rules,
      'admission/adversarial-review',
      'warn',
      `${file}#adversarial_reviews`,
      'automated-review-passed requires a separate adversarial review record for a complete dossier',
      [`${file}#adversarial_reviews`],
    );
  }
  for (const claimId of evidence.qualifiedOnly) {
    add(
      rules,
      'admission/qualified-strength',
      'warn',
      `${file}#claims.${claimId}`,
      'qualified support only; consider a weaker type or strength',
      [`${file}#claims.${claimId}.source_assessments`],
    );
  }

  if (
    !rules.some((rule) => rule.severity === 'error') &&
    !evidence.hasContradiction &&
    evidence.supportedClaims.size > 0 &&
    !matches.some((match) => match.relationship !== 'near-name')
  ) {
    add(
      rules,
      'admission/review-ready',
      'info',
      `${file}#candidate`,
      'deterministic structure is review-ready; this does not establish the candidate or its evidence as true',
      [file, 'docs/candidate-validation.md#boundary-and-data-flow'],
    );
  }

  const metrics = analyzeGraph(
    pipeline.schema,
    pipeline.graph.nodes,
    pipeline.graph.edges,
    pipeline.graph.candidates,
    pipeline.graph.symptoms,
    pipeline.graph.nonEdges,
  );
  const dimensions = graphValue(dossier, matches, metrics, evidence.supportedClaims);
  const recommendation = chooseRecommendation(
    dossier,
    rules,
    matches,
    evidence.supportedClaims,
    evidence.qualifiedOnly,
    evidence.hasContradiction,
    workflowState,
  );
  rules.sort(
    (a, b) =>
      a.rule_id.localeCompare(b.rule_id) ||
      a.subject.localeCompare(b.subject) ||
      a.reason.localeCompare(b.reason),
  );
  const errors = rules.filter((rule) => rule.severity === 'error').length;
  const warnings = rules.filter((rule) => rule.severity === 'warn').length;
  const signals = rules.filter((rule) => rule.severity === 'info').length;
  return {
    report_version: '1.0.0',
    dossier: {
      id: nonEmpty(candidate.id) ? candidate.id : '<invalid>',
      file,
      schema_version: nonEmpty(dossier.dossier_schema) ? dossier.dossier_schema : '<invalid>',
      workflow_state: workflowState || '<invalid>',
    },
    atlas: { schema_version: pipeline.schema.schema_version, root },
    recommendation,
    summary: { errors, warnings, signals },
    matches,
    graph_value: dimensions,
    rule_results: rules,
    supplied_judgments: {
      generated_hypotheses: Array.isArray(dossier.generated_hypotheses)
        ? dossier.generated_hypotheses
        : [],
      automated_judgments: Array.isArray(dossier.automated_judgments)
        ? dossier.automated_judgments
        : [],
      adversarial_reviews: Array.isArray(dossier.adversarial_reviews)
        ? dossier.adversarial_reviews
        : [],
      human_decisions: Array.isArray(dossier.human_decisions) ? dossier.human_decisions : [],
    },
  };
}
