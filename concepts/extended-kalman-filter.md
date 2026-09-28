---
canonical_name: Extended Kalman filter
node_type: operation
status: established
summary: When nonlinear dynamics or observations break the linear Kalman assumptions, the extended
  Kalman filter replaces exact propagation with Jacobian linearization.
fields:
  - control
  - probability
aliases:
  - name: EKF
    field: control
assumptions:
  - differentiable models
  - useful first-order approximation
canonical_examples:
  - Differentiable nonlinear filtering with unimodal local uncertainty. — Differentiable nonlinear
    state-space models with approximately Gaussian local uncertainty.
sections:
  - campaign-broad-sweep-2026-09#extended-kalman-filter
---

When nonlinear dynamics or observations break the linear Kalman assumptions, the extended Kalman filter replaces exact propagation with Jacobian linearization.

## Mathematical skeleton

Propagate mean through nonlinear maps and covariance through their Jacobians, then apply a Kalman-form correction.

The claim is scoped to Differentiable nonlinear filtering with unimodal local uncertainty. Its stated validity regime is: Small uncertainty and weak local nonlinearity.

## Boundaries

- The recursion is approximate and can be inconsistent or diverge.

Counterexamples and failure probes:

- Strongly multimodal posteriors not captured by one Gaussian.

## Adversarial review

**Challenge.** The EKF is often incorrectly described as an exact nonlinear Kalman filter.

**Response.** Approximation, locality, and failure modes are explicit.
