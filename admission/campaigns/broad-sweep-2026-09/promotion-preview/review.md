# Broad sweep promotion review

This packet contains the 40 dossiers selected for human review. All are recorded as accepted in their authoritative normalized dossiers and the generated content passes the ordinary trusted validator.

- Reviewer: repository-owner
- Review started: not reported
- Review completed: 2026-09-28
- Active review minutes: 0

## Attractors `attractors`

- Proposed disposition: `propose-node`
- Proposed node type: `phenomenon`
- Proposed edge: `stability —GOVERNS→ attractors` (`theorem`)
- Source: `khalil-nonlinear-systems-2014`, Chapter 4, §4.1, pp. 112–126; Chapter 8, §8.2, pp. 312–321.
- Proposition: A locally asymptotically stable equilibrium is a local attractor because trajectories from a neighborhood converge to it.
- Mathematical skeleton: Distance to the invariant set tends to zero along trajectories begun in its basin.
- Scope: Local equilibrium attractors in finite-dimensional autonomous dynamical systems.
- Validity regime: Initial states in the basin of attraction.
- Assumptions:
  - forward completeness in the neighborhood
  - locally asymptotically stable equilibrium
- Caveats:
  - An invariant set need not attract, and an attractor need not be a fixed point.
- Counterexamples:
  - A Lyapunov-stable center is not attracting.
- Adversarial challenge: The term attractor has inequivalent topological and measure-theoretic definitions.
- Response: The claim is restricted to the local asymptotically stable invariant-set definition.

Decision: [x] accept  [ ] revise  [ ] defer  [ ] reject

## B-series `b-series`

- Proposed disposition: `propose-node`
- Proposed node type: `object`
- Proposed edge: `b-series —IS-A→ series-expansion` (`special-case`)
- Source: `hairer-lubich-wanner-2006`, Chapter III, §§III.1–III.2, pp. 51–74.
- Proposition: A B-series is a rooted-tree-indexed formal series expansion used to represent Runge-Kutta flows and their compositions.
- Mathematical skeleton: Coefficients are indexed by rooted trees whose elementary differentials encode derivative compositions.
- Scope: Formal local expansions for sufficiently smooth autonomous ODEs.
- Validity regime: Formal order analysis and convergent regimes where the series is controlled.
- Assumptions:
  - sufficient derivatives of the vector field
- Caveats:
  - Not every geometric integrator is representable by an ordinary B-series.
- Counterexamples:
  - Aromatic series require graph structures beyond rooted trees.
- Adversarial challenge: The label can refer to a formal algebra, a method expansion, or the exact flow.
- Response: The node encompasses the rooted-tree formalism and distinguishes those uses in scope notes.

Decision: [x] accept  [ ] revise  [ ] defer  [ ] reject

## Backward error analysis `backward-error-analysis`

- Proposed disposition: `propose-node`
- Proposed node type: `move`
- Proposed edge: `backward-error-analysis —ASSUMES→ smoothness` (`theorem`)
- Source: `hairer-lubich-wanner-2006`, Chapter IX, §§IX.1–IX.3, pp. 337–366.
- Proposition: At any fixed truncation order, backward error analysis constructs a nearby modified differential equation whose exact flow matches the numerical one-step map up to a controlled defect.
- Mathematical skeleton: Choose finitely many modified-vector-field coefficients so the truncated modified flow matches the numerical one-step map through the claimed order.
- Scope: One-step integrators for smooth ODEs.
- Validity regime: Finite truncation, or exponentially long regimes under analyticity hypotheses.
- Assumptions:
  - smooth or analytic vector field
  - sufficiently small step size
- Caveats:
  - The full modified series commonly diverges and is used asymptotically.
- Counterexamples:
  - Nonsmooth dynamics where the required derivatives do not exist.
- Adversarial challenge: Calling the numerical solution exact may hide truncation and divergence.
- Response: The claim says nearby truncated modified equation and states the asymptotic limitation.

Decision: [x] accept  [ ] revise  [ ] defer  [ ] reject

## Bayesian network `bayesian-network`

- Proposed disposition: `propose-node`
- Proposed node type: `model`
- Proposed edge: `bayes-rule —APPLIED-IN→ bayesian-network` (`theorem`)
- Source: `koller-friedman-2009`, Chapter 3, §3.2, pp. 51–67.
- Proposition: A Bayesian network factorizes a joint distribution according to a directed acyclic graph and applies Bayes rule for probabilistic inference.
- Mathematical skeleton: p(x_1,...,x_n) equals the product over nodes of p(x_i given its parents).
- Scope: Discrete or continuous Bayesian networks with well-defined conditional densities.
- Validity regime: Distributions Markov with respect to the graph.
- Assumptions:
  - directed acyclic graph
  - local Markov property
- Caveats:
  - The graph alone does not imply causal semantics.
- Counterexamples:
  - A directed cyclic model is not a Bayesian network under this definition.
- Adversarial challenge: Directed edges are often misread as causal claims.
- Response: The proposition is purely probabilistic; causality is an additional interpretation.

Decision: [x] accept  [ ] revise  [ ] defer  [ ] reject

## Belief propagation `belief-propagation`

- Proposed disposition: `propose-node`
- Proposed node type: `operation`
- Proposed edge: `hidden-markov-model —SOLVED-BY→ belief-propagation` (`theorem`)
- Source: `koller-friedman-2009`, Chapter 10, §§10.2–10.3, pp. 345–364.
- Proposition: Sum-product belief propagation computes exact marginals on tree-structured factor graphs, including chain-structured hidden Markov models.
- Mathematical skeleton: Local messages eliminate subtrees and combine by products and marginalizing sums or integrals.
- Scope: Tree factor graphs and chain HMMs.
- Validity regime: Exact on trees; iterative heuristic on loopy graphs.
- Assumptions:
  - acyclic factor graph
  - finite or integrable factors
