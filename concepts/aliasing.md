---
canonical_name: Aliasing
node_type: phenomenon
status: established
summary: Aliasing occurs when sampling makes distinct continuous frequencies indistinguishable.
fields:
  - control
  - signal-processing
assumptions:
  - fixed sampling interval
canonical_examples:
  - Uniform sampling of continuous-time sinusoids. — Uniform sampling of continuous-time sinusoids.
sections:
  - campaign-cross-field-sweep-2026-09#aliasing
---

Aliasing occurs when sampling makes distinct continuous frequencies indistinguishable.

## Mathematical skeleton

Frequency components separated by an integer multiple of the sampling frequency map to identical samples.

The claim is scoped to Uniform sampling of continuous-time sinusoids. Its stated validity regime is: The stated claim is limited to uniform sampling of continuous-time sinusoids.

## Boundaries

- Antialias filtering changes the input before sampling rather than undoing aliasing afterward.

Counterexamples and failure probes:

- Two sinusoids separated by the sampling frequency have identical sample values.

## Adversarial review

**Challenge.** Boundary test: Antialias filtering changes the input before sampling rather than undoing aliasing afterward.

**Response.** The proposition is restricted to uniform sampling of continuous-time sinusoids, and the caveat remains explicit.
