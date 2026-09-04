---
canonical_name: Kalman filter
node_type: operation
status: established
summary: >
  The exact recursive Bayesian filter for linear-Gaussian state-space
  models: predict the state through the dynamics, then correct with the new
  measurement, propagating only a mean and covariance.
fields: [control, signal-processing, statistics, economics, neuroscience]
aliases:
  - name: linear-quadratic estimator / observer with optimal gain
    field: control
  - name: recursive least squares with a state model
    field: statistics
  - name: online Bayesian filtering (linear-Gaussian case)
    field: ml
assumptions:
  - a linear-Gaussian state-space model (else extended/unscented/particle variants)
  - known noise covariances (in practice, tuned or estimated)
canonical_examples:
  - Aerospace navigation fusing IMU and GPS measurements
  - Smoothing economic indicators through a structural time-series model
sections:
  - notebook-v0#8-field-dialects-named-special-cases-and-translation
  - notebook-v0#13-probability-bayes-and-markov-structure
---

The Kalman filter alternates two operations on a Gaussian belief about the
hidden state of a [[linear-gaussian-ssm|linear-Gaussian state-space model]]:
**predict** through the dynamics (mean and covariance propagate through the
linear map), then **correct** using the new observation. The correction is
[[bayes-rule|Bayes' rule]] specialized to Gaussians: the Kalman gain weighs
prior confidence against measurement confidence, and the innovation — the
surprise in the measurement — drives the update.

The nomenclature correction this map insists on: the Kalman filter is an
*algorithm*, not a model class. A linear-Gaussian state-space model is a
special continuous-state [[hidden-markov-model|hidden Markov model]]; the
Kalman filter is the exact inference procedure for that model class. Saying
"a Kalman filter is a special case of an HMM" mixes the two sides of a
SOLVED-BY relationship.

When the model leaves the linear-Gaussian class, the same predict/correct
skeleton survives while exactness does not: extended and unscented Kalman
filters linearize or deterministically sample the nonlinearity, and particle
filters replace the Gaussian belief with weighted samples. The recursion is
Bayesian filtering; the Kalman form is what the linear-Gaussian assumptions
buy.

Observer design in control — reconstructing internal state from outputs —
is the same mathematics under deterministic vocabulary, and the historical
route by which filtering ideas migrated into tracking, econometrics,
neuroscience, and signal processing under Bayesian, state-space, or HMM
language (notebook §9).
