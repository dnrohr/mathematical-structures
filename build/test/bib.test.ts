import { describe, expect, it } from 'vitest';
import { parseBib } from '../src/bib.js';

const FILE = 'graph/references.bib';

function rules(text: string): string[] {
  return parseBib(text, FILE).issues.map((i) => `${i.severity}:${i.rule}`);
}

describe('parseBib happy path', () => {
  it('reads braced, quoted, and bare-number values, with comments between entries', () => {
    const { references, issues } = parseBib(
      `% a comment line
@Book{doob-1953,
  author    = {Doob, Joseph L.},
  title     = "Stochastic Processes",
  publisher = {Wiley},
  year      = 1953,
}
% another comment
@article{kalman-1960,
  title = {A New Approach},
  year  = {1960}
}
`,
      FILE,
    );
    expect(issues).toEqual([]);
    expect(references).toHaveLength(2);
    const [doob, kalman] = references;
    // Entry types and field names are case-insensitive; keys are literal.
    expect(doob).toMatchObject({ key: 'doob-1953', entryType: 'book', line: 2 });
    expect(doob!.fields).toEqual({
      author: 'Doob, Joseph L.',
      title: 'Stochastic Processes',
      publisher: 'Wiley',
      year: '1953',
    });
    expect(kalman!.fields['year']).toBe('1960');
  });

  it('collapses whitespace and drops braces from values (display text)', () => {
    const { references } = parseBib(
      `@book{k, title = {A {Very}
        Long   Title}, year = {1999}}`,
      FILE,
    );
    expect(references[0]!.fields['title']).toBe('A Very Long Title');
  });

  it('keeps nested braces balanced', () => {
    const { references, issues } = parseBib(
      '@misc{k, title = {outer {inner {deep}} rest}, year = {2000}}',
      FILE,
    );
    expect(issues).toEqual([]);
    expect(references[0]!.fields['title']).toBe('outer inner deep rest');
  });

  it('accepts an empty or comment-only file', () => {
    expect(parseBib('', FILE)).toEqual({ references: [], issues: [] });
    expect(parseBib('% nothing yet\n', FILE).issues).toEqual([]);
  });
});

describe('parseBib syntax errors (batch-collected, with recovery)', () => {
  it('rejects stray text outside entries instead of silently ignoring it', () => {
    // BibTeX would ignore this; here a typo'd entry must not vanish.
    const out = parseBib('book{lost-at, year = {1}}\n@misc{ok, title={T}, year={2}}\n', FILE);
    expect(out.issues.map((i) => `${i.severity}:${i.rule}`)).toEqual(['error:bib/syntax']);
    // ...and parsing recovered at the next entry.
    expect(out.references.map((r) => r.key)).toEqual(['ok']);
  });

  it('rejects @string/@preamble/@comment constructs', () => {
    expect(rules('@string{me = {Me}}')).toEqual(['error:bib/unsupported']);
    expect(rules('@preamble{ {x} }')).toEqual(['error:bib/unsupported']);
  });

  it('rejects unterminated entries and values', () => {
    expect(rules('@book{k, title = {open')).toContain('error:bib/syntax');
    expect(rules('@book{k, title = "open')).toContain('error:bib/syntax');
    expect(rules('@book{k, title = {t}, year = {1}')).toContain('error:bib/syntax');
  });

  it('rejects macros and # concatenation (bare values must be numbers)', () => {
    expect(rules('@book{k, month = jan}')).toContain('error:bib/syntax');
    expect(rules('@book{k, title = {a} # {b}}')).toContain('error:bib/syntax');
  });

  it('rejects a duplicated field within one entry, keeping the first value', () => {
    const out = parseBib('@book{k, year = {1953}, year = {1999}}', FILE);
    expect(out.issues.map((i) => i.rule)).toEqual(['bib/duplicate-field']);
    expect(out.references[0]!.fields['year']).toBe('1953');
  });

  it('points errors at the offending line', () => {
    const out = parseBib('% one\n% two\n@book{k, title = {open\n', FILE);
    expect(out.issues[0]!.file).toBe(`${FILE}:3`);
  });
});
