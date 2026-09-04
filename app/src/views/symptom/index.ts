/**
 * Symptom detail — the Problem-Solver's second step (ROADMAP M4, spec
 * §3.4): from "my problem looks like this" to ranked candidate moves, each
 * with a one-line why, the fields where the machinery is routine, and a
 * worked canonical example. Goal-directed: 2–4 clicks to an answer.
 */
import type { Atlas } from '../../data/atlas';
import type { GraphSymptom } from '../../data/types';
import { typeBadge } from '../common/badges';
import { h, joinChildren } from '../common/dom';
import { nodeLink } from '../common/node-link';
import type { View } from '../common/view';

function moveEntry(atlas: Atlas, slug: string): HTMLElement {
  const node = atlas.node(slug);
  return h(
    'li',
    { class: 'ranked-move' },
    h(
      'p',
      { class: 'ranked-move-name' },
      nodeLink(atlas, slug),
      ' ',
      node && typeBadge(atlas, node.node_type),
    ),
    node && h('p', { class: 'ranked-move-why' }, node.summary),
  );
}

export function symptomView(atlas: Atlas, id: string): View | null {
  const symptom: GraphSymptom | undefined = atlas.symptom(id);
  if (!symptom) return null;

  const el = h(
    'div',
    { class: 'symptom content' },
    h(
      'header',
      { class: 'page-header' },
      h('p', { class: 'badges' }, h('span', { class: 'chip symptom-chip' }, 'symptom')),
      h('h1', {}, symptom.symptom),
    ),
    h(
      'p',
      { class: 'tagline' },
      'Candidate machinery for a problem that looks like this, most useful first — ',
      'each move links to what it assumes and what breaks it.',
    ),
    h(
      'section',
      { class: 'landing-section' },
      h('h2', {}, 'Reach for'),
      h(
        'ol',
        { class: 'ranked-moves' },
        symptom.moves.map((slug) => moveEntry(atlas, slug)),
      ),
    ),
    symptom.worked_example &&
      h(
        'p',
        { class: 'worked-example' },
        'Worked canonical example: ',
        nodeLink(atlas, symptom.worked_example),
      ),
    symptom.mature_fields.length > 0 &&
      h(
        'p',
        { class: 'symptom-meta' },
        'This machinery is routine in: ',
        symptom.mature_fields.map((f) =>
          h('span', { class: 'chip field-chip' }, atlas.fieldLabel(f)),
        ),
      ),
    h(
      'p',
      { class: 'symptom-footer' },
      h('a', { href: '#/' }, '← All symptoms'),
      ' · not your problem? ',
      joinChildren(
        atlas.symptoms
          .filter((s) => s.id !== id)
          .slice(0, 4)
          .map((s) => h('a', { href: `#/s/${s.id}` }, s.symptom.toLowerCase())),
        ' · ',
      ),
    ),
  );

  return { title: symptom.symptom, el };
}
