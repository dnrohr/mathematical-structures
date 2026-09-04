---
canonical_name: Nondimensionalize it
node_type: move
status: established
summary: >
  Rescale variables by characteristic lengths, times, and amplitudes so
  coefficients become dimensionless ratios — exposing which terms matter,
  which parameter is small, and which regimes are dynamically similar.
fields: [fluids, heat-transfer, mechanics, biology]
aliases:
  - name: scaling the equations / characteristic scales
    field: fluids
  - name: reduced / dimensionless variables
    field: mechanics
canonical_examples:
  - Rescaling a convection-diffusion equation until the Péclet number is the only parameter left
  - Exposing a small parameter that licenses a perturbation expansion
sections:
  - notebook-v0#14-dimensional-analysis-scaling-and-similarity
  - notebook-v0#12-a-fifth-ontology-category-reusable-mathematical-moves
---

Nondimensionalization is [[dimensional-analysis]] wielded as a rewriting
move. Rescale each variable by a characteristic scale — a length, a time, an
amplitude — and the equation's coefficients collapse into dimensionless
ratios. What the raw parameters obscured, the ratios state plainly:

- A coefficient much smaller than one suggests a perturbative approximation
  ([[series-expansion]]).
- A very large ratio may reveal a singular limit or a separated timescale.
- The surviving ratios are the coordinates of the regime map: systems that
  share them behave alike, whatever their physical size.

> dimensional analysis → dimensionless ratios → dominant balance →
> asymptotics / perturbation / regime map

The move often does its best work *before* any solving happens: it decides
what "small" and "large" even mean for this problem, and it shrinks the
experimental parameter space from every raw dial to the handful of groups
that matter — the same reduction that makes wind-tunnel scaling legitimate.

As a member of the reusable-moves family it is a
[[change-of-representation]] in the strictest sense: nothing about the
system changes, only the coordinates describing it — chosen so the
important structure becomes visible.
