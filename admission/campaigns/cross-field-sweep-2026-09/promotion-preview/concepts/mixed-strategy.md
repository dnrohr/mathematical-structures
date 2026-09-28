---
canonical_name: Mixed strategy
node_type: object
status: established
summary: A mixed strategy is a probability distribution over a player’s pure actions.
fields:
  - economics
  - optimization
assumptions:
  - randomization independently implemented unless correlation is modeled
canonical_examples:
  - Finite strategic games. — Finite strategic games.
sections:
  - campaign-cross-field-sweep-2026-09#mixed-strategy
---

A mixed strategy is a probability distribution over a player’s pure actions.

## Mathematical skeleton

Expected utility extends multilinearly from pure action profiles to product distributions.

The claim is scoped to Finite strategic games. Its stated validity regime is: The stated claim is limited to finite strategic games.

## Boundaries

- Mixing can represent deliberate randomization or population frequencies, which are different interpretations.

Counterexamples and failure probes:

- A correlated device produces joint distributions not expressible as independent mixed strategies.

## Adversarial review

**Challenge.** Boundary test: Mixing can represent deliberate randomization or population frequencies, which are different interpretations.

**Response.** The proposition is restricted to finite strategic games, and the caveat remains explicit.
