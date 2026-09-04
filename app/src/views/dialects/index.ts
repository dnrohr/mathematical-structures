/**
 * Reverse-dialect lookup (spec §7.3 Dialect module, ROADMAP M4): "I read a
 * word in a paper from another field — what is it in mine?" Any alias in
 * any field resolves to its canonical node and the full dialect table.
 * Matching is exact substring, not fuzzy: a wrong translation is worse
 * than no translation. Query state lives in the URL (?q=…).
 */
import type { AliasHit, Atlas } from '../../data/atlas';
import { replaceHash } from '../../shell/router';
import { typeBadge } from '../common/badges';
import { dialectTable } from '../common/dialect-table';
import { h } from '../common/dom';
import { nodeLink } from '../common/node-link';
import type { View } from '../common/view';

const EXAMPLES = ['perfect adaptation', 'poles', 'propagator', 'similitude'];

function dedupeByNode(hits: AliasHit[]): AliasHit[] {
  const seen = new Set<string>();
  return hits.filter((hit) => {
    if (seen.has(hit.node.slug)) return false;
    seen.add(hit.node.slug);
    return true;
  });
}

function resultCard(atlas: Atlas, hit: AliasHit): HTMLElement {
  const { node, alias } = hit;
  return h(
    'section',
    { class: 'dialect-result' },
    h(
      'p',
      { class: 'dialect-framing' },
      alias
        ? [
            h('strong', {}, `“${alias.name}”`),
            ` is what ${atlas.fieldLabel(alias.field)} calls `,
            nodeLink(atlas, node.slug),
            ' ',
          ]
        : [nodeLink(atlas, node.slug), ' — matched by its canonical name '],
      typeBadge(atlas, node.node_type),
    ),
    h('p', { class: 'section-hint' }, node.summary),
    dialectTable(atlas, node) ??
      h('p', { class: 'section-hint' }, 'No dialect names recorded for this concept yet.'),
  );
}

export function dialectsView(atlas: Atlas, initialQuery: string): View {
  const results = h('div', { class: 'dialect-results' });

  const render = (query: string): void => {
    const q = query.trim();
    if (q.length === 0) {
      results.replaceChildren(
        h(
          'p',
          { class: 'section-hint' },
          'Try a term you met in another field’s paper: ',
          ...EXAMPLES.flatMap((ex, i) => [
            i > 0 ? ' · ' : '',
            h('a', { href: `#/dialects?q=${encodeURIComponent(ex)}` }, ex),
          ]),
        ),
      );
      return;
    }
    const hits = dedupeByNode(atlas.aliasLookup(q));
    if (hits.length === 0) {
      results.replaceChildren(
        h(
          'p',
          { class: 'empty-state' },
          `No field calls anything “${q}” in this atlas (exact match only). `,
          'Broader search may still find it: press ',
          h('kbd', {}, '/'),
          ' and try there.',
        ),
      );
      return;
    }
    results.replaceChildren(...hits.map((hit) => resultCard(atlas, hit)));
  };

  const input = h('input', {
    class: 'search-input dialect-input',
    type: 'search',
    value: initialQuery,
    placeholder: 'A term from any field — “perfect adaptation”, “poles”, “similitude”…',
    'aria-label': 'Dialect term to translate',
    autocomplete: 'off',
    autocapitalize: 'none',
    spellcheck: 'false',
    oninput: () => {
      const q = input.value.trim();
      replaceHash(q ? `#/dialects?q=${encodeURIComponent(q)}` : '#/dialects');
      render(input.value);
    },
  });

  render(initialQuery);

  const el = h(
    'div',
    { class: 'dialects content' },
    h('header', { class: 'page-header' }, h('h1', {}, 'Dialect lookup')),
    h(
      'p',
      { class: 'tagline' },
      'Fields rename shared structure. Type a field’s term to find the canonical concept ' +
        'and every other field’s name for it.',
    ),
    h('div', { class: 'dialect-box' }, input),
    results,
  );

  return { title: 'Dialect lookup', el };
}
