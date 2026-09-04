/** What every route view returns to the shell. */
export interface View {
  /** Document-title fragment; null keeps the bare app title. */
  title: string | null;
  el: HTMLElement;
  /** Runs after the element is attached (scroll/focus work). */
  onMount?: () => void;
}
