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
import { analyzeGraph } from '../../build/src/analyze.js';
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
  const { nodes, edges, symptoms, references, walks, candidates } = result.graph;
  const metrics = analyzeGraph(result.schema, nodes, edges, candidates);
  const assembled = assembleAtlas(
    buildGraphJson(
      result.schema,
      nodes,
      edges,
      symptoms,
      references,
      walks,
      metrics,
      'f'.repeat(40),
    ),
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

describe('M9 walks over the real dataset', () => {
  it('ships the promised walks: an application spine and the spec §8.3 examples', () => {
    const ids = atlas.walks.map((w) => w.id);
    expect(ids).toContain('sar-tour');
    expect(ids).toContain('eigenvalue-tour');
    expect(ids).toContain('random-walk-to-renormalization');
    // The SAR tour is spined on an M7 application (ROADMAP M9 exit criterion).
    expect(atlas.walk('sar-tour')!.steps[0]!.slug).toBe('computational-imaging');
  });

  it('every hop either rides a typed edge or carries the bridging note', () => {
    for (const walk of atlas.walks) {
      for (let i = 1; i < walk.steps.length; i++) {
        const prev = walk.steps[i - 1]!.slug;
        const step = walk.steps[i]!;
        const bridged = atlas.edgesBetween(prev, step.slug).length > 0 || Boolean(step.note);
        expect(bridged, `${walk.id}: ${prev} → ${step.slug}`).toBe(true);
      }
    }
  });

  it('every step is a resolvable concept, so the walk backlinks render', () => {
    for (const walk of atlas.walks) {
      for (const step of walk.steps) {
        expect(atlas.node(step.slug), `${walk.id}: ${step.slug}`).toBeDefined();
        expect(
          atlas.walksThrough(step.slug).some((p) => p.walk.id === walk.id),
          `${walk.id} appears on ${step.slug}`,
        ).toBe(true);
      }
    }
  });
});

describe('M5 metrics over the real dataset', () => {
  it('metrics run on the trusted subgraph and cover every node', () => {
    const m = atlas.metrics;
    expect(m.trusted.min_strength).toBe(atlas.schema.analysis.trusted_min_strength);
    expect(m.trusted.edge_count + m.trusted.excluded_edge_count).toBe(atlas.edges.length);
    expect(Object.keys(m.nodes)).toHaveLength(atlas.nodes.length);
    // A speculative-only neighborhood cannot buy membership: gap edges are
    // excluded, so their target-side frontier stays outside the partition.
    expect(m.community_count).toBeGreaterThanOrEqual(2);
  });

  it('the spectral hub tops the trusted rankings, as the notebook claims', () => {
    const eigen = atlas.nodeMetrics('eigenvalues')!;
    for (const node of atlas.nodes) {
      expect(eigen.degree).toBeGreaterThanOrEqual(atlas.nodeMetrics(node.slug)!.degree);
      expect(eigen.betweenness).toBeGreaterThanOrEqual(atlas.nodeMetrics(node.slug)!.betweenness);
    }
  });

  it('every gap edge is listable with its workflow status (spec §11)', () => {
    const gaps = atlas.gapEdges();
    expect(gaps.length).toBeGreaterThan(0);
    expect(atlas.metrics.gaps).toHaveLength(gaps.length);
    for (const edge of gaps) {
      expect(edge.status, `${edge.from} → ${edge.to}`).toBeTruthy();
      expect(atlas.gapStatus(edge.status!)).toBeDefined();
    }
  });
});
