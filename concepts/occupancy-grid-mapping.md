---
canonical_name: Occupancy grid mapping
node_type: operation
status: established
summary: Occupancy-grid mapping applies Bayesian updates to cell occupancy variables using inverse
  sensor evidence under a simplifying cell-independence approximation.
fields:
  - control
  - probability
assumptions:
  - static environment
  - approximate conditional independence of cells
canonical_examples:
  - Static two-dimensional or three-dimensional occupancy grids. — Static maps with grid cells and
    an inverse sensor model.
sections:
  - campaign-broad-sweep-2026-09#occupancy-grid-mapping
---

Occupancy-grid mapping applies Bayesian updates to cell occupancy variables using inverse sensor evidence under a simplifying cell-independence approximation.

## Mathematical skeleton

Per-cell log odds accumulate prior-adjusted measurement log-likelihood ratios.

The claim is scoped to Static two-dimensional or three-dimensional occupancy grids. Its stated validity regime is: Mapping with known or separately estimated robot poses.

## Boundaries

- Cell independence is computationally useful but generally false in the full posterior.

Counterexamples and failure probes:

- Strongly correlated occlusion structure violates independent cell updates.

## Adversarial review

**Challenge.** The standard update can look exact while relying on a strong independence approximation.

**Response.** The approximation is stated in the proposition and caveats.
