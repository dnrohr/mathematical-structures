---
canonical_name: Dynamic programming
node_type: operation
status: established
summary: Dynamic programming solves sequential optimization by decomposing it into state-indexed
  subproblems.
fields:
  - control
  - optimization
assumptions:
  - state summarizes relevant history
canonical_examples:
  - Problems with a sufficient Markov state and separable stage costs. — Problems with a sufficient
    Markov state and separable stage costs.
sections:
  - campaign-cross-field-sweep-2026-09#dynamic-programming
---

Dynamic programming solves sequential optimization by decomposing it into state-indexed subproblems.

## Mathematical skeleton

The principle of optimality yields recursive value functions and policies.

The claim is scoped to Problems with a sufficient Markov state and separable stage costs. Its stated validity regime is: The stated claim is limited to problems with a sufficient Markov state and separable stage costs.

## Boundaries

- State dimension can make exact computation infeasible.

Counterexamples and failure probes:

- A continuous high-dimensional state space produces the curse of dimensionality.

## Adversarial review

**Challenge.** Boundary test: State dimension can make exact computation infeasible.

**Response.** The proposition is restricted to problems with a sufficient Markov state and separable stage costs, and the caveat remains explicit.
