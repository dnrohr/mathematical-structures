---
canonical_name: Community detection
node_type: operation
status: established
summary: Spectral community detection uses graph-matrix eigenvectors to find groups with unusually
  dense internal connection.
fields:
  - networks
  - probability
assumptions:
  - specified null model or cut objective
canonical_examples:
  - Networks whose chosen objective has meaningful mesoscale structure. — Networks whose chosen
    objective has meaningful mesoscale structure.
sections:
  - campaign-cross-field-sweep-2026-09#community-detection
---

Spectral community detection uses graph-matrix eigenvectors to find groups with unusually dense internal connection.

## Mathematical skeleton

A partition is extracted from low-dimensional spectral coordinates associated with Laplacian or modularity matrices.

The claim is scoped to Networks whose chosen objective has meaningful mesoscale structure. Its stated validity regime is: The stated claim is limited to networks whose chosen objective has meaningful mesoscale structure.

## Boundaries

- Different objectives define different communities and can have resolution limits.

Counterexamples and failure probes:

- Modularity optimization can merge small well-defined groups in a large network.

## Adversarial review

**Challenge.** Boundary test: Different objectives define different communities and can have resolution limits.

**Response.** The proposition is restricted to networks whose chosen objective has meaningful mesoscale structure, and the caveat remains explicit.
