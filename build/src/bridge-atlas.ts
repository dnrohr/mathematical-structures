import type {
  BridgeAtlasBridge,
  BridgeAtlasCommunity,
  BridgeAtlasFrontier,
  BridgeAtlasMetrics,
  GraphEdge,
  NodeMetrics,
} from './model.js';

const TERRITORY_SCALE = 18;
const TERRITORY_GAP = 14;
const VIEW_WIDTH = 760;
const VIEW_HEIGHT = 560;
const VIEW_PADDING = 10;

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

function circlePath(cx: number, cy: number, radius: number): string {
  const left = round1(cx - radius);
  const right = round1(cx + radius);
  const y = round1(cy);
  const r = round1(radius);
  return `M ${left} ${y} A ${r} ${r} 0 1 0 ${right} ${y} A ${r} ${r} 0 1 0 ${left} ${y} Z`;
}

function centroid(points: [number, number][]): [number, number] {
  const cx = points.reduce((sum, [x]) => sum + x, 0) / points.length;
  const cy = points.reduce((sum, [, y]) => sum + y, 0) / points.length;
  return [cx, cy];
}

function separate(
  drafts: { id: number; center: [number, number]; radius: number }[],
): Map<number, [number, number]> {
  const placed = drafts.map((draft) => ({
    ...draft,
    center: [...draft.center] as [number, number],
  }));
  for (let pass = 0; pass < 80; pass++) {
    let moved = false;
    for (let i = 0; i < placed.length; i++) {
      for (let j = i + 1; j < placed.length; j++) {
        const a = placed[i]!;
        const b = placed[j]!;
        let dx = b.center[0] - a.center[0];
        let dy = b.center[1] - a.center[1];
        let distance = Math.hypot(dx, dy);
        if (distance < 0.001) {
          dx = (a.id + b.id) % 2 === 0 ? 1 : 0;
          dy = dx === 0 ? 1 : 0;
          distance = 1;
        }
        const overlap = a.radius + b.radius + TERRITORY_GAP - distance;
        if (overlap <= 0) continue;
        const shift = overlap / 2;
        const ux = dx / distance;
        const uy = dy / distance;
        a.center[0] -= ux * shift;
        a.center[1] -= uy * shift;
        b.center[0] += ux * shift;
        b.center[1] += uy * shift;
        moved = true;
      }
    }
    for (const item of placed) {
      item.center[0] = Math.max(
        item.radius + VIEW_PADDING,
        Math.min(VIEW_WIDTH - item.radius - VIEW_PADDING, item.center[0]),
      );
      item.center[1] = Math.max(
        item.radius + VIEW_PADDING,
        Math.min(VIEW_HEIGHT - item.radius - VIEW_PADDING, item.center[1]),
      );
    }
    if (!moved) break;
  }
  return new Map(placed.map((item) => [item.id, [round1(item.center[0]), round1(item.center[1])]]));
}

function increment(counts: Record<string, number>, key: string): void {
  counts[key] = (counts[key] ?? 0) + 1;
}

/**
 * Build the Bridge Atlas exclusively from already-normalized community labels,
 * trusted edges, and the fixed layout. Numeric community ids are therefore
 * stable under the same smallest-member-slug signature as analyze.communities.
 */
export function buildBridgeAtlas(
  nodeMetrics: Record<string, NodeMetrics>,
  layout: Record<string, [number, number]>,
  edges: GraphEdge[],
  trustedEdgeIndexes: number[],
): BridgeAtlasMetrics {
  const members = new Map<number, string[]>();
  for (const slug of Object.keys(nodeMetrics).sort()) {
    const community = nodeMetrics[slug]!.community;
    if (community === null || layout[slug] === undefined) continue;
    const list = members.get(community) ?? [];
    list.push(slug);
    members.set(community, list);
  }

  const internal = new Map<number, number>();
  const crossing = new Map<string, BridgeAtlasBridge>();
  for (const edgeIndex of trustedEdgeIndexes) {
    const edge = edges[edgeIndex]!;
    const a = nodeMetrics[edge.from]!.community;
    const b = nodeMetrics[edge.to]!.community;
    if (a === null || b === null) continue;
    if (a === b) {
      internal.set(a, (internal.get(a) ?? 0) + 1);
      continue;
    }
    const source = Math.min(a, b);
    const target = Math.max(a, b);
    const key = `${String(source)}-${String(target)}`;
    const aggregate = crossing.get(key) ?? {
      source_community: source,
      target_community: target,
      trusted_edge_count: 0,
      edge_indexes: [],
      strength_counts: {},
      type_counts: {},
    };
    aggregate.edge_indexes.push(edgeIndex);
    aggregate.trusted_edge_count += 1;
    increment(aggregate.strength_counts, edge.strength);
    increment(aggregate.type_counts, edge.type);
    crossing.set(key, aggregate);
  }

  const drafts = [...members.entries()]
    .sort(([a], [b]) => a - b)
    .map(([id, member_slugs]) => {
      const landmark_slugs = [...member_slugs]
        .sort(
          (a, b) =>
            nodeMetrics[b]!.degree - nodeMetrics[a]!.degree ||
            nodeMetrics[b]!.betweenness - nodeMetrics[a]!.betweenness ||
            a.localeCompare(b),
        )
        .slice(0, Math.min(3, member_slugs.length));
      const center = centroid(member_slugs.map((slug) => layout[slug]!));
      return {
        id,
        member_slugs,
        member_count: member_slugs.length,
        landmark_slugs,
        internal_trusted_edge_count: internal.get(id) ?? 0,
        center,
        radius: Math.sqrt(member_slugs.length) * TERRITORY_SCALE,
      };
    });
  const centers = separate(drafts);
  const communities: BridgeAtlasCommunity[] = drafts.map(({ radius, ...draft }) => {
    const center = centers.get(draft.id)!;
    return {
      ...draft,
      center,
      territory_path: circlePath(center[0], center[1], round1(radius)),
    };
  });

  const edgeSort = (x: number, y: number): number => {
    const a = edges[x]!;
    const b = edges[y]!;
    return (
      a.from.localeCompare(b.from) ||
      a.to.localeCompare(b.to) ||
      a.type.localeCompare(b.type) ||
      a.strength.localeCompare(b.strength) ||
      x - y
    );
  };
  const bridges = [...crossing.values()]
    .map((bridge) => ({ ...bridge, edge_indexes: bridge.edge_indexes.sort(edgeSort) }))
    .sort(
      (a, b) => a.source_community - b.source_community || a.target_community - b.target_community,
    );

  const populated = new Set(bridges.map((b) => `${b.source_community}-${b.target_community}`));
  const frontiers: BridgeAtlasFrontier[] = [];
  for (let a = 0; a < communities.length; a++) {
    for (let b = a + 1; b < communities.length; b++) {
      const source = communities[a]!.id;
      const target = communities[b]!.id;
      if (!populated.has(`${source}-${target}`)) {
        frontiers.push({
          source_community: source,
          target_community: target,
          trusted_edge_count: 0,
        });
      }
    }
  }
  return { communities, bridges, frontiers };
}
