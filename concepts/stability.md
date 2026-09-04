---
canonical_name: Stability
node_type: principle
status: established
summary: >
  Does a disturbed system return, persist, or run away? Local stability is
  read off eigenvalues of a linearization; distance to instability is the
  robustness question every field asks in its own dialect.
fields: [control, mechanics, biology, pde, economics]
aliases:
  - name: asymptotic / Lyapunov stability, stability margins
    field: control
  - name: buckling threshold / structural stability
    field: mechanics
  - name: robustness of steady states / return to homeostasis
    field: biology
  - name: equilibrium stability (comparative dynamics)
    field: economics
assumptions:
  - a well-defined reference solution (equilibrium, cycle, trajectory) to be stable *about*
canonical_examples:
  - "Re(λ) < 0 for all Jacobian eigenvalues ⇒ local asymptotic stability"
  - A damped oscillator returning to rest after a kick
  - Loss of stability at a Hopf bifurcation giving birth to oscillation
sections:
  - notebook-v0#12-eigenvalues-and-spectral-decomposition
  - notebook-v0#22-phase-space-nonlinear-dynamics-bifurcation-and-chaos
---

Stability asks the map's most consequential qualitative question: after a
disturbance, does the system return to its reference behavior, stay
nearby, or depart? Nearly every cluster of the atlas feeds an answer.

**The local verdict is spectral.** Linearize about the reference state
([[linearization]]); the [[eigenvalues]] of the Jacobian classify the
neighborhood — all eigenvalues in the left half-plane means decay back,
any in the right half-plane means escape, and the imaginary parts add
oscillation. The eigenvalue plane is a compressed qualitative map of
dynamics, read fluently by control engineers (pole locations), mechanical
engineers (damping of modes), and ecologists (stability of steady states)
in their own dialects.

**The verdict has a geography.** In [[phase-space]], stability is the
shape of the flow near a fixed point or cycle; basins of attraction bound
how large a disturbance the local verdict survives. Lyapunov functions
generalize "energy decreases" into certificates of stability that need no
linearization at all.

**The interesting question is usually distance.** Systems near the
boundary behave differently long before they cross it: slow recovery,
growing oscillation, sensitivity to parameters. "How far from unstable?"
is asked as [[stability-margins|gain and phase margins]] in classical
control, as spectral abscissa and eigenvalue robustness in state-space
language, and as proximity to a [[bifurcation]] in nonlinear dynamics —
where crossing the boundary is not an explosion but a reorganization
(new equilibria, a limit cycle via Hopf).

**Feedback trades performance against it.** Closing a loop moves the
eigenvalues — the entire craft of [[feedback-control]] is placing them
well while respecting the sensitivity conservation that says suppression
somewhere is amplification elsewhere.
