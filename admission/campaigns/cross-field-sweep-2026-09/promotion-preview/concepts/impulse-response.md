---
canonical_name: Impulse response
node_type: dialect
status: established
summary: An LTI system impulse response is the Green-function kernel for its input-output operator.
fields:
  - control
  - signal-processing
assumptions:
  - linearity
  - time invariance
canonical_examples:
  - Linear time-invariant systems with compatible boundary or initial conventions. — Linear
    time-invariant systems with compatible boundary or initial conventions.
sections:
  - campaign-cross-field-sweep-2026-09#impulse-response
---

An LTI system impulse response is the Green-function kernel for its input-output operator.

## Mathematical skeleton

Translation invariance makes the response to an input the convolution with the response to a unit impulse.

The claim is scoped to Linear time-invariant systems with compatible boundary or initial conventions. Its stated validity regime is: The stated claim is limited to linear time-invariant systems with compatible boundary or initial conventions.

## Boundaries

- Boundary-dependent Green functions need not be translation invariant.

Counterexamples and failure probes:

- A time-varying system requires a two-time kernel rather than a single impulse response.

## Adversarial review

**Challenge.** Boundary test: Boundary-dependent Green functions need not be translation invariant.

**Response.** The proposition is restricted to linear time-invariant systems with compatible boundary or initial conventions, and the caveat remains explicit.
