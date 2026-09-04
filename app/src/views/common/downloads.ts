/**
 * "Download the dataset" fragment (spec §11: export in one action), shared
 * by the researcher views. The files are emitted next to graph.json by
 * atlas-build (docs/graph-json.md documents all four).
 */
import { REPO_URL } from '../../config';
import { h } from './dom';

const FILES: { name: string; note: string }[] = [
  { name: 'graph.json', note: 'the full dataset (documented)' },
  { name: 'atlas.graphml', note: 'for Gephi / igraph / networkx' },
  { name: 'nodes.csv', note: 'one row per concept, metrics included' },
  { name: 'edges.csv', note: 'one row per claim' },
];

export function downloadBlock(): HTMLElement {
  return h(
    'section',
    { class: 'downloads' },
    h('h2', {}, 'Download the dataset'),
    h(
      'ul',
      { class: 'download-list' },
      FILES.map((f) =>
        h(
          'li',
          {},
          h('a', { href: `data/${f.name}`, download: f.name }, f.name),
          h('span', { class: 'dim' }, ` — ${f.note}`),
        ),
      ),
    ),
    h(
      'p',
      { class: 'section-hint' },
      'Shape, versioning policy, and consumption examples: ',
      h('a', { href: `${REPO_URL}/blob/main/docs/graph-json.md` }, 'docs/graph-json.md'),
      '.',
    ),
  );
}
