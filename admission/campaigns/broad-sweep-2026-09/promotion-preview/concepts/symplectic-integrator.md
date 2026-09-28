---
canonical_name: Symplectic integrator
node_type: move
status: established
summary: A symplectic integrator preserves the discrete symplectic two-form and thereby reproduces
  the long-time geometric structure of Hamiltonian phase-space flow.
fields:
  - mechanics
  - numerical-analysis
assumptions:
  - symplectic phase space
  - symplectic one-step map
canonical_examples:
  - Finite-dimensional Hamiltonian integration. — Symplectic numerical maps applied to Hamiltonian
    systems.
sections:
  - campaign-broad-sweep-2026-09#symplectic-integrator
---

A symplectic integrator preserves the discrete symplectic two-form and thereby reproduces the long-time geometric structure of Hamiltonian phase-space flow.

## Mathematical skeleton

The one-step map Phi satisfies pullback of omega equals omega.

The claim is scoped to Finite-dimensional Hamiltonian integration. Its stated validity regime is: Fixed-step methods under the stated construction.

## Boundaries

- Symplecticity does not imply exact energy conservation at every step.

Counterexamples and failure probes:

- Generic adaptive step-size changes can destroy symplecticity.

## Adversarial review

**Challenge.** Good energy plots alone do not prove a method symplectic.

**Response.** The definition uses the form-preservation identity, with energy behavior only a consequence.
