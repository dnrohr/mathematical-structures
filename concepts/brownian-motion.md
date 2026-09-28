---
canonical_name: Brownian motion
node_type: model
status: established
summary: Brownian motion is the canonical continuous-path process with independent stationary
  Gaussian increments.
fields:
  - probability
  - statistics
assumptions:
  - continuous paths
  - Gaussian independent increments
canonical_examples:
  - Standard Brownian motion in Euclidean space. — Standard Brownian motion in Euclidean space.
sections:
  - campaign-cross-field-sweep-2026-09#brownian-motion
---

Brownian motion is the canonical continuous-path process with independent stationary Gaussian increments.

## Mathematical skeleton

Increment variance grows linearly in time, yielding the heat semigroup and diffusion scaling.

The claim is scoped to Standard Brownian motion in Euclidean space. Its stated validity regime is: The stated claim is limited to standard Brownian motion in Euclidean space.

## Boundaries

- Physical diffusion models may include drift, boundaries, or anomalous scaling.

Counterexamples and failure probes:

- A Levy flight has jumps and is not Brownian despite spreading randomly.

## Adversarial review

**Challenge.** Boundary test: Physical diffusion models may include drift, boundaries, or anomalous scaling.

**Response.** The proposition is restricted to standard Brownian motion in Euclidean space, and the caveat remains explicit.
