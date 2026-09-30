import { AxeBuilder } from '@axe-core/playwright';
import { expect, test, type Locator, type Page } from '@playwright/test';

async function markerEnd(line: Locator): Promise<string> {
  return line.evaluate((element) => getComputedStyle(element).markerEnd);
}

async function nodeTransform(page: Page, slug: string): Promise<string | null> {
  return page.locator(`.atlas-node[data-slug="${slug}"]`).getAttribute('transform');
}

test('focused Atlas edges expose incident and context attention without changing semantics', async ({
  page,
}) => {
  await page.goto('/#/atlas?focus=diffusion&depth=1');

  const outgoing = page.locator('.graph-edge[data-attention="outgoing-focus"]');
  const incoming = page.locator('.graph-edge[data-attention="incoming-focus"]');
  const symmetric = page.locator('.graph-edge[data-attention="focus-adjacent"]');
  const context = page.locator('.graph-edge[data-attention="context"]');
  await expect(outgoing.first()).toBeVisible();
  await expect(incoming.first()).toBeVisible();
  await expect(symmetric.first()).toBeVisible();
  await expect(context.first()).toBeVisible();

  for (const incident of [outgoing, incoming, symmetric]) {
    const edges = await incident.evaluateAll((groups) =>
      groups.map((group) => group.getAttribute('data-edge')),
    );
    expect(edges.every((edge) => edge?.split('|').slice(0, 2).includes('diffusion'))).toBe(true);
  }
  const contextEdges = await context.evaluateAll((groups) =>
    groups.map((group) => group.getAttribute('data-edge')),
  );
  expect(contextEdges.every((edge) => !edge?.split('|').slice(0, 2).includes('diffusion'))).toBe(
    true,
  );

  expect(await markerEnd(outgoing.locator('.edge-line.directed').first())).toContain('arrow-focus');
  await expect(symmetric.locator('.edge-line.directed')).toHaveCount(0);
  expect(await markerEnd(symmetric.locator('.edge-line').first())).toBe('none');
  await expect(page.getByRole('heading', { name: 'Outgoing claims' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Incoming claims' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Undirected claims' })).toBeVisible();
});

test('hover and keyboard focus share high-contrast direction and readable feedback', async ({
  page,
}) => {
  await page.goto('/#/atlas?focus=diffusion&depth=1');
  const edge = page
    .locator('.graph-edge[data-attention="context"]:has(.edge-line.directed)')
    .first();
  const line = edge.locator('.edge-line');
  const sentence = await edge.getAttribute('aria-label');
  expect(sentence).toBeTruthy();

  await edge.dispatchEvent('mouseenter');
  await expect(page.locator('.graph-caption')).toHaveText(sentence!);
  expect(await markerEnd(line)).toContain('arrow-focus');
  expect(await edge.evaluate((element) => getComputedStyle(element).opacity)).toBe('1');

  await edge.dispatchEvent('mouseleave');
  await edge.focus();
  await expect(page.locator('.graph-caption')).toHaveText(sentence!);
  expect(await markerEnd(line)).toContain('arrow-focus');
  expect(await edge.evaluate((element) => getComputedStyle(element).opacity)).toBe('1');
});

test('camera zoom compensates marker size and leaves metrics.layout translations fixed', async ({
  page,
}) => {
  await page.goto('/#/atlas?focus=diffusion&depth=1');
  const svg = page.locator('.atlas-svg');
  const markers = page.locator('.graph-arrow');
  const graph = (await (await page.request.get('data/graph.json')).json()) as {
    metrics: { layout: Record<string, [number, number]> };
  };
  const fixed = graph.metrics.layout.diffusion!;
  const expectedTransform = `translate(${fixed[0].toFixed(1)}, ${fixed[1].toFixed(1)})`;

  await expect(markers.first()).toHaveAttribute('viewBox', '0 0 10 8');
  await expect(markers.first()).toHaveAttribute('markerWidth', '10.0000');
  await expect(markers.first()).toHaveAttribute('markerHeight', '8.0000');
  await expect(page.locator('.graph-arrow path').first()).toHaveCSS('paint-order', 'stroke');
  await expect(page.locator('.atlas-node[data-slug="diffusion"]')).toHaveAttribute(
    'transform',
    expectedTransform,
  );

  for (let step = 0; step < 10; step += 1) {
    await page.getByRole('button', { name: 'Zoom in' }).click();
  }
  await expect(svg).toHaveAttribute('data-camera-scale', '6.0000');
  await expect(markers.first()).toHaveAttribute('markerWidth', '1.6667');
  await expect(markers.first()).toHaveAttribute('markerHeight', '1.3333');
  expect(await nodeTransform(page, 'diffusion')).toBe(expectedTransform);

  await page.getByRole('button', { name: 'Fit constellation' }).click();
  await expect(markers.first()).toHaveAttribute('markerWidth', '10.0000');
  await page.getByRole('link', { name: '2 hop' }).click();
  expect(await nodeTransform(page, 'diffusion')).toBe(expectedTransform);
  await expect(markers.first()).toHaveAttribute('markerWidth', '10.0000');
});

test('focused Atlas remains axe-clean in light and dark themes', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('atlas-theme', 'light'));
  await page.goto('/#/atlas?focus=diffusion&depth=1');
  const scan = () =>
    new AxeBuilder({ page })
      .include('.atlas-toolbar')
      .include('.graph-atlas')
      .include('.atlas-inspector')
      .analyze();
  expect((await scan()).violations).toEqual([]);

  await page.evaluate(() => {
    localStorage.setItem('atlas-theme', 'dark');
    document.documentElement.dataset.theme = 'dark';
  });
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  expect((await scan()).violations).toEqual([]);
});
