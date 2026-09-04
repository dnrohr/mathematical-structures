import type { Atlas } from '../../data/atlas';
import { typeDot } from './badges';
import { h } from './dom';

/** Canonical link to a concept page, with its node-type marker. */
export function nodeLink(
  atlas: Atlas,
  slug: string,
  opts: { dot?: boolean; text?: string } = {},
): HTMLElement {
  const node = atlas.node(slug);
  if (!node) {
    // Unreachable for validated data; keep the page honest if it happens.
    return h('span', { class: 'missing-node', title: 'unknown slug' }, slug);
  }
  return h(
    'a',
    { class: 'node-link', href: `#/c/${slug}` },
    opts.dot !== false && typeDot(atlas, node.node_type),
    opts.text ?? node.canonical_name,
  );
}
