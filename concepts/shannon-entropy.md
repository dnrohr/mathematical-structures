---
canonical_name: Shannon entropy and information
node_type: object
status: established
summary: >
  H = −Σ p log p as expected information content: uncertainty of a source,
  cost of coding, and the common currency of KL divergence, cross-entropy,
  entropy rate, and maximum-entropy inference.
fields: [information-theory, statistics, ml, probability]
aliases:
  - name: expected surprisal / source entropy / entropy rate
    field: information-theory
  - name: cross-entropy loss / KL regularization
    field: ml
  - name: relative entropy / KL divergence
    field: statistics
assumptions:
  - a probability model for the source or belief being measured
canonical_examples:
  - "H(p) = −Σ pᵢ log pᵢ bounding lossless code length (source coding)"
  - "KL(p‖q) = Σ p log(p/q) as directed discrepancy between distributions"
  - Maximum-entropy choice of a distribution under moment constraints
sections:
  - notebook-v0#31-entropy-and-information-same-formula-related-ideas-and-false-friends
---

Shannon entropy measures the uncertainty of a probability distribution —
equivalently, the expected information content of a sample from it:

$$H(p) = -\sum_i p_i \log p_i.$$

Around this one functional sits a small family the map treats as a single
information-theoretic node with dialects rather than separate concepts:
**relative entropy / KL divergence** $\sum_i p_i \log (p_i/q_i)$ as the
directed discrepancy between distributions (information lost using $q$ for
$p$); **cross-entropy** $-\sum_i p_i \log q_i = H(p) + \mathrm{KL}(p\|q)$
as coding cost and the workhorse loss of machine learning; and **entropy
rate**, entropy produced per symbol or time step of a
[[markov-chains|random process]].

## Maximum entropy as inference

Given constraints but incomplete knowledge, maximum-entropy methods choose
the distribution with greatest entropy among those satisfying the
constraints — a bridge from information theory to statistical mechanics
and to [[bayes-rule|Bayesian modeling]], best used with its assumptions
stated rather than as a universal physical law. Formally it is an
[[optimization]] problem whose multipliers become the natural parameters
of exponential families.

## The false-friends ledger

The word "entropy" spans several fields, and the map's job is to encode
the *strength* of each relationship rather than joining every node so
labeled (original notebook §31):

- Gibbs ensemble entropy is Shannon's functional applied to ensemble
  probabilities — identical mathematics — but its identification with the
  *thermodynamic state function* is a physical claim holding under
  equilibrium assumptions; the edge to
  [[thermodynamic-entropy]] carries that caveat explicitly.
- The Kolmogorov–Sinai entropy of dynamical systems measures information
  *production* by deterministic [[chaos]] — entropy-flavored, but a
  different object with a measure-theoretic definition of its own.

Same formula is not same concept; the typed edges say which is which.
