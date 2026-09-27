import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { stringify } from 'yaml';
import { describe, expect, it } from 'vitest';
import { harvestManifest } from '../src/admission/harvest.js';
import { validateDossier } from '../src/admission/validate.js';
import { makeTree } from './helpers.js';

const ROOT = fileURLToPath(new URL('../..', import.meta.url));

function manifest(): Record<string, unknown> {
  return {
    harvest_schema: '1.0.0',
    campaign: {
      id: 'test-sweep',
      title: 'Test broad sweep',
      sampling_frame: ['dynamical systems', 'celestial mechanics'],
      target_raw_candidates: 3,
    },
    sources: [
      {
        id: 'source-a',
        kind: 'textbook',
        title: 'Dynamics source',
        year: 2020,
        locator: 'index',
        supplied_by: 'test',
      },
      {
        id: 'source-b',
        kind: 'syllabus',
        title: 'Mechanics source',
        year: 2021,
        locator: 'week 4',
        supplied_by: 'test',
      },
    ],
    entries: [
      {
        term: 'Attractors',
        source_ids: ['source-a'],
        originating_fields: ['mechanics'],
        harvest_location: 'index A',
      },
      {
        term: 'Attractor',
        source_ids: ['source-a'],
        originating_fields: ['mechanics'],
        local_names: [{ name: 'strange attractor dynamics', field: 'mechanics' }],
        harvest_location: 'chapter 8',
      },
      {
        term: 'Lagrange points',
        source_ids: ['source-b'],
        originating_fields: ['mechanics'],
        acronyms: ['L1', 'L2'],
        harvest_location: 'week 4',
      },
    ],
  };
}

describe('atlas-harvest', () => {
  it('consolidates raw terms, normalizes against the atlas, and emits early dossiers', () => {
    const directory = makeTree({ 'manifest.yaml': stringify(manifest()) });
    const output = join(directory, 'out');
    const report = harvestManifest(ROOT, join(directory, 'manifest.yaml'), output);

    expect(report.summary.raw_entries).toBe(3);
    expect(report.summary.normalized_clusters).toBe(2);
    expect(report.summary.duplicate_entries_consolidated).toBe(1);
    expect(report.summary.exact_atlas_matches).toBe(1);
    expect(report.candidates.map((candidate) => candidate.id)).toEqual([
      'attractor',
      'lagrange-points',
    ]);

    const attractor = validateDossier(ROOT, join(output, 'attractor.yaml'));
    expect(attractor.dossier.workflow_state).toBe('normalized');
    expect(attractor.recommendation.disposition).toBe('merge-or-refine');
    expect(attractor.rule_results.some((rule) => rule.rule_id === 'admission/required')).toBe(
      false,
    );

    const first = readFileSync(join(output, 'campaign-report.json'), 'utf8');
    harvestManifest(ROOT, join(directory, 'manifest.yaml'), output);
    expect(readFileSync(join(output, 'campaign-report.json'), 'utf8')).toBe(first);
  });

  it('keeps technical singulars and acronyms intact while removing possessives', () => {
    const data = manifest();
    data.campaign = { ...(data.campaign as object), target_raw_candidates: 5 };
    data.entries = [
      ...((data.entries as object[]) ?? []),
      {
        term: 'B-series',
        source_ids: ['source-a'],
        originating_fields: ['mechanics'],
        harvest_location: 'index B',
      },
      {
        term: 'Backward error analysis',
        source_ids: ['source-a'],
        originating_fields: ['mechanics'],
        harvest_location: 'index B',
      },
      {
        term: 'BFGS method',
        source_ids: ['source-a'],
        originating_fields: ['mechanics'],
        harvest_location: 'index B',
      },
      {
        term: "Newton's method",
        source_ids: ['source-a'],
        originating_fields: ['mechanics'],
        harvest_location: 'index N',
      },
    ];
    const directory = makeTree({ 'manifest.yaml': stringify(data) });
    const report = harvestManifest(ROOT, join(directory, 'manifest.yaml'), join(directory, 'out'));
    const ids = report.candidates.map((candidate) => candidate.id);
    expect(ids).toEqual(
      expect.arrayContaining([
        'b-series',
        'backward-error-analysis',
        'bfgs-method',
        'newton-method',
      ]),
    );
  });

  it('refuses to write generated dossiers into trusted content directories', () => {
    const directory = makeTree({ 'manifest.yaml': stringify(manifest()) });
    expect(() =>
      harvestManifest(ROOT, join(directory, 'manifest.yaml'), join(ROOT, 'graph', 'harvest')),
    ).toThrow('refusing to write campaign output inside trusted graph/');
  });
});
