---
canonical_name: Linearize it
node_type: move
status: established
summary: >
  Near a reference point — usually an equilibrium — replace a nonlinear
  system by its first-order expansion: δẋ ≈ J(x₀)δx. The Jacobian's
  eigenvalues then classify local growth, decay, and oscillation.
fields: [control, mechanics, biology, numerical-analysis]
aliases:
  - name: small-signal analysis / operating-point analysis
    field: control
  - name: linear (local) stability analysis
    field: biology
  - name: Newton linearization
    field: numerical-analysis
assumptions:
  - differentiability at the reference point
  - hyperbolicity for stability conclusions (no eigenvalues on the imaginary axis)
canonical_examples:
  - "δẋ ≈ J(x₀)δx near an equilibrium of ẋ = f(x)"
  - Small-signal models of circuits around a bias point
  - Newton's method solving a nonlinear system through successive linearizations
sections:
  - notebook-v0#3-first-node-series-expansion-and-approximation
  - notebook-v0#22-phase-space-nonlinear-dynamics-bifurcation-and-chaos
---

For $\dot{x} = f(x)$, near an equilibrium $x_0$:

$$\delta\dot{x} \approx J(x_0)\,\delta x$$

Linearization is the first-order case of [[series-expansion]] used as a
*move*: trade the true nonlinear system for its Jacobian at a reference
point, answer the local question in the linear world, and know when the
answer transfers back.

The move creates the chain the whole map leans on:

> series expansion → linearization → Jacobian → [[eigenvalues]] → local
> [[stability]]

The same chain appears in nonlinear dynamics ([[phase-space|fixed-point
classification]]), control (small-signal models around an operating point),
[[biological-regulation|systems biology]] (local stability of regulatory
steady states), and numerical analysis (Newton's method is linearization
iterated).

What transfers back, and when, is not a formality. The linearization
classifies the nonlinear system's local behavior only at *hyperbolic*
equilibria — no eigenvalues on the stability boundary (the imaginary axis
in continuous time, the unit circle for maps). At a local [[bifurcation]]
of the equilibrium the leading eigenvalue reaches that boundary, the linear
term goes silent, and the verdict passes to higher-order terms: the move
fails precisely where local qualitative change happens, which is why
bifurcation theory exists. Global phenomena — limit cycles far from
equilibria, [[chaos]] — are invisible to any single linearization.
