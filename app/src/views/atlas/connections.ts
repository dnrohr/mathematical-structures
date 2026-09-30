import type { GraphEdge } from '../../data/types';

export type AtlasConnectionAttention =
  'overview' | 'outgoing-focus' | 'incoming-focus' | 'focus-adjacent' | 'context';

/**
 * Classify a visible claim without changing which claims the Atlas includes.
 * Direction is meaningful only for directed claims; symmetric claims touching
 * the focus share one markerless adjacent state.
 */
export function connectionAttention(
  edge: Pick<GraphEdge, 'from' | 'to' | 'symmetric'>,
  focus?: string,
): AtlasConnectionAttention {
  if (!focus) return 'overview';
  if (edge.symmetric && (edge.from === focus || edge.to === focus)) return 'focus-adjacent';
  if (!edge.symmetric && edge.from === focus) return 'outgoing-focus';
  if (!edge.symmetric && edge.to === focus) return 'incoming-focus';
  return 'context';
}
