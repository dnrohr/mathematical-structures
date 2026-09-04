/**
 * Stage 3b — render: Markdown + TeX → safe HTML (ARCHITECTURE.md §4.3).
 *
 * Safety is by construction rather than after-the-fact sanitization:
 *   - raw HTML in Markdown is escaped, never emitted;
 *   - link hrefs with dangerous schemes are neutralized;
 *   - wiki-links only ever render as internal #/c/<slug> anchors;
 *   - KaTeX output is generated, not authored.
 * TeX errors and unknown wiki-link targets are validation errors.
 */
import katex from 'katex';
import { Marked, type Tokens } from 'marked';
import type { Issue } from './model.js';
import { SLUG } from './model.js';

export interface RenderResult {
  html: string;
  /** Every wiki-linked slug in the body, in order of appearance. */
  wikiLinks: string[];
  issues: Issue[];
}

interface WikiToken {
  type: 'wikilink';
  raw: string;
  slug: string;
  text: string | null;
}

interface MathToken {
  type: 'inlinemath' | 'displaymath';
  raw: string;
  tex: string;
}

const ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

export function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (ch) => ESCAPES[ch] ?? ch);
}

const SAFE_HREF = /^(https?:|mailto:|#|\/|\.\/|\.\.\/)/i;

/**
 * A renderer bound to the set of known nodes: wiki-links resolve display
 * text to canonical names and unknown targets become validation errors.
 */
export function createConceptRenderer(nodeNames: Map<string, string>) {
  return {
    render(body: string, file: string): RenderResult {
      const issues: Issue[] = [];
      const wikiLinks: string[] = [];

      const marked = new Marked({ gfm: true });
      marked.use({
        extensions: [
          {
            name: 'displaymath',
            level: 'inline',
            start: (src: string) => src.indexOf('$$'),
            tokenizer(src: string): MathToken | undefined {
              const m = /^\$\$([\s\S]+?)\$\$/.exec(src);
              if (m) return { type: 'displaymath', raw: m[0], tex: m[1]! };
              return undefined;
            },
            renderer: (token) => renderMath(token as unknown as MathToken, true),
          },
          {
            name: 'inlinemath',
            level: 'inline',
            start: (src: string) => src.indexOf('$'),
            tokenizer(src: string): MathToken | undefined {
              const m = /^\$(?!\$)([^$\n]*[^$\s\n])\$/.exec(src);
              if (m && !/^\s/.test(m[1]!)) {
                return { type: 'inlinemath', raw: m[0], tex: m[1]! };
              }
              return undefined;
            },
            renderer: (token) => renderMath(token as unknown as MathToken, false),
          },
          {
            name: 'wikilink',
            level: 'inline',
            start: (src: string) => src.indexOf('[['),
            tokenizer(src: string): WikiToken | undefined {
              const m = /^\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/.exec(src);
              if (m) {
                return { type: 'wikilink', raw: m[0], slug: m[1]!.trim(), text: m[2] ?? null };
              }
              return undefined;
            },
            renderer: (token) => renderWiki(token as unknown as WikiToken),
          },
        ],
        renderer: {
          // Raw HTML (block or inline) is escaped, never emitted as markup.
          html(token: Tokens.HTML | Tokens.Tag): string {
            return escapeHtml('raw' in token ? token.raw : String(token));
          },
        },
        walkTokens(token) {
          if (token.type === 'link' && !SAFE_HREF.test((token as Tokens.Link).href ?? '')) {
            (token as Tokens.Link).href = '#';
          }
        },
      });

      function renderMath(token: MathToken, display: boolean): string {
        try {
          return katex.renderToString(token.tex, {
            displayMode: display,
            throwOnError: true,
            output: 'html',
          });
        } catch (e) {
          issues.push({
            severity: 'error',
            rule: 'render/tex',
            file,
            message: `KaTeX rejected ${display ? 'display' : 'inline'} math: ${(e as Error).message}`,
          });
          return `<code>${escapeHtml(token.raw)}</code>`;
        }
      }

      function renderWiki(token: WikiToken): string {
        const slug = token.slug;
        if (!SLUG.test(slug) || !nodeNames.has(slug)) {
          issues.push({
            severity: 'error',
            rule: 'link/unknown-target',
            file,
            message: `wiki-link target "${slug}" is not a concept slug`,
          });
          return `<span class="broken-link">${escapeHtml(token.text ?? slug)}</span>`;
        }
        wikiLinks.push(slug);
        const text = token.text ?? nodeNames.get(slug)!;
        return `<a href="#/c/${slug}" class="wiki-link">${escapeHtml(text)}</a>`;
      }

      const html = marked.parse(body, { async: false });
      return { html: html.trim(), wikiLinks, issues };
    },
  };
}
