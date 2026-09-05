/**
 * Smoke suite for the M13 exit criteria (ROADMAP, UI_REDESIGN.md §2.1,
 * §4.1, §4.2): the Practitioner journey — search a domain term, read the
 * application's anatomy and derived assumption surface, reach a connected
 * structure in ≤ 2 clicks; Landing v4's field-grouped applications door
 * with the `af=` chip filter round-tripping through the URL; the survey
 * strip; and the symptom pass routing to the wave's worked examples. Runs
 * against the built dist/ like every suite since M3.
 */
import { expect, test } from '@playwright/test';

test('Practitioner journey: search "weather" → anatomy + assumption surface → Kalman filter (2 clicks)', async ({
  page,
}) => {
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: 'What does your problem look like?' }),
  ).toBeVisible();

  // The domain is the search term; open the application — click 1.
  await page.locator('.search-hero .search-input').fill('weather');
  await page
    .locator('.search-hit')
    .filter({ hasText: 'Weather prediction and data assimilation' })
    .first()
    .click();
  await expect(page).toHaveURL(/#\/c\/weather-prediction$/);

  // The anatomy leads: incoming structure claims grouped by the structure's
  // kind, each claim led by its role (the edge context), name second.
  const anatomy = page.locator('.concept-section.anatomy');
  await expect(anatomy.getByRole('heading', { name: 'Application anatomy' })).toBeVisible();
  const kinds = anatomy.locator('.anatomy-kind');
  await expect(kinds.filter({ hasText: 'Operation / representation' })).toBeVisible();
  await expect(kinds.filter({ hasText: 'Reusable move' })).toBeVisible();
  await expect(kinds.filter({ hasText: 'Canonical model' })).toBeVisible();
  await expect(kinds.filter({ hasText: 'Phenomenon' })).toBeVisible();

  // Roles first: the Kalman claim opens with its role lead, and the claim
  // sits inside the operations group with its strength attached.
  const opsGroup = anatomy
    .locator('.anatomy-group')
    .filter({ hasText: 'Operation / representation' });
  const kalmanClaim = opsGroup.locator('.anatomy-claim').filter({ hasText: 'Kalman filter' });
  await expect(kalmanClaim.locator('.anatomy-role')).toContainText('Data assimilation:');
  await expect(kalmanClaim).toContainText('theorem');
  await expect(
    anatomy.locator('.anatomy-claim').filter({ hasText: 'Deterministic chaos' }),
  ).toContainText('strong analogy');

  // The derived assumption surface beneath: the union of the connected
  // structures' ASSUMES claims, breakdown edges beside them.
  const surface = page.locator('.concept-section.assumption-surface');
  await expect(
    surface.getByRole('heading', { name: 'What this application leans on' }),
  ).toBeVisible();
  await expect(surface.locator('.derived-chip')).toHaveText('derived');
  const lean = surface.locator('.surface-item').filter({ hasText: 'Linearize it' }).first();
  await expect(lean).toContainText('assumes');
  await expect(
    lean.getByRole('link', { name: 'Continuity, smoothness, and their failure' }),
  ).toBeVisible();
  const breakdown = surface.locator('.surface-breakdown');
  await expect(breakdown).toContainText('fails in the presence of');
  await expect(breakdown.getByRole('link', { name: 'Bifurcation' })).toBeVisible();

  // A connected structure page — click 2.
  await opsGroup.getByRole('link', { name: 'Kalman filter' }).click();
  await expect(page).toHaveURL(/#\/c\/kalman-filter$/);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Kalman filter');
});

