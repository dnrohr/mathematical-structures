/**
 * Stage 2 — validate: the content test suite (ARCHITECTURE.md §4.2).
 * Every rule is its own function with a stable rule id; rules collect issues
 * rather than throwing so a run reports everything at once.
 */
import {
  GAP_EDGE_TYPE,
  HEURISTIC_ANALOGY,
  SPECULATIVE,
  STUB_STATUS,
  type ConceptRecord,
  type EdgeRecord,
  type Issue,
  type SymptomRecord,
} from './model.js';
import type { AtlasSchema } from './schema.js';

const KNOWN_CONCEPT_KEYS = new Set([
  'canonical_name',
  'node_type',
  'status',
  'summary',
  'fields',
  'aliases',
  'assumptions',
  'canonical_examples',
  'sections',
]);

const KNOWN_EDGE_KEYS = new Set([
  'from',
  'to',
  'type',
  'strength',
  'context',
  'status',
  'notes',
  'directionality',
  'evidence',
]);

const KNOWN_SYMPTOM_KEYS = new Set(['id', 'symptom', 'moves', 'mature_fields', 'worked_example']);

export interface Vocab {
  nodeTypes: Set<string>;
  nodeStatuses: Set<string>;
  gapStatuses: Set<string>;
  fields: Set<string>;
  strengthRank: Map<string, number>;
  edgeTypeSymmetric: Map<string, boolean>;
}

export function vocabOf(schema: AtlasSchema): Vocab {
  return {
    nodeTypes: new Set(schema.node_types.map((t) => t.id)),
    nodeStatuses: new Set(schema.node_statuses.map((s) => s.id)),
    gapStatuses: new Set(schema.gap_statuses.map((s) => s.id)),
    fields: new Set(schema.fields.map((f) => f.id)),
    strengthRank: new Map(schema.strengths.map((s) => [s.id, s.rank])),
    edgeTypeSymmetric: new Map(
      schema.edge_types.map((e) => [e.id, e.directionality === 'symmetric']),
    ),
  };
}

function isNonEmptyString(v: unknown): v is string {
  return typeof v === 'string' && v.trim().length > 0;
}

function isStringArray(v: unknown): v is string[] {
  return Array.isArray(v) && v.every(isNonEmptyString);
}

class Rules {
  issues: Issue[] = [];
  add(severity: Issue['severity'], rule: string, file: string, message: string): void {
    this.issues.push({ severity, rule, file, message });
  }
}

// ---------------------------------------------------------------------------
// Concept rules
// ---------------------------------------------------------------------------

function validateConcept(r: Rules, schema: AtlasSchema, v: Vocab, c: ConceptRecord): void {
  for (const key of Object.keys(c.front)) {
    if (!KNOWN_CONCEPT_KEYS.has(key)) {
      r.add('warn', 'content/unknown-key', c.file, `unknown front-matter key "${key}"`);
    }
  }

  const status = c.front.status;
  const required = new Set(schema.node_requirements.all ?? []);
  if (isNonEmptyString(status)) {
    for (const f of schema.node_requirements[status] ?? []) required.add(f);
  }
  for (const field of required) {
    const value = c.front[field];
    const present = Array.isArray(value) ? value.length > 0 : isNonEmptyString(value);
    if (!present) {
      r.add(
        'error',
        'content/required-field',
        c.file,
        `missing required front-matter field "${field}" (status "${String(status ?? 'unset')}")`,
      );
    }
  }

  if (c.front.node_type !== undefined && !v.nodeTypes.has(String(c.front.node_type))) {
    r.add(
      'error',
      'content/unknown-node-type',
      c.file,
      `node_type "${String(c.front.node_type)}" is not in schema.yaml`,
    );
  }
  if (status !== undefined && !v.nodeStatuses.has(String(status))) {
    r.add(
      'error',
      'content/unknown-status',
      c.file,
      `status "${String(status)}" is not in schema.yaml`,
    );
  }

  const fields = c.front.fields;
  if (fields !== undefined) {
    if (!isStringArray(fields)) {
      r.add('error', 'content/fields-shape', c.file, '"fields" must be a list of field ids');
    } else {
      for (const f of fields) {
        if (!v.fields.has(f)) {
          r.add('error', 'content/unknown-field', c.file, `field "${f}" is not in schema.yaml`);
        }
      }
    }
  }

  const aliases = c.front.aliases;
  if (aliases !== undefined) {
    if (!Array.isArray(aliases)) {
      r.add('error', 'content/alias-shape', c.file, '"aliases" must be a list');
    } else {
      aliases.forEach((a, i) => {
        const entry = a as Record<string, unknown> | null;
        if (
          entry === null ||
          typeof entry !== 'object' ||
          !isNonEmptyString(entry.name) ||
          !isNonEmptyString(entry.field)
        ) {
          r.add('error', 'content/alias-shape', c.file, `aliases[${i}] needs "name" and "field"`);
          return;
        }
        if (!v.fields.has(entry.field)) {
          r.add(
            'error',
            'content/unknown-field',
            c.file,
            `aliases[${i}] field "${entry.field}" is not in schema.yaml`,
          );
        }
      });
    }
  }

  for (const listKey of ['assumptions', 'canonical_examples', 'sections'] as const) {
    const value = c.front[listKey];
    if (value !== undefined && !isStringArray(value)) {
      r.add('error', 'content/list-shape', c.file, `"${listKey}" must be a list of strings`);
    }
  }

  // Dialect coverage: a multi-field concept without aliases is suspicious.
  if (
    isStringArray(fields) &&
    fields.length >= 3 &&
    (!Array.isArray(aliases) || aliases.length === 0)
  ) {
    r.add(
      'warn',
      'content/aliases-expected',
      c.file,
      `spans ${fields.length} fields but records no dialect aliases`,
    );
  }
}

