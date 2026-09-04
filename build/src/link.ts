/**
 * Stage 3a — link: resolve the validated records into the denormalized
 * graph the app consumes (ARCHITECTURE.md §4.3): rendered bodies,
 * backlinks, per-node connections with display phrasings, plus the
 * link-level rules (orphan warns, candidate-edge infos).
 *
 * Precondition: validateContent returned no errors, so coercions here
 * are safe.
 */
import {
  type ConceptRecord,
  type EdgeRecord,
  type GraphEdge,
  type GraphNode,
  type GraphSymptom,
  type Issue,
  type NodeConnection,
  type SymptomRecord,
} from './model.js';
import type { RenderedBodies } from './render.js';
import type { AtlasSchema, EdgeType } from './schema.js';

export interface LinkedGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
  symptoms: GraphSymptom[];
  issues: Issue[];
}

function strings(v: unknown): string[] {
  return Array.isArray(v) ? v.map(String) : [];
}

function optionalString(v: unknown): string | undefined {
  return typeof v === 'string' && v.trim().length > 0 ? v : undefined;
}

export function linkGraph(
  schema: AtlasSchema,
  concepts: ConceptRecord[],
  edgeRecords: EdgeRecord[],
  symptomRecords: SymptomRecord[],
  rendered: RenderedBodies,
): LinkedGraph {
  const issues: Issue[] = [];
  const edgeTypesById = new Map<string, EdgeType>(schema.edge_types.map((t) => [t.id, t]));
  const { htmlBySlug, outLinks } = rendered;

  // Backlinks: who links to me (unique, sorted).
  const backlinks = new Map<string, Set<string>>();
  for (const [from, targets] of outLinks) {
    for (const target of targets) {
      if (target === from) continue;
      let set = backlinks.get(target);
      if (!set) backlinks.set(target, (set = new Set()));
      set.add(from);
    }
  }

  // Edges: typed; symmetry comes from the edge type alone.
  const edges: GraphEdge[] = edgeRecords.map((e) => {
    const type = String(e.raw.type);
    const def = edgeTypesById.get(type)!;
    return {
      from: String(e.raw.from),
      to: String(e.raw.to),
      type,
      strength: String(e.raw.strength),
      symmetric: def.directionality === 'symmetric',
      context: optionalString(e.raw.context),
      status: optionalString(e.raw.status),
      notes: optionalString(e.raw.notes),
      evidence: strings(e.raw.evidence),
    };
  });
  edges.sort(
    (a, b) =>
      a.from.localeCompare(b.from) || a.to.localeCompare(b.to) || a.type.localeCompare(b.type),
  );

  // Per-node connections with display phrasings from the schema.
  const connections = new Map<string, NodeConnection[]>();
  const touchedByEdge = new Set<string>();
  const pairHasEdge = new Set<string>();
  const push = (slug: string, conn: NodeConnection): void => {
    let list = connections.get(slug);
    if (!list) connections.set(slug, (list = []));
    list.push(conn);
  };
  for (const edge of edges) {
    const def = edgeTypesById.get(edge.type)!;
    const shared = {
      type: edge.type,
      strength: edge.strength,
      context: edge.context,
      status: edge.status,
      notes: edge.notes,
    };
    if (edge.symmetric) {
      const phrase = def.phrase ?? def.forward ?? def.label;
      push(edge.from, { other: edge.to, direction: 'sym', phrase, ...shared });
      push(edge.to, { other: edge.from, direction: 'sym', phrase, ...shared });
    } else {
      push(edge.from, {
        other: edge.to,
        direction: 'out',
        phrase: def.forward ?? def.label,
        ...shared,
      });
      push(edge.to, {
        other: edge.from,
        direction: 'in',
        phrase: def.reverse ?? def.label,
        ...shared,
      });
    }
    touchedByEdge.add(edge.from);
    touchedByEdge.add(edge.to);
    pairHasEdge.add([edge.from, edge.to].sort().join('|'));
  }
  for (const list of connections.values()) {
    list.sort((a, b) => a.type.localeCompare(b.type) || a.other.localeCompare(b.other));
  }

  // Link-level rules.
  for (const c of concepts) {
    if (!touchedByEdge.has(c.slug) && !(backlinks.get(c.slug)?.size ?? 0)) {
      issues.push({
        severity: 'warn',
        rule: 'node/orphan',
        file: c.file,
        message: `"${c.slug}" has no edges and no incoming wiki-links`,
      });
    }
  }
  const candidatesSeen = new Set<string>();
  for (const [from, targets] of outLinks) {
    for (const target of targets) {
      if (target === from) continue;
      const pair = [from, target].sort().join('|');
      if (pairHasEdge.has(pair) || candidatesSeen.has(pair)) continue;
      candidatesSeen.add(pair);
      issues.push({
        severity: 'info',
        rule: 'link/candidate-edge',
        file: `${from} ↔ ${target}`,
        message: 'wiki-linked in prose but no typed edge exists; consider adding one',
      });
    }
  }

  // Assemble nodes.
  const nodes: GraphNode[] = concepts
    .map((c) => {
      const aliases = Array.isArray(c.front.aliases)
        ? (c.front.aliases as { name: string; field: string }[]).map((a) => ({
            name: String(a.name),
            field: String(a.field),
          }))
        : [];
      return {
        slug: c.slug,
        canonical_name: String(c.front.canonical_name),
        node_type: String(c.front.node_type),
        status: String(c.front.status),
        summary: String(c.front.summary).trim(),
        fields: strings(c.front.fields),
        aliases,
        assumptions: strings(c.front.assumptions),
        canonical_examples: strings(c.front.canonical_examples),
        sections: strings(c.front.sections),
        html: htmlBySlug.get(c.slug) ?? '',
        backlinks: [...(backlinks.get(c.slug) ?? [])].sort(),
        connections: connections.get(c.slug) ?? [],
      };
    })
    .sort((a, b) => a.slug.localeCompare(b.slug));

  const symptoms: GraphSymptom[] = symptomRecords
    .map((s) => ({
      id: String(s.raw.id),
      symptom: String(s.raw.symptom),
      moves: strings(s.raw.moves),
      mature_fields: strings(s.raw.mature_fields),
      worked_example: optionalString(s.raw.worked_example),
    }))
    .sort((a, b) => a.id.localeCompare(b.id));

  return { nodes, edges, symptoms, issues };
}
