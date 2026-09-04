---
canonical_name: Series expansion and approximation
node_type: operation
status: established
summary: >
  Represent sufficiently smooth behavior near a point by successively
  higher-order local terms, and more broadly: replace a hard problem by a
  nearby solvable one plus controlled corrections — Taylor series,
  perturbation theory, and asymptotics are one family.
fields: [mechanics, pde, numerical-analysis, fluids]
aliases:
  - name: Taylor / power-series expansion
    field: numerical-analysis
  - name: perturbation theory / small-parameter expansion
    field: mechanics
  - name: asymptotic analysis / dominant balance
    field: fluids
assumptions:
  - smoothness
  - for perturbation methods, a small parameter and a solvable base case
  - for convergence claims, analyticity (asymptotic series may diverge yet still be useful)
canonical_examples:
  - "f(x₀+Δx) = f(x₀) + f′(x₀)Δx + ½f″(x₀)Δx² + … as the generic local model"
  - A quadratic potential minimum yielding harmonic motion
  - Boundary-layer analysis keeping only the dominant balance of terms
sections:
  - notebook-v0#3-first-node-series-expansion-and-approximation
---

Approximation is not merely a topic; it is a recurring mathematical move
that connects local linearization, harmonic oscillators, perturbation
theory, asymptotics, numerical methods, and changes of representation.

## Taylor expansion

$$f(x_0 + \Delta x) = f(x_0) + f'(x_0)\,\Delta x + \tfrac{1}{2} f''(x_0)\,\Delta x^2 + \cdots$$

Sufficiently smooth behavior near a point can be represented by successively
higher-order local terms. Truncating at first order is [[linearization]];
truncating a potential at second order near a stable equilibrium yields the
[[harmonic-oscillator]]. What the truncation is licensed by — and where it
breaks — is exactly the [[smoothness]] assumption, which the map records as
an explicit edge rather than fine print.

## Families of approximation

| Approximation | What it preserves / emphasizes |
| --- | --- |
| Taylor / polynomial | local behavior around a point |
| Perturbation theory | corrections around a nearby solvable system |
| Asymptotic analysis | dominant behavior in a limit |
| Fourier approximation | global decomposition into oscillatory modes |
| Wavelets | localized decomposition by position and scale |
| Numerical discretization | finite representation of continuous equations or fields |

The first three attack a problem *locally in parameter or variable*; the
Fourier and wavelet rows are global [[change-of-representation|changes of
representation]] and live with [[fourier-analysis]] and
[[integral-transforms]]; discretization trades the continuum for
computability.

## Perturbation and dominant balance

Perturbation theory expands around a solvable case in a small parameter —
which is why it pairs so naturally with [[nondimensionalization]]: rescaling
first makes the small parameter visible and dimensionless. Asymptotic
analysis keeps whichever terms dominate in a limit; a singular limit (the
small parameter multiplying the highest derivative) is the classic warning
that naive expansion fails and boundary layers or multiple scales are
needed.

## Where the chain goes next

The expansion move feeds the map's most-traveled chain:

> series expansion → linearization → Jacobian → eigenvalues → local stability

developed under [[linearization]], [[eigenvalues]], and [[stability]].
