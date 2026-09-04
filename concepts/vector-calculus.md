---
canonical_name: Vector calculus and flux
node_type: operation
status: established
summary: >
  Gradient, divergence, curl, and Laplacian as local differential probes of
  fields, tied to global integral statements (flux, circulation) by the
  fundamental theorems — the local/global duality of mathematical physics.
fields: [pde, fluids, mechanics]
aliases:
  - name: vorticity / flux / circulation language
    field: fluids
  - name: field operators (grad, div, curl) of E&M and potential theory
    field: pde
canonical_examples:
  - Gauss's divergence theorem converting interior sources into boundary flux
  - A curl-free force field admitting a scalar potential
  - The Laplacian comparing a value with its neighborhood average
sections:
  - notebook-v0#20-vector-calculus-flux-and-conservation
---

Gradient, divergence, and curl are best understood not as three formulas to
memorize but as local differential probes of fields:

| Operator | Local question | Typical interpretation |
| --- | --- | --- |
| gradient $\nabla f$ | which direction increases a scalar field fastest? | slope, force from a potential, optimization direction |
| divergence $\nabla \cdot F$ | is vector flow locally being created or removed? | sources/sinks, compressibility, conservation |
| curl $\nabla \times F$ | does the field have local circulation? | vorticity, rotational structure, electromagnetic induction |
| Laplacian $\nabla^2$ | how does a value compare with its neighborhood? | diffusion, smoothing, potential theory, waves |

## Local law ↔ global law

Gauss's divergence theorem and Stokes' theorem convert derivatives inside a
region into flux or circulation on its boundary:

> local derivative statement ↔ integral over a region ↔ measurement on the
> boundary

This local/global duality is one of the recurring structural moves of
mathematical physics, and it is the differential half of every
[[conservation-laws|conservation law]]: local bookkeeping
($\partial_t \rho + \nabla \cdot J = 0$) and global accounting (change of
content = flux through the boundary) are two statements of one fact.

## Potentials and curl-free structure

Conservative force fields, electrostatic fields, fluid potentials, and
optimization landscapes share a recurring pattern: a vector field generated
as the gradient of a scalar potential. Under suitable domain conditions,
vanishing curl signals that such a potential exists. The vocabulary changes
substantially between mechanics, E&M, fluids, and
[[optimization|optimization]] — where "gradient" is the descent direction
on a loss landscape — but the structure is identical.

The Laplacian's neighborhood-comparison reading makes it the natural
generator of smoothing dynamics ([[diffusion]]) and, discretized onto a
network, it becomes the [[graph-laplacian]]. The probes assume enough
[[smoothness]] to differentiate; shocks and interfaces hand the local
statements over to weak (integral) formulations.
