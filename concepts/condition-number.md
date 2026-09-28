---
canonical_name: Condition number
node_type: principle
status: established
summary: A condition number governs first-order amplification of input perturbations into solution changes.
fields:
  - numerical-analysis
  - optimization
assumptions:
  - specified norms
  - small perturbations
canonical_examples:
  - Well-posed finite-dimensional numerical problems near a specified input. — Well-posed
    finite-dimensional numerical problems near a specified input.
sections:
  - campaign-cross-field-sweep-2026-09#condition-number
---

A condition number governs first-order amplification of input perturbations into solution changes.

## Mathematical skeleton

It is a local Lipschitz ratio, often expressed through operator norms or singular values.

The claim is scoped to Well-posed finite-dimensional numerical problems near a specified input. Its stated validity regime is: The stated claim is limited to well-posed finite-dimensional numerical problems near a specified input.

## Boundaries

- Conditioning is a property of the problem, not the algorithm.

Counterexamples and failure probes:

- A backward-stable algorithm can still give a poor forward answer on an ill-conditioned problem.

## Adversarial review

**Challenge.** Boundary test: Conditioning is a property of the problem, not the algorithm.

**Response.** The proposition is restricted to well-posed finite-dimensional numerical problems near a specified input, and the caveat remains explicit.
