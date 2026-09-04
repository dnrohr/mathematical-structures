---
canonical_name: Markov chains and random walks
node_type: model
status: established
summary: >
  Stochastic dynamics with no memory beyond the present: given the current
  state, the future is independent of the past. Random walks are the
  canonical example; transition-matrix eigenstructure controls stationary
  behavior and mixing.
fields: [probability, statistics, networks, thermodynamics, ml]
aliases:
  - name: random walk / stochastic matrix dynamics
    field: probability
  - name: MCMC (Markov chain Monte Carlo)
    field: statistics
  - name: random surfer / PageRank dynamics
    field: networks
assumptions:
  - the Markov property (memorylessness given the current state)
  - for stationary-distribution statements, ergodicity conditions (irreducibility, aperiodicity)
canonical_examples:
  - Symmetric random walk on the integers
  - Transition-matrix eigenvalue 1 giving the stationary distribution
  - MCMC samplers engineered so a target distribution is stationary
sections:
  - notebook-v0#12-eigenvalues-and-spectral-decomposition
  - notebook-v0#23-large-numbers-distributions-and-emergent-regularity
---

A Markov chain is stochastic dynamics with the memoryless property: the next
state depends on the current state, not the path that led there. That
conditional-independence statement is the load-bearing structure — it is
what makes recursive computation, stationary analysis, and filtering
possible, and it reappears with an observation layer as the
[[state-space-model|state-space / hidden-state family]].

## Eigenvalues acquire a probabilistic dialect

For a finite chain, the transition matrix has a distinguished eigenvalue
$1$. Under standard ergodicity conditions its stationary mode persists while
every other mode decays; the magnitude of the subdominant eigenvalues
controls how quickly memory of the initial state disappears. The language is
mixing time, spectral gap, relaxation time, and stationary distribution
rather than poles, damping, or modal decay — but the mathematical skeleton
is the modal picture of [[eigenvalues]], and the spectral gap **governs**
the mixing rate.

## Random walks and the road to diffusion

The symmetric random walk is the canonical Markov chain, and it is the
map's cleanest bridge between discrete probability and continuum fields:
after many sufficiently small steps, its distribution approaches the
solution of a [[diffusion]] equation under the appropriate scaling limit.
This single example links Markov chains, the central-limit phenomenon
([[large-number-limits]]), PDEs, the [[graph-laplacian|Laplacian]],
Brownian motion, and statistical mechanics.

## Where the chain structure earns its keep

- **Sampling.** MCMC turns inference into dynamics: engineer a chain whose
  stationary distribution is the posterior you cannot sample directly.
- **Networks.** A random walk on a graph is a Markov chain whose transition
  structure is the normalized adjacency; its spectral gap measures how fast
  the walk forgets where it started — the same quantity network science
  reads off the [[graph-laplacian]].
- **Statistical mechanics.** Detailed balance ties chain dynamics to
  equilibrium ensembles and [[thermodynamic-entropy|entropy]].
