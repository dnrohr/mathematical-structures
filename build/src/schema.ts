/**
 * Loading and validation of graph/schema.yaml — the controlled vocabularies.
 *
 * This is the M0 slice of the validator: it guarantees the ontology file
 * itself is coherent so that everything M1 validates content against is
 * trustworthy. Content validation (concepts/edges/symptoms against these
 * vocabularies) lands in M1 (ROADMAP.md).
 */
import { readFileSync } from 'node:fs';
import { parse } from 'yaml';

export type Severity = 'error' | 'warn' | 'info';

export interface Issue {
  severity: Severity;
  rule: string;
  file: string;
  message: string;
}

export interface NodeType {
  id: string;
  label: string;
  color_token: string;
  description: string;
}

export interface EdgeType {
  id: string;
  label: string;
  group: string;
  directionality: 'directed' | 'symmetric';
  forward?: string;
  reverse?: string;
  phrase?: string;
  description: string;
  example?: string;
}

export interface Strength {
  id: string;
  rank: number;
  line: 'solid' | 'dashed' | 'dotted';
  emphasis: 'strong' | 'medium' | 'light';
  description: string;
}

export interface FieldDef {
  id: string;
  label: string;
}

export interface StatusDef {
  id: string;
  description: string;
}

export interface AtlasSchema {
  schema_version: string;
  node_types: NodeType[];
  edge_types: EdgeType[];
  strengths: Strength[];
  fields: FieldDef[];
  node_statuses: StatusDef[];
  gap_statuses: StatusDef[];
  node_requirements: Record<string, string[]>;
  analysis: { trusted_min_strength: string };
}

const KEBAB_ID = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;
const EDGE_ID = /^[A-Z][A-Z0-9]*(-[A-Z0-9]+)*$/;
const SEMVER = /^\d+\.\d+\.\d+$/;
const LINES = new Set(['solid', 'dashed', 'dotted']);
const EMPHASES = new Set(['strong', 'medium', 'light']);

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function isNonEmptyString(v: unknown): v is string {
  return typeof v === 'string' && v.trim().length > 0;
}

class Collector {
  issues: Issue[] = [];
  constructor(private file: string) {}
  error(rule: string, message: string): void {
    this.issues.push({ severity: 'error', rule, file: this.file, message });
  }
  get hasErrors(): boolean {
    return this.issues.some((i) => i.severity === 'error');
  }
}

/** Check a list section: array of records with unique, well-formed ids. */
function checkList(
  c: Collector,
  data: Record<string, unknown>,
  section: string,
  idPattern: RegExp,
  requiredStringFields: string[],
): Record<string, unknown>[] {
  const raw = data[section];
  if (!Array.isArray(raw) || raw.length === 0) {
    c.error('schema/section-missing', `"${section}" must be a non-empty list`);
    return [];
  }
  const entries: Record<string, unknown>[] = [];
  const seen = new Set<string>();
  raw.forEach((entry, i) => {
    if (!isRecord(entry)) {
      c.error('schema/entry-shape', `${section}[${i}] must be a mapping`);
      return;
    }
    const id = entry.id;
    if (!isNonEmptyString(id)) {
      c.error('schema/entry-id', `${section}[${i}] is missing an "id"`);
      return;
    }
    if (!idPattern.test(id)) {
      c.error('schema/id-format', `${section} id "${id}" does not match ${idPattern}`);
    }
    if (seen.has(id)) {
      c.error('schema/duplicate-id', `${section} id "${id}" appears more than once`);
    }
    seen.add(id);
    for (const field of requiredStringFields) {
      if (!isNonEmptyString(entry[field])) {
        c.error('schema/entry-field', `${section} "${id}" is missing "${field}"`);
      }
    }
    entries.push(entry);
  });
  return entries;
}

/**
 * Validate a parsed schema document. Returns the typed schema when it has no
 * errors; always returns the issue list.
 */
