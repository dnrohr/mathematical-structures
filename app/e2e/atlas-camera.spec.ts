import { AxeBuilder } from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

async function camera(page: Page): Promise<{ x: number; y: number; scale: number }> {
  return page.locator('.atlas-svg').evaluate((svg) => ({
    x: Number(svg.getAttribute('data-camera-x')),
    y: Number(svg.getAttribute('data-camera-y')),
    scale: Number(svg.getAttribute('data-camera-scale')),
  }));
}

async function blankCanvasPoint(page: Page): Promise<{ x: number; y: number }> {
  return page.locator('.atlas-svg').evaluate((svg) => {
    const box = svg.getBoundingClientRect();
    for (let row = 1; row < 10; row += 1) {
      for (let column = 1; column < 10; column += 1) {
        const x = box.left + (box.width * column) / 10;
        const y = box.top + (box.height * row) / 10;
        if (document.elementFromPoint(x, y) === svg) return { x, y };
      }
    }
    throw new Error('Atlas SVG has no empty canvas point');
  });
}

test('Atlas camera supports bounded wheel zoom, empty-canvas pan, and deterministic fit', async ({
  page,
}) => {
  await page.goto('/#/atlas');
  const svg = page.locator('.atlas-svg');
  const node = page.locator('.atlas-node[data-slug="eigenvalues"]');
  const graph = (await (await page.request.get('data/graph.json')).json()) as {
    metrics: { layout: Record<string, [number, number]> };
  };
  const fixed = graph.metrics.layout.eigenvalues!;
  const fixedTransform = `translate(${fixed[0].toFixed(1)}, ${fixed[1].toFixed(1)})`;

  await expect(svg).toHaveAttribute('data-camera-scale', '1.0000');
  await expect(node).toHaveAttribute('transform', fixedTransform);

  const box = await svg.boundingBox();
  expect(box).not.toBeNull();
  await page.mouse.move(box!.x + box!.width * 0.35, box!.y + box!.height * 0.4);
  await page.mouse.wheel(0, -240);
  await expect.poll(async () => (await camera(page)).scale).toBeGreaterThan(1);
  const zoomed = await camera(page);
  expect(zoomed.scale).toBeLessThanOrEqual(6);
  await expect(node).toHaveAttribute('transform', fixedTransform);

  const blank = await blankCanvasPoint(page);
  await page.mouse.move(blank.x, blank.y);
  await page.mouse.down();
  await page.mouse.move(blank.x + 45, blank.y + 30, { steps: 4 });
  await page.mouse.up();
  const panned = await camera(page);
  expect({ x: panned.x, y: panned.y }).not.toEqual({ x: zoomed.x, y: zoomed.y });
  expect(panned.scale).toBe(zoomed.scale);
  await expect(node).toHaveAttribute('transform', fixedTransform);

  await page.getByRole('button', { name: 'Fit constellation' }).click();
  await expect(svg).toHaveAttribute('data-camera-scale', '1.0000');
  await expect(svg).toHaveAttribute('data-camera-x', '0.000');
  await expect(svg).toHaveAttribute('data-camera-y', '0.000');
});

test('Atlas distinguishes click from drag and preserves camera through focus state', async ({
  page,
}) => {
  await page.goto('/#/atlas');
  await page.getByRole('button', { name: 'Zoom in' }).click();
  const zoomed = await camera(page);
  expect(zoomed.scale).toBeGreaterThan(1);

  const node = page.locator('.atlas-node[data-slug="eigenvalues"]');
  const fixedTransform = await node.getAttribute('transform');
  const nodeBox = await node.locator('circle:not(.atlas-ring)').boundingBox();
  expect(nodeBox).not.toBeNull();
  await page.mouse.move(nodeBox!.x + nodeBox!.width / 2, nodeBox!.y + nodeBox!.height / 2);
  await page.mouse.down();
  await page.mouse.move(nodeBox!.x + nodeBox!.width / 2 + 12, nodeBox!.y + nodeBox!.height / 2);
  await page.mouse.up();
  await expect(page).toHaveURL(/#\/atlas$/);
  expect(await camera(page)).toEqual(zoomed);

  await node.click();
  await expect(page).toHaveURL(/focus=eigenvalues&depth=1$/);
  expect(await camera(page)).toEqual(zoomed);
  await page.getByRole('link', { name: '2 hop' }).click();
  await expect(page).toHaveURL(/depth=2$/);
  expect(await camera(page)).toEqual(zoomed);
  await page.locator('.lens-communities').check();
  await expect(page).toHaveURL(/communities=1/);
  expect(await camera(page)).toEqual(zoomed);

  await page.reload();
  await expect(page.locator('.atlas-svg')).toHaveAttribute('data-camera-scale', '1.0000');
  await expect(page.locator('.atlas-svg')).toHaveAttribute('data-camera-x', '0.000');
  await expect(page.locator('.atlas-node[data-slug="eigenvalues"]')).toHaveAttribute(
    'transform',
    fixedTransform!,
  );
});

test('Atlas camera controls are keyboard-operable and expose an axe-clean status', async ({
  page,
}) => {
  await page.goto('/#/atlas?focus=eigenvalues&depth=1');
  const zoomIn = page.getByRole('button', { name: 'Zoom in' });
  await zoomIn.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('.atlas-camera-status')).toHaveText(
    /^125% zoom, focused on Eigenvalues/,
  );
  await page.getByRole('button', { name: 'Zoom out' }).focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('.atlas-camera-status')).toHaveText(
    /^100% zoom, focused on Eigenvalues/,
  );
  await expect(page.getByRole('group', { name: 'Camera controls' })).toBeVisible();

  const results = await new AxeBuilder({ page }).include('.atlas-toolbar').analyze();
  expect(results.violations).toEqual([]);
});
