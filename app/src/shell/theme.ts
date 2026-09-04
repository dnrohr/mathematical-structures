/**
 * Light/dark themes: the CSS follows prefers-color-scheme by default; a
 * manual override is stored and applied as data-theme on <html>
 * (index.html applies it pre-paint). Spec §4: both themes first-class.
 */
export type ThemePref = 'auto' | 'light' | 'dark';

const KEY = 'atlas-theme';
const ORDER: ThemePref[] = ['auto', 'light', 'dark'];

export function themePref(): ThemePref {
  try {
    const stored = localStorage.getItem(KEY);
    return stored === 'light' || stored === 'dark' ? stored : 'auto';
  } catch {
    return 'auto';
  }
}

export function setThemePref(pref: ThemePref): void {
  try {
    if (pref === 'auto') localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, pref);
  } catch {
    /* storage unavailable: the override just won't persist */
  }
  if (pref === 'auto') delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = pref;
}

export function createThemeToggle(): HTMLButtonElement {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'theme-toggle';
  const show = (pref: ThemePref): void => {
    button.textContent = `theme: ${pref}`;
    button.setAttribute('aria-label', `Color theme: ${pref}. Activate to change.`);
  };
  show(themePref());
  button.addEventListener('click', () => {
    const next = ORDER[(ORDER.indexOf(themePref()) + 1) % ORDER.length]!;
    setThemePref(next);
    show(next);
  });
  return button;
}
