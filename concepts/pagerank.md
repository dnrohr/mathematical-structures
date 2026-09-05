---
canonical_name: PageRank and web search ranking
node_type: application
status: established
summary: >
  Ranking pages by the stationary distribution of a random surfer on the
  link graph: importance defined as the fixed point of "important pages are
  linked from important pages", computed as an eigenvector, and governed by
  the spectral structure of the network.
fields: [networks, probability, ml]
aliases:
  - name: PageRank centrality (the eigenvector-centrality family)
    field: networks
  - name: random-surfer model / teleporting random walk
    field: probability
  - name: link analysis / graph-based ranking
    field: ml
canonical_examples:
  - "The random surfer: follow an outgoing link with probability α, teleport uniformly with probability 1 − α; rank is the stationary distribution"
  - "Power iteration converging geometrically because damping bounds the subdominant eigenvalue (|λ₂| ≤ α)"
  - Personalized PageRank seeding local cluster discovery around a query node
---

PageRank made "importance" computable at web scale by refusing to define
it directly: a page matters if pages that matter link to it. The circular
definition becomes honest mathematics as a fixed point, and the map keeps
this node because three structures do distinct, verifiable work in it.

**The chain does the defining.** The random-surfer model — follow a link
with probability $\alpha$, teleport anywhere with probability $1-\alpha$ —
is a [[markov-chains|Markov chain]] on the link graph, and rank is the
fraction of time the walk spends at each page. Teleportation is not a
hack: it makes the chain irreducible and aperiodic, so a unique positive
stationary distribution exists by Perron–Frobenius. The dangling-page and
spider-trap pathologies of the raw web graph are exactly the failure modes
of ergodicity, repaired by construction.

**The eigenproblem does the computing.** The stationary distribution is
the principal eigenvector of the Google matrix
$G = \alpha P + (1-\alpha)\tfrac{1}{n}\mathbf{1}\mathbf{1}^{\top}$ —
[[eigenvalues]] with eigenvalue exactly $1$. Damping also bounds the
subdominant eigenvalue ($|\lambda_2| \le \alpha$), so power iteration
converges geometrically at a rate the designer chooses: the original
$\alpha = 0.85$ buys convergence in tens of iterations on billions of
pages. Ranking quality and computational feasibility hang on the same
spectral gap.

**The spectral geometry says where rank concentrates.** A random walk on
a graph and the [[graph-laplacian]] tell one spectral story — conductance,
communities, bottlenecks — and that story explains ranking behavior:
rank pools inside low-conductance regions, and personalized PageRank
(teleport to a seed set instead of uniformly) turns the effect into an
algorithm, finding local clusters with Cheeger-type guarantees. The map
grades this edge strong-analogy rather than theorem on purpose: the exact
statements live on the walk–generator correspondence, not on PageRank
itself.

The same construction ranks far beyond the web — citation networks,
protein-interaction networks, recommendation graphs — anywhere the
question "which nodes matter, given only connection structure?" arises.
That recognition pattern is a symptom-index entry, with this page as its
worked example; the wider family of importance scores it belongs to is
eigenvector centrality, which is the networks dialect row above.
