/**
 * The concept-page minimap (UI_REDESIGN.md §4.7, ROADMAP M14): "you are
 * here" — a small rendering of the same build-time constellation the atlas
 * view draws, with the current node ringed and its trusted neighbors
 * emphasized. Same data, zero extra computation, and it is one link: the
 * whole figure opens the atlas with this node focused. Nodes outside the
 * trusted subgraph have no position, so they get no minimap — absence is
 * information (the atlas view lists them as text).
 */
import type { Atlas } from '../../data/atlas';
import { svgEl } from '../../graph-render';
import { h } from '../common/dom';
import { atlasHash } from '../atlas';

export function conceptMinimap(atlas: Atlas, slug: string): HTMLElement | null {
  const layout = atlas.layout;
  const here = layout[slug];
  const node = atlas.node(slug);
  if (!here || !node) return null;

  const neighbors = new Set(
    node.connections
      .filter((c) => (atlas.strength(c.strength)?.rank ?? 99) <= atlas.trustedRank)
      .map((c) => c.other),
  );

  const points = Object.entries(layout);
  const xs = points.map(([, [x]]) => x);
  const ys = points.map(([, [, y]]) => y);
  const pad = 14;
  const [minX, minY] = [Math.min(...xs) - pad, Math.min(...ys) - pad];
  const [w, hgt] = [Math.max(...xs) + pad - minX, Math.max(...ys) + pad - minY];

  const svg = svgEl('svg', {
    viewBox: `${String(minX)} ${String(minY)} ${String(w)} ${String(hgt)}`,
    class: 'minimap-svg',
    'aria-hidden': 'true',
  });
  for (const [other, [x, y]] of points) {
    if (other === slug) continue;
    svg.appendChild(
      svgEl('circle', {
        class: neighbors.has(other) ? 'mini-neighbor' : 'mini-dot',
        cx: x.toFixed(1),
        cy: y.toFixed(1),
        r: neighbors.has(other) ? '5' : '3',
      }),
    );
  }
  svg.appendChild(
    svgEl('circle', {
      class: 'mini-ring',
      cx: here[0].toFixed(1),
      cy: here[1].toFixed(1),
      r: '11',
    }),
  );
  svg.appendChild(
    svgEl('circle', { class: 'mini-here', cx: here[0].toFixed(1), cy: here[1].toFixed(1), r: '6' }),
  );

  return h(
    'a',
    {
      class: 'concept-minimap',
      href: atlasHash({ focus: slug }),
      'aria-label': `You are here: ${node.canonical_name} in the atlas constellation — open the atlas`,
      title: 'Open the atlas with this concept ringed',
    },
    svg,
    h('span', { class: 'minimap-caption' }, 'you are here — the atlas'),
  );
}