- Caveats:
  - Loopy belief propagation may fail to converge or return inexact beliefs.
- Counterexamples:
  - A frustrated cycle with nonconvergent message updates.
- Adversarial challenge: The common loopy algorithm does not inherit tree exactness.
- Response: Exactness is explicitly limited to trees, with loopy use marked heuristic.

Decision: [x] accept  [ ] revise  [ ] defer  [ ] reject

## BFGS method `bfgs-method`

- Proposed disposition: `propose-node`
- Proposed node type: `operation`
- Proposed edge: `bfgs-method —APPLIED-IN→ optimization` (`theorem`)
- Source: `nocedal-wright-2006`, Chapter 6, §6.1, pp. 136–143.
- Proposition: BFGS is a quasi-Newton optimization method that updates an inverse-Hessian approximation using gradient differences while preserving positive definiteness under a curvature condition.
- Mathematical skeleton: A rank-two secant update enforces H_{k+1} y_k = s_k and remains positive definite when s_k^T y_k is positive.
- Scope: Smooth unconstrained minimization.
- Validity regime: Local convergence regimes with suitable line search.
- Assumptions:
  - available gradients
  - positive curvature pair
- Caveats:
  - Nonconvex curvature can require damping or skipped updates.
- Counterexamples:
  - A step with nonpositive s transpose y destroys the standard positivity guarantee.
- Adversarial challenge: BFGS is not simply Newton's method without an exact Hessian.
- Response: The claim identifies its distinct secant update and conditional positivity result.

Decision: [x] accept  [ ] revise  [ ] defer  [ ] reject

## Channel capacity `channel-capacity`

- Proposed disposition: `propose-node`
- Proposed node type: `principle`
- Proposed edge: `channel-capacity —GOVERNS→ digital-communications` (`theorem`)
- Source: `cover-thomas-2006`, Chapter 7, §§7.1–7.7, pp. 183–221.
- Proposition: Channel capacity is the supremum of reliably achievable communication rates and governs the asymptotic rate limit for digital communication over a specified channel model.
- Mathematical skeleton: For a memoryless channel C equals the maximum over input laws of mutual information I(X;Y).
- Scope: Discrete memoryless channels, with model-specific extensions.
- Validity regime: Rates below capacity are achievable; rates above are ruled out by a converse.
- Assumptions:
  - fixed channel law
  - arbitrarily long block codes
- Caveats:
  - Finite-blocklength and mismatch constraints change practical limits.
- Counterexamples:
  - A rate above C with vanishing error would contradict the converse.
- Adversarial challenge: Capacity is model-dependent, not a property of hardware alone.
- Response: The channel law and asymptotic coding regime are explicit.

Decision: [x] accept  [ ] revise  [ ] defer  [ ] reject

## Convex function `convex-function`

- Proposed disposition: `propose-node`
- Proposed node type: `object`
- Proposed edge: `optimization —ASSUMES→ convex-function` (`theorem`)
- Source: `boyd-vandenberghe-2004`, Chapter 3, §3.1, pp. 67–74.
- Proposition: Convex optimization assumes a convex objective and convex feasible structure, making every local minimum globally minimizing.
- Mathematical skeleton: f(theta x plus one-minus-theta y) is at most theta f(x) plus one-minus-theta f(y).
- Scope: Convex minimization problems.
- Validity regime: Local minima considered within the convex feasible set.
- Assumptions:
  - convex domain
  - convex objective
- Caveats:
  - Strict convexity is needed for uniqueness, not for local-to-global optimality.
- Counterexamples:
  - A nonconvex double-well has nonglobal local minima.
- Adversarial challenge: The term is sometimes attached to a function while constraints remain nonconvex.
- Response: The proposition requires both convex objective and feasible structure.

Decision: [x] accept  [ ] revise  [ ] defer  [ ] reject

## Convex set `convex-set`

- Proposed disposition: `propose-node`
- Proposed node type: `object`
- Proposed edge: `optimization —ASSUMES→ convex-set` (`theorem`)
- Source: `boyd-vandenberghe-2004`, Chapter 2, §2.1, pp. 21–24.
- Proposition: A convex optimization feasible region assumes closure under line segments between feasible points.
- Mathematical skeleton: For x and y in C and theta in [0,1], theta x plus one-minus-theta y remains in C.
- Scope: Euclidean convex optimization.
- Validity regime: Ordinary linear interpolation in the chosen coordinates.
- Assumptions:
  - affine ambient space
- Caveats:
  - A coordinate change need not preserve Euclidean convexity.
- Counterexamples:
  - A disconnected feasible set is nonconvex.
- Adversarial challenge: Convexity depends on the affine representation.
- Response: The ambient affine coordinates are part of the scope.

Decision: [x] accept  [ ] revise  [ ] defer  [ ] reject

## Cotangent bundle `cotangent-bundle`

- Proposed disposition: `propose-node`
- Proposed node type: `object`
- Proposed edge: `cotangent-bundle —SAME-SKELETON→ phase-space` (`strong-analogy`)
- Source: `lee-smooth-manifolds-2012`, Chapter 11, pp. 272–303.
- Proposition: The cotangent bundle T*Q supplies the canonical phase space for unconstrained Hamiltonian mechanics on a configuration manifold Q.
- Mathematical skeleton: Points are pairs (q,p) with p a covector at q, carrying the canonical symplectic two-form.
- Scope: Finite-dimensional canonical Hamiltonian mechanics.
- Validity regime: Before constraint reduction or noncanonical coordinate changes.
- Assumptions:
  - smooth configuration manifold
  - unconstrained canonical formulation
- Caveats:
  - General symplectic phase spaces need not be global cotangent bundles.
- Counterexamples:
  - A reduced coadjoint orbit can be symplectic without being T*Q globally.
- Adversarial challenge: Equating every phase space with a cotangent bundle is too strong.
- Response: The scope is the canonical unconstrained formulation and states the exception.

