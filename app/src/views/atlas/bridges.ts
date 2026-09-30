import type { Atlas } from '../../data/atlas';
import type { LensFilters } from '../../data/subgraph';
import type { BridgeAtlasBridge, BridgeAtlasCommunity, GraphEdge } from '../../data/types';
import { replaceHash } from '../../shell/router';
import { h } from '../common/dom';
import { edgeClaim } from '../common/edge-claim';
import type { View } from '../common/view';
import { matrixHash } from '../matrix';

export type BridgeMode = 'bridges' | 'frontiers';

export interface BridgeAtlasState {
  layout: 'bridges';
  mode?: BridgeMode;
  bridge?: string;
  filters?: LensFilters;
}

export interface VisibleBridge {
  key: string;
  source: number;
  target: number;
  edges: GraphEdge[];
  edgeIndexes: number[];
  globalFrontier: boolean;
}

let restoreBridgeFocus: string | undefined;

export function bridgeAtlasHash(state: BridgeAtlasState): string {
  const params = new URLSearchParams([['layout', 'bridges']]);
  if ((state.mode ?? 'bridges') === 'frontiers') params.set('mode', 'frontiers');
  if (state.bridge) params.set('bridge', state.bridge);
  const filters = state.filters ?? {};
  if (filters.type) params.set('type', filters.type);
  if (filters.field) params.set('field', filters.field);
  if (filters.edge) params.set('edge', filters.edge);
  if (filters.strength) params.set('strength', filters.strength);
  return `#/atlas?${params.toString()}`;
}

function pairKey(a: number, b: number): string {
  return `${String(Math.min(a, b))}-${String(Math.max(a, b))}`;
}

function passes(atlas: Atlas, edge: GraphEdge, filters: LensFilters): boolean {
  if (filters.edge && edge.type !== filters.edge) return false;
  if (
    filters.strength &&
    (atlas.strength(edge.strength)?.rank ?? 99) > (atlas.strength(filters.strength)?.rank ?? 0)
  )
    return false;
  if (filters.type || filters.field) {
    const nodePasses = (slug: string): boolean => {
      const node = atlas.node(slug);
      if (!node) return false;
      if (filters.type && node.node_type !== filters.type) return false;
      if (filters.field && !node.fields.includes(filters.field)) return false;
      return true;
    };
    if (!nodePasses(edge.from) && !nodePasses(edge.to)) return false;
  }
  return true;
}

export function visibleBridgePairs(atlas: Atlas, filters: LensFilters): VisibleBridge[] {
  const byKey = new Map<string, { aggregate: BridgeAtlasBridge; indexes: number[] }>();
  for (const aggregate of atlas.bridgeAtlas.bridges) {
    const indexes = aggregate.edge_indexes.filter((index) =>
      passes(atlas, atlas.edges[index]!, filters),
    );
    byKey.set(pairKey(aggregate.source_community, aggregate.target_community), {
      aggregate,
      indexes,
    });
  }
  const result: VisibleBridge[] = [];
  const global = new Set(
    atlas.bridgeAtlas.frontiers.map((f) => pairKey(f.source_community, f.target_community)),
  );
  const communities = atlas.bridgeAtlas.communities;
  for (let i = 0; i < communities.length; i++) {
    for (let j = i + 1; j < communities.length; j++) {
      const source = communities[i]!.id;
      const target = communities[j]!.id;
      const key = pairKey(source, target);
      const indexes = byKey.get(key)?.indexes ?? [];
      result.push({
        key,
        source,
        target,
        edges: indexes.map((index) => atlas.edges[index]!),
        edgeIndexes: indexes,
        globalFrontier: global.has(key),
      });
    }
  }
  return result;
}

function bundle(atlas: Atlas, community: BridgeAtlasCommunity): string {
  return community.landmark_slugs
    .map((slug) => atlas.node(slug)?.canonical_name ?? slug)
    .join(' · ');
}

function mapLabel(text: string): string {
  return text.length > 24 ? `${text.slice(0, 22)}…` : text;
}

function width(count: number): number {
  return 1 + 2 * Math.log2(1 + count);
}

function distribution(atlas: Atlas, edges: GraphEdge[], key: 'type' | 'strength'): string {
  const counts = new Map<string, number>();
  for (const edge of edges) counts.set(edge[key], (counts.get(edge[key]) ?? 0) + 1);
  return [...counts.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([id, count]) => {
      const label = key === 'type' ? (atlas.edgeType(id)?.label ?? id) : id.replace(/-/g, ' ');
      return `${label}: ${String(count)}`;
    })
    .join(' · ');
}

