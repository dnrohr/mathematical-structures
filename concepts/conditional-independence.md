---
canonical_name: Conditional independence
node_type: principle
status: established
summary: >
  Variables that are dependent marginally can become independent once a
  separating state or parent set is known, turning a joint law into local
  factors and message-passing structure.
fields: [probability, statistics, ml, signal-processing]
aliases:
  - name: conditional independence / separation
    field: probability
  - name: conditional-independence assumption / graphical separation
    field: statistics
  - name: graphical-model factorization / d-separation
    field: ml
  - name: memoryless observation channel given the state
    field: signal-processing
assumptions:
  - a declared conditioning variable or separating set
canonical_examples:
  - Observations independent over time conditional on a hidden-state path
  - A Bayesian-network factorization into local conditional distributions
sections:
  - notebook-v0#13-probability-bayes-and-markov-structure
---

Conditional independence is the reusable skeleton behind
[[bayesian-network|Bayesian networks]], [[factor-graph|factor graphs]],
[[hidden-markov-model|hidden Markov models]], and general
[[state-space-model|state-space models]]. It says that conditioning on the
right state removes a dependence that is present before conditioning.

## Boundaries

The separator has to be named. Hidden common causes, temporally correlated
measurement noise, or an insufficient state invalidate the factorization and
can make otherwise exact inference recursions overconfident.
