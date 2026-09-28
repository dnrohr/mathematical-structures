---
canonical_name: Particle filter
node_type: operation
status: established
summary: When Gaussian filtering assumptions fail, a particle filter replaces a single Gaussian
  belief by a weighted empirical sample propagated and reweighted recursively.
fields:
  - control
  - probability
assumptions:
  - simulable proposal
  - evaluable importance weights
canonical_examples:
  - Sequential Bayesian state estimation. — Nonlinear or non-Gaussian state-space models where
    sequential Monte Carlo is computationally feasible.
sections:
  - campaign-broad-sweep-2026-09#particle-filter
---

When Gaussian filtering assumptions fail, a particle filter replaces a single Gaussian belief by a weighted empirical sample propagated and reweighted recursively.

## Mathematical skeleton

Importance-sample the predictive distribution, weight by likelihood, and resample to control weight degeneracy.

The claim is scoped to Sequential Bayesian state estimation. Its stated validity regime is: Monte Carlo consistency as particle count grows under regularity conditions.

## Boundaries

- Finite samples suffer degeneracy and high-dimensional collapse.

Counterexamples and failure probes:

- A proposal with zero support where the posterior has mass.

## Adversarial review

**Challenge.** Particle filtering is not automatically accurate for arbitrary nonlinear systems.

**Response.** The claim is representational and asymptotic; finite-sample failure modes are explicit.
