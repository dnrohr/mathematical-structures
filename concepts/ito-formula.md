---
canonical_name: Ito formula
node_type: theorem
status: established
summary: Ito formula is the stochastic chain rule with an additional quadratic-variation term.
fields:
  - probability
  - statistics
assumptions:
  - required smoothness and integrability
canonical_examples:
  - Twice spatially differentiable functions of continuous semimartingales. — Twice spatially
    differentiable functions of continuous semimartingales.
sections:
  - campaign-cross-field-sweep-2026-09#ito-formula
---

Ito formula is the stochastic chain rule with an additional quadratic-variation term.

## Mathematical skeleton

For dX=b dt+σ dW, the differential of f(X,t) contains one half σ² times the second derivative.

The claim is scoped to Twice spatially differentiable functions of continuous semimartingales. Its stated validity regime is: The stated claim is limited to twice spatially differentiable functions of continuous semimartingales.

## Boundaries

- Ordinary chain-rule intuition misses the second-order term.

Counterexamples and failure probes:

- Applying the classical chain rule to W_t² omits the dt contribution.

## Adversarial review

**Challenge.** Boundary test: Ordinary chain-rule intuition misses the second-order term.

**Response.** The proposition is restricted to twice spatially differentiable functions of continuous semimartingales, and the caveat remains explicit.
