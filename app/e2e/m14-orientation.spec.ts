/**
 * Smoke suite for the M14 exit criteria (ROADMAP, UI_REDESIGN.md §4.5,
 * §4.7, §4.8, §5): the atlas constellation rendered from the build-time
 * layout (fixed, never client-computed) with the communities toggle and
 * focus ring; the concept-page minimap; the compare view with its merged
 * dialect table, shared ground, and legitimate empty case; the faceted
 * A–Z index; and the actions polish — citable copy-link, download-what-
 * you-see CSV, BibTeX sources, walk resume, and the recently-visited
 * trail. URL round-trips like every M4 view.
 */
import { readFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';

interface GraphData {
  generated_from: string;
  nodes: {
    slug: string;
    node_type: string;
    status: string;
    fields: string[];
    aliases: { field: string }[];
    connections: { evidence: string[] }[];
  }[];
  edges: { from: string; to: string; strength: string }[];
  schema: {
    strengths: { id: string; rank: number }[];
    fields: { id: string }[];
    analysis: { trusted_min_strength: string };
  };
  metrics: {
    community_count: number;
    layout: Record<string, [number, number]>;
  };
}

async function loadGraph(page: Page): Promise<GraphData> {
  return (await (await page.request.get('data/graph.json')).json()) as GraphData;
}

function rankOf(data: GraphData): Map<string, number> {
  return new Map(data.schema.strengths.map((s) => [s.id, s.rank]));
}

function trustedEdges(data: GraphData): GraphData['edges'] {
  const rank = rankOf(data);
  const floor = rank.get(data.schema.analysis.trusted_min_strength)!;
  return data.edges.filter((e) => (rank.get(e.strength) ?? 99) <= floor);
}

// ---------------------------------------------------------------------------
// The atlas constellation (§4.7)
// ---------------------------------------------------------------------------

test('atlas: the fixed constellation renders every positioned concept and trusted claim', async ({
  page,
}) => {
  await page.goto('/#/atlas');
  const data = await loadGraph(page);
  const placed = Object.keys(data.metrics.layout).length;
  const outside = data.nodes.length - placed;
  expect(placed).toBeGreaterThan(0);
  expect(outside).toBeGreaterThan(0);

  // Dots = layout entries; edges = the trusted claims, nothing else — the
  // view draws metrics.layout, it never computes a layout client-side.
  await expect(page.locator('.atlas-node')).toHaveCount(placed);
  await expect(page.locator('.atlas-svg .graph-edge')).toHaveCount(trustedEdges(data).length);

  // Absence is information: the un-positioned concepts are listed as text.
  await expect(page.locator('.atlas-outside .node-link')).toHaveCount(outside);
  await expect(page.locator('.atlas-outside')).toContainText('Outside the constellation');

  // The degradation plan is documented next to the view (ROADMAP M14).
  await expect(page.locator('.atlas-degradation')).toContainText('community aggregation');

  // Reachable from the nav; a dot is a real link and navigates on click.
  // (Click the painted circle: the anchor's box also spans its hover label.)
  await expect(page.locator('.site-nav a[href="#/atlas"]')).toHaveText('Atlas');
  await page.locator('.atlas-node[href="#/c/eigenvalues"] circle').click();
  await expect(page).toHaveURL(/#\/c\/eigenvalues$/);
});

test('atlas: focus ring, communities toggle, and URL round-trip', async ({ page }) => {
  await page.goto('/#/atlas?focus=eigenvalues');
  const data = await loadGraph(page);
  await expect(page.locator('.atlas-node.focus-node')).toHaveCount(1);
  await expect(page.locator('.atlas-ring')).toHaveCount(1);
  await expect(page.locator('.atlas-focus-note')).toContainText('Ringed');

  // A dot reads name + summary into the live caption on focus.
  await page.locator('.atlas-node.focus-node').focus();
  await expect(page.locator('.graph-caption')).toContainText('Eigenvalues');

  // Toggle communities: the legend appears with every community chip, and
  // the state lands in the URL (replaceHash) so a reload restores it.
  await page.locator('.lens-communities').check();
  await expect(page).toHaveURL(/#\/atlas\?communities=1&focus=eigenvalues$/);
  await expect(page.locator('.community-legend .community-chip')).toHaveCount(
    data.metrics.community_count,
  );
  await page.reload();
  await expect(page.locator('.lens-communities')).toBeChecked();
  await expect(page.locator('.atlas-node.focus-node')).toHaveCount(1);
});

test('minimap: concept pages show "you are here"; nodes outside the constellation honestly do not', async ({
  page,
}) => {
  await page.goto('/#/c/eigenvalues');
  const data = await loadGraph(page);
  const minimap = page.locator('a.concept-minimap');
  await expect(minimap).toHaveAttribute('href', '#/atlas?focus=eigenvalues');
  await expect(minimap.locator('.mini-here')).toHaveCount(1);
  // Every other positioned concept is a context dot (neighbor or not).
  const placed = Object.keys(data.metrics.layout).length;
  await expect(minimap.locator('.mini-dot, .mini-neighbor')).toHaveCount(placed - 1);
  await expect(page.locator('.situate a[href="#/atlas?focus=eigenvalues"]')).toHaveText(
    'the atlas',
  );
  await minimap.click();
  await expect(page).toHaveURL(/#\/atlas\?focus=eigenvalues$/);

  // A concept with no trusted-strength claim has no position — no minimap,
  // no atlas situating link (absence is information, not an error).
  const unplaced = data.nodes.find((n) => data.metrics.layout[n.slug] === undefined);
  expect(unplaced, 'the dataset has a concept outside the trusted subgraph').toBeTruthy();
  await page.goto(`/#/c/${unplaced!.slug}`);
  await expect(page.locator('.situate')).toBeVisible();
  await expect(page.locator('a.concept-minimap')).toHaveCount(0);
  await expect(page.locator('.situate a[href$="#/atlas"]')).toHaveCount(0);
});

// ---------------------------------------------------------------------------
// Compare (§4.5)
// ---------------------------------------------------------------------------

test('compare: side-by-side headers, the merged dialect table, direct claims, shared ground', async ({
  page,
}) => {
  await page.goto('/#/compare/eigenvalues/markov-chains');
  const data = await loadGraph(page);
  const a = data.nodes.find((n) => n.slug === 'eigenvalues')!;
  const b = data.nodes.find((n) => n.slug === 'markov-chains')!;

  await expect(page.locator('.compare-head')).toHaveCount(2);
  await expect(page.locator('.compare-head h2').first()).toContainText('Eigenvalues');

  // The merged dialect table: one row per field in the union of the two
  // alias sets, both concepts as columns.
  const union = new Set([...a.aliases, ...b.aliases].map((al) => al.field));
  await expect(page.locator('.compare-dialects tbody tr')).toHaveCount(union.size);
  await expect(page.locator('.compare-dialects thead th')).toHaveCount(3);

  // Direct claims via the shared edge-claim fragment (both directions).
  const direct = data.edges.filter(
    (e) =>
      (e.from === 'eigenvalues' && e.to === 'markov-chains') ||
      (e.from === 'markov-chains' && e.to === 'eigenvalues'),
  );
  expect(direct.length).toBeGreaterThan(0);
  await expect(
    page.getByRole('heading', { name: `Between the two (${String(direct.length)})` }),
  ).toBeVisible();
  await expect(page.locator('.compare-results li.connection').first()).toBeVisible();

  // The path finder link and the swap control mirror the path view.
  await expect(page.locator('.compare-path-link a')).toHaveAttribute(
    'href',
    '#/path/eigenvalues/markov-chains',
  );
  await page.getByRole('link', { name: '⇄ swap' }).click();
  await expect(page).toHaveURL(/#\/compare\/markov-chains\/eigenvalues$/);
  await expect(page.locator('.compare-head h2').first()).toContainText('Markov');
});

test('compare: endpoints round-trip through the URL via the pickers', async ({ page }) => {
  await page.goto('/#/compare');
  await expect(page.locator('.empty-state')).toContainText('Pick two concepts');
  await page.locator('select[aria-label="Compare"]').selectOption('eigenvalues');
  await expect(page).toHaveURL(/#\/compare\/eigenvalues$/);
  await page.locator('select[aria-label="With"]').selectOption('markov-chains');
  await expect(page).toHaveURL(/#\/compare\/eigenvalues\/markov-chains$/);
  await page.reload();
  await expect(page.locator('select[aria-label="Compare"]')).toHaveValue('eigenvalues');
  await expect(page.locator('select[aria-label="With"]')).toHaveValue('markov-chains');
});

test('compare: two unrelated concepts are a legitimate comparison — no implied claims', async ({
  page,
}) => {
  await page.goto('/#/compare');
  const data = await loadGraph(page);

  // Find a pair with no edge of any strength and no shared neighbor at the
  // heuristic-analogy floor — the view's own definition of unrelated.
  const rank = rankOf(data);
  const floor = rank.get('heuristic-analogy')!;
  const pairKey = (x: string, y: string): string => [x, y].sort().join('|');
  const edged = new Set(data.edges.map((e) => pairKey(e.from, e.to)));
  const near = new Map<string, Set<string>>();
  for (const e of data.edges) {
    if ((rank.get(e.strength) ?? 99) > floor) continue;
    (near.get(e.from) ?? near.set(e.from, new Set()).get(e.from)!).add(e.to);
    (near.get(e.to) ?? near.set(e.to, new Set()).get(e.to)!).add(e.from);
  }
  const slugs = data.nodes.map((n) => n.slug);
  let unrelated: [string, string] | null = null;
  outer: for (let i = 0; i < slugs.length; i++) {
    for (let j = i + 1; j < slugs.length; j++) {
      if (edged.has(pairKey(slugs[i]!, slugs[j]!))) continue;
      const a = near.get(slugs[i]!) ?? new Set<string>();
      const b = near.get(slugs[j]!) ?? new Set<string>();
      if ([...a].some((x) => b.has(x))) continue;
      unrelated = [slugs[i]!, slugs[j]!];
      break outer;
    }
  }
  expect(unrelated, 'the dataset has an unrelated pair').toBeTruthy();

  await page.goto(`/#/compare/${unrelated![0]}/${unrelated![1]}`);
  await expect(page.locator('.compare-head')).toHaveCount(2);
  const empty = page.locator('.compare-results .empty-state');
  await expect(empty).toContainText('No direct claims');
  await expect(empty).toContainText('will not imply one');
  await expect(empty.getByRole('link', { name: 'propose an edge' })).toHaveAttribute(
    'href',
    `#/propose?from=${unrelated![0]}&to=${unrelated![1]}`,
  );
  await expect(empty.getByRole('link', { name: 'Look for longer chains' })).toHaveAttribute(
    'href',
    `#/path/${unrelated![0]}/${unrelated![1]}`,
  );
});

test('compare: entered from the concept page with the current node pinned', async ({ page }) => {
  await page.goto('/#/c/eigenvalues');
  await page.getByRole('link', { name: 'compare it with another concept' }).click();
  await expect(page).toHaveURL(/#\/compare\/eigenvalues$/);
  await expect(page.locator('select[aria-label="Compare"]')).toHaveValue('eigenvalues');
});

// ---------------------------------------------------------------------------
// Index facets (§4.8)
// ---------------------------------------------------------------------------

test('index facets: chips with counts combine as AND, state in the URL', async ({ page }) => {
  await page.goto('/#/index?type=move');
  const data = await loadGraph(page);
  const moves = data.nodes.filter((n) => n.node_type === 'move');
  await expect(page.locator('.atoz-list li')).toHaveCount(moves.length);
  await expect(page.locator('a.facet-chip[data-facet="type:move"]')).toHaveAttribute(
    'aria-current',
    'true',
  );

  // AND a field facet in: the counts on the field chips already answer
  // "what would this show?" under the active type facet.
  const field = data.schema.fields.find((f) => moves.some((n) => n.fields.includes(f.id)))!;
  const expected = moves.filter((n) => n.fields.includes(field.id)).length;
  await expect(page.locator(`a.facet-chip[data-facet="field:${field.id}"] .count`)).toHaveText(
    ` ${String(expected)}`,
  );
  await page.locator(`a.facet-chip[data-facet="field:${field.id}"]`).click();
  await expect(page).toHaveURL(new RegExp(`#/index\\?type=move&field=${field.id}$`));
  await expect(page.locator('.atoz-list li')).toHaveCount(expected);

  // URL → view: a reload restores both facets and the filtered list.
  await page.reload();
  await expect(page.locator('.atoz-list li')).toHaveCount(expected);
  await expect(page.locator('a.facet-chip[data-facet="type:move"]')).toHaveAttribute(
    'aria-current',
    'true',
  );

  // "any" clears one dimension in place.
  await page.locator('a.facet-chip[data-facet="type:"]').click();
  await expect(page).toHaveURL(new RegExp(`#/index\\?field=${field.id}$`));
});

test('landing type groups deep-link pre-filtered index states', async ({ page }) => {
  await page.goto('/');
  const data = await loadGraph(page);
  const moves = data.nodes.filter((n) => n.node_type === 'move').length;
  await page.locator('a.type-group-link[href="#/index?type=move"]').click();
  await expect(page).toHaveURL(/#\/index\?type=move$/);
  await expect(page.locator('.atoz-list li')).toHaveCount(moves);
});

// ---------------------------------------------------------------------------
// Actions polish (§5)
// ---------------------------------------------------------------------------

test.describe('copy citable link', () => {
  test.use({ permissions: ['clipboard-read', 'clipboard-write'] });

  test('copies the URL with the data commit for citation', async ({ page }) => {
    await page.goto('/#/matrix?focus=eigenvalues');
    const data = await loadGraph(page);
    await page.getByRole('button', { name: 'copy citable link' }).click();
    await expect(page.locator('.copy-feedback')).toHaveText(' copied ✓');
    const copied = await page.evaluate(() => navigator.clipboard.readText());
    expect(copied).toContain('#/matrix?focus=eigenvalues');
    expect(copied).toContain(`generated from ${data.generated_from.slice(0, 7)}`);
  });
});

test('download what you see: matrix, map, and lens hand over their filtered CSV', async ({
  page,
}) => {
  await page.goto('/#/lens?edge=GOVERNS');
  const lensDownload = page.waitForEvent('download');
  await page.getByRole('button', { name: /^Download these \d+ claims \(CSV\)$/ }).click();
  const lens = await lensDownload;
  expect(lens.suggestedFilename()).toBe('lens-claims.csv');
  const lensCsv = readFileSync((await lens.path())!, 'utf8');
  expect(
    lensCsv.startsWith('from,to,type,strength,symmetric,gap_status,context,notes,evidence'),
  ).toBe(true);
  // Every row is a GOVERNS claim — the filter is what you see.
  expect(lensCsv.trim().split('\r\n').length).toBeGreaterThan(1);
  for (const line of lensCsv.trim().split('\r\n').slice(1)) expect(line).toContain('GOVERNS');

  await page.goto('/#/matrix?type=move');
  const matrixDownload = page.waitForEvent('download');
  await page.getByRole('button', { name: /^Download the \d+ claims shown \(CSV\)$/ }).click();
  expect((await matrixDownload).suggestedFilename()).toBe('matrix-claims.csv');

  await page.goto('/#/map');
  const mapDownload = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download this map (CSV)' }).click();
  const map = await mapDownload;
  expect(map.suggestedFilename()).toBe('migration-map.csv');
  const mapCsv = readFileSync((await map.path())!, 'utf8');
  expect(mapCsv.startsWith('slug,canonical_name,')).toBe(true);
  expect(mapCsv).toContain('(present, unnamed)');
});

test('sources export as BibTeX on concept pages', async ({ page }) => {
  await page.goto('/');
  const data = await loadGraph(page);
  const cited = data.nodes.find((n) => n.connections.some((c) => c.evidence.length > 0));
  expect(cited, 'the dataset has a concept with cited claims').toBeTruthy();

  await page.goto(`/#/c/${cited!.slug}`);
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: /as BibTeX$/ }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe(`${cited!.slug}.bib`);
  const bib = readFileSync((await download.path())!, 'utf8');
  expect(bib.startsWith('@')).toBe(true);
  expect(bib).toContain('title = {');
});

test('walk resume: a localStorage convenience, offered on the index and the walk itself', async ({
  page,
}) => {
  await page.goto('/#/walk/eigenvalue-tour?step=3');
  await expect(page.locator('.walk-count')).toContainText('Step 3');

  // The walks index offers the stored position.
  await page.goto('/#/walks');
  const resume = page.getByRole('link', { name: 'Resume at step 3 →' });
  await expect(resume).toHaveAttribute('href', '#/walk/eigenvalue-tour?step=3');

  // Landing on the walk without a step offers resume rather than jumping —
  // the URL stays the only state the view depends on.
  await page.goto('/#/walk/eigenvalue-tour');
  await expect(page.locator('.walk-count')).toContainText('Step 1');
  await page.getByRole('link', { name: 'Resume where you left off: step 3 →' }).click();
  await expect(page).toHaveURL(/#\/walk\/eigenvalue-tour\?step=3$/);
  await expect(page.locator('.walk-count')).toContainText('Step 3');
});

test('recently-visited trail: per-viewer, clearable, never required', async ({ page }) => {
  // A fresh context has no trail: nothing renders.
  await page.goto('/#/c/eigenvalues');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Eigenvalues');
  await expect(page.locator('.visit-trail')).toHaveCount(0);

  // The next page shows where the reader has been (current page excluded).
  await page.goto('/#/c/markov-chains');
  const trail = page.locator('.visit-trail');
  await expect(trail).toContainText('Recently visited');
  await expect(trail.locator('a.node-link')).toHaveCount(1);
  await expect(trail.locator('a.node-link')).toHaveAttribute('href', '#/c/eigenvalues');

  // Clearable, and it stays cleared.
  await trail.getByRole('button', { name: 'clear' }).click();
  await expect(page.locator('.visit-trail')).toHaveCount(0);
  await page.reload();
  await expect(page.locator('.visit-trail')).toHaveCount(0);
});

test('the ? panel documents the cross-view actions', async ({ page }) => {
  await page.goto('/#/atlas');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await page.keyboard.press('?');
  const dialog = page.locator('dialog.shortcuts');
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText('Cross-view actions');
  await expect(dialog).toContainText('Copy a citable link');
  await expect(dialog).toContainText('Download what you see as CSV');
  await expect(dialog).toContainText('BibTeX');
  await expect(dialog).toContainText('Resume a walk');
});

// ---------------------------------------------------------------------------
// Themes
// ---------------------------------------------------------------------------

for (const theme of ['light', 'dark'] as const) {
  test(`atlas and compare render legibly in the ${theme} theme`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: theme });
    await page.goto('/#/atlas?communities=1');
    await expect(page.locator('.atlas-svg')).toBeVisible();
    await expect(page.locator('.atlas-node circle').first()).toBeVisible();
    await page.goto('/#/compare/eigenvalues/markov-chains');
    await expect(page.locator('.compare-dialects')).toBeVisible();
    await expect(page.locator('.compare-head').first()).toBeVisible();
  });
}
