/**
 * The work queue's pure helpers (ROADMAP M11): the "record a non-edge"
 * action carries a ready-to-paste graph/non-edges.yaml entry — like the
 * M10 composer's edges.yaml block, it must be real YAML that parses back
 * to the normalized pair a maintainer lands.
 */
import { parse } from 'yaml';
import { describe, expect, it } from 'vitest';
import { nonEdgeYamlBlock } from '../src/views/queue';

describe('nonEdgeYamlBlock', () => {
  it('is real YAML that parses back to the pair, normalized to sorted order', () => {
    const parsed = parse(nonEdgeYamlBlock('z-node', 'a-node')) as {
      between: string[];
      reason: string;
    }[];
    expect(parsed).toHaveLength(1);
    expect(parsed[0]!.between).toEqual(['a-node', 'z-node']);
    expect(parsed[0]!.reason.length).toBeGreaterThan(0);
  });
});
