---
canonical_name: Profit maximization and resource allocation
node_type: application
status: established
summary: >
  Allocating scarce inputs across competing uses — production plans, diets,
  portfolios: the economic problem where constrained optimization and
  gradient (marginal) reasoning converge, with duality pricing every
  binding constraint as a shadow value.
fields: [economics, optimization]
aliases:
  - name: profit / utility maximization; shadow prices as marginal values
    field: economics
  - name: linear programming / activity analysis
    field: optimization
canonical_examples:
  - "A production plan chosen by linear programming, its dual prices valuing each scarce input"
  - "\"Marginal cost equals marginal revenue\" as a first-order stationarity condition"
  - "The diet problem: the cheapest nutrient-feasible diet, the classic allocation LP"
sections:
  - notebook-v0#30-optimization-and-variational-principles
---

Resource allocation is the economic shape of constrained optimization:
scarce inputs, competing uses, a scalar objective saying what "best"
means. The map keeps it as an application because two structures do
independent work in it, and because the field's own vocabulary — margins,
shadow prices — is a dialect of that mathematics rather than a separate
subject.

**Optimization, with prices attached.** A firm's production plan, a
feasible diet, a portfolio under a budget: each is a constrained program,
and for the linear and convex cases the theory is complete —
[[optimization]] supplies existence, the KKT characterization of optima,
and algorithms from simplex to interior-point that solve allocation at
industrial scale. What economics adds is an interpretation the
mathematics was always making: the Lagrange multiplier on a binding
constraint *is* the shadow price — the marginal value of one more unit of
the scarce resource — the same multiplier structure that appears as
reaction forces in mechanics and adjoint variables in control, as the
optimization node's dialect table lays out.

**Marginal reasoning is gradient reasoning.** The verbal economics of
margins is [[vector-calculus]] in translation. "Marginal cost equals
marginal revenue" is a first-order condition $\nabla \pi = 0$ read one
coordinate at a time; equalizing marginal product per dollar across
inputs is the gradient condition for a constrained optimum; and the
envelope theorem — the derivative of the optimal value with respect to a
constraint level equals the multiplier — is what makes shadow prices
well-defined marginal quantities rather than a metaphor.

The reach extends past the single decision-maker. Welfare economics
rests on the same skeleton: under convexity, equilibrium prices
decentralize an efficient allocation — prices are the dual variables of
society's allocation problem, discovered rather than computed. And the
skeleton itself is the map's extremize-a-functional chain: the same
structure runs from [[variational-principles|least action]] through
objective functionals to loss minimization, with this page as the
economic end of the chain.
