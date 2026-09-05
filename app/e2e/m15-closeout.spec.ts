/**
 * Smoke suite for the M15 exit criteria (ROADMAP, UI_REDESIGN.md §4.2 and
 * §4.9): the assumption trail — the transitive ASSUMES chain behind a
 * disclosure, absent where the one-hop list already is the chain, skipped
 * by the arrow-hop while folded — and fixed coordinates: a lens covering
 * most of the graph pins to the atlas constellation (proven against the
 * emitted layout, uniform in both axes), the ego pin stays opt-in. The
 * fork seam itself is a build-layer criterion, proven in
 * build/test/cli.test.ts rather than here.
 */
import { AxeBuilder } from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

interface GraphData {
  nodes: { slug: string }[];
  metrics: { layout: Record<string, [number, number]> };
}

async function loadGraph(page: Page): Promise<GraphData> {
  return (await (await page.request.get('data/graph.json')).json()) as GraphData;
}

/** Rendered node centers by slug, from the figure's SVG transforms. */
async function drawnPositions(
  page: Page,
  figure: string,
): Promise<Record<string, [number, number]>> {
  return page.evaluate((sel) => {
    const out: Record<string, [number, number]> = {};
    for (const el of document.querySelectorAll(`${sel} .graph-node`)) {
      const href = el.getAttribute('href') ?? '';
      const m = /translate\(([-\d.]+), ([-\d.]+)\)/.exec(el.getAttribute('transform') ?? '');
      if (href.startsWith('#/c/') && m) out[href.slice(4)] = [Number(m[1]), Number(m[2])];
    }
    return out;
  }, figure);
}

/**
 * Every positioned node must sit where one uniform affine map of the
 * constellation puts it — the same scale in x and y (never per-axis),
 * derived from the drawn extremes, with a small rounding allowance.
 */
function expectConstellationArrangement(
  drawn: Record<string, [number, number]>,
  layout: Record<string, [number, number]>,
): void {
  const placed = Object.keys(drawn).filter((slug) => layout[slug]);
  expect(placed.length).toBeGreaterThanOrEqual(2);
  const scaleOf = (axis: 0 | 1): { scale: number; min: string } => {
    const sorted = [...placed].sort((a, b) => layout[a]![axis] - layout[b]![axis]);
    const [min, max] = [sorted[0]!, sorted[sorted.length - 1]!];
    const span = layout[max]![axis] - layout[min]![axis];
    expect(span).toBeGreaterThan(1);
    return { scale: (drawn[max]![axis] - drawn[min]![axis]) / span, min };
  };
  const x = scaleOf(0);
  const y = scaleOf(1);
  expect(Math.abs(x.scale - y.scale), 'the fit must be uniform, never per-axis').toBeLessThan(0.02);
  for (const slug of placed) {
    for (const [axis, ref] of [x, y].map((r, i) => [i as 0 | 1, r] as const)) {
      const predicted =
        drawn[ref.min]![axis] + (layout[slug]![axis] - layout[ref.min]![axis]) * ref.scale;
      expect(
        Math.abs(drawn[slug]![axis] - predicted),
        `${slug} must hold its constellation position (axis ${String(axis)})`,
      ).toBeLessThan(1.5);
    }
  }
}

// ---------------------------------------------------------------------------
// The assumption trail (§4.2)
// ---------------------------------------------------------------------------

test('assumption trail: the real chain unfolds transitively behind a disclosure', async ({
  page,
}) => {
  await page.goto('/#/c/stability-margins');
  const trail = page.locator('.assumption-trail');
  await expect(trail).toHaveCount(1);
  await expect(trail.locator('summary')).toContainText('Trace assumptions');
  await expect(trail.locator('summary')).toContainText('2 claims');

  await trail.locator('summary').click();
  // Level 1: the node's own ASSUMES claim; level 2, indented inside it:
  // what that assumption itself assumes.
  const level1 = page.locator('.assumption-trail > .trail-level > li.connection');
  await expect(level1).toHaveCount(1);
  await expect(level1.locator(':scope > a[href="#/c/linearization"]')).toBeVisible();
  const level2 = level1.locator('.trail-level > li.connection');
  await expect(level2).toHaveCount(1);
  await expect(level2.locator('a[href="#/c/smoothness"]')).toBeVisible();
  await expect(level2).toContainText('assumes');
});

