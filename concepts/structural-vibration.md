---
canonical_name: Structural dynamics and earthquake engineering
node_type: application
status: established
summary: >
  Predicting how buildings, bridges, and columns move, resonate, and fail —
  the domain problem where the mass–stiffness eigenproblem, the SDOF
  oscillator, variational frequency bounds, and the buckling bifurcation
  converge on the calculations civil and mechanical design codes run on.
fields: [mechanics]
aliases:
  - name: modal analysis — natural frequencies, mode shapes, response spectra
    field: mechanics
canonical_examples:
  - "A modal test: natural frequencies and mode shapes of a bridge extracted and matched against the mass–stiffness eigenproblem"
  - "Earthquake design by response spectrum: each mode read as an SDOF oscillator at its period and damping, modal responses recombined"
  - "Euler buckling of a slender column: the straight state losing stability at the critical load as bent equilibria branch off"
sections:
  - notebook-v0#12-eigenvalues-and-spectral-decomposition
---

Structural dynamics is the mechanics dialect of this map speaking at full
volume: the same eigenvalue machinery the atlas records as "natural
frequencies / mode shapes" is here the daily calculation behind seismic
codes, vibration limits, and buckling checks. What the field adds is the
discipline of reading a continuum structure as a handful of oscillators —
and knowing when the reduction is licensed.

**Modal analysis is the eigenproblem.** Discretize a structure and its
free vibration is the generalized eigenproblem of the mass–stiffness
pencil, $(K - \omega^2 M)\,\phi = 0$: [[eigenvalues]] give natural
frequencies, eigenvectors give mode shapes, and mass-orthogonality of the
modes decouples the equations of motion into independent modal
coordinates. A modal test — shakers, accelerometers, curve fits — is this
theorem run in reverse: measure the modes, infer the pencil, reconcile
with the model.

**Each mode is a one-mass oscillator.** Modal superposition reduces an
N-degree-of-freedom structure to N independent single-degree-of-freedom
[[harmonic-oscillator|oscillators]], one per mode — which is why the SDOF
oscillator is earthquake engineering's working unit. A design response
spectrum is a catalog of maximum SDOF responses versus period and
damping; analysis reads each mode's peak off the spectrum and recombines
them (SRSS or CQC, since the peaks are not simultaneous). Resonance is
the failure shape being avoided: a forcing spectrum overlapping a lightly
damped mode near its natural frequency.

**Frequencies obey variational bounds.** The Rayleigh quotient bounds the
fundamental frequency from above using *any* admissible deflection shape
— guess a shape, get a bound — and Rayleigh–Ritz turns families of trial
shapes into matrix eigenproblems whose frequencies converge from above.
That is [[variational-principles|variational structure]] doing design
work: hand estimates before the model exists, and the mathematical route
by which the finite-element method industrialized the same idea (FEA
itself stays operation content near the variational node — the M13
demotion holds).

**Buckling is a bifurcation.** A slender column under increasing load
keeps its straight equilibrium until, at Euler's critical load, that
state loses [[stability]] and symmetric bent equilibria branch off — a
pitchfork [[bifurcation]], engineering's oldest (1744). Design against it
is distance-to-the-boundary budgeting: slenderness ratios and effective
lengths price how far a member sits from its critical load, and imperfect
columns follow the perfect pitchfork's unfolding — which is why small
initial crookedness produces large deflections near the limit rather than
a clean branch.

The recognition pattern is the resonance shape: a driven system
responding violently near specific frequencies — one of the map's
symptom-index entries, with this page as its worked example. The same
shape appears wherever a lightly damped mode meets a matching excitation:
rotor whirl, acoustic cavities, power-grid inter-area swings, circuit
tanks — different hardware, one eigenstructure story.
