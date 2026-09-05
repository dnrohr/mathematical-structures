/**
 * Stage 5 — export emitters (spec §8.7, ROADMAP M5): GraphML and nodes/edges
 * CSV alongside graph.json, so network-analysis tools (Gephi, igraph,
 * networkx, spreadsheets) can consume the atlas without custom code. Same
 * determinism contract as graph.json: same tree → byte-identical files.
 *
 * GraphML keeps every edge in its stored direction and carries `symmetric`
 * as an attribute rather than mixing per-edge directedness — mixed graphs
 * are the one GraphML feature common readers reject.
 */
import type { GraphEdge, GraphMetrics, GraphNode } from './model.js';

function xml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const NODE_KEYS: { id: string; type: string }[] = [
  { id: 'label', type: 'string' },
  { id: 'node_type', type: 'string' },
  { id: 'status', type: 'string' },
  { id: 'fields', type: 'string' },
  { id: 'degree', type: 'int' },
  { id: 'betweenness', type: 'double' },
  { id: 'community', type: 'int' },
  { id: 'span_entropy', type: 'double' },
  { id: 'dialect_count', type: 'int' },
];

const EDGE_KEYS: { id: string; type: string }[] = [
  { id: 'type', type: 'string' },
  { id: 'strength', type: 'string' },
  { id: 'symmetric', type: 'boolean' },
  { id: 'gap_status', type: 'string' },
  { id: 'context', type: 'string' },
  { id: 'notes', type: 'string' },
  { id: 'evidence', type: 'string' },
];

export function buildGraphml(
  nodes: GraphNode[],
  edges: GraphEdge[],
  metrics: GraphMetrics,
): string {
  const lines: string[] = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<graphml xmlns="http://graphml.graphdrawing.org/xmlns">',
    ...NODE_KEYS.map(
      (k) => `  <key id="n_${k.id}" for="node" attr.name="${k.id}" attr.type="${k.type}"/>`,
    ),
    ...EDGE_KEYS.map(
      (k) => `  <key id="e_${k.id}" for="edge" attr.name="${k.id}" attr.type="${k.type}"/>`,
    ),
    '  <graph id="structure-atlas" edgedefault="directed">',
  ];
  const data = (key: string, value: string | number | boolean | null | undefined): void => {
    if (value === undefined || value === null || value === '') return;
    lines.push(`      <data key="${key}">${xml(String(value))}</data>`);
  };
  for (const node of nodes) {
    const m = metrics.nodes[node.slug];
    lines.push(`    <node id="${xml(node.slug)}">`);
    data('n_label', node.canonical_name);
    data('n_node_type', node.node_type);
    data('n_status', node.status);
    data('n_fields', node.fields.join(';'));
    data('n_degree', m?.degree);
    data('n_betweenness', m?.betweenness);
    data('n_community', m?.community);
    data('n_span_entropy', m?.span_entropy);
    data('n_dialect_count', m?.dialect_count);
    lines.push('    </node>');
  }
  for (const edge of edges) {
    lines.push(`    <edge source="${xml(edge.from)}" target="${xml(edge.to)}">`);
    data('e_type', edge.type);
    data('e_strength', edge.strength);
    data('e_symmetric', edge.symmetric);
    data('e_gap_status', edge.status);
    data('e_context', edge.context?.trim());
    data('e_notes', edge.notes?.trim());
    data('e_evidence', edge.evidence.join(';'));
    lines.push('    </edge>');
  }
  lines.push('  </graph>', '</graphml>');
  return lines.join('\n') + '\n';
}

/** RFC 4180: quote a field when it contains a comma, quote, or newline. */
function csvField(value: string | number | boolean | null | undefined): string {
  if (value === undefined || value === null) return '';
  const text = String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function csv(rows: (string | number | boolean | null | undefined)[][]): string {
  return rows.map((row) => row.map(csvField).join(',')).join('\r\n') + '\r\n';
}

export function buildNodesCsv(nodes: GraphNode[], metrics: GraphMetrics): string {
  const header = [
    'slug',
    'canonical_name',
    'node_type',
    'status',
    'fields',
    'degree',
    'betweenness',
    'community',
    'span_entropy',
    'dialect_count',
    'summary',
  ];
  const rows = nodes.map((node) => {
    const m = metrics.nodes[node.slug];
    return [
      node.slug,
      node.canonical_name,
      node.node_type,
      node.status,
      node.fields.join(';'),
      m?.degree ?? 0,
      m?.betweenness ?? 0,
      m?.community ?? '',
      m?.span_entropy ?? 0,
      m?.dialect_count ?? 0,
      node.summary,
    ];
  });
  return csv([header, ...rows]);
}

export function buildEdgesCsv(edges: GraphEdge[]): string {
  const header = [
    'from',
    'to',
    'type',
    'strength',
    'symmetric',
    'gap_status',
    'context',
    'notes',
    'evidence',
  ];
  const rows = edges.map((edge) => [
    edge.from,
    edge.to,
    edge.type,
    edge.strength,
    edge.symmetric,
    edge.status ?? '',
    edge.context?.trim() ?? '',
    edge.notes?.trim() ?? '',
    edge.evidence.join(';'),
  ]);
  return csv([header, ...rows]);
}
