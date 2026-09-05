/**
 * Stage 4 — layout: a deterministic force layout of the trusted subgraph,
 * computed once at build time (UI_REDESIGN.md §4.7, ROADMAP M14). The app's
 * atlas overview and concept-page minimaps render these fixed coordinates —
 * identical for every visitor, stable across sessions, citable like every
 * artifact — instead of running client-side physics (spec §3.3's rationale:
 * never ship a layout that moves under the reader).
 *
 * Determinism: d3-force v3 is deterministic for a fixed input order — the
 * phyllotaxis initial placement and the seeded internal random source — and
 * the node list arrives in sorted-slug order with edges in pipeline order.
 * A fixed tick count, a uniform fit-to-canvas, and coordinate rounding make
 * the emitted map byte-identical across builds (the same contract as the
 * app's synchronous d3-force use since M4).
 *
 * Only nodes touched by at least one trusted edge sit in the constellation:
 * the layout draws actual claims only, so a node whose every connection is
 * an unverified analogy has no position — absence from the constellation is
 * information, exactly like an empty matrix cell.
 */
import {
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
  forceX,
  forceY,
  type SimulationLinkDatum,
  type SimulationNodeDatum,
} from 'd3-force';

/** Coordinate space the layout is fitted to (the app scales via viewBox). */
export const LAYOUT_WIDTH = 760;
export const LAYOUT_HEIGHT = 560;
const LAYOUT_PADDING = 36;
/** Enough for the default alpha schedule to fully converge (alphaMin). */
const LAYOUT_TICKS = 300;

interface LayoutNode extends SimulationNodeDatum {
  id: string;
}

function round1(x: number): number {
  return Math.round(x * 10) / 10;
}

/**
 * Lay out the trusted subgraph: slugs must be sorted (the link stage
 * guarantees it) and edges already filtered to the trusted floor. Returns
 * rounded `[x, y]` per slug for every node with at least one trusted edge.
 */
export function layoutTrustedSubgraph(
  slugs: string[],
  edges: { from: string; to: string }[],
): Record<string, [number, number]> {
  const touched = new Set<string>();
  for (const edge of edges) {
    touched.add(edge.from);
    touched.add(edge.to);
  }
  const nodes: LayoutNode[] = slugs.filter((s) => touched.has(s)).map((id) => ({ id }));
  if (nodes.length === 0) return {};

  const links: SimulationLinkDatum<LayoutNode>[] = edges.map((e) => ({
    source: e.from,
    target: e.to,
  }));
  const simulation = forceSimulation(nodes)
    .force(
      'link',
      forceLink<LayoutNode, SimulationLinkDatum<LayoutNode>>(links)
        .id((n) => n.id)
        .distance(66),
    )
    .force('charge', forceManyBody().strength(-240))
    .force('x', forceX(LAYOUT_WIDTH / 2).strength(0.055))
    .force('y', forceY(LAYOUT_HEIGHT / 2).strength(0.075))
    .force('collide', forceCollide(24))
    .stop();
  simulation.tick(LAYOUT_TICKS);

  // Uniform fit-to-canvas (never per-axis: distortion would misread as
  // structure), centered inside the padding.
  const xs = nodes.map((n) => n.x ?? 0);
  const ys = nodes.map((n) => n.y ?? 0);
  const [minX, maxX] = [Math.min(...xs), Math.max(...xs)];
  const [minY, maxY] = [Math.min(...ys), Math.max(...ys)];
  const [spanX, spanY] = [maxX - minX, maxY - minY];
  const availW = LAYOUT_WIDTH - 2 * LAYOUT_PADDING;
  const availH = LAYOUT_HEIGHT - 2 * LAYOUT_PADDING;
  const scale = Math.min(
    spanX < 1 ? Infinity : availW / spanX,
    spanY < 1 ? Infinity : availH / spanY,
  );
  const s = Number.isFinite(scale) ? scale : 1;
  const offX = LAYOUT_PADDING + (availW - spanX * s) / 2;
  const offY = LAYOUT_PADDING + (availH - spanY * s) / 2;

  const layout: Record<string, [number, number]> = {};
  for (const node of nodes) {
    layout[node.id] = [
      round1(offX + ((node.x ?? 0) - minX) * s),
      round1(offY + ((node.y ?? 0) - minY) * s),
    ];
  }
  return layout;
}
