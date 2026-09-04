---
canonical_name: Hidden Markov models
node_type: model
status: established
summary: >
  A hidden Markov state emitting probabilistic observations. In the common
  narrow usage the hidden state is discrete; read broadly (continuous state
  spaces allowed) the same skeleton covers general state-space models.
fields: [probability, statistics, ml, signal-processing, biology]
aliases:
  - name: HMM / forward-backward / Viterbi decoding
    field: signal-processing
  - name: latent Markov model / regime-switching model
    field: statistics
  - name: profile HMM (sequence analysis)
    field: biology
assumptions:
  - Markov transitions of the hidden state
  - observations conditionally independent given the current state
canonical_examples:
  - Speech recognition with discrete phoneme states
  - Profile HMMs aligning biological sequences
  - Regime-switching models in econometrics
sections:
  - notebook-v0#13-probability-bayes-and-markov-structure
  - notebook-v0#8-field-dialects-named-special-cases-and-translation
---

A hidden Markov model separates an unobserved Markov chain from the
observations it emits: transitions carry the dynamics, emissions carry the
evidence. In the common narrow usage the hidden state is discrete and
inference runs by the forward–backward and Viterbi algorithms.

The map records the nomenclature carefully because this cluster is a
showcase of dialect confusion:

- The generative skeleton — hidden Markov state plus conditionally
  independent emissions — is the same one the
  [[state-space-model|state-space model]] community works with; the two
  literatures differ mainly in which state spaces and noise models they
  emphasize and in what they call things.
- A [[linear-gaussian-ssm|linear-Gaussian state-space model]] is a special
  *continuous-state* hidden Markov model.
- The [[kalman-filter|Kalman filter]] is **not** a subset of an HMM: it is
  the exact recursive Bayesian inference algorithm for the linear-Gaussian
  model class. Model and algorithm live on opposite sides of a SOLVED-BY
  edge, never an IS-A edge.

Inference in any HMM is sequential [[bayes-rule|Bayesian updating]]:
predict through the transition model, correct on the new observation. The
discrete-state algorithms and the Kalman recursions are the same two-step
dance on different state spaces.

The underlying conditional-independence structure — future independent of
the past given the present — is exactly the [[markov-chains|Markov
property]], enriched with an observation layer.
