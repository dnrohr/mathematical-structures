---
canonical_name: Convolution
node_type: operation
status: established
summary: Convolution in time becomes multiplication under the Fourier transform when both sides are defined.
fields:
  - control
  - signal-processing
assumptions:
  - transform and convolution exist
canonical_examples:
  - Integrable signals or generalized-signal settings with justified transforms. — Integrable
    signals or generalized-signal settings with justified transforms.
sections:
  - campaign-cross-field-sweep-2026-09#convolution
---

Convolution in time becomes multiplication under the Fourier transform when both sides are defined.

## Mathematical skeleton

The transform of x*h equals the pointwise product of the transforms of x and h.

The claim is scoped to Integrable signals or generalized-signal settings with justified transforms. Its stated validity regime is: The stated claim is limited to integrable signals or generalized-signal settings with justified transforms.

## Boundaries

- Distributional signals require a generalized formulation.

Counterexamples and failure probes:

- Two arbitrary nonintegrable functions need not have a classical convolution.

## Adversarial review

**Challenge.** Boundary test: Distributional signals require a generalized formulation.

**Response.** The proposition is restricted to integrable signals or generalized-signal settings with justified transforms, and the caveat remains explicit.
