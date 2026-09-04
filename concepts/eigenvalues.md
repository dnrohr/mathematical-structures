---
canonical_name: Eigenvalues and spectral decomposition
node_type: operation
status: established
summary: >
  Which directions, patterns, or modes are preserved by an operator except
  for a change of scale? Diagonalization replaces a coupled transformation
  with independent scalar actions along those modes.
fields: [control, mechanics, probability, networks, statistics, quantum, pde]
aliases:
  - name: poles / modes / damping / dominant poles / spectral abscissa
    field: control
  - name: natural frequencies / mode shapes / modal analysis
    field: mechanics
  - name: stationary mode / spectral gap / mixing / relaxation
    field: probability
  - name: Laplacian spectrum / Fiedler value / algebraic connectivity
    field: networks
  - name: principal components / explained variance / singular values
    field: statistics
  - name: eigenstates / spectrum / stationary states
    field: quantum
  - name: eigenfunctions / normal modes / spectral methods
    field: pde
assumptions:
  - linearity
  - diagonalizability (else Jordan/defective cases)
canonical_examples:
  - Coupled oscillators decoupling into normal modes
  - Transition-matrix eigenvalue 1 giving the stationary distribution
  - The eigenvalue plane classifying growth, decay, and oscillation of linear dynamics
sections:
  - notebook-v0#12-eigenvalues-and-spectral-decomposition
  - notebook-v0#13-next-nodes-to-stress-test-the-framework
---

Eigenvalues are a high-connectivity node in the map because they answer a
recurring question: which directions, patterns, or modes are preserved by an
operator except for a change of scale? For a linear operator $A$, an
eigenvector $v$ satisfies $A v = \lambda v$. The vector retains its direction;
the eigenvalue $\lambda$ records the action of the operator along that mode.

## The reusable move: find the natural coordinates

A matrix may strongly mix the coordinates in which a problem was originally
stated. When it can be diagonalized, changing to an eigenvector basis replaces
a coupled transformation with independent scalar actions. This is one instance
of the project's central move — [[change-of-representation|change
representation]] until the important degrees of freedom separate:

> coupled coordinates → eigenbasis → independent modes

## Where the same structure reappears

| Field / setting | Operator / matrix | Meaning of eigenstructure |
| --- | --- | --- |
| Mechanical vibration | mass/stiffness dynamical system | normal modes and natural frequencies |
| Feedback control | state matrix / closed-loop dynamics | growth, decay, oscillation, local stability |
| Markov chains | transition matrix | stationary distribution, mixing rates, slow modes |
| Graphs / networks | adjacency or graph Laplacian | connectivity, communities, diffusion modes |
| PCA / statistics | covariance matrix | principal directions and explained variance |
| Quantum mechanics | Hamiltonian and observables | allowed measurement values; stationary energy states |
| PDEs | differential operators such as the Laplacian | spatial modes used to build solutions |
| Population / ecological models | linearized update or Jacobian | growth modes and stability near equilibria |

## Oscillation, growth, and decay

For a linear continuous-time system $\dot{x} = A x$, eigenmodes evolve
independently as $e^{\lambda t}$. The real part of $\lambda$ determines growth
or decay; the imaginary part determines oscillation. This makes the eigenvalue
plane a compressed qualitative map of dynamics, and it is the bridge from
[[linearization]] to [[stability]]:

- $\mathrm{Re}(\lambda) < 0$ → decay toward equilibrium
- $\mathrm{Re}(\lambda) > 0$ → exponential growth / instability
- $\mathrm{Im}(\lambda) \neq 0$ → oscillatory behavior
- eigenvalues near the imaginary axis → slow decay and proximity to instability

## Normal modes and the harmonic oscillator

A many-degree-of-freedom vibrating system can often be decomposed into normal
modes. Each normal mode behaves like an independent [[harmonic-oscillator]].
The connection is not merely "eigenvalues are used in vibration analysis":
spectral decomposition converts a coupled oscillator network into a collection
of canonical one-dimensional oscillators.

> coupled mechanical system → generalized eigenproblem → normal modes →
> independent harmonic oscillators

## Markov chains: eigenvalues acquire a probabilistic dialect

For a finite Markov chain, the transition matrix has a distinguished
eigenvalue $1$. Under standard ergodicity conditions, its associated
stationary mode persists while other modes decay. The magnitude of the
subdominant eigenvalues controls how quickly memory of the initial state
disappears. The resulting language is mixing time, spectral gap, relaxation
time, and stationary distribution rather than poles, damping, or modal
decay — even though the mathematical skeleton is closely related. See
[[markov-chains]].

## Graphs: geometry without coordinates

The [[graph-laplacian]] turns network structure into a spectral object. Its
zero eigenvalue represents the constant mode; the multiplicity of zero counts
connected components. The first nonzero Laplacian eigenvalue — often called
algebraic connectivity or the Fiedler value — measures how difficult it is to
separate the graph, and its eigenvector can expose a natural partition. This
connects eigenvalues to diffusion, random walks, clustering, synchronization,
and network robustness.

## PCA and SVD: spectral ideas as data geometry

Principal component analysis diagonalizes a covariance structure: the
eigenvectors give orthogonal directions of variation and the eigenvalues give
variance along them. Singular value decomposition generalizes the same
decomposition logic to rectangular matrices. The field-specific vocabulary —
principal components, singular vectors, latent directions, rank reduction —
can obscure that these are close relatives of modal analysis.

## PDEs and separation into spatial modes

For equations such as [[diffusion]] and wave propagation, eigenfunctions of
spatial differential operators play the role that eigenvectors play for
matrices. Boundary conditions select the allowed modes; time evolution then
acts separately on each mode. [[fourier-analysis|Fourier series]] are a
special and exceptionally important example of this spectral strategy.

## Spectral gap as a translation candidate

One particularly useful cross-field bridge is the spectral gap: the separation
between a distinguished eigenvalue or set of eigenvalues and the rest of the
spectrum. Depending on the field, a gap can govern mixing time, relaxation,
adiabatic behavior, convergence, robustness, or separation of slow and fast
modes. The precise definition changes with the operator, but "how isolated is
the important mode?" is a recurring structural question.

## Poles are eigenvalues only under assumptions

In control language the natural response modes are pole locations of a
transfer function. Poles of a rational transfer function coincide with
eigenvalues of a state matrix only for a minimal realization (no hidden
cancellations); the caveat is recorded on the edge to
[[complex-analysis|poles and residues]] rather than silently identified.
