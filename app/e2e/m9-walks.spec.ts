/**
 * Smoke suite for the M9 exit criteria (ROADMAP, spec §8.3): walk position
 * shareable by URL and round-tripping like the M4 view states, the walks
 * index, the concept-page "appears in walks" backlinks, the flagged jump
 * (bridging note) on an unedged hop, and both themes — all against the
 * built dist/, like the earlier milestone suites.
 */
import { expect, test } from '@playwright/test';

test('walk position lives in the URL and round-trips (the M9 exit criterion)', async ({ page }) => {
  // URL → view: arrive mid-walk on the jump step.
  await page.goto('/#/walk/eigenvalue-tour?step=3');
  await expect(page.getByRole('heading', { name: 'The eigenvalue tour' })).toBeVisible();
  await expect(page.locator('.walk-count')).toHaveText('Step 3 of 7');
  await expect(page.locator('.walk-stop-name')).toContainText('Markov chains and random walks');

  // The unedged hop is a flagged jump, never an implied connection: the
  // bridge callout names the missing edge and the authored note explains.
  await expect(page.locator('.walk-bridge')).toContainText('The walk jumps here');
  await expect(page.locator('.walk-bridge')).toContainText('Harmonic oscillator');
  await expect(page.locator('.walk-note')).toContainText('translation chain');

  // View → URL: stepping forward writes the shareable address.
  await page.getByRole('link', { name: 'Next →' }).click();
  await expect(page).toHaveURL(/#\/walk\/eigenvalue-tour\?step=4$/);
  await expect(page.locator('.walk-stop-name')).toContainText('Graphs and the graph Laplacian');
  // An edged hop shows the typed claim with its strength, as everywhere.
  const arrival = page.locator('.walk-arrival');
  await expect(arrival).toContainText('Markov chains and random walks');
  await expect(arrival.locator('.strength').first()).toContainText('theorem');

  // Round-trip: reloading the produced URL restores the same step.
  await page.reload();
  await expect(page.locator('.walk-count')).toHaveText('Step 4 of 7');
  await expect(page.locator('.walk-stop-name')).toContainText('Graphs and the graph Laplacian');

  // Backward too, and the step list jumps anywhere directly.
  await page.getByRole('link', { name: '← Previous' }).click();
  await expect(page).toHaveURL(/#\/walk\/eigenvalue-tour\?step=3$/);
  await page.locator('.walk-stops a', { hasText: 'Symmetry and invariance' }).click();
  await expect(page).toHaveURL(/#\/walk\/eigenvalue-tour\?step=7$/);
  await expect(page.locator('.walk-count')).toHaveText('Step 7 of 7');
});

test('walks index lists the shipped walks and opens one at step 1', async ({ page }) => {
  await page.goto('/#/walks');
  await expect(page.getByRole('heading', { name: 'Guided walks' })).toBeVisible();
  const cards = page.locator('.walk-card');
  await expect(cards).toHaveCount(3);

  // Each card leads with the route; the SAR tour is spined on the M7
  // application (ROADMAP: "M7 provides the spines").
  const sar = cards.filter({ hasText: 'The SAR tour' });
  await expect(sar.locator('.walk-route')).toContainText('6 steps');
  await expect(sar.locator('.walk-route')).toContainText('Computational imaging');

  await cards
    .filter({ hasText: 'The eigenvalue tour' })
    .getByRole('link', { name: 'The eigenvalue tour' })
    .click();
  await expect(page).toHaveURL(/#\/walk\/eigenvalue-tour$/);
  await expect(page.locator('.walk-count')).toHaveText('Step 1 of 7');

  // The index itself is reachable from the site nav.
  await page.locator('.site-nav').getByRole('link', { name: 'Walks' }).click();
  await expect(page).toHaveURL(/#\/walks$/);
});

test('concept pages carry "appears in walks" backlinks straight to the step', async ({ page }) => {
  await page.goto('/#/c/markov-chains');
  const section = page.locator('.concept-section', { hasText: 'Appears in walks' });
  await expect(section).toContainText('The eigenvalue tour (step 3 of 7)');
  await expect(section).toContainText('From random walk to renormalization (step 1 of 5)');

  await section.getByRole('link', { name: 'The eigenvalue tour' }).click();
  await expect(page).toHaveURL(/#\/walk\/eigenvalue-tour\?step=3$/);
  await expect(page.locator('.walk-count')).toHaveText('Step 3 of 7');
  await expect(page.locator('.walk-stop-name')).toContainText('Markov chains and random walks');
});

test('the walk view renders its chain graph, in both themes', async ({ page }) => {
  await page.goto('/#/walk/sar-tour');
  await expect(page.locator('.graph-svg')).toBeVisible();
  // The chain renders every step as a node; endpoints are pinned/focused.
  const nodes = page.locator('.graph-node');
  await expect(nodes).toHaveCount(6);
  await expect(page.locator('.graph-node.focus-node')).toHaveCount(2);

  const toggle = page.locator('.theme-toggle');
  await toggle.click(); // auto → light
  await toggle.click(); // light → dark
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(page.locator('.graph-svg')).toBeVisible();
  await expect(page.locator('.walk-stop-name')).toContainText('Computational imaging');
});
