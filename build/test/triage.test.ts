import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { stringify } from 'yaml';
import { describe, expect, it } from 'vitest';
import { triageCampaign } from '../src/admission/triage.js';
import { makeTree } from './helpers.js';

describe('atlas-triage', () => {
  it('requires exhaustive, unique classifications and a bounded review queue', () => {
    const directory = makeTree({
      'campaign/normalized/campaign-report.json': JSON.stringify({
        campaign: { id: 'test-sweep' },
        candidates: [{ id: 'alpha' }, { id: 'beta' }],
      }),
    });
    const normalized = join(directory, 'campaign', 'normalized');
    mkdirSync(normalized, { recursive: true });
    for (const id of ['alpha', 'beta']) {
      writeFileSync(
        join(normalized, `${id}.yaml`),
        stringify({ candidate: { id, proposed_disposition: 'defer' } }),
      );
    }
    const queue = Array.from({ length: 30 }, (_, index) => (index % 2 === 0 ? 'alpha' : 'beta'));
    const manifest = join(directory, 'triage.yaml');
    writeFileSync(
      manifest,
      stringify({
        triage_schema: '1.0.0',
        campaign_id: 'test-sweep',
        curator: 'test',
        groups: [{ disposition: 'propose-node', rationale: 'test', candidate_ids: ['alpha'] }],
        review_queue: queue,
      }),
    );
    expect(() => triageCampaign(join(directory, 'campaign'), manifest)).toThrow(
      'unclassified candidates: beta',
    );
  });

  it('writes a stable report and updates proposed dispositions', () => {
    const ids = Array.from({ length: 30 }, (_, index) => `candidate-${index + 1}`);
    const files: Record<string, string> = {
      'campaign/normalized/campaign-report.json': JSON.stringify({
        campaign: { id: 'test-sweep' },
        candidates: ids.map((id) => ({ id })),
      }),
    };
    for (const id of ids)
      files[`campaign/normalized/${id}.yaml`] = stringify({
        candidate: { id, proposed_disposition: 'defer' },
      });
    const directory = makeTree(files);
    const manifest = join(directory, 'triage.yaml');
    writeFileSync(
      manifest,
      stringify({
        triage_schema: '1.0.0',
        campaign_id: 'test-sweep',
        curator: 'test',
        groups: [
          {
            disposition: 'propose-node',
            proposed_node_type: 'object',
            rationale: 'test classification',
            candidate_ids: ids,
          },
        ],
        review_queue: ids,
      }),
    );
    const first = triageCampaign(join(directory, 'campaign'), manifest);
    const reportFile = join(directory, 'campaign', 'triage-report.json');
    const serialized = readFileSync(reportFile, 'utf8');
    expect(first.summary).toMatchObject({ survivors: 30, classified: 30, review_queue: 30 });
    expect(first.summary.by_disposition).toEqual({ 'propose-node': 30 });
    triageCampaign(join(directory, 'campaign'), manifest);
    expect(readFileSync(reportFile, 'utf8')).toBe(serialized);
  });
});
