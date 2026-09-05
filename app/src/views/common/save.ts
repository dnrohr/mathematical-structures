/**
 * "Download what you see" (UI_REDESIGN.md §5, ROADMAP M14): client-generated
 * blobs from data already loaded — still no server. CSV follows the build's
 * export emitters (RFC 4180, CRLF, semicolon-joined multi-values) so a
 * filtered download and the full dataset export read the same way.
 */
import type { Atlas } from '../../data/atlas';
import type { GraphEdge } from '../../data/types';
import { h } from './dom';

type Cell = string | number | boolean | null | undefined;

/** RFC 4180: quote a field when it contains a comma, quote, or newline. */
function csvField(value: Cell): string {
  if (value === undefined || value === null) return '';
  const text = String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function csvOf(rows: Cell[][]): string {
  return rows.map((row) => row.map(csvField).join(',')).join('\r\n') + '\r\n';
}

/** Edge rows with the same columns as the build's edges.csv. */
export function edgesCsv(edges: GraphEdge[]): string {
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
  return csvOf([header, ...rows]);
}

/**
 * A button that hands the viewer a file built on click from loaded data.
 * The blob URL exists only for the click; nothing is uploaded anywhere.
 */
export function saveBlobButton(
  label: string,
  filename: string,
  mime: string,
  build: () => string,
): HTMLElement {
  const button = h('button', { type: 'button', class: 'link-button save-view' }, label);
  button.addEventListener('click', () => {
    const url = URL.createObjectURL(new Blob([build()], { type: mime }));
    const anchor = h('a', { href: url, download: filename });
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 1000);
  });
  return button;
}

/** Wrap a save button in the standard hint line the views share. */
export function downloadViewLine(atlas: Atlas, button: HTMLElement): HTMLElement {
  return h(
    'p',
    { class: 'section-hint download-view' },
    button,
    h(
      'span',
      { class: 'dim' },
      ` — exactly what these filters show, generated in your browser from the loaded data ` +
        `(commit ${shortSha(atlas.generatedFrom)}).`,
    ),
  );
}

export function shortSha(sha: string): string {
  return /^[0-9a-f]{40}$/.test(sha) ? sha.slice(0, 7) : sha;
}
