---
canonical_name: GMRES
node_type: operation
status: established
summary: GMRES chooses from a Krylov affine space the iterate with minimum Euclidean residual.
fields:
  - numerical-analysis
  - optimization
assumptions:
  - nonzero initial residual
canonical_examples:
  - Nonsymmetric linear systems in exact arithmetic or controlled finite precision. — Nonsymmetric
    linear systems in exact arithmetic or controlled finite precision.
sections:
  - campaign-cross-field-sweep-2026-09#gmres
---

GMRES chooses from a Krylov affine space the iterate with minimum Euclidean residual.

## Mathematical skeleton

Arnoldi orthogonalization converts residual minimization to a small Hessenberg least-squares problem.

The claim is scoped to Nonsymmetric linear systems in exact arithmetic or controlled finite precision. Its stated validity regime is: The stated claim is limited to nonsymmetric linear systems in exact arithmetic or controlled finite precision.

## Boundaries

- Memory and orthogonalization costs grow unless the method is restarted.

Counterexamples and failure probes:

- Restarted GMRES can stagnate even when unrestarted GMRES converges.

## Adversarial review

**Challenge.** Boundary test: Memory and orthogonalization costs grow unless the method is restarted.

**Response.** The proposition is restricted to nonsymmetric linear systems in exact arithmetic or controlled finite precision, and the caveat remains explicit.
