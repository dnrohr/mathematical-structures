/**
 * The atlas overview (UI_REDESIGN.md §4.7, ROADMAP M14): the whole trusted
 * graph as a fixed constellation — the one full-graph rendering, and it is
 * allowed precisely because nothing here is computed client-side: the
 * coordinates are `metrics.layout`, laid out once at build time, identical
 * for every visitor, stable across sessions. No zoom, no pan, no physics.
 * Dots are colored by node type (or community, `communities=1`), sized
 * subtly by trusted degree; edges are the trusted claims in the standard
 * line grammar; click navigates. Nodes outside the trusted subgraph have no
 * position by construction and are listed as text — their absence from the
 * constellation is information, like an empty matrix cell.
 *
 * Degradation plan (documented here next to the view, per ROADMAP M14): the
 * constellation is legible to roughly a hundred trusted nodes. Beyond that
 * this view must switch to community aggregation — one dot per community,
 * sized by membership, expanding on interaction — rather than ever shipping
 * a hairball; the in-view note states the same plan to readers.
 */
import type { Atlas } from '../../data/atlas';
import type { GraphEdge, GraphNode } from '../../data/types';
import { arrowDefs, shortLabel, svgEl } from '../../graph-render';
import { replaceHash } from '../../shell/router';
import { communityChip, communityToken } from '../common/badges';
import { h, joinChildren } from '../common/dom';
import { edgeSentenceText } from '../common/edge-claim';
import { nodeLink } from '../common/node-link';
import type { View } from '../common/view';
import { lensHash } from '../lens';

export interface AtlasState {
  /** Color dots by trusted-subgraph community instead of node type. */
  communities?: boolean;
  /** Ring one concept — the situating deep-link (`focus=<slug>`). */
  focus?: string;
}

export function atlasHash(state: AtlasState = {}): string {
  const params = new URLSearchParams();
  if (state.communities) params.set('communities', '1');
  if (state.focus) params.set('focus', state.focus);
  const query = params.toString();
  return query ? `#/atlas?${query}` : '#/atlas';
}

/** Dot radius: subtle trusted-degree sizing, never a shout. */
function radius(degree: number): number {
  return Math.min(9, 3.4 + 1.1 * Math.sqrt(degree));
}

interface Placed {
  node: GraphNode;
  x: number;
  y: number;
  r: number;
}