export function validateSchema(
  data: unknown,
  file: string,
): { schema?: AtlasSchema; issues: Issue[] } {
  const c = new Collector(file);
  if (!isRecord(data)) {
    c.error('schema/root', 'schema.yaml must be a mapping at the top level');
    return { issues: c.issues };
  }

  if (!isNonEmptyString(data.schema_version) || !SEMVER.test(data.schema_version)) {
    c.error('schema/version', '"schema_version" must be a semver string like 1.0.0');
  }

  checkList(c, data, 'node_types', KEBAB_ID, ['label', 'color_token', 'description']);

  const edgeTypes = checkList(c, data, 'edge_types', EDGE_ID, ['label', 'group', 'description']);
  for (const et of edgeTypes) {
    const id = String(et.id);
    if (et.directionality !== 'directed' && et.directionality !== 'symmetric') {
      c.error(
        'schema/edge-directionality',
        `edge type "${id}" needs directionality "directed" or "symmetric"`,
      );
    } else if (et.directionality === 'directed') {
      if (!isNonEmptyString(et.forward) || !isNonEmptyString(et.reverse)) {
        c.error(
          'schema/edge-phrasing',
          `directed edge type "${id}" needs "forward" and "reverse" phrasings`,
        );
      }
      if (et.phrase !== undefined) {
        c.error('schema/edge-phrasing', `directed edge type "${id}" must not define "phrase"`);
      }
    } else {
      if (!isNonEmptyString(et.phrase)) {
        c.error('schema/edge-phrasing', `symmetric edge type "${id}" needs a "phrase"`);
      }
      if (et.forward !== undefined || et.reverse !== undefined) {
        c.error(
          'schema/edge-phrasing',
          `symmetric edge type "${id}" must not define "forward"/"reverse"`,
        );
      }
    }
  }

  const strengths = checkList(c, data, 'strengths', KEBAB_ID, ['description']);
  const ranks = new Set<number>();
  for (const s of strengths) {
    const id = String(s.id);
    if (typeof s.rank !== 'number' || !Number.isInteger(s.rank) || s.rank < 1) {
      c.error('schema/strength-rank', `strength "${id}" needs a positive integer "rank"`);
    } else if (ranks.has(s.rank)) {
      c.error('schema/strength-rank', `strength rank ${s.rank} ("${id}") is duplicated`);
    } else {
      ranks.add(s.rank);
    }
    if (!LINES.has(String(s.line))) {
      c.error('schema/strength-line', `strength "${id}" needs "line": solid | dashed | dotted`);
    }
    if (!EMPHASES.has(String(s.emphasis))) {
      c.error(
        'schema/strength-emphasis',
        `strength "${id}" needs "emphasis": strong | medium | light`,
      );
    }
  }
  if (strengths.length > 0) {
    for (let r = 1; r <= strengths.length; r++) {
      if (!ranks.has(r)) {
        c.error('schema/strength-rank', `strength ranks must be contiguous 1..n; missing ${r}`);
        break;
      }
    }
  }

  checkList(c, data, 'fields', KEBAB_ID, ['label']);
  const nodeStatuses = checkList(c, data, 'node_statuses', KEBAB_ID, ['description']);
  checkList(c, data, 'gap_statuses', KEBAB_ID, ['description']);

  // node_requirements: keys must be 'all' or a node status id.
  const statusIds = new Set(nodeStatuses.map((s) => String(s.id)));
  if (!isRecord(data.node_requirements)) {
    c.error('schema/node-requirements', '"node_requirements" must be a mapping');
  } else {
    for (const [key, value] of Object.entries(data.node_requirements)) {
      if (key !== 'all' && !statusIds.has(key)) {
        c.error(
          'schema/node-requirements',
          `node_requirements key "${key}" is neither "all" nor a node status`,
        );
      }
      if (!Array.isArray(value) || value.some((f) => !isNonEmptyString(f))) {
        c.error(
          'schema/node-requirements',
          `node_requirements["${key}"] must be a list of field names`,
        );
      }
    }
  }

  // analysis.trusted_min_strength must be a strength id.
  const strengthIds = new Set(strengths.map((s) => String(s.id)));
  if (!isRecord(data.analysis) || !isNonEmptyString(data.analysis.trusted_min_strength)) {
    c.error('schema/analysis', '"analysis.trusted_min_strength" must name a strength');
  } else if (!strengthIds.has(data.analysis.trusted_min_strength)) {
    c.error(
      'schema/analysis',
      `analysis.trusted_min_strength "${data.analysis.trusted_min_strength}" is not a strength id`,
    );
  }

  if (c.hasErrors) return { issues: c.issues };
  return { schema: data as unknown as AtlasSchema, issues: c.issues };
}

/** Read, parse, and validate a schema.yaml file from disk. */
export function loadSchema(path: string): { schema?: AtlasSchema; issues: Issue[] } {
  let text: string;
  try {
    text = readFileSync(path, 'utf8');
  } catch (e) {
    return {
      issues: [
        {
          severity: 'error',
          rule: 'schema/read',
          file: path,
          message: `cannot read file: ${(e as Error).message}`,
        },
      ],
    };
  }
  let data: unknown;
  try {
    data = parse(text);
  } catch (e) {
    return {
      issues: [
        {
          severity: 'error',
          rule: 'schema/yaml',
          file: path,
          message: `YAML parse error: ${(e as Error).message}`,
        },
      ],
    };
  }
  return validateSchema(data, path);
}
