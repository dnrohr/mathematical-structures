/**
 * Atlas workspace. The fixed build-time constellation remains geographic
 * context; URL-backed focus selects a bounded trusted reading layer, while a
 * transient uniform camera provides bounded pan and zoom without relayout.
 */
import type { Atlas } from '../../data/atlas';
import { EGO_NODE_CAP, trustedEgoNetwork } from '../../data/subgraph';
import type { GraphEdge, GraphNode } from '../../data/types';
import { arrowDefs, shortLabel, svgEl } from '../../graph-render';
import { replaceHash } from '../../shell/router';
import { communityChip, communityToken, typeBadge } from '../common/badges';
import { h, joinChildren, type Child } from '../common/dom';
import { edgeClaim, edgeSentenceText } from '../common/edge-claim';
import type { View } from '../common/view';
import { bridgeAtlasView, type BridgeAtlasState } from './bridges';
import { flowAtlasView, type FlowAtlasState } from './flow';
import { compareHash } from '../compare';
import { lensHash } from '../lens';
import { pathHash } from '../path';
import {
  CAMERA_ZOOM_STEP,
  cameraMarkerDimensions,
  clampCamera,
  fitCamera,
  panBy,
  zoomAt,
  type Camera,
  type Point,
  type Rect,
} from './camera';
import { connectionAttention } from './connections';

let preservedCamera: Camera | undefined;

export type AtlasDepth = 1 | 2 | 'all';

export interface AtlasState {
  communities?: boolean;
  focus?: string;
  depth?: AtlasDepth;
  layout?: 'bridges' | 'flow';
  group?: FlowAtlasState['group'];
  mode?: BridgeAtlasState['mode'];
  bridge?: string;
  filters?: BridgeAtlasState['filters'];
}

export function atlasHash(state: AtlasState = {}): string {
  const params = new URLSearchParams();
  if (state.communities) params.set('communities', '1');
  if (state.focus) {
    params.set('focus', state.focus);
    params.set('depth', String(state.depth ?? 1));
  }
  const query = params.toString();
  return query ? `#/atlas?${query}` : '#/atlas';
}

function radius(degree: number): number {
  return Math.min(9, 3.4 + 1.1 * Math.sqrt(degree));
}

interface Placed {
  node: GraphNode;
  x: number;
  y: number;
  r: number;
}

function claimSection(
  atlas: Atlas,
  title: string,
  edges: GraphEdge[],
  from?: string,
): HTMLElement | null {
  if (edges.length === 0) return null;
  return h(
    'section',
    { class: 'atlas-claim-group' },
    h('h3', {}, `${title} (${String(edges.length)})`),
    h(
      'ul',
      { class: 'connection-list compact' },
      edges.map((edge) => edgeClaim(atlas, edge, { ...(from ? { from } : {}), notes: false })),
    ),
  );
}

