/** Tiny DOM-building helper — the app's whole "framework" (decision log #2). */

export type Child = Node | string | number | null | undefined | false;

export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Record<string, string | boolean | EventListener> = {},
  ...children: (Child | Child[])[]
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (value === false || value == null) continue;
    if (key.startsWith('on') && typeof value === 'function') {
      node.addEventListener(key.slice(2), value);
    } else if (value === true) {
      node.setAttribute(key, '');
    } else if (typeof value === 'string') {
      node.setAttribute(key, value);
    }
  }
  append(node, children);
  return node;
}

function append(node: Node, children: (Child | Child[])[]): void {
  for (const child of children) {
    if (Array.isArray(child)) {
      append(node, child);
    } else if (child != null && child !== false) {
      node.appendChild(
        typeof child === 'string' || typeof child === 'number'
          ? document.createTextNode(String(child))
          : child,
      );
    }
  }
}

/** Join elements with a text separator (for inline link lists). */
export function joinChildren(items: Node[], separator: string): Child[] {
  const out: Child[] = [];
  items.forEach((item, i) => {
    if (i > 0) out.push(separator);
    out.push(item);
  });
  return out;
}
