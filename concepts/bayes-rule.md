---
canonical_name: Bayes' rule and conditioning
node_type: theorem
status: established
summary: >
  Condition beliefs on observations: posterior ∝ likelihood × prior. One
  identity of probability theory, and simultaneously the reusable move
  "condition on the observation" that underlies filtering, inference, and
  learning.
fields: [statistics, probability, control, ml]
aliases:
  - name: measurement update / correction step / innovation
    field: control
  - name: posterior updating / conditioning on evidence
    field: statistics
  - name: Bayesian learning / belief update
    field: ml
assumptions:
  - a joint probability model relating hypotheses/states to observations
canonical_examples:
  - The correction step of the Kalman filter
  - Posterior inference for a parameter given data
sections:
  - notebook-v0#13-probability-bayes-and-markov-structure
---

Bayes' rule,

$$p(x \mid y) = \frac{p(y \mid x)\, p(x)}{p(y)},$$

is a one-line consequence of the definition of conditional probability, and
at the same time one of the most reused moves on the map: *condition on the
observation*. Whatever the field calls it, the structure is the same — a
prior belief, a likelihood connecting the unobserved to the observed, and a
posterior that redistributes probability toward explanations consistent with
what was seen.

The dialect bridge worth recording explicitly: in control and estimation the
same operation appears as the *measurement update* or *correction* step —
prediction through the dynamics, then correction by the innovation — while
statistics says prior, likelihood, posterior. The
[[kalman-filter|Kalman filter]] is this bridge made concrete: its gain and
covariance update are Bayes' rule specialized to Gaussians inside a
[[state-space-model|state-space model]].

Conditioning composes with [[markov-chains|Markov structure]] to give
sequential inference: because the future is independent of the past given
the present, beliefs can be updated recursively, one observation at a time,
without revisiting history. Everything in the filtering family — discrete
[[hidden-markov-model|HMM]] recursions, Kalman variants, particle methods —
is this composition.

Maximum-entropy modeling connects here from the information side: given
constraints but incomplete knowledge, choose the distribution with the
greatest [[shannon-entropy|entropy]] among those satisfying the constraints,
then update it by conditioning as evidence arrives. The assumptions and
interpretation should be stated rather than treated as a universal physical
law (notebook §31).
