/**
 * Stage 1 — parse: read the content tree into typed records, collecting all
 * errors in one run rather than dying at the first (ARCHITECTURE.md §4.1).
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse as parseYaml } from 'yaml';
import {
  SLUG,
  type ConceptRecord,
  type EdgeRecord,
  type Issue,
  type SymptomRecord,
} from './model.js';
import { loadSchema, type AtlasSchema } from './schema.js';

export interface ParsedTree {
  schema?: AtlasSchema;
  concepts: ConceptRecord[];
  edges: EdgeRecord[];
  symptoms: SymptomRecord[];
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

  return { schema, concepts, edges, symptoms, issues };
}
