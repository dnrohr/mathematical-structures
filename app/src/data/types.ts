/**
 * The graph.json / search-index.json contracts (docs/graph-json.md),
 * assembled from the build pipeline's shared model — build and app share
 * types across the data contract (ARCHITECTURE.md §2, decision log #1).
 * All imports are type-only, so nothing from build/ lands in the bundle.
 */
import type { GraphEdge, GraphMetrics, GraphNode, GraphSymptom } from '../../../build/src/model.js';
import type {
  EdgeType,
  FieldDef,
  NodeType,
  StatusDef,
  Strength,
} from '../../../build/src/schema.js';

export type {
  CandidatePair,
  GapSummary,
  GraphAlias,
  GraphEdge,
  GraphMetrics,
  GraphNode,
  GraphSymptom,
  NodeConnection,
  NodeMetrics,
} from '../../../build/src/model.js';
export type {
  EdgeType,
  FieldDef,
  NodeType,
  StatusDef,
  Strength,
} from '../../../build/src/schema.js';

/** The `schema` block emitted into graph.json (the vocabularies the UI keys off). */
export interface PublicSchema {
  node_types: NodeType[];
  edge_types: EdgeType[];
  strengths: Strength[];
  fields: FieldDef[];
  node_statuses: StatusDef[];
  gap_statuses: StatusDef[];
  analysis: { trusted_min_strength: string };
}

/** Top-level shape of graph.json, version 1.1+ (docs/graph-json.md). */
export interface GraphJson {
  schema_version: string;
  generated_from: string;
  schema: PublicSchema;
  nodes: GraphNode[];
  edges: GraphEdge[];
  symptoms: GraphSymptom[];
  /** Build-time analysis over the trusted subgraph (added in 1.1.0). */
  metrics: GraphMetrics;
}

/** Top-level shape of search-index.json: a serialized MiniSearch index. */
export interface SearchArtifact {
  schema_version: string;
  options: {
    idField: string;
    fields: string[];
    storeFields: string[];
    /** Recommended search-time boosts (aliases highest — reverse-dialect lookup). */
    boost: Record<string, number>;
  };
  index: unknown;
}
