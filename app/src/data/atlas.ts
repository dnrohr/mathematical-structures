/**
 * data/ — loads and validates the build artifacts and exposes typed
 * read-only accessors; the only module allowed to touch fetched JSON
 * (ARCHITECTURE.md §5.3). Search runs here too (MiniSearch over the
 * prebuilt index) so shell/views stay pure UI.
 */
import MiniSearch from 'minisearch';
import { SUPPORTED_DATA_MAJOR } from '../config';
import type {
  EdgeType,
  FieldDef,
  GraphAlias,
  GraphEdge,
  GraphJson,
  GraphMetrics,
  GraphNode,
  GraphNonEdge,
  GraphReference,
  GraphSymptom,
  GraphWalk,
  NodeConnection,
  NodeMetrics,
  NodeType,
  PublicSchema,
  QueueMetrics,
  SearchArtifact,
  StatusDef,
  Strength,
} from './types';

export type AtlasError =
  | { kind: 'network'; detail: string }
  | { kind: 'corrupt'; detail: string }
  | { kind: 'version'; found: string; supported: number };

export type LoadResult = { ok: true; atlas: Atlas } | { ok: false; error: AtlasError };

/** Mirrors build/src/model.ts SLUG (type-only imports keep build code out of the bundle). */
export const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/** Structure-into-application edge types (mirrors build/src/model.ts; spec §8.8). */
export const APPLICATION_EDGE_TYPES = new Set(['APPLIED-IN', 'MIGRATED-TO']);

export function majorOf(version: unknown): number {
  if (typeof version !== 'string') return NaN;
  const m = /^(\d+)\.\d+\.\d+$/.exec(version.trim());
  return m ? Number(m[1]) : NaN;
}

export interface SearchHit {
  /** Node slug, or `symptom:<id>`. */
  id: string;
  kind: 'concept' | 'symptom';
  name: string;
  /** Set when the hit came in through an alias: the reverse-dialect framing. */
  aliasMatch?: { name: string; field: string };
}

/** A dialect-lookup match: via an alias (the point of the tool) or a name. */
export interface AliasHit {
  node: GraphNode;
  /** Present when the query matched this alias; absent for name matches. */
  alias?: GraphAlias;
}

/** One concept's membership in a walk: the walk and the 0-based step index. */
export interface WalkPosition {
  walk: GraphWalk;
  index: number;
}

export class Atlas {
  readonly data: GraphJson;
  private readonly bySlug: Map<string, GraphNode>;
  private readonly walksById: Map<string, GraphWalk>;
  private readonly edgesByPair: Map<string, GraphEdge[]>;
  private readonly nodeTypesById: Map<string, NodeType>;
  private readonly edgeTypesById: Map<string, EdgeType>;
  private readonly strengthsById: Map<string, Strength>;
  private readonly fieldsById: Map<string, FieldDef>;
  private readonly nodeStatusesById: Map<string, StatusDef>;
  private readonly gapStatusesById: Map<string, StatusDef>;
  private readonly referencesByKey: Map<string, GraphReference>;
  private readonly mini: MiniSearch;
  private readonly boost: Record<string, number>;

  constructor(data: GraphJson, search: SearchArtifact) {
    this.data = data;
    this.bySlug = new Map(data.nodes.map((n) => [n.slug, n]));
    this.referencesByKey = new Map(data.references.map((r) => [r.key, r]));
    this.walksById = new Map(data.walks.map((w) => [w.id, w]));
    this.edgesByPair = new Map();
    for (const edge of data.edges) {
      const key = [edge.from, edge.to].sort().join('|');
      const list = this.edgesByPair.get(key);
      if (list) list.push(edge);
      else this.edgesByPair.set(key, [edge]);
    }
    this.nodeTypesById = new Map(data.schema.node_types.map((t) => [t.id, t]));
    this.edgeTypesById = new Map(data.schema.edge_types.map((t) => [t.id, t]));
    this.strengthsById = new Map(data.schema.strengths.map((s) => [s.id, s]));
    this.fieldsById = new Map(data.schema.fields.map((f) => [f.id, f]));
    this.nodeStatusesById = new Map(data.schema.node_statuses.map((s) => [s.id, s]));
    this.gapStatusesById = new Map(data.schema.gap_statuses.map((s) => [s.id, s]));
    const { idField, fields, storeFields } = search.options;
    this.mini = MiniSearch.loadJSON(JSON.stringify(search.index), {
      idField,
      fields,
      storeFields,
    });
    this.boost = search.options.boost;
  }

