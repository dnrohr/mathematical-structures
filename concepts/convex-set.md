---
canonical_name: Convex set
node_type: object
status: established
summary: A convex optimization feasible region assumes closure under line segments between feasible points.
fields:
  - numerical-analysis
  - optimization
assumptions:
  - affine ambient space
canonical_examples:
  - Euclidean convex optimization. — Feasible sets in convex optimization.
sections:
  - campaign-broad-sweep-2026-09#convex-set
---

A convex optimization feasible region assumes closure under line segments between feasible points.

## Mathematical skeleton

For x and y in C and theta in [0,1], theta x plus one-minus-theta y remains in C.

The claim is scoped to Euclidean convex optimization. Its stated validity regime is: Ordinary linear interpolation in the chosen coordinates.

## Boundaries

- A coordinate change need not preserve Euclidean convexity.

Counterexamples and failure probes:

- A disconnected feasible set is nonconvex.

## Adversarial review

**Challenge.** Convexity depends on the affine representation.

**Response.** The ambient affine coordinates are part of the scope.
