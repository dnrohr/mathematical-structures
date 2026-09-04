/**
 * Stage 4 — analyze: the derived metrics (ARCHITECTURE.md §4.4), computed
 * entirely at build time over the TRUSTED subgraph — edges whose strength
 * rank is at or above `schema.analysis.trusted_min_strength` — so that
 * speculative analogies cannot manufacture centrality or communities
 * (decision log #7, an epistemic rule before a technical one).
 *
 * Precondition: the pipeline reported no errors, so edge strengths/statuses
 * are schema-valid and gap edges carry a workflow status.
 *
 * Determinism: nodes are processed in sorted-slug order, ties break on the
 * smaller label, and floats are rounded before emit — the same content tree
 * always produces byte-identical metrics.
 */
import {
  GAP_EDGE_TYPE,
  SPECULATIVE,
  type CandidatePair,
  type GapSummary,
  type GraphEdge,
  type GraphMetrics,
  type GraphNode,
  type NodeMetrics,
} from './model.js';
import type { AtlasSchema } from './schema.js';

function round(x: number, places: number): number {
  const f = 10 ** places;
  return Math.round(x * f) / f;
}

/** The trusted subgraph as a weighted simple graph over node indices. */
interface SimpleGraph {
  /** Sorted slugs; index = node id. */
  slugs: string[];
  /** adjacency[i] = sorted [neighbor index, summed parallel-edge weight]. */
  adjacency: [number, number][][];
}

function simpleGraph(slugs: string[], edges: { from: string; to: string }[]): SimpleGraph {
  const index = new Map(slugs.map((s, i) => [s, i]));
  const weights = slugs.map(() => new Map<number, number>());
  for (const edge of edges) {
    const a = index.get(edge.from)!;
    const b = index.get(edge.to)!;
    if (a === b) continue; // self-loops cannot occur in valid data
    weights[a]!.set(b, (weights[a]!.get(b) ?? 0) + 1);
    weights[b]!.set(a, (weights[b]!.get(a) ?? 0) + 1);
  }
  const adjacency = weights.map((w) => [...w.entries()].sort((x, y) => x[0] - y[0]));
  return { slugs, adjacency };
}

/**
 * Brandes betweenness centrality (unweighted, undirected, on the simple
 * graph — parallel edges do not multiply shortest paths). Returns values
 * normalized by (n-1)(n-2)/2 where n counts nodes with at least one trusted
 * edge; isolated nodes score 0.
 */
export function betweenness(graph: SimpleGraph): number[] {
  const n = graph.adjacency.length;
  const cb = new Array<number>(n).fill(0);
  for (let s = 0; s < n; s++) {
    if (graph.adjacency[s]!.length === 0) continue;
    const stack: number[] = [];
    const predecessors: number[][] = Array.from({ length: n }, () => []);
    const sigma = new Array<number>(n).fill(0);
    const dist = new Array<number>(n).fill(-1);
    sigma[s] = 1;
    dist[s] = 0;
    const queue: number[] = [s];
    for (let head = 0; head < queue.length; head++) {
      const v = queue[head]!;
      stack.push(v);
      for (const [w] of graph.adjacency[v]!) {
        if (dist[w] === -1) {
          dist[w] = dist[v]! + 1;
          queue.push(w);
        }
        if (dist[w] === dist[v]! + 1) {
          sigma[w] = sigma[w]! + sigma[v]!;
          predecessors[w]!.push(v);
        }
      }
    }
    const delta = new Array<number>(n).fill(0);
    for (let i = stack.length - 1; i >= 0; i--) {
      const w = stack[i]!;
      for (const v of predecessors[w]!) {
        delta[v] = delta[v]! + (sigma[v]! / sigma[w]!) * (1 + delta[w]!);
      }
      if (w !== s) cb[w] = cb[w]! + delta[w]!;
    }
  }
  const covered = graph.adjacency.filter((a) => a.length > 0).length;
  const pairs = ((covered - 1) * (covered - 2)) / 2;
  // Each unordered pair was counted from both endpoints: halve, then normalize.
  return cb.map((x) => (pairs > 0 ? x / 2 / pairs : 0));
}

/**
 * Louvain community detection on the weighted simple graph. Nodes are swept
 * in index (sorted-slug) order and ties go to the lower community id, so the
 * partition is deterministic. Isolated nodes get no community (null).
 */
