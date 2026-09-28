---
canonical_name: Inverse problem
node_type: model
status: established
summary: An inverse problem infers latent causes or parameters from indirect observed effects.
fields:
  - numerical-analysis
  - optimization
assumptions:
  - specified forward model
canonical_examples:
  - Linear discrete inverse problems arising from measurement operators. — Linear discrete inverse
    problems arising from measurement operators.
sections:
  - campaign-cross-field-sweep-2026-09#inverse-problem
---

An inverse problem infers latent causes or parameters from indirect observed effects.

## Mathematical skeleton

A forward operator maps an unknown x to data b, and inversion seeks x from noisy b.

The claim is scoped to Linear discrete inverse problems arising from measurement operators. Its stated validity regime is: The stated claim is limited to linear discrete inverse problems arising from measurement operators.

## Boundaries

- Nonidentifiability can persist even with noiseless data.

Counterexamples and failure probes:

- A forward operator with a nontrivial nullspace maps different unknowns to the same data.

## Adversarial review

**Challenge.** Boundary test: Nonidentifiability can persist even with noiseless data.

**Response.** The proposition is restricted to linear discrete inverse problems arising from measurement operators, and the caveat remains explicit.
