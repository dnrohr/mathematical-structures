import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve, sep } from 'node:path';
import { parse, stringify } from 'yaml';
import { stableStringify } from '../emit.js';
import type { GraphNode } from '../model.js';
import { SLUG } from '../model.js';
import { runPipeline } from '../pipeline.js';
import type { AtlasSchema } from '../schema.js';
import { foldName, normalizeName } from './validate.js';

type RecordValue = Record<string, unknown>;

export interface HarvestIssue {
  severity: 'error' | 'warn' | 'info';
  rule: string;
  subject: string;
  reason: string;
}

export interface HarvestReport {
  report_version: '1.0.0';
  campaign: { id: string; title: string; target_raw_candidates: number };
  atlas_schema_version: string;
  summary: {
    raw_entries: number;
    normalized_clusters: number;
    duplicate_entries_consolidated: number;
    exact_atlas_matches: number;
    near_atlas_matches: number;
    novel_name_clusters: number;
    dossier_files: number;
  };
  sampling: { field: string; raw_entries: number }[];
  candidates: {
    id: string;
    canonical_name: string;
    source_ids: string[];
    raw_terms: string[];
    fields: string[];
    atlas_matches: { slug: string; relationship: string; trigger: string; atlas_value: string }[];
    preliminary_disposition: string;
    dossier_file: string;
  }[];
  issues: HarvestIssue[];
}

