---
canonical_name: Conservation laws
node_type: principle
status: established
summary: >
  A conserved density obeys ∂ρ/∂t + ∇·J = 0: content changes only by flux
  through the boundary. Mass, charge, probability, energy, and momentum all
  acquire this bookkeeping form, and continuous symmetries are its deepest
  source.
fields: [mechanics, pde, fluids, probability]
aliases:
  - name: continuity equation / conserved currents
    field: pde
  - name: mass / momentum / energy budgets
    field: fluids
  - name: probability conservation (normalization flow)
    field: probability
canonical_examples:
  - "The continuity equation ∂ρ/∂t + ∇·J = 0 for mass, charge, or probability"
  - Energy conservation constraining a mechanical trajectory to an energy shell
  - Kirchhoff's current law as conservation at a network node
sections:
  - notebook-v0#20-vector-calculus-flux-and-conservation
  - notebook-v0#29-symmetry-invariance-and-conservation
---

For a conserved density $\rho$ with flux $J$, conservation takes the
generic local form

$$\frac{\partial \rho}{\partial t} + \nabla \cdot J = 0.$$

Mass conservation, charge conservation, probability conservation, and
population transport all acquire this form; source or sink terms modify
the right-hand side rather than changing the basic bookkeeping structure.
The differential statement and the integral statement — content inside a
region changes only by flux through its boundary — are the two halves of
the local/global duality carried by [[vector-calculus]].

Conservation is a *constraint on what can happen*. Conserved quantities
confine trajectories to invariant surfaces in [[phase-space]] (the energy
shell), rule out entire classes of behavior without solving anything, and
provide the invariants that numerical integrators are judged against.
Even where nothing is exactly conserved, the accounting form survives:
budgets with explicitly named sources and sinks are how fluids, ecology,
and chemistry keep honest books.

The deepest origin of conservation is [[symmetry]]: by Noether's theorem,
every differentiable continuous symmetry of a system's action yields a
conserved quantity — time-translation invariance gives energy, spatial
translation gives momentum, rotation gives angular momentum. This upgrades
"symmetry often leads to conservation" from heuristic to structure, under
the theorem's stated hypotheses (see [[noethers-theorem]]).

On networks the same principle discretizes: flow conservation at each node
of a graph is the combinatorial continuity equation, tying this node to
flows, cuts, and circuits studied through the [[graph-laplacian]].
