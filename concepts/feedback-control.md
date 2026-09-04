---
canonical_name: Feedback and loop structure
node_type: model
status: established
summary: >
  Measure the consequences of an action and feed them back into subsequent
  action. Negative feedback can reject disturbances and reduce sensitivity,
  but it buys this by introducing dynamical stability constraints of its own.
fields: [control, biology, mechanics, economics]
aliases:
  - name: closed-loop control / regulation / loop shaping
    field: control
  - name: homeostasis / perfect adaptation / regulatory feedback
    field: biology
  - name: negative feedback stabilization (governors, thermostats)
    field: mechanics
assumptions:
  - a measurable output causally coupled back to the input
  - for classical loop analysis, an operating regime where linearization is meaningful
canonical_examples:
  - A thermostat rejecting heat disturbances
  - Integral feedback producing perfect adaptation in bacterial chemotaxis
  - Loop shaping trading disturbance rejection against noise amplification
sections:
  - notebook-v0#21-feedback-robustness-and-loop-structure
  - notebook-v0#9-migration-between-fields-and-untransferred-machinery
---

Feedback deserves both a canonical-model entry and a place among the reusable
moves. The central operation is to measure consequences of an action and feed
them back into subsequent action. Negative feedback can reject disturbances
and reduce sensitivity, but it also introduces dynamical stability
constraints — a loop can oscillate or diverge precisely because it reacts to
itself.

## Two complementary representations

| View | Natural objects | Questions it makes easy |
| --- | --- | --- |
| [[state-space-model\|state space]] | state vector, A/B/C/D matrices, eigenvalues | internal modes, controllability, observability, multivariable dynamics |
| frequency / loop space ([[integral-transforms\|Laplace domain]]) | transfer functions, poles/zeros, gain and phase | bandwidth, disturbance rejection, stability margins, loop shaping |

Moving between them is a standard instance of
[[change-of-representation]]: the loop's [[eigenvalues]] and its
transfer-function poles describe the same modes under minimal realizations.

## Sensitivity as a universal feedback quantity

For a simple feedback loop with loop gain $L$, the sensitivity function

$$S = \frac{1}{1+L}$$

quantifies how disturbances and model errors are transmitted; the
complementary sensitivity $T = L/(1+L)$ captures a related tradeoff, and
$S + T = 1$ makes the conservation explicit. This formalizes a recurring
principle: feedback can suppress sensitivity in one regime only by
redistributing it elsewhere. Loop-shaping design is the craft of choosing
where the sensitivity goes.

## Distance to instability

Classical [[stability-margins|gain and phase margins]] summarize how far the
closed loop sits from a qualitative change in [[stability]] — how much gain
or phase lag the loop can absorb before oscillation sets in. That broader
question ("how far is this system from losing stability?") connects
naturally to eigenvalue robustness, [[bifurcation]] proximity, structured
uncertainty descriptions, and potentially biological regulation.

## Biological translation questions

Feedback vocabulary migrated into systems biology early and deeply — this is
the map's best-documented [[biological-regulation|migration]]. The open
questions are the quantitative layers on top:

- Homeostasis ↔ regulation / disturbance rejection.
- Integral feedback ↔ perfect adaptation in biochemical networks.
- Network motifs ↔ reusable control architectures.
- Delay and phase lag ↔ oscillation or instability in regulatory loops.
- Parameter robustness ↔ gain/phase margins, structured singular value, or
  nonlinear stability margins.
- Experimental perturbations ↔ system identification and observability.

Each of the unverified rows is recorded as an explicit research-gap edge with
a workflow status, not as a claim.
