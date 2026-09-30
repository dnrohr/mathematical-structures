---
canonical_name: Tikhonov regularization
node_type: operation
status: established
summary: Tikhonov regularization minimizes data misfit plus a weighted quadratic penalty.
fields:
  - numerical-analysis
  - optimization
assumptions:
  - positive regularization parameter
canonical_examples:
  - Linear inverse problems with a chosen penalty operator. — Linear inverse problems with a chosen
    penalty operator.
sections:
  - campaign-cross-field-sweep-2026-09#tikhonov-regularization
---

Tikhonov regularization minimizes data misfit plus a weighted quadratic penalty.

## Mathematical skeleton

The solution balances ||Ax-b||² against λ²||Lx||².

The claim is scoped to Linear inverse problems with a chosen penalty operator. Its stated validity regime is: The stated claim is limited to linear inverse problems with a chosen penalty operator.

## Boundaries

- The result depends materially on the penalty and parameter choice.

Counterexamples and failure probes:

- An identity penalty oversmooths a solution whose meaningful structure lies in a rough component.

## Adversarial review

**Challenge.** Boundary test: The result depends materially on the penalty and parameter choice.

**Response.** The proposition is restricted to linear inverse problems with a chosen penalty operator, and the caveat remains explicit.