Decision: [x] accept  [ ] revise  [ ] defer  [ ] reject

## Data-processing inequality `data-processing-inequality`

- Proposed disposition: `propose-node`
- Proposed node type: `theorem`
- Proposed edge: `data-processing-inequality —GOVERNS→ mutual-information` (`theorem`)
- Source: `cover-thomas-2006`, Chapter 2, §2.8, pp. 34–35.
- Proposition: Processing data through a Markov channel cannot increase mutual information, constraining entropy-derived information measures.
- Mathematical skeleton: If X-Y-Z is Markov, then I(X;Z) is at most I(X;Y).
- Scope: Shannon mutual information for random variables forming a Markov chain.
- Validity regime: Deterministic or stochastic post-processing represented by the channel Y to Z.
- Assumptions:
  - Markov conditional independence
- Caveats:
  - Equality conditions require additional sufficiency structure.
- Counterexamples:
  - Side information not included in the Markov chain can alter the comparison.
- Adversarial challenge: The theorem is about mutual information, not entropy monotonically decreasing in every process.
- Response: The proposition names mutual information and the Markov condition explicitly.

Decision: [x] accept  [ ] revise  [ ] defer  [ ] reject

## Differential form `differential-form`

- Proposed disposition: `propose-node`
- Proposed node type: `object`
- Proposed edge: `vector-calculus —REPRESENTED-BY→ differential-form` (`theorem`)
- Source: `lee-smooth-manifolds-2012`, Chapter 14, pp. 349–376.
- Proposition: Differential forms provide the coordinate-independent representation that unifies gradient, circulation, flux, and integral theorems from vector calculus.
- Mathematical skeleton: The exterior derivative and pullback combine with Stokes theorem integral over boundary equals integral of the derivative.
- Scope: Smooth manifolds and classical vector calculus under metric-dependent identifications.
- Validity regime: Differential forms of compatible degree on manifolds with boundary.
- Assumptions:
  - smoothness
  - orientation where integration requires it
- Caveats:
  - Gradient and curl identifications use a metric and orientation in addition to forms.
- Counterexamples:
  - Nonorientable manifolds require densities or twisted forms for global integration.
- Adversarial challenge: Saying forms are identical to vector calculus hides metric-dependent conversions.
- Response: The claim says representation and explicitly separates metric identifications.

Decision: [x] accept  [ ] revise  [ ] defer  [ ] reject

## Extended Kalman filter `extended-kalman-filter`

- Proposed disposition: `propose-node`
- Proposed node type: `operation`
- Proposed edge: `kalman-filter —REPLACED-BY→ extended-kalman-filter` (`strong-analogy`)
- Source: `thrun-burgard-fox-2005`, Chapter 3, §3.3, pp. 54–64.
- Proposition: When nonlinear dynamics or observations break the linear Kalman assumptions, the extended Kalman filter replaces exact propagation with Jacobian linearization.
- Mathematical skeleton: Propagate mean through nonlinear maps and covariance through their Jacobians, then apply a Kalman-form correction.
- Scope: Differentiable nonlinear filtering with unimodal local uncertainty.
- Validity regime: Small uncertainty and weak local nonlinearity.
- Assumptions:
  - differentiable models
  - useful first-order approximation
- Caveats:
  - The recursion is approximate and can be inconsistent or diverge.
- Counterexamples:
  - Strongly multimodal posteriors not captured by one Gaussian.
- Adversarial challenge: The EKF is often incorrectly described as an exact nonlinear Kalman filter.
- Response: Approximation, locality, and failure modes are explicit.

Decision: [x] accept  [ ] revise  [ ] defer  [ ] reject

## Factor graph `factor-graph`

- Proposed disposition: `propose-node`
- Proposed node type: `object`
- Proposed edge: `state-space-model —REPRESENTED-BY→ factor-graph` (`theorem`)
- Source: `koller-friedman-2009`, Chapter 4, §4.4.1, pp. 123–127.
- Proposition: A factor graph represents a global function or probability distribution as a bipartite graph of variables and local factors.
- Mathematical skeleton: f(x_1,...,x_n) equals a product of factors f_a over subsets of variables adjacent to each factor node.
- Scope: Finite factorization graphs, including temporal state-space models.
- Validity regime: Exact representation when the product equals the target function.
- Assumptions:
  - specified factorization
- Caveats:
  - Graph cycles affect inference algorithms but not the validity of the factorization.
- Counterexamples:
  - A missing factor that changes the represented joint distribution.
- Adversarial challenge: A factor graph is a representation, not an inference algorithm.
- Response: The claim confines the node to representation and leaves message passing separate.

Decision: [x] accept  [ ] revise  [ ] defer  [ ] reject

## GraphSLAM `graphslam`

- Proposed disposition: `propose-node`
- Proposed node type: `operation`
- Proposed edge: `optimization —APPLIED-IN→ graphslam` (`theorem`)
- Source: `thrun-burgard-fox-2005`, Chapter 11, §§11.2–11.4, pp. 340–361.
- Proposition: GraphSLAM formulates simultaneous localization and mapping as sparse graph-based maximum a posteriori optimization over robot poses and landmarks.
- Mathematical skeleton: Negative log factors yield a sparse nonlinear least-squares objective whose graph records variable-constraint incidence.
- Scope: Offline or smoothing-based SLAM with differentiable residual models.
- Validity regime: MAP estimation under the stated probabilistic model.
- Assumptions:
  - factorized motion and measurement likelihoods
  - chosen gauge or anchor
- Caveats:
  - Nonconvexity, data association, and gauge freedom can dominate practical behavior.
- Counterexamples:
  - An unanchored pose graph has gauge nonuniqueness.
- Adversarial challenge: GraphSLAM is not merely any SLAM implementation using a graph data structure.
- Response: The definition requires a factorized global MAP objective and sparse graph structure.

Decision: [x] accept  [ ] revise  [ ] defer  [ ] reject

