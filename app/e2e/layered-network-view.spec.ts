import { AxeBuilder } from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

interface GraphData {
  nodes: { slug: string; node_type: string; fields: string[] }[];
  edges: { from: string; to: string; type: string; strength: string; symmetric: boolean }[];
  schema: {
    strengths: { id: string; rank: number }[];
    fields: { id: string; label: string }[];
    analysis: { trusted_min_strength: string };
  };
}

const PRIMARY = new Set([
  'REPRESENTED-BY',
  'EXPOSES',
  'SYMMETRY-SELECTS-REPRESENTATION',
  'SOLVED-BY',
  'APPLIED-IN',
  'GOVERNS',
  'MEASURES-DISTANCE-TO',
  'MIGRATED-TO',
]);

async function graph(page: Page): Promise<GraphData> {
  return (await (await page.request.get('data/graph.json')).json()) as GraphData;
}

function trusted(data: GraphData): GraphData['edges'] {
  const rank = new Map(data.schema.strengths.map((item) => [item.id, item.rank]));
  const floor = rank.get(data.schema.analysis.trusted_min_strength)!;
  return data.edges.filter((edge) => (rank.get(edge.strength) ?? 99) <= floor);
}

test('flow overview preserves exact directed claims, routes long and backward edges, and labels field groups', async ({
  page,
}) => {
  await page.goto('/#/atlas?layout=flow');
  const data = await graph(page);
  const edges = trusted(data);
  const trustedNodes = new Set(edges.flatMap((edge) => [edge.from, edge.to]));
  const primary = edges.filter((edge) => PRIMARY.has(edge.type));

  await expect(page).toHaveURL(/#\/atlas\?layout=flow$/);
  await expect(page.getByRole('heading', { name: 'Structure to Use' })).toBeVisible();
  await expect(page.locator('.flow-layer-heading')).toHaveText([
    'Foundation',
    'Form',
    'Method',
    'Behavior',
    'Application',
  ]);
  await expect(page.locator('.flow-node')).toHaveCount(trustedNodes.size);
  await expect(page.locator('.flow-edge')).toHaveCount(primary.length);
  await expect(page.locator('.flow-readable li.connection')).toHaveCount(primary.length);
  expect(await page.locator('.flow-edge.route-long').count()).toBeGreaterThan(0);
  expect(await page.locator('.flow-edge.route-backward').count()).toBeGreaterThan(0);
  expect(await page.locator('.flow-edge.route-same-layer').count()).toBeGreaterThan(0);
  const columnRows = await page.locator('.flow-node').evaluateAll((nodes) => {
    const byLayer = new Map<string, number[]>();
    for (const node of nodes) {
      const layer = node.getAttribute('data-layer')!;
      const y = Number(node.getAttribute('transform')!.match(/translate\([^ ]+ ([^)]+)\)/)![1]);
      const rows = byLayer.get(layer) ?? [];
      rows.push(y);
      byLayer.set(layer, rows);
    }
    return Object.fromEntries(byLayer);
  });
  const extents = Object.values(columnRows).map((rows) => [rows[0], rows.at(-1)]);
  expect(new Set(extents.map(([first]) => first)).size).toBe(1);
  expect(new Set(extents.map(([, last]) => last)).size).toBe(1);
  for (const rows of Object.values(columnRows)) {
    const gaps = rows.slice(1).map((row, index) => row - rows[index]!);
    expect(Math.max(...gaps) - Math.min(...gaps)).toBeLessThan(0.001);
  }
  const backwardGeometry = await page
    .locator('.flow-edge.route-backward .edge-line')
    .evaluateAll((paths) =>
      paths.map((path) =>
        [...path.getAttribute('d')!.matchAll(/-?\d+(?:\.\d+)?/g)].map((match) => Number(match[0])),
      ),
    );
  for (const [, startY, , controlY1, , controlY2, , endY] of backwardGeometry) {
    expect(controlY1).toBe(controlY2);
    expect(controlY1).toBeGreaterThanOrEqual(Math.min(startY!, endY!) - 100);
    expect(controlY1).toBeLessThanOrEqual(Math.max(startY!, endY!) + 100);
  }
  const parallelRoutes = await page.locator('.flow-edge').evaluateAll((groups) => {
    const pairs = new Map<string, string[]>();
    for (const group of groups) {
      const [from, to] = group.getAttribute('data-edge')!.split('|');
      const key = [from, to].sort().join('|');
      const routes = pairs.get(key) ?? [];
      routes.push(group.querySelector('.edge-line')!.getAttribute('d')!);
      pairs.set(key, routes);
    }
    return [...pairs.values()].filter((routes) => routes.length > 1);
  });
  expect(parallelRoutes.length).toBeGreaterThan(0);
  expect(parallelRoutes.every((routes) => new Set(routes).size === routes.length)).toBe(true);

  const labels = new Map(data.schema.fields.map((field) => [field.id, field.label]));
  const expectedGroups = [
    ...new Set(
      data.nodes
        .filter((node) => trustedNodes.has(node.slug) && node.node_type === 'application')
        .map((node) => labels.get(node.fields[0]!)!),
    ),
  ].sort();
  await expect(page.locator('.flow-group-label')).toHaveText(expectedGroups);

  const directed = page.locator('.flow-edge[data-symmetric="false"]').first();
  await expect(directed.locator('.edge-line')).toHaveClass(/directed/);
  expect(
    await directed.locator('.edge-line').evaluate((line) => getComputedStyle(line).markerEnd),
  ).toContain('arrow');
});

