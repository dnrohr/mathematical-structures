import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse, stringify } from 'yaml';
import { describe, expect, it } from 'vitest';
import { applyEvidencePack } from '../src/admission/evidence.js';
import { makeTree } from './helpers.js';

function fixture(count = 30): { files: Record<string, string>; ids: string[]; pack: object } {
  const ids = Array.from({ length: count }, (_, index) => `candidate-${index + 1}`);
  const files: Record<string, string> = {
    'campaign/triage-report.json': JSON.stringify({
      campaign_id: 'test-sweep',
      decisions: ids.map((candidate_id) => ({ candidate_id, selected_for_review: true })),
    }),
  };
  for (const id of ids) {
    files[`campaign/normalized/${id}.yaml`] = stringify({
      candidate: { id, proposed_disposition: 'propose-node' },
      source_inventory: [{ id: 'source-a' }],
      workflow: {
        state: 'normalized',
        history: [
          { from: null, to: 'harvested', reason: 'test', actor: 'test' },
          { from: 'harvested', to: 'normalized', reason: 'test', actor: 'test' },
        ],
      },
    });
  }
  const entries = ids.map((candidate_id) => ({
    candidate_id,
    proposition: `${candidate_id} has a scoped relationship.`,
    endpoints: { from: '$candidate', to: 'stability' },
    edge: { type: 'GOVERNS', strength: 'theorem', context: 'test' },
    mathematical_skeleton: 'test skeleton',
    scope: 'test scope',
    assumptions: ['test assumption'],
    validity_regime: 'test regime',
    caveats: ['test caveat'],
    counterexamples: ['test counterexample'],
    source_id: 'source-a',
    source_location: 'chapter 1',
    possible_falsifiers: ['test falsifier'],
    alternative_interpretations: ['test alternative'],
    search_query: 'test query',
    challenge: 'test challenge',
    response: 'test response',
    recommended_action: 'retain',
  }));
  return {
    files,
    ids,
    pack: { evidence_schema: '1.0.0', campaign_id: 'test-sweep', assessor: 'test', entries },
  };
}

describe('atlas-evidence', () => {
  it('requires complete coverage of the triage review queue', () => {
    const data = fixture();
    const pack = data.pack as { entries: unknown[] };
    pack.entries = pack.entries.slice(1);
    data.files['pack.yaml'] = stringify(pack);
    const directory = makeTree(data.files);
    expect(() =>
      applyEvidencePack(join(directory, 'campaign'), join(directory, 'pack.yaml')),
    ).toThrow('review queue lacks evidence entries: candidate-1');
  });

  it('records evidence and adversarial review without fabricating a human decision', () => {
    const data = fixture();
    data.files['pack.yaml'] = stringify(data.pack);
    const directory = makeTree(data.files);
    const report = applyEvidencePack(join(directory, 'campaign'), join(directory, 'pack.yaml'));
    expect(report.summary).toEqual({
      selected: 30,
      enriched: 30,
      direct_support_assessments: 30,
      adversarial_reviews: 30,
    });
    const dossier = parse(
      readFileSync(join(directory, 'campaign', 'normalized', 'candidate-1.yaml'), 'utf8'),
    ) as Record<string, unknown>;
    expect((dossier.workflow as { state: string }).state).toBe('automated-review-passed');
    expect(dossier.human_decisions).toBeUndefined();
  });

  it('rejects unexpected YAML fields instead of silently truncating flow mappings', () => {
    const data = fixture();
    const pack = data.pack as { entries: Record<string, unknown>[] };
    (pack.entries[0]!.edge as Record<string, unknown>)['near-integrable motion'] = null;
    data.files['pack.yaml'] = stringify(pack);
    const directory = makeTree(data.files);
    expect(() =>
      applyEvidencePack(join(directory, 'campaign'), join(directory, 'pack.yaml')),
    ).toThrow('candidate-1.edge has unexpected field(s): near-integrable motion');
  });
});
