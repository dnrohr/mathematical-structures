---
canonical_name: Antenna design and analysis
node_type: application
status: established
summary: >
  Shaping how a structure radiates and receives — the RF engineering
  problem where point-source superposition, resonant-mode analysis,
  constrained pattern synthesis, and complex-analytic bandwidth limits
  converge on one piece of metal.
fields: [electromagnetics, signal-processing, optimization]
aliases:
  - name: radiation patterns / characteristic modes / impedance matching
    field: electromagnetics
  - name: array processing / beamforming weights
    field: signal-processing
  - name: pattern synthesis as a constrained program
    field: optimization
canonical_examples:
  - "A dipole's radiation pattern from the radiation integral of its current distribution — source convolved with the free-space kernel"
  - "Dolph–Chebyshev array weights: the provably narrowest main beam for a chosen sidelobe level"
  - "Bode–Fano limits: a small antenna's Q capping the bandwidth any lossless matching network can deliver"
---

An antenna is a boundary-value problem sold as a product, and its design
workflow walks through four structures in a fixed order: compute what a
current radiates, find which currents the shape supports, choose the
current you want, and accept what analyticity says you cannot have.

**Radiation integrals.** The field of any source distribution is the
source convolved with the free-space
[[greens-function|Green's function]]; far-field patterns are that
kernel's asymptotic form. Computational electromagnetics inherits the
same object: the method of moments discretizes the boundary integral
equation whose kernel is the Green's function, which is why solver
matrices are dense and why the formulation needs no absorbing boundary —
the kernel already carries the radiation condition.

**Resonant modes.** Which currents can a given shape support?
Characteristic-mode analysis diagonalizes the impedance operator into
real resonant current modes — an [[eigenvalues|eigenproblem]] whose
spectrum says where each mode resonates and whose eigenvectors say what
a feed placement can excite. The cavity model of patch antennas is the
same story on a simpler operator: the patch radiates at the
eigenfrequencies of its cavity.

**Synthesis as optimization.** Array design inverts the analysis
direction: given a wanted pattern, choose element weights.
[[optimization|Dolph's Chebyshev taper]] is the classic exact answer —
provably the narrowest main beam achievable at a prescribed sidelobe
level — and modern pattern synthesis poses the same trade as a convex
program over complex weights, constraints on sidelobes and nulls
included. The array's pattern being (essentially) the
[[fourier-analysis|Fourier transform]] of its weighting is what makes
the problem this clean.

**The matching layer.** Delivering power into the resonance is
[[complex-analysis]] doing production work. The Smith chart — the
everyday tool of RF practice — is a Möbius map of the impedance
half-plane onto the reflection-coefficient disk, conformal mapping as an
instrument. And the Bode–Fano bounds cap broadband matching: because the
reflection coefficient of a passive network is analytic in the
half-plane, an integral of its log is conserved, so bandwidth bought at
one frequency is paid for at another. Electrically small antennas obey
that budget, not their designers.

The structures meet in the workflow, not just on this page: the modes
(eigenvalues) determine the input impedance the matching network
(complex analysis) must transform, driven by currents whose radiation
the Green's function prices, toward a pattern the optimizer chose.
