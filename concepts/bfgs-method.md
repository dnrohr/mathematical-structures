---
canonical_name: BFGS method
node_type: operation
status: established
summary: BFGS is a quasi-Newton optimization method that updates an inverse-Hessian approximation
  using gradient differences while preserving positive definiteness under a curvature condition.
fields:
  - numerical-analysis
  - optimization
aliases:
  - name: BFGS
    field: numerical-analysis
assumptions:
  - available gradients
  - positive curvature pair
canonical_examples:
  - Smooth unconstrained minimization. — Smooth unconstrained optimization with a line search
    satisfying the curvature condition.
sections:
  - campaign-broad-sweep-2026-09#bfgs-method
---

BFGS is a quasi-Newton optimization method that updates an inverse-Hessian approximation using gradient differences while preserving positive definiteness under a curvature condition.

## Mathematical skeleton

A rank-two secant update enforces H_{k+1} y_k = s_k and remains positive definite when s_k^T y_k is positive.

The claim is scoped to Smooth unconstrained minimization. Its stated validity regime is: Local convergence regimes with suitable line search.

## Boundaries

- Nonconvex curvature can require damping or skipped updates.

Counterexamples and failure probes:

- A step with nonpositive s transpose y destroys the standard positivity guarantee.

## Adversarial review

**Challenge.** BFGS is not simply Newton's method without an exact Hessian.

**Response.** The claim identifies its distinct secant update and conditional positivity result.
