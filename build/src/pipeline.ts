/**
 * The atlas-build pipeline, callable from the CLI and from tests.
 * parse → validate + render (always both, so one run reports every kind of
 * error in a single batch) → link (graph assembly, only on a clean tree) →
 * (emit is the caller's choice).
 */
import { countErrors, type Issue } from './model.js';
import { linkGraph, type LinkedGraph } from './link.js';
import { parseTree } from './parse.js';
import { renderAllBodies } from './render.js';
import { validateContent } from './validate.js';
import type { AtlasSchema } from './schema.js';

export interface PipelineResult {
  issues: Issue[];
  schema?: AtlasSchema;
  graph?: LinkedGraph;
}

export function runPipeline(root: string): PipelineResult {
  const { schema, concepts, edges, symptoms, issues } = parseTree(root);
  if (!schema) return { issues };

  // Content validation and body rendering are independent; run both even
  // when either (or parse) reported errors, so authors see edge problems,
  // TeX problems, and wiki-link problems together in one --check run.
  issues.push(...validateContent(schema, concepts, edges, symptoms));
  const rendered = renderAllBodies(concepts);
  issues.push(...rendered.issues);
  if (countErrors(issues) > 0) return { issues, schema };

  // Graph assembly (and its orphan/candidate rules) only on a clean tree.
  const graph = linkGraph(schema, concepts, edges, symptoms, rendered);
  issues.push(...graph.issues);
  return { issues, schema, graph };
}
