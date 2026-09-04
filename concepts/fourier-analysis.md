---
canonical_name: Fourier analysis
node_type: operation
status: established
summary: >
  Decompose functions into complex exponentials — simultaneously an integral
  transform and an eigenfunction decomposition, since exponentials are the
  eigenfunctions of translation and differentiation. Derivatives become
  multiplication; convolution becomes multiplication.
fields: [signal-processing, pde, quantum, statistics]
aliases:
  - name: frequency domain / spectrum / FFT
    field: signal-processing
  - name: Fourier series / spectral methods
    field: pde
  - name: momentum representation
    field: quantum
  - name: characteristic function (Fourier transform of a distribution)
    field: statistics
assumptions:
  - linearity and (for the clean theory) time/translation invariance
  - integrability/decay conditions appropriate to the transform variant
canonical_examples:
  - Convolution ↔ multiplication under the Fourier transform
  - Solving the heat equation by evolving each Fourier mode independently
  - The FFT making the change of basis computationally almost free
sections:
  - notebook-v0#19-integral-transforms-change-the-problem-before-solving-it
  - notebook-v0#4-representation-as-a-possible-organizing-axis
---

Fourier analysis belongs simultaneously under [[integral-transforms]] and
under spectral decomposition. Complex exponentials are eigenfunctions of
translation and differentiation — which is why frequency coordinates are so
natural for linear time-invariant systems: the operator does not mix
sinusoidal modes; it merely rescales and phase-shifts them.

> differentiation → multiplication by frequency; convolution →
> multiplication of spectra

That single duality does remarkable work. Differential equations become
algebraic mode-by-mode (the spectral strategy shared with [[eigenvalues]]);
filtering becomes multiplication; correlation structure becomes a power
spectrum; probability distributions gain characteristic functions, through
which the central limit theorem of [[large-number-limits]] has its cleanest
proof.

The deeper reason frequency coordinates exist at all is
[[symmetry]]: translation invariance *selects* the Fourier basis. Whenever
a problem is unchanged by shifting time or space, its natural modes are
complex exponentials; periodic boundary conditions select Fourier series;
a crystal's discrete translations select Bloch waves. Fourier analysis is
the standing example of a symmetry choosing the representation
([[change-of-representation]]).

Its limits define its neighbors: a global basis smears out local,
transient structure — wavelets trade some frequency resolution for
locality; the Laplace variant of [[integral-transforms]] extends frequency
to complex exponentials for initial-value and stability problems, where
[[complex-analysis|pole locations]] take over the story.