## Hamiltonian system `hamiltonian-system`

- Proposed disposition: `propose-node`
- Proposed node type: `model`
- Proposed edge: `hamiltonian-system —REPRESENTED-BY→ phase-space` (`theorem`)
- Source: `hairer-lubich-wanner-2006`, Chapter VI, §§VI.1–VI.3, pp. 179–204.
- Proposition: A Hamiltonian system is naturally represented in phase space by first-order equations generated by a Hamiltonian and a symplectic structure.
- Mathematical skeleton: In canonical coordinates q-dot equals partial H by partial p and p-dot equals minus partial H by partial q.
- Scope: Finite-dimensional smooth Hamiltonian dynamics.
- Validity regime: Canonical coordinates locally, symplectic vector fields globally.
- Assumptions:
  - smooth Hamiltonian
  - nondegenerate symplectic form
- Caveats:
  - Dissipative systems are not Hamiltonian without extension or reformulation.
- Counterexamples:
  - A generic contracting flow does not preserve symplectic volume.
- Adversarial challenge: Merely conserving an energy-like scalar does not make a system Hamiltonian.
- Response: The definition requires the symplectic generation relation, not conservation alone.

Decision: [x] accept  [ ] revise  [ ] defer  [ ] reject

## Interior-point method `interior-point-method`

- Proposed disposition: `propose-node`
- Proposed node type: `operation`
- Proposed edge: `interior-point-method —APPLIED-IN→ optimization` (`theorem`)
- Source: `boyd-vandenberghe-2004`, Chapter 11, §§11.2–11.7, pp. 563–609.
- Proposition: Interior-point methods solve constrained convex optimization by following central solutions defined by barrier-perturbed optimality conditions.
- Mathematical skeleton: Replace inequality constraints by a barrier or perturbed complementarity equations and drive the barrier parameter toward zero.
- Scope: Linear, conic, and smooth convex programming.
- Validity regime: Iterates remain in the interior and approach primal-dual optimality.
- Assumptions:
  - convexity
  - feasible interior or suitable homogeneous embedding
- Caveats:
  - Nonconvex variants lack the same global guarantees.
- Counterexamples:
  - An infeasible problem without an embedding has no central path to an optimum.
- Adversarial challenge: Interior-point is a family, not one update rule.
- Response: The node is defined by central-path/barrier structure and records variants beneath it.

Decision: [x] accept  [ ] revise  [ ] defer  [ ] reject

## Jacobi integral `jacobi-integral`

- Proposed disposition: `propose-node`
- Proposed node type: `object`
- Proposed edge: `jacobi-integral —IS-A→ conservation-laws` (`special-case`)
- Source: `fitzpatrick-celestial-mechanics-2012`, Chapter 8, §8.3, pp. 149–151.
- Proposition: The Jacobi integral is a conserved quantity of the circular restricted three-body problem in the uniformly rotating frame.
- Mathematical skeleton: The rotating-frame equations imply a constant combining effective potential and squared speed.
- Scope: Circular restricted three-body problem.
- Validity regime: Autonomous rotating-frame equations with no added perturbations.
- Assumptions:
  - circular primaries
  - uniformly rotating frame
  - massless third body
- Caveats:
  - It is not the inertial mechanical energy.
- Counterexamples:
  - Elliptic primaries generally destroy the time-independent Jacobi constant.
- Adversarial challenge: Calling it energy can obscure rotating-frame and sign conventions.
- Response: The claim uses conserved quantity and identifies the precise model.

Decision: [x] accept  [ ] revise  [ ] defer  [ ] reject

## Kalman filter `kalman-filter`

- Proposed disposition: `merge-or-refine`
- Proposed node type: `existing-node refinement`
- Proposed edge: `bayes-rule —APPLIED-IN→ linear-gaussian-ssm` (`theorem`)
- Source: `thrun-burgard-fox-2005`, Chapter 3, §3.2, pp. 40–53.
- Proposition: The Kalman update applies Bayes rule as exact Gaussian conditioning inside a linear-Gaussian state-space model.
- Mathematical skeleton: Gaussian prediction and conditioning close on the mean and covariance recursions.
- Scope: Linear-Gaussian filtering.
- Validity regime: Exact finite-dimensional Gaussian posterior recursion.
- Assumptions:
  - linear transition and observation maps
  - Gaussian noises with known covariances
- Caveats:
  - Nonlinear or non-Gaussian models require approximations or different representations.
- Counterexamples:
  - A multimodal posterior cannot be represented exactly by one mean and covariance.
- Adversarial challenge: The algorithm is often conflated with the state-space model it solves.
- Response: The edge direction explicitly separates model from solver.

Decision: [x] accept  [ ] revise  [ ] defer  [ ] reject

## Karush-Kuhn-Tucker conditions `karush-kuhn-tucker-conditions`

- Proposed disposition: `propose-node`
- Proposed node type: `theorem`
- Proposed edge: `karush-kuhn-tucker-conditions —GOVERNS→ optimization` (`theorem`)
- Source: `nocedal-wright-2006`, Chapter 12, §§12.2–12.4, pp. 315–329.
- Proposition: Under a constraint qualification, KKT conditions are necessary for a constrained local optimum and are sufficient for global optimality in a convex problem.
- Mathematical skeleton: Stationarity, primal feasibility, dual feasibility, and complementary slackness.
- Scope: Smooth finite-dimensional constrained optimization.
- Validity regime: Local necessity generally; global sufficiency in convex programs.
- Assumptions:
  - constraint qualification for necessity
  - convexity for sufficiency
- Caveats:
  - Without a qualification, a valid optimum can lack KKT multipliers.
- Counterexamples:
  - Degenerate constraints violating all standard qualifications.
- Adversarial challenge: KKT is routinely stated without the hypotheses separating necessity from sufficiency.
- Response: Both constraint qualification and convexity roles are explicit.

Decision: [x] accept  [ ] revise  [ ] defer  [ ] reject

