---
canonical_name: Proximal operator
node_type: operation
status: established
summary: The proximal operator converts a possibly nonsmooth convex function into a regularized
  minimization subproblem used by first-order optimization algorithms.
fields:
  - numerical-analysis
  - optimization
assumptions:
  - proper lower-semicontinuous convex function
canonical_examples:
  - Convex composite optimization. — Proper closed convex functions and positive proximal parameter.
sections:
  - campaign-broad-sweep-2026-09#proximal-operator
---

The proximal operator converts a possibly nonsmooth convex function into a regularized minimization subproblem used by first-order optimization algorithms.

## Mathematical skeleton

prox of f at v is the argmin over x of f(x) plus one over twice lambda times squared distance to v.

The claim is scoped to Convex composite optimization. Its stated validity regime is: Euclidean proximal map; generalized metrics require adjusted statements.

## Boundaries

- The proximal subproblem may itself be expensive or set-valued outside standard convex assumptions.

Counterexamples and failure probes:

- A nonconvex function with multiple proximal minimizers.

## Adversarial review

**Challenge.** The main textbook predates some modern proximal terminology.

**Response.** The source supports the convex minimization structure; terminology is cross-checked in the course materials locator.
