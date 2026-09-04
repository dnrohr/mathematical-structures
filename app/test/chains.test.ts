/**
 * Integration test for ROADMAP M4's path-view exit note: the path finder
 * supersedes the hand-written notebook §34 translation chains, so every
 * §34 chain must be findable over the REAL content tree. Runs the build
 * pipeline in-process (build and app share one runtime — decision log #1)
 * rather than depending on a dist/ build having happened first.
 */
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { runPipeline } from '../../build/src/pipeline.js';
import { buildGraphJson, buildSearchIndex } from '../../build/src/emit.js';
import { assembleAtlas, type Atlas } from '../src/data/atlas';
import { egoNetwork, pathsBetween } from '../src/data/subgraph';

const root = fileURLToPath(new URL('../..', import.meta.url));

function realAtlas(): Atlas {
  const result = runPipeline(root);
  if (!result.schema || !result.graph) {
    throw new Error(
      `pipeline failed on the repo tree: ${JSON.stringify(result.issues.slice(0, 5))}`,
    );
  }
  const { nodes, edges, symptoms } = result.graph;
  const assembled = assembleAtlas(
    buildGraphJson(result.schema, nodes, edges, symptoms, 'f'.repeat(40)),
    buildSearchIndex(nodes, symptoms),
  );
  if (!assembled.ok) throw new Error(`atlas refused: ${JSON.stringify(assembled.error)}`);
  return assembled.atlas;
}

const atlas = realAtlas();

describe('notebook §34 translation chains are findable in the path view', () => {
  /** [chain, from, to, expected max steps, optional strength floor] */
  const chains: [string, string, string, number, string?][] = [
    ['1: normal modes ↔ relaxation modes', 'harmonic-oscillator', 'markov-chains', 2],
    ['3: state-space ↔ continuous-state HMM', 'state-space-model', 'hidden-markov-model', 1],
    [
      '4: margins → biological regulatory robustness',
      'stability-margins',
      'biological-regulation',
      4,
    ],
    ['4a: margins → bifurcation proximity', 'stability-margins', 'bifurcation', 1],
    ['5: nondimensionalization ↔ scaling variables', 'nondimensionalization', 'renormalization', 2],
    ['6: least action ↔ loss functional', 'variational-principles', 'optimization', 1],
  ];

  it.each(chains)('chain %s', (_label, from, to, maxSteps, strength) => {
    const result = pathsBetween(atlas, from, to, strength ? { strength } : {});
    expect(result.total).toBeGreaterThan(0);
    expect(result.chains[0]!.steps.length).toBeLessThanOrEqual(maxSteps);
  });

  it('chain 1 runs through the spectral hub', () => {
    const result = pathsBetween(atlas, 'harmonic-oscillator', 'markov-chains');
    expect(result.chains[0]!.steps.map((s) => s.to)).toEqual(['eigenvalues', 'markov-chains']);
  });

  it('chain 2 is one object under three names: dialect aliases, not edges', () => {
    // impulse response ↔ Green's function ↔ propagator (see edges.yaml header)
    for (const term of ['impulse response', "Green's function", 'propagator']) {
      const hits = atlas.aliasLookup(term);
      expect(
        hits.some((h) => h.node.slug === 'greens-function' && h.alias),
        `alias lookup for "${term}"`,
      ).toBe(true);
    }
  });

  it('does not route chains through speculative gap edges by default', () => {
    for (const chain of pathsBetween(atlas, 'stability-margins', 'biological-regulation').chains) {
      for (const step of chain.steps) {
        expect(step.edge.strength).not.toBe('speculative');
      }
    }
  });
});

describe('M4 views over the real dataset', () => {
  it('every concept page has a non-empty ego network', () => {
    for (const node of atlas.nodes) {
      const ego = egoNetwork(atlas, node.slug, 1);
      expect(ego, node.slug).not.toBeNull();
      expect(ego!.edges.length, `ego of ${node.slug}`).toBeGreaterThan(0);
    }
  });

  it('the symptom journey has its data: dimensional analysis leads the ranked moves', () => {
    const symptom = atlas.symptom('too-many-parameters');
    expect(symptom?.moves[0]).toBe('dimensional-analysis');
    expect(symptom?.worked_example).toBe('dimensional-analysis');
  });

  it('the reverse-dialect example resolves: perfect adaptation → feedback', () => {
    const hits = atlas.aliasLookup('perfect adaptation');
    expect(hits[0]?.node.slug).toBe('feedback-control');
    expect(hits[0]?.alias?.field).toBe('biology');
  });
});