function claimsByDirection(atlas: Atlas, pair: VisibleBridge): HTMLElement[] {
  const groups = [
    {
      title: `Community ${String(pair.source)} → Community ${String(pair.target)}`,
      edges: pair.edges.filter(
        (edge) => !edge.symmetric && atlas.nodeMetrics(edge.from)?.community === pair.source,
      ),
    },
    {
      title: `Community ${String(pair.target)} → Community ${String(pair.source)}`,
      edges: pair.edges.filter(
        (edge) => !edge.symmetric && atlas.nodeMetrics(edge.from)?.community === pair.target,
      ),
    },
    { title: 'Symmetric claims', edges: pair.edges.filter((edge) => edge.symmetric) },
  ];
  return groups
    .filter((group) => group.edges.length > 0)
    .map((group) =>
      h(
        'section',
        { class: 'bridge-claim-group' },
        h('h3', {}, `${group.title} (${String(group.edges.length)})`),
        h(
          'ul',
          { class: 'connection-list compact' },
          group.edges.map((edge) => edgeClaim(atlas, edge)),
        ),
      ),
    );
}

function inspector(
  atlas: Atlas,
  pair: VisibleBridge,
  communities: Map<number, BridgeAtlasCommunity>,
  state: BridgeAtlasState,
): HTMLElement {
  const source = communities.get(pair.source)!;
  const target = communities.get(pair.target)!;
  const filteredAbsence = pair.edges.length === 0 && !pair.globalFrontier;
  const closeState = { ...state, bridge: undefined };
  const representative = pair.edges[0];
  return h(
    'aside',
    { class: 'bridge-inspector', 'aria-labelledby': 'bridge-inspector-title', tabindex: '-1' },
    h('p', { class: 'eyebrow' }, pair.edges.length > 0 ? 'Known bridge' : 'Frontier'),
    h(
      'h2',
      { id: 'bridge-inspector-title' },
      `${bundle(atlas, source)} ↔ ${bundle(atlas, target)}`,
    ),
    h(
      'a',
      {
        class: 'atlas-inspector-close',
        href: bridgeAtlasHash(closeState),
        'aria-label': 'Close bridge inspection',
      },
      '×',
    ),
    pair.edges.length > 0
      ? h(
          'div',
          {},
          h(
            'p',
            { class: 'bridge-exact-count', 'aria-live': 'polite' },
            `${String(pair.edges.length)} trusted claim${pair.edges.length === 1 ? '' : 's'}`,
          ),
          h('p', {}, h('strong', {}, 'Types: '), distribution(atlas, pair.edges, 'type')),
          h('p', {}, h('strong', {}, 'Strengths: '), distribution(atlas, pair.edges, 'strength')),
          h(
            'p',
            { class: 'section-hint' },
            'This aggregate has no single direction or epistemic strength. Every underlying claim is listed below.',
          ),
          claimsByDirection(atlas, pair),
        )
      : h(
          'div',
          { class: 'bridge-frontier-note' },
          h(
            'p',
            { class: 'bridge-exact-count', 'aria-live': 'polite' },
            filteredAbsence
              ? 'No visible trusted edge under these filters.'
              : 'No trusted edge recorded in this dataset.',
          ),
          h(
            'p',
            {},
            'This absence is not evidence that the communities are unrelated, and it does not propose a mathematical claim.',
          ),
        ),
    h(
      'nav',
      { class: 'atlas-actions', 'aria-label': 'Inspect this community pair elsewhere' },
      h(
        'a',
        {
          class: 'atlas-action primary',
          href: matrixHash({
            filters: state.filters ?? {},
            order: 'community',
            ...(representative ? { a: representative.from, b: representative.to } : {}),
          }),
        },
        'Audit in matrix',
      ),
      h(
        'a',
        { class: 'atlas-action', href: `#/queue?bridge=${pair.key}` },
        'Inspect curation queue',
      ),
      representative &&
        h(
          'a',
          { class: 'atlas-action', href: `#/atlas?focus=${representative.from}&depth=1` },
          'Focus an endpoint',
        ),
    ),
  );
}

function option(value: string, label: string, selected: boolean): HTMLOptionElement {
  return h('option', { value, selected }, label);
}

function filterControls(atlas: Atlas, state: BridgeAtlasState): HTMLElement {
  const filters = state.filters ?? {};
  const control = (
    label: string,
    key: keyof LensFilters,
    values: { id: string; label: string }[],
  ): HTMLElement =>
    h(
      'label',
      {},
      label,
      h(
        'select',
        {
          'aria-label': label,
          onchange: ((event: Event) => {
            const value = (event.currentTarget as HTMLSelectElement).value;
            const next = { ...filters, [key]: value || undefined };
            location.hash = bridgeAtlasHash({ ...state, bridge: undefined, filters: next });
          }) as EventListener,
        },
        option('', 'Any', !filters[key]),
        values.map((value) => option(value.id, value.label, filters[key] === value.id)),
      ),
    );
  return h(
    'div',
    { class: 'bridge-filters', 'aria-label': 'Bridge claim filters' },
    control('Edge type', 'edge', atlas.schema.edge_types),
    control('Node type', 'type', atlas.schema.node_types),
    control('Field', 'field', atlas.schema.fields),
    control(
      'Minimum strength',
      'strength',
      atlas.schema.strengths.map((strength) => ({
        id: strength.id,
        label: strength.id.replace(/-/g, ' '),
      })),
    ),
  );
}

