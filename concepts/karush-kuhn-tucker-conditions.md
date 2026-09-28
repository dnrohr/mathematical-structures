---
canonical_name: Karush-Kuhn-Tucker conditions
node_type: theorem
status: established
summary: Under a constraint qualification, KKT conditions are necessary for a constrained local
  optimum and are sufficient for global optimality in a convex problem.
fields:
  - numerical-analysis
  - optimization
aliases:
  - name: KKT
    field: numerical-analysis
assumptions:
  - constraint qualification for necessity
  - convexity for sufficiency
canonical_examples:
  - Smooth finite-dimensional constrained optimization. — Differentiable constrained programs;
    sufficiency additionally uses convexity.
sections:
  - campaign-broad-sweep-2026-09#karush-kuhn-tucker-conditions
---

Under a constraint qualification, KKT conditions are necessary for a constrained local optimum and are sufficient for global optimality in a convex problem.

## Mathematical skeleton

Stationarity, primal feasibility, dual feasibility, and complementary slackness.

The claim is scoped to Smooth finite-dimensional constrained optimization. Its stated validity regime is: Local necessity generally; global sufficiency in convex programs.

## Boundaries

- Without a qualification, a valid optimum can lack KKT multipliers.

Counterexamples and failure probes:

- Degenerate constraints violating all standard qualifications.

## Adversarial review

**Challenge.** KKT is routinely stated without the hypotheses separating necessity from sufficiency.

**Response.** Both constraint qualification and convexity roles are explicit.
