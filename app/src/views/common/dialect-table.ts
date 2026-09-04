import type { Atlas } from '../../data/atlas';
import type { GraphNode } from '../../data/types';
import { h } from './dom';

/**
 * The dialect table — a first-class feature, not metadata trivia (spec
 * §3.1): the same structure, as each field names it.
 */
export function dialectTable(atlas: Atlas, node: GraphNode): HTMLElement | null {
  if (node.aliases.length === 0) return null;
  return h(
    'table',
    { class: 'dialects' },
    h(
      'thead',
      {},
      h('tr', {}, h('th', { scope: 'col' }, 'Field'), h('th', { scope: 'col' }, 'Its name there')),
    ),
    h(
      'tbody',
      {},
      node.aliases.map((alias) =>
        h(
          'tr',
          {},
          h('th', { scope: 'row' }, atlas.fieldLabel(alias.field)),
          h('td', {}, alias.name),
        ),
      ),
    ),
  );
}
