---
canonical_name: Integral transforms
node_type: operation
status: established
summary: >
  Change the problem before solving it: represent a function by how strongly
  it overlaps a family of kernels, so that frequencies, decay rates, scales,
  or projections become explicit and the governing operation becomes simpler.
fields: [signal-processing, control, pde, mechanics]
aliases:
  - name: transfer functions / poles and zeros / Bode and Nyquist plots (Laplace domain)
    field: control
  - name: frequency-domain / spectral methods
    field: signal-processing
  - name: operational calculus / symbol of an operator
    field: pde
assumptions:
  - linearity of the operations to be simplified
  - existence/convergence conditions of the transform on the relevant function class
canonical_examples:
  - Laplace transform turning an initial-value ODE into an algebraic relation
  - Convolution becoming multiplication in the Fourier domain
  - Wavelets exposing localized multiscale structure a global Fourier basis smears out
sections:
  - notebook-v0#19-integral-transforms-change-the-problem-before-solving-it
  - notebook-v0#4-representation-as-a-possible-organizing-axis
---

Integral transforms are a particularly clear instance of the
representation-changing move ([[change-of-representation]]). Instead of
attacking a function or differential equation in its original coordinates,
represent it by how strongly it overlaps a family of kernels. The
transformed problem may expose frequencies, decay rates, scales,
projections, or other coordinates in which the governing operation becomes
simpler.

| Transform / construction | What it exposes | Characteristic simplification |
| --- | --- | --- |
| [[fourier-analysis\|Fourier transform]] | frequency / spatial-frequency content | derivatives become multiplication; convolution becomes multiplication |
| Laplace transform | complex frequency and exponential modes | initial-value differential equations become algebraic relations |
| Wavelet transform | location and scale | localized multiscale structure |
| [[radon-transform\|Radon transform]] | line or hyperplane integrals | tomographic measurements become samples of a transform |
| [[greens-function\|Green's-function representation]] | response to an impulse / point source | linear forced problem becomes superposition of elementary responses |

## Laplace and the control-theory dialect

The Laplace transform extends the frequency idea to exponentially growing or
decaying modes. In control engineering this becomes the language of transfer
functions, poles, zeros, Bode plots, Nyquist plots, gain margin, and phase
margin. The same underlying exponential modes also appear as eigenmodes of
[[state-space-model|state-space dynamics]], providing the bridge between
frequency-domain and state-space descriptions that [[feedback-control]]
exploits, and connecting transform methods to [[eigenvalues]] and to the
pole/residue machinery of [[complex-analysis]].

## Sequences too: generating functions and z-transforms

The same move applies to sequences: a generating function or z-transform
represents a sequence by a function of a complex variable, turning
recurrences into algebra. The kernel family changes; the strategy does not.

## Where the transformed problem lives

The transformed domain is not just a computational trick — it is often the
space where the physics is diagonal. Complex exponentials are eigenfunctions
of translation and differentiation, which is why linear time-invariant
systems are natural in the Fourier domain (see [[fourier-analysis]]); decay
rates are natural in the Laplace domain; scale structure is natural in a
wavelet basis. Choosing a transform is choosing which structure to make
explicit.