  get schema(): PublicSchema {
    return this.data.schema;
  }
  get nodes(): GraphNode[] {
    return this.data.nodes;
  }
  get symptoms(): GraphSymptom[] {
    return this.data.symptoms;
  }
  get edges(): GraphEdge[] {
    return this.data.edges;
  }
  get generatedFrom(): string {
    return this.data.generated_from;
  }
  get metrics(): GraphMetrics {
    return this.data.metrics;
  }
  /** The reject ledger: reviewed non-connections, pairs normalized (1.4.0). */
  get nonEdges(): GraphNonEdge[] {
    return this.data.non_edges;
  }
  /** The work-queue signal blocks (1.4.0). */
  get queue(): QueueMetrics {
    return this.data.metrics.queue;
  }
  /**
   * The fixed constellation (1.5.0): build-time trusted-subgraph layout,
   * `[x, y]` by slug. Nodes with no trusted edge have no position — the
   * atlas view and minimaps must treat absence as information, not error.
   */
  get layout(): Record<string, [number, number]> {
    return this.data.metrics.layout;
  }
  /** Strength rank of the trusted floor (metrics/layout run at or above it). */
  get trustedRank(): number {
    return this.strengthsById.get(this.data.schema.analysis.trusted_min_strength)?.rank ?? 0;
  }

  node(slug: string): GraphNode | undefined {
    return this.bySlug.get(slug);
  }
  nodeMetrics(slug: string): NodeMetrics | undefined {
    return this.data.metrics.nodes[slug];
  }
  /** Resolve an `evidence` citation key (validation guarantees it exists). */
  reference(key: string): GraphReference | undefined {
    return this.referencesByKey.get(key);
  }
  /**
   * The research-gap layer for the Open Questions view (spec §11): every
   * POSSIBLE-MISSING-MIGRATION or speculative-strength edge, in emitted
   * order. Validation guarantees each carries a workflow status.
   */
  gapEdges(): GraphEdge[] {
    return this.data.edges.filter(
      (e) => e.type === 'POSSIBLE-MISSING-MIGRATION' || e.strength === 'speculative',
    );
  }
  isSlug(text: string): boolean {
    return SLUG_RE.test(text) && this.bySlug.has(text);
  }
  nodesOfType(typeId: string): GraphNode[] {
    return this.data.nodes.filter((n) => n.node_type === typeId);
  }
  symptom(id: string): GraphSymptom | undefined {
    return this.data.symptoms.find((s) => s.id === id);
  }
  symptomsUsing(slug: string): GraphSymptom[] {
    return this.data.symptoms.filter((s) => s.moves.includes(slug));
  }

  get walks(): GraphWalk[] {
    return this.data.walks;
  }
  walk(id: string): GraphWalk | undefined {
    return this.walksById.get(id);
  }
  /** Every walk that steps on a concept — the "part of the walks" backlinks. */
  walksThrough(slug: string): WalkPosition[] {
    const positions: WalkPosition[] = [];
    for (const walk of this.data.walks) {
      const index = walk.steps.findIndex((step) => step.slug === slug);
      if (index >= 0) positions.push({ walk, index });
    }
    return positions;
  }
  /**
   * The typed edges between two concepts, either direction, in emitted
   * order — how a walk hop finds the claims it rides on (empty for the
   * bridged jumps, whose note the validator required instead).
   */
  edgesBetween(a: string, b: string): GraphEdge[] {
    return this.edgesByPair.get([a, b].sort().join('|')) ?? [];
  }