## Lagrange duality `lagrange-duality`

- Proposed disposition: `propose-node`
- Proposed node type: `principle`
- Proposed edge: `optimization —REPRESENTED-BY→ lagrange-duality` (`theorem`)
- Source: `boyd-vandenberghe-2004`, Chapter 5, §§5.1–5.3, pp. 215–244.
- Proposition: Lagrange duality represents a constrained optimization problem by a dual lower-bound problem obtained from the infimum of its Lagrangian.
- Mathematical skeleton: The dual function g(lambda,nu) is the infimum over x of the Lagrangian and never exceeds the primal optimum for dual-feasible multipliers.
- Scope: Finite-dimensional constrained optimization.
- Validity regime: Weak duality always; strong duality only under added regularity such as Slater conditions in convex problems.
- Assumptions:
  - well-defined Lagrangian
- Caveats:
  - A duality gap can remain outside strong-duality conditions.
- Counterexamples:
  - A nonconvex problem with positive duality gap.
- Adversarial challenge: Strong duality is not automatic from writing a Lagrangian.
- Response: The claim separates unconditional weak duality from qualified strong duality.

Decision: [x] accept  [ ] revise  [ ] defer  [ ] reject

## Lagrange points `lagrange-points`

- Proposed disposition: `propose-node`
- Proposed node type: `object`
- Proposed edge: `lagrange-points —REPRESENTED-BY→ phase-space` (`theorem`)
- Source: `fitzpatrick-celestial-mechanics-2012`, Chapter 8, §8.6, pp. 155–161.
- Proposition: Lagrange points are equilibrium points of the circular restricted three-body equations in the uniformly rotating frame.
- Mathematical skeleton: Set rotating-frame velocity and acceleration to zero so the effective-force gradient vanishes.
- Scope: Five classical equilibrium points L1 through L5.
- Validity regime: Classical circular restricted model.
- Assumptions:
  - circular primaries
  - massless third body
  - uniformly rotating frame
- Caveats:
  - Only the triangular points are linearly stable for sufficiently small mass ratio; collinear points are unstable.
- Counterexamples:
  - Adding substantial third-body mass changes the equilibrium problem.
- Adversarial challenge: Popular descriptions call all five points stable parking locations.
- Response: The dossier separates equilibrium existence from the mass-ratio-dependent stability result.

Decision: [x] accept  [ ] revise  [ ] defer  [ ] reject

## Lie group `lie-group`

- Proposed disposition: `propose-node`
- Proposed node type: `object`
- Proposed edge: `symmetry —REPRESENTED-BY→ lie-group` (`theorem`)
- Source: `lee-smooth-manifolds-2012`, Chapter 7, pp. 150–173.
- Proposition: Continuous symmetries are represented by Lie groups whose smooth multiplication supports infinitesimal generators in a Lie algebra.
- Mathematical skeleton: A smooth group has a tangent space at the identity with a bracket induced by invariant vector fields.
- Scope: Finite-dimensional Lie groups and smooth actions.
- Validity regime: Continuous symmetries described by smooth group actions.
- Assumptions:
  - smooth manifold structure compatible with group operations
- Caveats:
  - Discrete symmetries are groups but not captured by infinitesimal generators.
- Counterexamples:
  - A purely finite symmetry group has zero-dimensional local Lie algebra information.
- Adversarial challenge: Not every symmetry group is a positive-dimensional Lie group.
- Response: The claim is explicitly about continuous finite-dimensional symmetries.

Decision: [x] accept  [ ] revise  [ ] defer  [ ] reject

## Limit cycles `limit-cycles`

- Proposed disposition: `propose-node`
- Proposed node type: `phenomenon`
- Proposed edge: `limit-cycles —REPRESENTED-BY→ phase-space` (`theorem`)
- Source: `khalil-nonlinear-systems-2014`, Chapter 2, §2.4, pp. 54–59.
- Proposition: A limit cycle is an isolated periodic orbit represented as a closed trajectory in phase space.
- Mathematical skeleton: A periodic solution traces a closed orbit; isolation distinguishes a limit cycle from a family of periodic orbits.
- Scope: Finite-dimensional autonomous ODEs.
- Validity regime: Periodic solutions of autonomous flows.
- Assumptions:
  - existence and uniqueness of trajectories
- Caveats:
  - Closed phase curves in nonautonomous projections need not be limit cycles.
- Counterexamples:
  - Every orbit of a linear center is periodic, so none is an isolated limit cycle.
- Adversarial challenge: A closed curve alone does not establish a limit cycle.
- Response: Isolation and autonomous-flow assumptions are explicit in the proposition.

Decision: [x] accept  [ ] revise  [ ] defer  [ ] reject

## Lyapunov functions `lyapunov-functions`

- Proposed disposition: `propose-node`
- Proposed node type: `principle`
- Proposed edge: `lyapunov-functions —GOVERNS→ stability` (`theorem`)
- Source: `khalil-nonlinear-systems-2014`, Chapter 4, §§4.1–4.2, pp. 112–132.
- Proposition: A Lyapunov function certifies stability by decreasing along trajectories while measuring displacement from an equilibrium or invariant set.
- Mathematical skeleton: V is positive definite and its derivative along the vector field is nonpositive for stability, negative definite for asymptotic conclusions under standard hypotheses.
- Scope: Local nonlinear stability of equilibria and invariant sets.
- Validity regime: The neighborhood where definiteness and derivative conditions hold.
- Assumptions:
  - regular candidate function
  - derivative sign conditions
- Caveats:
  - Failure to find a Lyapunov function is not proof of instability.
- Counterexamples:
  - A positive function increasing along trajectories does not certify stability.
- Adversarial challenge: Negative semidefinite derivative alone may not imply asymptotic stability.
- Response: The claim distinguishes stability from stronger conclusions and invokes added hypotheses.

Decision: [x] accept  [ ] revise  [ ] defer  [ ] reject

