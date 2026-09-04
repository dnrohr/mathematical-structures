---
canonical_name: Continuity, smoothness, and their failure
node_type: principle
status: established
summary: >
  The regularity assumptions that license local reasoning — continuity,
  differentiability, smoothness, analyticity, Lipschitz control — and the
  replacement machinery (weak solutions, nonsmooth and hybrid methods) used
  where they break.
fields: [pde, optimization, control, mechanics]
aliases:
  - name: regularity / weak vs. classical solutions
    field: pde
  - name: nonsmooth analysis / subgradients
    field: optimization
  - name: hybrid / switched-system behavior
    field: control
assumptions:
  - none — this node *is* the ledger of assumptions other techniques borrow
canonical_examples:
  - Lipschitz conditions giving uniqueness and stability of ODE solutions
  - A shock forming in a conservation law, defeating the classical derivative
  - Subgradient descent minimizing a nonsmooth convex loss
sections:
  - notebook-v0#24-continuity-smoothness-and-when-local-reasoning-works
---

Continuity and smoothness are enabling assumptions behind much of the map.
[[series-expansion|Taylor expansion]], gradients, Jacobians, differential
equations, and [[linearization|local linearization]] all require some degree
of regularity. A useful map therefore records not only a technique but the
assumptions that license it — as explicit ASSUMES edges pointing here.

The ladder of regularity, each rung strictly stronger:

- **continuity** — nearby inputs produce nearby outputs
- **differentiability** — a local linear approximation exists
- **smoothness** — sufficiently many derivatives exist for higher-order
  local expansions
- **analyticity** — the function is locally represented by its convergent
  power series, a much stronger property than smoothness (and the rigidity
  that powers [[complex-analysis]])

Alongside the ladder rather than on it: **Lipschitz conditions**, a
quantitative bound on variation ($|f(x) - f(y)| \le L\,|x - y|$) that
neither implies differentiability ($|x|$ is Lipschitz) nor follows from it
(a derivative can exist yet be unbounded nearby). It is the hypothesis that
buys uniqueness and stability of ODE solutions.

## Failure modes are informative

Discontinuities, shocks, phase transitions, switching systems, dry
friction, impacts, and singular perturbations are interesting precisely
because familiar smooth tools become incomplete or fail there. The
replacement machinery is a positive body of knowledge, not an apology:

| Breakdown | Replacement machinery |
| --- | --- |
| shocks in conservation laws | weak solutions, jump (Rankine–Hugoniot) conditions |
| kinks in objectives | nonsmooth analysis, subgradients, proximal methods |
| switching, impacts, relays | hybrid-systems theory, differential inclusions |
| point sources, idealized impulses | distribution theory (which makes the Green's-function idea rigorous) |

Sharp transitions in *collective* systems — phase transitions — are a
different beast again: there the nonsmoothness emerges in a
[[large-number-limits|large-number limit]] and is studied through
[[renormalization]] rather than repaired away.
