/**
 * Keyboard affordances beyond the `/` search hotkey (spec §4
 * "keyboard-first", ROADMAP M6): arrow-hop along a page's edge list, and a
 * `?` panel documenting every shortcut. The hop is a roving pattern — Tab
 * reaches a claim, ArrowUp/ArrowDown move along the page's claims from
 * there — so the arrows never steal page scrolling from any other focus
 * position, and at the ends of the list they hand scrolling back.
 */
import { h } from '../views/common/dom';

/**
 * Hop along the page's connection claims: when focus is inside one
 * `li.connection` (concept connections, lens claims, path chain steps,
 * open questions all render them), ↑/↓ move focus to the adjacent claim's
 * first link, in page order across groups.
 */
export function installEdgeHop(): void {
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    if (e.ctrlKey || e.metaKey || e.altKey || e.shiftKey) return;
    const active = document.activeElement;
    if (!(active instanceof HTMLElement)) return;
    const item = active.closest('li.connection');
    if (!item) return;
    const items = [...document.querySelectorAll('main li.connection')];
    const next = items[items.indexOf(item) + (e.key === 'ArrowDown' ? 1 : -1)];
    if (!next) return; // past either end: let the arrow scroll as usual
    const link = next.querySelector('a');
    if (!link) return;
    e.preventDefault();
    link.focus();
  });
}

const SHORTCUTS: { keys: string[]; what: string }[] = [
  { keys: ['/'], what: 'Focus search, from anywhere' },
  { keys: ['↓', '↑'], what: 'In search: move through the results' },
  { keys: ['Enter'], what: 'In search: open the selected result' },
  { keys: ['Tab', 'Shift+Tab'], what: 'Move through links and controls' },
  { keys: ['↓', '↑'], what: 'On a connection claim: hop along the page’s claims' },
  { keys: ['Enter'], what: 'On a claim or graph node: open that concept' },
  {
    keys: ['←', '→', '↑', '↓'],
    what: 'In the matrix: move between cells (the diagonal is skipped)',
  },
  { keys: ['Enter'], what: 'In the matrix: open the pair panel for the focused cell' },
  { keys: ['Esc'], what: 'Close search results, or this panel' },
  { keys: ['?'], what: 'Show or hide this panel' },
];

function buildDialog(): HTMLDialogElement {
  const dialog = h(
    'dialog',
    { class: 'shortcuts', 'aria-label': 'Keyboard shortcuts' },
    h(
      'div',
      { class: 'shortcuts-head' },
      h('h2', {}, 'Keyboard shortcuts'),
      h('button', { type: 'button', class: 'dialog-close', 'aria-label': 'Close' }, '×'),
    ),
    h(
      'dl',
      { class: 'shortcut-list' },
      SHORTCUTS.flatMap(({ keys, what }) => [
        h(
          'dt',
          {},
          keys.flatMap((k, i) => [i > 0 ? ' ' : '', h('kbd', {}, k)]),
        ),
        h('dd', {}, what),
      ]),
    ),
    h(
      'p',
      { class: 'shortcuts-note' },
      'Every graph is also a text list, and every view’s full state lives in its URL.',
    ),
  );
  dialog.querySelector('.dialog-close')?.addEventListener('click', () => dialog.close());
  // Close on backdrop click: a click whose target is the dialog element
  // itself can only land on the backdrop area.
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) dialog.close();
  });
  return dialog;
}

/**
 * Install the `?` hotkey and return an opener for pointer users (the
 * footer links to it). The native <dialog> supplies focus trapping, Esc
 * handling, and the backdrop.
 */
export function installShortcutsPanel(): () => void {
  let dialog: HTMLDialogElement | null = null;
  const toggle = (): void => {
    if (!dialog) {
      dialog = buildDialog();
      document.body.appendChild(dialog);
    }
    if (dialog.open) dialog.close();
    else dialog.showModal();
  };
  document.addEventListener('keydown', (e) => {
    if (e.key !== '?' || e.ctrlKey || e.metaKey || e.altKey) return;
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
    toggle();
  });
  return toggle;
}
