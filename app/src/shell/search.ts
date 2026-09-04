/**
 * Global search over the prebuilt MiniSearch index. Alias hits get the
 * reverse-dialect framing — `aka "poles / modes" in Control theory →` —
 * because translating between field vocabularies is search's primary job
 * (ARCHITECTURE.md §4.5).
 */
import type { Atlas, SearchHit } from '../data/atlas';
import { typeDot } from '../views/common/badges';
import { h } from '../views/common/dom';

let counter = 0;

export function createSearchBox(
  atlas: Atlas,
  opts: { variant: 'header' | 'hero'; placeholder?: string } = { variant: 'header' },
): HTMLElement {
  const listId = `search-list-${++counter}`;
  let hits: SearchHit[] = [];
  let active = -1;

  const input = h('input', {
    class: 'search-input',
    type: 'search',
    role: 'combobox',
    placeholder: opts.placeholder ?? 'Search…',
    autocomplete: 'off',
    autocapitalize: 'none',
    spellcheck: 'false',
    'aria-label': 'Search concepts, dialect names, and symptoms',
    'aria-expanded': 'false',
    'aria-controls': listId,
    'aria-autocomplete': 'list',
  });
  const list = h('ul', {
    class: 'search-results',
    id: listId,
    role: 'listbox',
    'aria-label': 'Search results',
    hidden: true,
  });
  const box = h('div', { class: `search search-${opts.variant}`, role: 'search' }, input, list);

  function close(): void {
    hits = [];
    active = -1;
    list.replaceChildren();
    list.hidden = true;
    input.setAttribute('aria-expanded', 'false');
    input.removeAttribute('aria-activedescendant');
  }

  function go(index: number): void {
    const hit = hits[index];
    if (!hit) return;
    input.value = '';
    close();
    input.blur();
    // Symptom hits open the symptom detail page (M4's front door).
    window.location.hash =
      hit.kind === 'symptom' ? `#/s/${hit.id.slice('symptom:'.length)}` : `#/c/${hit.id}`;
  }

  function paint(): void {
    list.replaceChildren(
      ...hits.map((hit, i) => {
        const optionId = `${listId}-${i}`;
        const item = h(
          'li',
          {
            id: optionId,
            role: 'option',
            class: `search-hit${i === active ? ' active' : ''}`,
            'aria-selected': i === active ? 'true' : 'false',
            // mousedown, not click: it must win against the input's blur.
            onmousedown: (e) => {
              e.preventDefault();
              go(i);
            },
          },
          hit.kind === 'concept'
            ? [
                typeDot(atlas, atlas.node(hit.id)?.node_type ?? ''),
                h('span', { class: 'hit-name' }, hit.name),
                hit.aliasMatch &&
                  h(
                    'span',
                    { class: 'hit-aka' },
                    `aka “${hit.aliasMatch.name}” in ${hit.aliasMatch.field} →`,
                  ),
              ]
            : [
                h('span', { class: 'chip symptom-chip' }, 'symptom'),
                h('span', { class: 'hit-name' }, hit.name),
              ],
        );
        return item;
      }),
    );
    list.hidden = hits.length === 0;
    input.setAttribute('aria-expanded', hits.length > 0 ? 'true' : 'false');
    if (active >= 0) input.setAttribute('aria-activedescendant', `${listId}-${active}`);
    else input.removeAttribute('aria-activedescendant');
  }

  input.addEventListener('input', () => {
    hits = atlas.search(input.value);
    active = hits.length > 0 ? 0 : -1;
    paint();
  });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      if (hits.length === 0) return;
      e.preventDefault();
      const delta = e.key === 'ArrowDown' ? 1 : -1;
      active = (active + delta + hits.length) % hits.length;
      paint();
    } else if (e.key === 'Enter') {
      if (active >= 0) {
        e.preventDefault();
        go(active);
      }
    } else if (e.key === 'Escape') {
      close();
      input.blur();
    }
  });
  box.addEventListener('focusout', (e) => {
    if (!box.contains((e as FocusEvent).relatedTarget as Node | null)) close();
  });

  return box;
}

/** `/` focuses search (spec §4). Prefers the landing hero box when present. */
export function focusSearch(): void {
  const input =
    document.querySelector<HTMLInputElement>('.search-hero .search-input') ??
    document.querySelector<HTMLInputElement>('.search-input');
  input?.focus();
  input?.select();
}

export function installSearchHotkey(): void {
  document.addEventListener('keydown', (e) => {
    if (e.key !== '/' || e.ctrlKey || e.metaKey || e.altKey) return;
    const target = e.target as HTMLElement | null;
    if (
      target &&
      (target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable)
    )
      return;
    e.preventDefault();
    focusSearch();
  });
}
