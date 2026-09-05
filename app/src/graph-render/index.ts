/**
 * The one shared graph component (ARCHITECTURE.md §5.3): a d3-force SVG
 * with three presets (ego | lens | path). It receives pre-filtered nodes
 * and edges as plain display records and navigates via ordinary hash
 * links — it never queries data itself. Layout runs synchronously before
 * paint (d3-force's deterministic defaults), so there is no animation and
 * nothing moves under keyboard focus; no zoom/pan in v1 — legibility comes
 * from the caller curating what is rendered (ROADMAP M4).
 *
 * Visual grammar: node color from the schema type token (--nt-*), edge
 * line style + weight from the strength line grammar — and every rendered
 * relationship is also present as text: the caption under the graph reads
 * out the hovered/focused edge sentence, and the calling view renders the
 * full sentence list (ARCHITECTURE.md §5.4).
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

export type GraphPreset = 'ego' | 'lens' | 'path';

export interface GraphViewNode {
  /** Stable id (the slug). */
  id: string;
  label: string;
  /** Semantic style token for the node's type, e.g. "nt-operation". */
  colorToken: string;
  /** Navigation target, e.g. "#/c/eigenvalues". */
  href: string;
  /**
   * Emphasized rendering and pinning: the ego center (0) or the path
   * endpoints in reading order (0 = left, 1 = right).
   */
  focus?: number;
}

export interface GraphViewEdge {
  from: string;
  to: string;
  /** Strength line grammar tokens from schema.yaml. */
  line: 'solid' | 'dashed' | 'dotted';
  emphasis: 'strong' | 'medium' | 'light';
  /** Research-gap edge: flagged, never blended in (spec §4). */
  gap?: boolean;
  /**
   * Directed edge type: an arrowhead marks the target end (UI_REDESIGN.md
   * §4.9). Symmetric types stay markerless — the absence is informative.
   */
  directed?: boolean;
  /** The full readable claim; caption text and accessible name. */
  sentence: string;
}

export interface GraphViewProps {
  preset: GraphPreset;
  nodes: GraphViewNode[];
  edges: GraphViewEdge[];
  /** Accessible name for the figure. */
  label: string;
}

interface SimNode extends SimulationNodeDatum {
  id: string;
  view: GraphViewNode;
}

interface SimLink extends SimulationLinkDatum<SimNode> {
  view: GraphViewEdge;
  /** Position among parallel edges of the same pair, for curvature. */
  seq: number;
  count: number;
}

const SVG_NS = 'http://www.w3.org/2000/svg';

function s<K extends keyof SVGElementTagNameMap>(
  tag: K,
  attrs: Record<string, string> = {},
): SVGElementTagNameMap[K] {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [key, value] of Object.entries(attrs)) el.setAttribute(key, value);
  return el;
}

/**
 * Compact node labels: prefer the first comma/colon segment of a long
 * canonical name, else cut at a word boundary, never ending on a dangling
 * connector ("Eigenvalues and…" → "Eigenvalues…"). The <title> and the
 * text lists always carry the full name.
 */