  /**
   * The distinct structure nodes converging on an application over
   * APPLIED-IN / MIGRATED-TO edges — the same neighbor definition as the
   * validator's application/underconnected rule (spec §8.8) — strongest
   * claim first, one connection per neighbor.
   */
  convergingStructures(slug: string): NodeConnection[] {
    const node = this.bySlug.get(slug);
    if (!node) return [];
    const eligible = node.connections
      .filter(
        (c) =>
          APPLICATION_EDGE_TYPES.has(c.type) &&
          this.bySlug.get(c.other)?.node_type !== 'application',
      )
      .sort(
        (a, b) =>
          (this.strengthsById.get(a.strength)?.rank ?? 99) -
            (this.strengthsById.get(b.strength)?.rank ?? 99) || a.other.localeCompare(b.other),
      );
    const seen = new Set<string>();
    const distinct: NodeConnection[] = [];
    for (const conn of eligible) {
      if (seen.has(conn.other)) continue;
      seen.add(conn.other);
      distinct.push(conn);
    }
    return distinct;
  }

  nodeType(id: string): NodeType | undefined {
    return this.nodeTypesById.get(id);
  }
  edgeType(id: string): EdgeType | undefined {
    return this.edgeTypesById.get(id);
  }
  strength(id: string): Strength | undefined {
    return this.strengthsById.get(id);
  }
  fieldLabel(id: string): string {
    return this.fieldsById.get(id)?.label ?? id;
  }
  nodeStatus(id: string): StatusDef | undefined {
    return this.nodeStatusesById.get(id);
  }
  gapStatus(id: string): StatusDef | undefined {
    return this.gapStatusesById.get(id);
  }

  /**
   * The reverse-dialect lookup (spec §7.3 Dialect module): substring-match a
   * field's term against every alias (and canonical name, as a courtesy).
   * Deliberately exact-ish rather than fuzzy — the tool answers "I read this
   * word in a paper", and a fuzzy hit would be a wrong translation.
   */
  aliasLookup(query: string, limit = 12): AliasHit[] {
    const q = query.trim().toLowerCase();
    if (q.length === 0) return [];
    const position = (text: string): number => text.toLowerCase().indexOf(q);
    const hits: (AliasHit & { pos: number })[] = [];
    for (const node of this.data.nodes) {
      for (const alias of node.aliases) {
        const pos = position(alias.name);
        if (pos >= 0) hits.push({ node, alias, pos });
      }
      const namePos = position(node.canonical_name);
      if (namePos >= 0) hits.push({ node, pos: namePos });
    }
    hits.sort(
      (a, b) =>
        Number(a.alias === undefined) - Number(b.alias === undefined) ||
        a.pos - b.pos ||
        a.node.canonical_name.localeCompare(b.node.canonical_name),
    );
    return hits.slice(0, limit).map(({ node, alias }) => (alias ? { node, alias } : { node }));
  }

  search(query: string, limit = 8): SearchHit[] {
    if (!query.trim()) return [];
    const results = this.mini.search(query, {
      prefix: true,
      fuzzy: 0.15,
      combineWith: 'AND',
      boost: this.boost,
    });
    return results.slice(0, limit).map((r) => {
      const kind: SearchHit['kind'] = r['kind'] === 'symptom' ? 'symptom' : 'concept';
      const hit: SearchHit = { id: String(r.id), kind, name: String(r['name']) };
      if (kind === 'concept') {
        // Which terms matched via the aliases field? Frame the hit as a
        // reverse-dialect lookup: `aka "poles / modes" in Control theory`.
        const aliasTerms = Object.entries(r.match)
          .filter(([, fields]) => fields.includes('aliases'))
          .map(([term]) => term.toLowerCase());
        if (aliasTerms.length > 0) {
          const alias = this.node(hit.id)?.aliases.find((a) =>
            aliasTerms.some((t) => a.name.toLowerCase().includes(t)),
          );
          if (alias) hit.aliasMatch = { name: alias.name, field: this.fieldLabel(alias.field) };
        }
      }
      return hit;
    });
  }
}

