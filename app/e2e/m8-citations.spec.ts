/**
 * Smoke suite for the M8 exit criteria (ROADMAP, spec §8.2): citations
 * render wherever the owning edge renders — the compact marker on claim
 * sentences expands to the full reference, concept pages aggregate a
 * Sources list, and the edge-claim renderer (shared by the lens, path,
 * and open-questions views) carries the same affordance. The M5 dogfood
 * edge's literature trail must be visible as citations, not notes prose.
 */
import { expect, test } from '@playwright/test';

test('concept-page claims carry source markers that expand to full references', async ({
  page,
}) => {
  await page.goto('/#/c/pagerank');

  // The markov-chains APPLIED-IN claim cites two works.
  const uses = page.locator('.connection-group').filter({ hasText: 'Makes use of' });
  const claim = uses.locator('.connection').filter({ hasText: 'Markov chains' });
  const cite = claim.locator('details.cite');
  await expect(cite.locator('summary')).toHaveText(/2 sources/);

  // Collapsed by default; the expansion is the full formatted reference,
  // with the DOI carried as a link on the title.
  const reference = cite.locator('.reference').filter({ hasText: 'Anatomy of a Large-Scale' });
  await expect(reference).toBeHidden();
  await cite.locator('summary').click();
  await expect(reference).toBeVisible();
  await expect(reference).toContainText('Sergey Brin, Lawrence Page (1998)');
  await expect(reference).toContainText('Computer Networks and ISDN Systems 30(1–7), 107–117.');
  await expect(
    reference.getByRole('link', {
      name: 'The Anatomy of a Large-Scale Hypertextual Web Search Engine',
    }),
  ).toHaveAttribute('href', 'https://doi.org/10.1016/S0169-7552(98)00110-X');
});

test('the per-page Sources list aggregates every work the claims cite', async ({ page }) => {
  await page.goto('/#/c/pagerank');
  const sources = page.locator('.concept-section.sources');
  await expect(sources.getByRole('heading', { name: 'Sources' })).toBeVisible();
  // Three citing claims, five distinct works, each listed once.
  await expect(sources.locator('.reference')).toHaveCount(5);
  await expect(sources).toContainText("Google's PageRank and Beyond");
  await expect(sources).toContainText('Spectral Graph Theory');

  // A page whose claims cite nothing renders no Sources section.
  await page.goto('/#/c/bayes-rule');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Bayes');
  await expect(page.locator('.concept-section.sources')).toHaveCount(0);
});

test('the M5 dogfood edge carries its literature trail as citations (both themes)', async ({
  page,
}) => {
  await page.goto('/#/c/stability-margins');
  const migrated = page
    .locator('.connection-group')
    .filter({ hasText: 'Historically migrated into' });
  const cite = migrated.locator('details.cite');
  await expect(cite.locator('summary')).toHaveText(/6 sources/);
  await cite.locator('summary').click();
  await expect(cite).toContainText('Biomolecular Feedback Systems');
  await expect(cite).toContainText('Feedback Control in Systems Biology');
  await expect(cite).toContainText('Antithetic Integral Feedback');
  await expect(cite).toContainText('Secant Criterion');

  // Dark theme: the marker and the expanded references stay rendered.
  const toggle = page.locator('.theme-toggle');
  await toggle.click(); // auto → light
  await toggle.click(); // light → dark
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(cite.locator('summary')).toBeVisible();
  await expect(cite).toContainText('Biomolecular Feedback Systems');
});

test('the shared edge-claim renderer (lens, path, questions) carries citations', async ({
  page,
}) => {
  // The lens claim list uses the same edgeClaim fragment as #/questions,
  // so a checked gap edge's trail renders there the moment one exists.
  await page.goto('/#/lens?edge=MIGRATED-TO');
  const claim = page.locator('.connection.claim').filter({ hasText: 'Gain and phase margins' });
  await expect(claim.locator('details.cite summary')).toHaveText(/6 sources/);
  await claim.locator('details.cite summary').click();
  await expect(claim).toContainText('Del Vecchio');

  // Claims without evidence render no marker at all.
  await page.goto('/#/lens?edge=SAME-SKELETON');
  await expect(page.locator('.connection.claim').first()).toBeVisible();
  await expect(page.locator('details.cite')).toHaveCount(0);
});
