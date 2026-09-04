/**
 * Landing v1 (spec §3.4): leads with the Problem-Solver's question — the
 * symptom index — alongside plain search, then the node-type index for
 * browsing. Symptoms are plain links here; interactive symptom routing
 * is M4.
 */
import type { Atlas } from '../../data/atlas';
import { createSearchBox } from '../../shell/search';
import { h, joinChildren } from '../common/dom';
import { nodeLink } from '../common/node-link';
import type { View } from '../common/view';

export function landingView(atlas: Atlas, opts: { symptom?: string } = {}): View {
  const symptoms = h(
    'ul',
    { class: 'symptom-list' },
    atlas.symptoms.map((s) =>
      h(
        'li',
        {
          class: `symptom-card${opts.symptom === s.id ? ' highlight' : ''}`,
          id: `s-${s.id}`,
        },
        h('h3', {}, s.symptom),
        h(
          'p',
          { class: 'symptom-moves' },
          'Reach for: ',
          joinChildren(
            s.moves.map((m) => nodeLink(atlas, m)),
            ' · ',
          ),
        ),
        h(
          'p',
          { class: 'symptom-meta' },
          `Routine in ${s.mature_fields.map((f) => atlas.fieldLabel(f)).join(', ')}`,
          s.worked_example && [
            ' · worked example: ',
            nodeLink(atlas, s.worked_example, { dot: false }),
          ],
        ),
      ),
    ),
  );

  const byType = atlas.schema.node_types
    .map((t) => ({ def: t, nodes: atlas.nodesOfType(t.id) }))
    .filter((g) => g.nodes.length > 0);

  const el = h(
    'div',
    { class: 'landing content' },
    h(
      'section',
      { class: 'hero' },
      h('h1', {}, 'What does your problem look like?'),
      h(
        'p',
        { class: 'tagline' },
        'A field guide to the mathematical structures that recur across science. ' +
          'Start from a symptom of your problem, or search a concept by any field’s name for it.',
      ),
      createSearchBox(atlas, {
        variant: 'hero',
        placeholder: 'Try “poles”, “perfect adaptation”, “eigenvalues”…',
      }),
    ),
    h('section', { class: 'landing-section' }, h('h2', {}, 'Start from a symptom'), symptoms),
    h(
      'section',
      { class: 'landing-section' },
      h('h2', {}, 'Browse by kind'),
      byType.map((group) =>
        h(
          'div',
          { class: 'type-group' },
          h(
            'h3',
            {},
            h('span', {
              class: 'type-dot',
              style: `--accent: var(--${group.def.color_token})`,
              'aria-hidden': 'true',
            }),
            group.def.label,
            h('span', { class: 'count' }, ` ${group.nodes.length}`),
          ),
          h('p', { class: 'section-hint' }, group.def.description.trim()),
          h(
            'p',
            { class: 'type-nodes' },
            joinChildren(
              group.nodes.map((n) => nodeLink(atlas, n.slug, { dot: false })),
              ' · ',
            ),
          ),
        ),
      ),
    ),
  );

  return {
    title: null,
    el,
    onMount: opts.symptom
      ? () => {
          document.getElementById(`s-${opts.symptom}`)?.scrollIntoView({ block: 'center' });
        }
      : undefined,
  };
}
