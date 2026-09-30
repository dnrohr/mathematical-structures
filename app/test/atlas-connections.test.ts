import { describe, expect, it } from 'vitest';
import { connectionAttention } from '../src/views/atlas/connections';

describe('Atlas connection attention', () => {
  const directed = { from: 'focus', to: 'neighbor', symmetric: false };
  const symmetric = { from: 'focus', to: 'peer', symmetric: true };

  it('classifies the unfocused graph as overview', () => {
    expect(connectionAttention(directed)).toBe('overview');
  });

  it('distinguishes directed flow at the focused concept', () => {
    expect(connectionAttention(directed, 'focus')).toBe('outgoing-focus');
    expect(connectionAttention(directed, 'neighbor')).toBe('incoming-focus');
  });

  it('keeps symmetric adjacency markerless and separates neighborhood context', () => {
    expect(connectionAttention(symmetric, 'focus')).toBe('focus-adjacent');
    expect(connectionAttention(symmetric, 'peer')).toBe('focus-adjacent');
    expect(connectionAttention(directed, 'elsewhere')).toBe('context');
  });
});