test('flow focus retains positions and URL state while exposing directed and symmetric semantics', async ({
  page,
}) => {
  await page.goto('/#/atlas?layout=flow&group=community');
  await expect(page.locator('.flow-node').first()).toBeVisible();
  const before = await page
    .locator('.flow-node')
    .evaluateAll((nodes) =>
      Object.fromEntries(
        nodes.map((node) => [node.getAttribute('data-slug'), node.getAttribute('transform')]),
      ),
    );
  await page.goto('/#/atlas?layout=flow&focus=brownian-motion&depth=1&group=community');
  await expect(page).toHaveURL(/layout=flow&focus=brownian-motion&depth=1&group=community$/);
  await expect(page.locator('.flow-node.focus-node')).toHaveCount(1);
  await expect(page.locator('.flow-group-label').first()).toContainText('Community');

  const after = await page
    .locator('.flow-node')
    .evaluateAll((nodes) =>
      Object.fromEntries(
        nodes.map((node) => [node.getAttribute('data-slug'), node.getAttribute('transform')]),
      ),
    );
  expect(after).toEqual(before);
  const symmetric = page.locator('.flow-edge[data-symmetric="true"]').first();
  await expect(symmetric).toHaveCount(1);
  await expect(symmetric.locator('.edge-line')).not.toHaveClass(/directed/);
  expect(
    await symmetric.locator('.edge-line').evaluate((line) => getComputedStyle(line).markerEnd),
  ).toBe('none');
  await expect(page.locator('.flow-inspector .connection')).toHaveCount(
    await page.locator('.flow-edge').count(),
  );

  await page.getByRole('link', { name: '2 hop' }).click();
  await expect(page).toHaveURL(/layout=flow&focus=brownian-motion&depth=2&group=community$/);
  await page.reload();
  await expect(page.getByRole('link', { name: '2 hop' })).toHaveAttribute('aria-current', 'page');
  await page.getByLabel('Application grouping').selectOption('none');
  await expect(page).toHaveURL(/layout=flow&focus=brownian-motion&depth=2&group=none$/);
  await expect(page.locator('.flow-group-label')).toHaveCount(0);
});

test('flow node and edge hover/keyboard paths produce the same readable caption', async ({
  page,
}) => {
  await page.goto('/#/atlas?layout=flow&focus=brownian-motion&depth=1');
  const node = page.locator('.flow-node[data-slug="brownian-motion"]');
  await node.hover();
  const hoverNodeCaption = await page.locator('.flow-caption').textContent();
  await node.focus();
  await expect(page.locator('.flow-caption')).toHaveText(hoverNodeCaption!);

  const edge = page.locator('.flow-edge').first();
  await edge.dispatchEvent('mouseenter');
  const hoverEdgeCaption = await page.locator('.flow-caption').textContent();
  expect(hoverEdgeCaption).toBe(await edge.getAttribute('aria-label'));
  await edge.focus();
  await expect(page.locator('.flow-caption')).toHaveText(hoverEdgeCaption!);
});

test('flow stays page-width safe on narrow screens and is axe-clean in light and dark themes', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const theme of ['light', 'dark'] as const) {
    await page.addInitScript((value) => localStorage.setItem('atlas-theme', value), theme);
    await page.goto('/#/atlas?layout=flow&focus=brownian-motion&depth=1');
    await expect(page.locator('.flow-scroll')).toBeVisible();
    const dimensions = await page.evaluate(() => ({
      page: document.documentElement.scrollWidth,
      viewport: window.innerWidth,
      surface: document.querySelector<HTMLElement>('.flow-scroll')!.scrollWidth,
      visibleSurface: document.querySelector<HTMLElement>('.flow-scroll')!.clientWidth,
    }));
    expect(dimensions.page).toBeLessThanOrEqual(dimensions.viewport);
    expect(dimensions.surface).toBeGreaterThan(dimensions.visibleSurface);
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    expect(results.violations.map((violation) => violation.id)).toEqual([]);
  }
});
