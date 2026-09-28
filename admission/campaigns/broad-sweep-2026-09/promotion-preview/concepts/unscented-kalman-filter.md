---
canonical_name: Unscented Kalman filter
node_type: operation
status: established
summary: When nonlinear maps break exact Kalman propagation, the unscented Kalman filter replaces
  linearization by deterministic sigma points chosen to reproduce moments.
fields:
  - control
  - probability
aliases:
  - name: UKF
    field: control
assumptions:
  - finite moments
  - useful Gaussian moment approximation
canonical_examples:
  - Nonlinear Gaussian filtering. — Nonlinear state-space models with approximately Gaussian beliefs.
sections:
  - campaign-broad-sweep-2026-09#unscented-kalman-filter
---

When nonlinear maps break exact Kalman propagation, the unscented Kalman filter replaces linearization by deterministic sigma points chosen to reproduce moments.

## Mathematical skeleton

Transform weighted sigma points through the nonlinear map and reconstruct approximate mean and covariance.

The claim is scoped to Nonlinear Gaussian filtering. Its stated validity regime is: Unimodal uncertainty where low-order moments summarize the belief adequately.

## Boundaries

- The posterior remains approximated as Gaussian and parameter choices affect numerical behavior.

Counterexamples and failure probes:

- Strong multimodality not representable by reconstructed mean and covariance.

## Adversarial review

**Challenge.** Avoiding Jacobians does not make the UKF exact for arbitrary nonlinear models.

**Response.** The claim calls it deterministic moment approximation and states Gaussian limitations.
