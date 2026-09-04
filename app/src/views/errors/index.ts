/**
 * Failure screens: the app refuses data it doesn't understand and says so
 * on screen rather than rendering garbage (ARCHITECTURE.md §1), and dead
 * routes get a way back.
 */
import { REPO_URL } from '../../config';
import type { AtlasError } from '../../data/atlas';
import { h } from '../common/dom';
import type { View } from '../common/view';

export function notFoundView(path: string): View {
  const el = h(
    'div',
    { class: 'content error-screen' },
    h('h1', {}, 'Nothing at this address'),
    h('p', {}, 'No page matches ', h('code', {}, `#${path}`), '.'),
    h(
      'p',
      {},
      h('a', { href: '#/' }, 'Back to the atlas'),
      ' — or press ',
      h('kbd', {}, '/'),
      ' to search.',
    ),
  );
  return { title: 'Not found', el };
}

/** Standalone screen — usable before the shell exists (no atlas loaded). */
export function dataErrorScreen(error: AtlasError): HTMLElement {
  let heading: string;
  let body: HTMLElement;
  switch (error.kind) {
    case 'version':
      heading = 'This app and its data disagree';
      body = h(
        'p',
        {},
        `The data artifacts are version ${error.found}, but this build of the app understands ` +
          `major version ${error.supported}. A hard refresh usually fixes it (app and data deploy ` +
          'together); if it persists, the deployment is mid-rollout — try again shortly.',
      );
      break;
    case 'network':
      heading = 'Couldn’t load the atlas data';
      body = h(
        'p',
        {},
        h('code', {}, error.detail),
        ' — if you are running the app locally, build the data first: ',
        h('code', {}, 'npm run build:data'),
        ', then reload.',
      );
      break;
    default:
      heading = 'The atlas data didn’t parse';
      body = h('p', {}, h('code', {}, error.detail));
  }
  return h(
    'div',
    { class: 'content error-screen' },
    h('h1', {}, heading),
    body,
    h(
      'p',
      {},
      h('a', { href: '', onclick: () => window.location.reload() }, 'Retry'),
      ' · ',
      h('a', { href: REPO_URL }, 'repository'),
    ),
  );
}
