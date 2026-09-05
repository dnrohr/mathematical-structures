/**
 * Smoke suite for the M11 exit criteria (ROADMAP, UI_REDESIGN.md §4.6):
 * #/queue renders every signal class with its machine-checkable "why" and
 * a prefilled action per item; the reject ledger renders as deliberate
 * non-connections and provably suppresses its queue items; the propose
 * deep-link round-trips into the composer.
 */
import { expect, test } from '@playwright/test';

interface GraphData {
  non_edges: { between: [string, string]; reason: string; see?: string }[];
  metrics: {
    candidate_edges: { a: string; b: string }[];
    queue: {
      link_suggestions: { a: string; b: string; witnesses: string[] }[];
      bridge_deficits: { communities: [number, number]; edges: unknown[] }[];
      recurring_assumptions: { assumption: string; slugs: string[] }[];
      dialect_gaps: { slug: string; field: string }[];
      thin_symptoms: { id: string }[];
    };
  };
}

async function loadGraph(page: import('@playwright/test').Page): Promise<GraphData> {
  return (await (await page.request.get('data/graph.json')).json()) as GraphData;
}

test('every signal class renders with its count, evidence, and an action (spec §4.6)', async ({
  page,
}) => {
  await page.goto('/#/queue');
  const data = await loadGraph(page);
  const q = data.metrics.queue;

  // All nine section headings, in the catalogue's order.
  const headings = page.locator('main h2');
  await expect(headings).toHaveText([
    `Candidate edges (${String(data.metrics.candidate_edges.length)})`,
    `Link suggestions (${String(q.link_suggestions.length)})`,
    `Bridge deficits (${String(q.bridge_deficits.length)})`,
    `Recurring assumptions (${String(q.recurring_assumptions.length)})`,
    `Dialect gaps (${String(q.dialect_gaps.length)})`,
    `Thin symptoms (${String(q.thin_symptoms.length)})`,
    'Underconnected applications (0)',
    'Unused references (0)',
    `Deliberate non-connections (${String(data.non_edges.length)})`,
  ]);

  // Candidate edges: one row per pair, each with its propose action.
  await expect(page.locator('.candidate-list li')).toHaveCount(data.metrics.candidate_edges.length);

  // Link suggestions: the witnesses ARE the why, shown per item, and both
  // actions are offered (propose / record a non-edge).
  const suggestions = page.locator('.suggestion-list li');
  await expect(suggestions).toHaveCount(q.link_suggestions.length);
  const first = q.link_suggestions[0]!;
  await expect(suggestions.first()).toContainText(
    `${String(first.witnesses.length)} shared trusted neighbors`,
  );
  await expect(
    suggestions.first().getByRole('link', { name: 'propose', exact: true }),
  ).toBeVisible();
  await expect(suggestions.first().getByRole('link', { name: 'record a non-edge' })).toBeVisible();

  // Bridge deficits: community chips plus the ≤ 1 bridging claim, and the
  // zero-bridge case says so in words.
  const deficits = page.locator('.deficit-list > li');
  await expect(deficits).toHaveCount(q.bridge_deficits.length);
  const zeroBridge = q.bridge_deficits.findIndex((d) => d.edges.length === 0);
  const oneBridge = q.bridge_deficits.findIndex((d) => d.edges.length === 1);
  await expect(deficits.nth(zeroBridge)).toContainText('no trusted edge joins these clusters');
  await expect(deficits.nth(oneBridge)).toContainText('one trusted edge joins these clusters');
  await expect(deficits.nth(oneBridge).locator('.connection')).toHaveCount(1);
  await expect(deficits.first().getByRole('link', { name: 'propose an edge' })).toHaveAttribute(
    'href',
    /#\/propose\?from=.+&to=.+/,
  );
  await expect(
    deficits.first().getByRole('link', { name: /chains between the hubs/ }),
  ).toHaveAttribute('href', /#\/path\/.+\/.+/);

  // Recurring assumptions: the normalized string, the nodes, the action.
  const recurring = page.locator('.queue-signal:has(h2:text("Recurring assumptions")) li');
  await expect(recurring).toHaveCount(q.recurring_assumptions.length);
  await expect(recurring.first()).toContainText(q.recurring_assumptions[0]!.assumption);
  await expect(recurring.first().getByRole('link', { name: 'propose a node' })).toHaveAttribute(
    'href',
    /issues\/new\?.*node-proposal/,
  );

  // Dialect gaps are grouped by node; every (node, field) item is a link
  // to a prefilled alias-wanted issue.
  await expect(
    page.locator('.queue-signal:has(h2:text("Dialect gaps")) a[href*="issues/new"]'),
  ).toHaveCount(q.dialect_gaps.length);

  // Empty signal classes still render, honestly.
  await expect(page.locator('.empty-state')).toHaveCount(3); // thin symptoms + underconnected + unused
  await expect(
    page.locator('.queue-signal:has(h2:text("Thin symptoms")) .empty-state'),
  ).toContainText('at least two moves and a worked example');
});

test('the reject ledger renders and provably suppresses its queue items', async ({ page }) => {
  await page.goto('/#/queue');
  const data = await loadGraph(page);
  expect(data.non_edges.length).toBeGreaterThan(0);

  // Every ledger entry renders with its reason.
  const entries = page.locator('.non-edge-list li');
  await expect(entries).toHaveCount(data.non_edges.length);
  await expect(entries.first()).toContainText(data.non_edges[0]!.reason.slice(0, 40));

  // Suppression, checked against the emitted data: no recorded pair
  // appears as a candidate or a link suggestion.
  const rejected = new Set(data.non_edges.map((n) => n.between.join('|')));
  for (const c of data.metrics.candidate_edges) {
    expect(rejected.has(`${c.a}|${c.b}`), `${c.a}|${c.b} should be suppressed`).toBe(false);
  }
  for (const s of data.metrics.queue.link_suggestions) {
    expect(rejected.has(`${s.a}|${s.b}`), `${s.a}|${s.b} should be suppressed`).toBe(false);
  }
  // The M11 dogfood pair — worked end to end from this very view — is in
  // the ledger, so the suggestion its witnesses once produced stays gone.
  expect(rejected.has('kalman-filter|state-space-model')).toBe(true);
});

test('the propose action deep-links the composer with the pair prefilled', async ({ page }) => {
  await page.goto('/#/queue');
  const data = await loadGraph(page);
  const first = data.metrics.queue.link_suggestions[0]!;

  await page
    .locator('.suggestion-list li')
    .first()
    .getByRole('link', { name: 'propose', exact: true })
    .click();
  await expect(page).toHaveURL(new RegExp(`#/propose\\?from=${first.a}&to=${first.b}$`));
  await expect(page.locator('.propose-from')).toHaveValue(first.a);
  await expect(page.locator('.propose-to')).toHaveValue(first.b);

  // The record-a-non-edge action is the M10 mechanism one artifact smaller:
  // a prefilled issue carrying the ready-to-paste ledger entry.
  await page.goBack();
  const recordHref = await page
    .locator('.suggestion-list li')
    .first()
    .getByRole('link', { name: 'record a non-edge' })
    .getAttribute('href');
  expect(recordHref).toContain('/issues/new?');
  expect(recordHref).toContain('non-edge');
  // URLSearchParams encodes spaces as '+'; undo both layers to read the body.
  expect(decodeURIComponent((recordHref ?? '').replace(/\+/g, ' '))).toContain(
    `between: [${first.a}, ${first.b}]`,
  );
});

test('questions and queue are nav siblings; candidates moved to the queue', async ({ page }) => {
  await page.goto('/#/questions');
  // The research-gap view keeps its epistemology and points at its sibling.
  await expect(page.locator('.gap-group .connection.gap').first()).toBeVisible();
  await expect(page.locator('main')).not.toContainText('Candidate edges');
  await page.locator('main').getByRole('link', { name: 'work queue' }).click();
  await expect(page).toHaveURL(/#\/queue$/);
  await expect(page.getByRole('heading', { name: 'Work queue' })).toBeVisible();

  // Both live in the site nav.
  await expect(page.locator('.site-nav a[href="#/questions"]')).toBeVisible();
  await expect(page.locator('.site-nav a[href="#/queue"]')).toBeVisible();
});