## Markov localization `markov-localization`

- Proposed disposition: `propose-node`
- Proposed node type: `operation`
- Proposed edge: `bayes-rule —APPLIED-IN→ markov-localization` (`theorem`)
- Source: `thrun-burgard-fox-2005`, Chapter 7, §§7.2–7.3, pp. 197–211.
- Proposition: Markov localization performs recursive Bayes filtering over robot pose using motion and sensor models.
- Mathematical skeleton: Alternate prediction by the transition kernel with correction by the observation likelihood.
- Scope: Robot localization in a known map.
- Validity regime: Correctly specified motion and measurement models.
- Assumptions:
  - Markov state
  - conditionally independent current observation given state
- Caveats:
  - Representation may be grid, particles, or parametric and changes approximation behavior.
- Counterexamples:
  - Long-lived unmodeled state violates the Markov pose model.
- Adversarial challenge: Markov localization names a problem family and several implementations.
- Response: The node is anchored to the common recursive Bayes skeleton; implementations become examples.

Decision: [x] accept  [ ] revise  [ ] defer  [ ] reject

## Mutual information `mutual-information`

- Proposed disposition: `propose-node`
- Proposed node type: `object`
- Proposed edge: `mutual-information —REPRESENTED-BY→ shannon-entropy` (`theorem`)
- Source: `cover-thomas-2006`, Chapter 2, §2.4, pp. 18–22.
- Proposition: Mutual information is an entropy-derived measure of statistical dependence equal to the relative entropy between the joint law and the product of marginals.
- Mathematical skeleton: I(X;Y) equals H(X) plus H(Y) minus H(X,Y), and equals D(pXY parallel pX pY).
- Scope: Shannon information theory.
- Validity regime: Finite discrete alphabets without extra measure-theoretic qualifications.
- Assumptions:
  - well-defined entropies or relative entropy
- Caveats:
  - Differential-entropy terms may be coordinate-dependent even when mutual information is invariant.
- Counterexamples:
  - Zero covariance does not imply zero mutual information outside Gaussian families.
- Adversarial challenge: Mutual information is sometimes reduced to linear correlation.
- Response: The KL definition captures arbitrary statistical dependence.

Decision: [x] accept  [ ] revise  [ ] defer  [ ] reject

## Newton's method `newton-method`

- Proposed disposition: `propose-node`
- Proposed node type: `operation`
- Proposed edge: `newton-method —APPLIED-IN→ optimization` (`theorem`)
- Source: `nocedal-wright-2006`, Chapter 3, §§3.3–3.4, pp. 44–48.
- Proposition: Newton's optimization method locally solves the stationarity equation by repeatedly minimizing the quadratic Taylor model built from the gradient and Hessian.
- Mathematical skeleton: Solve Hessian times step equals minus gradient, then update the iterate.
- Scope: Twice-differentiable unconstrained minimization.
- Validity regime: Quadratic local convergence near a solution under standard hypotheses.
- Assumptions:
  - nonsingular local Hessian
  - Lipschitz-continuous Hessian for standard local rate
- Caveats:
  - Far from a minimizer the step may not descend; line search or trust region is commonly required.
- Counterexamples:
  - An indefinite Hessian can produce an ascent direction.
- Adversarial challenge: Root finding and optimization versions are often conflated.
- Response: The node records the shared Newton linearization skeleton and scopes this claim to stationarity.

Decision: [x] accept  [ ] revise  [ ] defer  [ ] reject

## Occupancy grid mapping `occupancy-grid-mapping`

- Proposed disposition: `propose-node`
- Proposed node type: `operation`
- Proposed edge: `bayes-rule —APPLIED-IN→ occupancy-grid-mapping` (`strong-analogy`)
- Source: `thrun-burgard-fox-2005`, Chapter 9, §9.2, pp. 284–293.
- Proposition: Occupancy-grid mapping applies Bayesian updates to cell occupancy variables using inverse sensor evidence under a simplifying cell-independence approximation.
- Mathematical skeleton: Per-cell log odds accumulate prior-adjusted measurement log-likelihood ratios.
- Scope: Static two-dimensional or three-dimensional occupancy grids.
- Validity regime: Mapping with known or separately estimated robot poses.
- Assumptions:
  - static environment
  - approximate conditional independence of cells
- Caveats:
  - Cell independence is computationally useful but generally false in the full posterior.
- Counterexamples:
  - Strongly correlated occlusion structure violates independent cell updates.
- Adversarial challenge: The standard update can look exact while relying on a strong independence approximation.
- Response: The approximation is stated in the proposition and caveats.

Decision: [x] accept  [ ] revise  [ ] defer  [ ] reject

## Orbital resonance `orbital-resonance`

- Proposed disposition: `propose-node`
- Proposed node type: `phenomenon`
- Proposed edge: `orbital-resonance —ANALOGOUS-TO→ harmonic-oscillator` (`strong-analogy`)
- Source: `murray-dermott-1999`, Chapter 8, §§8.3 and 8.6–8.8, pp. 326–363.
- Proposition: After resonant averaging, the local libration dynamics near a stable isolated orbital resonance can be approximated by a pendulum-type Hamiltonian.
- Mathematical skeleton: A slow integer combination of angles survives averaging and often reduces locally to a pendulum-like libration Hamiltonian.
- Scope: Weakly perturbed orbit–orbit resonances admitting a one-degree-of-freedom resonant reduction.
- Validity regime: Neighborhood of an isolated resonance where averaging is valid.
- Assumptions:
  - near commensurability
  - perturbative separation of fast and slow angles
- Caveats:
  - Frequency commensurability alone does not guarantee libration or capture.
- Counterexamples:
  - A near rational ratio with a circulating resonant angle.
- Adversarial challenge: A numerical period ratio near integers can be accidental.
- Response: The claim requires slow resonant-angle dynamics, not ratio alone.

