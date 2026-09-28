---
canonical_name: Variational integrator
node_type: move
status: established
summary: A variational integrator discretizes the action principle and derives the time-step map
  from discrete Euler-Lagrange equations.
fields:
  - mechanics
  - numerical-analysis
assumptions:
  - discrete action principle
  - regularity of the discrete Lagrangian
canonical_examples:
  - Lagrangian mechanical systems with a regular discrete Lagrangian. — Discrete Lagrangians
    approximating an action integral.
sections:
  - campaign-broad-sweep-2026-09#variational-integrator
---

A variational integrator discretizes the action principle and derives the time-step map from discrete Euler-Lagrange equations.

## Mathematical skeleton

Stationarity of the discrete action sum yields a symplectic update and discrete momentum results under symmetry.

The claim is scoped to Lagrangian mechanical systems with a regular discrete Lagrangian. Its stated validity regime is: Fixed-step discrete mechanics under the chosen quadrature approximation.

## Boundaries

- Not every symplectic integrator is presented or implemented variationally.

Counterexamples and failure probes:

- A generic update not derivable from any regular discrete action.

## Adversarial review

**Challenge.** Discretizing Euler-Lagrange equations directly need not equal discretizing the variational principle.

**Response.** The definition requires stationarity of a discrete action.
