---
canonical_name: Deterministic chaos
node_type: phenomenon
status: established
summary: >
  Deterministic evolution with sensitive dependence on initial conditions:
  stretching and folding in phase space, quantified by Lyapunov exponents,
  bounding long-horizon prediction no matter how good the model.
fields: [mechanics, fluids, biology, pde]
aliases:
  - name: sensitive dependence / positive Lyapunov exponent
    field: mechanics
  - name: strange attractor dynamics
    field: fluids
  - name: irregular (aperiodic) dynamics in regulation and populations
    field: biology
assumptions:
  - determinism (chaos is not noise) and nonlinearity
  - bounded dynamics that reinject stretched trajectories (folding)
canonical_examples:
  - The Lorenz attractor's butterfly-wing geometry
  - Doubling of forecast error at a rate set by the leading Lyapunov exponent
  - Period-doubling cascades as a route to chaos
sections:
  - notebook-v0#22-phase-space-nonlinear-dynamics-bifurcation-and-chaos
---

Deterministic chaos combines deterministic evolution with sensitive
dependence on initial conditions. The useful concepts are not merely
"unpredictability" but a precise toolkit: Lyapunov exponents measuring the
exponential rate at which nearby trajectories separate, stretching and
folding as the geometric mechanism, strange attractors as the invariant
sets trajectories settle onto, invariant measures giving statistics where
individual paths are hopeless, and identified routes to chaos
(period-doubling cascades of [[bifurcation|bifurcations]], among others).

The geometry lives in [[phase-space]]: locally, the flow stretches along
unstable directions — read off positive [[eigenvalues|Lyapunov/eigenvalue
structure]] of local linearizations — while boundedness forces folding,
and the combination erases initial-condition information at a steady rate.

That rate connects dynamics to information: measured in bits per unit
time (the Kolmogorov–Sinai entropy of dynamical-systems theory), it is the
speed at which the system generates surprise about its own future, an
[[shannon-entropy|entropy]]-flavored quantity produced by geometry rather
than by randomness. The practical consequence is a prediction horizon:
model error shrinks forecasts only logarithmically once errors double on a
fixed timescale — the deep reason weather forecasting saturates.

Chaos also disciplines the map's statistical clusters: time averages along
chaotic trajectories can behave like [[markov-chains|stochastic]] samples
(mixing), which is one honest route from deterministic mechanics toward
ensemble reasoning in statistical physics — related to, but not the same
as, the coarse-graining story told under [[thermodynamic-entropy|entropy]]
and [[renormalization]].
