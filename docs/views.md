# Views over the graph

(Moved from the original notebook, §17. The app-facing definition of the v1
views now lives in SPECIFICATION.md §2–§3 and ARCHITECTURE.md §5; this file
preserves the fuller catalogue of candidate lenses, some of which are post-v1.)

Rather than choosing one hierarchy, the map supports several views over the
same graph:

- **By mathematical object**: matrices, graphs, fields, distributions,
  manifolds.
- **By reusable move**: linearize, diagonalize, transform, nondimensionalize,
  condition, coarse-grain, optimize. *(v1: the `#/moves` index.)*
- **By canonical model**: oscillator, random walk, diffusion, wave, feedback
  loop, branching process.
- **By principle**: symmetry, conservation, invariance, locality, continuity,
  scaling, entropy.
- **By field dialect**: control, statistics, physics, biology, networks,
  numerical analysis. *(v1: the dialect lookup and per-field lens filter.)*
- **By problem symptom**: too many parameters, coupled variables, hidden
  state, noisy observations, multiple scales, instability. *(v1: the landing
  page; `graph/symptoms.yaml`.)*
- **By research gap**: mathematically plausible transfers that appear weakly
  developed in another field. *(v1: the `#/questions` view.)*

Node-type and strength filters in the lens view (`#/lens`) cover the first
four as filter presets rather than bespoke pages in v1.
