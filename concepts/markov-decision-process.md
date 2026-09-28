---
canonical_name: Markov decision process
node_type: model
status: established
summary: A Markov decision process models controlled stochastic transitions with state-dependent
  rewards or costs.
fields:
  - control
  - optimization
assumptions:
  - Markov transition law
canonical_examples:
  - Finite-state finite-action MDPs under a stated horizon and criterion. — Finite-state
    finite-action MDPs under a stated horizon and criterion.
sections:
  - campaign-cross-field-sweep-2026-09#markov-decision-process
---

A Markov decision process models controlled stochastic transitions with state-dependent rewards or costs.

## Mathematical skeleton

A policy selects actions and induces a controlled Markov kernel whose accumulated criterion is optimized.

The claim is scoped to Finite-state finite-action MDPs under a stated horizon and criterion. Its stated validity regime is: The stated claim is limited to finite-state finite-action MDPs under a stated horizon and criterion.

## Boundaries

- Partial observability requires a belief-state reformulation.

Counterexamples and failure probes:

- If the current observation is not a sufficient state, ordinary MDP policies can be suboptimal.

## Adversarial review

**Challenge.** Boundary test: Partial observability requires a belief-state reformulation.

**Response.** The proposition is restricted to finite-state finite-action MDPs under a stated horizon and criterion, and the caveat remains explicit.
