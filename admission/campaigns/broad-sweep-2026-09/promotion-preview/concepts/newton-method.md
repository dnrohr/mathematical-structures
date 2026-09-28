---
canonical_name: Newton's method
node_type: operation
status: established
summary: Newton's optimization method locally solves the stationarity equation by repeatedly
  minimizing the quadratic Taylor model built from the gradient and Hessian.
fields:
  - numerical-analysis
  - optimization
assumptions:
  - nonsingular local Hessian
  - Lipschitz-continuous Hessian for standard local rate
canonical_examples:
  - Twice-differentiable unconstrained minimization. — Smooth unconstrained optimization near a
    nondegenerate minimizer with suitable globalization when needed.
sections:
  - campaign-broad-sweep-2026-09#newton-method
---

Newton's optimization method locally solves the stationarity equation by repeatedly minimizing the quadratic Taylor model built from the gradient and Hessian.

## Mathematical skeleton

Solve Hessian times step equals minus gradient, then update the iterate.

The claim is scoped to Twice-differentiable unconstrained minimization. Its stated validity regime is: Quadratic local convergence near a solution under standard hypotheses.

## Boundaries

- Far from a minimizer the step may not descend; line search or trust region is commonly required.

Counterexamples and failure probes:

- An indefinite Hessian can produce an ascent direction.

## Adversarial review

**Challenge.** Root finding and optimization versions are often conflated.

**Response.** The node records the shared Newton linearization skeleton and scopes this claim to stationarity.
