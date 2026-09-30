---
canonical_name: Galerkin method
node_type: operation
status: established
summary: The Galerkin method approximates a weak PDE solution in a finite-dimensional trial space.
fields:
  - numerical-analysis
  - pde
assumptions:
  - weak formulation
  - stable conforming trial space
canonical_examples:
  - Galerkin approximations for coercive boundary-value problems. — Galerkin approximations for
    coercive boundary-value problems.
sections:
  - campaign-cross-field-sweep-2026-09#galerkin-method
---

The Galerkin method approximates a weak PDE solution in a finite-dimensional trial space.

## Mathematical skeleton

A variational identity is restricted to a mesh-based subspace, yielding a finite linear or nonlinear system.

The claim is scoped to Galerkin approximations for coercive boundary-value problems. Its stated validity regime is: The stated claim is limited to galerkin approximations for coercive boundary-value problems.

## Boundaries

- The edge is approximate: trial-space refinement and stability are needed for convergence.

Counterexamples and failure probes:

- An unstable or nonconforming discretization can fail to converge.

## Adversarial review

**Challenge.** Boundary test: The edge is approximate: trial-space refinement and stability are needed for convergence.

**Response.** The proposition is restricted to galerkin approximations for coercive boundary-value problems, and the caveat remains explicit.