test('assumption trail: a one-hop chain gets no disclosure — the list already is the trail', async ({
  page,
}) => {
  await page.goto('/#/c/linearization');
  await expect(page.locator('.assumptions')).toBeVisible();
  // The claim renders in the Assumptions section as always…
  await expect(
    page.locator('.assumptions > .connection-list a[href="#/c/smoothness"]').first(),
  ).toBeVisible();
  // …but smoothness assumes nothing, so unfolding would restate the list.
  await expect(page.locator('.assumption-trail')).toHaveCount(0);
});

test('arrow-hop skips claims folded inside the closed trail and enters the open one', async ({
  page,
}) => {
  await page.goto('/#/c/stability-margins');
  await expect(page.locator('.assumption-trail')).toHaveCount(1);
  const focusLastAssumptionClaim = (): Promise<void> =>
    page.evaluate(() => {
      const claims = document.querySelectorAll<HTMLElement>(
        '.assumptions > .connection-list > li.connection',
      );
      claims[claims.length - 1]?.querySelector('a')?.focus();
    });
  const focusInTrail = (): Promise<boolean> =>
    page.evaluate(() => document.activeElement?.closest('.assumption-trail') != null);

  await focusLastAssumptionClaim();
  await page.keyboard.press('ArrowDown');
  expect(await focusInTrail(), 'folded claims are skipped').toBe(false);
  expect(
    await page.evaluate(() => document.activeElement?.closest('li.connection') != null),
    'the hop lands on the next visible claim',
  ).toBe(true);

  await page.locator('.assumption-trail summary').click();
  await focusLastAssumptionClaim();
  await page.keyboard.press('ArrowDown');
  expect(await focusInTrail(), 'unfolded claims join the hop order').toBe(true);
});

// ---------------------------------------------------------------------------
// Fixed coordinates (§4.9)
// ---------------------------------------------------------------------------

test('lens: a lens covering most of the graph pins to the atlas constellation and says so', async ({
  page,
}) => {
  await page.goto('/#/lens?type=model');
  const note = page.locator('.lens-pinned-note');
  await expect(note).toBeVisible();
  await expect(note.locator('a[href="#/atlas"]')).toBeVisible();

  const data = await loadGraph(page);
  const drawn = await drawnPositions(page, '.graph-lens');
  expect(Object.keys(drawn).length * 2).toBeGreaterThanOrEqual(data.nodes.length);
  expectConstellationArrangement(drawn, data.metrics.layout);
});

test('lens: a narrow lens keeps the local force layout', async ({ page }) => {
  await page.goto('/#/lens?edge=IS-A');
  await expect(page.locator('.graph-lens .graph-svg')).toBeVisible();
  await expect(page.locator('.lens-pinned-note')).toHaveCount(0);
});

test('ego: pinning to the atlas layout is opt-in, real, and reversible', async ({ page }) => {
  await page.goto('/#/c/eigenvalues');
  const ego = page.locator('.concept-ego');
  const pin = ego.getByRole('button', { name: 'Pin to the atlas layout' });
  await expect(pin).toBeVisible();
  const local = await drawnPositions(page, '.concept-ego');

  await pin.click();
  await expect(ego.getByRole('button', { name: 'Back to the local layout' })).toBeVisible();
  const data = await loadGraph(page);
  const pinned = await drawnPositions(page, '.concept-ego');
  expect(Object.keys(pinned).sort()).toEqual(Object.keys(local).sort());
  expectConstellationArrangement(pinned, data.metrics.layout);
  // The center keeps its emphasis either way.
  await expect(ego.locator('.graph-node.focus-node')).toHaveCount(1);

  await ego.getByRole('button', { name: 'Back to the local layout' }).click();
  await expect(pin).toBeVisible();
});

// ---------------------------------------------------------------------------
// axe: the interactive states URLs cannot carry (the static ones — the
// trail page closed, the pinned lens — join the M6 route matrix).
// ---------------------------------------------------------------------------

for (const theme of ['light', 'dark'] as const) {
  test(`axe: open trail and pinned ego pass WCAG 2.1 A/AA (${theme})`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: theme });

    await page.goto('/#/c/stability-margins');
    await page.locator('.assumption-trail summary').click();
    await expect(
      page.locator('.assumption-trail .trail-level a[href="#/c/linearization"]').first(),
    ).toBeVisible();
    const trailScan = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    expect(trailScan.violations.map((v) => `${v.id}: ${String(v.nodes.length)}`)).toEqual([]);

    await page.goto('/#/c/eigenvalues');
    await page.getByRole('button', { name: 'Pin to the atlas layout' }).click();
    await expect(page.getByRole('button', { name: 'Back to the local layout' })).toBeVisible();
    const egoScan = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    expect(egoScan.violations.map((v) => `${v.id}: ${String(v.nodes.length)}`)).toEqual([]);
  });
}
