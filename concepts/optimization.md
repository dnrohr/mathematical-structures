---
canonical_name: Optimization
node_type: operation
status: established
summary: >
  Characterize the desired object as an extremum of a scalar objective
  subject to constraints — converting problems into geometry on an
  objective landscape, with multipliers pricing the constraints.
fields: [optimization, statistics, ml, control, economics, mechanics]
aliases:
  - name: least squares / maximum likelihood fitting
    field: statistics
  - name: loss / risk minimization, gradient descent
    field: ml
  - name: optimal control / trajectory optimization
    field: control
  - name: utility maximization / shadow prices
    field: economics
assumptions:
  - a scalar objective actually encoding what "best" means
  - for gradient methods, differentiability (else subgradient/proximal machinery)
canonical_examples:
  - Least squares solved by the normal equations or SVD
  - Lagrange multipliers pricing a constraint at the optimum
  - Bellman recursion decomposing a sequential decision problem
sections:
  - notebook-v0#30-optimization-and-variational-principles
---

Optimization is both a field and a reusable mathematical move: characterize
the desired object as an extremum of a scalar objective subject to
constraints. This often converts a seemingly different problem into
geometry on an objective landscape — where [[vector-calculus|gradients]]
point the way and stationarity replaces solving.

| Problem dialect | Quantity extremized | Resulting machinery |
| --- | --- | --- |
| least squares / estimation | sum of squared residuals | normal equations, QR/SVD, statistical estimation |
| maximum likelihood | likelihood or log-likelihood | statistical inference and parameter fitting |
| mechanics | action | Euler–Lagrange equations, Hamiltonian mechanics |
| equilibrium physics | energy or free energy | stable states, phase equilibria |
| shortest path / planning | path cost | graph algorithms, calculus of variations |
| optimal control | trajectory and control cost | Pontryagin principle, HJB, dynamic programming |
| machine learning | loss / risk | gradient methods, stochastic optimization |

The mechanics and equilibrium-physics rows are the
[[variational-principles|variational tradition]] — the same
extremize-a-functional structure grown from physical principles rather
than engineering objectives; the map keeps the two nodes linked but
distinct because their emphases differ (stationarity and invariants
versus algorithms and minima).

## Constraints and Lagrange multipliers

A constrained optimum can often be found by introducing multipliers that
price constraint violation. This one idea reappears as reaction forces in
mechanics, shadow prices in economics, dual variables in convex
optimization, and adjoint variables in optimal control — field-specific
names obscuring a common constraint/duality structure that the dialect
table above is designed to expose.

## Dynamic programming and Bellman structure

Sequential decisions add time: dynamic programming exploits optimal
substructure — an optimal future policy must remain optimal after the
current decision. Discrete settings yield Bellman recursions; continuous
optimal control leads to the Hamilton–Jacobi–Bellman equation; shortest
paths, reinforcement learning, and [[kalman-filter|estimation duals]] in
control all run on the same recursion. Where the objective loses
[[smoothness]], subgradient and proximal methods take over — optimization
keeps its own replacement machinery in stock.

Statistical inference connects through more than least squares:
maximum-likelihood and maximum-[[shannon-entropy|entropy]] estimation are
optimization formulations of [[bayes-rule|inference]], and modern learning
is loss minimization at scale.
