/**
 * A–Z index — the plain fallback when search isn't the right tool
 * (ROADMAP M3). Every node, alphabetical by canonical name, with its
 * dialect names inline for scanning.
 */
import type { Atlas } from '../../data/atlas';
import { h } from '../common/dom';
import { nodeLink } from '../common/node-link';
import type { View } from '../common/view';

export function atozView(atlas: Atlas): View {
  const sorted = [...atlas.nodes].sort((a, b) =>
    a.canonical_name.localeCompare(b.canonical_name, 'en', { sensitivity: 'base' }),
  );
  const groups = new Map<string, typeof sorted>();
  for (const node of sorted) {
    const letter = /^[a-z]/i.test(node.canonical_name)
      ? node.canonical_name.charAt(0).toUpperCase()
      : '#';
    if (!groups.has(letter)) groups.set(letter, []);
    groups.get(letter)!.push(node);
  }

  const el = h(
    'div',
    { class: 'atoz content' },
    h('header', { class: 'page-header' }, h('h1', {}, 'A–Z index')),
    h(
      'p',
      { class: 'tagline' },
      `Every concept in the atlas (${atlas.nodes.length}), with the names other fields use for it.`,
    ),
    [...groups.entries()].map(([letter, nodes]) =>
      h(
        'section',
        { class: 'atoz-group' },
        h('h2', {}, letter),
        h(
          'ul',
          { class: 'atoz-list' },
          nodes.map((node) =>
            h(
              'li',
              {},
              nodeLink(atlas, node.slug),
              node.aliases.length > 0 &&
                h(
                  'span',
                  { class: 'atoz-aliases' },
                  ` — ${node.aliases.map((a) => a.name).join('; ')}`,
                ),
            ),
          ),
        ),
      ),
    ),
  );

  return { title: 'A–Z index', el };
}