Decision: [x] accept  [ ] revise  [ ] defer  [ ] reject

## Particle filter `particle-filter`

- Proposed disposition: `propose-node`
- Proposed node type: `operation`
- Proposed edge: `kalman-filter —REPLACED-BY→ particle-filter` (`strong-analogy`)
- Source: `thrun-burgard-fox-2005`, Chapter 4, §4.3, pp. 96–112.
- Proposition: When Gaussian filtering assumptions fail, a particle filter replaces a single Gaussian belief by a weighted empirical sample propagated and reweighted recursively.
- Mathematical skeleton: Importance-sample the predictive distribution, weight by likelihood, and resample to control weight degeneracy.
- Scope: Sequential Bayesian state estimation.
- Validity regime: Monte Carlo consistency as particle count grows under regularity conditions.
- Assumptions:
  - simulable proposal
  - evaluable importance weights
- Caveats:
  - Finite samples suffer degeneracy and high-dimensional collapse.
- Counterexamples:
  - A proposal with zero support where the posterior has mass.
- Adversarial challenge: Particle filtering is not automatically accurate for arbitrary nonlinear systems.
- Response: The claim is representational and asymptotic; finite-sample failure modes are explicit.

Decision: [x] accept  [ ] revise  [ ] defer  [ ] reject

## Proximal operator `proximal-operator`

- Proposed disposition: `propose-node`
- Proposed node type: `operation`
- Proposed edge: `proximal-operator —APPLIED-IN→ optimization` (`theorem`)
- Source: `parikh-boyd-2014`, Section 1.1, pp. 124–126, equations (1.1)–(1.3).
- Proposition: The proximal operator converts a possibly nonsmooth convex function into a regularized minimization subproblem used by first-order optimization algorithms.
- Mathematical skeleton: prox of f at v is the argmin over x of f(x) plus one over twice lambda times squared distance to v.
- Scope: Convex composite optimization.
- Validity regime: Euclidean proximal map; generalized metrics require adjusted statements.
- Assumptions:
  - proper lower-semicontinuous convex function
- Caveats:
  - The proximal subproblem may itself be expensive or set-valued outside standard convex assumptions.
- Counterexamples:
  - A nonconvex function with multiple proximal minimizers.
- Adversarial challenge: The main textbook predates some modern proximal terminology.
- Response: The source supports the convex minimization structure; terminology is cross-checked in the course materials locator.

Decision: [x] accept  [ ] revise  [ ] defer  [ ] reject

## Relative entropy `relative-entropy`

- Proposed disposition: `propose-node`
- Proposed node type: `object`
- Proposed edge: `relative-entropy —REPRESENTED-BY→ shannon-entropy` (`theorem`)
- Source: `cover-thomas-2006`, Chapter 2, §2.3, pp. 18–22.
- Proposition: Relative entropy measures the discrepancy of a distribution P from a reference Q and can be written as cross-entropy minus Shannon entropy.
- Mathematical skeleton: D(P parallel Q) equals the expectation under P of log p over q and is nonnegative.
- Scope: Classical probability distributions.
- Validity regime: Discrete finite alphabets or measure-theoretic extension with Radon-Nikodym derivative.
- Assumptions:
  - P absolutely continuous with respect to Q for finite divergence
- Caveats:
  - It is asymmetric and is not a metric.
- Counterexamples:
  - If Q assigns zero mass where P is positive, divergence is infinite.
- Adversarial challenge: The word distance encourages false symmetry and triangle-inequality assumptions.
- Response: The claim uses discrepancy and explicitly denies metric status.

Decision: [x] accept  [ ] revise  [ ] defer  [ ] reject

## Restricted three-body problem `restricted-three-body-problem`

- Proposed disposition: `propose-node`
- Proposed node type: `model`
- Proposed edge: `restricted-three-body-problem —REPRESENTED-BY→ phase-space` (`theorem`)
- Source: `fitzpatrick-celestial-mechanics-2012`, Chapter 8, §8.2, pp. 147–149.
- Proposition: The circular restricted three-body problem is an autonomous rotating-frame dynamical model for a massless body moving under two circularly orbiting primaries.
- Mathematical skeleton: A four-dimensional first-order system combines Coriolis terms with the gradient of an effective potential.
- Scope: Planar circular restricted problem.
- Validity regime: Newtonian point-mass gravity in the rotating frame.
- Assumptions:
  - massless third body
  - circular two-body motion of primaries
- Caveats:
  - Spatial, elliptic, relativistic, and finite-mass variants change the model.
- Counterexamples:
  - A third body with appreciable mass invalidates the restricted assumption.
- Adversarial challenge: The familiar five-point picture hides the model's severe restrictions.
- Response: Each restriction is named in the proposition and assumptions.

Decision: [x] accept  [ ] revise  [ ] defer  [ ] reject

## Riemannian metric `riemannian-metric`

- Proposed disposition: `propose-node`
- Proposed node type: `object`
- Proposed edge: `riemannian-metric —ASSUMES→ smoothness` (`theorem`)
- Source: `lee-smooth-manifolds-2012`, Chapter 13, pp. 327–348.
- Proposition: A Riemannian metric is a smoothly varying positive-definite inner product on tangent spaces and therefore assumes a smooth manifold structure.
- Mathematical skeleton: Each point p has an inner product g_p on T_pM whose coordinate components vary smoothly.
- Scope: Positive-definite Riemannian geometry.
- Validity regime: Smooth coordinate changes preserving tensorial transformation.
- Assumptions:
  - smooth manifold
  - positive-definite symmetric tensor field
- Caveats:
  - Pseudo-Riemannian metrics relax positive definiteness.
- Counterexamples:
  - A discontinuously varying inner product is not a smooth Riemannian metric.
- Adversarial challenge: Metric can mean a distance function rather than a tensor field.
- Response: The node uses the differential-geometric definition and can cross-link induced distance later.

Decision: [x] accept  [ ] revise  [ ] defer  [ ] reject

