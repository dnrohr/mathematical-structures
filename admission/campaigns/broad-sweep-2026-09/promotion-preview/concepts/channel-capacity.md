---
canonical_name: Channel capacity
node_type: principle
status: established
summary: Channel capacity is the supremum of reliably achievable communication rates and governs the
  asymptotic rate limit for digital communication over a specified channel model.
fields:
  - information-theory
  - probability
assumptions:
  - fixed channel law
  - arbitrarily long block codes
canonical_examples:
  - Discrete memoryless channels, with model-specific extensions. — Asymptotically long codes under
    the channel model and error criterion of the coding theorem.
sections:
  - campaign-broad-sweep-2026-09#channel-capacity
---

Channel capacity is the supremum of reliably achievable communication rates and governs the asymptotic rate limit for digital communication over a specified channel model.

## Mathematical skeleton

For a memoryless channel C equals the maximum over input laws of mutual information I(X;Y).

The claim is scoped to Discrete memoryless channels, with model-specific extensions. Its stated validity regime is: Rates below capacity are achievable; rates above are ruled out by a converse.

## Boundaries

- Finite-blocklength and mismatch constraints change practical limits.

Counterexamples and failure probes:

- A rate above C with vanishing error would contradict the converse.

## Adversarial review

**Challenge.** Capacity is model-dependent, not a property of hardware alone.

**Response.** The channel law and asymptotic coding regime are explicit.
