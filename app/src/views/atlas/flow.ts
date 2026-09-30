import type { Atlas } from '../../data/atlas';
import { trustedEgoNetwork } from '../../data/subgraph';
import type { GraphEdge, GraphNode } from '../../data/types';
import { arrowDefs, svgEl } from '../../graph-render';
import { replaceHash } from '../../shell/router';
import { typeBadge } from '../common/badges';
import { h } from '../common/dom';
import { edgeClaim, edgeSentenceText } from '../common/edge-claim';
import type { View } from '../common/view';
import { compareHash } from '../compare';
import { matrixHash } from '../matrix';
import { pathHash } from '../path';
import type { AtlasDepth } from './index';
import { connectionAttention } from './connections';
import {
  deterministicFlowOrder,
  flowBand,
  flowGroupLabel,
  flowLayer,
  flowRoute,
  FLOW_LAYERS,
  type FlowGroup,
  type FlowLayer,
  type FlowOrderOptions,
  type FlowRoute,
} from './flow-layout';

export interface FlowAtlasState {
  layout: 'flow';
  focus?: string;
  depth?: AtlasDepth;
  group?: FlowGroup;
}

const LAYER_LABEL: Record<FlowLayer, string> = {
  foundation: 'Foundation',
  form: 'Form',
  method: 'Method',
  behavior: 'Behavior',
  application: 'Application',
};
const X: Record<FlowLayer, number> = {
  foundation: 150,
  form: 455,
  method: 760,
  behavior: 1065,
  application: 1370,
};
const TOP = 112;
const ROW = 34;
const GROUP_GAP = 28;

export function flowAtlasHash(state: Omit<FlowAtlasState, 'layout'> = {}): string {
  const params = new URLSearchParams([['layout', 'flow']]);
  if (state.focus) {
    params.set('focus', state.focus);
    params.set('depth', String(state.depth ?? 1));
  }
  if ((state.group ?? 'field') !== 'field') params.set('group', state.group!);
  return `#/atlas?${params.toString()}`;
}

interface Point {
  node: GraphNode;
  layer: FlowLayer;
  x: number;
  y: number;
  group: string;
}

function routePath(a: Point, b: Point, route: FlowRoute, lane: number): string {
  const startX = a.x + (b.x >= a.x ? 7 : -7);
  const endX = b.x + (b.x >= a.x ? -9 : 9);
  if (route === 'same-layer') {
    const side = lane <= 0 ? -1 : 1;
    const bowX = a.x + side * (76 + Math.abs(lane) * 18);
    return `M ${startX} ${a.y} C ${bowX} ${a.y}, ${bowX} ${b.y}, ${endX} ${b.y}`;
  }
  if (route === 'backward') {
    const channel = 64 + lane * 12;
    return `M ${startX} ${a.y} C ${startX} ${channel}, ${endX} ${channel}, ${endX} ${b.y}`;
  }
  if (route === 'long') {
    const offset = lane * 12;
    const mid = (startX + endX) / 2;
    return `M ${startX} ${a.y} C ${mid} ${a.y + offset}, ${mid} ${b.y + offset}, ${endX} ${b.y}`;
  }
  const mid = (startX + endX) / 2;
  const offset = lane * 14;
  return `M ${startX} ${a.y} C ${mid} ${a.y + offset}, ${mid} ${b.y + offset}, ${endX} ${b.y}`;
}

function claimGroups(atlas: Atlas, node: GraphNode, edges: GraphEdge[]): HTMLElement {
  const section = (title: string, members: GraphEdge[], from?: string): HTMLElement | null =>
    members.length
      ? h(
          'section',
          { class: 'atlas-claim-group' },
          h('h3', {}, `${title} (${String(members.length)})`),
          h(
            'ul',
            { class: 'connection-list compact' },
            members.map((edge) => edgeClaim(atlas, edge, from ? { from } : {})),
          ),
        )
      : null;
  return h(
    'div',
    { class: 'atlas-claims' },
    h('h2', { class: 'atlas-claims-title' }, 'Visible relationships'),
    section(
      'Outgoing claims',
      edges.filter((edge) => !edge.symmetric && edge.from === node.slug),
      node.slug,
    ),
    section(
      'Incoming claims',
      edges.filter((edge) => !edge.symmetric && edge.to === node.slug),
      node.slug,
    ),
    section(
      'Symmetric claims',
      edges.filter((edge) => edge.symmetric && (edge.from === node.slug || edge.to === node.slug)),
      node.slug,
    ),
    section(
      'Between-neighbor context',
      edges.filter((edge) => edge.from !== node.slug && edge.to !== node.slug),
    ),
  );
}

