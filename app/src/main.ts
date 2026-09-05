/**
 * Boot: load + version-gate the artifacts, build the shell, start routing.
 * KaTeX ships CSS/fonts only — all math was rendered at build time
 * (ARCHITECTURE.md §5.1).
 */
import 'katex/dist/katex.min.css';
import './style/main.css';
import { loadAtlas, type Atlas } from './data/atlas';
import { createShell } from './shell/layout';
import { startRouter, type Route } from './shell/router';
import { applicationsView } from './views/applications';
import { atozView } from './views/atoz';
import type { View } from './views/common/view';
import { conceptView } from './views/concept';
import { dialectsView } from './views/dialects';
import { dataErrorScreen, notFoundView } from './views/errors';
import { landingView } from './views/landing';
import { lensView } from './views/lens';
import { metricsView } from './views/metrics';
import { movesView } from './views/moves';
import { pathView } from './views/path';
import { proposeView } from './views/propose';
import { questionsView } from './views/questions';
import { symptomView } from './views/symptom';
import { walkView } from './views/walk';
import { walksView } from './views/walks';

function viewFor(atlas: Atlas, route: Route): View {
  switch (route.name) {
    case 'landing':
      return landingView(atlas, { symptom: route.symptom });
    case 'concept':
      return conceptView(atlas, route.slug) ?? notFoundView(`/c/${route.slug}`);
    case 'symptom':
      return symptomView(atlas, route.id) ?? notFoundView(`/s/${route.id}`);
    case 'moves':
      return movesView(atlas);
    case 'applications':
      return applicationsView(atlas);
    case 'atoz':
      return atozView(atlas);
    case 'dialects':
      return dialectsView(atlas, route.query);
    case 'lens':
      return lensView(atlas, route.filters, route.communities);
    case 'path':
      return pathView(atlas, route);
    case 'metrics':
      return metricsView(atlas, route);
    case 'questions':
      return questionsView(atlas);
    case 'propose':
      return proposeView(atlas, route);
    case 'walks':
      return walksView(atlas);
    case 'walk':
      return walkView(atlas, route.id, route.step) ?? notFoundView(`/walk/${route.id}`);
    case 'notfound':
      return notFoundView(route.path);
  }
}

async function boot(): Promise<void> {
  const root = document.getElementById('app');
  if (!root) return;

  const result = await loadAtlas();
  if (!result.ok) {
    root.replaceChildren(dataErrorScreen(result.error));
    return;
  }

  const shell = createShell(root, result.atlas);
  let firstRoute = true;
  startRouter((route) => {
    const view = viewFor(result.atlas, route);
    shell.main.replaceChildren(view.el);
    shell.setTitle(view.title);
    // In-app navigation moves focus to the new view (screen readers
    // announce it; Tab starts at its top). Initial load keeps the
    // browser's default focus.
    if (firstRoute) firstRoute = false;
    else shell.main.focus({ preventScroll: true });
    window.scrollTo(0, 0);
    view.onMount?.();
  });
}

void boot();
