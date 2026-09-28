---
canonical_name: Value iteration
node_type: operation
status: established
summary: Value iteration repeatedly applies the Bellman optimality operator to approximate an MDP
  value function.
fields:
  - control
  - optimization
assumptions:
  - discount factor below one
canonical_examples:
  - Finite discounted MDPs. — Finite discounted MDPs.
sections:
  - campaign-cross-field-sweep-2026-09#value-iteration
---

Value iteration repeatedly applies the Bellman optimality operator to approximate an MDP value function.

## Mathematical skeleton

Discounting makes the Bellman operator a contraction with the optimal value as unique fixed point.

The claim is scoped to Finite discounted MDPs. Its stated validity regime is: The stated claim is limited to finite discounted MDPs.

## Boundaries

- Convergence can be slow when the discount factor is close to one.

Counterexamples and failure probes:

- Undiscounted multichain problems need not satisfy the same contraction proof.

## Adversarial review

**Challenge.** Boundary test: Convergence can be slow when the discount factor is close to one.

**Response.** The proposition is restricted to finite discounted MDPs, and the caveat remains explicit.
