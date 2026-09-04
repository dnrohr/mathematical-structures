/**
 * The atlas-build pipeline, callable from the CLI and from tests.
 * parse → validate → link/render → (emit is the caller's choice).
 */
import { countErrors, type Issue } from './model.js';
import { linkGraph, type LinkedGraph } from './link.js';
import { parseTree } from './parse.js';
import { validateContent } from './validate.js';
import type { AtlasSchema } from './schema.js';

export interface PipelineResult {
  issues: Issue[];
  schema?: AtlasSchema;
  graph?: LinkedGraph;
}

export function runPipeline(root: string): PipelineResult {
  const { schema, concepts, edges, symptoms, issues } = parseTree(root);
  if (!schema || countErrors(issues) > 0) return { issues, schema };

  issues.push(...validateContent(schema, concepts, edges, symptoms));
  if (countErrors(issues) > 0) return { issues, schema };

  // Link + render also produce validation results (unknown wiki-link
  // targets, TeX errors, orphan warns, candidate-edge infos), so they run
  // under --check too.
  const graph = linkGraph(schema, concepts, edges, symptoms);
  issues.push(...graph.issues);
  if (countErrors(issues) > 0) return { issues, schema };

  return { issues, schema, graph };
}
