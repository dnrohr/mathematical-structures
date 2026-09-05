/**
 * atlas-build — compiler/validator CLI for the Structure Atlas
 * (ARCHITECTURE.md §4).
 *
 * Usage: atlas [--check] [--root <dir>] [--out <dir>]
 *
 *   --check   validate only (parse, content rules, link/render rules);
 *             the CI gate. No files are written.
 *   --root    content root (default: nearest ancestor with graph/schema.yaml)
 *   --out     artifact directory (default: <root>/dist/data)
 *
 * A full run additionally analyzes (stage 4 metrics over the trusted
 * subgraph) and emits graph.json, search-index.json, and the GraphML/CSV
 * exports.
 */
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { exit } from 'node:process';
import { analyzeGraph } from './analyze.js';
import {
  buildGraphJson,
  buildSearchIndex,
  gitSha,
  stableStringify,
  writeArtifacts,
} from './emit.js';
import { buildEdgesCsv, buildGraphml, buildNodesCsv } from './export.js';
import { countErrors, type Issue } from './model.js';
import { runPipeline } from './pipeline.js';

interface Args {
  check: boolean;
  root: string;
  out?: string;
}

/**
 * Default content root: nearest ancestor of cwd containing graph/schema.yaml.
 * npm runs workspace scripts with cwd inside the workspace, so plain cwd
 * would miss the repository root. --root overrides (ARCHITECTURE.md §9 #5:
 * the build is parameterized on a content directory).
 */
function findContentRoot(start: string): string {
  let dir = start;
  for (;;) {
    if (existsSync(join(dir, 'graph', 'schema.yaml'))) return dir;
    const parent = dirname(dir);
    if (parent === dir) return start;
    dir = parent;
  }
}

function parseArgs(argv: string[]): Args {
  const args: Args = { check: false, root: findContentRoot(process.cwd()) };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--check') args.check = true;
    else if (a === '--root' || a === '--out') {
      const v = argv[++i];
      if (!v) {
        console.error(`atlas-build: ${a} needs a directory argument`);
        exit(2);
      }
      if (a === '--root') args.root = v;
      else args.out = v;
    } else {
      console.error(`atlas-build: unknown argument "${a}"`);
      exit(2);
    }
  }
  return args;
}

function printIssues(issues: Issue[]): void {
  const order = { error: 0, warn: 1, info: 2 } as const;
  for (const issue of [...issues].sort((a, b) => order[a.severity] - order[b.severity])) {
    console.log(`[${issue.severity}] ${issue.rule} ${issue.file}: ${issue.message}`);
  }
}

function main(): void {
  const args = parseArgs(process.argv.slice(2));
  const result = runPipeline(args.root);
  printIssues(result.issues);

  const errors = countErrors(result.issues);
  const warns = result.issues.filter((i) => i.severity === 'warn').length;
  const infos = result.issues.filter((i) => i.severity === 'info').length;

  if (errors > 0) {
    console.log(`atlas-build: FAILED — ${errors} error(s), ${warns} warn(s), ${infos} info(s)`);
    exit(1);
  }

  const g = result.graph!;
  console.log(
    `content OK: ${g.nodes.length} nodes, ${g.edges.length} edges, ` +
      `${g.symptoms.length} symptoms, ${g.references.length} references — ` +
      `${warns} warn(s), ${infos} info(s)`,
  );
  if (args.check) exit(0);

  const outDir = args.out ?? join(args.root, 'dist', 'data');
  const metrics = analyzeGraph(result.schema!, g.nodes, g.edges, g.candidates);
  const graphJson = buildGraphJson(
    result.schema!,
    g.nodes,
    g.edges,
    g.symptoms,
    g.references,
    metrics,
    gitSha(args.root),
  );
  const searchIndex = buildSearchIndex(g.nodes, g.symptoms);
  const paths = writeArtifacts(outDir, {
    'graph.json': stableStringify(graphJson),
    'search-index.json': stableStringify(searchIndex),
    'atlas.graphml': buildGraphml(g.nodes, g.edges, metrics),
    'nodes.csv': buildNodesCsv(g.nodes, metrics),
    'edges.csv': buildEdgesCsv(g.edges),
  });
  for (const path of paths) console.log(`wrote ${path}`);
  exit(0);
}

main();
