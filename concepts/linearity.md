---
canonical_name: Linearity and superposition
node_type: principle
status: established
summary: >
  A map preserves addition and scalar multiplication, so responses can be
  decomposed into independent contributions and recombined by superposition.
fields: [control, signal-processing, mechanics, pde, statistics, ml, optimization]
aliases:
  - name: linear system / superposition principle
    field: control
  - name: linear time-invariant model / superposition
    field: signal-processing
  - name: linear response / small-displacement regime
    field: mechanics
  - name: linear operator / superposition principle
    field: pde
  - name: linear model
    field: statistics
  - name: linear layer / linear predictor
    field: ml
  - name: linear objective and constraints
    field: optimization
assumptions:
  - closure under addition and scalar multiplication in the stated model class
canonical_examples:
  - Decomposing an LTI response into a sum of impulse responses
  - Expanding a linear operator in independent eigenmodes
sections:
  - notebook-v0#12-eigenvalues-and-spectral-decomposition
---

Linearity is the license behind [[eigenvalues|spectral decomposition]],
[[impulse-response|impulse responses]], normal modes, and transform methods.
For a linear map $L$, the identity

$$L(\alpha x + \beta y)=\alpha L(x)+\beta L(y)$$

makes decomposition useful: solve the pieces, then superpose them.

## Boundaries

Linearity is a property of the declared model, not necessarily of the physical
system. [[linearization]] can supply a local linear surrogate, but saturation,
switching, state-dependent coefficients, and finite-amplitude effects break the
global superposition claim.
