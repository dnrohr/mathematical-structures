import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { buildPromotionPreview, normalizeLineEndings } from '../src/admission/promotion-preview.js';

const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const CAMPAIGN = join(ROOT, 'admission', 'campaigns', 'broad-sweep-2026-09');
const CROSS_FIELD_CAMPAIGN = join(ROOT, 'admission', 'campaigns', 'cross-field-sweep-2026-09');

describe('atlas-promotion-preview', () => {
  it('compares generated and trusted text independent of platform line endings', () => {
    expect(normalizeLineEndings('first\r\nsecond\rthird\n')).toBe('first\nsecond\nthird\n');
  });

  it('rebuilds a deterministic, compiler-clean preview after promotion without duplicating trusted content', () => {
    const directory = mkdtempSync(join(tmpdir(), 'atlas-promotion-test-'));
    try {
      const first = buildPromotionPreview(ROOT, CAMPAIGN, directory);
      const serialized = readFileSync(join(directory, 'promotion-report.json'), 'utf8');
      const second = buildPromotionPreview(ROOT, CAMPAIGN, directory);
      expect(first.summary).toEqual({
        proposed_new_concepts: 39,
        proposed_merge_refinements: 1,
        proposed_edges: 40,
        reference_additions: 8,
        integrated_validation_errors: 0,
        integrated_validation_warnings: 0,
      });
      expect(second).toEqual(first);
      expect(readFileSync(join(directory, 'promotion-report.json'), 'utf8')).toBe(serialized);
      expect(first.human_approval_required).toBe(false);
      const review = readFileSync(join(directory, 'review.md'), 'utf8');
      expect(review).toContain('## GraphSLAM `graphslam`');
      expect(review.match(/Decision: \[x\] accept/g)).toHaveLength(40);
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it('refuses a preview output inside trusted content', () => {
    expect(() => buildPromotionPreview(ROOT, CAMPAIGN, join(ROOT, 'concepts', 'preview'))).toThrow(
      'refusing to write promotion preview inside trusted concepts/',
    );
  });

  it('rebuilds the accepted campaign from local citation mappings without duplicating trusted references', () => {
    const directory = mkdtempSync(join(tmpdir(), 'atlas-cross-field-promotion-test-'));
    try {
      const report = buildPromotionPreview(ROOT, CROSS_FIELD_CAMPAIGN, directory);
      expect(report.summary).toEqual({
        proposed_new_concepts: 50,
        proposed_merge_refinements: 0,
        proposed_edges: 50,
        reference_additions: 9,
        integrated_validation_errors: 0,
        integrated_validation_warnings: 0,
      });
      expect(report.human_approval_required).toBe(false);
      const references = readFileSync(join(directory, 'references.bib'), 'utf8');
      expect(references).not.toContain('@book{evans-2010,');
      expect(references).toContain('@book{newman-2018,');
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });
});
