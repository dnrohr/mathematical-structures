import {
  appendFileSync,
  cpSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, sep } from 'node:path';
import { parse, stringify } from 'yaml';
import { stableStringify } from '../emit.js';
import { runPipeline } from '../pipeline.js';
import { foldName } from './validate.js';

type RecordValue = Record<string, unknown>;

function isRecord(value: unknown): value is RecordValue {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function records(value: unknown): RecordValue[] {
  return Array.isArray(value) ? value.filter(isRecord) : [];
}

function strings(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : [];
}

function requiredString(record: RecordValue, key: string, subject: string): string {
  const value = record[key];
  if (typeof value !== 'string' || value.trim() === '')
    throw new Error(`${subject}.${key} is required`);
  return value;
}

const SOURCE_KEYS: Record<string, string> = {
  'khalil-nonlinear-systems-2014': 'khalil-2002',
  'nocedal-wright-2006': 'nocedal-wright-2006',
  'thrun-burgard-fox-2005': 'thrun-etal-2005',
  'koller-friedman-2009': 'koller-friedman-2009',
  'lee-smooth-manifolds-2012': 'lee-2012',
  'hairer-lubich-wanner-2006': 'hairer-etal-2006',
  'cover-thomas-2006': 'cover-thomas-2006',
  'boyd-vandenberghe-2004': 'boyd-vandenberghe-2004',
  'fitzpatrick-celestial-mechanics-2012': 'fitzpatrick-2012',
};

const PROMOTION_ALIASES: Record<string, { name: string; field: string }[]> = {
  'bayesian-network': [
    { name: 'belief network', field: 'probability' },
    { name: 'directed graphical model', field: 'ml' },
  ],
  'belief-propagation': [
    { name: 'sum-product algorithm', field: 'ml' },
    { name: 'message passing', field: 'probability' },
  ],
  'factor-graph': [
    { name: 'bipartite factorization graph', field: 'ml' },
    { name: 'factorized graphical model', field: 'statistics' },
  ],
};

const REFERENCE_ADDITIONS = `
@book{nocedal-wright-2006,
  author    = {Nocedal, Jorge and Wright, Stephen J.},
  title     = {Numerical Optimization},
  publisher = {Springer},
  edition   = {2nd},
  year      = {2006},
  doi       = {10.1007/978-0-387-40065-5},
}

@book{thrun-etal-2005,
  author    = {Thrun, Sebastian and Burgard, Wolfram and Fox, Dieter},
  title     = {Probabilistic Robotics},
  publisher = {MIT Press},
  year      = {2005},
}

@book{koller-friedman-2009,
  author    = {Koller, Daphne and Friedman, Nir},
  title     = {Probabilistic Graphical Models: Principles and Techniques},
  publisher = {MIT Press},
  year      = {2009},
}

@book{lee-2012,
  author    = {Lee, John M.},
  title     = {Introduction to Smooth Manifolds},
  publisher = {Springer},
  edition   = {2nd},
  year      = {2012},
  doi       = {10.1007/978-1-4419-9982-5},
}

@book{hairer-etal-2006,
  author    = {Hairer, Ernst and Lubich, Christian and Wanner, Gerhard},
  title     = {Geometric Numerical Integration: Structure-Preserving Algorithms for Ordinary Differential Equations},
  publisher = {Springer},
  edition   = {2nd},
  year      = {2006},
  doi       = {10.1007/3-540-30666-8},
}

@book{fitzpatrick-2012,
  author    = {Fitzpatrick, Richard},
  title     = {An Introduction to Celestial Mechanics},
  publisher = {Cambridge University Press},
  year      = {2012},
}
`;

export interface PromotionPreviewReport {
  report_version: '1.0.0';
  campaign_id: string;
  human_approval_required: true;
  summary: {
    proposed_new_concepts: number;
    proposed_merge_refinements: number;
    proposed_edges: number;
    reference_additions: number;
    integrated_validation_errors: number;
    integrated_validation_warnings: number;
  };
  concepts: string[];
  merge_refinements: string[];
  validation_issues: { severity: string; rule: string; file: string; message: string }[];
}

function ensureUntrustedOutput(root: string, output: string): void {
  const resolvedOutput = resolve(output);
  for (const trusted of ['concepts', 'graph', 'paths']) {
    const trustedRoot = resolve(root, trusted);
    if (resolvedOutput === trustedRoot || resolvedOutput.startsWith(`${trustedRoot}${sep}`))
      throw new Error(`refusing to write promotion preview inside trusted ${trusted}/`);
  }
}

function conceptMarkdown(dossier: RecordValue, claim: RecordValue, challenge: RecordValue): string {
  const candidate = isRecord(dossier.candidate) ? dossier.candidate : {};
  const edge = isRecord(claim.proposed_edge) ? claim.proposed_edge : {};
  const fields = strings(candidate.originating_fields);
  const canonical = requiredString(candidate, 'canonical_name', 'candidate');
  const aliases = [
    ...records(candidate.local_names).map((entry) => ({
      name: String(entry.name),
      field: String(entry.field),
    })),
    ...strings(candidate.acronyms).map((name) => ({
      name,
      field: fields[0] ?? 'numerical-analysis',
    })),
    ...(PROMOTION_ALIASES[String(candidate.id)] ?? []),
  ].filter(
    (entry, index, all) =>
      foldName(entry.name) !== foldName(canonical) &&
      all.findIndex((other) => foldName(other.name) === foldName(entry.name)) === index,
  );
  const front = {
    canonical_name: canonical,
    node_type: requiredString(candidate, 'proposed_node_type', canonical),
    status: 'established',
    summary: requiredString(claim, 'proposition', canonical),
    fields,
    ...(aliases.length > 0 ? { aliases } : {}),
    assumptions: strings(claim.assumptions),
    canonical_examples: [
      `${requiredString(claim, 'scope', canonical)} — ${requiredString(edge, 'context', canonical)}`,
    ],
    sections: [`campaign-broad-sweep-2026-09#${String(candidate.id)}`],
  };
  const caveats = strings(claim.caveats)
    .map((value) => `- ${value}`)
    .join('\n');
  const counterexamples = strings(claim.counterexamples)
    .map((value) => `- ${value}`)
    .join('\n');
  return `---\n${stringify(front, { lineWidth: 100 }).trimEnd()}\n---\n\n${requiredString(claim, 'proposition', canonical)}\n\n## Mathematical skeleton\n\n${requiredString(claim, 'mathematical_skeleton', canonical)}\n\nThe claim is scoped to ${requiredString(claim, 'scope', canonical).replace(/\.$/, '')}. Its stated validity regime is: ${requiredString(claim, 'validity_regime', canonical)}\n\n## Boundaries\n\n${caveats || '- No additional caveat recorded.'}\n\nCounterexamples and failure probes:\n\n${counterexamples || '- No counterexample recorded.'}\n\n## Adversarial review\n\n**Challenge.** ${requiredString(challenge, 'challenge', canonical)}\n\n**Response.** ${requiredString(challenge, 'response', canonical)}\n`;
}

function validateIntegratedPreview(root: string, preview: string): ReturnType<typeof runPipeline> {
  const temporary = mkdtempSync(join(tmpdir(), 'atlas-promotion-preview-'));
  try {
    cpSync(join(root, 'concepts'), join(temporary, 'concepts'), { recursive: true });
    cpSync(join(root, 'graph'), join(temporary, 'graph'), { recursive: true });
    cpSync(join(root, 'paths'), join(temporary, 'paths'), { recursive: true });
    cpSync(join(preview, 'concepts'), join(temporary, 'concepts'), { recursive: true });
    appendFileSync(
      join(temporary, 'graph', 'edges.yaml'),
      `\n\n# Broad source-inventory campaign promotion preview\n${readFileSync(join(preview, 'edges.yaml'), 'utf8')}`,
      'utf8',
    );
    appendFileSync(
      join(temporary, 'graph', 'references.bib'),
      `\n\n% Broad source-inventory campaign promotion preview\n${readFileSync(join(preview, 'references.bib'), 'utf8')}`,
      'utf8',
    );
    const result = runPipeline(temporary);
    return {
      ...result,
      issues: result.issues.map((issue) => ({
        ...issue,
        file: issue.file.replace(temporary, '<integrated-preview>'),
      })),
    };
  } finally {
    rmSync(temporary, { recursive: true, force: true });
  }
}

function reviewSection(dossier: RecordValue, disposition: string): string {
  const candidate = isRecord(dossier.candidate) ? dossier.candidate : {};
  const claim = records(dossier.claims)[0] ?? {};
  const endpoints = isRecord(claim.endpoints) ? claim.endpoints : {};
  const edge = isRecord(claim.proposed_edge) ? claim.proposed_edge : {};
  const assessment = records(claim.source_assessments)[0] ?? {};
  const review = records(dossier.adversarial_reviews)[0] ?? {};
  const id = requiredString(candidate, 'id', 'candidate');
  const from = endpoints.from === '$candidate' ? id : String(endpoints.from);
  const to = endpoints.to === '$candidate' ? id : String(endpoints.to);
  const list = (values: string[]): string =>
    values.length > 0 ? values.map((value) => `  - ${value}`).join('\n') : '  - None recorded.';
  return `## ${requiredString(candidate, 'canonical_name', id)} \`${id}\`\n\n- Proposed disposition: \`${disposition}\`\n- Proposed node type: \`${String(candidate.proposed_node_type ?? 'existing-node refinement')}\`\n- Proposed edge: \`${from} —${String(edge.type)}→ ${to}\` (\`${String(edge.strength)}\`)\n- Source: \`${String(assessment.source_id)}\`, ${String(assessment.location)}\n- Proposition: ${String(claim.proposition)}\n- Mathematical skeleton: ${String(claim.mathematical_skeleton)}\n- Scope: ${String(claim.scope)}\n- Validity regime: ${String(claim.validity_regime)}\n- Assumptions:\n${list(strings(claim.assumptions))}\n- Caveats:\n${list(strings(claim.caveats))}\n- Counterexamples:\n${list(strings(claim.counterexamples))}\n- Adversarial challenge: ${String(review.challenge)}\n- Response: ${String(review.response)}\n\nDecision: [ ] accept  [ ] revise  [ ] defer  [ ] reject\n`;
}

export function buildPromotionPreview(
  rootInput: string,
  campaignDirectoryInput: string,
  outputInput: string,
): PromotionPreviewReport {
  const root = resolve(rootInput);
  const campaignDirectory = resolve(campaignDirectoryInput);
  const output = resolve(outputInput);
  ensureUntrustedOutput(root, output);
  const triage = JSON.parse(
    readFileSync(join(campaignDirectory, 'triage-report.json'), 'utf8'),
  ) as RecordValue;
  const selected = records(triage.decisions).filter(
    (decision) => decision.selected_for_review === true,
  );
  const newNodes = selected.filter((decision) => decision.disposition === 'propose-node');
  const mergeRefinements = selected.filter(
    (decision) => decision.disposition === 'merge-or-refine',
  );
  if (newNodes.length + mergeRefinements.length !== selected.length)
    throw new Error(
      'promotion preview currently accepts only reviewed node proposals and merge refinements',
    );
  mkdirSync(join(output, 'concepts'), { recursive: true });
  const edges: RecordValue[] = [];
  const reviewSections: string[] = [];
  for (const decision of selected) {
    const id = requiredString(decision, 'candidate_id', 'triage decision');
    const dossierFile = join(campaignDirectory, 'normalized', `${id}.yaml`);
    const dossier = parse(readFileSync(dossierFile, 'utf8')) as RecordValue;
    const workflow = isRecord(dossier.workflow) ? dossier.workflow : {};
    if (workflow.state !== 'automated-review-passed')
      throw new Error(`${id} is not at automated-review-passed`);
    const claim = records(dossier.claims)[0];
    const challenge = records(dossier.adversarial_reviews)[0];
    if (!claim || !challenge) throw new Error(`${id} lacks a claim or adversarial review`);
    reviewSections.push(reviewSection(dossier, String(decision.disposition)));
    if (decision.disposition === 'propose-node')
      writeFileSync(
        join(output, 'concepts', `${id}.md`),
        conceptMarkdown(dossier, claim, challenge),
        'utf8',
      );
    const endpoints = isRecord(claim.endpoints) ? claim.endpoints : {};
    const proposed = isRecord(claim.proposed_edge) ? claim.proposed_edge : {};
    const assessment = records(claim.source_assessments)[0];
    if (!assessment) throw new Error(`${id} lacks a source assessment`);
    const sourceId = requiredString(assessment, 'source_id', id);
    const evidenceKey = SOURCE_KEYS[sourceId];
    if (!evidenceKey) throw new Error(`${id} has no promotion citation mapping for ${sourceId}`);
    edges.push({
      from: endpoints.from === '$candidate' ? id : endpoints.from,
      to: endpoints.to === '$candidate' ? id : endpoints.to,
      type: proposed.type,
      strength: proposed.strength,
      context: proposed.context,
      evidence: [evidenceKey],
      notes: `Campaign evidence location: ${String(assessment.location)}`,
    });
  }
  writeFileSync(join(output, 'edges.yaml'), stringify(edges, { lineWidth: 100 }), 'utf8');
  writeFileSync(join(output, 'references.bib'), REFERENCE_ADDITIONS.trimStart(), 'utf8');
  writeFileSync(
    join(output, 'review.md'),
    `# Broad sweep promotion review\n\nThis packet contains the ${selected.length} dossiers selected for human review. The generated content and edges have passed the ordinary trusted validator in an isolated combined tree, but no box below is a recorded decision until a human reviewer explicitly supplies it.\n\nRecord actual active review time rather than wall-clock delay:\n\n- Reviewer:\n- Review started:\n- Review completed:\n- Active review minutes:\n\n${reviewSections.join('\n').trimEnd()}\n`,
    'utf8',
  );
  const validation = validateIntegratedPreview(root, output);
  const issues = validation.issues
    .filter((issue) => issue.severity !== 'info')
    .map((issue) => ({
      severity: issue.severity,
      rule: issue.rule,
      file: issue.file,
      message: issue.message,
    }));
  const report: PromotionPreviewReport = {
    report_version: '1.0.0',
    campaign_id: String(triage.campaign_id),
    human_approval_required: true,
    summary: {
      proposed_new_concepts: newNodes.length,
      proposed_merge_refinements: mergeRefinements.length,
      proposed_edges: edges.length,
      reference_additions: 6,
      integrated_validation_errors: issues.filter((issue) => issue.severity === 'error').length,
      integrated_validation_warnings: issues.filter((issue) => issue.severity === 'warn').length,
    },
    concepts: newNodes.map((decision) => String(decision.candidate_id)).sort(),
    merge_refinements: mergeRefinements.map((decision) => String(decision.candidate_id)).sort(),
    validation_issues: issues,
  };
  const serialized = stableStringify(report);
  const mergeIds = report.merge_refinements;
  const formatted =
    mergeIds.length === 1
      ? serialized.replace(
          `  "merge_refinements": [\n    ${JSON.stringify(mergeIds[0])}\n  ],`,
          `  "merge_refinements": [${JSON.stringify(mergeIds[0])}],`,
        )
      : serialized;
  writeFileSync(join(output, 'promotion-report.json'), formatted, 'utf8');
  return report;
}
