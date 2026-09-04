---
canonical_name: Dimensional analysis, scaling, and similarity
node_type: operation
status: established
summary: >
  Reduce a problem expressed in many dimensional variables to a smaller set of
  dimensionless groups; reveal similarity classes; and exploit the constraint
  that no physical prediction can depend on an arbitrary choice of units.
fields: [fluids, heat-transfer, mechanics, biology]
aliases:
  - name: similarity analysis / dynamic similarity / similitude
    field: fluids
  - name: dimensionless groups (Re, Pé, Pr, Da, St)
    field: heat-transfer
  - name: allometric scaling arguments
    field: biology
assumptions:
  - the governing variables and base dimensions are correctly enumerated
  - the usual rank conditions on the dimensional matrix (Buckingham Pi)
canonical_examples:
  - "Reynolds number Re = ρvL/μ: matched Re gives dynamically similar flows at different physical sizes"
  - Wind-tunnel and hydraulic scale models designed by matching dimensionless groups
  - Nondimensionalizing an ODE to expose a small parameter for perturbation
sections:
  - notebook-v0#11-deeper-node-dimensional-analysis-scaling-and-invariance
  - notebook-v0#14-dimensional-analysis-scaling-and-similarity
---

Dimensional analysis is more than unit checking. It reduces a problem
expressed in many dimensional variables to a smaller set of dimensionless
groups, reveals similarity classes, guides experimental scaling, and connects
naturally to invariance. Its core constraint is invariance to arbitrary
choices of physical units: a physical prediction cannot depend on whether
length is measured in meters or feet. It reduces parameter spaces *before*
solving equations — a first-pass model reduction.

## Buckingham Π theorem

If a physically meaningful relation involves $n$ dimensional variables built
from $k$ independent base dimensions, the relation can be rewritten in terms
of $n - k$ independent dimensionless groups (under the usual rank
assumptions):

$$F(x_1, x_2, \ldots, x_n) = 0 \quad \rightarrow \quad \Phi(\Pi_1, \Pi_2, \ldots, \Pi_{n-k}) = 0$$

This is not merely a consistency check; it can reveal the effective
coordinates of an experiment.

## Canonical example: the Reynolds number

For flow characterized by density $\rho$, speed $v$, length $L$, and dynamic
viscosity $\mu$, the combination $\mathrm{Re} = \rho v L / \mu$ is
dimensionless. Systems of very different physical size can exhibit
dynamically similar behavior when the relevant dimensionless groups are
matched — the basis of wind-tunnel, hydraulic, and laboratory scaling.

## Canonical dimensionless numbers

| Number | Rough comparison | Where it appears |
| --- | --- | --- |
| Reynolds | inertial / viscous effects | fluid flow, turbulence, biological flow |
| Mach | flow speed / sound speed | compressible flow, aerodynamics |
| Péclet | advection / diffusion | heat and mass transport |
| Prandtl | momentum diffusivity / thermal diffusivity | heat transfer |
| Damköhler | reaction / transport timescales | combustion, chemical and biological transport |
| Strouhal | oscillation timescale / advective timescale | vortex shedding, locomotion |

## What dimensional analysis is doing conceptually

- reducing many raw parameters to fewer meaningful combinations
- identifying quantities invariant under changes of units
- revealing similarity classes across apparently different physical systems
- providing a first-pass model reduction before solving equations
- suggesting which experiments can be scaled and which dimensionless regimes
  must be preserved

The rewriting move itself — rescale variables by characteristic lengths,
times, and amplitudes so coefficients become dimensionless ratios — is
[[nondimensionalization]]. A coefficient much smaller than one suggests a
perturbative approximation ([[series-expansion]]); a very large ratio may
reveal a singular limit or separated timescale.

> dimensional analysis → dimensionless ratios → dominant balance →
> asymptotics / perturbation / regime map

## Scaling beyond units — a boundary worth keeping

The next layer is scaling under changes in *physical or observational* scale:
power laws, self-similarity, critical phenomena, and [[renormalization]] ask
which features persist as the scale of description changes. This is related
to dimensional analysis through invariance, but should not be collapsed into
it: unit changes alter the description without changing the physical scale;
renormalization changes the scale at which the system is represented. The
edge between the two nodes carries this caveat explicitly.

Unit invariance is also a first taste of a broader pattern: invariance under
a transformation group constraining what can happen — see [[symmetry]].
