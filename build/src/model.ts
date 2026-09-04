/**
 * Shared types across the atlas-build pipeline stages
 * (parse → validate → link/render → emit; ARCHITECTURE.md §4).
 */

export type Severity = 'error' | 'warn' | 'info';

export interface Issue {
  severity: Severity;
  rule: string;
  file: string;
  message: string;
}

/** Semantic ids the validator must know by name (documented in schema.yaml). */
export const GAP_EDGE_TYPE = 'POSSIBLE-MISSING-MIGRATION';
export const SPECULATIVE = 'speculative';
export const HEURISTIC_ANALOGY = 'heuristic-analogy';
export const STUB_STATUS = 'stub';

export const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;

// ---------------------------------------------------------------------------
// Parse-stage records: raw file content in typed envelopes. Field-level
// correctness is the validator's job, so most fields are optional here.
// ---------------------------------------------------------------------------

export interface ConceptAlias {
  name?: unknown;
  field?: unknown;
}

export interface ConceptRecord {
  slug: string;
  file: string;
  /** Raw front-matter mapping as parsed. */
  front: Record<string, unknown>;
  /** Markdown body below the front-matter. */
  body: string;
}

export interface EdgeRecord {
  file: string;
  /** 0-based position in edges.yaml, for error messages. */
  index: number;
  raw: Record<string, unknown>;
}

export interface SymptomRecord {
  file: string;
  index: number;
  raw: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Emit-stage shapes: the public graph.json contract (docs/graph-json.md).
// ---------------------------------------------------------------------------

export interface GraphAlias {
  name: string;
  field: string;
}

export interface NodeConnection {
  /** The node on the other end. */
  other: string;
  type: string;
  /** 'out' | 'in' | 'sym' as seen from this node. */
  direction: 'out' | 'in' | 'sym';
  /** Display phrasing for this direction, from schema.yaml. */
  phrase: string;
  strength: string;
  context?: string;
  status?: string;
  notes?: string;
}

export interface GraphNode {
  slug: string;
  canonical_name: string;
  node_type: string;
  status: string;
  summary: string;
  fields: string[];
  aliases: GraphAlias[];
  assumptions: string[];
  canonical_examples: string[];
  sections: string[];
  /** Rendered, safe HTML for the body (raw HTML in Markdown is escaped). */
  html: string;
  /** Slugs whose bodies wiki-link to this node, sorted. */
  backlinks: string[];
  /** This node's edges with display phrasings, grouped app-side by type. */
  connections: NodeConnection[];
}

export interface GraphEdge {
  from: string;
  to: string;
  type: string;
  strength: string;
  symmetric: boolean;
  context?: string;
  status?: string;
  notes?: string;
  evidence: string[];
}

export interface GraphSymptom {
  id: string;
  symptom: string;
  moves: string[];
  mature_fields: string[];
  worked_example?: string;
}

export function countErrors(issues: Issue[]): number {
  return issues.filter((i) => i.severity === 'error').length;
}
