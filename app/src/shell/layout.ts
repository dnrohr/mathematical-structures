/**
 * The app chrome: header (brand, nav, search, theme toggle), the <main>
 * views render into, and the provenance footer (deployed footer shows
 * `generated_from`; ARCHITECTURE.md §7).
 */
import { APP_TITLE, REPO_URL } from '../config';
import type { Atlas } from '../data/atlas';
import { h } from '../views/common/dom';
import { createSearchBox, installSearchHotkey } from './search';
import { createThemeToggle } from './theme';

export interface Shell {
  main: HTMLElement;
  setTitle(viewTitle: string | null): void;
}

export function createShell(root: HTMLElement, atlas: Atlas): Shell {
  const main = h('main', { id: 'main', tabindex: '-1' });
  const sha = atlas.generatedFrom;
  const shortSha = /^[0-9a-f]{40}$/.test(sha) ? sha.slice(0, 7) : sha;

  const skip = h('a', { class: 'skip-link', href: '#main' }, 'Skip to content');
  // '#main' would otherwise be swallowed by the hash router.
  skip.addEventListener('click', (e) => {
    e.preventDefault();
    main.focus();
  });

  const header = h(
    'header',
    { class: 'site-header' },
    h(
      'div',
      { class: 'site-header-inner' },
      h('a', { class: 'brand', href: '#/' }, APP_TITLE),
      h(
        'nav',
        { class: 'site-nav', 'aria-label': 'Site' },
        h('a', { href: '#/index' }, 'A–Z'),
        h('a', { href: '#/moves' }, 'Moves'),
      ),
      createSearchBox(atlas, { variant: 'header', placeholder: 'Search ( / )' }),
      createThemeToggle(),
    ),
  );

  const footer = h(
    'footer',
    { class: 'site-footer' },
    h(
      'p',
      {},
      'Generated from ',
      /^[0-9a-f]{40}$/.test(sha)
        ? h('a', { href: `${REPO_URL}/commit/${sha}` }, h('code', {}, shortSha))
        : h('code', {}, shortSha),
      ` · data v${atlas.data.schema_version} · `,
      h('a', { href: REPO_URL }, 'GitHub'),
      ' · ',
      h('a', { href: `${REPO_URL}/blob/main/docs/graph-json.md` }, 'use the dataset'),
    ),
  );

  root.replaceChildren(skip, header, main, footer);
  installSearchHotkey();

  return {
    main,
    setTitle(viewTitle: string | null): void {
      document.title = viewTitle ? `${viewTitle} · ${APP_TITLE}` : APP_TITLE;
    },
  };
}