export function shortLabel(label: string, max = 22): string {
  if (label.length <= max) return label;
  const segment = label.split(/[,:(]/, 1)[0]!.trim();
  if (segment.length <= max && segment.length < label.length) return `${segment}…`;
  let cut = label.slice(0, max);
  const space = cut.lastIndexOf(' ');
  if (space > 4) cut = cut.slice(0, space);
  cut = cut.replace(/(?:\s+(?:and|the|of|a|an|as|for|to|in|its|with))+$/i, '');
  return `${cut.trimEnd()}…`;
}

interface Geometry {
  width: number;
  height: number;
  linkDistance: number;
}

/** Canvas sized to the node count so density stays roughly constant. */
function geometry(preset: GraphPreset, nodeCount: number): Geometry {
  if (preset === 'ego') {
    const side = Math.round(Math.max(340, 130 * Math.sqrt(nodeCount)));
    return { width: side + 60, height: side, linkDistance: 78 };
  }
  if (preset === 'path') {
    return { width: 680, height: Math.max(240, 110 * Math.sqrt(nodeCount)), linkDistance: 90 };
  }
  const height = Math.round(Math.max(360, 118 * Math.sqrt(nodeCount)));
  return { width: 680, height, linkDistance: 84 };
}

/**
 * Run the force layout to rest, synchronously. d3-force v3 is
 * deterministic for a fixed input order (phyllotaxis initial placement,
 * seeded internal randomness), so the same subgraph always lays out the
 * same way.
 */
function layout(props: GraphViewProps, geo: Geometry): { nodes: SimNode[]; links: SimLink[] } {
  const nodes: SimNode[] = props.nodes.map((view) => ({ id: view.id, view }));
  const byId = new Map(nodes.map((n) => [n.id, n]));

  const pairCounts = new Map<string, number>();
  const pairKey = (e: GraphViewEdge): string => [e.from, e.to].sort().join('|');
  for (const edge of props.edges) {
    pairCounts.set(pairKey(edge), (pairCounts.get(pairKey(edge)) ?? 0) + 1);
  }
  const pairSeen = new Map<string, number>();
  const links: SimLink[] = props.edges
    .filter((e) => byId.has(e.from) && byId.has(e.to))
    .map((view) => {
      const key = pairKey(view);
      const seq = pairSeen.get(key) ?? 0;
      pairSeen.set(key, seq + 1);
      return { source: view.from, target: view.to, view, seq, count: pairCounts.get(key)! };
    });

  const { width, height } = geo;
  if (props.preset === 'ego') {
    const center = nodes.find((n) => n.view.focus !== undefined);
    if (center) {
      center.fx = width / 2;
      center.fy = height / 2;
    }
  } else if (props.preset === 'path') {
    const focused = nodes
      .filter((n) => n.view.focus !== undefined)
      .sort((a, b) => a.view.focus! - b.view.focus!);
    if (focused.length === 2) {
      focused[0]!.fx = 80;
      focused[0]!.fy = height / 2;
      focused[1]!.fx = width - 80;
      focused[1]!.fy = height / 2;
    }
  }

  const simulation = forceSimulation(nodes)
    .force(
      'link',
      forceLink<SimNode, SimLink>(links)
        .id((n) => n.id)
        .distance(geo.linkDistance),
    )
    .force('charge', forceManyBody().strength(-300))
    .force('x', forceX(width / 2).strength(0.05))
    .force('y', forceY(height / 2).strength(width / height > 1.4 ? 0.09 : 0.05))
    .force('collide', forceCollide(34))
    .stop();
  simulation.tick(300);

  // Fit to the canvas: whatever equilibrium the forces found, use the
  // drawing area (margins leave room for labels), scaling near-uniformly —
  // a mild per-axis boost fills the frame, a cap keeps a sparse layout
  // from being stretched into distortion — and centering the rest.
  const xs = nodes.map((n) => n.x ?? width / 2);
  const ys = nodes.map((n) => n.y ?? height / 2);
  const [minX, maxX] = [Math.min(...xs), Math.max(...xs)];
  const [minY, maxY] = [Math.min(...ys), Math.max(...ys)];
  const [padX, padTop, padBottom] = [66, 24, 42];
  const [availW, availH] = [width - 2 * padX, height - padTop - padBottom];
  const [spanX, spanY] = [maxX - minX, maxY - minY];
  const sx = spanX < 1 ? Infinity : availW / spanX;
  const sy = spanY < 1 ? Infinity : availH / spanY;
  const uniform = Number.isFinite(Math.min(sx, sy)) ? Math.min(sx, sy) : 1;
  const scaleX = Math.min(sx, uniform * 1.35);
  const scaleY = Math.min(sy, uniform * 1.35);
  const offX = padX + (availW - spanX * (Number.isFinite(scaleX) ? scaleX : 0)) / 2;
  const offY = padTop + (availH - spanY * (Number.isFinite(scaleY) ? scaleY : 0)) / 2;
  for (const node of nodes) {
    node.x = spanX < 1 ? width / 2 : offX + ((node.x ?? 0) - minX) * scaleX;
    node.y = spanY < 1 ? height / 2 : offY + ((node.y ?? 0) - minY) * scaleY;
  }
  return { nodes, links };
}

/** Space between a directed edge's arrow tip and the target node's rim. */
const ARROW_CLEARANCE = 2;

/** Path for one edge; parallel edges of a pair bow apart symmetrically. */
function edgePath(link: SimLink): string {
  const a = link.source as SimNode;
  const b = link.target as SimNode;
  const [x1, y1] = [a.x!, a.y!];
  let [x2, y2] = [b.x!, b.y!];
  const bow = (link.seq - (link.count - 1) / 2) * 26;
  const [mx, my] = [(x1 + x2) / 2, (y1 + y2) / 2];
  const len = Math.hypot(x2 - x1, y2 - y1) || 1;
  const [cx, cy] = [mx + (-(y2 - y1) / len) * bow, my + ((x2 - x1) / len) * bow];
  if (link.view.directed) {
    // Stop at the target's rim so the arrowhead isn't painted over by the
    // node circle (nodes render above edges). The trim direction follows
    // the end tangent — for a bowed pair that is the control point, which
    // keeps parallel arrowheads separated.
    const radius = (b.view.focus !== undefined ? 8 : 6) + ARROW_CLEARANCE;
    const [tx, ty] = bow === 0 ? [x1, y1] : [cx, cy];
    const tangent = Math.hypot(x2 - tx, y2 - ty) || 1;
    x2 -= ((x2 - tx) / tangent) * radius;
    y2 -= ((y2 - ty) / tangent) * radius;
  }
  if (bow === 0) return `M ${x1.toFixed(1)} ${y1.toFixed(1)} L ${x2.toFixed(1)} ${y2.toFixed(1)}`;
  return `M ${x1.toFixed(1)} ${y1.toFixed(1)} Q ${cx.toFixed(1)} ${cy.toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}`;
}

/**
 * Arrowhead markers for directed edges, one per stroke color the line
 * grammar can produce (emphasis inks, the gap warn, hover/focus). Fill
 * comes from the style module via the marker classes; the CSS `marker-end`
 * rules attach them to `.edge-line.directed` by the same classes that
 * color the stroke, so head and line can never disagree.
 */
function arrowDefs(): SVGDefsElement {
  const defs = s('defs');
  for (const kind of ['strong', 'medium', 'light', 'gap', 'focus']) {
    const marker = s('marker', {
      id: `arrow-${kind}`,
      class: `graph-arrow arrow-${kind}`,
      viewBox: '0 0 8 8',
      refX: '8',
      refY: '4',
      markerWidth: '8',
      markerHeight: '8',
      markerUnits: 'userSpaceOnUse',
      orient: 'auto',
    });
    marker.appendChild(s('path', { d: 'M 0 0 L 8 4 L 0 8 Z' }));
    defs.appendChild(marker);
  }
  return defs;
}

/**
 * Render the graph figure. Nodes are real links (click and Enter both
 * navigate); edges are focusable and read their sentence into the caption
 * on hover/focus, so the claim is always recoverable without a pointer.
 */
export function renderGraph(props: GraphViewProps): HTMLElement {
  const geo = geometry(props.preset, props.nodes.length);
  const { nodes, links } = layout(props, geo);

  const svg = s('svg', {
    viewBox: `0 0 ${geo.width} ${geo.height}`,
    role: 'group',
    'aria-label': props.label,
    class: `graph-svg preset-${props.preset}`,
  });

  const caption = document.createElement('figcaption');
  caption.className = 'graph-caption';
  caption.setAttribute('aria-live', 'polite');
  const idleCaption = props.edges.length > 0 ? 'Point at or tab to an edge to read its claim.' : '';
  caption.textContent = idleCaption;

  if (props.edges.some((e) => e.directed)) svg.appendChild(arrowDefs());

  const edgeLayer = s('g', { class: 'graph-edges' });
  for (const link of links) {
    const d = edgePath(link);
    const view = link.view;
    const group = s('g', {
      class: `graph-edge line-${view.line} emph-${view.emphasis}${view.gap ? ' gap' : ''}`,
      tabindex: '0',
      role: 'img',
      'aria-label': view.sentence,
    });
    group.appendChild(s('path', { class: 'edge-hit', d }));
    group.appendChild(s('path', { class: `edge-line${view.directed ? ' directed' : ''}`, d }));
    const show = (): void => {
      caption.textContent = view.sentence;
    };
    const hide = (): void => {
      caption.textContent = idleCaption;
    };
    group.addEventListener('mouseenter', show);
    group.addEventListener('mouseleave', hide);
    group.addEventListener('focus', show);
    group.addEventListener('blur', hide);
    edgeLayer.appendChild(group);
  }
  svg.appendChild(edgeLayer);

  const nodeLayer = s('g', { class: 'graph-nodes' });
  for (const node of nodes) {
    const view = node.view;
    const focus = view.focus !== undefined;
    const anchor = s('a', {
      href: view.href,
      class: `graph-node${focus ? ' focus-node' : ''}`,
      style: `--accent: var(--${view.colorToken})`,
      transform: `translate(${node.x!.toFixed(1)}, ${node.y!.toFixed(1)})`,
    });
    anchor.appendChild(s('circle', { r: focus ? '8' : '6' }));
    const text = s('text', { class: 'graph-label', y: focus ? '21' : '19' });
    text.textContent = shortLabel(view.label);
    anchor.appendChild(text);
    const title = s('title');
    title.textContent = view.label;
    anchor.appendChild(title);
    nodeLayer.appendChild(anchor);
  }
  svg.appendChild(nodeLayer);

  const figure = document.createElement('figure');
  figure.className = `graph-view graph-${props.preset}`;
  figure.appendChild(svg);
  figure.appendChild(caption);
  return figure;
}
