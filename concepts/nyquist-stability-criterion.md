---
canonical_name: Nyquist stability criterion
node_type: theorem
status: established
summary: The Nyquist criterion determines closed-loop stability from encirclements of the critical
  point by the open-loop frequency response.
fields:
  - control
  - mechanics
assumptions:
  - known open-loop unstable poles
  - no unhandled contour singularities
canonical_examples:
  - Proper rational feedback loops with a specified contour convention. — Proper rational feedback
    loops with a specified contour convention.
sections:
  - campaign-cross-field-sweep-2026-09#nyquist-stability-criterion
---

The Nyquist criterion determines closed-loop stability from encirclements of the critical point by the open-loop frequency response.

## Mathematical skeleton

The argument principle relates winding number to right-half-plane zeros of the closed-loop characteristic function.

The claim is scoped to Proper rational feedback loops with a specified contour convention. Its stated validity regime is: The stated claim is limited to proper rational feedback loops with a specified contour convention.

## Boundaries

- Sign and contour conventions change the reported encirclement direction.

Counterexamples and failure probes:

- Ignoring an imaginary-axis pole invalidates the ordinary contour count.

## Adversarial review

**Challenge.** Boundary test: Sign and contour conventions change the reported encirclement direction.

**Response.** The proposition is restricted to proper rational feedback loops with a specified contour convention, and the caveat remains explicit.
