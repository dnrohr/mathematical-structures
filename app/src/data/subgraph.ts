/**
 * Client-side graph computations (ARCHITECTURE.md §5.3): the ego-network,
 * the lens-filtered subgraph, and bounded-depth path finding. These are the
 * only graph algorithms run in the app, and they live in data/ because they
 * depend on user-chosen filters; everything else is precomputed at build
 * time. All results are deterministically ordered.
 */
import type { Atlas } from './atlas';
import type { GraphEdge, GraphNode } from './types';

export interface Subgraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

// ---------------------------------------------------------------------------
// Ego network
// ---------------------------------------------------------------------------

export interface EgoNetwork extends Subgraph {
  center: string;
  /** Neighborhood members that did not fit under the node cap, sorted. */
  overflow: GraphNode[];
  /** True when a second hop exists beyond this 1-hop network. */
  expandable: boolean;
}

/** Node cap for ego rendering (ROADMAP M4): legibility by curation. */
export const EGO_NODE_CAP = 25;

interface Adjacency {
  /** slug → edges touching it. */
  byNode: Map<string, GraphEdge[]>;
}

function adjacency(edges: GraphEdge[]): Adjacency {
  const byNode = new Map<string, GraphEdge[]>();
  for (const edge of edges) {
    for (const end of [edge.from, edge.to]) {
      const list = byNode.get(end);
      if (list) list.push(edge);
      else byNode.set(end, [edge]);
    }
  }
  return { byNode };
}

function otherEnd(edge: GraphEdge, slug: string): string {
  return edge.from === slug ? edge.to : edge.from;
}

/**
 * Ring members sorted by the strongest edge that attaches them to the inner
 * ring (strong first), then by slug — so the cap keeps the best-attested
 * neighbors and the ordering is stable.
 */
function sortRing(atlas: Atlas, attachRank: Map<string, number>, ring: string[]): string[] {
  return [...ring].sort(
    (a, b) => (attachRank.get(a) ?? 99) - (attachRank.get(b) ?? 99) || a.localeCompare(b),
  );
}

/**
 * The 1–2 hop neighborhood of a node, capped at `cap` rendered nodes
 * (center included). Edges are the induced subgraph on the kept nodes, so
 * neighbor↔neighbor relationships are visible; second-hop nodes are only
 * reached through kept first-hop nodes, so nothing renders stranded.
 */
export function egoNetwork(
  atlas: Atlas,
  center: string,
  hops: 1 | 2,
  cap: number = EGO_NODE_CAP,
): EgoNetwork | null {
  if (!atlas.node(center)) return null;
  const adj = adjacency(atlas.data.edges);

  const attachRank = new Map<string, number>();
  const ring = (of: string[], inside: Set<string>): string[] => {
    attachRank.clear();
    for (const slug of of) {
      for (const edge of adj.byNode.get(slug) ?? []) {
        const other = otherEnd(edge, slug);
        if (inside.has(other)) continue;
        const rank = atlas.strength(edge.strength)?.rank ?? 99;
        attachRank.set(other, Math.min(attachRank.get(other) ?? 99, rank));
      }
    }
    return sortRing(atlas, attachRank, [...attachRank.keys()]);
  };

  const kept = new Set([center]);
  const seen = new Set([center]);
  const take = (candidates: string[]): void => {
    for (const slug of candidates) {
      seen.add(slug);
      if (kept.size < cap) kept.add(slug);
    }
  };

  const ring1 = ring([center], new Set([center]));
  take(ring1);
  const keptRing1 = ring1.filter((s) => kept.has(s));
  if (hops === 2) {
    take(ring(keptRing1, new Set([center, ...ring1])));
  }

  const nodes = [...kept]
    .map((slug) => atlas.node(slug))
    .filter((n): n is GraphNode => n !== undefined)
    .sort((a, b) => a.slug.localeCompare(b.slug));
  const edges = atlas.data.edges.filter((e) => kept.has(e.from) && kept.has(e.to));
  const overflow = [...seen]
    .filter((slug) => !kept.has(slug))
    .map((slug) => atlas.node(slug))
    .filter((n): n is GraphNode => n !== undefined)
    .sort((a, b) => a.canonical_name.localeCompare(b.canonical_name));

  const expandable =
    hops === 1 && keptRing1.some((slug) => ring([slug], new Set([center, ...ring1])).length > 0);

  return { center, nodes, edges, overflow, expandable };
}

// ---------------------------------------------------------------------------
// Lens
// ---------------------------------------------------------------------------

export interface LensFilters {
  /** Edge type id, e.g. "GOVERNS". */
  edge?: string;
  /** Node type id, e.g. "move". */
  type?: string;
  /** Field id, e.g. "biology". */
  field?: string;
  /** Minimum strength id: edges at this rank or stronger pass. */
  strength?: string;
}

export function hasLensFilter(filters: LensFilters): boolean {
  return Boolean(filters.edge || filters.type || filters.field || filters.strength);
}

/**
 * The user-composed subgraph (spec §3.3): edges of the chosen type at or
 * above the chosen strength, touching at least one node that matches the
 * node-type/field filters. Nodes are exactly the endpoints of surviving
 * edges — the lens shows relationships, never isolated nodes.
 */
