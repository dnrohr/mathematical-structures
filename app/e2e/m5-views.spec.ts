/**
 * Smoke suite for the M5 exit criteria (ROADMAP, spec §11): every
 * speculative edge listable with its workflow status in one view; the
 * dataset exportable in one action; metrics visibly computed on the
 * trusted-strength subgraph only — plus the community coloring toggle in
 * the lens and URL-carried ranking state.
 */
import { expect, test } from '@playwright/test';

interface GraphData {
  edges: { type: string; strength: string; status?: string }[];
  metrics: { community_count: number };
}

test('metrics: rankings on the trusted subgraph, and it says so', async ({ page }) => {
  await page.goto('/#/metrics');

  // The epistemic statement is an exit criterion, not decoration.
  const note = page.locator('.trusted-note');
  await expect(note).toContainText('Computed on the trusted subgraph only');
  await expect(note).toContainText('special case');

  // Default ranking: hubs (degree), descending — the spectral hub leads.
  const rows = page.locator('.metrics-table tbody tr');
  expect(await rows.count()).toBeGreaterThan(30);
  await expect(rows.first()).toContainText('Eigenvalues and spectral decomposition');
  await expect(page.locator('th[aria-sort="descending"]')).toContainText('Hub');

  // Sorting is shareable: click Bridge → URL carries it → reload restores it.
  await page.getByRole('button', { name: 'Bridge' }).click();
  await expect(page).toHaveURL(/#\/metrics\?sort=betweenness$/);
  await expect(page.locator('th[aria-sort="descending"]')).toContainText('Bridge');
  await page.reload();
  await expect(page.locator('th[aria-sort="descending"]')).toContainText('Bridge');
  await expect(rows.first()).toContainText('Eigenvalues');

  // Ascending toggle also lives in the URL.
  await page.getByRole('button', { name: 'Bridge' }).click();
  await expect(page).toHaveURL(/#\/metrics\?sort=betweenness&dir=asc$/);
});

test('metrics: the community partition is rendered as text with labeled chips', async ({
  page,
}) => {
  await page.goto('/#/metrics');
  const data = (await (await page.request.get('data/graph.json')).json()) as GraphData;
  const cards = page.locator('.community-card');
  await expect(cards).toHaveCount(data.metrics.community_count);
  await expect(cards.first().locator('.community-chip')).toHaveText('C0');
  // Nodes held only by analogy/hypothesis are named, not silently dropped.
  await expect(page.locator('.communities')).toContainText('outside the trusted subgraph');
});

test('the dataset is exportable in one action, all four artifacts served', async ({ page }) => {
  await page.goto('/#/metrics');
  const links = page.locator('.download-list a');
  await expect(links).toHaveCount(4);

  for (const name of ['graph.json', 'atlas.graphml', 'nodes.csv', 'edges.csv']) {
    await expect(links.filter({ hasText: name })).toHaveAttribute('download', name);
    const res = await page.request.get(`data/${name}`);
    expect(res.status(), name).toBe(200);
  }
  expect(await (await page.request.get('data/atlas.graphml')).text()).toContain('<graphml');
  expect(await (await page.request.get('data/nodes.csv')).text()).toMatch(/^slug,canonical_name/);
});

test('open questions: every speculative edge listed with workflow status (spec §11)', async ({
  page,
}) => {
  await page.goto('/#/questions');
  const data = (await (await page.request.get('data/graph.json')).json()) as GraphData;
  const gapCount = data.edges.filter(
    (e) => e.type === 'POSSIBLE-MISSING-MIGRATION' || e.strength === 'speculative',
  ).length;
  expect(gapCount).toBeGreaterThan(0);

  // One view, all of them, grouped by status, each claim carrying its chip.
  const claims = page.locator('.gap-group .connection');
  await expect(claims).toHaveCount(gapCount);
  expect(await page.locator('.gap-group .gap-status').count()).toBe(gapCount);
  await expect(page.locator('.gap-group h2').first()).toContainText('open candidate');

  // The claims read as unverified hypotheses, never as findings.
  await expect(claims.first()).toContainText('unverified');
  await expect(claims.first().locator('.strength')).toContainText('speculative');

  // The §35 checklist and the workflow doc link.
  expect(await page.locator('.workflow-steps li').count()).toBeGreaterThanOrEqual(6);
  await expect(page.locator('.workflow a[href$="docs/research-gap-workflow.md"]')).toBeVisible();

  // Export is one action from here too. (The candidate-edge queue moved to
  // its M11 sibling, #/queue — covered in m11-queue.spec.ts.)
  await expect(page.locator('.download-list a').first()).toContainText('graph.json');
});

test('lens: community coloring is a URL-carried toggle', async ({ page }) => {
  await page.goto('/#/lens?edge=GOVERNS');
  await expect(page.locator('.graph-view')).toBeVisible();
  // Type coloring by default: no community tokens on nodes, no legend.
  await expect(page.locator('.community-legend')).toHaveCount(0);

  await page.getByLabel('Color by community').check();
  await expect(page).toHaveURL(/#\/lens\?edge=GOVERNS&communities=1$/);
  await expect(page.locator('.community-legend')).toBeVisible();
  const styles = await page
    .locator('.graph-node')
    .evaluateAll((nodes) => nodes.map((n) => n.getAttribute('style') ?? ''));
  expect(styles.some((s) => s.includes('--community-'))).toBe(true);

  // Round-trip: the shared URL restores the toggle and the coloring.
  await page.reload();
  await expect(page.getByLabel('Color by community')).toBeChecked();
  await expect(page.locator('.community-legend')).toBeVisible();
});
