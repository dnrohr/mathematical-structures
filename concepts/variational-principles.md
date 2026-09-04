---
canonical_name: Variational principles
node_type: principle
status: established
summary: >
  Define a trajectory or state as a stationary point of a functional — least
  action, minimal energy — with the Euler–Lagrange equations bridging global
  variational statements and local differential laws.
fields: [mechanics, pde, quantum, optimization]
aliases:
  - name: least / stationary action, Lagrangian and Hamiltonian formulation
    field: mechanics
  - name: energy methods / weak formulations
    field: pde
  - name: path-integral viewpoint (action-weighted paths)
    field: quantum
assumptions:
  - the law in question admits a functional whose stationary points are the solutions
  - enough smoothness for the Euler–Lagrange calculus (else weak formulations)
canonical_examples:
  - "Euler–Lagrange: d/dt(∂L/∂q̇) − ∂L/∂q = 0 from stationary action"
  - A soap film minimizing area subject to its boundary
  - Ground states as minimizers of an energy functional
sections:
  - notebook-v0#30-optimization-and-variational-principles
  - notebook-v0#34-a-first-set-of-explicit-cross-field-translation-chains
---

A trajectory can be defined either by a differential equation or as a
stationary point of a functional. The Euler–Lagrange equations provide the
bridge:

$$\delta \int L(q, \dot{q}, t)\, dt = 0 \quad \Longleftrightarrow \quad \frac{d}{dt}\frac{\partial L}{\partial \dot{q}} - \frac{\partial L}{\partial q} = 0.$$

This is an important same-solution / different-formulation relationship:
local differential laws and global variational statements can encode the
same solution set, and each formulation makes different things easy. The
differential form computes; the variational form *explains* — it survives
coordinate changes gracefully, exposes invariants, and generalizes to
fields and constrained systems.

The map's translation chain runs straight through this node:

> least action (mechanics) ↔ variational formulation (applied math) ↔
> objective functional ([[optimization]]) ↔ loss/cost functional
> (control/ML)

The shared skeleton is "extremize a functional"; the emphases differ.
Physics cares about *stationarity* (saddle points are fine — the action is
not minimized so much as made stationary) and about what invariance of the
functional implies; optimization cares about minima, algorithms, and
convergence. Keeping the distinction visible prevents the false friend
"nature minimizes effort".

What invariance implies is exactly [[noethers-theorem|Noether's theorem]]:
continuous symmetries of the action yield [[conservation-laws|conserved
quantities]] — the variational formulation is the hypothesis that makes
that theorem run. And [[phase-space|Hamiltonian dynamics]] is the
variational tradition's geometric face, obtained from the Lagrangian by a
change of variables.

In PDEs the same idea becomes energy methods and weak formulations —
which is also where variational thinking meets [[smoothness|nonsmooth
reality]]: a weak solution is precisely a stationarity statement that
survives when classical derivatives do not.
