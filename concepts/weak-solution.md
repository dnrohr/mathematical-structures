---
canonical_name: Weak solution
node_type: model
status: established
summary: A weak solution satisfies an integrated PDE identity without requiring all classical
  derivatives to exist.
fields:
  - numerical-analysis
  - pde
assumptions:
  - locally integrable unknown
  - admissible test functions
canonical_examples:
  - Weak formulations of PDEs on domains with specified boundary data. — Weak formulations of PDEs
    on domains with specified boundary data.
sections:
  - campaign-cross-field-sweep-2026-09#weak-solution
---

A weak solution satisfies an integrated PDE identity without requiring all classical derivatives to exist.

## Mathematical skeleton

Derivatives are transferred to test functions by integration by parts, producing an integral identity.

The claim is scoped to Weak formulations of PDEs on domains with specified boundary data. Its stated validity regime is: The stated claim is limited to weak formulations of PDEs on domains with specified boundary data.

## Boundaries

- Weak solutions may be nonunique without additional estimates or entropy conditions.

Counterexamples and failure probes:

- A distribution satisfying the equation can fail required boundary or energy conditions.

## Adversarial review

**Challenge.** Boundary test: Weak solutions may be nonunique without additional estimates or entropy conditions.

**Response.** The proposition is restricted to weak formulations of PDEs on domains with specified boundary data, and the caveat remains explicit.
