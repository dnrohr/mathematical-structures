/**
 * The badge fragments every view shares. Visual identity comes from the
 * semantic style module: node types point at their schema color token
 * (--nt-*), strengths at the line/emphasis grammar — strength is never
 * encoded by color (spec §4).
 */
import type { Atlas } from '../../data/atlas';
import { h } from './dom';

function pretty(id: string): string {
  return id.replace(/-/g, ' ');
}

export function typeBadge(atlas: Atlas, typeId: string): HTMLElement {
  const def = atlas.nodeType(typeId);
  return h(
    'span',
    {
      class: 'badge type-badge',
      style: `--accent: var(--${def?.color_token ?? 'ink-muted'})`,
      title: def?.description.trim() ?? '',
    },
    def?.label ?? typeId,
  );
}

/** Small colored marker for node links in lists; the label carries the info. */
export function typeDot(atlas: Atlas, typeId: string): HTMLElement {
  const def = atlas.nodeType(typeId);
  return h('span', {
    class: 'type-dot',
    style: `--accent: var(--${def?.color_token ?? 'ink-muted'})`,
    title: def?.label ?? typeId,
    'aria-hidden': 'true',
  });
}

/** Epistemic flag for non-established nodes; established stays quiet. */
export function statusBadge(atlas: Atlas, statusId: string): HTMLElement | null {
  if (statusId === 'established') return null;
  return h(
    'span',
    {
      class: `badge status-badge status-${statusId}`,
      title: atlas.nodeStatus(statusId)?.description ?? '',
    },
    pretty(statusId),
  );
}

export function strengthBadge(atlas: Atlas, strengthId: string): HTMLElement {
  const def = atlas.strength(strengthId);
  const grammar = def ? `line-${def.line} emph-${def.emphasis}` : '';
  return h(
    'span',
    { class: `strength ${grammar}`.trim(), title: def?.description ?? '' },
    pretty(strengthId),
  );
}

/** Research-gap workflow state on POSSIBLE-MISSING-MIGRATION edges. */
export function gapStatusChip(atlas: Atlas, statusId: string): HTMLElement {
  return h(
    'span',
    { class: 'chip gap-status', title: atlas.gapStatus(statusId)?.description ?? '' },
    pretty(statusId),
  );
}

/**
 * Style token for a trusted-subgraph community. Eight fixed, validated hues
 * in a fixed order; a ninth community would fold to neutral rather than
 * cycle (color follows the entity, and the label always carries the id).
 */
export function communityToken(community: number): string {
  return community < 8 ? `community-${String(community)}` : 'ink-faint';
}

/** Labeled marker for a trusted-subgraph community; null = outside it. */
export function communityChip(community: number | null): HTMLElement {
  if (community === null) {
    return h(
      'span',
      {
        class: 'chip community-chip community-none',
        title: 'No trusted-strength edge touches this concept',
      },
      'outside',
    );
  }
  return h(
    'span',
    {
      class: 'chip community-chip',
      style: `--accent: var(--${communityToken(community)})`,
      title: `Trusted-subgraph community C${String(community)}`,
    },
    `C${String(community)}`,
  );
}
