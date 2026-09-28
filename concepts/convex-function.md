---
canonical_name: Convex function
node_type: object
status: established
summary: Convex optimization assumes a convex objective and convex feasible structure, making every
  local minimum globally minimizing.
fields:
  - numerical-analysis
  - optimization
assumptions:
  - convex domain
  - convex objective
canonical_examples:
  - Convex minimization problems. — Convex minimization on a convex feasible set.
sections:
  - campaign-broad-sweep-2026-09#convex-function
---

Convex optimization assumes a convex objective and convex feasible structure, making every local minimum globally minimizing.

## Mathematical skeleton

f(theta x plus one-minus-theta y) is at most theta f(x) plus one-minus-theta f(y).

The claim is scoped to Convex minimization problems. Its stated validity regime is: Local minima considered within the convex feasible set.

## Boundaries

- Strict convexity is needed for uniqueness, not for local-to-global optimality.

Counterexamples and failure probes:

- A nonconvex double-well has nonglobal local minima.

## Adversarial review

**Challenge.** The term is sometimes attached to a function while constraints remain nonconvex.

**Response.** The proposition requires both convex objective and feasible structure.
