---
canonical_name: Detailed balance
node_type: principle
status: established
summary: Detailed balance implies stationarity by pairing probability flow across each ordered state pair.
fields:
  - probability
  - statistics
assumptions:
  - nonnegative normalized π
canonical_examples:
  - Finite reversible Markov chains. — Finite reversible Markov chains.
sections:
  - campaign-cross-field-sweep-2026-09#detailed-balance
---

Detailed balance implies stationarity by pairing probability flow across each ordered state pair.

## Mathematical skeleton

The identities π(x)P(x,y)=π(y)P(y,x) sum to πP=π.

The claim is scoped to Finite reversible Markov chains. Its stated validity regime is: The stated claim is limited to finite reversible Markov chains.

## Boundaries

- Stationarity does not imply detailed balance for nonreversible chains.

Counterexamples and failure probes:

- A directed cycle has a stationary law but violates pairwise reversibility.

## Adversarial review

**Challenge.** Boundary test: Stationarity does not imply detailed balance for nonreversible chains.

**Response.** The proposition is restricted to finite reversible Markov chains, and the caveat remains explicit.
