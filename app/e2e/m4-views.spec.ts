/**
 * Smoke suite for the M4 exit criteria (ROADMAP, spec §11): the
 * Problem-Solver's symptom journey in ≤ 3 clicks, the ego-network on
 * concept pages (legible in both themes, relationships also as text),
 * and lens/path/dialect state shareable by URL.
 */
import { expect, test, type Page } from '@playwright/test';

test('Problem-Solver journey: symptom → ranked moves → Buckingham Π with Reynolds (2 clicks)', async ({
  page,
}) => {
  await page.goto('/');

  // Click 1: the symptom card opens the ranked detail page.
  await page.getByRole('link', { name: /Too many dimensional parameters/ }).click();
  await expect(page).toHaveURL(/#\/s\/too-many-parameters$/);
  const firstMove = page.locator('.ranked-move').first();
  await expect(firstMove).toContainText('Dimensional analysis, scaling, and similarity');

  // Click 2: the top-ranked move.
  await firstMove
    .getByRole('link', { name: 'Dimensional analysis, scaling, and similarity' })
    .click();
  await expect(page).toHaveURL(/#\/c\/dimensional-analysis$/);

  // Buckingham Π with the worked Reynolds example, on one page.
  await expect(page.getByRole('heading', { name: /Buckingham/ })).toBeVisible();
  await expect(page.locator('.example-list')).toContainText('Reynolds number');
});

test('ego-network on the concept page: renders, expands to 2 hops, caps with overflow', async ({
  page,
}) => {
  await page.goto('/#/c/eigenvalues');
  const ego = page.locator('.concept-ego');
  await expect(ego.locator('.graph-svg')).toBeVisible();
  const oneHop = await ego.locator('.graph-node').count();
  expect(oneHop).toBeGreaterThan(5);

  // Never the full graph: the atlas is larger than any ego rendering.
  const total = await page.evaluate(async () => {
    const res = await fetch('data/graph.json');
    return ((await res.json()) as { nodes: unknown[] }).nodes.length;
  });
  expect(oneHop).toBeLessThan(total);

  await ego.getByRole('button', { name: 'Expand to 2 hops' }).click();
  const twoHop = await ego.locator('.graph-node').count();
  expect(twoHop).toBeGreaterThan(oneHop);
  expect(twoHop).toBeLessThanOrEqual(25);
  await expect(ego.locator('.ego-overflow')).toContainText('more nearby');
  await expect(ego.getByRole('button', { name: 'Back to 1 hop' })).toBeVisible();
});

test('every graph-visible relationship is also present as text', async ({ page }) => {
  await page.goto('/#/c/eigenvalues');
  const ego = page.locator('.concept-ego');
  // The view attaches after the async data load: wait for the graph before
  // counting, or the counts race the boot fetch.
  await expect(ego.locator('.graph-svg')).toBeVisible();
  // Edges touching the node are the Connections sections; edges between
  // neighbors get their own claim list under the graph.
  const edges = await ego.locator('.graph-edge').count();
  const betweenClaims = await ego.locator('.ego-between .connection').count();
  const centerTouching = edges - betweenClaims;
  expect(betweenClaims).toBeGreaterThan(0);
  const pageClaims = await page
    .locator('.connections .connection, .assumptions .connection')
    .count();
  expect(pageClaims).toBeGreaterThanOrEqual(centerTouching);
  // Focusing an edge (the keyboard path) reads its claim into the caption.
  const edge = ego.locator('.graph-edge').first();
  await edge.focus();
  const sentence = await edge.getAttribute('aria-label');
  await expect(ego.locator('.graph-caption')).toHaveText(sentence!);
});

const labelColor = (page: Page): Promise<string> =>
  page.evaluate(() => getComputedStyle(document.querySelector('.graph-label')!).fill);

test('the graph is legible in both themes', async ({ page }) => {
  await page.goto('/#/c/eigenvalues');
  await expect(page.locator('.concept-ego .graph-svg')).toBeVisible();
  const light = await labelColor(page);
  const toggle = page.locator('.theme-toggle');
  await toggle.click(); // auto → light
  await toggle.click(); // light → dark
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(page.locator('.concept-ego .graph-svg')).toBeVisible();
  expect(await labelColor(page)).not.toBe(light);
});

test('lens state lives in the URL, both directions', async ({ page }) => {
  // URL → view: filters arrive preselected and applied.
  await page.goto('/#/lens?edge=GOVERNS&strength=strong-analogy');
  await expect(page.getByLabel('Edge type')).toHaveValue('GOVERNS');
  await expect(page.getByLabel('Strength floor')).toHaveValue('strong-analogy');
  await expect(page.locator('.lens-claims h2')).toContainText('As claims');
  await expect(page.locator('.graph-view')).toBeVisible();

  // View → URL: changing a filter updates the shareable address.
  await page.getByLabel('Field').selectOption('biology');
  await expect(page).toHaveURL(/#\/lens\?.*field=biology/);

  // Round-trip: reloading the produced URL restores the same lens.
  await page.reload();
  await expect(page.getByLabel('Field')).toHaveValue('biology');
  await expect(page.getByLabel('Edge type')).toHaveValue('GOVERNS');
  await expect(page.locator('.lens-claims')).toBeVisible();
});

test('lens without filters guides instead of rendering the full graph', async ({ page }) => {
  await page.goto('/#/lens');
  await expect(page.locator('.empty-state')).toContainText('Choose at least one filter');
  await expect(page.locator('.graph-view')).toHaveCount(0);
  await page.getByRole('link', { name: 'Only field dialects' }).click();
  await expect(page).toHaveURL(/#\/lens\?edge=FIELD-DIALECT-OF$/);
  await expect(page.locator('.graph-view')).toBeVisible();
});

test('path view renders §34 chains from the URL and back', async ({ page }) => {
  await page.goto('/#/path/harmonic-oscillator/markov-chains');
  await expect(page.locator('.path-chains h2')).toContainText('Chains');
  const chain = page.locator('.chain').first();
  await expect(chain).toContainText('Eigenvalues and spectral decomposition');
  await expect(chain).toContainText('theorem');
  // Both endpoints are pinned and emphasized in the graph preset.
  await expect(page.locator('.graph-node.focus-node')).toHaveCount(2);

  // Endpoint and floor selections write the URL.
  await page.getByLabel('Strength floor').selectOption('theorem');
  await expect(page).toHaveURL(/#\/path\/harmonic-oscillator\/markov-chains\?strength=theorem$/);
  await expect(page.locator('.chain').first()).toBeVisible();

  // The swap affordance flips direction, still shareable.
  await page.getByRole('link', { name: 'swap' }).click();
  await expect(page).toHaveURL(/#\/path\/markov-chains\/harmonic-oscillator\?strength=theorem$/);
  await expect(page.locator('.chain').first()).toContainText('Markov chains');
});

test('dialect lookup translates an alias, state in URL', async ({ page }) => {
  await page.goto('/#/dialects?q=perfect%20adaptation');
  const result = page.locator('.dialect-result').first();
  await expect(result).toContainText('perfect adaptation');
  await expect(result).toContainText('is what Systems & mathematical biology calls');
  await expect(result.locator('table.dialects')).toContainText('Control theory');

  // Typing updates the URL without losing focus.
  const input = page.locator('.dialect-input');
  await input.fill('propagator');
  await expect(page).toHaveURL(/#\/dialects\?q=propagator$/);
  await expect(page.locator('.dialect-result').first()).toContainText(
    /Green.s functions and impulse response/,
  );
  await result.getByRole('link', { name: /Green/ }).click();
  await expect(page).toHaveURL(/#\/c\/greens-function$/);
});

test('a symptom search hit opens the symptom detail page', async ({ page }) => {
  await page.goto('/#/moves');
  const input = page.locator('.site-header .search-input');
  await input.fill('oscillation feedback');
  await expect(page.locator('.search-hit').first()).toContainText('symptom');
  await input.press('Enter');
  await expect(page).toHaveURL(/#\/s\/feedback-oscillation$/);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Oscillation');
});
