---
canonical_name: QR factorization
node_type: operation
status: established
summary: QR factorization reduces a full-rank least-squares problem to a triangular solve.
fields:
  - numerical-analysis
  - optimization
assumptions:
  - full column rank
canonical_examples:
  - Overdetermined full-column-rank linear least squares. — Overdetermined full-column-rank linear
    least squares.
sections:
  - campaign-cross-field-sweep-2026-09#qr-factorization
---

QR factorization reduces a full-rank least-squares problem to a triangular solve.

## Mathematical skeleton

A = QR preserves Euclidean residual norms because Q has orthonormal columns.

The claim is scoped to Overdetermined full-column-rank linear least squares. Its stated validity regime is: The stated claim is limited to overdetermined full-column-rank linear least squares.

## Boundaries

- Normal equations and QR have different numerical conditioning.

Counterexamples and failure probes:

- Rank deficiency requires pivoting or a rank-revealing method.

## Adversarial review

**Challenge.** Boundary test: Normal equations and QR have different numerical conditioning.

**Response.** The proposition is restricted to overdetermined full-column-rank linear least squares, and the caveat remains explicit.
