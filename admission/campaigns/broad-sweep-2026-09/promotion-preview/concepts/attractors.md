---
canonical_name: Attractors
node_type: phenomenon
status: established
summary: A locally asymptotically stable equilibrium is a local attractor because trajectories from
  a neighborhood converge to it.
fields:
  - control
  - mechanics
assumptions:
  - forward completeness in the neighborhood
  - locally asymptotically stable equilibrium
canonical_examples:
  - Local equilibrium attractors in finite-dimensional autonomous dynamical systems. — Local
    autonomous dynamics with an invariant set and an attracting neighborhood.
sections:
  - campaign-broad-sweep-2026-09#attractors
---

A locally asymptotically stable equilibrium is a local attractor because trajectories from a neighborhood converge to it.

## Mathematical skeleton

Distance to the invariant set tends to zero along trajectories begun in its basin.

The claim is scoped to Local equilibrium attractors in finite-dimensional autonomous dynamical systems. Its stated validity regime is: Initial states in the basin of attraction.

## Boundaries

- An invariant set need not attract, and an attractor need not be a fixed point.

Counterexamples and failure probes:

- A Lyapunov-stable center is not attracting.

## Adversarial review

**Challenge.** The term attractor has inequivalent topological and measure-theoretic definitions.

**Response.** The claim is restricted to the local asymptotically stable invariant-set definition.
