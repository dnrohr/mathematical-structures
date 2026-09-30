import { describe, expect, it } from 'vitest';
import { parseHash } from '../src/shell/router';
import { atlasHash } from '../src/views/atlas';
import { bridgeAtlasHash } from '../src/views/atlas/bridges';
import { flowAtlasHash } from '../src/views/atlas/flow';

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

describe('Structure to Use URL state', () => {
  it('round-trips layout, focus, depth, and grouping deterministically', () => {
    const hash = flowAtlasHash({ focus: 'eigenvalues', depth: 2, group: 'community' });
    expect(hash).toBe('#/atlas?layout=flow&focus=eigenvalues&depth=2&group=community');
    expect(parseHash(hash)).toMatchObject({
      name: 'atlas',
      layout: 'flow',
      focus: 'eigenvalues',
      depth: 2,
      group: 'community',
    });
  });

  it('defaults field grouping and degrades unknown layout or group values safely', () => {
    expect(flowAtlasHash()).toBe('#/atlas?layout=flow');
    expect(parseHash('#/atlas?layout=flow&group=unknown')).toEqual({
      name: 'atlas',
      communities: false,
      layout: 'flow',
    });
    expect(parseHash('#/atlas?layout=unknown')).toEqual({
      name: 'atlas',
      communities: false,
    });
  });
});
