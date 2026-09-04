---
canonical_name: Graphs and the graph Laplacian
node_type: object
status: established
summary: >
  Network structure as a spectral object: the Laplacian's zero mode counts
  components, its first nonzero eigenvalue measures how hard the graph is to
  cut, and its spectrum governs diffusion, mixing, clustering, and
  synchronization on the network.
fields: [networks, probability, ml, biology]
aliases:
  - name: algebraic connectivity / Fiedler value and vector
    field: networks
  - name: spectral clustering / graph embeddings
    field: ml
  - name: generator of the random walk (up to normalization)
    field: probability
assumptions:
  - a meaningful graph abstraction (nodes, weighted edges) of the underlying system
canonical_examples:
  - Zero-eigenvalue multiplicity counting connected components
  - The Fiedler vector exposing a natural bipartition
  - Consensus and synchronization rates set by the spectral gap
sections:
  - notebook-v0#12-eigenvalues-and-spectral-decomposition
---

The graph Laplacian turns network structure into a spectral object — graph
geometry without coordinates. For a graph with adjacency $A$ and degree
matrix $D$, the Laplacian $L = D - A$ acts on a node-indexed vector $f$ by

$$(L f)_i = \sum_{j \sim i} (f_i - f_j),$$

comparing each node's value with its neighbors — the discrete counterpart
of the $\nabla^2$ probe from [[vector-calculus]].

Its spectrum ([[eigenvalues]]) reads off structure directly. The zero
eigenvalue belongs to the constant mode, and its multiplicity counts
connected components. The first nonzero eigenvalue — algebraic
connectivity, the Fiedler value — measures how difficult the graph is to
separate, and its eigenvector can expose the natural partition: spectral
clustering is this observation industrialized.

Dynamics on the network run through the same operator. Graph
[[diffusion]] $\dot{f} = -Lf$ smooths signals along edges; its modes decay
at rates given by the Laplacian eigenvalues, so the spectral gap sets
mixing, consensus, and synchronization timescales — the network-science
incarnation of the same gap that governs [[markov-chains|Markov mixing]]
(the random walk's generator is the Laplacian, suitably normalized).

Because the abstraction is only nodes and weighted edges, the machinery
migrated freely from electrical and communication networks into
[[biological-regulation|biological regulation]], where graph and network
concepts are now common vocabulary (notebook §9) — one of the map's
best-established migrations.