export function communities(graph: SimpleGraph): (number | null)[] {
  const n = graph.adjacency.length;
  // Work on the covered nodes only; isolated nodes stay unlabeled.
  const covered: number[] = [];
  for (let i = 0; i < n; i++) if (graph.adjacency[i]!.length > 0) covered.push(i);
  if (covered.length === 0) return new Array<number | null>(n).fill(null);

  // Level graph state: adjacency with weights, plus self-loop weights.
  const coveredIndex = new Map(covered.map((orig, i) => [orig, i]));
  let ids = covered.map((_, i) => i);
  let adj: Map<number, number>[] = covered.map(
    (orig) =>
      new Map(
        graph.adjacency[orig]!.map(([nb, w]) => [coveredIndex.get(nb)!, w] as [number, number]),
      ),
  );
  let selfLoops = covered.map(() => 0);
  // membership[level node] = community; assignment[original covered index] = level node.
  let assignment = covered.map((_, i) => i);

  const totalWeight = (): number => {
    let m = 0;
    adj.forEach((neighbors, i) => {
      for (const [j, w] of neighbors) if (j > i) m += w;
      m += selfLoops[i]!;
    });
    return m;
  };

  for (;;) {
    const m = totalWeight();
    if (m === 0) break;
    const k = adj.map((neighbors, i) => {
      let sum = 2 * selfLoops[i]!;
      for (const [, w] of neighbors) sum += w;
      return sum;
    });
    const community = ids.map((_, i) => i);
    const sigmaTot = [...k];

    let movedAny = false;
    for (let sweeps = 0; sweeps < 100; sweeps++) {
      let movedThisSweep = false;
      for (let i = 0; i < adj.length; i++) {
        const home = community[i]!;
        // Weights from i into each neighboring community (i excluded).
        const into = new Map<number, number>();
        for (const [j, w] of adj[i]!) {
          const c = community[j]!;
          into.set(c, (into.get(c) ?? 0) + w);
        }
        sigmaTot[home] = sigmaTot[home]! - k[i]!;
        let best = home;
        let bestGain = (into.get(home) ?? 0) - (sigmaTot[home]! * k[i]!) / (2 * m);
        const candidates = [...into.keys()].sort((a, b) => a - b);
        for (const c of candidates) {
          if (c === home) continue;
          const gain = into.get(c)! - (sigmaTot[c]! * k[i]!) / (2 * m);
          if (gain > bestGain + 1e-12 || (Math.abs(gain - bestGain) <= 1e-12 && c < best)) {
            best = c;
            bestGain = gain;
          }
        }
        sigmaTot[best] = sigmaTot[best]! + k[i]!;
        if (best !== home) {
          community[i] = best;
          movedThisSweep = true;
          movedAny = true;
        }
      }
      if (!movedThisSweep) break;
    }
    if (!movedAny) break;

    // Renumber communities compactly (by lowest member), then aggregate.
    const renumber = new Map<number, number>();
    for (const c of community) if (!renumber.has(c!)) renumber.set(c!, renumber.size);
    const groups = community.map((c) => renumber.get(c!)!);
    const size = renumber.size;

    const newAdj: Map<number, number>[] = Array.from({ length: size }, () => new Map());
    const newSelf = new Array<number>(size).fill(0);
    adj.forEach((neighbors, i) => {
      const gi = groups[i]!;
      newSelf[gi] = newSelf[gi]! + selfLoops[i]!;
      for (const [j, w] of neighbors) {
        const gj = groups[j]!;
        if (gj === gi) {
          if (j > i) newSelf[gi] = newSelf[gi]! + w;
        } else {
          newAdj[gi]!.set(gj, (newAdj[gi]!.get(gj) ?? 0) + w);
        }
      }
    });
    assignment = assignment.map((levelNode) => groups[levelNode]!);
    ids = Array.from({ length: size }, (_, i) => i);
    adj = newAdj;
    selfLoops = newSelf;
    if (size === 1) break;
  }

  // Canonical labels: communities ordered by their alphabetically first member.
  const first = new Map<number, number>();
  assignment.forEach((c, i) => {
    if (!first.has(c)) first.set(c, covered[i]!);
    else first.set(c, Math.min(first.get(c)!, covered[i]!));
  });
  const order = [...first.entries()].sort((a, b) => a[1] - b[1]).map(([c]) => c);
  const label = new Map(order.map((c, i) => [c, i]));

  const out = new Array<number | null>(n).fill(null);
  assignment.forEach((c, i) => {
    out[covered[i]!] = label.get(c)!;
  });
  return out;
}

/** Shannon entropy in bits over a node's fields list — uniform until usage is weighted. */
export function spanEntropy(fieldCount: number): number {
  return fieldCount > 0 ? round(Math.log2(fieldCount), 3) : 0;
}

export function analyzeGraph(
  schema: AtlasSchema,
  nodes: GraphNode[],
  edges: GraphEdge[],
  candidates: CandidatePair[],
): GraphMetrics {
  const rank = new Map(schema.strengths.map((s) => [s.id, s.rank]));
  const trustedRank = rank.get(schema.analysis.trusted_min_strength)!;
  const trusted = edges.filter((e) => (rank.get(e.strength) ?? Infinity) <= trustedRank);

  const slugs = nodes.map((n) => n.slug); // already sorted by the link stage
  const graph = simpleGraph(slugs, trusted);
  const central = betweenness(graph);
  const community = communities(graph);

  const degree = new Map<string, number>();
  for (const e of trusted) {
    degree.set(e.from, (degree.get(e.from) ?? 0) + 1);
    degree.set(e.to, (degree.get(e.to) ?? 0) + 1);
  }

  const perNode: Record<string, NodeMetrics> = {};
  nodes.forEach((node, i) => {
    perNode[node.slug] = {
      degree: degree.get(node.slug) ?? 0,
      betweenness: round(central[i]!, 4),
      community: community[i]!,
      span_entropy: spanEntropy(node.fields.length),
      field_count: node.fields.length,
      dialect_count: new Set(node.aliases.map((a) => a.field)).size,
    };
  });

  const gaps: GapSummary[] = edges
    .filter((e) => e.type === GAP_EDGE_TYPE || e.strength === SPECULATIVE)
    .map((e) => ({
      from: e.from,
      to: e.to,
      type: e.type,
      strength: e.strength,
      // Validated: gap-type and speculative edges always carry a workflow status.
      status: e.status!,
    }));

  return {
    trusted: {
      min_strength: schema.analysis.trusted_min_strength,
      edge_count: trusted.length,
      excluded_edge_count: edges.length - trusted.length,
      node_count: graph.adjacency.filter((a) => a.length > 0).length,
    },
    community_count: new Set(community.filter((c): c is number => c !== null)).size,
    nodes: perNode,
    gaps,
    candidate_edges: candidates,
  };
}