export function atlasView(atlas: Atlas, initial: AtlasState): View {
  const layout = atlas.layout;
  const focus = initial.focus && layout[initial.focus] ? initial.focus : undefined;
  let communities = initial.communities ?? false;

  const placed: Placed[] = atlas.nodes
    .filter((n) => layout[n.slug] !== undefined)
    .map((node) => {
      const [x, y] = layout[node.slug]!;
      return { node, x, y, r: radius(atlas.nodeMetrics(node.slug)?.degree ?? 0) };
    });
  const bySlug = new Map(placed.map((p) => [p.node.slug, p]));
  const outside = atlas.nodes
    .filter((n) => layout[n.slug] === undefined)
    .sort((a, b) => a.canonical_name.localeCompare(b.canonical_name));
  const trusted = atlas.edges.filter(
    (e) => (atlas.strength(e.strength)?.rank ?? 99) <= atlas.trustedRank,
  );

  // The build fitted its own canvas; render whatever box the coordinates
  // span (the contract deliberately leaves the space arbitrary-but-fixed).
  const xs = placed.map((p) => p.x);
  const ys = placed.map((p) => p.y);
  const pad = 28;
  const [minX, minY] = [Math.min(...xs, 0) - pad, Math.min(...ys, 0) - pad];
  const [w, hgt] = [Math.max(...xs, 1) + pad - minX, Math.max(...ys, 1) + pad - minY];

  const figureHost = h('div', { class: 'atlas-figure' });

  const colorToken = (node: GraphNode): string => {
    if (!communities) return atlas.nodeType(node.node_type)?.color_token ?? 'ink-muted';
    const c = atlas.nodeMetrics(node.slug)?.community ?? null;
    return c === null ? 'ink-faint' : communityToken(c);
  };

  const communityLegend = (): HTMLElement => {
    const chips: (HTMLElement | string)[] = [];
    for (let c = 0; c < atlas.metrics.community_count; c++) chips.push(communityChip(c), ' ');
    return h(
      'p',
      { class: 'community-legend section-hint' },
      'Dots colored by trusted-subgraph community (see ',
      h('a', { href: '#/metrics' }, 'metrics'),
      '): ',
      ...chips,
    );
  };

  const typeLegend = (): HTMLElement =>
    h(
      'p',
      { class: 'community-legend section-hint' },
      'Dots colored by kind, sized by trusted degree: ',
      atlas.schema.node_types
        .filter((t) => placed.some((p) => p.node.node_type === t.id))
        .flatMap((t) => [
          h(
            'span',
            { class: 'chip community-chip', style: `--accent: var(--${t.color_token})` },
            t.label,
          ),
          ' ',
        ]),
    );

  const render = (): void => {
    replaceHash(atlasHash({ communities, ...(focus ? { focus } : {}) }));

    const svg = svgEl('svg', {
      viewBox: `${String(minX)} ${String(minY)} ${String(w)} ${String(hgt)}`,
      role: 'group',
      'aria-label': 'The atlas constellation: every trusted-strength concept and claim',
      class: 'graph-svg atlas-svg',
    });

    const caption = h('figcaption', {
      class: 'graph-caption',
      'aria-live': 'polite',
    });
    const idleCaption = 'Point at or tab to a dot for its summary, an edge for its claim.';
    caption.textContent = idleCaption;
    const show = (text: string) => (): void => {
      caption.textContent = text;
    };
    const hide = (): void => {
      caption.textContent = idleCaption;
    };
    const wire = (el: SVGElement, text: string): void => {
      el.addEventListener('mouseenter', show(text));
      el.addEventListener('mouseleave', hide);
      el.addEventListener('focus', show(text));
      el.addEventListener('blur', hide);
    };

    if (trusted.some((e) => !e.symmetric)) svg.appendChild(arrowDefs());

    // Parallel trusted edges bow apart exactly like the force presets.
    const pairKey = (e: GraphEdge): string => [e.from, e.to].sort().join('|');
    const pairCounts = new Map<string, number>();
    for (const e of trusted) pairCounts.set(pairKey(e), (pairCounts.get(pairKey(e)) ?? 0) + 1);
    const pairSeen = new Map<string, number>();

    const edgeLayer = svgEl('g', { class: 'graph-edges' });
    for (const edge of trusted) {
      const a = bySlug.get(edge.from);
      const b = bySlug.get(edge.to);
      if (!a || !b) continue; // unreachable: trusted endpoints are placed
      const seq = pairSeen.get(pairKey(edge)) ?? 0;
      pairSeen.set(pairKey(edge), seq + 1);
      const bow = (seq - (pairCounts.get(pairKey(edge))! - 1) / 2) * 18;
      const [x1, y1] = [a.x, a.y];
      let [x2, y2] = [b.x, b.y];
      const [mx, my] = [(x1 + x2) / 2, (y1 + y2) / 2];
      const len = Math.hypot(x2 - x1, y2 - y1) || 1;
      const [cx, cy] = [mx + (-(y2 - y1) / len) * bow, my + ((x2 - x1) / len) * bow];
      if (!edge.symmetric) {
        const clear = b.r + 2;
        const [tx, ty] = bow === 0 ? [x1, y1] : [cx, cy];
        const tangent = Math.hypot(x2 - tx, y2 - ty) || 1;
        x2 -= ((x2 - tx) / tangent) * clear;
        y2 -= ((y2 - ty) / tangent) * clear;
      }
      const d =
        bow === 0
          ? `M ${x1.toFixed(1)} ${y1.toFixed(1)} L ${x2.toFixed(1)} ${y2.toFixed(1)}`
          : `M ${x1.toFixed(1)} ${y1.toFixed(1)} Q ${cx.toFixed(1)} ${cy.toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}`;
      const strength = atlas.strength(edge.strength);
      const sentence = edgeSentenceText(atlas, edge);
      const group = svgEl('g', {
        class: `graph-edge line-${strength?.line ?? 'solid'} emph-${strength?.emphasis ?? 'medium'}`,
        tabindex: '0',
        role: 'img',
        'aria-label': sentence,
      });
      group.appendChild(svgEl('path', { class: 'edge-hit', d }));
      group.appendChild(
        svgEl('path', { class: `edge-line${edge.symmetric ? '' : ' directed'}`, d }),
      );
      wire(group, sentence);
      edgeLayer.appendChild(group);
    }
    svg.appendChild(edgeLayer);

    const nodeLayer = svgEl('g', { class: 'graph-nodes' });
    for (const p of placed) {
      const isFocus = p.node.slug === focus;
      const anchor = svgEl('a', {
        href: `#/c/${p.node.slug}`,
        class: `graph-node atlas-node${isFocus ? ' focus-node' : ''}`,
        style: `--accent: var(--${colorToken(p.node)})`,
        transform: `translate(${p.x.toFixed(1)}, ${p.y.toFixed(1)})`,
      });
      if (isFocus)
        anchor.appendChild(svgEl('circle', { class: 'atlas-ring', r: (p.r + 4.5).toFixed(1) }));
      anchor.appendChild(svgEl('circle', { r: p.r.toFixed(1) }));
      const label = svgEl('text', { class: 'graph-label atlas-label', y: (p.r + 12).toFixed(1) });
      label.textContent = shortLabel(p.node.canonical_name);
      anchor.appendChild(label);
      const title = svgEl('title');
      title.textContent = p.node.canonical_name;
      anchor.appendChild(title);
      wire(anchor, `${p.node.canonical_name} — ${p.node.summary.trim()}`);
      nodeLayer.appendChild(anchor);
    }
    svg.appendChild(nodeLayer);

    const figure = h('figure', { class: 'graph-view graph-atlas' });
    figure.appendChild(svg);
    figure.appendChild(caption);
    figureHost.replaceChildren(figure, communities ? communityLegend() : typeLegend());
  };

  const communityToggle = h('input', {
    class: 'lens-communities',
    type: 'checkbox',
    ...(communities ? { checked: true } : {}),
  });
  communityToggle.addEventListener('change', () => {
    communities = communityToggle.checked;
    render();
  });

  render();

  const floor = atlas.schema.analysis.trusted_min_strength;
  const el = h(
    'div',
    { class: 'atlas-overview content wide' },
    h('header', { class: 'page-header' }, h('h1', {}, 'Atlas')),
    h(
      'p',
      { class: 'tagline' },
      'The whole trusted graph, one fixed constellation — laid out once at build time, so it ' +
        'never moves under you and every visitor sees the same map. Click a dot to open its ' +
        'concept; the situating links on concept pages land here with the dot ringed.',
    ),
    h(
      'div',
      { class: 'lens-controls', role: 'group', 'aria-label': 'Atlas options' },
      h(
        'label',
        { class: 'lens-filter lens-toggle' },
        h('span', { class: 'lens-filter-label' }, 'Color by community'),
        communityToggle,
      ),
      focus &&
        h(
          'span',
          { class: 'lens-filter atlas-focus-note' },
          'Ringed: ',
          nodeLink(atlas, focus),
          ' ',
          h('a', { class: 'lens-clear', href: atlasHash({ communities }) }, 'clear'),
        ),
    ),
    figureHost,
    h(
      'p',
      { class: 'section-hint' },
      `${String(placed.length)} of ${String(atlas.nodes.length)} concepts hold a position — those with at ` +
        `least one claim at strength ${floor.replace(/-/g, ' ')} or stronger (${String(trusted.length)} claims drawn). `,
      'Every drawn claim is readable: ',
      h('a', { href: lensHash({ strength: floor }) }, 'the same subgraph as sentences'),
      '.',
    ),
    outside.length > 0 &&
      h(
        'p',
        { class: 'section-hint atlas-outside' },
        'Outside the constellation — connected only by analogies or hypotheses so far, which is ' +
          'information, not an omission: ',
        joinChildren(
          outside.map((n) => nodeLink(atlas, n.slug)),
          ' · ',
        ),
        '.',
      ),
    h(
      'p',
      { class: 'section-hint atlas-degradation' },
      'Scale note: this constellation stays legible to roughly a hundred trusted concepts. ' +
        'Beyond that the view switches to community aggregation — one dot per community, ' +
        'expanding on interaction — rather than ever shipping a hairball.',
    ),
  );

  return { title: 'Atlas', el };
}