function fail(kind: 'network' | 'corrupt', detail: string): LoadResult {
  return { ok: false, error: { kind, detail } };
}

/**
 * Version-gate and shape-check the two artifacts, then assemble the Atlas.
 * Pure (no fetch) so the gate is unit-testable.
 */
export function assembleAtlas(graphRaw: unknown, searchRaw: unknown): LoadResult {
  for (const [name, raw] of [
    ['graph.json', graphRaw],
    ['search-index.json', searchRaw],
  ] as const) {
    if (typeof raw !== 'object' || raw === null) {
      return fail('corrupt', `${name}: not a JSON object`);
    }
    const version = (raw as { schema_version?: unknown }).schema_version;
    const major = majorOf(version);
    if (Number.isNaN(major)) {
      return fail('corrupt', `${name}: missing or malformed schema_version`);
    }
    if (major !== SUPPORTED_DATA_MAJOR) {
      return {
        ok: false,
        error: { kind: 'version', found: String(version), supported: SUPPORTED_DATA_MAJOR },
      };
    }
  }
  const graph = graphRaw as GraphJson;
  const search = searchRaw as SearchArtifact;
  if (!Array.isArray(graph.nodes) || !Array.isArray(graph.edges) || !Array.isArray(graph.symptoms))
    return fail('corrupt', 'graph.json: nodes/edges/symptoms are not lists');
  if (typeof graph.schema !== 'object' || graph.schema === null)
    return fail('corrupt', 'graph.json: missing schema block');
  if (typeof graph.metrics !== 'object' || graph.metrics === null)
    return fail('corrupt', 'graph.json: missing metrics block (needs data version ≥ 1.1)');
  if (!Array.isArray(graph.references))
    return fail('corrupt', 'graph.json: missing references list (needs data version ≥ 1.2)');
  if (!Array.isArray(graph.walks))
    return fail('corrupt', 'graph.json: missing walks list (needs data version ≥ 1.3)');
  if (!Array.isArray(graph.non_edges) || typeof graph.metrics.queue !== 'object')
    return fail('corrupt', 'graph.json: missing non_edges/queue blocks (needs data version ≥ 1.4)');
  if (typeof graph.metrics.layout !== 'object' || graph.metrics.layout === null)
    return fail('corrupt', 'graph.json: missing metrics.layout (needs data version ≥ 1.5)');
  if (typeof search.options !== 'object' || search.options === null || search.index === undefined)
    return fail('corrupt', 'search-index.json: missing options/index');
  try {
    return { ok: true, atlas: new Atlas(graph, search) };
  } catch (e) {
    return fail('corrupt', `search index did not load: ${(e as Error).message}`);
  }
}

async function fetchJson(
  url: string,
): Promise<{ ok: true; value: unknown } | { ok: false; error: AtlasError }> {
  let res: Response;
  try {
    res = await fetch(url);
  } catch (e) {
    return { ok: false, error: { kind: 'network', detail: `${url}: ${(e as Error).message}` } };
  }
  if (!res.ok) {
    return { ok: false, error: { kind: 'network', detail: `${url}: HTTP ${res.status}` } };
  }
  try {
    return { ok: true, value: await res.json() };
  } catch (e) {
    return { ok: false, error: { kind: 'corrupt', detail: `${url}: ${(e as Error).message}` } };
  }
}

/**
 * Fetch both artifacts (relative to the page, so any base path works) and
 * assemble. Never throws — every failure mode is a typed error the shell
 * renders as a real screen.
 */
export async function loadAtlas(base = 'data/'): Promise<LoadResult> {
  const [graph, search] = await Promise.all([
    fetchJson(`${base}graph.json`),
    fetchJson(`${base}search-index.json`),
  ]);
  if (!graph.ok) return graph;
  if (!search.ok) return search;
  return assembleAtlas(graph.value, search.value);
}
