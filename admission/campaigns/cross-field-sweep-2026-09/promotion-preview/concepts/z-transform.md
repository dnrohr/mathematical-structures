---
canonical_name: Z-transform
node_type: operation
status: established
summary: The Z-transform represents a discrete sequence as a complex power series.
fields:
  - control
  - signal-processing
assumptions:
  - nonempty region of convergence
canonical_examples:
  - One- or two-sided discrete-time sequences with a stated region of convergence. — One- or
    two-sided discrete-time sequences with a stated region of convergence.
sections:
  - campaign-cross-field-sweep-2026-09#z-transform
---

The Z-transform represents a discrete sequence as a complex power series.

## Mathematical skeleton

X(z)=Σ x[n]z^{-n} converts shifts and convolution into algebraic factors and products.

The claim is scoped to One- or two-sided discrete-time sequences with a stated region of convergence. Its stated validity regime is: The stated claim is limited to one- or two-sided discrete-time sequences with a stated region of convergence.

## Boundaries

- The algebraic expression alone does not determine the sequence without its convergence region.

Counterexamples and failure probes:

- The same rational function can encode causal or anticausal sequences.

## Adversarial review

**Challenge.** Boundary test: The algebraic expression alone does not determine the sequence without its convergence region.

**Response.** The proposition is restricted to one- or two-sided discrete-time sequences with a stated region of convergence, and the caveat remains explicit.
