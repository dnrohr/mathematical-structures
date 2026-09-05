/**
 * Landing v4 (spec §3.4, UI_REDESIGN.md §4.1; ROADMAP M4 + M7 + M13):
 * leads with the Problem-Solver's question — the symptom index — alongside
 * plain search; then the applications door, grown up for the wave: entries
 * grouped by primary field (the first `fields` entry) with a chip row that
 * filters the section in place (URL: `#/?af=<field>`); then a compact
 * survey strip advertising the analytical views; then the node-type index
 * for browsing. Symptom primacy is untouched.
 */
import type { Atlas } from '../../data/atlas';
import type { GraphNode } from '../../data/types';
import { replaceHash } from '../../shell/router';
import { createSearchBox } from '../../shell/search';
import { atozHash } from '../atoz';
import { h, joinChildren } from '../common/dom';
import { nodeLink } from '../common/node-link';
import type { View } from '../common/view';

export interface LandingState {
  symptom?: string;
  /** Applications-door field filter: a primary field id, or unset = all. */
  appField?: string;
}

export function landingHash(state: LandingState): string {
  const params = new URLSearchParams();
  if (state.symptom) params.set('s', state.symptom);
  if (state.appField) params.set('af', state.appField);
  const query = params.toString();
  return query ? `#/?${query}` : '#/';
}

/** One field's applications, as a labeled row of cards. */
interface FieldGroup {
  field: { id: string; label: string };
  apps: GraphNode[];
}

function applicationCard(atlas: Atlas, app: GraphNode): HTMLLIElement {
  return h(
    'li',
    { class: 'application-entry' },
    h('h3', {}, h('a', { href: `#/c/${app.slug}` }, app.canonical_name)),
    h(
      'p',
      { class: 'symptom-moves' },
      'Structures that meet here: ',
      joinChildren(
        atlas.convergingStructures(app.slug).map((c) => nodeLink(atlas, c.other)),
        ' · ',
      ),
    ),
  );
}

/**
 * The applications door (UI_REDESIGN.md §4.1): grouped by primary field,
 * chip-filterable in place — the URL tracks the choice via replaceHash so
 * the filtered section stays shareable without spamming history.
 */
function applicationsSection(atlas: Atlas, initial: LandingState): HTMLElement {
  const primaryOf = (n: GraphNode): string => n.fields[0] ?? '';
  const apps = atlas.nodesOfType('application');
  const groups: FieldGroup[] = atlas.schema.fields
    .map((f) => ({ field: f, apps: apps.filter((a) => primaryOf(a) === f.id) }))
    .filter((g) => g.apps.length > 0);

  // Sanitize: only a field that actually leads some application can filter.
  let active = groups.some((g) => g.field.id === initial.appField) ? initial.appField : undefined;

  const chipRow = h('p', { class: 'af-chips', role: 'group', 'aria-label': 'Filter by field' });
  const results = h('div', { class: 'application-groups' });

  const render = (focusChip: boolean): void => {
    replaceHash(landingHash({ ...initial, appField: active }));

    const chip = (label: string, field?: string, count?: number): HTMLElement => {
      const isActive = field === active;
      const el = h(
        'a',
        {
          class: `chip af-chip${isActive ? ' active' : ''}`,
          href: landingHash({ ...initial, appField: field }),
          'data-af': field ?? '',
          ...(isActive ? { 'aria-current': 'true' } : {}),
        },
        label,
        count !== undefined && h('span', { class: 'count' }, ` ${String(count)}`),
      );
      el.addEventListener('click', (e) => {
        // Plain click filters in place; modified clicks keep link behavior.
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        e.preventDefault();
        active = field;
        render(true);
      });
      return el;
    };

    chipRow.replaceChildren(
      chip('All fields', undefined),
      ...groups.map((g) => chip(atlas.fieldLabel(g.field.id), g.field.id, g.apps.length)),
    );

    const shown = active ? groups.filter((g) => g.field.id === active) : groups;
    results.replaceChildren(
      ...shown.map((g) =>
        h(
          'div',
          { class: 'app-field-group' },
          h(
            'h3',
            { class: 'app-field-label' },
            atlas.fieldLabel(g.field.id),
            h('span', { class: 'count' }, ` ${String(g.apps.length)}`),
          ),
          h(
            'ul',
            { class: 'application-entry-list' },
            g.apps.map((a) => applicationCard(atlas, a)),
          ),
        ),
      ),
    );

    // In-place filtering must not strand keyboard focus: put it back on
    // the chip that now represents the active choice.
    if (focusChip) {
      const target = chipRow.querySelector<HTMLElement>(`[data-af="${active ?? ''}"]`);
      target?.focus();
    }
  };
  render(false);

  return h(
    'section',
    { class: 'landing-section', id: 'applications' },
    h('h2', {}, 'Or start from a real system'),
    h(
      'p',
      { class: 'section-hint' },
      'Applications run the demonstration the other way: one real problem, several structures converging on it, grouped by the field each problem lives in — ',
      h('a', { href: '#/applications' }, 'browse all applications'),
      '.',
    ),
    chipRow,
    results,
  );
}

/**
 * The survey strip (UI_REDESIGN.md §4.1): one compact row advertising the
 * analytical half of the app, each view with a one-phrase description.
 */
function surveyStrip(): HTMLElement {
  const links: { href: string; label: string; phrase: string }[] = [
    { href: '#/matrix', label: 'Matrix', phrase: 'every pair, absence included' },
    { href: '#/map', label: 'Map', phrase: 'structures × fields, named or missing' },
    { href: '#/atlas', label: 'Atlas', phrase: 'the whole trusted graph, one fixed constellation' },
    { href: '#/metrics', label: 'Metrics', phrase: 'hubs, bridges, spans' },
    { href: '#/questions', label: 'Questions', phrase: 'open research gaps, with status' },
    { href: '#/queue', label: 'Queue', phrase: 'what to grow next, on evidence' },
  ];
  return h(
    'section',
    { class: 'landing-section survey-strip' },
    h('h2', {}, 'Survey the whole atlas'),
    h(
      'ul',
      { class: 'survey-links' },
      links.map((l) =>
        h(
          'li',
          {},
          h('a', { href: l.href }, l.label),
          h('span', { class: 'survey-phrase' }, ` — ${l.phrase}`),
        ),
      ),
    ),
  );
}

export function landingView(atlas: Atlas, opts: LandingState = {}): View {
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
        h('h3', {}, h('a', { class: 'symptom-title', href: `#/s/${s.id}` }, s.symptom)),
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
    applicationsSection(atlas, opts),
    surveyStrip(),
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
            // Pre-filtered index state (UI_REDESIGN.md §4.8, M14): the group
            // heading opens the A–Z index faceted to this kind.
            h(
              'a',
              {
                class: 'type-group-link',
                href: atozHash({ type: group.def.id }),
                title: `Browse ${group.def.label} in the faceted index`,
              },
              group.def.label,
            ),
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
