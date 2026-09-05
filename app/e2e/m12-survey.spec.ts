/**
 * Smoke suite for the M12 exit criteria (ROADMAP, UI_REDESIGN.md §4.3,
 * §4.4, §4.9): the adjacency matrix over the lens filter grammar with the
 * pair panel, keyboard cell navigation, crosshair, and bridge-deficit
 * links; the migration map's three text-equivalent cell states; directed
 * arrowheads in all three force presets (symmetric types markerless,
 * parallel bows included); and the concept-page situating links. URL
 * round-trips like every M4 view.
 */
import { expect, test, type Page } from '@playwright/test';

interface GraphData {
  nodes: { slug: string; node_type: string; fields: string[]; aliases: { field: string }[] }[];
  edges: { from: string; to: string; type: string; strength: string; symmetric: boolean }[];
  schema: { fields: { id: string }[] };
  metrics: {
    queue: {
      bridge_deficits: { communities: [number, number]; edges: unknown[] }[];
      link_suggestions: { a: string; b: string }[];
    };
  };
}

async function loadGraph(page: Page): Promise<GraphData> {
  return (await (await page.request.get('data/graph.json')).json()) as GraphData;
}

// ---------------------------------------------------------------------------
// The matrix (§4.3)
// ---------------------------------------------------------------------------

test('matrix: every concept on both axes, community blocks, glyphs, ×n, mirrored symmetry', async ({
  page,
}) => {
  await page.goto('/#/matrix');
  const data = await loadGraph(page);

  // Every node is a row and a column — including edge-less ones: absence is
  // the information. Label rows carry the community blocks (M5 palette).
  await expect(page.locator('.matrix-col-head')).toHaveCount(data.nodes.length);
  await expect(page.locator('tbody tr:not(.matrix-block-row)')).toHaveCount(data.nodes.length);
  await expect(page.locator('.matrix-block-row .community-chip').first()).toBeVisible();

  // The reading direction is stated, with the claim count.
  await expect(page.locator('.matrix-results .section-hint').first()).toContainText(
    'read row → column',
  );

  // Parallel edges: radon-transform → fourier-analysis carries TRANSFORM-DUAL
  // (symmetric) + SOLVED-BY (directed) — a ×2 cell; the mirrored cell holds
  // only the symmetric claim, so it is filled without a chip.
  const multi = page.locator('td[data-row="radon-transform"][data-col="fourier-analysis"]');
  await expect(multi).toHaveClass(/filled/);
  await expect(multi.locator('.cell-count')).toHaveText('×2');
  const mirror = page.locator('td[data-row="fourier-analysis"][data-col="radon-transform"]');
  await expect(mirror).toHaveClass(/filled/);
  await expect(mirror.locator('.cell-count')).toHaveCount(0);

  // A directed-only pair fills exactly one of the two mirrored cells.
  const pairKey = (x: { from: string; to: string }): string => [x.from, x.to].sort().join('|');
  const oneWay = data.edges.find(
    (e) =>
      !e.symmetric &&
      e.strength !== 'speculative' &&
      !data.edges.some((o) => o !== e && pairKey(o) === pairKey(e)),
  );
  expect(oneWay, 'the dataset has a single-edge directed pair').toBeTruthy();
  await expect(
    page.locator(`td[data-row="${oneWay!.from}"][data-col="${oneWay!.to}"]`),
  ).toHaveClass(/filled/);
  await expect(
    page.locator(`td[data-row="${oneWay!.to}"][data-col="${oneWay!.from}"]`),
  ).toHaveClass(/empty/);
});

test('matrix: the default floor excludes speculative gap edges; opting in shows them in the warn style', async ({
  page,
}) => {
  // state-space-model → biological-regulation exists only as a speculative
  // POSSIBLE-MISSING-MIGRATION hypothesis (the §35 layer).
  await page.goto('/#/matrix');
  await expect(
    page.locator('td[data-row="state-space-model"][data-col="biological-regulation"]'),
  ).toHaveClass(/empty/);

  await page.goto('/#/matrix?strength=speculative');
  const cell = page.locator('td[data-row="state-space-model"][data-col="biological-regulation"]');
  await expect(cell).toHaveClass(/filled/);
  await expect(cell).toHaveClass(/gap/);
  await expect(cell).toHaveAttribute('aria-label', /speculative/);
});