// ---------------------------------------------------------------------------
// Edge rules
// ---------------------------------------------------------------------------

function validateEdge(
  r: Rules,
  v: Vocab,
  slugs: Set<string>,
  e: EdgeRecord,
  seen: Set<string>,
): void {
  const where = `${e.file}[${e.index}]`;
  const raw = e.raw;

  for (const key of Object.keys(raw)) {
    if (!KNOWN_EDGE_KEYS.has(key)) {
      r.add('warn', 'content/unknown-key', where, `unknown edge key "${key}"`);
    }
  }

  const from = raw.from;
  const to = raw.to;
  for (const [label, value] of [
    ['from', from],
    ['to', to],
  ] as const) {
    if (!isNonEmptyString(value)) {
      r.add('error', 'edge/endpoint-missing', where, `edge needs a "${label}" slug`);
    } else if (!slugs.has(value)) {
      r.add('error', 'edge/unknown-endpoint', where, `"${label}: ${value}" is not a concept slug`);
    }
  }
  if (isNonEmptyString(from) && isNonEmptyString(to) && from === to) {
    r.add('error', 'edge/self-loop', where, `edge from "${from}" to itself`);
  }

  const type = raw.type;
  let symmetric: boolean | undefined;
  if (!isNonEmptyString(type) || !v.edgeTypeSymmetric.has(type)) {
    r.add('error', 'edge/unknown-type', where, `type "${String(type)}" is not in schema.yaml`);
  } else {
    symmetric = v.edgeTypeSymmetric.get(type);
  }

  const strength = raw.strength;
  if (!isNonEmptyString(strength) || !v.strengthRank.has(strength)) {
    r.add(
      'error',
      'edge/unknown-strength',
      where,
      `strength "${String(strength)}" is not in schema.yaml`,
    );
  }

  // Directionality override: only "symmetric", only meaningful on directed types.
  if (raw.directionality !== undefined) {
    if (raw.directionality !== 'symmetric') {
      r.add(
        'error',
        'edge/directionality',
        where,
        `directionality may only be "symmetric" (got "${String(raw.directionality)}")`,
      );
    } else if (symmetric === true) {
      r.add('warn', 'edge/directionality', where, 'redundant "symmetric" on a symmetric type');
    } else {
      symmetric = true;
    }
  }

  // Epistemic rules (ARCHITECTURE.md §4.2).
  const status = raw.status;
  const isGap = type === GAP_EDGE_TYPE;
  const isSpeculative = strength === SPECULATIVE;
  if ((isGap || isSpeculative) && !isNonEmptyString(status)) {
    r.add(
      'error',
      'edge/needs-gap-status',
      where,
      `${isGap ? GAP_EDGE_TYPE : 'speculative'} edges must carry a gap workflow "status"`,
    );
  }
  if (isNonEmptyString(status)) {
    if (!v.gapStatuses.has(status)) {
      r.add('error', 'edge/unknown-gap-status', where, `status "${status}" is not a gap status`);
    }
    if (!isGap && !isSpeculative) {
      r.add(
        'error',
        'edge/unexpected-status',
        where,
        'a gap workflow status belongs only on POSSIBLE-MISSING-MIGRATION or speculative edges',
      );
    }
  }
  if (isGap && isNonEmptyString(strength)) {
    const rank = v.strengthRank.get(strength);
    const floor = v.strengthRank.get(HEURISTIC_ANALOGY);
    if (rank !== undefined && floor !== undefined && rank < floor) {
      r.add(
        'error',
        'edge/gap-strength',
        where,
        `${GAP_EDGE_TYPE} may not claim strength stronger than ${HEURISTIC_ANALOGY}`,
      );
    }
  }

  if (raw.evidence !== undefined && !Array.isArray(raw.evidence)) {
    r.add('error', 'edge/evidence-shape', where, '"evidence" must be a list');
  }
  for (const key of ['context', 'notes'] as const) {
    if (raw[key] !== undefined && !isNonEmptyString(raw[key])) {
      r.add('error', 'edge/text-shape', where, `"${key}" must be a non-empty string`);
    }
  }

  // Duplicates (including the reversed duplicate of a symmetric edge).
  if (isNonEmptyString(from) && isNonEmptyString(to) && isNonEmptyString(type)) {
    const key = `${from}|${to}|${type}`;
    const reversed = `${to}|${from}|${type}`;
    if (seen.has(key) || (symmetric === true && seen.has(reversed))) {
      r.add('error', 'edge/duplicate', where, `duplicate edge ${from} -${type}-> ${to}`);
    }
    seen.add(key);
  }
}

