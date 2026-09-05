/**
 * M6 exit criteria (ROADMAP): keyboard-only walkthroughs of all three
 * persona journeys (spec §2, §11), the documented shortcuts panel, focus
 * management on navigation, per-theme palette correctness, and axe-core
 * WCAG 2.1 A/AA scans of every view kind in both themes (the same axe
 * rule set that powers the Lighthouse accessibility category).
 */
import { AxeBuilder } from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

/** Tab until the focused element is a link whose text contains `text`. */
async function tabToLink(page: Page, text: string, cap = 80): Promise<void> {
  for (let i = 0; i < cap; i++) {
    await page.keyboard.press('Tab');
    const focused = await page.evaluate(() => {
      const el = document.activeElement;
      return el instanceof HTMLElement
        ? { tag: el.tagName, text: el.textContent ?? '' }
        : { tag: '', text: '' };
    });
    if (focused.tag === 'A' && focused.text.includes(text)) return;
  }
  throw new Error(`no link containing "${text}" reached within ${String(cap)} Tab presses`);
}

const focusInClaim = (page: Page): Promise<boolean> =>
  page.evaluate(() => document.activeElement?.closest('li.connection') != null);

test('keyboard-only Explorer journey: / search → concept → arrow-hop to the governing claim', async ({
  page,
}) => {
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: 'What does your problem look like?' }),
  ).toBeVisible();

  // `/` focuses search; arrow to the eigenvalues hit; Enter opens it.
  await page.keyboard.press('/');
  await expect(page.locator('.search-hero .search-input')).toBeFocused();
  await page.keyboard.type('eigenvalues');
  await expect(page.locator('.search-hit.active')).toBeVisible();
  for (let i = 0; i < 10; i++) {
    const active = await page.locator('.search-hit.active').textContent();
    if (active?.includes('Eigenvalues and spectral decomposition')) break;
    await page.keyboard.press('ArrowDown');
  }
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#\/c\/eigenvalues$/);
  await expect(page.locator('table.dialects')).toBeVisible();

  // Tab reaches the page's claims; ↓ hops along them to the GOVERNS claim.
  for (let i = 0; i < 60 && !(await focusInClaim(page)); i++) {
    await page.keyboard.press('Tab');
  }
  expect(await focusInClaim(page)).toBe(true);
  let found = false;
  for (let i = 0; i < 60; i++) {
    const text = await page.evaluate(() => document.activeElement?.textContent ?? '');
    if (text.includes('Markov chains and random walks')) {
      found = true;
      break;
    }
    await page.keyboard.press('ArrowDown');
  }
  expect(found, 'arrow-hop reaches the Markov chains claim').toBe(true);
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#\/c\/markov-chains$/);
});

test('keyboard-only Problem-Solver journey: symptom card → ranked move → worked example', async ({
  page,
}) => {
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: 'What does your problem look like?' }),
  ).toBeVisible();
  await tabToLink(page, 'Too many dimensional parameters');
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#\/s\/too-many-parameters$/);
  // The URL updates at commit, but the hashchange dispatch (render + focus
  // move) is a later task — wait for the symptom view like the other two
  // journeys, or the Tabs below walk the stale landing DOM and find its
  // identically-named inline move link just before the render steals focus.
  await expect(
    page.getByRole('heading', { name: 'Too many dimensional parameters' }),
  ).toBeVisible();

  // Navigation moved focus into the new view, so Tab starts at its top.
  await tabToLink(page, 'Dimensional analysis, scaling, and similarity');
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#\/c\/dimensional-analysis$/);
  await expect(page.locator('main')).toContainText('Buckingham');
  await expect(page.locator('main')).toContainText('Reynolds');
});

test('keyboard-only Researcher journey: questions view, statuses visible, export reachable', async ({
  page,
}) => {
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: 'What does your problem look like?' }),
  ).toBeVisible();
  await tabToLink(page, 'Questions');
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#\/questions$/);

  // Every gap edge is grouped under its workflow status, statuses visible.
  await expect(page.locator('.gap-group h2').first()).toBeVisible();
  await expect(page.locator('.gap-group .connection.gap .gap-status').first()).toBeVisible();

  // The dataset export is one action away, by keyboard. The whole page of
  // claims is focusable, so the download block is a long-but-finite walk.
  await tabToLink(page, 'graph.json', 400);
  const download = await page.evaluate(() => document.activeElement?.getAttribute('download'));
  expect(download).toBe('graph.json');
});

