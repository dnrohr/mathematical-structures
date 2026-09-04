---
canonical_name: Thermodynamic and statistical entropy
node_type: object
status: established
summary: >
  The macroscopic state function S of thermodynamics and its
  statistical-mechanical reading: Gibbs' −k Σ p log p over ensemble
  probabilities. Irreversibility connects the two through coarse-graining —
  carefully, not by word-match with information entropy.
fields: [thermodynamics, probability, biology]
aliases:
  - name: Gibbs / Boltzmann entropy, S = k log W
    field: thermodynamics
  - name: entropy production / dissipation accounting
    field: biology
canonical_examples:
  - Clausius' dS ≥ δQ/T defining the state function macroscopically
  - "Boltzmann's S = k log W counting microstates of a macrostate"
  - Free-energy minimization deciding equilibrium states
sections:
  - notebook-v0#31-entropy-and-information-same-formula-related-ideas-and-false-friends
---

Thermodynamic entropy enters twice, and the map keeps the two readings
distinguishable. Macroscopically, $S$ is a state function of classical
thermodynamics — defined through heat and temperature, governing which
transformations are possible and what equilibrium looks like.
Statistically, Gibbs entropy $-k \sum_i p_i \ln p_i$ (with Boltzmann's
$S = k \log W$ as the equal-probability case) applies the same functional
as [[shannon-entropy|Shannon's]] to ensemble probabilities.

The identity of *formula* is exact; the identity of *concept* is a
physical claim with conditions. Identifying Gibbs entropy with the
thermodynamic state function relies on equilibrium ensembles and the
statistical-mechanical bridge; treating every use of "entropy" as one idea
is the false-friend trap the original notebook flags (§31). The edges in
this cluster carry strengths and caveats for exactly that reason.

## Irreversibility and coarse-graining

A central conceptual junction is the relation between reversible
microscopic dynamics and macroscopic entropy increase. Different accounts
weigh [[renormalization|coarse-graining]], typicality, mixing (where
deterministic [[chaos]] supplies the mechanism), inaccessible
correlations, and boundary conditions. What coarse-graining discards is
information about microstates; the entropy balance records the loss —
which is the honest, conditional version of "entropy is ignorance". The
emergence of macroscopic one-way behavior from many-body randomness is a
[[large-number-limits|large-number phenomenon]]: fluctuations against the
gradient exist and become astronomically rare with size.

## Equilibrium as optimization

Equilibrium statistical mechanics is a [[variational-principles|variational
structure]]: maximize entropy at fixed energy, or minimize free energy at
fixed temperature. That is also where this node touches maximum-entropy
inference — same [[optimization]] form, but the physical version makes
claims about matter, not merely about beliefs, and earns them with
equilibrium assumptions.

[[markov-chains|Markov models]] with detailed balance are the standard
microscopic toy in which all of this is computable: stationary
distributions, entropy production, and relaxation to equilibrium in one
tractable setting.
