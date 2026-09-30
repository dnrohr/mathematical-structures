---
canonical_name: Poisson process
node_type: model
status: established
summary: A Poisson process models independent events arriving at a constant rate.
fields:
  - probability
  - statistics
assumptions:
  - constant rate
  - independent increments
canonical_examples:
  - Homogeneous point processes on the nonnegative time line. — Homogeneous point processes on the
    nonnegative time line.
sections:
  - campaign-cross-field-sweep-2026-09#poisson-process
---

A Poisson process models independent events arriving at a constant rate.

## Mathematical skeleton

Counts have Poisson increments and exponential waiting times with the memoryless property.

The claim is scoped to Homogeneous point processes on the nonnegative time line. Its stated validity regime is: The stated claim is limited to homogeneous point processes on the nonnegative time line.

## Boundaries

- Overdispersion or history dependence violates the homogeneous Poisson model.

Counterexamples and failure probes:

- A self-exciting event stream has clustered arrivals rather than independent increments.

## Adversarial review

**Challenge.** Boundary test: Overdispersion or history dependence violates the homogeneous Poisson model.

**Response.** The proposition is restricted to homogeneous point processes on the nonnegative time line, and the caveat remains explicit.
