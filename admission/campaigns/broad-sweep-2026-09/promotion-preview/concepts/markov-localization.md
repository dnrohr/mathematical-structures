---
canonical_name: Markov localization
node_type: operation
status: established
summary: Markov localization performs recursive Bayes filtering over robot pose using motion and
  sensor models.
fields:
  - control
  - probability
assumptions:
  - Markov state
  - conditionally independent current observation given state
canonical_examples:
  - Robot localization in a known map. — Discrete or continuous pose-state Bayes filters with Markov
    motion and observation models.
sections:
  - campaign-broad-sweep-2026-09#markov-localization
---

Markov localization performs recursive Bayes filtering over robot pose using motion and sensor models.

## Mathematical skeleton

Alternate prediction by the transition kernel with correction by the observation likelihood.

The claim is scoped to Robot localization in a known map. Its stated validity regime is: Correctly specified motion and measurement models.

## Boundaries

- Representation may be grid, particles, or parametric and changes approximation behavior.

Counterexamples and failure probes:

- Long-lived unmodeled state violates the Markov pose model.

## Adversarial review

**Challenge.** Markov localization names a problem family and several implementations.

**Response.** The node is anchored to the common recursive Bayes skeleton; implementations become examples.
