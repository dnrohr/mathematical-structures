---
canonical_name: Interior-point method
node_type: operation
status: established
summary: Interior-point methods solve constrained convex optimization by following central solutions
  defined by barrier-perturbed optimality conditions.
fields:
  - numerical-analysis
  - optimization
assumptions:
  - convexity
  - feasible interior or suitable homogeneous embedding
canonical_examples:
  - Linear, conic, and smooth convex programming. — Convex programs satisfying the regularity
    conditions of the chosen primal-dual method.
sections:
  - campaign-broad-sweep-2026-09#interior-point-method
---

Interior-point methods solve constrained convex optimization by following central solutions defined by barrier-perturbed optimality conditions.

## Mathematical skeleton

Replace inequality constraints by a barrier or perturbed complementarity equations and drive the barrier parameter toward zero.

The claim is scoped to Linear, conic, and smooth convex programming. Its stated validity regime is: Iterates remain in the interior and approach primal-dual optimality.

## Boundaries

- Nonconvex variants lack the same global guarantees.

Counterexamples and failure probes:

- An infeasible problem without an embedding has no central path to an optimum.

## Adversarial review

**Challenge.** Interior-point is a family, not one update rule.

**Response.** The node is defined by central-path/barrier structure and records variants beneath it.
