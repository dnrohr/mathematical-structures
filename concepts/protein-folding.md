---
canonical_name: Protein folding and structure prediction
node_type: application
status: established
summary: >
  How a one-dimensional sequence finds its three-dimensional structure —
  the biological problem where energy-landscape thermodynamics, global
  optimization, and Markov models of kinetics converge on the same
  molecule.
fields: [biology, thermodynamics, optimization]
aliases:
  - name: the protein folding problem / structure prediction
    field: biology
  - name: energy-landscape theory / the folding funnel
    field: thermodynamics
  - name: conformational search / energy minimization
    field: optimization
canonical_examples:
  - "Anfinsen's ribonuclease refolding spontaneously after denaturation — the demonstration that sequence determines structure"
  - "A Markov state model built from thousands of short simulations recovering folding rates and pathways no single trajectory could reach"
  - "Fragment-assembly structure prediction searching an energy landscape it could never enumerate"
---

Protein folding is one problem wearing three mathematical costumes, and
the field's history is the order in which it put them on: a
thermodynamic claim about where folding ends, a landscape geometry
explaining how it can end there quickly, and a kinetic model of the
route.

**The thermodynamic hypothesis.** Anfinsen's experiments made folding an
[[optimization]] problem: the native state is the free-energy minimum of
the sequence in its environment, so predicting structure means searching
an energy landscape — fragment assembly, side-chain packing, and
refinement are global optimization in production. The map keeps this at
analogy strength deliberately: kinetically trapped folds and
intrinsically disordered proteins sit outside the hypothesis, and
Levinthal's paradox says the molecule itself is not doing exhaustive
search — which is precisely what the landscape's shape must explain.

**The funnel.** The resolution is [[thermodynamic-entropy|entropy]] made
geometric. Folding trades chain entropy for contact energy, and for
evolved sequences the two slope together — the principle of minimal
frustration — so the landscape is a funnel rather than a golf course:
many high-entropy routes drain toward one low-energy basin, and the
molecule folds in milliseconds because almost every downhill step is
also energetically right. Frustrated sequences, by contrast, produce
rugged landscapes, traps, and glassy kinetics; the funnel picture is
ensemble-level statistical mechanics, not a per-protein theorem, and the
map's strength grading says so.

**Kinetics as a Markov model.** Modern simulation reads folding through
a [[hidden-markov-model|Markov state model]]: cluster the conformations
visited by many short trajectories into metastable states, estimate
transition probabilities at a lag time, and read rates and pathways off
the transition matrix's spectrum — the slowest relaxation is the folding
process itself, an [[eigenvalues|eigenvalue]] story inherited from
[[markov-chains|Markov chains]]. Markovianity after coarse-graining is
an approximation checked per system (implied-timescale tests), and the
hidden-Markov refinement exists exactly because state discretization is
imperfect: the observed features are treated as emissions of an
underlying Markov process.

Learned predictors changed the economics of the field — structure
prediction at proteome scale without simulating physics — but not its
mathematics: what they predict is the landscape's minimum, the object
Anfinsen defined, and folding kinetics, stability, and design still run
through the structures above.
