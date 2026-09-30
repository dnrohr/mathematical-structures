---
canonical_name: Ill-posed problem
node_type: model
status: established
summary: An ill-posed inverse problem lacks existence, uniqueness, or stable dependence on data.
fields:
  - numerical-analysis
  - optimization
assumptions:
  - chosen solution and data norms
canonical_examples:
  - Linear inverse problems in finite discretizations or compact-operator limits. — Linear inverse
    problems in finite discretizations or compact-operator limits.
sections:
  - campaign-cross-field-sweep-2026-09#ill-posed-problem
---

An ill-posed inverse problem lacks existence, uniqueness, or stable dependence on data.

## Mathematical skeleton

Small singular values or nonclosed range cause small data perturbations to produce large solution changes.

The claim is scoped to Linear inverse problems in finite discretizations or compact-operator limits. Its stated validity regime is: The stated claim is limited to linear inverse problems in finite discretizations or compact-operator limits.

## Boundaries

- Finite matrices are formally continuous even when numerically ill-conditioned.

Counterexamples and failure probes:

- A well-conditioned orthogonal forward operator defines a well-posed inverse problem.

## Adversarial review

**Challenge.** Boundary test: Finite matrices are formally continuous even when numerically ill-conditioned.

**Response.** The proposition is restricted to linear inverse problems in finite discretizations or compact-operator limits, and the caveat remains explicit.