function svgMap(
  atlas: Atlas,
  visible: VisibleBridge[],
  communities: Map<number, BridgeAtlasCommunity>,
  selected?: string,
): SVGSVGElement {
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('class', 'bridge-map');
  svg.setAttribute('viewBox', '0 0 760 560');
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-labelledby', 'bridge-map-title bridge-map-desc');
  const title = document.createElementNS(ns, 'title');
  title.setAttribute('id', 'bridge-map-title');
  title.textContent = 'Bridge Atlas community overview';
  const desc = document.createElementNS(ns, 'desc');
  desc.setAttribute('id', 'bridge-map-desc');
  desc.textContent =
    'Territory area represents community member count. Neutral lines summarize recorded trusted claims. The tables below provide the complete non-spatial equivalent.';
  svg.append(title, desc);
  for (const pair of visible.filter((item) => item.edges.length > 0)) {
    const a = communities.get(pair.source)!.center;
    const b = communities.get(pair.target)!.center;
    const line = document.createElementNS(ns, 'line');
    line.setAttribute('x1', String(a[0]));
    line.setAttribute('y1', String(a[1]));
    line.setAttribute('x2', String(b[0]));
    line.setAttribute('y2', String(b[1]));
    line.setAttribute('class', `bridge-line${selected === pair.key ? ' selected' : ''}`);
    line.setAttribute('stroke-width', String(width(pair.edges.length)));
    line.setAttribute('aria-hidden', 'true');
    svg.append(line);
  }
  for (const community of communities.values()) {
    const path = document.createElementNS(ns, 'path');
    path.setAttribute('d', community.territory_path);
    path.setAttribute('class', `bridge-territory community-${String(community.id % 12)}`);
    path.setAttribute('aria-hidden', 'true');
    svg.append(path);
    const label = document.createElementNS(ns, 'text');
    label.setAttribute('x', String(community.center[0]));
    label.setAttribute('y', String(community.center[1]));
    label.setAttribute('class', 'bridge-territory-label');
    label.setAttribute('text-anchor', 'middle');
    label.setAttribute('aria-hidden', 'true');
    const first = document.createElementNS(ns, 'tspan');
    first.setAttribute('x', String(community.center[0]));
    first.textContent = `Community ${String(community.id + 1)}`;
    const second = document.createElementNS(ns, 'tspan');
    second.setAttribute('x', String(community.center[0]));
    second.setAttribute('dy', '1.3em');
    second.textContent = mapLabel(
      atlas.node(community.landmark_slugs[0]!)?.canonical_name ?? community.landmark_slugs[0]!,
    );
    const third = document.createElementNS(ns, 'tspan');
    third.setAttribute('x', String(community.center[0]));
    third.setAttribute('dy', '1.3em');
    third.textContent = `${String(community.member_count)} members`;
    label.append(first, second, third);
    svg.append(label);
  }
  return svg;
}

