---
canonical_name: GraphSLAM
node_type: operation
status: established
summary: GraphSLAM formulates simultaneous localization and mapping as sparse graph-based maximum a
  posteriori optimization over robot poses and landmarks.
fields:
  - control
  - probability
assumptions:
  - factorized motion and measurement likelihoods
  - chosen gauge or anchor
canonical_examples:
  - Offline or smoothing-based SLAM with differentiable residual models. — SLAM posterior factorized
    into motion and measurement constraints.
sections:
  - campaign-broad-sweep-2026-09#graphslam
---

GraphSLAM formulates simultaneous localization and mapping as sparse graph-based maximum a posteriori optimization over robot poses and landmarks.

## Mathematical skeleton

Negative log factors yield a sparse nonlinear least-squares objective whose graph records variable-constraint incidence.

The claim is scoped to Offline or smoothing-based SLAM with differentiable residual models. Its stated validity regime is: MAP estimation under the stated probabilistic model.

## Boundaries

- Nonconvexity, data association, and gauge freedom can dominate practical behavior.

Counterexamples and failure probes:

- An unanchored pose graph has gauge nonuniqueness.

## Adversarial review

**Challenge.** GraphSLAM is not merely any SLAM implementation using a graph data structure.

**Response.** The definition requires a factorized global MAP objective and sparse graph structure.