## Smooth manifold `smooth-manifold`

- Proposed disposition: `propose-node`
- Proposed node type: `object`
- Proposed edge: `smooth-manifold —ASSUMES→ smoothness` (`theorem`)
- Source: `lee-smooth-manifolds-2012`, Chapter 1, pp. 1–31.
- Proposition: A smooth manifold is a locally Euclidean topological space equipped with smoothly compatible coordinate charts.
- Mathematical skeleton: Transition maps between overlapping charts are smooth maps between open subsets of Euclidean space.
- Scope: Finite-dimensional smooth manifolds without boundary unless stated.
- Validity regime: Coordinate-independent differential calculus.
- Assumptions:
  - Hausdorff topology
  - second countability
  - smooth atlas
- Caveats:
  - Topological manifolds need not admit a unique smooth structure.
- Counterexamples:
  - A chart collection with nonsmooth transition maps defines no smooth atlas.
- Adversarial challenge: Local Euclidean structure alone defines only a topological manifold.
- Response: Smooth compatibility of the atlas is an explicit part of the claim.

Decision: [x] accept  [ ] revise  [ ] defer  [ ] reject

## Symplectic integrator `symplectic-integrator`

- Proposed disposition: `propose-node`
- Proposed node type: `move`
- Proposed edge: `symplectic-integrator —APPLIED-IN→ hamiltonian-system` (`theorem`)
- Source: `hairer-lubich-wanner-2006`, Chapter VI, §§VI.3–VI.4, pp. 204–230; Chapter IX, §§IX.1–IX.3, pp. 337–366.
- Proposition: A symplectic integrator preserves the discrete symplectic form; under backward-error hypotheses it nearly conserves a modified Hamiltonian over long time intervals.
- Mathematical skeleton: The one-step map Phi satisfies pullback of omega equals omega.
- Scope: Finite-dimensional Hamiltonian integration.
- Validity regime: Fixed-step methods under the stated construction.
- Assumptions:
  - symplectic phase space
  - symplectic one-step map
- Caveats:
  - Symplecticity does not imply exact energy conservation at every step.
- Counterexamples:
  - Generic adaptive step-size changes can destroy symplecticity.
- Adversarial challenge: Good energy plots alone do not prove a method symplectic.
- Response: The definition uses the form-preservation identity, with energy behavior only a consequence.

Decision: [x] accept  [ ] revise  [ ] defer  [ ] reject

## Tangent space `tangent-space`

- Proposed disposition: `propose-node`
- Proposed node type: `object`
- Proposed edge: `linearization —REPRESENTED-BY→ tangent-space` (`theorem`)
- Source: `lee-smooth-manifolds-2012`, Chapter 3, pp. 50–76.
- Proposition: The tangent space is the linear local representation in which first-order linearization of smooth manifold dynamics lives.
- Mathematical skeleton: The derivative Df_p is a linear map from T_pM to T_f(p)N.
- Scope: Smooth finite-dimensional manifolds.
- Validity regime: First-order local approximation.
- Assumptions:
  - differentiable map at the base point
- Caveats:
  - A tangent space is not globally identical to the manifold.
- Counterexamples:
  - Singular spaces can lack a constant-dimensional manifold tangent bundle.
- Adversarial challenge: Visual tangent planes encourage an embedding-dependent definition.
- Response: The claim uses the intrinsic derivative construction.

Decision: [x] accept  [ ] revise  [ ] defer  [ ] reject

## Unscented Kalman filter `unscented-kalman-filter`

- Proposed disposition: `propose-node`
- Proposed node type: `operation`
- Proposed edge: `kalman-filter —REPLACED-BY→ unscented-kalman-filter` (`strong-analogy`)
- Source: `thrun-burgard-fox-2005`, Chapter 3, §3.4, pp. 65–70.
- Proposition: When nonlinear maps break exact Kalman propagation, the unscented Kalman filter replaces linearization by deterministic sigma points chosen to reproduce moments.
- Mathematical skeleton: Transform weighted sigma points through the nonlinear map and reconstruct approximate mean and covariance.
- Scope: Nonlinear Gaussian filtering.
- Validity regime: Unimodal uncertainty where low-order moments summarize the belief adequately.
- Assumptions:
  - finite moments
  - useful Gaussian moment approximation
- Caveats:
  - The posterior remains approximated as Gaussian and parameter choices affect numerical behavior.
- Counterexamples:
  - Strong multimodality not representable by reconstructed mean and covariance.
- Adversarial challenge: Avoiding Jacobians does not make the UKF exact for arbitrary nonlinear models.
- Response: The claim calls it deterministic moment approximation and states Gaussian limitations.

Decision: [x] accept  [ ] revise  [ ] defer  [ ] reject

## Variational integrator `variational-integrator`

- Proposed disposition: `propose-node`
- Proposed node type: `move`
- Proposed edge: `variational-integrator —ASSUMES→ variational-principles` (`theorem`)
- Source: `hairer-lubich-wanner-2006`, Chapter VI, §VI.6, pp. 231–236.
- Proposition: A variational integrator discretizes the action principle and derives the time-step map from discrete Euler-Lagrange equations.
- Mathematical skeleton: Stationarity of the discrete action sum yields a symplectic update and discrete momentum results under symmetry.
- Scope: Lagrangian mechanical systems with a regular discrete Lagrangian.
- Validity regime: Fixed-step discrete mechanics under the chosen quadrature approximation.
- Assumptions:
  - discrete action principle
  - regularity of the discrete Lagrangian
- Caveats:
  - Not every symplectic integrator is presented or implemented variationally.
- Counterexamples:
  - A generic update not derivable from any regular discrete action.
- Adversarial challenge: Discretizing Euler-Lagrange equations directly need not equal discretizing the variational principle.
- Response: The definition requires stationarity of a discrete action.

Decision: [x] accept  [ ] revise  [ ] defer  [ ] reject
