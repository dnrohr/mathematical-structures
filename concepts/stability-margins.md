---
canonical_name: Gain and phase margins
node_type: dialect
status: established
summary: >
  Classical control's summary of distance to instability: how much loop
  gain, or how much additional phase lag, the closed loop can absorb before
  oscillation sets in — one field's answer to a question every field asks.
fields: [control, mechanics, biology]
aliases:
  - name: gain margin / phase margin / vector (modulus) margin
    field: control
  - name: distance to flutter / stability reserve
    field: mechanics
assumptions:
  - a linear (or linearized) loop with a meaningful frequency response
  - a defined loop-breaking point; multivariable loops need care (margins can mislead loop-by-loop)
canonical_examples:
  - Reading gain and phase margins off a Bode or Nyquist plot
  - A delay budget derived from phase margin at crossover
sections:
  - notebook-v0#21-feedback-robustness-and-loop-structure
  - notebook-v0#15-research-generator-layer-missing-translations
---

Classical gain margin asks how much loop gain can change before
instability; phase margin asks how much additional phase lag can be
tolerated. Both are read off the frequency response of a
[[feedback-control|feedback loop]] near the Nyquist critical point, and
both compress a robustness analysis into a single number a designer can
budget against — so much amplifier drift, so much unmodeled delay.

The map types this node as a *field dialect* deliberately: margins are
classical control's named formulation of a broader structural question —
**how far is this system from a qualitative change in
[[stability]]?** — that other clusters answer in their own vocabulary:
eigenvalue robustness and pseudospectra in state-space language, proximity
to a [[bifurcation]] in nonlinear dynamics, structured uncertainty and the
vector margin in robust control.

The margins' own assumptions mark where the dialect thins out: a
linearization regime, a defined input/output loop, and a
frequency-response reading that is cleanest for single loops. Where
nonlinearity or stochasticity dominates, the *question* survives even as
these particular numbers lose meaning — which was precisely the framing
of the map's research-gap candidate toward [[biological-regulation]]: not
"do biologists say 'phase margin'?" but "what plays the margins'
functional role in a regulatory loop, and when is the classical number
meaningful?" Run through the workflow (docs/research-gap-workflow.md),
that candidate resolved as an *established transfer*, not a missing one:
control-theoretic systems biology applies margin-style loop analysis
wherever its licensing assumptions are met, and hands the role to
generalized machinery (secant-type criteria for cyclic feedback) where
they are not — so the edge is now typed MIGRATED-TO, with the trail in
its notes.
