---
canonical_name: Relative entropy
node_type: object
status: established
summary: Relative entropy measures the discrepancy of a distribution P from a reference Q and can be
  written as cross-entropy minus Shannon entropy.
fields:
  - information-theory
  - probability
assumptions:
  - P absolutely continuous with respect to Q for finite divergence
canonical_examples:
  - Classical probability distributions. — P absolutely continuous with respect to Q; finite
    alphabets for the elementary formula.
sections:
  - campaign-broad-sweep-2026-09#relative-entropy
---

Relative entropy measures the discrepancy of a distribution P from a reference Q and can be written as cross-entropy minus Shannon entropy.

## Mathematical skeleton

D(P parallel Q) equals the expectation under P of log p over q and is nonnegative.

The claim is scoped to Classical probability distributions. Its stated validity regime is: Discrete finite alphabets or measure-theoretic extension with Radon-Nikodym derivative.

## Boundaries

- It is asymmetric and is not a metric.

Counterexamples and failure probes:

- If Q assigns zero mass where P is positive, divergence is infinite.

## Adversarial review

**Challenge.** The word distance encourages false symmetry and triangle-inequality assumptions.

**Response.** The claim uses discrepancy and explicitly denies metric status.
