---
canonical_name: Digital communications
node_type: application
status: established
summary: >
  Getting bits through a noisy channel at rates the channel can bear — the
  domain problem where entropy's capacity limit, Fourier diagonalization,
  finite-state Markov codes, and Bayesian detection converge on the modems
  everything else runs over.
fields: [information-theory, signal-processing, electromagnetics]
aliases:
  - name: channel capacity / coding limits
    field: information-theory
  - name: modulation, equalization, OFDM
    field: signal-processing
  - name: the radio link — fading channels and link budgets
    field: electromagnetics
canonical_examples:
  - "OFDM over a multipath channel: cyclic prefix, one FFT pair, and intersymbol interference becomes independent flat subchannels (Wi-Fi, LTE, DSL)"
  - "A convolutional code decoded by Viterbi: the exact maximum-likelihood path through a finite-state trellis"
  - "A modern link running LDPC codes within fractions of a decibel of Shannon capacity"
---

A digital link is the atlas's cleanest example of a field engineered
*around* a theorem: Shannon set the exact limit before the machinery to
approach it existed, and sixty years of modem design is the story of
closing the gap. Every layer of a working link — the limit itself, the
waveform, the code, the detector — is a structure this map names.

**The limit is the operating constraint.** The noisy-channel coding
theorem gives a sharp number: below capacity
$C = \max_{p(x)} I(X;Y)$ — for the Gaussian channel,
$\log_2(1 + \mathrm{SNR})$ per use — arbitrarily reliable communication
is possible, and above it, impossible. That is [[shannon-entropy|Shannon's
machinery]] doing production work: capacity is computed during link
design the way a structural engineer computes a load limit, and modern
codes are graded by their distance from it in decibels. The theorem's
converse is why the grading is honest — nobody is one clever trick away
from beating it.

**The waveform is a diagonalization.** A dispersive channel smears
symbols into each other; OFDM defeats it with [[fourier-analysis]]. The
cyclic prefix makes the channel's convolution act *circulantly* on each
block, and the DFT diagonalizes circulant operators exactly — so one FFT
pair turns intersymbol interference into a bank of independent flat
subchannels, each equalized by a single complex division. The
representation is chosen the way this map says representations get
chosen: to make the governing operator diagonal. Wi-Fi, LTE, and DSL all
live on this identity.

**Codes are finite-state Markov models.** A convolutional encoder is a
shift register: its state diagram unrolled in time is a trellis, and the
coded sequence is a path through a finite-state
[[markov-chains|Markov model]]. Viterbi's algorithm computes the exact
maximum-likelihood path by dynamic programming on that trellis — the
same recursion shape the map records wherever Markov structure licenses
stagewise computation. The algorithms (Viterbi, BCJR) are techniques and
stay in edge context; the structure that makes them exact is the chain.

**Detection is posterior inference.** Deciding what was sent is
[[bayes-rule|Bayes' rule]] under channel noise: MAP detection weighs
likelihoods against priors, BCJR runs forward–backward over the trellis
for per-symbol posteriors, and iterative decoding of turbo and LDPC codes
is belief propagation — message passing whose fixed points approximate
the posterior on a loopy graph. The near-capacity performance that closed
Shannon's gap came exactly from this inference reading of decoding.

The seam with [[antenna-design]] is deliberate: that page owns the
radiating hardware — patterns, impedance, bandwidth — while this one owns
the symbols through the channel the hardware provides; the link budget is
where the two meet. The recognition pattern is the noisy-channel shape:
information must cross a medium that corrupts it, and the honest questions
are "what rate can this medium bear?" before "what scheme approaches it?"
— the same two-step wherever storage, sensing, or molecular signaling is
read as communication.
