/**
 * The propose-an-edge composer's pure core (ROADMAP M10): the draft URL
 * round-trips through the router like every view state, the edges.yaml
 * block is real YAML that parses back to exactly the proposed claim, and
 * the prefilled issue URL addresses the edge-proposal form's fields by id.
 */
import { parse } from 'yaml';
import { describe, expect, it } from 'vitest';
import { parseHash } from '../src/shell/router';
import {
  claimSentence,
  EDGE_ISSUE_TEMPLATE,
  edgeYamlBlock,
  proposalIssueUrl,
  proposeHash,
  type CompleteProposal,
} from '../src/views/propose';

const proposal: CompleteProposal = {
  from: 'diffusion',
  to: 'eigenvalues',
  type: 'REPRESENTED-BY',
  strength: 'theorem',
  context: 'eigenfunction expansion of the heat semigroup',
};

const reading = {
  fromName: 'Diffusion and the heat equation',
  toName: 'Eigenvalues and spectral decomposition',
  phrase: 'becomes tractable in',
};

describe('proposeHash', () => {
  it('round-trips a full draft through the router', () => {
    expect(parseHash(proposeHash(proposal))).toEqual({ name: 'propose', ...proposal });
  });

  it('round-trips free-text context, quotes and all', () => {
    const draft = { from: 'a', context: 'valid where x = "y" & z; 100% honest' };
    expect(parseHash(proposeHash(draft))).toEqual({ name: 'propose', ...draft });
  });

  it('omits empty fields entirely', () => {
    expect(proposeHash({})).toBe('#/propose');
    expect(parseHash('#/propose')).toEqual({ name: 'propose' });
  });
});

describe('edgeYamlBlock', () => {
  it('emits the exact edges.yaml entry, parseable back to the claim', () => {
    const block = edgeYamlBlock(proposal);
    expect(block).toBe(
      [
        '- from: diffusion',
        '  to: eigenvalues',
        '  type: REPRESENTED-BY',
        '  strength: theorem',
        '  context: "eigenfunction expansion of the heat semigroup"',
      ].join('\n'),
    );
    expect(parse(block)).toEqual([
      {
        from: 'diffusion',
        to: 'eigenvalues',
        type: 'REPRESENTED-BY',
        strength: 'theorem',
        context: 'eigenfunction expansion of the heat semigroup',
      },
    ]);
  });

  it('keeps hostile free text a plain string field (YAML round-trip)', () => {
    const context = "quotes \" and '#' and: colons, [brackets] — 3 µm";
    const parsed = parse(edgeYamlBlock({ ...proposal, context })) as [Record<string, string>];
    expect(parsed[0].context).toBe(context);
  });

  it('drops the context line when context is blank', () => {
    const block = edgeYamlBlock({ ...proposal, context: '  ' });
    expect(block).not.toContain('context');
    expect(parse(block)).toEqual([
      { from: 'diffusion', to: 'eigenvalues', type: 'REPRESENTED-BY', strength: 'theorem' },
    ]);
  });
});

describe('proposalIssueUrl', () => {
  it('deep-links the edge-proposal form with the claim in machine-usable form', () => {
    const url = new URL(proposalIssueUrl(proposal, reading));
    expect(url.origin + url.pathname).toBe(
      'https://github.com/dnrohr/mathematical-structures/issues/new',
    );
    expect(url.searchParams.get('template')).toBe(EDGE_ISSUE_TEMPLATE);
    expect(url.searchParams.get('title')).toBe('edge: diffusion —REPRESENTED-BY→ eigenvalues');
    expect(url.searchParams.get('claim')).toBe(
      'Diffusion and the heat equation becomes tractable in Eigenvalues and spectral ' +
        'decomposition (theorem, eigenfunction expansion of the heat semigroup)',
    );
    expect(url.searchParams.get('edge')).toBe(edgeYamlBlock(proposal));
  });

  it('reads the strength qualifier as prose and stands alone without context', () => {
    const bare: CompleteProposal = { ...proposal, strength: 'strong-analogy' };
    delete bare.context;
    expect(claimSentence(bare, reading)).toBe(
      'Diffusion and the heat equation becomes tractable in Eigenvalues and spectral ' +
        'decomposition (strong analogy)',
    );
  });
});