function isRecord(value: unknown): value is RecordValue {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function nonEmpty(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function strings(value: unknown): string[] {
  return Array.isArray(value) ? value.filter(nonEmpty) : [];
}

function records(value: unknown): RecordValue[] {
  return Array.isArray(value) ? value.filter(isRecord) : [];
}

function expandEntries(data: RecordValue): RecordValue[] {
  const expanded = [...records(data.entries)];
  for (const inventory of records(data.inventories)) {
    for (const termEntry of Array.isArray(inventory.terms) ? inventory.terms : []) {
      const term = isRecord(termEntry) ? termEntry.term : termEntry;
      expanded.push({
        ...(isRecord(termEntry) ? termEntry : {}),
        term,
        source_ids: [inventory.source_id],
        originating_fields: inventory.originating_fields,
        harvest_location: inventory.harvest_location,
      });
    }
  }
  return expanded;
}

function candidateId(name: string): string {
  const id = foldName(name)
    .replace(/\band\b/g, ' ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .replace(/-+/g, '-');
  return SLUG.test(id) ? id : 'invalid-candidate';
}

function tokenSimilarity(leftValue: string, rightValue: string): number {
  const left = new Set(normalizeName(leftValue).split(' ').filter(Boolean));
  const right = new Set(normalizeName(rightValue).split(' ').filter(Boolean));
  if (left.size === 0 || right.size === 0) return 0;
  const intersection = [...left].filter((token) => right.has(token)).length;
  return intersection / new Set([...left, ...right]).size;
}

function atlasMatches(
  names: string[],
  nodes: GraphNode[],
): { slug: string; relationship: string; trigger: string; atlas_value: string }[] {
  const matches: { slug: string; relationship: string; trigger: string; atlas_value: string }[] =
    [];
  const seen = new Set<string>();
  for (const node of nodes) {
    const atlasNames = [node.canonical_name, ...node.aliases.map((alias) => alias.name)];
    for (const name of names) {
      for (const atlasName of atlasNames) {
        const exact = normalizeName(name) === normalizeName(atlasName);
        const near = !exact && tokenSimilarity(name, atlasName) >= 0.6;
        if (!exact && !near) continue;
        const relationship = exact ? 'identity-or-alias' : 'near-name';
        const key = `${node.slug}|${relationship}|${name}|${atlasName}`;
        if (seen.has(key)) continue;
        seen.add(key);
        matches.push({ slug: node.slug, relationship, trigger: name, atlas_value: atlasName });
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

function validateManifest(
  data: unknown,
  file: string,
  schema: AtlasSchema,
): { manifest?: RecordValue; issues: HarvestIssue[] } {
  const issues: HarvestIssue[] = [];
  const error = (rule: string, subject: string, reason: string): void => {
    issues.push({ severity: 'error', rule, subject, reason });
  };
  if (!isRecord(data)) {
    error('harvest/root', file, 'manifest root must be a mapping');
    return { issues };
  }
  if (data.harvest_schema !== '1.0.0') {
    error('harvest/schema-version', `${file}#harvest_schema`, 'harvest_schema must be "1.0.0"');
  }
  const campaign = isRecord(data.campaign) ? data.campaign : undefined;
  if (
    !campaign ||
    !nonEmpty(campaign.id) ||
    !SLUG.test(campaign.id) ||
    !nonEmpty(campaign.title) ||
    !Array.isArray(campaign.sampling_frame) ||
    !Number.isInteger(campaign.target_raw_candidates)
  ) {
    error('harvest/campaign', `${file}#campaign`, 'campaign metadata is incomplete or invalid');
  }
  const sourceIds = new Set<string>();
  for (const [index, source] of records(data.sources).entries()) {
    if (!nonEmpty(source.id) || !SLUG.test(source.id) || sourceIds.has(source.id)) {
      error(
        'harvest/source',
        `${file}#sources[${index}]`,
        'source id must be unique lowercase-kebab',
      );
    } else sourceIds.add(source.id);
    if (!nonEmpty(source.title) || !nonEmpty(source.kind) || !nonEmpty(source.locator)) {
      error('harvest/source', `${file}#sources[${index}]`, 'source needs kind, title, and locator');
    }
  }
  if (sourceIds.size === 0)
    error('harvest/source', `${file}#sources`, 'at least one source is required');
  const fieldIds = new Set(schema.fields.map((field) => field.id));
  const entries = expandEntries(data);
  if (entries.length === 0)
    error('harvest/entry', `${file}#entries`, 'at least one entry is required');
  for (const [index, entry] of entries.entries()) {
    const subject = `${file}#entries[${index}]`;
    if (!nonEmpty(entry.term) || !nonEmpty(entry.harvest_location)) {
      error('harvest/entry', subject, 'entry needs term and harvest_location');
    }
    const entrySources = strings(entry.source_ids);
    if (entrySources.length === 0) error('harvest/entry', subject, 'entry needs source_ids');
    for (const sourceId of entrySources) {
      if (!sourceIds.has(sourceId))
        error('harvest/source-reference', subject, `unknown source "${sourceId}"`);
    }
    const fields = strings(entry.originating_fields);
    if (fields.length === 0) error('harvest/entry', subject, 'entry needs originating_fields');
    for (const field of fields) {
      if (!fieldIds.has(field))
        error('harvest/vocabulary', subject, `field "${field}" is not in graph/schema.yaml`);
    }
    for (const localName of records(entry.local_names)) {
      if (
        !nonEmpty(localName.name) ||
        !nonEmpty(localName.field) ||
        !fieldIds.has(localName.field)
      ) {
        error('harvest/vocabulary', subject, 'local name needs a valid name and schema field');
      }
    }
  }
  return issues.some((issue) => issue.severity === 'error')
    ? { issues }
    : { manifest: data, issues };
}

function ensureUntrustedOutput(root: string, output: string): void {
  const resolvedRoot = resolve(root);
  const resolvedOutput = resolve(output);
  for (const trusted of ['concepts', 'graph', 'paths']) {
    const trustedRoot = resolve(resolvedRoot, trusted);
    if (resolvedOutput === trustedRoot || resolvedOutput.startsWith(`${trustedRoot}${sep}`)) {
      throw new Error(`refusing to write campaign output inside trusted ${trusted}/`);
    }
  }
}

export function harvestManifest(
  rootInput: string,
  manifestInput: string,
  outputInput: string,
): HarvestReport {
  const root = resolve(rootInput);
  const manifestFile = resolve(manifestInput);
  const output = resolve(outputInput);
  ensureUntrustedOutput(root, output);
  const pipeline = runPipeline(root);
  if (
    !pipeline.schema ||
    !pipeline.graph ||
    pipeline.issues.some((issue) => issue.severity === 'error')
  ) {
    throw new Error('trusted atlas must validate before harvesting candidates');
  }
  let raw: unknown;
  try {
    raw = parse(readFileSync(manifestFile, 'utf8'));
  } catch (error) {
    throw new Error(`cannot parse harvest manifest: ${(error as Error).message}`);
  }
  const checked = validateManifest(raw, manifestFile, pipeline.schema);
  if (!checked.manifest) {
    const detail = checked.issues
      .map((issue) => `${issue.rule} ${issue.subject}: ${issue.reason}`)
      .join('\n');
    throw new Error(`invalid harvest manifest:\n${detail}`);
  }
  const manifest = checked.manifest;
  const campaign = manifest.campaign as RecordValue;
  const sources = records(manifest.sources);
  const sourcesById = new Map(sources.map((source) => [String(source.id), source]));
  const entries = expandEntries(manifest);
  const clusters = new Map<string, RecordValue[]>();
  for (const entry of entries) {
    const key = normalizeName(String(entry.term));
    const group = clusters.get(key) ?? [];
    group.push(entry);
    clusters.set(key, group);
  }
  const fieldCounts = new Map<string, number>();
  for (const entry of entries) {
    for (const field of strings(entry.originating_fields)) {
      fieldCounts.set(field, (fieldCounts.get(field) ?? 0) + 1);
    }
  }
  mkdirSync(output, { recursive: true });
  const usedIds = new Set<string>();
  const reportCandidates: HarvestReport['candidates'] = [];
  for (const [, clusterEntries] of [...clusters.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    const rawTerms = [...new Set(clusterEntries.map((entry) => String(entry.term).trim()))].sort();
    const canonicalName = [...rawTerms].sort(
      (a, b) => a.length - b.length || a.localeCompare(b),
    )[0]!;
    const fields = [
      ...new Set(clusterEntries.flatMap((entry) => strings(entry.originating_fields))),
    ].sort();
    const sourceIds = [
      ...new Set(clusterEntries.flatMap((entry) => strings(entry.source_ids))),
    ].sort();
    const localNames = clusterEntries.flatMap((entry) =>
      records(entry.local_names).map((localName) => ({
        name: String(localName.name),
        field: String(localName.field),
        source_ids: strings(entry.source_ids),
      })),
    );
    const acronyms = [
      ...new Set(clusterEntries.flatMap((entry) => strings(entry.acronyms))),
    ].sort();
    const names = [
      canonicalName,
      ...rawTerms,
      ...localNames.map((entry) => entry.name),
      ...acronyms,
    ];
    const matches = atlasMatches(names, pipeline.graph.nodes);
    let id = candidateId(canonicalName);
    if (usedIds.has(id)) {
      let suffix = 2;
      while (usedIds.has(`${id}-${suffix}`)) suffix++;
      id = `${id}-${suffix}`;
    }
    usedIds.add(id);
    const exact = matches.filter((match) => match.relationship === 'identity-or-alias');
    const preliminaryDisposition = exact.length > 0 ? 'merge-or-refine' : 'defer';
    const sourceInventory = sourceIds.map((sourceId) => sourcesById.get(sourceId)!);
    const possibleMatches = matches.map((match) => ({
      slug: match.slug,
      relationship: match.relationship === 'identity-or-alias' ? 'identity' : 'related',
      basis: `Harvest normalization: "${match.trigger}" matched "${match.atlas_value}".`,
      source_ids: sourceIds,
    }));
    const dossier = {
      dossier_schema: '1.0.0',
      candidate: {
        id,
        canonical_name: canonicalName,
        local_names: localNames,
        acronyms,
        originating_fields: fields,
        proposed_disposition: preliminaryDisposition,
        possible_matches: possibleMatches,
      },
      source_inventory: sourceInventory,
      claims: [],
      search: { queries: [], history: [] },
      generated_hypotheses: [],
      automated_judgments: [],
      adversarial_reviews: [],
      human_decisions: [],
      workflow: {
        state: 'normalized',
        history: [
          {
            from: null,
            to: 'harvested',
            reason: `Harvested from ${sourceIds.join(', ')} at ${clusterEntries.map((entry) => String(entry.harvest_location)).join('; ')}.`,
            actor: 'atlas-harvest',
          },
          {
            from: 'harvested',
            to: 'normalized',
            reason: `Consolidated ${clusterEntries.length} raw entr${clusterEntries.length === 1 ? 'y' : 'ies'} and compared names with the trusted atlas.`,
            actor: 'atlas-harvest',
          },
        ],
      },
    };
    const dossierFile = `${id}.yaml`;
    writeFileSync(join(output, dossierFile), stringify(dossier, { lineWidth: 100 }), 'utf8');
    reportCandidates.push({
      id,
      canonical_name: canonicalName,
      source_ids: sourceIds,
      raw_terms: rawTerms,
      fields,
      atlas_matches: matches,
      preliminary_disposition: preliminaryDisposition,
      dossier_file: dossierFile,
    });
  }
  const exactAtlasMatches = reportCandidates.filter((candidate) =>
    candidate.atlas_matches.some((match) => match.relationship === 'identity-or-alias'),
  ).length;
  const nearAtlasMatches = reportCandidates.filter(
    (candidate) =>
      candidate.atlas_matches.some((match) => match.relationship === 'near-name') &&
      !candidate.atlas_matches.some((match) => match.relationship === 'identity-or-alias'),
  ).length;
  const report: HarvestReport = {
    report_version: '1.0.0',
    campaign: {
      id: String(campaign.id),
      title: String(campaign.title),
      target_raw_candidates: Number(campaign.target_raw_candidates),
    },
    atlas_schema_version: pipeline.schema.schema_version,
    summary: {
      raw_entries: entries.length,
      normalized_clusters: reportCandidates.length,
      duplicate_entries_consolidated: entries.length - reportCandidates.length,
      exact_atlas_matches: exactAtlasMatches,
      near_atlas_matches: nearAtlasMatches,
      novel_name_clusters: reportCandidates.length - exactAtlasMatches - nearAtlasMatches,
      dossier_files: reportCandidates.length,
    },
    sampling: [...fieldCounts.entries()]
      .map(([field, raw_entries]) => ({ field, raw_entries }))
      .sort((a, b) => a.field.localeCompare(b.field)),
    candidates: reportCandidates,
    issues: checked.issues,
  };
  writeFileSync(join(output, 'campaign-report.json'), stableStringify(report), 'utf8');
  return report;
}