function inspector(
  atlas: Atlas,
  node: GraphNode,
  edges: GraphEdge[],
  state: FlowAtlasState,
): HTMLElement {
  return h(
    'aside',
    {
      class: 'atlas-inspector flow-inspector',
      'aria-labelledby': 'atlas-inspector-title',
      tabindex: '-1',
    },
    h(
      'header',
      { class: 'atlas-inspector-head' },
      h('p', { class: 'eyebrow' }, `${LAYER_LABEL[flowLayer(node)]} layer`),
      h('h2', { id: 'atlas-inspector-title' }, node.canonical_name),
      h(
        'a',
        {
          class: 'atlas-inspector-close',
          href: flowAtlasHash({ group: state.group }),
          'aria-label': 'Close concept inspection',
        },
        '×',
      ),
    ),
    h('p', { class: 'badges' }, typeBadge(atlas, node.node_type)),
    h('p', { class: 'atlas-inspector-summary' }, node.summary),
    h(
      'p',
      { class: 'atlas-inspector-fields' },
      h('strong', {}, 'Fields: '),
      node.fields.map((f) => atlas.fieldLabel(f)).join(' · ') || 'not assigned',
    ),
    h(
      'nav',
      { class: 'atlas-actions', 'aria-label': `Actions for ${node.canonical_name}` },
      h('a', { class: 'atlas-action primary', href: `#/c/${node.slug}` }, 'Open concept'),
      h('a', { class: 'atlas-action', href: pathHash(node.slug) }, 'Find path'),
      h('a', { class: 'atlas-action', href: compareHash(node.slug) }, 'Compare'),
      h(
        'a',
        { class: 'atlas-action', href: matrixHash({ filters: {}, focus: node.slug }) },
        'Open matrix',
      ),
      h(
        'a',
        { class: 'atlas-action', href: `#/atlas?focus=${node.slug}&depth=1` },
        'Focus in concept map',
      ),
    ),
    claimGroups(atlas, node, edges),
  );
}

