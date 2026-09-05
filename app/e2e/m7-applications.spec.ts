/**
 * Smoke suite for the M7 exit criteria (ROADMAP, spec §8.8): the
 * application journey in ≤ 2 clicks, the #/applications index rendering
 * the batch in both themes, the landing page's third entry point, and the
 * symptom pass retargets — all against the built dist/, like the M3/M4
 * journeys.
 */
import { expect, test } from '@playwright/test';

test('Application journey: search "PageRank" → application page → eigenvalues (2 clicks)', async ({
  page,
}) => {
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: 'What does your problem look like?' }),
  ).toBeVisible();

  // Type a domain name into the landing search; open the application — click 1.
  await page.locator('.search-hero .search-input').fill('PageRank');
  await page
    .locator('.search-hit')
    .filter({ hasText: 'PageRank and web search ranking' })
    .first()
    .click();
  await expect(page).toHaveURL(/#\/c\/pagerank$/);

  // The structure sentences are on the page, strengths attached: the
  // APPLIED-IN edges read from the application's side as "Makes use of".
  const uses = page.locator('.connection-group').filter({ hasText: 'Makes use of' });
  await expect(uses).toContainText('Markov chains and random walks');
  await expect(uses).toContainText('theorem');
  await expect(uses).toContainText('strong analogy');

  // A connected structure page — click 2.
  await uses.getByRole('link', { name: 'Eigenvalues and spectral decomposition' }).click();
  await expect(page).toHaveURL(/#\/c\/eigenvalues$/);
  await expect(page.getByRole('heading', { level: 1 })).toContainText(
    'Eigenvalues and spectral decomposition',
  );
});

test('applications index renders the whole batch, in both themes', async ({ page }) => {
  await page.goto('/#/applications');
  await expect(page.getByRole('heading', { name: 'Applications' })).toBeVisible();

  // The v1 template node plus the four M7 applications.
  const cards = page.locator('.application-card');
  await expect(cards).toHaveCount(5);
  await expect(cards.filter({ hasText: 'Biological regulation' })).toBeVisible();

  // Each card leads with the convergence: structure links + strength badges.
  const imaging = cards.filter({ hasText: 'Computational imaging' });
  await expect(imaging).toContainText('Where the structures meet:');
  await expect(imaging.getByRole('link', { name: 'Radon transform and tomography' })).toBeVisible();
  await expect(imaging).toContainText('theorem');

  // Dark theme: the index stays rendered and legible.
  const toggle = page.locator('.theme-toggle');
  await toggle.click(); // auto → light
  await toggle.click(); // light → dark
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(page.getByRole('heading', { name: 'Applications' })).toBeVisible();
  await expect(cards.filter({ hasText: 'PageRank' })).toBeVisible();
  await expect(imaging.getByRole('link', { name: 'Radon transform and tomography' })).toBeVisible();
});

test('the landing page gains applications as the third entry point', async ({ page }) => {
  await page.goto('/');
  const section = page
    .locator('.landing-section')
    .filter({ hasText: 'Or start from a real system' });
  await expect(section.getByRole('link', { name: 'browse all applications' })).toBeVisible();

  // Entries link straight into application pages, structures alongside.
  await expect(section).toContainText('Structures that meet here:');
  await section.getByRole('link', { name: 'Vascular branching and allometric scaling' }).click();
  await expect(page).toHaveURL(/#\/c\/vascular-branching$/);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Vascular branching');
});

test('symptom pass: retargeted and new worked examples route to applications', async ({ page }) => {
  // measurements-are-projections now works its example through the imaging
  // application instead of the bare transform.
  await page.goto('/#/s/measurements-are-projections');
  await page.getByRole('link', { name: 'Computational imaging (CT, SAR, MRI)' }).first().click();
  await expect(page).toHaveURL(/#\/c\/computational-imaging$/);

  // The M7-added recognition pattern exists and routes to PageRank.
  await page.goto('/#/s/ranking-network-importance');
  await expect(page.getByRole('heading', { level: 1 })).toContainText(
    'Ranking items by importance in a network',
  );
  await page.getByRole('link', { name: 'PageRank and web search ranking' }).first().click();
  await expect(page).toHaveURL(/#\/c\/pagerank$/);
});
