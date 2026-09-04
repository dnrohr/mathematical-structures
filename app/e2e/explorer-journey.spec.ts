/**
 * Smoke suite for the M3 exit criteria (ROADMAP, spec §11), run against the
 * built dist/: the Explorer journey in ≤ 3 clicks, reverse-dialect search
 * framing, working prose links, both themes, and the plain-link symptom
 * landing.
 */
import { expect, test, type Page } from '@playwright/test';

const bodyBg = (page: Page): Promise<string> =>
  page.evaluate(() => getComputedStyle(document.body).backgroundColor);

test('Explorer journey: eigenvalues → dialect table → spectral gap governs mixing (2 clicks)', async ({
  page,
}) => {
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: 'What does your problem look like?' }),
  ).toBeVisible();

  // Type into the landing search and open the concept — click 1.
  await page.locator('.search-hero .search-input').fill('eigenvalues');
  await page
    .locator('.search-hit')
    .filter({ hasText: 'Eigenvalues and spectral decomposition' })
    .first()
    .click();
  await expect(page).toHaveURL(/#\/c\/eigenvalues$/);

  // The dialect table is visible on the way…
  const dialects = page.locator('table.dialects');
  await expect(dialects).toBeVisible();
  await expect(dialects).toContainText('poles / modes / damping');
  await expect(dialects).toContainText('Control theory');

  // …and build-rendered math is present.
  await expect(page.locator('.katex').first()).toBeVisible();

  // The typed claim, as a sentence with its strength: click 2.
  const governs = page.locator('.connection-group').filter({ hasText: 'Governs' });
  await expect(governs).toContainText('spectral gap');
  await expect(governs).toContainText('theorem');
  await governs.getByRole('link', { name: 'Markov chains and random walks' }).click();

  await expect(page).toHaveURL(/#\/c\/markov-chains$/);
  await expect(page.getByRole('heading', { level: 1 })).toContainText(
    'Markov chains and random walks',
  );
});

test('reverse-dialect lookup: an alias hit is framed as a translation', async ({ page }) => {
  await page.goto('/');
  const input = page.locator('.search-hero .search-input');
  await input.fill('poles');
  // Several nodes carry "poles" dialects; every such hit is framed as a
  // translation, whatever the ranking.
  const hit = page.locator('.search-hit').first();
  await expect(hit).toContainText('aka');
  await expect(hit).toContainText('in Control theory');
  await page
    .locator('.search-hit')
    .filter({ hasText: 'Eigenvalues and spectral decomposition' })
    .click();
  await expect(page).toHaveURL(/#\/c\/eigenvalues$/);
});

test('every concept mentioned in prose is a working link', async ({ page }) => {
  await page.goto('/#/c/eigenvalues');
  await page.locator('.prose a.wiki-link', { hasText: 'change representation' }).click();
  await expect(page).toHaveURL(/#\/c\/change-of-representation$/);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Change the representation');
});

test('landing symptoms are plain links into concepts', async ({ page }) => {
  await page.goto('/');
  const card = page.locator('#s-too-many-parameters');
  await expect(card).toContainText('Too many dimensional parameters');
  // The move link and the worked-example link both point at the node; take the first.
  await card
    .getByRole('link', { name: 'Dimensional analysis, scaling, and similarity' })
    .first()
    .click();
  await expect(page).toHaveURL(/#\/c\/dimensional-analysis$/);
});

test('an old ?s= symptom link still highlights its landing card', async ({ page }) => {
  // Search now routes symptom hits to #/s/<id> (M4, covered in m4-views);
  // pre-M4 shared links keep working.
  await page.goto('/#/?s=feedback-oscillation');
  await expect(page.locator('#s-feedback-oscillation')).toHaveClass(/highlight/);
});

test('moves index exists and routes (spec §5.2)', async ({ page }) => {
  await page.goto('/#/moves');
  await expect(page.getByRole('heading', { name: 'Reusable moves' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Linearize it' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Change the representation' })).toBeVisible();
});

test('light and dark themes both render, and the choice sticks', async ({ page }) => {
  await page.goto('/#/c/eigenvalues');
  const toggle = page.locator('.theme-toggle');

  await toggle.click(); // auto → light
  await expect(toggle).toHaveText('theme: light');
  const light = await bodyBg(page);

  await toggle.click(); // light → dark
  await expect(toggle).toHaveText('theme: dark');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  const dark = await bodyBg(page);
  expect(dark).not.toBe(light);

  // Math stays legible in dark: KaTeX inherits the theme's ink color.
  await expect(page.locator('.katex').first()).toBeVisible();

  // The override is applied pre-paint on reload.
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});

test("'/' focuses search from anywhere", async ({ page }) => {
  await page.goto('/#/c/markov-chains');
  // Wait for the app to boot (data fetch is async) before pressing the hotkey.
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await page.keyboard.press('/');
  await expect(page.locator('.site-header .search-input')).toBeFocused();
});

test('unknown routes get a way back, and the footer carries provenance', async ({ page }) => {
  await page.goto('/#/c/not-a-real-slug');
  await expect(page.getByRole('heading', { name: 'Nothing at this address' })).toBeVisible();
  await page.getByRole('link', { name: 'Back to the atlas' }).click();
  await expect(
    page.getByRole('heading', { name: 'What does your problem look like?' }),
  ).toBeVisible();

  const footer = page.locator('.site-footer');
  await expect(footer).toContainText('Generated from');
  await expect(footer.locator('a[href*="/commit/"]')).toHaveCount(1);
});