// ---------------------------------------------------------------------------
// Symptom rules
// ---------------------------------------------------------------------------

function validateSymptom(
  r: Rules,
  v: Vocab,
  slugs: Set<string>,
  stubs: Set<string>,
  s: SymptomRecord,
  seenIds: Set<string>,
): void {
  const where = `${s.file}[${s.index}]`;
  const raw = s.raw;

  for (const key of Object.keys(raw)) {
    if (!KNOWN_SYMPTOM_KEYS.has(key)) {
      r.add('warn', 'content/unknown-key', where, `unknown symptom key "${key}"`);
    }
  }
  if (!isNonEmptyString(raw.id)) {
    r.add('error', 'symptom/id', where, 'symptom needs an "id"');
  } else if (seenIds.has(raw.id)) {
    r.add('error', 'symptom/duplicate-id', where, `duplicate symptom id "${raw.id}"`);
  } else {
    seenIds.add(raw.id);
  }
  if (!isNonEmptyString(raw.symptom)) {
    r.add('error', 'symptom/text', where, 'symptom needs display text in "symptom"');
  }
  if (!isStringArray(raw.moves) || raw.moves.length === 0) {
    r.add('error', 'symptom/moves', where, '"moves" must be a non-empty list of concept slugs');
  } else {
    for (const move of raw.moves) {
      if (!slugs.has(move)) {
        r.add('error', 'symptom/unknown-move', where, `move "${move}" is not a concept slug`);
      } else if (stubs.has(move)) {
        r.add('warn', 'symptom/stub-move', where, `move "${move}" is only a stub node`);
      }
    }
  }
  if (raw.mature_fields !== undefined) {
    if (!isStringArray(raw.mature_fields)) {
      r.add('error', 'symptom/fields-shape', where, '"mature_fields" must be a list of field ids');
    } else {
      for (const f of raw.mature_fields) {
        if (!v.fields.has(f)) {
          r.add('error', 'content/unknown-field', where, `field "${f}" is not in schema.yaml`);
        }
      }
    }
  }
  if (raw.worked_example !== undefined) {
    if (!isNonEmptyString(raw.worked_example) || !slugs.has(raw.worked_example)) {
      r.add(
        'error',
        'symptom/unknown-example',
        where,
        `worked_example "${String(raw.worked_example)}" is not a concept slug`,
      );
    }
  }
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

export function validateContent(
  schema: AtlasSchema,
  concepts: ConceptRecord[],
  edges: EdgeRecord[],
  symptoms: SymptomRecord[],
): Issue[] {
  const r = new Rules();
  const v = vocabOf(schema);
  const slugs = new Set(concepts.map((c) => c.slug));
  const stubs = new Set(concepts.filter((c) => c.front.status === STUB_STATUS).map((c) => c.slug));

  for (const c of concepts) validateConcept(r, schema, v, c);

  const seenEdges = new Set<string>();
  for (const e of edges) validateEdge(r, v, slugs, e, seenEdges);

  const seenSymptomIds = new Set<string>();
  for (const s of symptoms) validateSymptom(r, v, slugs, stubs, s, seenSymptomIds);

  return r.issues;
}
