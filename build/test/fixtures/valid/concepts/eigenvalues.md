---
canonical_name: Eigenvalues and spectral decomposition
node_type: object
status: established
summary: >
  Which directions or modes are preserved by an operator except for a
  change of scale?
fields: [control, statistics, probability]
aliases:
  - name: poles
    field: control
  - name: principal components
    field: statistics
assumptions:
  - linearity
canonical_examples:
  - Transition-matrix eigenvalue 1 gives the stationary distribution
sections:
  - notebook-v0#12
---

An eigenvector $v$ of $A$ satisfies $A v = \lambda v$. For discrete dynamics,

$$x_{t+1} = A x_t$$

the eigenstructure controls growth and mixing — see [[markov-chains]] for the
probabilistic dialect, where the *spectral gap* governs relaxation.