test('`?` opens the documented shortcuts panel; Esc and the footer opener work', async ({
  page,
}) => {
  await page.goto('/#/c/eigenvalues');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

  const dialog = page.locator('dialog.shortcuts');
  await page.keyboard.press('?');
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText('Focus search');
  await expect(dialog).toContainText('hop along the page’s claims');
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();

  // `?` typed into an input is text, not a hotkey.
  await page.keyboard.press('/');
  await page.keyboard.type('?');
  await expect(dialog).toBeHidden();
  await page.keyboard.press('Escape');

  // Pointer users get the footer opener and the close button. (The footer
  // carries two buttons since M14 — the copy-link action sits beside it.)
  await page.getByRole('button', { name: 'shortcuts (?)' }).click();
  await expect(dialog).toBeVisible();
  await page.locator('.dialog-close').click();
  await expect(dialog).toBeHidden();
});

test('in-app navigation moves focus to the new view', async ({ page }) => {
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: 'What does your problem look like?' }),
  ).toBeVisible();
  await page.getByRole('link', { name: 'Moves' }).click();
  await expect(page.locator('main#main')).toBeFocused();
});

test('community palette follows the auto (prefers-color-scheme) dark theme', async ({ page }) => {
  await page.goto('/#/metrics');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  const token = (): Promise<string> =>
    page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--community-0').trim(),
    );
  await page.emulateMedia({ colorScheme: 'light' });
  const light = await token();
  await page.emulateMedia({ colorScheme: 'dark' });
  const dark = await token();
  expect(light.length).toBeGreaterThan(0);
  expect(dark.length).toBeGreaterThan(0);
  expect(dark, 'auto-dark must remap the community palette').not.toBe(light);
});

// ---------------------------------------------------------------------------
// axe-core scans: one per view kind per theme, WCAG 2.1 A/AA rule tags.
// ---------------------------------------------------------------------------

const AXE_ROUTES: { name: string; path: string }[] = [
  { name: 'landing', path: '/' },
  { name: 'landing with the applications field filter', path: '/#/?af=electromagnetics' },
  { name: 'concept page', path: '/#/c/eigenvalues' },
  {
    name: 'application page with anatomy and assumption surface',
    path: '/#/c/weather-prediction',
  },
  { name: 'symptom detail', path: '/#/s/too-many-parameters' },
  { name: 'moves index', path: '/#/moves' },
  { name: 'applications index', path: '/#/applications' },
  { name: 'dialect lookup', path: '/#/dialects?q=poles' },
  { name: 'lens with communities', path: '/#/lens?field=biology&communities=1' },
  {
    name: 'matrix with pair panel and crosshair',
    path: '/#/matrix?focus=eigenvalues&a=eigenvalues&b=markov-chains',
  },
  { name: 'migration map with highlights', path: '/#/map?field=biology&focus=eigenvalues' },
  {
    name: 'atlas constellation with communities and focus',
    path: '/#/atlas?communities=1&focus=eigenvalues',
  },
  { name: 'compare view', path: '/#/compare/eigenvalues/markov-chains' },
  { name: 'faceted index', path: '/#/index?type=move' },
  { name: 'path chains', path: '/#/path/harmonic-oscillator/markov-chains' },
  { name: 'metrics', path: '/#/metrics' },
  { name: 'questions', path: '/#/questions' },
  { name: 'work queue', path: '/#/queue' },
  { name: 'walks index', path: '/#/walks' },
  { name: 'walk view', path: '/#/walk/eigenvalue-tour?step=3' },
  {
    name: 'propose composer',
    path: '/#/propose?from=eigenvalues&to=markov-chains&type=GOVERNS&strength=theorem',
  },
];

for (const theme of ['light', 'dark'] as const) {
  for (const route of AXE_ROUTES) {
    test(`axe: ${route.name} passes WCAG 2.1 A/AA (${theme})`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: theme });
      await page.goto(route.path);
      await expect(page.locator('main h1').first()).toBeVisible();
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();
      const summary = results.violations.map(
        (v) => `${v.id} (${v.impact ?? '?'}): ${String(v.nodes.length)} nodes`,
      );
      expect(summary).toEqual([]);
    });
  }
}
