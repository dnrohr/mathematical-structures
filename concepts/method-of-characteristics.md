---
canonical_name: Method of characteristics
node_type: operation
status: established
summary: The method of characteristics converts a first-order PDE into ODEs along characteristic curves.
fields:
  - numerical-analysis
  - pde
assumptions:
  - sufficiently regular coefficients
  - local characteristic flow
canonical_examples:
  - Smooth first-order transport and Hamilton-Jacobi equations before characteristic crossing. —
    Smooth first-order transport and Hamilton-Jacobi equations before characteristic crossing.
sections:
  - campaign-cross-field-sweep-2026-09#method-of-characteristics
---

The method of characteristics converts a first-order PDE into ODEs along characteristic curves.

## Mathematical skeleton

The PDE derivative becomes a directional derivative along a flow in state space.

The claim is scoped to Smooth first-order transport and Hamilton-Jacobi equations before characteristic crossing. Its stated validity regime is: The stated claim is limited to smooth first-order transport and Hamilton-Jacobi equations before characteristic crossing.

## Boundaries

- Characteristics can intersect and destroy classical single-valued solutions.

Counterexamples and failure probes:

- Burgers characteristics cross at shock formation.

## Adversarial review

**Challenge.** Boundary test: Characteristics can intersect and destroy classical single-valued solutions.

**Response.** The proposition is restricted to smooth first-order transport and Hamilton-Jacobi equations before characteristic crossing, and the caveat remains explicit.
