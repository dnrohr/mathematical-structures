---
canonical_name: Data-processing inequality
node_type: theorem
status: established
summary: Processing data through a Markov channel cannot increase mutual information, constraining
  entropy-derived information measures.
fields:
  - information-theory
  - probability
assumptions:
  - Markov conditional independence
canonical_examples:
  - Shannon mutual information for random variables forming a Markov chain. — Markov chain X to Y to
    Z under Shannon mutual information.
sections:
  - campaign-broad-sweep-2026-09#data-processing-inequality
---

Processing data through a Markov channel cannot increase mutual information, constraining entropy-derived information measures.

## Mathematical skeleton

If X-Y-Z is Markov, then I(X;Z) is at most I(X;Y).

The claim is scoped to Shannon mutual information for random variables forming a Markov chain. Its stated validity regime is: Deterministic or stochastic post-processing represented by the channel Y to Z.

## Boundaries

- Equality conditions require additional sufficiency structure.

Counterexamples and failure probes:

- Side information not included in the Markov chain can alter the comparison.

## Adversarial review

**Challenge.** The theorem is about mutual information, not entropy monotonically decreasing in every process.

**Response.** The proposition names mutual information and the Markov condition explicitly.
