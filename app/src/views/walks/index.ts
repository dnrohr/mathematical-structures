/**
 * The walks index (spec §8.3, ROADMAP M9): guided tours through the graph,
 * compiled from paths/*.yaml. Each card leads with the route so a reader
 * can see where a walk goes before starting it.
 */
import type { Atlas } from '../../data/atlas';
import { readWalkPosition } from '../../shell/local';
import { h } from '../common/dom';
import type { View } from '../common/view';
import { walkHash } from '../walk';

export function walksView(atlas: Atlas): View {
  const el = h(
    'div',
    { class: 'walks content' },
    h('header', { class: 'page-header' }, h('h1', {}, 'Guided walks')),
    h(
      'p',
      { class: 'tagline' },
      'Curated tours through the atlas, one typed claim at a time. Every hop is either an ' +
        'edge from the graph or an explicitly flagged jump — a walk never implies a ' +
        'connection the map does not make.',
    ),
    atlas.walks.length === 0
      ? h('p', { class: 'empty-state' }, 'No walks are published yet.')
      : h(
          'ul',
          { class: 'walk-list' },
          atlas.walks.map((walk) => {
            // Walk resume (UI_REDESIGN.md §5, M14): a localStorage
            // convenience — the card offers the stored position when one
            // exists beyond step 1, and nothing depends on it being there.
            const stored = readWalkPosition(walk.id);
            const resume = stored !== null && stored > 1 && stored <= walk.steps.length;
            return h(
              'li',
              { class: 'walk-card' },
              h('h2', {}, h('a', { href: walkHash(walk.id, 1) }, walk.title)),
              h('p', { class: 'summary' }, walk.summary),
              h(
                'p',
                { class: 'walk-route' },
                `${String(walk.steps.length)} steps: `,
                walk.steps
                  .map((step) => atlas.node(step.slug)?.canonical_name ?? step.slug)
                  .join(' → '),
              ),
              resume &&
                h(
                  'p',
                  { class: 'walk-resume' },
                  h(
                    'a',
                    {
                      href: walkHash(walk.id, stored),
                      title: 'Position saved in this browser only',
                    },
                    `Resume at step ${String(stored)} →`,
                  ),
                ),
            );
          }),
        ),
    h(
      'p',
      { class: 'section-hint' },
      'Prefer to wander? The ',
      h('a', { href: '#/path' }, 'path finder'),
      ' traces chains between any two concepts, and every concept page lists the walks ' +
        'that pass through it.',
    ),
  );

  return { title: 'Guided walks', el };
}