export function lensSubgraph(atlas: Atlas, filters: LensFilters): Subgraph {
  const minRank = filters.strength ? (atlas.strength(filters.strength)?.rank ?? 0) : Infinity;
  const nodeFiltered = Boolean(filters.type || filters.field);
  const nodePass = (slug: string): boolean => {
    const node = atlas.node(slug);
    if (!node) return false;
    if (filters.type && node.node_type !== filters.type) return false;
    if (filters.field && !node.fields.includes(filters.field)) return false;
    return true;
  };

  const edges = atlas.data.edges.filter((edge) => {
    if (filters.edge && edge.type !== filters.edge) return false;
    if ((atlas.strength(edge.strength)?.rank ?? 99) > minRank) return false;
    if (nodeFiltered && !nodePass(edge.from) && !nodePass(edge.to)) return false;
    return true;
  });

  const slugs = new Set<string>();
  for (const edge of edges) {
    slugs.add(edge.from);
    slugs.add(edge.to);
  }
  const nodes = [...slugs]
    .sort()
    .map((slug) => atlas.node(slug))
    .filter((n): n is GraphNode => n !== undefined);
  return { nodes, edges };
}

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

/** One traversal step: `edge` walked from `from` to `to` (its other end). */
export interface PathStep {
  edge: GraphEdge;
  from: string;
  to: string;
}

export interface PathChain {
  steps: PathStep[];
}

export interface PathResult {
  chains: PathChain[];
  /** Total chains found; chains[] is capped for display. */
  total: number;
}

export interface PathOptions {
  /** Minimum strength id; defaults to including every non-speculative edge. */
  strength?: string;
  /** Longest chain considered, in steps. */
  maxDepth?: number;
  /** Cap on returned chains (total still counts the rest). */
  maxChains?: number;
}

export const PATH_MAX_DEPTH = 4;
export const PATH_MAX_CHAINS = 8;

/**
 * Default strength floor for path finding: every established edge, but not
 * speculative hypotheses — a translation chain through an unverified gap
 * candidate would present a hypothesis as a finding (spec §1). The caller
 * may loosen this explicitly.
 */
export const PATH_DEFAULT_STRENGTH = 'heuristic-analogy';

/** The weakest link in a chain (largest rank), for strongest-first sorting. */
function weakestRank(atlas: Atlas, chain: PathChain): number {
  return Math.max(...chain.steps.map((s) => atlas.strength(s.edge.strength)?.rank ?? 99));
}

/** Tiebreak among equally-weak chains: lower total rank = stronger overall. */
function totalRank(atlas: Atlas, chain: PathChain): number {
  return chain.steps.reduce((sum, s) => sum + (atlas.strength(s.edge.strength)?.rank ?? 99), 0);
}

/**
 * All simple chains between two concepts over the strength-filtered edge
 * set, treating every edge as traversable in both directions (direction
 * shapes the phrasing, not reachability), up to `maxDepth` steps but never
 * more than one step longer than the shortest chain found. This computes
 * the notebook's §34 translation chains as a feature (ROADMAP M4).
 */
export function pathsBetween(
  atlas: Atlas,
  from: string,
  to: string,
  options: PathOptions = {},
): PathResult {
  const maxDepth = options.maxDepth ?? PATH_MAX_DEPTH;
  const maxChains = options.maxChains ?? PATH_MAX_CHAINS;
  const minRank = atlas.strength(options.strength ?? PATH_DEFAULT_STRENGTH)?.rank ?? Infinity;
  if (from === to || !atlas.node(from) || !atlas.node(to)) return { chains: [], total: 0 };

  const edges = atlas.data.edges.filter((e) => (atlas.strength(e.strength)?.rank ?? 99) <= minRank);
  const adj = adjacency(edges);

  // Shortest distance first (BFS) to bound the enumeration meaningfully.
  const dist = new Map<string, number>([[from, 0]]);
  const queue = [from];
  while (queue.length > 0) {
    const here = queue.shift()!;
    const d = dist.get(here)!;
    if (d >= maxDepth) continue;
    for (const edge of adj.byNode.get(here) ?? []) {
      const next = otherEnd(edge, here);
      if (!dist.has(next)) {
        dist.set(next, d + 1);
        queue.push(next);
      }
    }
  }
  const shortest = dist.get(to);
  if (shortest === undefined) return { chains: [], total: 0 };
  const maxLen = Math.min(maxDepth, shortest + 1);

  // Enumerate simple paths up to maxLen by DFS (the graph is small, and
  // maxLen keeps the walk shallow). Deterministic edge order = file order.
  const chains: PathChain[] = [];
  const steps: PathStep[] = [];
  const visited = new Set<string>([from]);
  const walk = (here: string): void => {
    if (steps.length >= maxLen) return;
    for (const edge of adj.byNode.get(here) ?? []) {
      const next = otherEnd(edge, here);
      if (next === here) continue; // self-loops cannot occur in valid data
      if (next === to) {
        chains.push({ steps: [...steps, { edge, from: here, to: next }] });
        continue;
      }
      if (visited.has(next)) continue;
      visited.add(next);
      steps.push({ edge, from: here, to: next });
      walk(next);
      steps.pop();
      visited.delete(next);
    }
  };
  walk(from);

  chains.sort(
    (a, b) =>
      a.steps.length - b.steps.length ||
      weakestRank(atlas, a) - weakestRank(atlas, b) ||
      totalRank(atlas, a) - totalRank(atlas, b) ||
      a.steps
        .map((s) => `${s.to}|${s.edge.type}`)
        .join('>')
        .localeCompare(b.steps.map((s) => `${s.to}|${s.edge.type}`).join('>')),
  );
  return { chains: chains.slice(0, maxChains), total: chains.length };
}
