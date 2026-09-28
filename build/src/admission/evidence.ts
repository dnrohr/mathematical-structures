import { readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { parse, stringify } from 'yaml';
import { stableStringify } from '../emit.js';

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

function assertKnownKeys(record: RecordValue, allowed: string[], subject: string): void {
  const unexpected = Object.keys(record)
    .filter((key) => !allowed.includes(key))
    .sort();
  if (unexpected.length > 0)
    throw new Error(`${subject} has unexpected field(s): ${unexpected.join(', ')}`);
}

function requiredStringArray(record: RecordValue, key: string, subject: string): string[] {
  if (
    !Array.isArray(record[key]) ||
    !(record[key] as unknown[]).every((item) => typeof item === 'string')
  )
    throw new Error(`${subject}.${key} must be an array of strings`);
  return strings(record[key]);
}

export interface EvidenceReport {
  report_version: '1.0.0';
  campaign_id: string;
  assessor: string;
  summary: {
    selected: number;
    enriched: number;
    direct_support_assessments: number;
    adversarial_reviews: number;
  };
  candidates: {
    candidate_id: string;
    claim_id: string;
    source_id: string;
    workflow_state: string;
  }[];
}

export function applyEvidencePack(
  campaignDirectoryInput: string,
  packInput: string,
): EvidenceReport {
  const campaignDirectory = resolve(campaignDirectoryInput);
  const packFile = resolve(packInput);
  const triage = JSON.parse(
    readFileSync(join(campaignDirectory, 'triage-report.json'), 'utf8'),
  ) as RecordValue;
  const pack = parse(readFileSync(packFile, 'utf8')) as unknown;
  if (!isRecord(pack) || pack.evidence_schema !== '1.0.0')
    throw new Error('evidence pack must be a version 1.0.0 mapping');
  assertKnownKeys(pack, ['evidence_schema', 'campaign_id', 'assessor', 'entries'], 'evidence pack');
  if (pack.campaign_id !== triage.campaign_id)
    throw new Error(
      `evidence campaign_id must match triage campaign "${String(triage.campaign_id)}"`,
    );
  const assessor = requiredString(pack, 'assessor', 'evidence pack');
  const selected = new Set(
    records(triage.decisions)
      .filter((decision) => decision.selected_for_review === true)
      .map((decision) => String(decision.candidate_id)),
  );
  const entries = records(pack.entries);
  const byId = new Map<string, RecordValue>();
  for (const entry of entries) {
    const id = requiredString(entry, 'candidate_id', 'evidence entry');
    assertKnownKeys(
      entry,
      [
        'candidate_id',
        'proposition',
        'endpoints',
        'edge',
        'mathematical_skeleton',
        'scope',
        'assumptions',
        'validity_regime',
        'caveats',
        'counterexamples',
        'source_id',
        'source_location',
        'possible_falsifiers',
        'alternative_interpretations',
        'search_query',
        'challenge',
        'response',
        'recommended_action',
      ],
      id,
    );
    const endpoints = isRecord(entry.endpoints) ? entry.endpoints : {};
    const edge = isRecord(entry.edge) ? entry.edge : {};
    assertKnownKeys(endpoints, ['from', 'to'], `${id}.endpoints`);
    assertKnownKeys(edge, ['type', 'strength', 'context'], `${id}.edge`);
    for (const key of [
      'assumptions',
      'caveats',
      'counterexamples',
      'possible_falsifiers',
      'alternative_interpretations',
    ])
      requiredStringArray(entry, key, id);
    if (!selected.has(id))
      throw new Error(`evidence entry "${id}" is not in the triage review queue`);
    if (byId.has(id)) throw new Error(`evidence entry "${id}" occurs more than once`);
    byId.set(id, entry);
  }
  const missing = [...selected].filter((id) => !byId.has(id)).sort();
  if (missing.length > 0)
    throw new Error(`review queue lacks evidence entries: ${missing.join(', ')}`);
  const candidates: EvidenceReport['candidates'] = [];
  for (const id of [...selected].sort()) {
    const entry = byId.get(id)!;
    const dossierFile = join(campaignDirectory, 'normalized', `${id}.yaml`);
    const dossier = parse(readFileSync(dossierFile, 'utf8')) as RecordValue;
    const sourceId = requiredString(entry, 'source_id', id);
    if (!records(dossier.source_inventory).some((source) => source.id === sourceId))
      throw new Error(`${id}.source_id "${sourceId}" is absent from its harvested inventory`);
    const endpoints = isRecord(entry.endpoints) ? entry.endpoints : {};
    const edge = isRecord(entry.edge) ? entry.edge : {};
    const claimId = `${id}-claim`;
    const proposition = requiredString(entry, 'proposition', id);
    dossier.claims = [
      {
        id: claimId,
        proposition,
        endpoints: {
          from: requiredString(endpoints, 'from', `${id}.endpoints`),
          to: requiredString(endpoints, 'to', `${id}.endpoints`),
        },
        proposed_edge: {
          type: requiredString(edge, 'type', `${id}.edge`),
          strength: requiredString(edge, 'strength', `${id}.edge`),
          context: requiredString(edge, 'context', `${id}.edge`),
        },
        mathematical_skeleton: requiredString(entry, 'mathematical_skeleton', id),
        scope: requiredString(entry, 'scope', id),
        assumptions: requiredStringArray(entry, 'assumptions', id),
        validity_regime: requiredString(entry, 'validity_regime', id),
        caveats: requiredStringArray(entry, 'caveats', id),
        counterexamples: requiredStringArray(entry, 'counterexamples', id),
        source_assessments: [
          {
            source_id: sourceId,
            proposition,
            status: 'direct-support',
            location: requiredString(entry, 'source_location', id),
            rationale:
              'The cited textbook location states or develops this proposition; no inference is made from topical co-mention alone.',
            assessor: { kind: 'model-assisted', identity: assessor, version: '1.0.0' },
          },
        ],
        possible_falsifiers: requiredStringArray(entry, 'possible_falsifiers', id),
        alternative_interpretations: requiredStringArray(entry, 'alternative_interpretations', id),
      },
    ];
    dossier.search = {
      queries: [
        {
          id: `${id}-query`,
          query: requiredString(entry, 'search_query', id),
          dialects: [],
          designed_by: assessor,
        },
      ],
      history: [
        {
          query_id: `${id}-query`,
          result: 'located',
          source_ids: [sourceId],
          executed_by: assessor,
          notes: requiredString(entry, 'source_location', id),
        },
      ],
    };
    dossier.generated_hypotheses = [
      {
        id: `${id}-hypothesis`,
        text: proposition,
        generator: assessor,
        input_source_ids: [sourceId],
      },
    ];
    dossier.automated_judgments = [
      {
        id: `${id}-judgment`,
        method: 'model-assisted',
        subject: claimId,
        recommendation: 'retain',
        rationale:
          'Retain for adversarial review because the proposition is atomic, scoped, and source-located.',
        provenance: [packFile, `${dossierFile}#source_inventory`],
      },
    ];
    dossier.adversarial_reviews = [
      {
        id: `${id}-adversarial`,
        method: 'model-assisted',
        reviewer: `${assessor}-adversarial`,
        challenge: requiredString(entry, 'challenge', id),
        response: requiredString(entry, 'response', id),
        recommended_action: requiredString(entry, 'recommended_action', id),
        provenance: [packFile, `${dossierFile}#claims.${claimId}`],
      },
    ];
    const workflow = isRecord(dossier.workflow) ? dossier.workflow : { history: [] };
    const history = records(workflow.history).slice(0, 2);
    history.push(
      {
        from: 'normalized',
        to: 'dossier-ready',
        reason: 'Triage selected this candidate for the bounded evidence queue.',
        actor: assessor,
      },
      {
        from: 'dossier-ready',
        to: 'evidence-collected',
        reason: 'An atomic proposition was assessed at a source-specific location.',
        actor: assessor,
      },
      {
        from: 'evidence-collected',
        to: 'assessed',
        reason: 'Scope, assumptions, caveats, falsifiers, and alternatives were recorded.',
        actor: assessor,
      },
      {
        from: 'assessed',
        to: 'automated-review-passed',
        reason:
          'Deterministic validation and a separate adversarial review are ready for human review.',
        actor: assessor,
      },
    );
    dossier.workflow = { state: 'automated-review-passed', history };
    writeFileSync(dossierFile, stringify(dossier, { lineWidth: 100 }), 'utf8');
    candidates.push({
      candidate_id: id,
      claim_id: claimId,
      source_id: sourceId,
      workflow_state: 'automated-review-passed',
    });
  }
  const report: EvidenceReport = {
    report_version: '1.0.0',
    campaign_id: String(pack.campaign_id),
    assessor,
    summary: {
      selected: selected.size,
      enriched: candidates.length,
      direct_support_assessments: candidates.length,
      adversarial_reviews: candidates.length,
    },
    candidates,
  };
  writeFileSync(join(campaignDirectory, 'evidence-report.json'), stableStringify(report), 'utf8');
  return report;
}
