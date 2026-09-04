---
canonical_name: Symmetry and invariance
node_type: principle
status: established
summary: >
  A transformation is a symmetry when it changes the description without
  changing the law. The move is to ask which transformations leave the model
  invariant and what constraints follow — conserved quantities, selected
  representations, and the ways symmetry can break.
fields: [mechanics, quantum, pde, statistics, networks]
aliases:
  - name: invariance / covariance of laws
    field: mechanics
  - name: symmetry groups / selection rules
    field: quantum
  - name: exchangeability (permutation invariance)
    field: statistics
  - name: graph automorphisms / structural equivalence
    field: networks
assumptions:
  - the symmetry is a property of the law or model; particular states may still break it
canonical_examples:
  - Time-translation invariance yielding energy conservation
  - Translation symmetry selecting Fourier modes as the natural basis
  - A pitchfork bifurcation breaking a left-right symmetric equilibrium
sections:
  - notebook-v0#29-symmetry-invariance-and-conservation
---

Symmetry is a high-level organizing principle: a transformation is a
symmetry when it changes the description of a system without changing some
relevant structure or law. The important move is not noticing visual
symmetry but asking *which transformations leave the model invariant* and
what constraints follow from that invariance.

| Transformation / symmetry | Invariant structure | Typical consequence or dialect |
| --- | --- | --- |
| translation in space | laws unchanged by choice of spatial origin | momentum conservation in Lagrangian mechanics |
| translation in time | laws unchanged by choice of time origin | energy conservation |
| rotation | laws unchanged by orientation | angular-momentum conservation |
| permutation | description unchanged by relabeling equivalent objects | exchange symmetry, network invariance, combinatorics |
| gauge transformation | observables unchanged under representational redundancy | gauge fields and constraints |
| scale transformation | form preserved under rescaling | power laws, self-similarity, critical phenomena |

## Symmetry becomes a dynamical constraint

For systems described by an action principle, every differentiable
continuous symmetry of the action is associated with a conserved current or
quantity — [[noethers-theorem|Noether's theorem]], the structural version
of "symmetry leads to [[conservation-laws|conservation]]":

> continuous symmetry → invariant action → conserved current / charge

## Symmetry selects the representation

Symmetry also tells us how to choose coordinates: translation symmetry
favors [[fourier-analysis|Fourier modes]]; rotational symmetry favors
angular-momentum or spherical-harmonic bases; periodic crystal symmetry
favors Bloch waves. This SYMMETRY-SELECTS-REPRESENTATION pattern is the
principled engine behind [[change-of-representation]] — and unit
invariance playing the same game with rescalings is what powers
[[dimensional-analysis]].

## Symmetry breaking

The governing laws can possess a symmetry that an actual state does not.
The map distinguishes three cases that colloquial usage merges: *explicit*
breaking (the law itself has a small asymmetric term), *spontaneous*
breaking (symmetric law, asymmetric stable states — magnetism, crystals,
morphogenesis, the pitchfork [[bifurcation]] in miniature), and an
ordinary asymmetric initial condition. Spontaneous breaking links
mechanics and field theory to phase transitions and pattern formation.
