---
canonical_name: Truncated singular value decomposition
node_type: operation
status: established
summary: Truncated SVD regularizes inversion by discarding components associated with small singular values.
fields:
  - numerical-analysis
  - optimization
assumptions:
  - available SVD
  - selected truncation level
canonical_examples:
  - Linear inverse problems with an informative spectral ordering. — Linear inverse problems with an
    informative spectral ordering.
sections:
  - campaign-cross-field-sweep-2026-09#truncated-singular-value-decomposition
---

Truncated SVD regularizes inversion by discarding components associated with small singular values.

## Mathematical skeleton

Only singular components above a selected index or threshold are inverted.

The claim is scoped to Linear inverse problems with an informative spectral ordering. Its stated validity regime is: The stated claim is limited to linear inverse problems with an informative spectral ordering.

## Boundaries

- A hard cutoff can introduce artifacts and is expensive at large scale.

Counterexamples and failure probes:

- Signal aligned with a discarded singular vector is lost completely.

## Adversarial review

**Challenge.** Boundary test: A hard cutoff can introduce artifacts and is expensive at large scale.

**Response.** The proposition is restricted to linear inverse problems with an informative spectral ordering, and the caveat remains explicit.
