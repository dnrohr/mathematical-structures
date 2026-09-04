import { describe, expect, it } from 'vitest';
import { createConceptRenderer } from '../src/render.js';

const names = new Map([
  ['eigenvalues', 'Eigenvalues and spectral decomposition'],
  ['markov-chains', 'Markov chains'],
]);

function render(body: string) {
  return createConceptRenderer(names).render(body, 'concepts/test.md');
}

describe('markdown rendering', () => {
  it('renders basic markdown', () => {
    const { html, issues } = render('A *paragraph* with **emphasis**.');
    expect(issues).toEqual([]);
    expect(html).toContain('<em>paragraph</em>');
    expect(html).toContain('<strong>emphasis</strong>');
  });

  it('escapes raw HTML instead of emitting it', () => {
    const { html } = render('before <script>alert(1)</script> after');
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });

  it('neutralizes dangerous link schemes', () => {
    const { html } = render('[click](javascript:alert(1)) and [ok](https://example.org)');
    expect(html).not.toContain('javascript:');
    expect(html).toContain('href="https://example.org"');
  });
});

describe('math', () => {
  it('renders inline and display math via KaTeX', () => {
    const { html, issues } = render('Inline $A v = \\lambda v$ and\n\n$$x_{t+1} = A x_t$$');
    expect(issues).toEqual([]);
    expect(html).toContain('katex');
    expect(html).toContain('katex-display');
  });

  it('reports TeX errors as render/tex issues', () => {
    const { issues } = render('bad $\\frac{$ math');
    expect(issues.map((i) => `${i.severity}:${i.rule}`)).toContain('error:render/tex');
  });

  it('leaves currency-like text alone', () => {
    const { html, issues } = render('It costs $5 and then $ 10 more.');
    expect(issues).toEqual([]);
    expect(html).not.toContain('katex');
  });

  it('does not process math or wiki-links inside code', () => {
    const { html, issues } = render('`$x$ and [[eigenvalues]]`');
    expect(issues).toEqual([]);
    expect(html).toContain('<code>$x$ and [[eigenvalues]]</code>');
  });
});

describe('wiki-links', () => {
  it('resolves to internal anchors with canonical-name default text', () => {
    const { html, wikiLinks, issues } = render('See [[markov-chains]].');
    expect(issues).toEqual([]);
    expect(wikiLinks).toEqual(['markov-chains']);
    expect(html).toContain('<a href="#/c/markov-chains" class="wiki-link">Markov chains</a>');
  });

  it('honors custom display text', () => {
    const { html } = render('See [[eigenvalues|the spectral node]].');
    expect(html).toContain('>the spectral node</a>');
  });

  it('reports unknown targets and renders a broken-link span', () => {
    const { html, issues, wikiLinks } = render('See [[ghost-node]].');
    expect(issues.map((i) => `${i.severity}:${i.rule}`)).toContain('error:link/unknown-target');
    expect(wikiLinks).toEqual([]);
    expect(html).toContain('broken-link');
  });
});
