/**
 * Stage 1 — graph/references.bib reader (ROADMAP M8): a deliberately strict
 * BibTeX subset, so the file stays boring and diffable like every other
 * content file. Concrete entries only — no @string/@preamble/@comment
 * macros, no `#` concatenation, no TeX escapes (the file is UTF-8: write
 * ö, é, – directly). Values become display text: braces are dropped and
 * whitespace runs collapse to a single space. Entry-level correctness
 * (key format, duplicates, required fields) is the validator's job; this
 * reader collects syntax errors in batch like the other stage-1 readers.
 */
import type { Issue, ReferenceRecord } from './model.js';

export interface ParsedBib {
  references: ReferenceRecord[];
  issues: Issue[];
}

const IDENT = /[A-Za-z][A-Za-z0-9_-]*/y;
const KEY = /[^\s,{}]+/y;
const NUMBER = /^[0-9]+$/;

/** Everything BibTeX allows between entries: blanks and % comment lines. */
const UNSUPPORTED = new Set(['string', 'preamble', 'comment']);

function normalizeValue(raw: string): string {
  return raw.replace(/[{}]/g, '').replace(/\s+/g, ' ').trim();
}

export function parseBib(text: string, file: string): ParsedBib {
  const references: ReferenceRecord[] = [];
  const issues: Issue[] = [];
  let i = 0;

  const lineAt = (pos: number): number => {
    let line = 1;
    for (let j = 0; j < pos && j < text.length; j++) if (text[j] === '\n') line++;
    return line;
  };
  const error = (rule: string, pos: number, message: string): void => {
    issues.push({ severity: 'error', rule, file: `${file}:${String(lineAt(pos))}`, message });
  };
  /** Recover from a malformed construct: resume at the next entry marker. */
  const skipToNextEntry = (from: number): number => {
    const next = text.indexOf('@', from);
    return next === -1 ? text.length : next;
  };
  const skipWs = (): void => {
    while (i < text.length && /\s/.test(text[i]!)) i++;
  };
  const match = (re: RegExp): string | undefined => {
    re.lastIndex = i;
    const m = re.exec(text);
    if (!m) return undefined;
    i = re.lastIndex;
    return m[0];
  };

  /** Parse one field value; undefined = syntax error already reported. */
  const parseValue = (): string | undefined => {
    const start = i;
    const c = text[i];
    if (c === '{') {
      let depth = 1;
      i++;
      const from = i;
      while (i < text.length && depth > 0) {
        if (text[i] === '{') depth++;
        else if (text[i] === '}') depth--;
        i++;
      }
      if (depth > 0) {
        error('bib/syntax', start, 'unterminated {braced} value');
        return undefined;
      }
      return normalizeValue(text.slice(from, i - 1));
    }
    if (c === '"') {
      i++;
      const from = i;
      while (i < text.length && text[i] !== '"') i++;
      if (i >= text.length) {
        error('bib/syntax', start, 'unterminated "quoted" value');
        return undefined;
      }
      i++;
      return normalizeValue(text.slice(from, i - 1));
    }
    const bare = match(KEY);
    if (bare === undefined || !NUMBER.test(bare)) {
      error(
        'bib/syntax',
        start,
        'field values must be {braced}, "quoted", or a bare number (macros and # concatenation are not supported)',
      );
      return undefined;
    }
    return bare;
  };

  /** Parse the entry starting at the current `@`; undefined on syntax error. */
  const parseEntry = (): ReferenceRecord | undefined => {
    const at = i;
    i++; // consume '@'
    const rawType = match(IDENT);
    if (rawType === undefined) {
      error('bib/syntax', at, '"@" must be followed by an entry type, like @book{...}');
      return undefined;
    }
    const entryType = rawType.toLowerCase();
    if (UNSUPPORTED.has(entryType)) {
      error(
        'bib/unsupported',
        at,
        `@${entryType} is not supported — only concrete entries, written in plain UTF-8`,
      );
      return undefined;
    }
    skipWs();
    if (text[i] !== '{') {
      error('bib/syntax', at, `@${entryType} needs a "{" after the entry type`);
      return undefined;
    }
    i++;
    skipWs();
    const key = match(KEY);
    if (key === undefined) {
      error('bib/syntax', at, `@${entryType} entry is missing its citation key`);
      return undefined;
    }
    skipWs();
    if (text[i] === ',') i++;
    else if (text[i] !== '}') {
      error('bib/syntax', at, `expected "," after the citation key "${key}"`);
      return undefined;
    }

    const fields: Record<string, string> = {};
    for (;;) {
      skipWs();
      if (i >= text.length) {
        error('bib/syntax', at, `unterminated entry "${key}" — missing its closing "}"`);
        return undefined;
      }
      if (text[i] === '}') {
        i++;
        return { key, entryType, fields, file, line: lineAt(at) };
      }
      const fieldStart = i;
      const rawName = match(IDENT);
      if (rawName === undefined) {
        error('bib/syntax', fieldStart, `expected a field name or "}" in entry "${key}"`);
        return undefined;
      }
      const name = rawName.toLowerCase();
      skipWs();
      if (text[i] !== '=') {
        error('bib/syntax', fieldStart, `field "${name}" in entry "${key}" needs "= <value>"`);
        return undefined;
      }
      i++;
      skipWs();
      const value = parseValue();
      if (value === undefined) return undefined;
      if (name in fields) {
        error('bib/duplicate-field', fieldStart, `entry "${key}" sets "${name}" more than once`);
      } else {
        fields[name] = value;
      }
      skipWs();
      if (text[i] === ',') i++;
      else if (text[i] !== '}') {
        error('bib/syntax', i, `expected "," or "}" after field "${name}" in entry "${key}"`);
        return undefined;
      }
    }
  };

  while (i < text.length) {
    const c = text[i]!;
    if (/\s/.test(c)) {
      i++;
    } else if (c === '%') {
      const eol = text.indexOf('\n', i);
      i = eol === -1 ? text.length : eol + 1;
    } else if (c === '@') {
      const record = parseEntry();
      if (record) references.push(record);
      else i = skipToNextEntry(i);
    } else {
      // Stricter than BibTeX (which ignores stray text): a typo'd entry
      // must fail loudly, not silently vanish from the bibliography.
      error('bib/syntax', i, 'unexpected text outside an entry (comments start with "%")');
      i = skipToNextEntry(i);
    }
  }

  return { references, issues };
}
