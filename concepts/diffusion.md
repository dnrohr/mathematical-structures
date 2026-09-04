---
canonical_name: Diffusion and the heat equation
node_type: model
status: established
summary: >
  The canonical smoothing dynamics: a density spreads so that its rate of
  change is proportional to how it differs from its local neighborhood,
  ∂ρ/∂t = D∇²ρ. It is the continuum limit of random walks and the shared
  skeleton of heat flow, Brownian motion, and network smoothing.
fields: [pde, probability, thermodynamics, networks, biology]
aliases:
  - name: heat equation / heat kernel
    field: pde
  - name: Brownian motion / Wiener process (its stochastic counterpart)
    field: probability
  - name: graph diffusion / label propagation
    field: networks
assumptions:
  - many small, frequent, uncorrelated displacements (for the microscopic derivation)
  - a separation between microscopic step scale and observation scale
canonical_examples:
  - Heat spreading through a solid
  - Brownian motion as the scaling limit of a random walk
  - Fourier modes decaying at rate proportional to the squared frequency
sections:
  - notebook-v0#23-large-numbers-distributions-and-emergent-regularity
  - notebook-v0#5-important-cross-links-already-visible
---

Diffusion is the map's canonical example of macroscopic regularity emerging
from microscopic randomness. A symmetric random walk, viewed after many
sufficiently small steps, has a probability distribution approaching the
solution of

$$\frac{\partial \rho}{\partial t} = D \nabla^2 \rho,$$

the diffusion (heat) equation. The [[markov-chains|random walk]] supplies
the microscopic mechanism; the [[large-number-limits|large-number limit]]
supplies the emergent determinism; the Laplacian supplies the spatial
bookkeeping.

The operator on the right is the same local probe described in
[[vector-calculus]]: $\nabla^2 \rho$ compares a value with its neighborhood
average, so diffusion is precisely "flow downhill against the local
difference". On a network, replacing $\nabla^2$ with the
[[graph-laplacian]] gives graph diffusion — the smoothing dynamics behind
label propagation, consensus, and random-walk mixing.

Solving the equation by separation into spatial modes is the spectral
strategy of [[eigenvalues]] and [[fourier-analysis]]: eigenfunctions of the
Laplacian evolve independently, each decaying at a rate set by its
eigenvalue, so high-frequency detail dies first and smoothness emerges. The
[[greens-function|heat kernel]] — diffusion's response to a point source —
assembles general solutions by superposition.

Two cautions keep the node honest. The continuum limit discards microscopic
information (which is also why it works); and diffusion is the *linear,
memoryless* member of a family — advection, reactions, long-range jumps, or
correlated steps each break an assumption and change the limiting equation.
