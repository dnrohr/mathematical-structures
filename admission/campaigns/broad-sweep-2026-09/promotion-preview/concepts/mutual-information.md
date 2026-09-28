---
canonical_name: Mutual information
node_type: object
status: established
summary: Mutual information is an entropy-derived measure of statistical dependence equal to the
  relative entropy between the joint law and the product of marginals.
fields:
  - information-theory
  - probability
assumptions:
  - well-defined entropies or relative entropy
canonical_examples:
  - Shannon information theory. — Discrete variables, or continuous variables when the relevant
    divergences exist.
sections:
  - campaign-broad-sweep-2026-09#mutual-information
---

Mutual information is an entropy-derived measure of statistical dependence equal to the relative entropy between the joint law and the product of marginals.

## Mathematical skeleton

I(X;Y) equals H(X) plus H(Y) minus H(X,Y), and equals D(pXY parallel pX pY).

The claim is scoped to Shannon information theory. Its stated validity regime is: Finite discrete alphabets without extra measure-theoretic qualifications.

## Boundaries

- Differential-entropy terms may be coordinate-dependent even when mutual information is invariant.

Counterexamples and failure probes:

- Zero covariance does not imply zero mutual information outside Gaussian families.

## Adversarial review

**Challenge.** Mutual information is sometimes reduced to linear correlation.

**Response.** The KL definition captures arbitrary statistical dependence.
