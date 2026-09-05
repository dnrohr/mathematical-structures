/**
 * Stage 2 — validate: the content test suite (ARCHITECTURE.md §4.2).
 * Every rule is its own function with a stable rule id; rules collect issues
 * rather than throwing so a run reports everything at once.
 */
import {
  APPLICATION_EDGE_TYPES,
  APPLICATION_NODE_TYPE,
  GAP_EDGE_TYPE,
  HEURISTIC_ANALOGY,
  SLUG,
  SPECULATIVE,
  STUB_STATUS,
  type ConceptRecord,
  type EdgeRecord,
  type Issue,
  type NonEdgeRecord,
  type ReferenceRecord,
  type SymptomRecord,
  type WalkRecord,
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

const KNOWN_NON_EDGE_KEYS = new Set(['between', 'reason', 'see']);

/** What a non-edge `see` pointer may be besides a concept slug. */
const HTTP_URL = /^https?:\/\/\S+$/;

const KNOWN_WALK_KEYS = new Set(['title', 'summary', 'steps']);
const KNOWN_WALK_STEP_KEYS = new Set(['slug', 'note']);

/** The concrete BibTeX entry types graph/references.bib may use. */
const BIB_ENTRY_TYPES = new Set([
  'article',
  'book',
  'booklet',
  'incollection',
  'inproceedings',
  'manual',
  'mastersthesis',
  'misc',
  'phdthesis',
  'proceedings',
  'techreport',
  'unpublished',
]);

/** A citation must at least be findable: who-free, but never title/year-free. */
const REQUIRED_REFERENCE_FIELDS = ['title', 'year'] as const;

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
  refKeys: Set<string>,
  citedKeys: Set<string>,
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

  // Symmetry comes from the edge type alone. A per-edge override was
  // considered and rejected: a directed type has no symmetric display
  // phrase (its forward phrasing would render on both endpoints) and
  // overrides make reversed-duplicate detection order-dependent.
  if (raw.directionality !== undefined) {
    r.add(
      'error',
      'edge/directionality',
      where,
      'per-edge "directionality" is not supported; symmetry comes from the edge type — use a symmetric type instead',
    );
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

  // Citations (ROADMAP M8): every evidence entry must resolve to a
  // graph/references.bib key — a citation that points nowhere is worse
  // than none, so it fails the build rather than rendering broken.
  if (raw.evidence !== undefined && !Array.isArray(raw.evidence)) {
    r.add('error', 'edge/evidence-shape', where, '"evidence" must be a list of citation keys');
  } else if (Array.isArray(raw.evidence)) {
    const seenKeys = new Set<string>();
    raw.evidence.forEach((entry, i) => {
      if (!isNonEmptyString(entry)) {
        r.add('error', 'edge/evidence-shape', where, `evidence[${i}] must be a citation key`);
        return;
      }
      if (seenKeys.has(entry)) {
        r.add('error', 'edge/duplicate-evidence', where, `evidence cites "${entry}" twice`);
        return;
      }
      seenKeys.add(entry);
      citedKeys.add(entry);
      if (!refKeys.has(entry)) {
        r.add(
          'error',
          'edge/unknown-evidence',
          where,
          `evidence key "${entry}" has no entry in graph/references.bib`,
        );
      }
    });
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
// Non-edge rules (UI_REDESIGN.md §4.6; ROADMAP M11; ARCHITECTURE.md §3.8).
// The ledger records reviewed decisions NOT to connect a pair, so the two
// epistemic rules are: the pair must exist, and the ledger may never
// contradict the edge list — a typed edge and a recorded rejection of the
// same pair cannot both stand.
// ---------------------------------------------------------------------------

function validateNonEdge(
  r: Rules,
  slugs: Set<string>,
  edgeTypesByPair: Map<string, string[]>,
  n: NonEdgeRecord,
  seenPairs: Set<string>,
): void {
  const where = `${n.file}[${n.index}]`;
  const raw = n.raw;

  for (const key of Object.keys(raw)) {
    if (!KNOWN_NON_EDGE_KEYS.has(key)) {
      r.add('warn', 'content/unknown-key', where, `unknown non-edge key "${key}"`);
    }
  }

  const between = raw.between;
  if (!Array.isArray(between) || between.length !== 2 || !between.every(isNonEmptyString)) {
    r.add(
      'error',
      'non-edge/between-shape',
      where,
      '"between" must be a list of exactly two concept slugs',
    );
    return;
  }
  const [a, b] = between as [string, string];
  let endpointsOk = true;
  for (const slug of [a, b]) {
    if (!slugs.has(slug)) {
      endpointsOk = false;
      r.add('error', 'non-edge/unknown-endpoint', where, `"${slug}" is not a concept slug`);
    }
  }
  if (a === b) {
    endpointsOk = false;
    r.add('error', 'non-edge/self-pair', where, `non-edge between "${a}" and itself`);
  }

  if (!isNonEmptyString(raw.reason)) {
    r.add(
      'error',
      'non-edge/reason',
      where,
      'a non-edge is a reviewed decision and needs a non-empty "reason"',
    );
  }
  if (raw.see !== undefined) {
    if (!isNonEmptyString(raw.see) || !(slugs.has(raw.see) || HTTP_URL.test(raw.see))) {
      r.add(
        'error',
        'non-edge/see',
        where,
        `"see" must be an existing concept slug or an http(s) URL, not "${String(raw.see)}"`,
      );
    }
  }

  // Pair-level rules only make sense once both endpoints resolved.
  if (!endpointsOk) return;
  const key = pairKey(a, b);
  if (seenPairs.has(key)) {
    r.add('error', 'non-edge/duplicate', where, `the pair ${a} ↔ ${b} is recorded twice`);
  }
  seenPairs.add(key);

  const contradicting = edgeTypesByPair.get(key);
  if (contradicting) {
    r.add(
      'error',
      'non-edge/contradiction',
      where,
      `a typed edge (${contradicting.join(', ')}) already connects ${a} and ${b} — ` +
        'the ledger records decisions NOT to connect; remove the entry or the edge',
    );
  }
}

// ---------------------------------------------------------------------------
// Walk rules (spec §8.3; ROADMAP M9; ARCHITECTURE.md §3.7). A walk is an
// ordered tour of existing concepts. The epistemic rule is the jump rule:
// where consecutive steps have no typed edge between them, the later step
// must carry a bridging note saying why the walk jumps — a tour may never
// imply a connection the graph does not make.
// ---------------------------------------------------------------------------

function validateWalk(
  r: Rules,
  slugs: Set<string>,
  stubs: Set<string>,
  edgedPairs: Set<string>,
  w: WalkRecord,
): void {
  const raw = w.raw;
  for (const key of Object.keys(raw)) {
    if (!KNOWN_WALK_KEYS.has(key)) {
      r.add('warn', 'content/unknown-key', w.file, `unknown walk key "${key}"`);
    }
  }
  for (const field of ['title', 'summary'] as const) {
    if (!isNonEmptyString(raw[field])) {
      r.add('error', 'walk/required-field', w.file, `walk needs a non-empty "${field}"`);
    }
  }

  if (!Array.isArray(raw.steps)) {
    r.add('error', 'walk/steps-shape', w.file, '"steps" must be a list of {slug, note?} entries');
    return;
  }
  interface CheckedStep {
    slug: string;
    hasNote: boolean;
  }
  const steps: (CheckedStep | undefined)[] = raw.steps.map((entry, i) => {
    const where = `${w.file} steps[${i}]`;
    if (entry === null || typeof entry !== 'object' || Array.isArray(entry)) {
      r.add('error', 'walk/steps-shape', where, 'each step must be a {slug, note?} mapping');
      return undefined;
    }
    const step = entry as Record<string, unknown>;
    for (const key of Object.keys(step)) {
      if (!KNOWN_WALK_STEP_KEYS.has(key)) {
        r.add('warn', 'content/unknown-key', where, `unknown step key "${key}"`);
      }
    }
    if (step.note !== undefined && !isNonEmptyString(step.note)) {
      r.add('error', 'walk/steps-shape', where, '"note" must be a non-empty string when present');
    }
    if (!isNonEmptyString(step.slug)) {
      r.add('error', 'walk/steps-shape', where, 'each step needs a "slug"');
      return undefined;
    }
    if (!slugs.has(step.slug)) {
      r.add('error', 'walk/unknown-step', where, `"${step.slug}" is not a concept slug`);
      return undefined;
    }
    if (stubs.has(step.slug)) {
      r.add('warn', 'walk/stub-step', where, `step "${step.slug}" is only a stub node`);
    }
    return { slug: step.slug, hasNote: isNonEmptyString(step.note) };
  });

  if (steps.length < 2) {
    r.add('error', 'walk/too-short', w.file, 'a walk needs at least two steps');
  }

  const seen = new Set<string>();
  steps.forEach((step, i) => {
    if (!step) return;
    if (seen.has(step.slug)) {
      r.add(
        'error',
        'walk/duplicate-step',
        `${w.file} steps[${i}]`,
        `"${step.slug}" appears twice in one walk`,
      );
    }
    seen.add(step.slug);

    // The jump rule. Checked only when both endpoints resolved — a broken
    // step already failed above, and a second error would just be noise.
    const prev = i > 0 ? steps[i - 1] : undefined;
    if (prev && !edgedPairs.has(pairKey(prev.slug, step.slug)) && !step.hasNote) {
      r.add(
        'error',
        'walk/unbridged-jump',
        `${w.file} steps[${i}]`,
        `no typed edge connects "${prev.slug}" to "${step.slug}" — the step needs a bridging "note" saying why the walk jumps`,
      );
    }
  });
}

/** Unordered endpoint-pair key: any typed edge bridges both directions. */
function pairKey(a: string, b: string): string {
  return [a, b].sort().join('|');
}

// ---------------------------------------------------------------------------
// Reference rules (ROADMAP M8). Syntax lives in the bib reader; here each
// parsed entry must be well-formed enough to cite: a stable key, a known
// entry type, and at least a title and year to find the work by.
// ---------------------------------------------------------------------------

function validateReferences(r: Rules, references: ReferenceRecord[]): void {
  const seen = new Set<string>();
  for (const ref of references) {
    const where = `${ref.file}:${String(ref.line)}`;
    if (!SLUG.test(ref.key)) {
      r.add(
        'error',
        'reference/key-format',
        where,
        `citation key "${ref.key}" must be lowercase-kebab (like "del-vecchio-murray-2015")`,
      );
    }
    if (seen.has(ref.key)) {
      r.add('error', 'reference/duplicate-key', where, `citation key "${ref.key}" appears twice`);
    }
    seen.add(ref.key);
    if (!BIB_ENTRY_TYPES.has(ref.entryType)) {
      r.add(
        'error',
        'reference/unknown-type',
        where,
        `"@${ref.entryType}" is not a supported BibTeX entry type`,
      );
    }
    for (const field of REQUIRED_REFERENCE_FIELDS) {
      if (!isNonEmptyString(ref.fields[field])) {
        r.add(
          'error',
          'reference/required-field',
          where,
          `entry "${ref.key}" is missing "${field}"`,
        );
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Application rules (spec §8.8; ROADMAP M7)
// ---------------------------------------------------------------------------

/**
 * The ≥ 2-structures bar as a machine check, not a convention: an
 * application node earns its keep only where at least two distinct
 * structure nodes converge on it over APPLIED-IN / MIGRATED-TO edges.
 * Below that, the content belongs on the structure's page as a canonical
 * example. Warn (not error): the batch under curation may legitimately
 * pass through this state mid-review.
 */
function validateApplications(r: Rules, concepts: ConceptRecord[], edges: EdgeRecord[]): void {
  const typeOf = new Map(concepts.map((c) => [c.slug, String(c.front.node_type ?? '')]));
  const applications = concepts.filter((c) => typeOf.get(c.slug) === APPLICATION_NODE_TYPE);
  if (applications.length === 0) return;

  const structureNeighbors = new Map<string, Set<string>>(
    applications.map((c) => [c.slug, new Set<string>()]),
  );
  for (const e of edges) {
    const { from, to, type } = e.raw;
    if (typeof type !== 'string' || !APPLICATION_EDGE_TYPES.has(type)) continue;
    if (typeof from !== 'string' || typeof to !== 'string') continue;
    for (const [app, other] of [
      [from, to],
      [to, from],
    ] as const) {
      const neighbors = structureNeighbors.get(app);
      if (!neighbors) continue;
      // Only structure nodes count toward the bar — a second application
      // hanging off the first is not convergence (and an unknown slug is
      // already an edge/unknown-endpoint error, never a neighbor).
      const otherType = typeOf.get(other);
      if (otherType !== undefined && otherType !== APPLICATION_NODE_TYPE) neighbors.add(other);
    }
  }
  for (const c of applications) {
    const count = structureNeighbors.get(c.slug)?.size ?? 0;
    if (count < 2) {
      r.add(
        'warn',
        'application/underconnected',
        c.file,
        `application has ${count} distinct structure neighbor(s) over APPLIED-IN/MIGRATED-TO edges — needs ≥ 2 (spec §8.8), else demote it to a canonical example`,
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
  references: ReferenceRecord[] = [],
  walks: WalkRecord[] = [],
  nonEdges: NonEdgeRecord[] = [],
): Issue[] {
  const r = new Rules();
  const v = vocabOf(schema);
  const slugs = new Set(concepts.map((c) => c.slug));
  const stubs = new Set(concepts.filter((c) => c.front.status === STUB_STATUS).map((c) => c.slug));

  for (const c of concepts) validateConcept(r, schema, v, c);

  validateReferences(r, references);
  const refKeys = new Set(references.map((ref) => ref.key));

  const seenEdges = new Set<string>();
  const citedKeys = new Set<string>();
  for (const e of edges) validateEdge(r, v, slugs, refKeys, citedKeys, e, seenEdges);

  // A reference nothing cites is a curation hint, like a candidate edge:
  // either an edge deserves it, or the entry can go.
  for (const ref of references) {
    if (!citedKeys.has(ref.key)) {
      r.add(
        'info',
        'reference/unused',
        `${ref.file}:${String(ref.line)}`,
        `"${ref.key}" is cited by no edge`,
      );
    }
  }

  validateApplications(r, concepts, edges);

  const seenSymptomIds = new Set<string>();
  for (const s of symptoms) validateSymptom(r, v, slugs, stubs, s, seenSymptomIds);

  // Which unordered pairs any typed edge connects, with the type names —
  // the walk jump rule's and the non-edge contradiction rule's shared
  // input. Built from the raw records: a malformed edge is already its own
  // error, and a rule over it should not double-report.
  const edgeTypesByPair = new Map<string, string[]>();
  for (const e of edges) {
    const { from, to, type } = e.raw;
    if (!isNonEmptyString(from) || !isNonEmptyString(to)) continue;
    const key = pairKey(from, to);
    const types = edgeTypesByPair.get(key) ?? [];
    if (isNonEmptyString(type) && !types.includes(type)) types.push(type);
    edgeTypesByPair.set(key, types.sort());
  }
  const edgedPairs = new Set(edgeTypesByPair.keys());
  for (const w of walks) validateWalk(r, slugs, stubs, edgedPairs, w);

  const seenNonEdgePairs = new Set<string>();
  for (const n of nonEdges) validateNonEdge(r, slugs, edgeTypesByPair, n, seenNonEdgePairs);

  return r.issues;
}
