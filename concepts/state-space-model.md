---
canonical_name: State-space and hidden-state models
node_type: model
status: established
summary: >
  Separate an unobserved state process from the observations it generates:
  the state evolves with Markov structure, and each observation depends only
  on the current state. The conditional-independence skeleton is more
  fundamental than any particular inference algorithm.
fields: [control, statistics, ml, signal-processing, economics, neuroscience]
aliases:
  - name: state-space model / A,B,C,D realization
    field: control
  - name: latent dynamical model / dynamic latent-variable model
    field: statistics
  - name: state-space model / structural time-series model
    field: economics
  - name: latent state / world-model dynamics
    field: ml
assumptions:
  - the Markov property of the hidden state (given the present, the future is independent of the past)
  - observations conditionally independent given the current state
canonical_examples:
  - Tracking a vehicle from noisy radar returns
  - Structural time-series decomposition (trend + seasonal + noise) in econometrics
  - Neural population dynamics inferred from spike counts
sections:
  - notebook-v0#13-probability-bayes-and-markov-structure
  - notebook-v0#8-field-dialects-named-special-cases-and-translation
---

A state-space / hidden-state model separates an unobserved process from the
observations it generates:

> hidden state $x_t$ → next hidden state $x_{t+1}$;  hidden state $x_t$ →
> observation $y_t$

The Markov assumption says the next state depends on the current state rather
than the entire past, once the current state is known. This
conditional-independence statement is more fundamental than any particular
filtering algorithm — it is what [[markov-chains|Markov structure]]
contributes, and what every inference method below exploits.

## Nomenclature and special cases

The same generative skeleton carries different names in different
communities, and the map records the containments exactly rather than by
vibes:

| Name | Structural restriction | Typical inference |
| --- | --- | --- |
| [[hidden-markov-model|Hidden Markov model]] (common narrow usage) | discrete hidden state, Markov transitions, probabilistic emissions | forward–backward, Viterbi |
| General state-space model | continuous or discrete latent state; arbitrary transition/observation models | Bayesian filtering / smoothing |
| [[linear-gaussian-ssm|Linear-Gaussian state-space model]] | linear dynamics and observations with Gaussian noise | [[kalman-filter|Kalman filter]] / Rauch–Tung–Striebel smoother |
| Nonlinear approximately Gaussian model | nonlinear dynamics/observations | extended or unscented Kalman filters |
| General nonlinear/non-Gaussian model | few convenient distributional restrictions | particle filters and related Monte Carlo methods |

The important terminology correction lives on the edges: a Kalman filter is
not itself a subset of an HMM. A linear-Gaussian state-space model is a
special continuous-state hidden Markov model, and the Kalman filter is the
exact recursive Bayesian inference algorithm *for that model*.

## Filtering alternates prediction and correction

Sequential inference in a state-space model alternates two operations:
prediction through the dynamics and correction using the new observation.
[[bayes-rule|Bayes' rule]] supplies the correction. This creates a useful
conceptual bridge between control/estimation language (prediction,
innovation, covariance update) and statistics language (prior, likelihood,
posterior).

## Observability: can the state be seen at all?

Control theory contributes a structural question that precedes any specific
filter: which internal states can be reconstructed from the available
measurements, and where should sensors be placed to make reconstruction
well-conditioned? Observability theory answers this for linear systems and
has nonlinear extensions. The question travels far beyond engineering — the
map tracks whether experimental design in cell biology uses it (see the open
research-gap edge toward [[biological-regulation]]).

## Two complementary descriptions of one system

State-space descriptions and frequency-domain descriptions
([[integral-transforms|transfer functions]]) are two representations of
linear dynamics; eigenvalues of the state matrix and transfer-function poles
describe the same modes under minimal realizations. [[feedback-control]]
switches freely between the two views, choosing whichever exposes the
question at hand — an instance of [[change-of-representation]].
