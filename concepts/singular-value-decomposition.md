---
canonical_name: Singular value decomposition
node_type: object
status: established
summary: The singular value decomposition expresses a matrix as orthogonal input and output
  directions linked by nonnegative gains.
fields:
  - numerical-analysis
  - optimization
assumptions:
  - finite-dimensional inner-product spaces
canonical_examples:
  - Finite real or complex matrices. — Finite real or complex matrices.
sections:
  - campaign-cross-field-sweep-2026-09#singular-value-decomposition
---

The singular value decomposition expresses a matrix as orthogonal input and output directions linked by nonnegative gains.

## Mathematical skeleton

A = UΣV* separates domain directions, amplification factors, and range directions.

The claim is scoped to Finite real or complex matrices. Its stated validity regime is: The stated claim is limited to finite real or complex matrices.

## Boundaries

- Small singular values amplify inverse-problem noise.

Counterexamples and failure probes:

- A rank-deficient matrix has no ordinary inverse despite having an SVD.

## Adversarial review

**Challenge.** Boundary test: Small singular values amplify inverse-problem noise.

**Response.** The proposition is restricted to finite real or complex matrices, and the caveat remains explicit.
