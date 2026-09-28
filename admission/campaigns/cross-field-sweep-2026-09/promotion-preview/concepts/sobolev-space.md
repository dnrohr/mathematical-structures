---
canonical_name: Sobolev space
node_type: object
status: established
summary: A Sobolev space controls functions through integrability of weak derivatives.
fields:
  - numerical-analysis
  - pde
assumptions:
  - measurable functions modulo equality almost everywhere
canonical_examples:
  - Integer-order Sobolev spaces on open Euclidean domains. — Integer-order Sobolev spaces on open
    Euclidean domains.
sections:
  - campaign-cross-field-sweep-2026-09#sobolev-space
---

A Sobolev space controls functions through integrability of weak derivatives.

## Mathematical skeleton

The norm combines an Lp size with the Lp sizes of weak derivatives up to a fixed order.

The claim is scoped to Integer-order Sobolev spaces on open Euclidean domains. Its stated validity regime is: The stated claim is limited to integer-order Sobolev spaces on open Euclidean domains.

## Boundaries

- Sobolev regularity does not generally imply pointwise differentiability.

Counterexamples and failure probes:

- A W^{1,p} function below the embedding threshold need not be continuous.

## Adversarial review

**Challenge.** Boundary test: Sobolev regularity does not generally imply pointwise differentiability.

**Response.** The proposition is restricted to integer-order Sobolev spaces on open Euclidean domains, and the caveat remains explicit.
