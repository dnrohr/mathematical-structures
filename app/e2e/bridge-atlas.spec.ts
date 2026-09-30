import { AxeBuilder } from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('Bridge Atlas renders emitted geography and exact claim drill-down', async ({ page }) => {
  await page.goto('/#/atlas');
  await page.getByRole('link', { name: 'Bridge overview' }).click();
  await expect(page).toHaveURL(/#\/atlas\?layout=bridges$/);
  await expect(page.getByRole('link', { name: 'Concept map' })).toHaveAttribute('href', '#/atlas');
  const data = await page.evaluate(async () => (await fetch('/data/graph.json')).json());
  await expect(page.getByRole('heading', { name: 'Bridge Atlas' })).toBeVisible();
  await expect(page.locator('.bridge-territory')).toHaveCount(
    data.metrics.bridge_atlas.communities.length,
  );
  await expect(page.locator('.bridge-line')).toHaveCount(data.metrics.bridge_atlas.bridges.length);
  await expect(page.locator('.bridge-line[marker-end]')).toHaveCount(0);
  await expect(page.locator('.bridge-pair-table tbody tr')).toHaveCount(
    data.metrics.bridge_atlas.bridges.length,
  );

  const first = data.metrics.bridge_atlas.bridges[0];
  const key = `${String(first.source_community)}-${String(first.target_community)}`;
  await page.locator(`[data-bridge="${key}"]`).click();
  await expect(page).toHaveURL(new RegExp(`bridge=${key}$`));
  await expect(page.locator('.bridge-inspector li.connection')).toHaveCount(
    first.trusted_edge_count,
  );
  for (const index of first.edge_indexes) {
    const edge = data.edges[index];
    const from = data.nodes.find(
      (node: { slug: string }) => node.slug === edge.from,
    ).canonical_name;
    const to = data.nodes.find((node: { slug: string }) => node.slug === edge.to).canonical_name;
    await expect(page.locator('.bridge-inspector')).toContainText(from);
    await expect(page.locator('.bridge-inspector')).toContainText(to);
  }
  await expect(page.locator('.bridge-exact-count')).toHaveText(
    `${String(first.trusted_edge_count)} trusted claim${first.trusted_edge_count === 1 ? '' : 's'}`,
  );
  const representative = data.edges[first.edge_indexes[0]];
  await expect(page.getByRole('link', { name: 'Audit in matrix' })).toHaveAttribute(
    'href',
    `#/matrix?a=${representative.from}&b=${representative.to}`,
  );
  await expect(page.getByRole('link', { name: 'Focus an endpoint' })).toHaveAttribute(
    'href',
    `#/atlas?focus=${representative.from}&depth=1`,
  );
  await page.reload();
  await expect(page.locator('.bridge-inspector li.connection')).toHaveCount(
    first.trusted_edge_count,
  );

  await page.goto('/#/atlas?layout=bridges&bridge=90-91');
  await expect(page).toHaveURL(/#\/atlas\?layout=bridges$/);
  await expect(page.locator('.bridge-inspector')).toHaveCount(0);
});

test('Bridge Atlas filters before aggregation and guards frontier meaning', async ({ page }) => {
  await page.goto('/#/atlas?layout=bridges');
  const data = await page.evaluate(async () => (await fetch('/data/graph.json')).json());
  const presentType = Object.keys(data.metrics.bridge_atlas.bridges[0].type_counts)[0];
  await page.goto(`/#/atlas?layout=bridges&edge=${presentType}`);
  const rows = page.locator('.bridge-pair-table tbody tr');
  expect(await rows.count()).toBeGreaterThan(0);
  const button = rows.first().locator('button');
  const count = Number((await button.textContent())?.match(/^\d+/)?.[0] ?? 0);
  await button.click();
  await expect(page.locator('.bridge-inspector li.connection')).toHaveCount(count);
  await expect(page.locator('.bridge-inspector li.connection .phrase')).toHaveCount(count);

  await page.goto(`/#/atlas?layout=bridges&mode=frontiers&edge=${presentType}`);
  await expect(page.locator('.bridge-frontier-caption')).toContainText('not evidence');
  await page.locator('.bridge-pair-table tbody button').first().click();
  await expect(page.locator('.bridge-inspector')).toContainText(/No (visible )?trusted edge/);
  await expect(page.locator('.bridge-inspector')).toContainText('does not propose');
  await expect(page.locator('.bridge-inspector')).not.toContainText('Add edge');
});

test('Bridge Atlas is keyboard-operable, responsive, and axe-clean in both themes', async ({
  page,
}) => {
  for (const theme of ['light', 'dark'] as const) {
    await page.emulateMedia({ colorScheme: theme });
    await page.goto('/#/atlas?layout=bridges');
    const button = page.locator('.bridge-pair-table tbody button').first();
    await button.focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('.bridge-inspector')).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(button).toBeFocused();
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/#/atlas?layout=bridges');
  await expect(page.locator('.bridge-map')).toBeVisible();
  await expect(page.locator('.bridge-pair-table tbody button').first()).toBeVisible();
});