function inspectionPanel(
  atlas: Atlas,
  node: GraphNode,
  edges: GraphEdge[],
  overflow: GraphNode[],
  state: Required<Pick<AtlasState, 'communities' | 'focus' | 'depth'>>,
): HTMLElement {
  const directedOut = edges.filter((edge) => !edge.symmetric && edge.from === node.slug);
  const directedIn = edges.filter((edge) => !edge.symmetric && edge.to === node.slug);
  const undirected = edges.filter(
    (edge) => edge.symmetric && (edge.from === node.slug || edge.to === node.slug),
  );
  const between = edges.filter((edge) => edge.from !== node.slug && edge.to !== node.slug);
  const fieldLabels = node.fields.map((field) => atlas.fieldLabel(field));

  return h(
    'aside',
    {
      class: 'atlas-inspector',
      'aria-labelledby': 'atlas-inspector-title',
      tabindex: '-1',
    },
    h(
      'header',
      { class: 'atlas-inspector-head' },
      h('p', { class: 'eyebrow' }, 'Inspect concept'),
      h('h2', { id: 'atlas-inspector-title' }, node.canonical_name),
      h(
        'a',
        {
          class: 'atlas-inspector-close',
          href: atlasHash({ communities: state.communities }),
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
      fieldLabels.length > 0 ? fieldLabels.join(' · ') : 'not assigned',
    ),
    h(
      'nav',
      { class: 'atlas-actions', 'aria-label': `Actions for ${node.canonical_name}` },
      h('a', { class: 'atlas-action primary', href: `#/c/${node.slug}` }, 'Open concept'),
      h('a', { class: 'atlas-action', href: pathHash(node.slug) }, 'Find path'),
      h('a', { class: 'atlas-action', href: compareHash(node.slug) }, 'Compare'),
    ),
    overflow.length > 0 &&
      h(
        'p',
        { class: 'atlas-overflow section-hint', role: 'status' },
        `${String(overflow.length)} additional concept${overflow.length === 1 ? '' : 's'} omitted by the ` +
          `${String(EGO_NODE_CAP)}-node readability cap.`,
      ),
    h(
      'div',
      { class: 'atlas-claims' },
      h('h2', { class: 'atlas-claims-title' }, 'Visible relationships'),
      h(
        'p',
        { class: 'section-hint' },
        'Every line currently drawn is repeated here as a typed claim with its strength and evidence.',
      ),
      claimSection(atlas, 'Outgoing claims', directedOut, node.slug),
      claimSection(atlas, 'Incoming claims', directedIn, node.slug),
      claimSection(atlas, 'Undirected claims', undirected, node.slug),
      claimSection(atlas, 'Relationships among neighbors', between),
      edges.length === 0 && h('p', { class: 'empty-state' }, 'No trusted claims are visible.'),
    ),
  );
}

export function atlasView(atlas: Atlas, initial: AtlasState): View {
  if (initial.layout === 'bridges') {
    return bridgeAtlasView(atlas, {
      layout: 'bridges',
      mode: initial.mode,
      bridge: initial.bridge,
      filters: initial.filters,
    });
  }
  if (initial.layout === 'flow') {
    return flowAtlasView(atlas, {
      layout: 'flow',
      focus: initial.focus,
      depth: initial.depth,
      group: initial.group,
    });
  }
  const layout = atlas.layout;
  const focus = initial.focus && layout[initial.focus] ? initial.focus : undefined;
  const depth: AtlasDepth = focus ? (initial.depth ?? 1) : 'all';
  let communities = initial.communities ?? false;

  const placed: Placed[] = atlas.nodes
    .filter((node) => layout[node.slug] !== undefined)
    .map((node) => {
      const [x, y] = layout[node.slug]!;
      return { node, x, y, r: radius(atlas.nodeMetrics(node.slug)?.degree ?? 0) };
    });
  const bySlug = new Map(placed.map((point) => [point.node.slug, point]));
  const outside = atlas.nodes
    .filter((node) => layout[node.slug] === undefined)
    .sort((a, b) => a.canonical_name.localeCompare(b.canonical_name));
  const trusted = atlas.edges.filter(
    (edge) => (atlas.strength(edge.strength)?.rank ?? 99) <= atlas.trustedRank,
  );
  const neighborhood = focus && depth !== 'all' ? trustedEgoNetwork(atlas, focus, depth) : null;
  const visibleEdges = neighborhood?.edges ?? trusted;
  const activeSlugs = new Set(
    neighborhood
      ? neighborhood.nodes.map((node) => node.slug)
      : placed.map((point) => point.node.slug),
  );

  const xs = placed.map((point) => point.x);
  const ys = placed.map((point) => point.y);
  const pad = 28;
  const [minX, minY] = [Math.min(...xs, 0) - pad, Math.min(...ys, 0) - pad];
  const [width, height] = [Math.max(...xs, 1) + pad - minX, Math.max(...ys, 1) + pad - minY];
  const cameraRect: Rect = { x: minX, y: minY, width, height };
  const fittedCamera = fitCamera(cameraRect, cameraRect);
  let camera = clampCamera(preservedCamera ?? fittedCamera, cameraRect, cameraRect);
  let cameraLayer: SVGGElement | null = null;
  let cameraSvg: SVGSVGElement | null = null;
  const figureHost = h('div', { class: 'atlas-figure' });
  const cameraStatus = h('span', {
    class: 'atlas-camera-status',
    role: 'status',
    'aria-live': 'polite',
    'aria-atomic': 'true',
  });

  const cameraDescription = (): string =>
    `${String(Math.round(camera.scale * 100))}% zoom${
      focus ? `, focused on ${atlas.node(focus)!.canonical_name}` : ''
    }`;

  const applyCamera = (next: Camera): void => {
    camera = clampCamera(next, cameraRect, cameraRect);
    preservedCamera = { ...camera };
    cameraLayer?.setAttribute(
      'transform',
      `translate(${camera.x.toFixed(3)} ${camera.y.toFixed(3)}) scale(${camera.scale.toFixed(4)})`,
    );
    cameraSvg?.setAttribute('data-camera-x', camera.x.toFixed(3));
    cameraSvg?.setAttribute('data-camera-y', camera.y.toFixed(3));
    cameraSvg?.setAttribute('data-camera-scale', camera.scale.toFixed(4));
    cameraSvg?.querySelectorAll<SVGMarkerElement>('.graph-arrow').forEach((marker) => {
      const markerSize = cameraMarkerDimensions(camera.scale, {
        width: Number(marker.getAttribute('data-base-width')) || 10,
        height: Number(marker.getAttribute('data-base-height')) || 8,
      });
      marker.setAttribute('markerWidth', markerSize.width.toFixed(4));
      marker.setAttribute('markerHeight', markerSize.height.toFixed(4));
    });
    cameraStatus.textContent = cameraDescription();
  };

  const zoomFromCenter = (factor: number): void => {
    applyCamera(
      zoomAt(
        camera,
        camera.scale * factor,
        { x: minX + width / 2, y: minY + height / 2 },
        cameraRect,
        cameraRect,
      ),
    );
  };

  const fit = (): void => {
    applyCamera(fittedCamera);
  };

  const colorToken = (node: GraphNode): string => {
    if (!communities) return atlas.nodeType(node.node_type)?.color_token ?? 'ink-muted';
    const community = atlas.nodeMetrics(node.slug)?.community ?? null;
    return community === null ? 'ink-faint' : communityToken(community);
  };

  const legend = (): HTMLElement => {
    const items: Child[] = communities
      ? Array.from({ length: atlas.metrics.community_count }, (_, community) => [
          communityChip(community),
          ' ',
        ]).flat()
      : atlas.schema.node_types
          .filter((type) => placed.some((point) => point.node.node_type === type.id))
          .flatMap((type) => [
            h(
              'span',
              { class: 'chip community-chip', style: `--accent: var(--${type.color_token})` },
              type.label,
            ),
            ' ',
          ]);
    return h(
      'p',
      { class: 'community-legend section-hint' },
      communities ? 'Color: trusted-subgraph community — ' : 'Color: concept kind — ',
      items,
    );
  };

  const render = (): void => {
    replaceHash(atlasHash({ communities, ...(focus ? { focus, depth } : {}) }));
    const svg = svgEl('svg', {
      viewBox: `${String(minX)} ${String(minY)} ${String(width)} ${String(height)}`,
      role: 'group',
      'aria-label': focus
        ? `Atlas focused on ${atlas.node(focus)!.canonical_name}, ${String(depth)} hop view`
        : 'The atlas constellation: every trusted-strength concept and claim',
      class: 'graph-svg atlas-svg',
      tabindex: '0',
    });
    cameraSvg = svg;
    cameraLayer = svgEl('g', { class: 'atlas-camera' });

    const svgPoint = (clientX: number, clientY: number): Point => {
      const matrix = svg.getScreenCTM();
      if (!matrix) return { x: minX + width / 2, y: minY + height / 2 };
      const point = svg.createSVGPoint();
      point.x = clientX;
      point.y = clientY;
      const transformed = point.matrixTransform(matrix.inverse());
      return { x: transformed.x, y: transformed.y };
    };

    svg.addEventListener(
      'wheel',
      (event) => {
        event.preventDefault();
        const factor = Math.exp(-event.deltaY * 0.002);
        applyCamera(
          zoomAt(
            camera,
            camera.scale * factor,
            svgPoint(event.clientX, event.clientY),
            cameraRect,
            cameraRect,
          ),
        );
      },
      { passive: false },
    );

    let gesture:
      | {
          pointerId: number;
          clientX: number;
          clientY: number;
          point: Point;
          camera: Camera;
          pan: boolean;
          moved: boolean;
        }
      | undefined;
    let suppressClick = false;
    const endGesture = (cancel: boolean): void => {
      if (!gesture) return;
      if (cancel && gesture.pan && gesture.moved) applyCamera(gesture.camera);
      if (svg.hasPointerCapture(gesture.pointerId)) svg.releasePointerCapture(gesture.pointerId);
      svg.classList.remove('is-panning');
      gesture = undefined;
    };
    svg.addEventListener('pointerdown', (event) => {
      if (event.button !== 0 || !event.isPrimary) return;
      const pan = event.target === svg;
      gesture = {
        pointerId: event.pointerId,
        clientX: event.clientX,
        clientY: event.clientY,
        point: svgPoint(event.clientX, event.clientY),
        camera: { ...camera },
        pan,
        moved: false,
      };
      if (pan) {
        svg.setPointerCapture(event.pointerId);
        svg.focus({ preventScroll: true });
        event.preventDefault();
      }
    });
    svg.addEventListener('pointermove', (event) => {
      if (!gesture || event.pointerId !== gesture.pointerId) return;
      const distance = Math.hypot(event.clientX - gesture.clientX, event.clientY - gesture.clientY);
      gesture.moved ||= distance >= 4;
      if (!gesture.pan || !gesture.moved) return;
      const point = svgPoint(event.clientX, event.clientY);
      svg.classList.add('is-panning');
      applyCamera(
        panBy(
          gesture.camera,
          { x: point.x - gesture.point.x, y: point.y - gesture.point.y },
          cameraRect,
          cameraRect,
        ),
      );
      event.preventDefault();
    });
    svg.addEventListener('pointerup', (event) => {
      if (!gesture || event.pointerId !== gesture.pointerId) return;
      suppressClick = gesture.moved;
      endGesture(false);
      window.setTimeout(() => {
        suppressClick = false;
      }, 0);
    });
    svg.addEventListener('pointercancel', () => endGesture(true));
    svg.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && gesture) {
        event.preventDefault();
        endGesture(true);
      }
    });
    svg.addEventListener(
      'click',
      (event) => {
        if (!suppressClick) return;
        suppressClick = false;
        event.preventDefault();
        event.stopPropagation();
      },
      { capture: true },
    );

    const caption = h('figcaption', { class: 'graph-caption', 'aria-live': 'polite' });
    const idleCaption = focus
      ? 'Focused trusted relationships are drawn. Context concepts remain faintly visible.'
      : 'Point at or tab to a concept for its summary, or a line for its claim.';
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

    if (visibleEdges.some((edge) => !edge.symmetric)) svg.appendChild(arrowDefs());
    const pairKey = (edge: GraphEdge): string => [edge.from, edge.to].sort().join('|');
    const pairCounts = new Map<string, number>();
    for (const edge of visibleEdges)
      pairCounts.set(pairKey(edge), (pairCounts.get(pairKey(edge)) ?? 0) + 1);
    const pairSeen = new Map<string, number>();
    const edgeLayer = svgEl('g', { class: 'graph-edges' });
    for (const edge of visibleEdges) {
      const a = bySlug.get(edge.from);
      const b = bySlug.get(edge.to);
      if (!a || !b) continue;
      const key = pairKey(edge);
      const sequence = pairSeen.get(key) ?? 0;
      pairSeen.set(key, sequence + 1);
      const bow = (sequence - (pairCounts.get(key)! - 1) / 2) * 18;
      const [x1, y1] = [a.x, a.y];
      let [x2, y2] = [b.x, b.y];
      const [middleX, middleY] = [(x1 + x2) / 2, (y1 + y2) / 2];
      const length = Math.hypot(x2 - x1, y2 - y1) || 1;
      const [controlX, controlY] = [
        middleX + (-(y2 - y1) / length) * bow,
        middleY + ((x2 - x1) / length) * bow,
      ];
      if (!edge.symmetric) {
        const clear = b.r + 2;
        const [targetX, targetY] = bow === 0 ? [x1, y1] : [controlX, controlY];
        const tangent = Math.hypot(x2 - targetX, y2 - targetY) || 1;
        x2 -= ((x2 - targetX) / tangent) * clear;
        y2 -= ((y2 - targetY) / tangent) * clear;
      }
      const path =
        bow === 0
          ? `M ${x1.toFixed(1)} ${y1.toFixed(1)} L ${x2.toFixed(1)} ${y2.toFixed(1)}`
          : `M ${x1.toFixed(1)} ${y1.toFixed(1)} Q ${controlX.toFixed(1)} ${controlY.toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}`;
      const strength = atlas.strength(edge.strength);
      const sentence = edgeSentenceText(atlas, edge);
      const attention = connectionAttention(edge, focus);
      const group = svgEl('g', {
        class: `graph-edge line-${strength?.line ?? 'solid'} emph-${strength?.emphasis ?? 'medium'} attention-${attention}`,
        tabindex: '0',
        role: 'img',
        'aria-label': sentence,
        'data-edge': `${edge.from}|${edge.to}|${edge.type}`,
        'data-attention': attention,
      });
      group.appendChild(svgEl('path', { class: 'edge-hit', d: path }));
      group.appendChild(
        svgEl('path', { class: `edge-line${edge.symmetric ? '' : ' directed'}`, d: path }),
      );
      wire(group, sentence);
      edgeLayer.appendChild(group);
    }
    cameraLayer.appendChild(edgeLayer);

    const nodeLayer = svgEl('g', { class: 'graph-nodes' });
    for (const point of placed) {
      const isFocus = point.node.slug === focus;
      const contextual = Boolean(focus) && !activeSlugs.has(point.node.slug);
      const anchor = svgEl('a', {
        href: atlasHash({ communities, focus: point.node.slug, depth: 1 }),
        class: `graph-node atlas-node${isFocus ? ' focus-node' : ''}${contextual ? ' context-node' : ''}`,
        style: `--accent: var(--${colorToken(point.node)})`,
        transform: `translate(${point.x.toFixed(1)}, ${point.y.toFixed(1)})`,
        'data-slug': point.node.slug,
        ...(isFocus ? { 'aria-current': 'location' } : {}),
      });
      if (isFocus)
        anchor.appendChild(svgEl('circle', { class: 'atlas-ring', r: (point.r + 4.5).toFixed(1) }));
      anchor.appendChild(svgEl('circle', { r: point.r.toFixed(1) }));
      const label = svgEl('text', {
        class: 'graph-label atlas-label',
        y: (point.r + 12).toFixed(1),
      });
      label.textContent = shortLabel(point.node.canonical_name);
      anchor.appendChild(label);
      const title = svgEl('title');
      title.textContent = point.node.canonical_name;
      anchor.appendChild(title);
      wire(anchor, `${point.node.canonical_name} — ${point.node.summary.trim()}`);
      nodeLayer.appendChild(anchor);
    }
    cameraLayer.appendChild(nodeLayer);
    svg.appendChild(cameraLayer);
    applyCamera(camera);
    figureHost.replaceChildren(
      h('figure', { class: 'graph-view graph-atlas' }, svg, caption),
      legend(),
    );
  };

  const communityToggle = h('input', {
    class: 'lens-communities',
    type: 'checkbox',
    ...(communities ? { checked: true } : {}),
  });
  communityToggle.addEventListener('change', () => {
    communities = communityToggle.checked;
    window.location.hash = atlasHash({ communities, ...(focus ? { focus, depth } : {}) });
  });

  const depthLink = (value: AtlasDepth, label: string): HTMLElement =>
    h(
      'a',
      {
        class: 'atlas-depth',
        href: focus ? atlasHash({ communities, focus, depth: value }) : '#/atlas',
        ...(focus && depth === value ? { 'aria-current': 'page' } : {}),
        ...(!focus ? { 'aria-disabled': 'true', tabindex: '-1' } : {}),
      },
      label,
    );

  const cameraButton = (label: string, text: string, action: () => void): HTMLElement => {
    const button = h('button', {
      class: 'atlas-camera-button',
      type: 'button',
      'aria-label': label,
      title: label,
    });
    button.textContent = text;
    button.addEventListener('click', action);
    return button;
  };

  render();
  const floor = atlas.schema.analysis.trusted_min_strength;
  const panel = focus
    ? inspectionPanel(atlas, atlas.node(focus)!, visibleEdges, neighborhood?.overflow ?? [], {
        communities,
        focus,
        depth,
      })
    : null;
  const details = h(
    'details',
    { class: 'atlas-info' },
    h('summary', {}, 'About this view and concepts outside it'),
    h(
      'p',
      { class: 'section-hint' },
      `${String(placed.length)} of ${String(atlas.nodes.length)} concepts have fixed positions; ` +
        `${String(trusted.length)} claims meet the ${floor.replace(/-/g, ' ')} trusted floor. `,
      'The complete trusted graph is also available ',
      h('a', { href: lensHash({ strength: floor }) }, 'as readable sentences'),
      '.',
    ),
    outside.length > 0 &&
      h(
        'p',
        { class: 'section-hint atlas-outside' },
        'Outside the constellation — connected only by weaker claims so far: ',
        joinChildren(
          outside.map((node) =>
            h('a', { href: `#/c/${node.slug}`, class: 'node-link' }, node.canonical_name),
          ),
          ' · ',
        ),
        '.',
      ),
    h(
      'p',
      { class: 'section-hint atlas-degradation' },
      'Scale note: community aggregation is the next overview stage. It will summarize only actual trusted claims and expose every underlying connection.',
    ),
  );

  const toolbar = h(
    'div',
    { class: 'atlas-toolbar', role: 'toolbar', 'aria-label': 'Atlas controls' },
    h(
      'span',
      { class: 'atlas-toolbar-context' },
      focus ? `Focused: ${atlas.node(focus)!.canonical_name}` : 'Overview: all trusted concepts',
    ),
    h(
      'span',
      { class: 'atlas-depths', role: 'group', 'aria-label': 'Neighborhood depth' },
      depthLink(1, '1 hop'),
      depthLink(2, '2 hop'),
      depthLink('all', 'All'),
    ),
    h(
      'span',
      { class: 'atlas-camera-controls', role: 'group', 'aria-label': 'Camera controls' },
      cameraButton('Zoom out', '−', () => zoomFromCenter(1 / CAMERA_ZOOM_STEP)),
      cameraButton('Zoom in', '+', () => zoomFromCenter(CAMERA_ZOOM_STEP)),
      cameraButton('Fit constellation', 'Fit', fit),
    ),
    cameraStatus,
    h('label', { class: 'atlas-color-mode' }, h('span', {}, 'Color by community'), communityToggle),
    h(
      'a',
      { class: 'atlas-tool-link atlas-layout-link', href: '#/atlas?layout=bridges' },
      'Bridge overview',
    ),
    h(
      'a',
      { class: 'atlas-tool-link atlas-layout-link', href: '#/atlas?layout=flow' },
      'Structure to Use',
    ),
    h('a', { class: 'atlas-tool-link', href: '#/lens' }, 'Filters'),
    h('a', { class: 'atlas-tool-link', href: '#/atlas' }, 'Reset'),
  );

  const el = h(
    'div',
    { class: 'atlas-overview content wide' },
    h(
      'header',
      { class: 'atlas-titlebar' },
      h('h1', {}, 'Atlas'),
      h('p', {}, 'A fixed map with a trusted neighborhood as the active reading layer.'),
    ),
    toolbar,
    h('div', { class: `atlas-workspace${panel ? ' has-inspector' : ''}` }, figureHost, panel),
    details,
  );

  return { title: focus ? `Atlas: ${atlas.node(focus)!.canonical_name}` : 'Atlas', el };
}
