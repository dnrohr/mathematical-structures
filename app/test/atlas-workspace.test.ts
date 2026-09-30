import { describe, expect, it } from 'vitest';
import { parseHash } from '../src/shell/router';
import { atlasHash } from '../src/views/atlas';
import { bridgeAtlasHash } from '../src/views/atlas/bridges';

describe('Atlas workspace URL state', () => {
  it('serializes focus with an explicit default depth', () => {
    expect(atlasHash({ focus: 'eigenvalues' })).toBe('#/atlas?focus=eigenvalues&depth=1');
    expect(parseHash(atlasHash({ focus: 'eigenvalues' }))).toEqual({
      name: 'atlas',
      communities: false,
      focus: 'eigenvalues',
      depth: 1,
    });
  });

  it('round-trips two-hop, all, and color state deterministically', () => {
    expect(parseHash(atlasHash({ communities: true, focus: 'eigenvalues', depth: 2 }))).toEqual({
      name: 'atlas',
      communities: true,
      focus: 'eigenvalues',
      depth: 2,
    });
    expect(parseHash(atlasHash({ focus: 'eigenvalues', depth: 'all' }))).toMatchObject({
      name: 'atlas',
      focus: 'eigenvalues',
      depth: 'all',
    });
  });

  it('ignores unsupported depth values and never emits depth without focus', () => {
    expect(parseHash('#/atlas?focus=eigenvalues&depth=99')).toEqual({
      name: 'atlas',
      communities: false,
      focus: 'eigenvalues',
    });
    expect(atlasHash({ depth: 2 })).toBe('#/atlas');
  });
});

describe('Bridge Atlas URL state', () => {
  it('round-trips layout, selection, mode, and filters deterministically', () => {
    const hash = bridgeAtlasHash({
      layout: 'bridges',
      mode: 'frontiers',
      bridge: '2-6',
      filters: { edge: 'GOVERNS', strength: 'theorem', field: 'control' },
    });
    expect(hash).toBe(
      '#/atlas?layout=bridges&mode=frontiers&bridge=2-6&field=control&edge=GOVERNS&strength=theorem',
    );
    expect(parseHash(hash)).toMatchObject({
      name: 'atlas',
      layout: 'bridges',
      mode: 'frontiers',
      bridge: '2-6',
      filters: { edge: 'GOVERNS', strength: 'theorem', field: 'control' },
    });
  });

  it('drops malformed pair syntax and defaults to known bridges', () => {
    expect(parseHash('#/atlas?layout=bridges&bridge=not-a-pair')).toEqual({
      name: 'atlas',
      communities: false,
      layout: 'bridges',
      filters: {},
    });
  });
});
