---
canonical_name: Policy iteration
node_type: operation
status: established
summary: Policy iteration alternates exact policy evaluation with greedy policy improvement.
fields:
  - control
  - optimization
assumptions:
  - finite policy set
canonical_examples:
  - Finite discounted MDPs with exact arithmetic. — Finite discounted MDPs with exact arithmetic.
sections:
  - campaign-cross-field-sweep-2026-09#policy-iteration
---

Policy iteration alternates exact policy evaluation with greedy policy improvement.

## Mathematical skeleton

Each improvement weakly lowers cost until a policy is Bellman optimal.

The claim is scoped to Finite discounted MDPs with exact arithmetic. Its stated validity regime is: The stated claim is limited to finite discounted MDPs with exact arithmetic.

## Boundaries

- Approximate evaluation can break monotone improvement without error control.

Counterexamples and failure probes:

- A noisy value estimate can choose a worse greedy action.

## Adversarial review

**Challenge.** Boundary test: Approximate evaluation can break monotone improvement without error control.

**Response.** The proposition is restricted to finite discounted MDPs with exact arithmetic, and the caveat remains explicit.
