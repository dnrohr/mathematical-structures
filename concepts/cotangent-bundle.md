---
canonical_name: Cotangent bundle
node_type: object
status: established
summary: The cotangent bundle T*Q supplies the canonical phase space for unconstrained Hamiltonian
  mechanics on a configuration manifold Q.
fields:
  - mechanics
  - pde
assumptions:
  - smooth configuration manifold
  - unconstrained canonical formulation
canonical_examples:
  - Finite-dimensional canonical Hamiltonian mechanics. — Canonical Hamiltonian systems without
    constraint reduction.
sections:
  - campaign-broad-sweep-2026-09#cotangent-bundle
---

The cotangent bundle T*Q supplies the canonical phase space for unconstrained Hamiltonian mechanics on a configuration manifold Q.

## Mathematical skeleton

Points are pairs (q,p) with p a covector at q, carrying the canonical symplectic two-form.

The claim is scoped to Finite-dimensional canonical Hamiltonian mechanics. Its stated validity regime is: Before constraint reduction or noncanonical coordinate changes.

## Boundaries

- General symplectic phase spaces need not be global cotangent bundles.

Counterexamples and failure probes:

- A reduced coadjoint orbit can be symplectic without being T*Q globally.

## Adversarial review

**Challenge.** Equating every phase space with a cotangent bundle is too strong.

**Response.** The scope is the canonical unconstrained formulation and states the exception.