test('matrix: filters and order round-trip through the URL', async ({ page }) => {
  await page.goto('/#/matrix?type=move&order=az');
  const data = await loadGraph(page);
  const moves = data.nodes.filter((n) => n.node_type === 'move').length;
  await expect(page.locator('.matrix-col-head')).toHaveCount(moves);
  await expect(page.locator('select[aria-label="Order"]')).toHaveValue('az');
  await expect(page.locator('select[aria-label="Node type"]')).toHaveValue('move');
  // The default strength floor is the path view's: heuristic analogy.
  await expect(page.locator('select[aria-label="Strength floor"]')).toHaveValue(
    'heuristic-analogy',
  );

  // View → URL → reload restores the view.
  await page.locator('select[aria-label="Order"]').selectOption('degree');
  await expect(page).toHaveURL(/#\/matrix\?type=move&order=degree$/);
  await page.reload();
  await expect(page.locator('select[aria-label="Order"]')).toHaveValue('degree');
  await expect(page.locator('select[aria-label="Node type"]')).toHaveValue('move');
});

test('matrix: keyboard cell navigation skips the diagonal; Enter opens the pair panel', async ({
  page,
}) => {
  await page.goto('/#/matrix');
  const active = (): Promise<{ r: string; c: string } | null> =>
    page.evaluate(() => {
      const el = document.activeElement;
      return el instanceof HTMLTableCellElement
        ? { r: el.dataset['r'] ?? '', c: el.dataset['c'] ?? '' }
        : null;
    });

  // One cell is tabbable (roving focus); it starts beside the diagonal.
  await page.locator('td.matrix-cell[tabindex="0"]').focus();
  expect(await active()).toEqual({ r: '0', c: '1' });

  // Left would land on the (0,0) diagonal with nowhere to skip: stay put.
  await page.keyboard.press('ArrowLeft');
  expect(await active()).toEqual({ r: '0', c: '1' });
  // Down crosses (1,1): the diagonal is skipped, landing on (2,1).
  await page.keyboard.press('ArrowDown');
  expect(await active()).toEqual({ r: '2', c: '1' });
  // Right crosses the (2,2) diagonal and lands on (2,3).
  await page.keyboard.press('ArrowRight');
  expect(await active()).toEqual({ r: '2', c: '3' });

  // Enter opens the pair panel for the focused cell and lands the pair in
  // the URL; every claim between the two renders via the shared fragment.
  const cell = await page.evaluate(() => {
    const el = document.activeElement as HTMLTableCellElement;
    return { row: el.dataset['row'] ?? '', col: el.dataset['col'] ?? '' };
  });
  await page.keyboard.press('Enter');
  await expect(page.locator('.matrix-pair-panel')).toBeVisible();
  await expect(page).toHaveURL(new RegExp(`a=${cell.row}&b=${cell.col}`));
});

test('matrix: the pair panel lists every claim for a connected pair, and prefills the composer for an unconnected one', async ({
  page,
}) => {
  // eigenvalues ↔ markov-chains: two directed theorem claims, one each way.
  await page.goto('/#/matrix?a=eigenvalues&b=markov-chains');
  const panel = page.locator('.matrix-pair-panel');
  await expect(panel).toBeVisible();
  await expect(panel.locator('li.connection')).toHaveCount(2);
  await expect(panel.getByRole('link', { name: 'chains between them' })).toHaveAttribute(
    'href',
    '#/path/eigenvalues/markov-chains',
  );
  // Connected pairs offer no propose action — no implied duplicates.
  await expect(panel.getByRole('link', { name: 'propose an edge' })).toHaveCount(0);

  // An unconnected pair (a live link suggestion is unconnected by
  // construction) says so and routes to the composer, both endpoints set.
  const data = await loadGraph(page);
  const pair = data.metrics.queue.link_suggestions[0]!;
  await page.goto(`/#/matrix?a=${pair.a}&b=${pair.b}`);
  await expect(page.locator('.matrix-pair-panel')).toContainText('No claim connects these two');
  await page.locator('.matrix-pair-panel').getByRole('link', { name: 'propose an edge' }).click();
  await expect(page).toHaveURL(new RegExp(`#/propose\\?from=${pair.a}&to=${pair.b}$`));
  await expect(page.locator('.propose-from')).toHaveValue(pair.a);
  await expect(page.locator('.propose-to')).toHaveValue(pair.b);
});

test('matrix: empty blocks between communities link the M11 bridge-deficit items', async ({
  page,
}) => {
  await page.goto('/#/matrix');
  const data = await loadGraph(page);
  const deficits = data.metrics.queue.bridge_deficits;
  expect(deficits.length).toBeGreaterThan(0);

  const links = page.locator('.matrix-deficits a[href^="#/queue?bridge="]');
  await expect(links).toHaveCount(deficits.length);
  const first = deficits[0]!;
  await links.first().click();
  await expect(page).toHaveURL(
    new RegExp(`#/queue\\?bridge=${String(first.communities[0])}-${String(first.communities[1])}$`),
  );
  const item = page.locator(
    `#bridge-${String(first.communities[0])}-${String(first.communities[1])}`,
  );
  await expect(item).toHaveClass(/highlight/);
  await expect(item).toBeInViewport();
});

test('matrix: the focus crosshair highlights one concept’s row and column (situating deep-link)', async ({
  page,
}) => {
  await page.goto('/#/matrix?focus=eigenvalues');
  const data = await loadGraph(page);
  await expect(page.locator('tr.focus-row')).toHaveCount(1);
  await expect(page.locator('tr.focus-row .matrix-row-head a')).toHaveAttribute(
    'href',
    '#/c/eigenvalues',
  );
  // The whole column carries the highlight: one td per row plus its header.
  await expect(page.locator('td.focus-col')).toHaveCount(data.nodes.length);
  await expect(page.locator('th.matrix-col-head.focus-col')).toHaveCount(1);
});

// ---------------------------------------------------------------------------
// The migration map (§4.4)
// ---------------------------------------------------------------------------

test('map: three text-equivalent cell states with honest counts; headers deep-link', async ({
  page,
}) => {
  await page.goto('/#/map');
  const data = await loadGraph(page);
  const structures = data.nodes.filter((n) => n.node_type !== 'application');
  const named = structures.reduce((sum, n) => sum + new Set(n.aliases.map((a) => a.field)).size, 0);
  const unnamed = structures.reduce(
    (sum, n) => sum + n.fields.filter((f) => !n.aliases.some((a) => a.field === f)).length,
    0,
  );

  await expect(page.locator('tbody tr:not(.matrix-block-row)')).toHaveCount(structures.length);
  await expect(page.locator('.matrix-col-head')).toHaveCount(data.schema.fields.length);
  await expect(page.locator('td.map-named')).toHaveCount(named);
  await expect(page.locator('td.map-unnamed')).toHaveCount(unnamed);
  expect(named).toBeGreaterThan(0);
  expect(unnamed).toBeGreaterThan(0);
  await expect(page.locator('td.map-empty').first()).toBeAttached();

  // A named cell reads its alias into the live caption on focus.
  await page.locator('td.map-named .map-glyph').first().focus();
  await expect(page.locator('.map .graph-caption')).toContainText('is called');

  // A present-unnamed cell is the alias-wanted queue action, prefilled.
  const unnamedLink = page.locator('td.map-unnamed a').first();
  await expect(unnamedLink).toHaveAttribute('href', /issues\/new\?.*alias/);

  // Column headers open the lens filtered to the field; row headers open
  // the concept at its dialect table.
  await expect(page.locator(`.matrix-col-head a[href="#/lens?field=control"]`)).toHaveCount(1);
  await page.locator('a[href="#/c/eigenvalues?at=dialects"]').click();
  await expect(page).toHaveURL(/#\/c\/eigenvalues\?at=dialects$/);
  await expect(page.locator('table.dialects')).toBeVisible();
});

test('map: ordering, column highlight, and row focus round-trip through the URL', async ({
  page,
}) => {
  await page.goto('/#/map?order=type&field=biology&focus=eigenvalues');
  const data = await loadGraph(page);
  const structures = data.nodes.filter((n) => n.node_type !== 'application').length;

  await expect(page.locator('select[aria-label="Row order"]')).toHaveValue('type');
  await expect(page.locator('select[aria-label="Highlight field"]')).toHaveValue('biology');
  // Type blocks are labeled; the biology column is lit the whole way down.
  await expect(page.locator('.matrix-block-row .type-badge').first()).toBeVisible();
  await expect(page.locator('td.focus-col, th.focus-col')).toHaveCount(structures + 1);
  await expect(page.locator('tr.focus-row .matrix-row-head a')).toHaveAttribute(
    'href',
    '#/c/eigenvalues?at=dialects',
  );

  await page.locator('select[aria-label="Row order"]').selectOption('az');
  await expect(page).toHaveURL(/#\/map\?order=az&field=biology&focus=eigenvalues$/);
  await page.reload();
  await expect(page.locator('select[aria-label="Row order"]')).toHaveValue('az');
});

// ---------------------------------------------------------------------------
// Arrowheads in the force presets (§4.9)
// ---------------------------------------------------------------------------

const markerEnd = (page: Page, selector: string): Promise<string> =>
  page.evaluate((sel) => getComputedStyle(document.querySelector(sel)!).markerEnd, selector);

test('arrowheads: directed edges carry target markers in all three presets; parallel bows stay legible', async ({
  page,
}) => {
  // Path preset — eigenvalues ⇄ markov-chains is a directed pair in BOTH
  // directions, rendered as two bowed parallel edges with opposite arrows.
  await page.goto('/#/path/eigenvalues/markov-chains');
  const directed = page.locator('.graph-edge .edge-line.directed');
  expect(await directed.count()).toBeGreaterThanOrEqual(2);
  expect(await markerEnd(page, '.edge-line.directed')).toContain('url(');
  const bowed = page.locator('.edge-line.directed[d*="Q"]');
  expect(await bowed.count()).toBeGreaterThanOrEqual(2);
  await expect(page.locator('.graph-svg marker')).toHaveCount(5);

  // Ego preset (concept page).
  await page.goto('/#/c/eigenvalues');
  expect(await page.locator('.graph-edge .edge-line.directed').count()).toBeGreaterThan(0);
  expect(await markerEnd(page, '.edge-line.directed')).toContain('url(');

  // Lens preset — and a symmetric-only lens stays markerless on purpose:
  // the absence of an arrowhead is itself information.
  await page.goto('/#/lens?edge=GOVERNS');
  expect(await page.locator('.graph-edge .edge-line.directed').count()).toBeGreaterThan(0);
  await page.goto('/#/lens?edge=ANALOGOUS-TO');
  expect(await page.locator('.graph-edge .edge-line').count()).toBeGreaterThan(0);
  await expect(page.locator('.edge-line.directed')).toHaveCount(0);
  await expect(page.locator('.graph-svg marker')).toHaveCount(0);
});

// ---------------------------------------------------------------------------
// Situating links (§4.2) and themes
// ---------------------------------------------------------------------------

test('concept pages situate the node in matrix and map with the crosshair prefilled', async ({
  page,
}) => {
  await page.goto('/#/c/eigenvalues');
  const situate = page.locator('.situate');
  await expect(situate).toContainText('See this concept in');
  await expect(situate.getByRole('link', { name: 'the map' })).toHaveAttribute(
    'href',
    '#/map?focus=eigenvalues',
  );
  await situate.getByRole('link', { name: 'the matrix' }).click();
  await expect(page).toHaveURL(/#\/matrix\?focus=eigenvalues$/);
  await expect(page.locator('tr.focus-row')).toHaveCount(1);

  // Applications are not map rows (the map asks where STRUCTURES live), so
  // an application page situates in the matrix alone.
  await page.goto('/#/c/pagerank');
  await expect(page.locator('.situate').getByRole('link', { name: 'the matrix' })).toBeVisible();
  await expect(page.locator('.situate').getByRole('link', { name: 'the map' })).toHaveCount(0);
});

for (const theme of ['light', 'dark'] as const) {
  test(`matrix and map render legibly in the ${theme} theme`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: theme });
    await page.goto('/#/matrix');
    await expect(page.locator('.matrix-table')).toBeVisible();
    await expect(page.locator('td.matrix-cell.filled .cell-glyph').first()).toBeVisible();
    await page.goto('/#/map');
    await expect(page.locator('.map-table')).toBeVisible();
    await expect(page.locator('td.map-named .map-glyph').first()).toBeVisible();
  });
}
