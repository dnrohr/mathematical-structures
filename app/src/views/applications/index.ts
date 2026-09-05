/**
 * The applications index (spec §8.8; ROADMAP M7): the third front door.
 * The symptom index runs from a problem shape to candidate machinery; an
 * application runs the demonstration the other way — one real system,
 * several structures converging on it. Each card leads with that
 * convergence, every claim carrying its strength as always.
 */
import type { Atlas } from '../../data/atlas';
import { strengthBadge } from '../common/badges';
import { h, joinChildren } from '../common/dom';
import { nodeLink } from '../common/node-link';
import type { View } from '../common/view';

export function applicationsView(atlas: Atlas): View {
  const apps = atlas.nodesOfType('application');
  const appType = atlas.nodeType('application');

  const el = h(
    'div',
    { class: 'applications content' },
    h('header', { class: 'page-header' }, h('h1', {}, 'Applications')),
    h(
      'p',
      { class: 'tagline' },
      appType
        ? appType.description.trim()
        : 'Domain problems that mathematical structures converge on.',
      ' An application earns a node only when at least two structures meet in it — the convergence is the story (one-structure applications stay canonical examples on the structure’s page).',
    ),
    h(
      'ul',
      { class: 'application-list' },
      apps.map((app) => {
        const structures = atlas.convergingStructures(app.slug);
        return h(
          'li',
          { class: 'application-card' },
          h('h2', {}, nodeLink(atlas, app.slug)),
          h('p', { class: 'summary' }, app.summary),
          structures.length > 0 &&
            h(
              'p',
              { class: 'structure-meta' },
              'Where the structures meet: ',
              joinChildren(
                structures.map((conn) =>
                  h(
                    'span',
                    { class: 'structure-entry' },
                    nodeLink(atlas, conn.other),
                    ' ',
                    strengthBadge(atlas, conn.strength),
                  ),
                ),
                ' · ',
              ),
            ),
        );
      }),
    ),
    h(
      'p',
      { class: 'section-hint' },
      'Every claim above is a typed edge; open an application for the full sentences, contexts, and caveats. Recognize your own problem here? The ',
      h('a', { href: '#/' }, 'symptom index'),
      ' runs the same demonstration from the problem side.',
    ),
  );

  return { title: 'Applications', el };
}
