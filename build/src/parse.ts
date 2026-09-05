/**
 * Stage 1 — parse: read the content tree into typed records, collecting all
 * errors in one run rather than dying at the first (ARCHITECTURE.md §4.1).
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse as parseYaml } from 'yaml';
import { parseBib } from './bib.js';
import {
  SLUG,
  type ConceptRecord,
  type EdgeRecord,
  type Issue,
  type NonEdgeRecord,
  type ReferenceRecord,
  type SymptomRecord,
  type WalkRecord,
} from './model.js';
import { loadSchema, type AtlasSchema } from './schema.js';

export interface ParsedTree {
  schema?: AtlasSchema;
  concepts: ConceptRecord[];
  edges: EdgeRecord[];
  symptoms: SymptomRecord[];
  nonEdges: NonEdgeRecord[];
  references: ReferenceRecord[];
  walks: WalkRecord[];
  issues: Issue[];
}

const FRONT_MATTER = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function parseConcept(file: string, slug: string, issues: Issue[]): ConceptRecord | undefined {
  const text = readFileSync(file, 'utf8');
  if (!SLUG.test(slug)) {
    issues.push({
      severity: 'error',
      rule: 'content/slug-format',
      file,
      message: `filename slug "${slug}" must be lowercase-kebab (${SLUG})`,
    });
    return undefined;
  }
  const m = FRONT_MATTER.exec(text);
  if (!m) {
    issues.push({
      severity: 'error',
      rule: 'content/frontmatter-missing',
      file,
      message: 'concept file must start with a "---" YAML front-matter block',
    });
    return undefined;
  }
  let front: unknown;
  try {
    front = parseYaml(m[1]!);
  } catch (e) {
    issues.push({
      severity: 'error',
      rule: 'content/frontmatter-yaml',
      file,
      message: `front-matter YAML parse error: ${(e as Error).message}`,
    });
    return undefined;
  }
  if (!isRecord(front)) {
    issues.push({
      severity: 'error',
      rule: 'content/frontmatter-shape',
      file,
      message: 'front-matter must be a YAML mapping',
    });
    return undefined;
  }
  return { slug, file, front, body: text.slice(m[0].length) };
}

function parseYamlListFile(
  path: string,
  label: string,
  issues: Issue[],
): Record<string, unknown>[] {
  if (!existsSync(path)) {
    issues.push({
      severity: 'error',
      rule: 'content/missing-file',
      file: path,
      message: `${label} file is missing`,
    });
    return [];
  }
  let data: unknown;
  try {
    data = parseYaml(readFileSync(path, 'utf8'));
  } catch (e) {
    issues.push({
      severity: 'error',
      rule: 'content/yaml',
      file: path,
      message: `YAML parse error: ${(e as Error).message}`,
    });
    return [];
  }
  if (data === null) return []; // comments-only file counts as empty
  if (!Array.isArray(data)) {
    issues.push({
      severity: 'error',
      rule: 'content/shape',
      file: path,
      message: 'top level must be a YAML list',
    });
    return [];
  }
  const out: Record<string, unknown>[] = [];
  data.forEach((entry, i) => {
    if (!isRecord(entry)) {
      issues.push({
        severity: 'error',
        rule: 'content/entry-shape',
        file: path,
        message: `entry [${i}] must be a mapping`,
      });
      return;
    }
    out.push(entry);
  });
  return out;
}

/** One walk per file; the id is the filename, like concept slugs (§3.7). */
function parseWalk(file: string, id: string, issues: Issue[]): WalkRecord | undefined {
  if (!SLUG.test(id)) {
    issues.push({
      severity: 'error',
      rule: 'content/slug-format',
      file,
      message: `filename walk id "${id}" must be lowercase-kebab (${SLUG})`,
    });
    return undefined;
  }
  let data: unknown;
  try {
    data = parseYaml(readFileSync(file, 'utf8'));
  } catch (e) {
    issues.push({
      severity: 'error',
      rule: 'content/yaml',
      file,
      message: `YAML parse error: ${(e as Error).message}`,
    });
    return undefined;
  }
  if (!isRecord(data)) {
    issues.push({
      severity: 'error',
      rule: 'content/shape',
      file,
      message: 'top level must be a YAML mapping (title, summary, steps)',
    });
    return undefined;
  }
  return { id, file, raw: data };
}

/** Read the whole content tree rooted at `root`. */
export function parseTree(root: string): ParsedTree {
  const issues: Issue[] = [];

  const { schema, issues: schemaIssues } = loadSchema(join(root, 'graph', 'schema.yaml'));
  issues.push(...schemaIssues);

  const concepts: ConceptRecord[] = [];
  const conceptsDir = join(root, 'concepts');
  if (existsSync(conceptsDir)) {
    for (const name of readdirSync(conceptsDir).sort()) {
      if (!name.endsWith('.md')) continue;
      const record = parseConcept(join(conceptsDir, name), name.slice(0, -3), issues);
      if (record) concepts.push(record);
    }
  }

  const edgesFile = join(root, 'graph', 'edges.yaml');
  const edges: EdgeRecord[] = parseYamlListFile(edgesFile, 'edges', issues).map((raw, index) => ({
    file: edgesFile,
    index,
    raw,
  }));

  const symptomsFile = join(root, 'graph', 'symptoms.yaml');
  const symptoms: SymptomRecord[] = parseYamlListFile(symptomsFile, 'symptoms', issues).map(
    (raw, index) => ({ file: symptomsFile, index, raw }),
  );

  // The reject ledger is optional content (an atlas that has never recorded
  // a deliberate non-connection is valid — UI_REDESIGN.md §4.6).
  const nonEdgesFile = join(root, 'graph', 'non-edges.yaml');
  let nonEdges: NonEdgeRecord[] = [];
  if (existsSync(nonEdgesFile)) {
    nonEdges = parseYamlListFile(nonEdgesFile, 'non-edges', issues).map((raw, index) => ({
      file: nonEdgesFile,
      index,
      raw,
    }));
  }

  // The bibliography is optional content (an atlas without citations is
  // valid — spec §8.2); when absent, any `evidence` key is simply unknown.
  const bibFile = join(root, 'graph', 'references.bib');
  let references: ReferenceRecord[] = [];
  if (existsSync(bibFile)) {
    const bib = parseBib(readFileSync(bibFile, 'utf8'), bibFile);
    references = bib.references;
    issues.push(...bib.issues);
  }

  // Walks are optional content too (an atlas without tours is valid).
  const walks: WalkRecord[] = [];
  const pathsDir = join(root, 'paths');
  if (existsSync(pathsDir)) {
    for (const name of readdirSync(pathsDir).sort()) {
      if (!name.endsWith('.yaml')) continue;
      const record = parseWalk(join(pathsDir, name), name.slice(0, -5), issues);
      if (record) walks.push(record);
    }
  }

  return { schema, concepts, edges, symptoms, nonEdges, references, walks, issues };
}
