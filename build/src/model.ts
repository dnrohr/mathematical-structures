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
export const APPLICATION_NODE_TYPE = 'application';
/** Edge types that connect a structure into an application (spec §8.8). */
export const APPLICATION_EDGE_TYPES = new Set(['APPLIED-IN', 'MIGRATED-TO']);

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

/** One paths/<id>.yaml walk as parsed; the id is the filename (§3.7). */
export interface WalkRecord {
  id: string;
  file: string;
  raw: Record<string, unknown>;
}

/** One graph/references.bib entry as parsed (values are display text). */
export interface ReferenceRecord {
  key: string;
  /** BibTeX entry type, lowercased (article, book, techreport, ...). */
  entryType: string;
  /** Field name (lowercased) → value with braces dropped, whitespace collapsed. */
  fields: Record<string, string>;
  file: string;
  /** 1-based line of the entry's `@`, for error messages. */
  line: number;
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
  /** Citation keys into graph.json `references` (added in 1.2.0). */
  evidence: string[];
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

export interface GraphWalkStep {
  slug: string;
  /** Why this step — required where no typed edge connects it to the previous one. */
  note?: string;
}

/** One guided walk in graph.json (added in 1.3.0; ARCHITECTURE.md §3.7). */
export interface GraphWalk {
  id: string;
  title: string;
  summary: string;
  steps: GraphWalkStep[];
}

/** One resolved literature reference in graph.json (added in 1.2.0). */
export interface GraphReference {
  /** Citation key: what edges' `evidence` lists point at. */
  key: string;
  /** BibTeX entry type, lowercased. */
  entry_type: string;
  /** The entry's fields as display text (author, title, year, ...). */
  fields: Record<string, string>;
}

// ---------------------------------------------------------------------------
// Stage-4 metric shapes: the `metrics` block of graph.json (ARCHITECTURE.md
// §4.4; docs/graph-json.md). Everything here is computed at build time — the
// app never runs graph algorithms beyond user-filtered subgraphs.
// ---------------------------------------------------------------------------

export interface NodeMetrics {
  /** Incident trusted edges (parallel edges each count). */
  degree: number;
  /** Brandes betweenness on the trusted subgraph, normalized to [0, 1]. */
  betweenness: number;
  /** Trusted-subgraph community label, or null when no trusted edge touches the node. */
  community: number | null;
  /** Shannon entropy (bits) over the node's `fields` list — log2(field_count) until usage is weighted. */
  span_entropy: number;
  field_count: number;
  /** Distinct fields represented in `aliases`. */
  dialect_count: number;
}

/** A wiki-linked pair with no typed edge (the info-level curation queue), a < b. */
export interface CandidatePair {
  a: string;
  b: string;
}

/** One research-gap edge, summarized for the Open Questions view and exports. */
export interface GapSummary {
  from: string;
  to: string;
  type: string;
  strength: string;
  status: string;
}

export interface GraphMetrics {
  trusted: {
    /** Strength floor (schema `analysis.trusted_min_strength`); metrics use only edges at or above it. */
    min_strength: string;
    edge_count: number;
    excluded_edge_count: number;
    /** Nodes touched by at least one trusted edge. */
    node_count: number;
  };
  community_count: number;
  /** Per-node metrics, keyed by slug (every node has an entry). */
  nodes: Record<string, NodeMetrics>;
  gaps: GapSummary[];
  candidate_edges: CandidatePair[];
}

export function countErrors(issues: Issue[]): number {
  return issues.filter((i) => i.severity === 'error').length;
}
