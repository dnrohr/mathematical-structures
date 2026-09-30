---
canonical_name: Krylov subspace
node_type: object
status: established
summary: A Krylov subspace collects successive applications of a linear operator to a starting vector.
fields:
  - numerical-analysis
  - optimization
assumptions:
  - chosen start vector
canonical_examples:
  - Finite-dimensional iterative linear algebra. — Finite-dimensional iterative linear algebra.
sections:
  - campaign-cross-field-sweep-2026-09#krylov-subspace
---

A Krylov subspace collects successive applications of a linear operator to a starting vector.

## Mathematical skeleton

K_m(A,b)=span{b,Ab,...,A^{m-1}b} encodes polynomial approximations to operator action.

The claim is scoped to Finite-dimensional iterative linear algebra. Its stated validity regime is: The stated claim is limited to finite-dimensional iterative linear algebra.

## Boundaries

- A deficient start vector may miss invariant subspaces.

Counterexamples and failure probes:

- If b is an eigenvector, the Krylov space never grows beyond dimension one.

## Adversarial review

**Challenge.** Boundary test: A deficient start vector may miss invariant subspaces.

**Response.** The proposition is restricted to finite-dimensional iterative linear algebra, and the caveat remains explicit.