export function flowAtlasView(atlas: Atlas, initial: FlowAtlasState): View {
  const group = initial.group ?? 'field';
  const trusted = atlas.edges.filter(
    (edge) => (atlas.strength(edge.strength)?.rank ?? 99) <= atlas.trustedRank,
  );
  const selectedSlugs = new Set(trusted.flatMap((edge) => [edge.from, edge.to]));
  const nodes = atlas.nodes.filter((node) => selectedSlugs.has(node.slug));
  const focus = initial.focus && selectedSlugs.has(initial.focus) ? initial.focus : undefined;
  const depth: AtlasDepth = focus ? (initial.depth ?? 1) : 'all';
  const neighborhood = focus && depth !== 'all' ? trustedEgoNetwork(atlas, focus, depth) : null;
  const visibleEdges = focus
    ? (neighborhood?.edges ?? trusted)
    : trusted.filter((edge) => flowBand(edge) === 'primary');
  const active = new Set(
    neighborhood?.nodes.map((node) => node.slug) ?? nodes.map((node) => node.slug),
  );
  const options: FlowOrderOptions = {
    group,
    fieldLabel: (id) => atlas.fieldLabel(id),
    community: (slug) => atlas.nodeMetrics(slug)?.community ?? null,
  };
  const order = deterministicFlowOrder(nodes, trusted, options);
  const points: Point[] = [];
  let maxY = TOP;
  for (const layer of FLOW_LAYERS) {
    let y = TOP;
    let previousGroup = '';
    for (const node of order.layers[layer]) {
      const nodeGroup = layer === 'application' ? flowGroupLabel(node, options) : '';
      if (previousGroup && nodeGroup !== previousGroup) y += GROUP_GAP;
      points.push({ node, layer, x: X[layer], y, group: nodeGroup });
      previousGroup = nodeGroup;
      y += ROW;
    }
    maxY = Math.max(maxY, y);
  }
  const bySlug = new Map(points.map((point) => [point.node.slug, point]));
  const width = 1540;
  const height = maxY + 45;
  const svg = svgEl('svg', {
    class: 'flow-svg',
    viewBox: `0 0 ${String(width)} ${String(height)}`,
    width: String(width),
    height: String(height),
    role: 'group',
    'aria-label': focus
      ? `Structure to Use layered network focused on ${atlas.node(focus)!.canonical_name}, ${String(depth)} hop view`
      : 'Structure to Use layered network: Foundation, Form, Method, Behavior, Application',
  });
  svg.appendChild(arrowDefs());
  const background = svgEl('g', { class: 'flow-guides', 'aria-hidden': 'true' });
  for (const layer of FLOW_LAYERS) {
    background.appendChild(
      svgEl('line', {
        x1: String(X[layer]),
        x2: String(X[layer]),
        y1: '72',
        y2: String(height - 20),
      }),
    );
    const heading = svgEl('text', {
      x: String(X[layer]),
      y: '36',
      class: 'flow-layer-heading',
      'text-anchor': 'middle',
    });
    heading.textContent = LAYER_LABEL[layer];
    background.appendChild(heading);
  }
  if (group !== 'none') {
    const applications = points.filter((point) => point.layer === 'application');
    for (const label of [...new Set(applications.map((point) => point.group))]) {
      const members = applications.filter((point) => point.group === label);
      if (!members.length) continue;
      const first = members[0]!;
      const last = members[members.length - 1]!;
      background.appendChild(
        svgEl('rect', {
          class: 'flow-group-region',
          x: '1235',
          y: String(first.y - 18),
          width: '292',
          height: String(last.y - first.y + 36),
          rx: '8',
        }),
      );
      const text = svgEl('text', { class: 'flow-group-label', x: '1247', y: String(first.y - 5) });
      text.textContent = label;
      background.appendChild(text);
    }
  }
  svg.appendChild(background);

  const caption = h('figcaption', {
    class: 'graph-caption flow-caption',
    'aria-live': 'polite',
    'aria-atomic': 'true',
  });
  const idleCaption = focus
    ? 'Focused claims are emphasized without changing the complete graph ordering.'
    : 'Point at or tab to a concept or claim for its full readable description.';
  caption.textContent = idleCaption;
  const wire = (element: SVGElement, text: string): void => {
    const show = (): void => {
      element.classList.add('is-interacting');
      caption.textContent = text;
    };
    const hide = (): void => {
      element.classList.remove('is-interacting');
      caption.textContent = idleCaption;
    };
    element.addEventListener('mouseenter', show);
    element.addEventListener('mouseleave', hide);
    element.addEventListener('focus', show);
    element.addEventListener('blur', hide);
  };
  const edgeLayer = svgEl('g', { class: 'graph-edges flow-edges' });
  const pairKey = (edge: GraphEdge): string => [edge.from, edge.to].sort().join('|');
  const pairCounts = new Map<string, number>();
  visibleEdges.forEach((edge) =>
    pairCounts.set(pairKey(edge), (pairCounts.get(pairKey(edge)) ?? 0) + 1),
  );
  const pairSeen = new Map<string, number>();
  visibleEdges.forEach((edge) => {
    const a = bySlug.get(edge.from);
    const b = bySlug.get(edge.to);
    if (!a || !b) return;
    const route = flowRoute(edge, order.layerBySlug);
    const sentence = edgeSentenceText(atlas, edge);
    const strength = atlas.strength(edge.strength);
    const attention = connectionAttention(edge, focus);
    const groupEl = svgEl('g', {
      class: `graph-edge flow-edge route-${route} band-${flowBand(edge)} line-${strength?.line ?? 'solid'} emph-${strength?.emphasis ?? 'medium'} attention-${attention}`,
      tabindex: '0',
      role: 'img',
      'aria-label': sentence,
      'data-edge': `${edge.from}|${edge.to}|${edge.type}`,
      'data-route': route,
      'data-symmetric': String(edge.symmetric),
      'data-strength': edge.strength,
    });
    const key = pairKey(edge);
    const sequence = pairSeen.get(key) ?? 0;
    pairSeen.set(key, sequence + 1);
    const lane = sequence - ((pairCounts.get(key) ?? 1) - 1) / 2;
    const d = routePath(a, b, route, lane);
    groupEl.append(svgEl('path', { class: 'edge-hit', d }));
    groupEl.append(svgEl('path', { class: `edge-line${edge.symmetric ? '' : ' directed'}`, d }));
    wire(groupEl, sentence);
    edgeLayer.appendChild(groupEl);
  });
  svg.appendChild(edgeLayer);
  const nodeLayer = svgEl('g', { class: 'graph-nodes flow-nodes' });
  for (const point of points) {
    const contextual = Boolean(focus) && !active.has(point.node.slug);
    const anchor = svgEl('a', {
      href: flowAtlasHash({ focus: point.node.slug, depth: 1, group }),
      class: `graph-node flow-node${point.node.slug === focus ? ' focus-node' : ''}${contextual ? ' context-node' : ''}`,
      style: `--accent: var(--${atlas.nodeType(point.node.node_type)?.color_token ?? 'ink-muted'})`,
      transform: `translate(${String(point.x)} ${String(point.y)})`,
      'data-slug': point.node.slug,
      'data-layer': point.layer,
      'aria-label': `${point.node.canonical_name}. ${LAYER_LABEL[point.layer]} layer. ${point.node.summary}${point.node.fields.length ? ` Fields: ${point.node.fields.map((f) => atlas.fieldLabel(f)).join(', ')}.` : ''}`,
      ...(point.node.slug === focus ? { 'aria-current': 'location' } : {}),
    });
    if (point.node.slug === focus) anchor.append(svgEl('circle', { class: 'atlas-ring', r: '11' }));
    anchor.append(svgEl('circle', { r: '6' }));
    const label = svgEl('text', { class: 'graph-label flow-node-label', x: '11', y: '4' });
    label.textContent = point.node.canonical_name;
    anchor.append(label);
    wire(anchor, `${point.node.canonical_name}. ${point.node.summary}`);
    nodeLayer.appendChild(anchor);
  }
  svg.appendChild(nodeLayer);

  const depthLink = (value: AtlasDepth, label: string): HTMLElement =>
    h(
      'a',
      {
        class: 'atlas-depth',
        href: focus ? flowAtlasHash({ focus, depth: value, group }) : flowAtlasHash({ group }),
        ...(focus && depth === value ? { 'aria-current': 'page' } : {}),
        ...(!focus ? { 'aria-disabled': 'true', tabindex: '-1' } : {}),
      },
      label,
    );
  const groupSelect = h(
    'select',
    {
      class: 'flow-group-select',
      'aria-label': 'Application grouping',
      onchange: ((event: Event) => {
        location.hash = flowAtlasHash({
          ...(focus ? { focus, depth } : {}),
          group: (event.currentTarget as HTMLSelectElement).value as FlowGroup,
        });
      }) as EventListener,
    },
    ...(['field', 'community', 'none'] as const).map((value) =>
      h(
        'option',
        { value, selected: group === value },
        value === 'field' ? 'Field' : value === 'community' ? 'Community' : 'None',
      ),
    ),
  );
  const toolbar = h(
    'div',
    {
      class: 'atlas-toolbar flow-toolbar',
      role: 'toolbar',
      'aria-label': 'Structure to Use controls',
    },
    h(
      'span',
      { class: 'atlas-toolbar-context' },
      focus ? `Focused: ${atlas.node(focus)!.canonical_name}` : 'Overview: primary flow claims',
    ),
    h(
      'span',
      { class: 'atlas-depths', role: 'group', 'aria-label': 'Neighborhood depth' },
      depthLink(1, '1 hop'),
      depthLink(2, '2 hop'),
      depthLink('all', 'All'),
    ),
    h('label', { class: 'flow-group-control' }, h('span', {}, 'Group applications'), groupSelect),
    h('a', { class: 'atlas-tool-link', href: '#/atlas' }, 'Concept map'),
    h('a', { class: 'atlas-tool-link', href: '#/atlas?layout=bridges' }, 'Bridge map'),
    h('a', { class: 'atlas-tool-link', href: flowAtlasHash() }, 'Reset'),
  );
  const panel = focus
    ? inspector(atlas, atlas.node(focus)!, visibleEdges, { layout: 'flow', focus, depth, group })
    : null;
  const readable = h(
    'section',
    { class: 'flow-readable', 'aria-labelledby': 'flow-readable-title' },
    h('h2', { id: 'flow-readable-title' }, `Claims drawn (${String(visibleEdges.length)})`),
    h(
      'p',
      { class: 'section-hint' },
      'Every line in the layered network appears below with its stored direction, type, strength, context, and evidence.',
    ),
    h(
      'ul',
      { class: 'connection-list compact' },
      visibleEdges.map((edge) => edgeClaim(atlas, edge)),
    ),
  );
  const figure = h(
    'figure',
    { class: 'flow-figure' },
    h(
      'div',
      { class: 'flow-scroll', tabindex: '0', 'aria-label': 'Scrollable layered network surface' },
      svg,
    ),
    caption,
  );
  const el = h(
    'article',
    { class: 'view atlas-overview content wide flow-atlas-view' },
    h(
      'header',
      { class: 'atlas-titlebar' },
      h('h1', {}, 'Structure to Use'),
      h(
        'p',
        {},
        'An honest layered projection of the existing trusted graph. Arrows retain stored claim direction.',
      ),
    ),
    toolbar,
    h(
      'div',
      { class: `atlas-workspace flow-workspace${panel ? ' has-inspector' : ''}` },
      figure,
      panel,
    ),
    readable,
  );
  return {
    title: focus ? `Structure to Use: ${atlas.node(focus)!.canonical_name}` : 'Structure to Use',
    el,
    onMount: () => {
      const canonical = flowAtlasHash({ ...(focus ? { focus, depth } : {}), group });
      if (location.hash !== canonical) replaceHash(canonical);
      if (panel) panel.focus({ preventScroll: true });
    },
  };
}
