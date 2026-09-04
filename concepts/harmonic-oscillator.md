---
canonical_name: Harmonic oscillator
node_type: model
status: established
summary: >
  The generic local model of stable oscillation: near a stable equilibrium
  of a smooth potential the leading nonconstant term is quadratic, so the
  restoring force is approximately linear and the motion is harmonic.
fields: [mechanics, quantum, pde, signal-processing]
aliases:
  - name: mass-spring-damper / LC and RLC circuit
    field: mechanics
  - name: normal mode (one decoupled degree of freedom)
    field: pde
  - name: quantum harmonic oscillator / ladder operators
    field: quantum
assumptions:
  - a smooth potential with a stable equilibrium
  - displacements small enough that the quadratic term dominates
canonical_examples:
  - "V(x) ≈ V(x₀) + ½V″(x₀)(x−x₀)² near a stable minimum"
  - Molecular vibrations treated as coupled harmonic modes
  - The LC circuit as an electrical oscillator with the same equation
sections:
  - notebook-v0#3-first-node-series-expansion-and-approximation
  - notebook-v0#12-eigenvalues-and-spectral-decomposition
---

Near a stable equilibrium of a smooth potential $V(x)$, the linear term
vanishes and the leading nonconstant term is quadratic:

$$V(x) \approx V(x_0) + \tfrac{1}{2} V''(x_0)\,(x - x_0)^2$$

Therefore the restoring force is approximately linear, producing harmonic
motion. This one [[series-expansion|second-order expansion]] explains why
harmonic oscillators recur in mechanics, circuits, molecular vibration,
acoustics, solids, and field theory: the oscillator is not a lucky
coincidence of physics but the generic local model of stable oscillation
about equilibrium.

The many-body version is the other half of the story. A coupled vibrating
system decomposes — via the generalized eigenproblem of [[eigenvalues]] —
into normal modes, and *each normal mode behaves like an independent
harmonic oscillator*:

> coupled mechanical system → generalized eigenproblem → normal modes →
> independent harmonic oscillators

So the oscillator is simultaneously the local truth about one degree of
freedom and the modal truth about many. Quantum mechanics keeps both roles:
quadratic expansions around field minima make the harmonic oscillator the
starting point of quantization, with ladder operators as its algebraic
dialect.

Where the approximation fails is as informative as where it holds: larger
displacements bring in anharmonic terms, mode coupling, and amplitude-
dependent frequency — the entry points to [[phase-space|nonlinear
dynamics]].
