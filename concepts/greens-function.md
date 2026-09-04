---
canonical_name: Green's functions and impulse response
node_type: object
status: established
summary: >
  The response of a linear system to a point source or idealized impulse.
  Once that elementary response is known, any forcing is handled by
  superposition — one object under three names: impulse response, Green's
  function, propagator.
fields: [pde, control, signal-processing, quantum]
aliases:
  - name: impulse response / convolution kernel
    field: signal-processing
  - name: impulse response (time domain of the transfer function)
    field: control
  - name: fundamental solution / Green's function
    field: pde
  - name: propagator / kernel
    field: quantum
assumptions:
  - linearity (superposition is the whole mechanism)
  - for convolution form, translation invariance; otherwise the kernel depends on both points
canonical_examples:
  - The heat kernel assembling solutions of the diffusion equation
  - An LTI system's output as input convolved with its impulse response
  - Boundary-value problems solved by integrating sources against a Green's function
sections:
  - notebook-v0#19-integral-transforms-change-the-problem-before-solving-it
  - notebook-v0#34-a-first-set-of-explicit-cross-field-translation-chains
---

A Green's function asks for the response of a linear operator to a point
source. Once that elementary response is known, a general forcing can be
assembled by superposition:

$$L\,G(x, s) = \delta(x - s) \quad \Rightarrow \quad u(x) = \int G(x, s)\, f(s)\, ds \ \text{ solves } \ L u = f.$$

This is the map's cleanest same-skeleton-different-dialect example, and one
of its explicit translation chains: in engineering language the object is
the *impulse response*, whose convolution against the input gives an LTI
system's output; in PDEs and field theory it is the *Green's function* or
*fundamental solution*; in quantum and field contexts it becomes the
*propagator*. One mathematical object, three professional vocabularies —
the dialect table above is the translation.

The construction sits naturally beside [[integral-transforms]]: transform
methods diagonalize the operator, Green's functions invert it against the
most singular possible input. The two cooperate — the transfer function of
[[feedback-control|control engineering]] is the Laplace transform of the
impulse response, and its [[complex-analysis|poles]] mark the system's
resonant and decaying modes. For [[diffusion]], the Green's function is the
heat kernel, which is also the transition density of Brownian motion —
tying the object back to probability.

The idealized point source is made rigorous by distribution theory (see
[[smoothness]]); physically it encodes a probe: strike the system once,
sharply, and everything linear about it is revealed.