export function bridgeAtlasView(atlas: Atlas, initial: BridgeAtlasState): View {
  const filters = initial.filters ?? {};
  const state: BridgeAtlasState = { ...initial, mode: initial.mode ?? 'bridges', filters };
  const allPairs = visibleBridgePairs(atlas, filters);
  const communities = new Map(
    atlas.bridgeAtlas.communities.map((community) => [community.id, community]),
  );
  const shown = allPairs.filter((pair) =>
    state.mode === 'frontiers' ? pair.edges.length === 0 : pair.edges.length > 0,
  );
  const selected = state.bridge ? allPairs.find((pair) => pair.key === state.bridge) : undefined;
  const canonical = bridgeAtlasHash({ ...state, bridge: selected?.key });

  const pairButton = (pair: VisibleBridge): HTMLButtonElement =>
    h(
      'button',
      {
        class: 'bridge-pair-button',
        'data-bridge': pair.key,
        'aria-pressed': selected?.key === pair.key ? 'true' : 'false',
        onclick: (() => {
          location.hash = bridgeAtlasHash({ ...state, bridge: pair.key });
        }) as EventListener,
      },
      pair.edges.length > 0
        ? `${String(pair.edges.length)} trusted claim${pair.edges.length === 1 ? '' : 's'}`
        : 'Inspect absence',
    );

  const el = h(
    'article',
    { class: 'view bridge-atlas-view' },
    h(
      'header',
      { class: 'view-head' },
      h('p', { class: 'eyebrow' }, 'Migration overview'),
      h('h1', {}, 'Bridge Atlas'),
      h(
        'p',
        {},
        'Build-computed graph communities appear as territories. Bridges summarize only recorded trusted claims and always open into their exact claim list.',
      ),
    ),
    h(
      'div',
      { class: 'bridge-toolbar' },
      h(
        'nav',
        { class: 'bridge-layout-switch', 'aria-label': 'Atlas layout' },
        h('a', { href: '#/atlas' }, 'Concept map'),
        h('span', { 'aria-current': 'page' }, 'Bridge map'),
        h('a', { href: '#/atlas?layout=flow' }, 'Structure to Use'),
      ),
      h(
        'nav',
        { class: 'bridge-mode-switch', 'aria-label': 'Bridge Atlas mode' },
        h(
          'a',
          {
            href: bridgeAtlasHash({ ...state, mode: 'bridges', bridge: undefined }),
            'aria-current': state.mode === 'bridges' ? 'page' : 'false',
          },
          'Known bridges',
        ),
        h(
          'a',
          {
            href: bridgeAtlasHash({ ...state, mode: 'frontiers', bridge: undefined }),
            'aria-current': state.mode === 'frontiers' ? 'page' : 'false',
          },
          'Frontiers',
        ),
      ),
      filterControls(atlas, state),
    ),
    state.mode === 'frontiers' &&
      h(
        'p',
        { class: 'bridge-frontier-caption' },
        'A frontier means no trusted edge is represented in this dataset (or, under active filters, no trusted edge is visible). It is not evidence of a relationship or a proposal to add one.',
      ),
    h(
      'div',
      { class: `bridge-workspace${selected ? ' has-inspector' : ''}` },
      h(
        'section',
        { class: 'bridge-overview', 'aria-label': 'Bridge Atlas map and equivalents' },
        svgMap(atlas, shown, communities, selected?.key),
        h(
          'p',
          { class: 'bridge-legend' },
          'Territory area: member count · Bridge width: 1 + 2 × log₂(1 + visible trusted claims) · Neutral bridge style: mixed claim kinds',
        ),
        h('h2', {}, 'Communities'),
        h(
          'ol',
          { class: 'bridge-community-list' },
          atlas.bridgeAtlas.communities.map((community) =>
            h(
              'li',
              {},
              h('strong', {}, bundle(atlas, community)),
              ` — ${String(community.member_count)} members; ${String(community.internal_trusted_edge_count)} internal trusted claims`,
            ),
          ),
        ),
        h('h2', {}, state.mode === 'frontiers' ? 'Frontier pairs' : 'Known bridge pairs'),
        h(
          'table',
          { class: 'bridge-pair-table' },
          h(
            'thead',
            {},
            h(
              'tr',
              {},
              h('th', { scope: 'col' }, 'Communities'),
              h(
                'th',
                { scope: 'col' },
                state.mode === 'frontiers' ? 'Recorded crossing' : 'Visible trusted claims',
              ),
              h('th', { scope: 'col' }, 'Inspect'),
            ),
          ),
          h(
            'tbody',
            {},
            shown.map((pair) =>
              h(
                'tr',
                {},
                h(
                  'th',
                  { scope: 'row' },
                  `${bundle(atlas, communities.get(pair.source)!)} ↔ ${bundle(atlas, communities.get(pair.target)!)}`,
                ),
                h(
                  'td',
                  {},
                  pair.edges.length > 0
                    ? String(pair.edges.length)
                    : pair.globalFrontier
                      ? 'No trusted edge recorded'
                      : 'No visible trusted edge under these filters',
                ),
                h('td', {}, pairButton(pair)),
              ),
            ),
          ),
        ),
      ),
      selected && inspector(atlas, selected, communities, state),
    ),
  );

  return {
    title: 'Bridge Atlas',
    el,
    onMount: () => {
      if (location.hash !== canonical) replaceHash(canonical);
      if (restoreBridgeFocus) {
        el.querySelector<HTMLButtonElement>(`[data-bridge="${restoreBridgeFocus}"]`)?.focus();
        restoreBridgeFocus = undefined;
      }
      if (selected)
        el.querySelector<HTMLElement>('.bridge-inspector')?.focus({ preventScroll: true });
      el.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && selected) {
          restoreBridgeFocus = selected.key;
          location.hash = bridgeAtlasHash({ ...state, bridge: undefined });
        }
      });
    },
  };
}
