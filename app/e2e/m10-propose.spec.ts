/**
 * Smoke suite for the M10 exit criterion (ROADMAP, spec §8.1): from a
 * concept page and from #/questions, "propose an edge" reaches a prefilled
 * GitHub issue carrying the claim in machine-usable form
 * (from/to/type/strength/context) — no server, no accounts on this side.
 * Run against the built dist/, like the earlier milestone suites; the
 * GitHub link itself is asserted, never followed.
 */
import { expect, test } from '@playwright/test';

const ISSUES_NEW = 'https://github.com/dnrohr/mathematical-structures/issues/new';

test('concept page → composer → prefilled issue URL (the M10 exit criterion)', async ({ page }) => {
  await page.goto('/#/c/eigenvalues');
  await page.locator('.propose-line').getByRole('link', { name: 'Propose an edge' }).click();
  await expect(page).toHaveURL(/#\/propose\?from=eigenvalues$/);

  // The entry link prefilled the from-picker; the composer says what's left.
  await expect(page.locator('.propose-from')).toHaveValue('eigenvalues');
  await expect(page.locator('.propose-missing')).toContainText(
    'a to-concept, an edge type, a strength',
  );

  // Compose the rest of the claim from the schema-constrained pickers.
  await page.locator('.propose-to').selectOption('phase-space');
  await page.locator('.propose-type').selectOption('GOVERNS');
  await page.locator('.propose-strength').selectOption('theorem');
  await page
    .locator('.propose-context')
    .fill('the Jacobian spectrum classifies flow near fixed points');

  // The preview reads as a claim with its strength, like everywhere else.
  const previewClaim = page.locator('.propose-claim .connection');
  await expect(previewClaim).toContainText('Eigenvalues and spectral decomposition');
  await expect(previewClaim).toContainText('governs');
  await expect(previewClaim).toContainText('Phase space and nonlinear dynamics');
  await expect(previewClaim.locator('.strength')).toHaveText('theorem');

  // The yaml block is the exact edges.yaml entry the proposal lands as.
  await expect(page.locator('.propose-yaml')).toContainText('- from: eigenvalues');

  // The file link deep-links the issue form with the claim in
  // machine-usable form: template + title + claim sentence + yaml block.
  const href = await page.locator('a.propose-file').getAttribute('href');
  const url = new URL(href!);
  expect(url.origin + url.pathname).toBe(ISSUES_NEW);
  expect(url.searchParams.get('template')).toBe('edge-proposal.yml');
  expect(url.searchParams.get('title')).toBe('edge: eigenvalues —GOVERNS→ phase-space');
  expect(url.searchParams.get('claim')).toBe(
    'Eigenvalues and spectral decomposition governs Phase space and nonlinear dynamics ' +
      '(theorem, the Jacobian spectrum classifies flow near fixed points)',
  );
  expect(url.searchParams.get('edge')).toBe(
    [
      '- from: eigenvalues',
      '  to: phase-space',
      '  type: GOVERNS',
      '  strength: theorem',
      '  context: "the Jacobian spectrum classifies flow near fixed points"',
    ].join('\n'),
  );
});

test('candidate-queue pair → composer with the pair filled in; state round-trips', async ({
  page,
}) => {
  // The candidate-edge list moved from #/questions to its M11 sibling,
  // #/queue (UI_REDESIGN.md §4.6); the propose entry point moved with it.
  // The M16 triage drained the queue to its two recorded defers; the
  // radon-transform ↔ greens-function pair is the composer fixture now
  // (bayes-rule ↔ computational-imaging, the old fixture, became an edge).
  await page.goto('/#/queue');
  const candidate = page.locator('.candidate-list li', { hasText: 'Radon' }).first();
  await expect(candidate).toContainText("Green's functions");
  await candidate.getByRole('link', { name: 'propose' }).click();
  await expect(page).toHaveURL(/#\/propose\?from=greens-function&to=radon-transform$/);
  await expect(page.locator('.propose-from')).toHaveValue('greens-function');
  await expect(page.locator('.propose-to')).toHaveValue('radon-transform');

  // Swap flips the direction and writes it to the URL.
  await page.locator('.propose-swap').click();
  await expect(page).toHaveURL(/#\/propose\?from=radon-transform&to=greens-function$/);
  await page.locator('.propose-swap').click();
  await expect(page.locator('.propose-from')).toHaveValue('greens-function');

  // Completing the draft keeps the whole state in the URL (§5.2)…
  await page.locator('.propose-type').selectOption('APPLIED-IN');
  await page.locator('.propose-strength').selectOption('strong-analogy');
  await expect(page).toHaveURL(
    /#\/propose\?from=greens-function&to=radon-transform&type=APPLIED-IN&strength=strong-analogy$/,
  );
  // …and the chosen strength surfaces its schema description.
  await expect(page.locator('.strength-hint')).toContainText('Established correspondence');

  // …so a reload restores the composed proposal, file link included.
  await page.reload();
  await expect(page.locator('.propose-type')).toHaveValue('APPLIED-IN');
  await expect(page.locator('.propose-strength')).toHaveValue('strong-analogy');
  const href = await page.locator('a.propose-file').getAttribute('href');
  expect(href).toContain(new URL(ISSUES_NEW).pathname);
});

test('epistemic guardrails: duplicates surfaced, gap machinery routed to its own form', async ({
  page,
}) => {
  // A pair the map already connects: both standing claims are shown, and
  // proposing the same type again is called out as a validation failure.
  await page.goto('/#/propose?from=eigenvalues&to=markov-chains&type=GOVERNS&strength=theorem');
  const existing = page.locator('.propose-existing');
  await expect(existing.getByRole('heading', { name: 'Already on the map' })).toBeVisible();
  await expect(existing.locator('.connection')).toHaveCount(2);
  await expect(existing).toContainText('an exact duplicate fails validation');

  // Gap hypotheses are not composable here: no POSSIBLE-MISSING-MIGRATION
  // type, no speculative strength — the gap issue form is linked instead.
  const typeOptions = await page.locator('.propose-type option').allTextContents();
  expect(typeOptions.join()).not.toContain('missing migration');
  const strengthOptions = await page.locator('.propose-strength option').allTextContents();
  expect(strengthOptions.join()).not.toContain('speculative');
  const gapLink = page.locator('.propose-gap-note a');
  await expect(gapLink).toHaveAttribute('href', /issues\/new\?template=gap-proposal\.yml$/);

  // Unknown URL values are dropped, not rendered (stale or mistyped links).
  await page.goto('/#/propose?from=not-a-slug&type=NOT-A-TYPE&strength=speculative');
  await expect(page.locator('.propose-from')).toHaveValue('');
  await expect(page.locator('.propose-type')).toHaveValue('');
  await expect(page.locator('.propose-strength')).toHaveValue('');
  await expect(page.locator('.propose-missing')).toContainText('a from-concept');
});
