import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, describe, expect, it } from 'vitest';
import { countErrors } from '../src/model.js';
import { runPipeline } from '../src/pipeline.js';
import { cleanupTrees, copyValidTree, FIXTURE_VALID } from './helpers.js';

afterAll(cleanupTrees);

describe('valid fixture end to end', () => {
  const result = runPipeline(FIXTURE_VALID);

  it('passes with zero issues', () => {
    expect(result.issues).toEqual([]);
    expect(result.graph).toBeDefined();
  });

  it('links backlinks and connections with schema phrasings', () => {
    const nodes = Object.fromEntries(result.graph!.nodes.map((n) => [n.slug, n]));
    expect(nodes['eigenvalues']!.backlinks).toEqual(['markov-chains']);
    expect(nodes['markov-chains']!.backlinks).toEqual(['eigenvalues']);

    const kalman = nodes['kalman-filter']!;
    const isA = kalman.connections.find((c) => c.type === 'IS-A')!;
    expect(isA).toMatchObject({
      other: 'markov-chains',
      direction: 'out',
      phrase: 'is a special case of',
    });
    const gapIn = kalman.connections.find((c) => c.type === 'POSSIBLE-MISSING-MIGRATION')!;
    expect(gapIn).toMatchObject({
      other: 'eigenvalues',
      direction: 'in',
      phrase: 'might benefit, unverified, from',
      status: 'open-candidate',
    });
    const sym = nodes['eigenvalues']!.connections.find((c) => c.type === 'FIELD-DIALECT-OF')!;
    expect(sym).toMatchObject({ other: 'markov-chains', direction: 'sym' });
  });

  it('resolves references and carries evidence on edges and both connection ends', () => {
    expect(result.graph!.references.map((r) => r.key)).toEqual(['doob-1953', 'kalman-1960']);
    expect(result.graph!.references[1]).toMatchObject({
      entry_type: 'article',
      fields: {
        title: 'A New Approach to Linear Filtering and Prediction Problems',
        journal: 'Journal of Basic Engineering',
        year: '1960',
      },
    });
    const cited = result.graph!.edges.find((e) => e.type === 'IS-A')!;
    expect(cited.evidence).toEqual(['kalman-1960', 'doob-1953']);
    for (const slug of ['kalman-filter', 'markov-chains']) {
      const node = result.graph!.nodes.find((n) => n.slug === slug)!;
      expect(node.connections.find((c) => c.type === 'IS-A')!.evidence).toEqual([
        'kalman-1960',
        'doob-1953',
      ]);
    }
  });

  it('renders bodies with math and wiki-links', () => {
    const eigen = result.graph!.nodes.find((n) => n.slug === 'eigenvalues')!;
    expect(eigen.html).toContain('katex');
    expect(eigen.html).toContain('href="#/c/markov-chains"');
  });
});

describe('link-stage rules', () => {
  it('warns on orphan nodes', () => {
    const dir = copyValidTree();
    writeFileSync(
      join(dir, 'concepts', 'loner.md'),
      '---\ncanonical_name: Loner\nnode_type: object\nstatus: stub\nsummary: x\n---\nAlone.\n',
    );
    const issues = runPipeline(dir).issues.map((i) => `${i.severity}:${i.rule}`);
    expect(issues).toContain('warn:node/orphan');
  });

  it('reports wiki-linked but unedged pairs as candidate edges', () => {
    const dir = copyValidTree();
    // kalman-filter body links to eigenvalues, but no edge exists... except a
    // POSSIBLE-MISSING-MIGRATION does. Link to markov-chains instead? That
    // pair has IS-A. So add a fresh stub pair.
    writeFileSync(
      join(dir, 'concepts', 'newcomer.md'),
      '---\ncanonical_name: Newcomer\nnode_type: object\nstatus: stub\nsummary: x\n---\nSee [[eigenvalues]].\n',
    );
    const issues = runPipeline(dir).issues.map((i) => `${i.severity}:${i.rule}`);
    expect(issues).toContain('info:link/candidate-edge');
  });

  it('fails on unknown wiki-link targets', () => {
    const dir = copyValidTree();
    writeFileSync(
      join(dir, 'concepts', 'kalman-filter.md'),
      '---\ncanonical_name: Kalman filter\nnode_type: move\nstatus: stub\nsummary: x\n---\nSee [[ghost]].\n',
    );
    const result = runPipeline(dir);
    expect(result.issues.map((i) => `${i.severity}:${i.rule}`)).toContain(
      'error:link/unknown-target',
    );
    expect(result.graph).toBeUndefined();
  });
});

