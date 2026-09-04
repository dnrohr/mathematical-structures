---
canonical_name: Linear-Gaussian state-space model
node_type: model
status: established
summary: >
  The state-space model with linear dynamics, linear observations, and
  Gaussian noise — the largest model class in this family for which exact
  recursive inference is available in closed form.
fields: [control, statistics, signal-processing, economics]
aliases:
  - name: linear dynamical system (LDS)
    field: ml
  - name: local level / structural time-series form
    field: economics
  - name: linear-Gaussian model / Gauss-Markov model
    field: statistics
assumptions:
  - linear transition and observation maps
  - Gaussian process and measurement noise
  - known model matrices (estimating them is a separate identification problem)
canonical_examples:
  - Constant-velocity tracking model with noisy position measurements
  - Local-level model underlying exponential smoothing
sections:
  - notebook-v0#8-field-dialects-named-special-cases-and-translation
  - notebook-v0#13-probability-bayes-and-markov-structure
---

The linear-Gaussian state-space model restricts the general
[[state-space-model]] to linear dynamics and observations with Gaussian
noise:

$$x_{t+1} = A x_t + w_t, \qquad y_t = C x_t + v_t,$$

with $w_t$ and $v_t$ Gaussian. Because Gaussians are closed under linear
maps and conditioning, the filtering distribution stays Gaussian forever —
which is precisely why the [[kalman-filter|Kalman filter]] can propagate a
mean and covariance and be *exact*.

Two containments and one non-containment carry the nomenclature payload of
this cluster:

- It **is a** state-space model (the linear-Gaussian special case).
- It **is a** [[hidden-markov-model|hidden Markov model]] in the broad,
  continuous-state reading of that term.
- The Kalman filter is **not** contained in either model class — it is the
  inference algorithm the linear-Gaussian structure licenses (a SOLVED-BY
  relationship, per the correction in the original notebook §8).

The eigenstructure of $A$ ([[eigenvalues]]) governs how state uncertainty
grows or decays between measurements, tying estimation quality back to the
same modal picture used everywhere else in the map.
