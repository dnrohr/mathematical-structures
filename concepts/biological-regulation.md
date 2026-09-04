---
canonical_name: Biological regulation
node_type: application
status: established
summary: >
  Homeostasis, chemotaxis, gene regulation, and signaling as feedback and
  network problems: the domain where control and network machinery has
  migrated deepest into biology — and the target of the map's open
  research-gap questions about what has not yet transferred.
fields: [biology, control, networks]
aliases:
  - name: homeostasis / adaptation / robustness of regulation
    field: biology
  - name: regulatory networks / network motifs
    field: networks
canonical_examples:
  - Integral feedback explaining perfect adaptation in bacterial chemotaxis
  - Robustness analysis of the segment-polarity network to parameter variation
  - Feedback inhibition holding a metabolite near its set point
sections:
  - notebook-v0#9-migration-between-fields-and-untransferred-machinery
  - notebook-v0#21-feedback-robustness-and-loop-structure
  - notebook-v0#15-research-generator-layer-missing-translations
---

Biological regulation is the map's best-documented case of machinery
migrating between fields — and its richest source of questions about what
*hasn't* migrated yet.

**What transferred, and stuck.** Robustness, feedback, and sensitivity
concepts moved from control theory into systems biology so thoroughly that
biology often retains the control vocabulary outright: homeostasis is
analyzed as disturbance rejection, perfect adaptation in chemotaxis was
traced to integral [[feedback-control|feedback]], and network motifs are
read as reusable control architectures. Graph and network concepts made
the same journey from electrical and communication networks — regulatory
and signaling systems are routinely studied through
[[graph-laplacian|network structure]], and steady states of regulatory
models through [[linearization]] and [[stability]] analysis, with
oscillation onset as a [[bifurcation]] (delay-induced oscillation in
regulatory loops is the Hopf story in biological dress).

**What is genuinely open.** The quantitative robustness layer of classical
and modern control — [[stability-margins|gain and phase margins]],
loop-shaping and sensitivity functions, observability-based experiment and
sensor design from the [[state-space-model|state-space tradition]],
modal participation factors from [[eigenvalues|modal analysis]],
structured-uncertainty descriptions, and the
[[dimensional-analysis|dimensionless similarity groups]] that organize
cross-scale comparison in engineering — appears structurally applicable
but is rarely used, differently formulated, or of unverified relevance in
biological settings. Each of these is recorded as a
POSSIBLE-MISSING-MIGRATION edge with a workflow status, treated per
docs/research-gap-workflow.md as a question to investigate: absence of the
*vocabulary* is not absence of the *machinery*, and a failed transfer
(some assumption genuinely breaks — linearity, stationarity, known model
structure) is as valuable a result as a successful one.