describe('batch error reporting', () => {
  it('reports edge, TeX, and wiki-link errors together in one run', () => {
    const dir = copyValidTree();
    writeFileSync(
      join(dir, 'concepts', 'kalman-filter.md'),
      '---\ncanonical_name: Kalman filter\nnode_type: move\nstatus: stub\nsummary: x\n---\n' +
        'Bad math $\\frac{$ and a bad link [[ghost]].\n',
    );
    const edgesPath = join(dir, 'graph', 'edges.yaml');
    writeFileSync(
      edgesPath,
      readFileSync(edgesPath, 'utf8') +
        '\n- from: eigenvalues\n  to: ghost-node\n  type: IS-A\n  strength: theorem\n',
    );
    const rules = runPipeline(dir).issues.map((i) => i.rule);
    expect(rules).toContain('edge/unknown-endpoint');
    expect(rules).toContain('render/tex');
    expect(rules).toContain('link/unknown-target');
  });
});

describe('parse-stage failures', () => {
  it('rejects a concept without front-matter and reports in batch', () => {
    const dir = copyValidTree();
    writeFileSync(join(dir, 'concepts', 'broken.md'), 'no front matter here\n');
    writeFileSync(join(dir, 'concepts', 'Bad Slug.md'), '---\na: 1\n---\nx\n');
    const issues = runPipeline(dir).issues.map((i) => i.rule);
    expect(issues).toContain('content/frontmatter-missing');
    expect(issues).toContain('content/slug-format');
  });

  it('fails when an evidence key resolves to no references.bib entry (the M8 exit criterion)', () => {
    const dir = copyValidTree();
    const edgesPath = join(dir, 'graph', 'edges.yaml');
    writeFileSync(
      edgesPath,
      readFileSync(edgesPath, 'utf8') +
        '\n- from: eigenvalues\n  to: kalman-filter\n  type: IS-A\n  strength: theorem\n' +
        '  evidence: [ghost-2001]\n',
    );
    const result = runPipeline(dir);
    const hit = result.issues.find((i) => i.rule === 'edge/unknown-evidence')!;
    expect(hit).toBeDefined();
    expect(hit.message).toContain('ghost-2001');
    expect(countErrors(result.issues)).toBeGreaterThan(0);
  });

  it('fails when edges.yaml references an unknown endpoint (the CI exit criterion)', () => {
    const dir = copyValidTree();
    const edgesPath = join(dir, 'graph', 'edges.yaml');
    writeFileSync(
      edgesPath,
      readFileSync(edgesPath, 'utf8') +
        '\n- from: eigenvalues\n  to: ghost-node\n  type: IS-A\n  strength: theorem\n',
    );
    const result = runPipeline(dir);
    const hit = result.issues.find((i) => i.rule === 'edge/unknown-endpoint')!;
    expect(hit).toBeDefined();
    expect(hit.file).toContain('edges.yaml');
    expect(countErrors(result.issues)).toBeGreaterThan(0);
  });
});

describe('the real repository content tree', () => {
  it('passes validation (schema + empty content)', () => {
    const repoRoot = fileURLToPath(new URL('../..', import.meta.url));
    const result = runPipeline(repoRoot);
    expect(countErrors(result.issues)).toBe(0);
  });
});
