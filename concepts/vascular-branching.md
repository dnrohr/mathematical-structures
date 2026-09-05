---
canonical_name: Vascular branching and allometric scaling
node_type: application
status: established
summary: >
  Why vessel radii follow a cube law at branch points and metabolic rates a
  power law across body sizes: transport networks read as variational
  problems under conservation constraints, with similarity arguments
  licensing the cross-organism comparison — and honest strengths marking
  where the biology outruns the mathematics.
fields: [biology, fluids]
aliases:
  - name: allometry / metabolic scaling (Kleiber's law)
    field: biology
  - name: hemodynamics of branching networks
    field: fluids
canonical_examples:
  - "Murray's law: r₀³ = r₁³ + r₂³ at a bifurcation, from minimizing pumping power plus maintenance cost"
  - "Kleiber's law: basal metabolic rate scaling roughly as body mass to the 3/4 across many orders of magnitude"
  - Matched dimensionless groups (Reynolds, Womersley) deciding when flows in different organisms are comparable
sections:
  - notebook-v0#15-research-generator-layer-missing-translations
---

The vascular tree is a transport network built by evolution, and its
regularities — cube-law radii at branch points, power-law metabolic
scaling across species — are the map's test case for reading biology
through engineering mathematics *without overclaiming*. Every structure
below genuinely converges here; every strength is graded by what the
claim survives.

**Murray's law as a variational model.** Treat a bifurcation as a design
problem: pumping a viscous fluid costs power that falls steeply with
vessel radius, while maintaining blood and vessel tissue costs
metabolically in proportion to volume. Minimizing the sum — a
[[variational-principles|variational principle]] over the network — under
[[conservation-laws|volumetric flow conservation]] at the junction
predicts $r_0^3 = r_1^3 + r_2^3$ and the observed branching angles. The
conservation constraint is exact physics; the optimality claim is a model
of a messy evolved system, which is why the variational edge is graded
strong-analogy while the conservation edge holds at theorem strength.
Real vasculature scatters around the cube law — the interesting content
is that it scatters *around* it.

**Allometry as similarity reasoning.** Kleiber's law — metabolic rate
scaling near $M^{3/4}$ rather than the naive surface-to-volume $M^{2/3}$
— is the flagship of allometric scaling, and the network explanations
(space-filling, minimized-dissipation transport trees) are
[[dimensional-analysis|similarity arguments]] in biological dress: the
biology dialect row on that node is "allometric scaling arguments".
Dimensionless groups do the licensing work here exactly as in
engineering — Reynolds and Womersley numbers decide when a mouse aorta
and a whale aorta are the same flow problem at different scales. The
map grades the allometry edge strong-analogy: the derivations remain
contested in detail and measured exponents vary across taxa, so this is
an established organizing correspondence, not a theorem about organisms.

**The open question this page sharpens.** The research-gap layer records
a candidate migration from [[dimensional-analysis]] into
[[biological-regulation]]: whether *similarity-group* reasoning — matched
dimensionless regimes licensing comparison, as opposed to fitting power
laws — is used to structure cross-scale analysis of regulation. Vascular
scaling shows the pattern working for transport; whether it transfers to
regulatory dynamics is a workflow question under
docs/research-gap-workflow.md, deliberately left as a hypothesis rather
than promoted by this page.
