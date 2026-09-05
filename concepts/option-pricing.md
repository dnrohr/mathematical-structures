---
canonical_name: Option pricing and hedging
node_type: application
status: established
summary: >
  Pricing contingent claims and hedging them — the domain problem where
  diffusion machinery imported whole from physics, backward induction on a
  risk-neutral Markov lattice, and the central limit theorem converge on
  the models derivative desks quote with.
fields: [economics, probability, statistics]
aliases:
  - name: no-arbitrage pricing / Black–Scholes–Merton
    field: economics
  - name: risk-neutral measure / martingale pricing
    field: probability
  - name: implied volatility — calibration and the smile
    field: statistics
canonical_examples:
  - "Black–Scholes: the pricing PDE transforms exactly to the heat equation, and the option value diffuses backward from the payoff"
  - "A Cox–Ross–Rubinstein binomial tree pricing an American put by backward induction, with early exercise checked at every node"
  - "Monte-Carlo pricing of a path-dependent option, its accuracy carried as CLT-width error bars"
---

Option pricing is the map's cleanest worked example of machinery
*migrating* between fields rather than being reinvented: the mathematics
of heat and Brownian motion moved into finance essentially intact, and
the field's own edifice — no-arbitrage arguments, the risk-neutral
measure — was built to justify running it there. The atlas types the
transfer as a transfer, with the model's market-facing caveats kept
separate from its internal theorems.

**The import is diffusion, whole.** Bachelier priced options with the
random-walk-to-diffusion machinery in 1900, five years before Einstein's
Brownian-motion paper; Black, Scholes, and Merton rebuilt the argument on
geometric Brownian motion with the hedge that removes the drift. The
Black–Scholes PDE is the [[diffusion]] equation in light disguise — an
exact change of variables maps one onto the other — so option values
*diffuse*: the payoff plays the role of an initial temperature profile
and the price today is its smoothed image. This is the wave's first
MIGRATED-TO claim: theorem-grade for the transformation and the model's
internal mathematics, while the model's fit to markets (constant
volatility, continuous frictionless hedging) is where the known failures
live — the volatility smile is the market pricing the model's misfit.

**Lattices make the model a Markov chain.** The Cox–Ross–Rubinstein tree
prices by making the price process an explicit
[[markov-chains|Markov chain]] under the risk-neutral measure: up and
down moves with probabilities chosen so discounted prices are
martingales, then backward induction — iterated conditional expectation —
rolls value from payoff to present. The chain view is not merely
numerics: early exercise (American options) becomes a comparison at every
node between continuation value and immediate payoff, which is exactly
the stagewise structure Markov models license.

**Convergence is the central limit theorem.** Why does the tree agree
with the PDE? Because the scaled sum of binomial log-price moves
converges to the lognormal — the [[large-number-limits|central-limit
phenomenon]], upgraded to path space by Donsker's theorem, carrying the
lattice to the diffusion. The same family runs the other production
method: Monte-Carlo pricing is the law of large numbers with CLT-width
error bars, which is why a desk can state not just a price but the
sampling accuracy of the price.

**What stays out.** Itô calculus and the martingale formalism are
techniques — the page uses their conclusions without minting nodes — and
the risk-neutral measure is a change of probability internal to the
model, not a claim about real-world frequencies; confusing the two is the
field's own standard false friend. The seam with
[[resource-allocation]] is deliberate: that page keeps static allocation
(Markowitz portfolios are constrained optimization), while this one owns
claims whose value depends on a *path* of prices and the hedging of them
through time.

The recognition pattern is the backward-from-the-boundary shape: a value
fixed at a terminal condition, diffused backward to today — the same
computation whether the boundary is an option payoff, a terminal cost in
optimal control, or a temperature at a late time. Where a problem hands
you its end state, the pricing machinery is the map's pointer for how to
walk it home.
