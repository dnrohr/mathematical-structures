/**
 * Citations (spec §8.2, ROADMAP M8). Every claim that carries `evidence`
 * keys renders a compact marker — a native disclosure, so the full
 * reference is one keypress away wherever the claim appears — and concept
 * pages aggregate the works their claims cite into a Sources list.
 * Formatting is plain author–year prose from the resolved reference
 * fields; the DOI (preferred) or URL links the title.
 */
import type { Atlas } from '../../data/atlas';
import type { GraphNode, GraphReference } from '../../data/types';
import { h, type Child } from './dom';

/** BibTeX "Last, First and Last, First" → display "First Last, First Last". */
export function formatAuthors(author: string): string {
  return author
    .split(/\s+and\s+/)
    .map((name) => {
      const m = /^([^,]+),\s*(.+)$/.exec(name.trim());
      return m ? `${m[2]!} ${m[1]!}` : name.trim();
    })
    .join(', ');
}

/** The where-published fragment, shaped by the entry type. */
function venueOf(ref: GraphReference): string {
  const f = ref.fields;
  switch (ref.entry_type) {
    case 'article': {
      let v = f['journal'] ?? '';
      if (f['volume']) v += ` ${f['volume']}`;
      if (f['number']) v += `(${f['number']})`;
      if (f['pages']) v += `, ${f['pages']}`;
      return v;
    }
    case 'inproceedings':
    case 'incollection': {
      let v = f['booktitle'] ? `In ${f['booktitle']}` : '';
      if (f['pages']) v += `, ${f['pages']}`;
      return v;
    }
    case 'techreport':
      return [f['institution'], f['number']].filter(Boolean).join(' ');
    case 'phdthesis':
    case 'mastersthesis':
      return f['school'] ?? '';
    default: {
      const publisher = f['publisher'] ?? f['howpublished'] ?? '';
      return publisher && f['edition'] ? `${publisher}, ${f['edition']} ed.` : publisher;
    }
  }
}

/** One reference as a readable citation line. */
export function referenceItem(ref: GraphReference): HTMLLIElement {
  const f = ref.fields;
  const title = f['title'] ?? ref.key;
  const link = f['doi'] ? `https://doi.org/${f['doi']}` : f['url'];
  const venue = venueOf(ref);
  const parts: Child[] = [];
  if (f['author']) parts.push(`${formatAuthors(f['author'])} `);
  parts.push(`(${f['year'] ?? '?'}). `);
  parts.push(link ? h('a', { href: link }, title) : h('span', { class: 'ref-title' }, title));
  parts.push('.');
  if (venue) parts.push(` ${venue}.`);
  if (f['note']) parts.push(h('span', { class: 'ref-note' }, ` ${f['note']}.`));
  return h('li', { class: 'reference' }, parts);
}

/**
 * The compact citation affordance on a claim: "N sources" expanding in
 * place to the full references. Null when the claim cites nothing.
 */
export function citeDetails(atlas: Atlas, evidence: string[]): HTMLElement | null {
  const refs = evidence.flatMap((key) => atlas.reference(key) ?? []);
  if (refs.length === 0) return null;
  return h(
    'details',
    { class: 'cite' },
    h(
      'summary',
      {},
      `${String(refs.length)} source${refs.length === 1 ? '' : 's'}`,
      h('span', { class: 'disclosure', 'aria-hidden': 'true' }, ' ▸'),
    ),
    h(
      'ul',
      { class: 'cite-list' },
      refs.map((ref) => referenceItem(ref)),
    ),
  );
}

/**
 * The per-page bibliography: every work cited by the node's claims, in
 * either direction, each listed once. Null when nothing on the page cites.
 */
export function sourcesSection(atlas: Atlas, node: GraphNode): HTMLElement | null {
  const keys = [...new Set(node.connections.flatMap((c) => c.evidence))].sort();
  const refs = keys.flatMap((key) => atlas.reference(key) ?? []);
  if (refs.length === 0) return null;
  return h(
    'section',
    { class: 'concept-section sources' },
    h('h2', {}, 'Sources'),
    h('p', { class: 'section-hint' }, "The literature cited by this page's claims."),
    h(
      'ul',
      { class: 'source-list' },
      refs.map((ref) => referenceItem(ref)),
    ),
  );
}
