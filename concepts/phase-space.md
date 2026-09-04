---
canonical_name: Phase space and nonlinear dynamics
node_type: operation
status: established
summary: >
  Represent the complete instantaneous state as a point and evolution as a
  trajectory: temporal behavior becomes geometry. Fixed points, cycles, and
  attractors organize what the system can do.
fields: [mechanics, control, biology, pde]
aliases:
  - name: state portrait / phase portrait
    field: mechanics
  - name: state trajectory / state-plane analysis
    field: control
  - name: dynamical-systems view of regulation
    field: biology
assumptions:
  - a state vector rich enough that the dynamics are memoryless in it
canonical_examples:
  - The pendulum's phase portrait organizing libration vs. rotation
  - Nullclines and fixed points of a two-species population model
  - A limit cycle as a closed trajectory attracting its neighborhood
sections:
  - notebook-v0#22-phase-space-nonlinear-dynamics-bifurcation-and-chaos
---

Phase space changes the representation of dynamics: instead of plotting a
variable against time, represent the complete instantaneous state as a
point and the system's evolution as a trajectory. This turns temporal
behavior into geometry — an instance of [[change-of-representation]] with
an unusually high payoff, because geometric objects (fixed points, closed
orbits, attractors, basins) classify behavior that time series only hint
at.

## Fixed points and local linearization

At a fixed point the state no longer changes. Taylor expansion of the
dynamics around it produces a Jacobian; its [[eigenvalues]] classify local
growth, decay, and oscillation. This is the direct bridge from
approximation ([[linearization]]) through spectral analysis to nonlinear
dynamics, and it decides local [[stability]] wherever the fixed point is
hyperbolic.

## Beyond the linear neighborhood

The geometry holds what no single linearization can see: multiple
coexisting equilibria with basins of attraction, limit cycles (closed
trajectories that neighboring states spiral toward), and in three or more
dimensions the folded structures of [[chaos]]. Conserved quantities from
[[conservation-laws|conservation laws]] constrain trajectories to surfaces
in phase space — energy shells in mechanics — which is how conservation
becomes geometry.

## Qualitative change

As parameters vary, the portrait itself can reorganize — equilibria appear,
collide, or shed cycles. Those events are [[bifurcation|bifurcations]], and
tracking them is the study of how systems change *kind* of behavior rather
than merely degree. The phase-space view is what makes "qualitative change"
a precise idea instead of a metaphor.
