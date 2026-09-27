import { readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { parse, stringify } from 'yaml';
import { stableStringify } from '../emit.js';
import { DISPOSITIONS } from './model.js';

type RecordValue = Record<string, unknown>;

function isRecord(value: unknown): value is RecordValue {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function strings(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : [];
}

export interface TriageReport {
  report_version: '1.0.0';
  campaign_id: string;
  curator: string;
  summary: {
    survivors: number;
    classified: number;
    review_queue: number;
    by_disposition: Record<string, number>;
  };
  decisions: {
    candidate_id: string;
    disposition: string;
    proposed_node_type?: string;
    target_slug?: string;
    rationale: string;
    selected_for_review: boolean;
  }[];
}

export function triageCampaign(
  campaignDirectoryInput: string,
  manifestInput: string,
): TriageReport {
  const campaignDirectory = resolve(campaignDirectoryInput);
  const manifestFile = resolve(manifestInput);
  const campaignReport = JSON.parse(
    readFileSync(join(campaignDirectory, 'normalized', 'campaign-report.json'), 'utf8'),
  ) as RecordValue;
  const manifest = parse(readFileSync(manifestFile, 'utf8')) as unknown;
  if (!isRecord(manifest) || manifest.triage_schema !== '1.0.0')
    throw new Error('triage manifest must be a version 1.0.0 mapping');
  const campaign = isRecord(campaignReport.campaign) ? campaignReport.campaign : {};
  if (manifest.campaign_id !== campaign.id)
    throw new Error(`triage campaign_id must match harvested campaign "${String(campaign.id)}"`);
  if (typeof manifest.curator !== 'string' || manifest.curator.trim() === '')
    throw new Error('triage curator is required');
  const candidates = Array.isArray(campaignReport.candidates)
    ? campaignReport.candidates.filter(isRecord)
    : [];
  const candidateIds = new Set(candidates.map((candidate) => String(candidate.id)));
  const decisions = new Map<string, TriageReport['decisions'][number]>();
  const groups = Array.isArray(manifest.groups) ? manifest.groups.filter(isRecord) : [];
  for (const [groupIndex, group] of groups.entries()) {
    const disposition = String(group.disposition ?? '');
    if (!DISPOSITIONS.has(disposition))
      throw new Error(`groups[${groupIndex}] has invalid disposition "${disposition}"`);
    if (typeof group.rationale !== 'string' || group.rationale.trim() === '')
      throw new Error(`groups[${groupIndex}] needs a rationale`);
    for (const candidateId of strings(group.candidate_ids)) {
      if (!candidateIds.has(candidateId))
        throw new Error(`unknown triage candidate "${candidateId}"`);
      if (decisions.has(candidateId))
        throw new Error(`candidate "${candidateId}" is classified more than once`);
      decisions.set(candidateId, {
        candidate_id: candidateId,
        disposition,
        ...(typeof group.proposed_node_type === 'string'
          ? { proposed_node_type: group.proposed_node_type }
          : {}),
        ...(typeof group.target_slug === 'string' ? { target_slug: group.target_slug } : {}),
        rationale: group.rationale,
        selected_for_review: false,
      });
    }
  }
  const missing = [...candidateIds].filter((id) => !decisions.has(id)).sort();
  if (missing.length > 0) throw new Error(`unclassified candidates: ${missing.join(', ')}`);
  const queue = strings(manifest.review_queue);
  if (queue.length < 30 || queue.length > 50 || new Set(queue).size !== queue.length)
    throw new Error('review_queue must contain 30-50 unique candidates');
  for (const candidateId of queue) {
    const decision = decisions.get(candidateId);
    if (!decision) throw new Error(`review_queue contains unknown candidate "${candidateId}"`);
    if (['defer', 'reject'].includes(decision.disposition))
      throw new Error(
        `review_queue candidate "${candidateId}" has terminal triage disposition ${decision.disposition}`,
      );
    decision.selected_for_review = true;
  }
  for (const decision of decisions.values()) {
    const dossierFile = join(campaignDirectory, 'normalized', `${decision.candidate_id}.yaml`);
    const dossier = parse(readFileSync(dossierFile, 'utf8')) as RecordValue;
    const candidate = isRecord(dossier.candidate) ? dossier.candidate : {};
    candidate.proposed_disposition = decision.disposition;
    if (decision.proposed_node_type) candidate.proposed_node_type = decision.proposed_node_type;
    else delete candidate.proposed_node_type;
    dossier.candidate = candidate;
    writeFileSync(dossierFile, stringify(dossier, { lineWidth: 100 }), 'utf8');
  }
  const ordered = [...decisions.values()].sort((a, b) =>
    a.candidate_id.localeCompare(b.candidate_id),
  );
  const byDisposition: Record<string, number> = {};
  for (const decision of ordered)
    byDisposition[decision.disposition] = (byDisposition[decision.disposition] ?? 0) + 1;
  const report: TriageReport = {
    report_version: '1.0.0',
    campaign_id: String(manifest.campaign_id),
    curator: String(manifest.curator),
    summary: {
      survivors: candidateIds.size,
      classified: decisions.size,
      review_queue: queue.length,
      by_disposition: byDisposition,
    },
    decisions: ordered,
  };
  writeFileSync(join(campaignDirectory, 'triage-report.json'), stableStringify(report), 'utf8');
  return report;
}
