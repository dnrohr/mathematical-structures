---
canonical_name: Noether's theorem
node_type: theorem
status: established
summary: >
  For systems described by an action principle, every differentiable
  continuous symmetry of the action corresponds to a conserved current or
  quantity — the structural link between symmetry and conservation.
fields: [mechanics, quantum, pde]
aliases:
  - name: conserved currents / Noether charges
    field: quantum
  - name: first integrals from symmetries
    field: mechanics
assumptions:
  - dynamics derivable from an action principle (a variational formulation)
  - the symmetry is continuous and differentiable (discrete symmetries are not covered)
canonical_examples:
  - Time-translation invariance ⇒ energy conservation
  - Spatial translation ⇒ momentum; rotation ⇒ angular momentum
  - Gauge symmetry ⇒ charge conservation in field theory
sections:
  - notebook-v0#29-symmetry-invariance-and-conservation
---

Noether's theorem is the reason the map draws the arrow from
[[symmetry]] to [[conservation-laws]] at theorem strength rather than as
a vibe: for systems described by an action principle, every differentiable
continuous symmetry of the action is associated with a conserved current
or quantity.

> continuous symmetry → invariant action → conserved current / charge

This is a much stronger connection than the heuristic statement that
symmetry "often leads to" conservation. Under the theorem's assumptions
the relation is structural — and the assumptions earn their place in the
front-matter: the dynamics must come from a
[[variational-principles|variational formulation]], and the symmetry must
be continuous. Systems with dissipation (no action principle) or only
discrete symmetries fall outside the theorem's hypotheses, which is
exactly the kind of applicability boundary the atlas records as ASSUMES
edges instead of fine print.

The classical instances are the conservation laws of mechanics: invariance
under time translation yields energy, under spatial translation momentum,
under rotation angular momentum. In field theory the same machinery
produces conserved currents satisfying the continuity equation
$\partial_t \rho + \nabla \cdot J = 0$ — Noether output flowing directly
into the bookkeeping form studied under [[conservation-laws]].