test('anatomy phrasing survives the M7 batch: MIGRATED-TO claims read as "imported"', async ({
  page,
}) => {
  // biological-regulation's incoming claims are MIGRATED-TO, not APPLIED-IN;
  // the anatomy keeps the schema's reverse phrasing so the edge type stays
  // recoverable from the sentence.
  await page.goto('/#/c/biological-regulation');
  const anatomy = page.locator('.concept-section.anatomy');
  await expect(
    anatomy.locator('.anatomy-claim').filter({ hasText: 'Feedback and loop structure' }),
  ).toContainText('imported');
  // The gap-edge hypotheses stay in the ordinary connections block, apart.
  await expect(page.locator('.connection-group.gap-group').first()).toBeVisible();
});

test('Landing v4: applications grouped by primary field, af= chip filter round-trips', async ({
  page,
}) => {
  // Deep link: the URL state renders filtered (the round-trip's read half).
  await page.goto('/#/?af=electromagnetics');
  const section = page.locator('#applications');
  await expect(section.locator('.app-field-label')).toHaveCount(1);
  await expect(section.locator('.app-field-label')).toContainText('RF & electromagnetics');
  const cards = section.locator('.application-entry');
  await expect(cards).toHaveCount(2);
  await expect(cards.filter({ hasText: 'Antenna design' })).toBeVisible();
  await expect(cards.filter({ hasText: 'Electric motor efficiency' })).toBeVisible();
  await expect(section.locator('.af-chip.active')).toContainText('RF & electromagnetics');

  // Each card keeps its thesis line: the structures that meet there.
  await expect(cards.filter({ hasText: 'Antenna design' })).toContainText(
    'Structures that meet here:',
  );

  // Chips filter in place and write the URL (the round-trip's write half).
  await section.locator('.af-chip').filter({ hasText: 'All fields' }).click();
  await expect(section.locator('.app-field-label').first()).toBeVisible();
  expect((await section.locator('.app-field-label').count()) > 1).toBe(true);
  await expect(page).toHaveURL(/#\/$/);

  await section.locator('.af-chip').filter({ hasText: 'Systems & mathematical biology' }).click();
  await expect(page).toHaveURL(/#\/\?af=biology$/);
  await expect(section.locator('.app-field-label')).toHaveCount(1);
  const bioCards = section.locator('.application-entry');
  await expect(bioCards.filter({ hasText: 'Vascular branching' })).toBeVisible();
  await expect(bioCards.filter({ hasText: 'Protein folding' })).toBeVisible();
  await expect(bioCards.filter({ hasText: 'Biological regulation' })).toBeVisible();

  // Symptom primacy untouched: the symptom section still leads the page.
  const sections = page.locator('.landing-section h2');
  await expect(sections.first()).toHaveText('Start from a symptom');
});

test('Landing v4: the survey strip links the analytical views', async ({ page }) => {
  await page.goto('/');
  const strip = page.locator('.survey-strip');
  await expect(strip.getByRole('heading', { name: 'Survey the whole atlas' })).toBeVisible();
  for (const label of ['Matrix', 'Map', 'Metrics', 'Questions', 'Queue']) {
    await expect(strip.getByRole('link', { name: label })).toBeVisible();
  }
  // One-phrase descriptions ride along; the links land on the views.
  await expect(strip).toContainText('every pair, absence included');
  await strip.getByRole('link', { name: 'Matrix' }).click();
  await expect(page).toHaveURL(/#\/matrix$/);
  await expect(page.getByRole('heading', { name: 'Matrix' })).toBeVisible();
});

test('symptom pass: the wave’s recognition patterns route to their worked examples', async ({
  page,
}) => {
  await page.goto('/#/s/model-drifts-from-data');
  await expect(page.getByRole('heading', { level: 1 })).toContainText(
    'A running model drifts away from measurements',
  );
  await page
    .getByRole('link', { name: 'Weather prediction and data assimilation' })
    .first()
    .click();
  await expect(page).toHaveURL(/#\/c\/weather-prediction$/);

  await page.goto('/#/s/misaligned-views');
  await page.getByRole('link', { name: 'Image registration and feature matching' }).first().click();
  await expect(page).toHaveURL(/#\/c\/image-registration$/);
});
