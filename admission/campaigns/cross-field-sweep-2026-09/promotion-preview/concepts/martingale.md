---
canonical_name: Martingale
node_type: object
status: established
summary: A martingale has conditional expected future value equal to its present value relative to a
  filtration.
fields:
  - probability
  - statistics
assumptions:
  - integrability
  - adaptedness
canonical_examples:
  - Integrable discrete-time processes adapted to a filtration. — Integrable discrete-time processes
    adapted to a filtration.
sections:
  - campaign-cross-field-sweep-2026-09#martingale
---

A martingale has conditional expected future value equal to its present value relative to a filtration.

## Mathematical skeleton

E[X_{n+1}|F_n]=X_n encodes fair-game evolution under the chosen information flow.

The claim is scoped to Integrable discrete-time processes adapted to a filtration. Its stated validity regime is: The stated claim is limited to integrable discrete-time processes adapted to a filtration.

## Boundaries

- Changing probability measure or numeraire changes the martingale property.

Counterexamples and failure probes:

- A process with positive conditional drift is a submartingale, not a martingale.

## Adversarial review

**Challenge.** Boundary test: Changing probability measure or numeraire changes the martingale property.

**Response.** The proposition is restricted to integrable discrete-time processes adapted to a filtration, and the caveat remains explicit.
