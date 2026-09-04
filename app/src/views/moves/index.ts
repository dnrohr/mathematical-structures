/**
 * The moves index (spec §5.2): reusable moves are the pedagogical heart of
 * the app and get their own page. Each move links back to the symptoms
 * that call for it.
 */
import type { Atlas } from '../../data/atlas';
import { h, joinChildren } from '../common/dom';
import { nodeLink } from '../common/node-link';
import type { View } from '../common/view';

export function movesView(atlas: Atlas): View {
  const moves = atlas.nodesOfType('move');
  const moveType = atlas.nodeType('move');

  const el = h(
    'div',
    { class: 'moves content' },
    h('header', { class: 'page-header' }, h('h1', {}, 'Reusable moves')),
    h(
      'p',
      { class: 'tagline' },
      moveType
        ? moveType.description.trim()
        : 'Standard transformations of a hard problem into a more recognizable one.',
    ),
    h(
      'ul',
      { class: 'move-list' },
      moves.map((move) => {
        const symptoms = atlas.symptomsUsing(move.slug);
        return h(
          'li',
          { class: 'move-card' },
          h('h2', {}, nodeLink(atlas, move.slug)),
          h('p', { class: 'summary' }, move.summary),
          move.canonical_examples.length > 0 &&
            h(
              'ul',
              { class: 'example-list' },
              move.canonical_examples.map((ex) => h('li', {}, ex)),
            ),
          symptoms.length > 0 &&
            h(
              'p',
              { class: 'symptom-meta' },
              'Reach for it when: ',
              joinChildren(
                symptoms.map((s) => h('a', { href: `#/?s=${s.id}` }, s.symptom.toLowerCase())),
                ' · ',
              ),
            ),
        );
      }),
    ),
    h(
      'p',
      { class: 'section-hint' },
      'Several operations double as moves in practice — see ',
      h('a', { href: '#/' }, 'the full index'),
      ' for the operations and models these moves lead to.',
    ),
  );

  return { title: 'Reusable moves', el };
}
