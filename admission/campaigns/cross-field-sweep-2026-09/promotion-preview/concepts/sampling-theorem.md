---
canonical_name: Sampling theorem
node_type: theorem
status: established
summary: A bandlimited signal is determined by uniformly spaced samples taken above twice its
  highest frequency.
fields:
  - control
  - signal-processing
assumptions:
  - strict bandlimit
  - sampling clock without jitter
canonical_examples:
  - Exactly bandlimited continuous-time signals with ideal uniform sampling. — Exactly bandlimited
    continuous-time signals with ideal uniform sampling.
sections:
  - campaign-cross-field-sweep-2026-09#sampling-theorem
---

A bandlimited signal is determined by uniformly spaced samples taken above twice its highest frequency.

## Mathematical skeleton

Spectral replicas created by sampling remain disjoint above the Nyquist rate and can be ideally filtered.

The claim is scoped to Exactly bandlimited continuous-time signals with ideal uniform sampling. Its stated validity regime is: The stated claim is limited to exactly bandlimited continuous-time signals with ideal uniform sampling.

## Boundaries

- Real signals are rarely exactly bandlimited and ideal reconstruction is noncausal.

Counterexamples and failure probes:

- A sinusoid above the Nyquist frequency aliases to a lower sampled frequency.

## Adversarial review

**Challenge.** Boundary test: Real signals are rarely exactly bandlimited and ideal reconstruction is noncausal.

**Response.** The proposition is restricted to exactly bandlimited continuous-time signals with ideal uniform sampling, and the caveat remains explicit.
