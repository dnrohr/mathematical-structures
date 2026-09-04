/**
 * The schema↔style gate (ROADMAP M3, ARCHITECTURE.md §5.3): every vocabulary
 * token in graph/schema.yaml must have a visual identity in the semantic
 * style module, in BOTH themes. A new node type or strength added to the
 * schema fails `npm run check` here until it gets one — the spec's "visual
 * grammar has exactly one definition" made mechanical.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';

interface SchemaDoc {
  node_types: { id: string; color_token: string }[];
  strengths: { id: string; line: string; emphasis: string }[];
}

const schema = parse(
  readFileSync(fileURLToPath(new URL('../../graph/schema.yaml', import.meta.url)), 'utf8'),
) as SchemaDoc;
const css = readFileSync(fileURLToPath(new URL('../src/style/main.css', import.meta.url)), 'utf8');

const count = (needle: string): number => css.split(needle).length - 1;

describe('semantic style module covers every schema token', () => {
  it('reads a plausible schema', () => {
    expect(schema.node_types.length).toBeGreaterThan(0);
    expect(schema.strengths.length).toBeGreaterThan(0);
  });

  it('gives every node-type color token a light and a dark hue', () => {
    for (const nt of schema.node_types) {
      const token = nt.color_token;
      expect(count(`--l-${token}:`), `light literal for ${token}`).toBe(1);
      expect(count(`--d-${token}:`), `dark literal for ${token}`).toBe(1);
    }
  });

  it('maps every node-type token in all three theme blocks', () => {
    for (const nt of schema.node_types) {
      const token = nt.color_token;
      // :root default…
      expect(count(`--${token}: var(--l-${token})`), `light mapping for ${token}`).toBe(1);
      // …plus prefers-color-scheme block and the manual data-theme override.
      expect(count(`--${token}: var(--d-${token})`), `dark mappings for ${token}`).toBe(2);
    }
  });

  it('defines the line/emphasis grammar for every strength', () => {
    for (const s of schema.strengths) {
      expect(count(`.line-${s.line}`), `line style for ${s.id}`).toBeGreaterThanOrEqual(1);
      expect(count(`.emph-${s.emphasis}`), `emphasis for ${s.id}`).toBeGreaterThanOrEqual(1);
    }
  });
});
