---
canonical_name: Riemannian metric
node_type: object
status: established
summary: A Riemannian metric is a smoothly varying positive-definite inner product on tangent spaces
  and therefore assumes a smooth manifold structure.
fields:
  - mechanics
  - pde
assumptions:
  - smooth manifold
  - positive-definite symmetric tensor field
canonical_examples:
  - Positive-definite Riemannian geometry. — Finite-dimensional smooth manifolds.
sections:
  - campaign-broad-sweep-2026-09#riemannian-metric
---

A Riemannian metric is a smoothly varying positive-definite inner product on tangent spaces and therefore assumes a smooth manifold structure.

## Mathematical skeleton

Each point p has an inner product g_p on T_pM whose coordinate components vary smoothly.

The claim is scoped to Positive-definite Riemannian geometry. Its stated validity regime is: Smooth coordinate changes preserving tensorial transformation.

## Boundaries

- Pseudo-Riemannian metrics relax positive definiteness.

Counterexamples and failure probes:

- A discontinuously varying inner product is not a smooth Riemannian metric.

## Adversarial review

**Challenge.** Metric can mean a distance function rather than a tensor field.

**Response.** The node uses the differential-geometric definition and can cross-link induced distance later.
