---
canonical_name: Change the representation
node_type: move
status: established
summary: >
  The master move behind much of the map: rewrite the problem in coordinates
  where the important degrees of freedom separate — eigenbases, frequency
  domains, phase space, generating functions, dimensionless groups.
fields: [control, pde, signal-processing, statistics, ml]
aliases:
  - name: change of basis / change of coordinates
    field: control
  - name: transform methods / working in the transformed domain
    field: signal-processing
  - name: feature transformation / latent representation
    field: ml
canonical_examples:
  - time → frequency (Fourier transform)
  - correlated variables → principal components
  - dynamics → trajectory in phase space
sections:
  - notebook-v0#4-representation-as-a-possible-organizing-axis
  - notebook-v0#12-a-fifth-ontology-category-reusable-mathematical-moves
---

Many powerful techniques can be understood as changing representation so
that a difficult problem becomes simpler. The move is so pervasive that the
original notebook considered making "representation" a top-level axis of the
whole map; it is a first-class node instead, with the concrete
representation changes as its instances:

- time → frequency ([[fourier-analysis|Fourier transform]])
- signal → localized scale/frequency coefficients (wavelets)
- linear operator → eigenbasis / independent modes ([[eigenvalues]])
- correlated variables → principal components
- differential equation → transformed algebraic relation
  ([[integral-transforms|Laplace methods]])
- sequence → generating function
- dynamics → trajectory in [[phase-space]]
- raw dimensional variables → dimensionless groups
  ([[nondimensionalization]])

What all instances share: the system is untouched; only the coordinates
change, chosen so that the governing operation acts simply — diagonally,
algebraically, or sparsely — and the latent structure becomes explicit.
The cost side of the ledger is real too: a representation that simplifies
one operation usually complicates another (convolution is easy in
frequency; windowing is easy in time), so the move includes knowing when to
transform *back*.

[[symmetry|Symmetry]] is the deepest guide to choosing: the symmetries of a
problem select the representation in which it decouples — translation
symmetry selects Fourier modes, rotational symmetry selects spherical
harmonics. When no symmetry chooses for you, optimality can: PCA lets the
data's own covariance pick the basis.
