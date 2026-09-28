# Broad sweep promotion review

This packet contains the 50 dossiers selected for human review. The generated content and edges have passed the ordinary trusted validator in an isolated combined tree, but no box below is a recorded decision until a human reviewer explicitly supplies it.

Record actual active review time rather than wall-clock delay:

- Reviewer:
- Review started:
- Review completed:
- Active review minutes:

## Aliasing `aliasing`

- Proposed disposition: `propose-node`
- Proposed node type: `phenomenon`
- Proposed edge: `digital-communications —FAILS-WHEN→ aliasing` (`theorem`)
- Source: `siebert-signals-1986`, Chapter 12, sampling in time and frequency.
- Proposition: Aliasing occurs when sampling makes distinct continuous frequencies indistinguishable.
- Mathematical skeleton: Frequency components separated by an integer multiple of the sampling frequency map to identical samples.
- Scope: Uniform sampling of continuous-time sinusoids.
- Validity regime: The stated claim is limited to uniform sampling of continuous-time sinusoids.
- Assumptions:
  - fixed sampling interval
- Caveats:
  - Antialias filtering changes the input before sampling rather than undoing aliasing afterward.
- Counterexamples:
  - Two sinusoids separated by the sampling frequency have identical sample values.
- Adversarial challenge: Boundary test: Antialias filtering changes the input before sampling rather than undoing aliasing afterward.
- Response: The proposition is restricted to uniform sampling of continuous-time sinusoids, and the caveat remains explicit.

Decision: [ ] accept  [ ] revise  [ ] defer  [ ] reject

## Bellman equation `bellman-equation`

- Proposed disposition: `propose-node`
- Proposed node type: `model`
- Proposed edge: `optimization —REPRESENTED-BY→ bellman-equation` (`theorem`)
- Source: `bertsekas-dp-2017`, Volume I, Chapter 1, §§1.2–1.4.
- Proposition: The Bellman equation represents optimal sequential decision making through a one-step recursion in value.
- Mathematical skeleton: Optimal cost equals the best immediate cost plus the value of the successor state.
- Scope: Finite-horizon problems and discounted or proper infinite-horizon variants.
- Validity regime: The stated claim is limited to finite-horizon problems and discounted or proper infinite-horizon variants.
- Assumptions:
  - Markov state description
  - optimal substructure
- Caveats:
  - Undiscounted improper problems may have multiple or pathological fixed points.
- Counterexamples:
  - A negative-cost cycle makes total cost unbounded below.
- Adversarial challenge: Boundary test: Undiscounted improper problems may have multiple or pathological fixed points.
- Response: The proposition is restricted to finite-horizon problems and discounted or proper infinite-horizon variants, and the caveat remains explicit.

Decision: [ ] accept  [ ] revise  [ ] defer  [ ] reject

## Brownian motion `brownian-motion`

- Proposed disposition: `propose-node`
- Proposed node type: `model`
- Proposed edge: `brownian-motion —SAME-SKELETON→ diffusion` (`theorem`)
- Source: `durrett-probability-2019`, Chapter 7, Brownian motion, §§7.1–7.8.
- Proposition: Brownian motion is the canonical continuous-path process with independent stationary Gaussian increments.
- Mathematical skeleton: Increment variance grows linearly in time, yielding the heat semigroup and diffusion scaling.
- Scope: Standard Brownian motion in Euclidean space.
- Validity regime: The stated claim is limited to standard Brownian motion in Euclidean space.
- Assumptions:
  - continuous paths
  - Gaussian independent increments
- Caveats:
  - Physical diffusion models may include drift, boundaries, or anomalous scaling.
- Counterexamples:
  - A Levy flight has jumps and is not Brownian despite spreading randomly.
- Adversarial challenge: Boundary test: Physical diffusion models may include drift, boundaries, or anomalous scaling.
- Response: The proposition is restricted to standard Brownian motion in Euclidean space, and the caveat remains explicit.

Decision: [ ] accept  [ ] revise  [ ] defer  [ ] reject

## Community detection `community-detection`

- Proposed disposition: `propose-node`
- Proposed node type: `operation`
- Proposed edge: `community-detection —SOLVED-BY→ graph-laplacian` (`strong-analogy`)
- Source: `newman-networks-2018`, Chapter 14, community structure.
- Proposition: Spectral community detection uses graph-matrix eigenvectors to find groups with unusually dense internal connection.
- Mathematical skeleton: A partition is extracted from low-dimensional spectral coordinates associated with Laplacian or modularity matrices.
- Scope: Networks whose chosen objective has meaningful mesoscale structure.
- Validity regime: The stated claim is limited to networks whose chosen objective has meaningful mesoscale structure.
- Assumptions:
  - specified null model or cut objective
- Caveats:
  - Different objectives define different communities and can have resolution limits.
- Counterexamples:
  - Modularity optimization can merge small well-defined groups in a large network.
- Adversarial challenge: Boundary test: Different objectives define different communities and can have resolution limits.
- Response: The proposition is restricted to networks whose chosen objective has meaningful mesoscale structure, and the caveat remains explicit.

Decision: [ ] accept  [ ] revise  [ ] defer  [ ] reject

## Condition number `condition-number`

- Proposed disposition: `propose-node`
- Proposed node type: `principle`
- Proposed edge: `condition-number —GOVERNS→ backward-error-analysis` (`theorem`)
- Source: `trefethen-bau-1997`, Lecture 12, pp. 89–97.
- Proposition: A condition number governs first-order amplification of input perturbations into solution changes.
- Mathematical skeleton: It is a local Lipschitz ratio, often expressed through operator norms or singular values.
- Scope: Well-posed finite-dimensional numerical problems near a specified input.
- Validity regime: The stated claim is limited to well-posed finite-dimensional numerical problems near a specified input.
- Assumptions:
  - specified norms
  - small perturbations
- Caveats:
  - Conditioning is a property of the problem, not the algorithm.
- Counterexamples:
  - A backward-stable algorithm can still give a poor forward answer on an ill-conditioned problem.
- Adversarial challenge: Boundary test: Conditioning is a property of the problem, not the algorithm.
- Response: The proposition is restricted to well-posed finite-dimensional numerical problems near a specified input, and the caveat remains explicit.

Decision: [ ] accept  [ ] revise  [ ] defer  [ ] reject

## Configuration model `configuration-model`

- Proposed disposition: `propose-node`
- Proposed node type: `model`
- Proposed edge: `configuration-model —APPLIED-IN→ epidemic-modeling` (`special-case`)
- Source: `newman-networks-2018`, Chapter 12, the configuration model.
- Proposition: The configuration model samples graphs constrained by a prescribed degree sequence or degree distribution.
- Mathematical skeleton: Half-edges are paired at random, producing a null model that controls degrees.
- Scope: Sparse undirected networks under the specified simple-graph or multigraph convention.
- Validity regime: The stated claim is limited to sparse undirected networks under the specified simple-graph or multigraph convention.
- Assumptions:
  - graphical or pairable degree sequence
- Caveats:
  - The basic pairing construction permits self-loops and parallel edges.
- Counterexamples:
  - Conditioning on simplicity can materially change probabilities for heavy-tailed degrees.
- Adversarial challenge: Boundary test: The basic pairing construction permits self-loops and parallel edges.
- Response: The proposition is restricted to sparse undirected networks under the specified simple-graph or multigraph convention, and the caveat remains explicit.

Decision: [ ] accept  [ ] revise  [ ] defer  [ ] reject

## Controllability `controllability`

- Proposed disposition: `propose-node`
- Proposed node type: `principle`
- Proposed edge: `controllability —GOVERNS→ state-space-model` (`theorem`)
- Source: `astrom-murray-2020`, Chapter 6, §§6.1–6.3.
- Proposition: Controllability determines whether inputs can steer a linear state-space model between states in finite time.
- Mathematical skeleton: Full rank of the controllability matrix characterizes reachability for finite-dimensional LTI systems.
- Scope: Finite-dimensional continuous-time LTI systems.
- Validity regime: The stated claim is limited to finite-dimensional continuous-time LTI systems.
- Assumptions:
  - unconstrained inputs
- Caveats:
  - Input constraints can obstruct steering despite algebraic controllability.
- Counterexamples:
  - A saturated actuator may not reach a distant state in the allotted time.
- Adversarial challenge: Boundary test: Input constraints can obstruct steering despite algebraic controllability.
- Response: The proposition is restricted to finite-dimensional continuous-time LTI systems, and the caveat remains explicit.

Decision: [ ] accept  [ ] revise  [ ] defer  [ ] reject

## Convolution `convolution`

- Proposed disposition: `propose-node`
- Proposed node type: `operation`
- Proposed edge: `convolution —TRANSFORM-DUAL→ fourier-analysis` (`theorem`)
- Source: `siebert-signals-1986`, Chapter 6, convolutional representations of continuous- and discrete-time systems.
- Proposition: Convolution in time becomes multiplication under the Fourier transform when both sides are defined.
- Mathematical skeleton: The transform of x*h equals the pointwise product of the transforms of x and h.
- Scope: Integrable signals or generalized-signal settings with justified transforms.
- Validity regime: The stated claim is limited to integrable signals or generalized-signal settings with justified transforms.
- Assumptions:
  - transform and convolution exist
- Caveats:
  - Distributional signals require a generalized formulation.
- Counterexamples:
  - Two arbitrary nonintegrable functions need not have a classical convolution.
- Adversarial challenge: Boundary test: Distributional signals require a generalized formulation.
- Response: The proposition is restricted to integrable signals or generalized-signal settings with justified transforms, and the caveat remains explicit.

Decision: [ ] accept  [ ] revise  [ ] defer  [ ] reject

## Correlated equilibrium `correlated-equilibrium`

- Proposed disposition: `propose-node`
- Proposed node type: `model`
- Proposed edge: `correlated-equilibrium —REPRESENTED-BY→ optimization` (`strong-analogy`)
- Source: `osborne-rubinstein-1994`, Part I, Chapter 3, correlated strategic recommendations.
- Proposition: Every mixed-strategy Nash equilibrium induces a correlated equilibrium, but correlation permits additional joint distributions.
- Mathematical skeleton: Obedience inequalities condition each player’s deviation payoff on a private recommendation.
- Scope: Finite strategic games.
- Validity regime: The stated claim is limited to finite strategic games.
- Assumptions:
  - trusted correlation device
- Caveats:
  - A correlated equilibrium is not generally a Nash equilibrium in independent mixed strategies.
- Counterexamples:
  - Recommendation signals can correlate actions in a way no product distribution can match.
- Adversarial challenge: Boundary test: A correlated equilibrium is not generally a Nash equilibrium in independent mixed strategies.
- Response: The proposition is restricted to finite strategic games, and the caveat remains explicit.

Decision: [ ] accept  [ ] revise  [ ] defer  [ ] reject

## Coupling method `coupling-method`

- Proposed disposition: `propose-node`
- Proposed node type: `operation`
- Proposed edge: `coupling-method —APPLIED-IN→ markov-chains` (`theorem`)
- Source: `levin-peres-2017`, Chapter 5, §§5.1–5.4, pp. 66–78.
- Proposition: A coupling bounds mixing by constructing two copies that eventually coalesce.
- Mathematical skeleton: The coupling inequality bounds total variation by the probability that coupled states differ.
- Scope: Markov chains admitting a jointly constructed coupling.
- Validity regime: The stated claim is limited to markov chains admitting a jointly constructed coupling.
- Assumptions:
  - correct marginal transition laws
- Caveats:
  - A poorly chosen coupling can give a vacuous bound.
- Counterexamples:
  - Independent copies may meet far later than an optimized coupling.
- Adversarial challenge: Boundary test: A poorly chosen coupling can give a vacuous bound.
- Response: The proposition is restricted to markov chains admitting a jointly constructed coupling, and the caveat remains explicit.

Decision: [ ] accept  [ ] revise  [ ] defer  [ ] reject

## Detailed balance `detailed-balance`

- Proposed disposition: `propose-node`
- Proposed node type: `principle`
- Proposed edge: `detailed-balance —GOVERNS→ markov-chains` (`theorem`)
- Source: `levin-peres-2017`, Chapter 1, §1.6, pp. 11–13.
- Proposition: Detailed balance implies stationarity by pairing probability flow across each ordered state pair.
- Mathematical skeleton: The identities π(x)P(x,y)=π(y)P(y,x) sum to πP=π.
- Scope: Finite reversible Markov chains.
- Validity regime: The stated claim is limited to finite reversible Markov chains.
- Assumptions:
  - nonnegative normalized π
- Caveats:
  - Stationarity does not imply detailed balance for nonreversible chains.
- Counterexamples:
  - A directed cycle has a stationary law but violates pairwise reversibility.
- Adversarial challenge: Boundary test: Stationarity does not imply detailed balance for nonreversible chains.
- Response: The proposition is restricted to finite reversible Markov chains, and the caveat remains explicit.

Decision: [ ] accept  [ ] revise  [ ] defer  [ ] reject

## Dynamic programming `dynamic-programming`

- Proposed disposition: `propose-node`
- Proposed node type: `operation`
- Proposed edge: `dynamic-programming —IS-A→ optimization` (`special-case`)
- Source: `bertsekas-dp-2017`, Volume I, Chapter 1, §1.3; Chapter 2, §§2.1–2.6.
- Proposition: Dynamic programming solves sequential optimization by decomposing it into state-indexed subproblems.
- Mathematical skeleton: The principle of optimality yields recursive value functions and policies.
- Scope: Problems with a sufficient Markov state and separable stage costs.
- Validity regime: The stated claim is limited to problems with a sufficient Markov state and separable stage costs.
- Assumptions:
  - state summarizes relevant history
- Caveats:
  - State dimension can make exact computation infeasible.
- Counterexamples:
  - A continuous high-dimensional state space produces the curse of dimensionality.
- Adversarial challenge: Boundary test: State dimension can make exact computation infeasible.
- Response: The proposition is restricted to problems with a sufficient Markov state and separable stage costs, and the caveat remains explicit.

Decision: [ ] accept  [ ] revise  [ ] defer  [ ] reject

## Galerkin method `galerkin-method`

- Proposed disposition: `propose-node`
- Proposed node type: `operation`
- Proposed edge: `galerkin-method —APPLIED-IN→ computational-imaging` (`strong-analogy`)
- Source: `evans-pde-2010`, Chapter 6, §6.2, pp. 310–324.
- Proposition: The Galerkin method approximates a weak PDE solution in a finite-dimensional trial space.
- Mathematical skeleton: A variational identity is restricted to a mesh-based subspace, yielding a finite linear or nonlinear system.
- Scope: Galerkin approximations for coercive boundary-value problems.
- Validity regime: The stated claim is limited to galerkin approximations for coercive boundary-value problems.
- Assumptions:
  - weak formulation
  - stable conforming trial space
- Caveats:
  - The edge is approximate: trial-space refinement and stability are needed for convergence.
- Counterexamples:
  - An unstable or nonconforming discretization can fail to converge.
- Adversarial challenge: Boundary test: The edge is approximate: trial-space refinement and stability are needed for convergence.
- Response: The proposition is restricted to galerkin approximations for coercive boundary-value problems, and the caveat remains explicit.

Decision: [ ] accept  [ ] revise  [ ] defer  [ ] reject

## GMRES `gmres`

- Proposed disposition: `propose-node`
- Proposed node type: `operation`
- Proposed edge: `gmres —APPLIED-IN→ optimization` (`theorem`)
- Source: `trefethen-bau-1997`, Lecture 35, pp. 266–275.
- Proposition: GMRES chooses from a Krylov affine space the iterate with minimum Euclidean residual.
- Mathematical skeleton: Arnoldi orthogonalization converts residual minimization to a small Hessenberg least-squares problem.
- Scope: Nonsymmetric linear systems in exact arithmetic or controlled finite precision.
- Validity regime: The stated claim is limited to nonsymmetric linear systems in exact arithmetic or controlled finite precision.
- Assumptions:
  - nonzero initial residual
- Caveats:
  - Memory and orthogonalization costs grow unless the method is restarted.
- Counterexamples:
  - Restarted GMRES can stagnate even when unrestarted GMRES converges.
- Adversarial challenge: Boundary test: Memory and orthogonalization costs grow unless the method is restarted.
- Response: The proposition is restricted to nonsymmetric linear systems in exact arithmetic or controlled finite precision, and the caveat remains explicit.

Decision: [ ] accept  [ ] revise  [ ] defer  [ ] reject

## Ill-posed problem `ill-posed-problem`

- Proposed disposition: `propose-node`
- Proposed node type: `model`
- Proposed edge: `stability —FAILS-WHEN→ ill-posed-problem` (`special-case`)
- Source: `hansen-inverse-2010`, Chapter 2, §§2.1–2.6, pp. 13–34.
- Proposition: An ill-posed inverse problem lacks existence, uniqueness, or stable dependence on data.
- Mathematical skeleton: Small singular values or nonclosed range cause small data perturbations to produce large solution changes.
- Scope: Linear inverse problems in finite discretizations or compact-operator limits.
- Validity regime: The stated claim is limited to linear inverse problems in finite discretizations or compact-operator limits.
- Assumptions:
  - chosen solution and data norms
- Caveats:
  - Finite matrices are formally continuous even when numerically ill-conditioned.
- Counterexamples:
  - A well-conditioned orthogonal forward operator defines a well-posed inverse problem.
- Adversarial challenge: Boundary test: Finite matrices are formally continuous even when numerically ill-conditioned.
- Response: The proposition is restricted to linear inverse problems in finite discretizations or compact-operator limits, and the caveat remains explicit.

Decision: [ ] accept  [ ] revise  [ ] defer  [ ] reject

## Impulse response `impulse-response`

- Proposed disposition: `propose-node`
- Proposed node type: `dialect`
- Proposed edge: `impulse-response —FIELD-DIALECT-OF→ greens-function` (`identity`)
- Source: `siebert-signals-1986`, Chapter 6, unit-sample response and discrete-time convolution.
- Proposition: An LTI system impulse response is the Green-function kernel for its input-output operator.
- Mathematical skeleton: Translation invariance makes the response to an input the convolution with the response to a unit impulse.
- Scope: Linear time-invariant systems with compatible boundary or initial conventions.
- Validity regime: The stated claim is limited to linear time-invariant systems with compatible boundary or initial conventions.
- Assumptions:
  - linearity
  - time invariance
- Caveats:
  - Boundary-dependent Green functions need not be translation invariant.
- Counterexamples:
  - A time-varying system requires a two-time kernel rather than a single impulse response.
- Adversarial challenge: Boundary test: Boundary-dependent Green functions need not be translation invariant.
- Response: The proposition is restricted to linear time-invariant systems with compatible boundary or initial conventions, and the caveat remains explicit.

Decision: [ ] accept  [ ] revise  [ ] defer  [ ] reject

## Inverse problem `inverse-problem`

- Proposed disposition: `propose-node`
- Proposed node type: `model`
- Proposed edge: `inverse-problem —APPLIED-IN→ computational-imaging` (`strong-analogy`)
- Source: `hansen-inverse-2010`, Chapter 1, §§1.1–1.4, pp. 1–12.
- Proposition: An inverse problem infers latent causes or parameters from indirect observed effects.
- Mathematical skeleton: A forward operator maps an unknown x to data b, and inversion seeks x from noisy b.
- Scope: Linear discrete inverse problems arising from measurement operators.
- Validity regime: The stated claim is limited to linear discrete inverse problems arising from measurement operators.
- Assumptions:
  - specified forward model
- Caveats:
  - Nonidentifiability can persist even with noiseless data.
- Counterexamples:
  - A forward operator with a nontrivial nullspace maps different unknowns to the same data.
- Adversarial challenge: Boundary test: Nonidentifiability can persist even with noiseless data.
- Response: The proposition is restricted to linear discrete inverse problems arising from measurement operators, and the caveat remains explicit.

Decision: [ ] accept  [ ] revise  [ ] defer  [ ] reject

## Ito formula `ito-formula`

- Proposed disposition: `propose-node`
- Proposed node type: `theorem`
- Proposed edge: `ito-formula —APPLIED-IN→ option-pricing` (`theorem`)
- Source: `durrett-probability-2019`, Chapter 7, §7.6, Ito formula.
- Proposition: Ito formula is the stochastic chain rule with an additional quadratic-variation term.
- Mathematical skeleton: For dX=b dt+σ dW, the differential of f(X,t) contains one half σ² times the second derivative.
- Scope: Twice spatially differentiable functions of continuous semimartingales.
- Validity regime: The stated claim is limited to twice spatially differentiable functions of continuous semimartingales.
- Assumptions:
  - required smoothness and integrability
- Caveats:
  - Ordinary chain-rule intuition misses the second-order term.
- Counterexamples:
  - Applying the classical chain rule to W_t² omits the dt contribution.
- Adversarial challenge: Boundary test: Ordinary chain-rule intuition misses the second-order term.
- Response: The proposition is restricted to twice spatially differentiable functions of continuous semimartingales, and the caveat remains explicit.

Decision: [ ] accept  [ ] revise  [ ] defer  [ ] reject

## Krylov subspace `krylov-subspace`

- Proposed disposition: `propose-node`
- Proposed node type: `object`
- Proposed edge: `krylov-subspace —APPLIED-IN→ eigenvalues` (`strong-analogy`)
- Source: `trefethen-bau-1997`, Lectures 32–35, pp. 243–275.
- Proposition: A Krylov subspace collects successive applications of a linear operator to a starting vector.
- Mathematical skeleton: K_m(A,b)=span{b,Ab,...,A^{m-1}b} encodes polynomial approximations to operator action.
- Scope: Finite-dimensional iterative linear algebra.
- Validity regime: The stated claim is limited to finite-dimensional iterative linear algebra.
- Assumptions:
  - chosen start vector
- Caveats:
  - A deficient start vector may miss invariant subspaces.
- Counterexamples:
  - If b is an eigenvector, the Krylov space never grows beyond dimension one.
- Adversarial challenge: Boundary test: A deficient start vector may miss invariant subspaces.
- Response: The proposition is restricted to finite-dimensional iterative linear algebra, and the caveat remains explicit.

Decision: [ ] accept  [ ] revise  [ ] defer  [ ] reject

## Markov decision process `markov-decision-process`

- Proposed disposition: `propose-node`
- Proposed node type: `model`
- Proposed edge: `markov-decision-process —IS-A→ state-space-model` (`theorem`)
- Source: `bertsekas-dp-2017`, Volume I, Chapter 1, §§1.1–1.3; Chapter 2.
- Proposition: A Markov decision process models controlled stochastic transitions with state-dependent rewards or costs.
- Mathematical skeleton: A policy selects actions and induces a controlled Markov kernel whose accumulated criterion is optimized.
- Scope: Finite-state finite-action MDPs under a stated horizon and criterion.
- Validity regime: The stated claim is limited to finite-state finite-action MDPs under a stated horizon and criterion.
- Assumptions:
  - Markov transition law
- Caveats:
  - Partial observability requires a belief-state reformulation.
- Counterexamples:
  - If the current observation is not a sufficient state, ordinary MDP policies can be suboptimal.
- Adversarial challenge: Boundary test: Partial observability requires a belief-state reformulation.
- Response: The proposition is restricted to finite-state finite-action MDPs under a stated horizon and criterion, and the caveat remains explicit.

Decision: [ ] accept  [ ] revise  [ ] defer  [ ] reject

## Martingale `martingale`

- Proposed disposition: `propose-node`
- Proposed node type: `object`
- Proposed edge: `martingale —APPLIED-IN→ option-pricing` (`theorem`)
- Source: `durrett-probability-2019`, Chapter 5, martingales.
- Proposition: A martingale has conditional expected future value equal to its present value relative to a filtration.
- Mathematical skeleton: E[X_{n+1}|F_n]=X_n encodes fair-game evolution under the chosen information flow.
- Scope: Integrable discrete-time processes adapted to a filtration.
- Validity regime: The stated claim is limited to integrable discrete-time processes adapted to a filtration.
- Assumptions:
  - integrability
  - adaptedness
- Caveats:
  - Changing probability measure or numeraire changes the martingale property.
- Counterexamples:
  - A process with positive conditional drift is a submartingale, not a martingale.
- Adversarial challenge: Boundary test: Changing probability measure or numeraire changes the martingale property.
- Response: The proposition is restricted to integrable discrete-time processes adapted to a filtration, and the caveat remains explicit.

Decision: [ ] accept  [ ] revise  [ ] defer  [ ] reject

## Maximum principle `maximum-principle`

- Proposed disposition: `propose-node`
- Proposed node type: `theorem`
- Proposed edge: `maximum-principle —GOVERNS→ stability` (`theorem`)
- Source: `evans-pde-2010`, Chapter 2, §2.2.3, pp. 27–35; Chapter 6, §6.4, pp. 333–347.
- Proposition: A maximum principle bounds an elliptic or parabolic solution by boundary and forcing data.
- Mathematical skeleton: The differential inequality prevents an interior strict extremum unless the solution is suitably degenerate.
- Scope: Uniformly elliptic or parabolic equations under the stated sign and regularity hypotheses.
- Validity regime: The stated claim is limited to uniformly elliptic or parabolic equations under the stated sign and regularity hypotheses.
- Assumptions:
  - appropriate ellipticity
  - connected domain
- Caveats:
  - The principle can fail for the wrong zeroth-order sign or nonelliptic operators.
- Counterexamples:
  - A reaction term with the wrong sign permits an interior maximum.
- Adversarial challenge: Boundary test: The principle can fail for the wrong zeroth-order sign or nonelliptic operators.
- Response: The proposition is restricted to uniformly elliptic or parabolic equations under the stated sign and regularity hypotheses, and the caveat remains explicit.

Decision: [ ] accept  [ ] revise  [ ] defer  [ ] reject

## Method of characteristics `method-of-characteristics`

- Proposed disposition: `propose-node`
- Proposed node type: `operation`
- Proposed edge: `method-of-characteristics —REPRESENTED-BY→ phase-space` (`theorem`)
- Source: `evans-pde-2010`, Chapter 2, §2.1, pp. 18–20; Chapter 3, §3.2, pp. 101–115.
- Proposition: The method of characteristics converts a first-order PDE into ODEs along characteristic curves.
- Mathematical skeleton: The PDE derivative becomes a directional derivative along a flow in state space.
- Scope: Smooth first-order transport and Hamilton-Jacobi equations before characteristic crossing.
- Validity regime: The stated claim is limited to smooth first-order transport and Hamilton-Jacobi equations before characteristic crossing.
- Assumptions:
  - sufficiently regular coefficients
  - local characteristic flow
- Caveats:
  - Characteristics can intersect and destroy classical single-valued solutions.
- Counterexamples:
  - Burgers characteristics cross at shock formation.
- Adversarial challenge: Boundary test: Characteristics can intersect and destroy classical single-valued solutions.
- Response: The proposition is restricted to smooth first-order transport and Hamilton-Jacobi equations before characteristic crossing, and the caveat remains explicit.

Decision: [ ] accept  [ ] revise  [ ] defer  [ ] reject

## Metropolis-Hastings algorithm `metropolis-hastings-algorithm`

- Proposed disposition: `propose-node`
- Proposed node type: `operation`
- Proposed edge: `metropolis-hastings-algorithm —APPLIED-IN→ markov-chains` (`strong-analogy`)
- Source: `levin-peres-2017`, Chapter 3, §3.2, pp. 44–46.
- Proposition: Metropolis-Hastings constructs a reversible Markov chain with a prescribed stationary distribution.
- Mathematical skeleton: An acceptance ratio corrects a proposal kernel so detailed balance holds for the target law.
- Scope: Targets and proposals with compatible support.
- Validity regime: The stated claim is limited to targets and proposals with compatible support.
- Assumptions:
  - computable density ratio
  - irreducible proposal on target support
- Caveats:
  - Stationarity does not guarantee rapid mixing.
- Counterexamples:
  - A local proposal on a multimodal target can mix exponentially slowly.
- Adversarial challenge: Boundary test: Stationarity does not guarantee rapid mixing.
- Response: The proposition is restricted to targets and proposals with compatible support, and the caveat remains explicit.

Decision: [ ] accept  [ ] revise  [ ] defer  [ ] reject

## Minimax theorem `minimax-theorem`

- Proposed disposition: `propose-node`
- Proposed node type: `theorem`
- Proposed edge: `minimax-theorem —GOVERNS→ optimization` (`theorem`)
- Source: `osborne-rubinstein-1994`, Part I, Chapter 3, §§3.2–3.3.
- Proposition: The minimax theorem equates maximin and minimax values in finite two-player zero-sum games with mixed strategies.
- Mathematical skeleton: Convexification by probability simplices permits interchange of max and min.
- Scope: Finite two-player zero-sum games.
- Validity regime: The stated claim is limited to finite two-player zero-sum games.
- Assumptions:
  - mixed strategies allowed
- Caveats:
  - The equality generally fails outside zero-sum or suitable convex-concave settings.
- Counterexamples:
  - A general-sum bimatrix game has no single opposing value to equate.
- Adversarial challenge: Boundary test: The equality generally fails outside zero-sum or suitable convex-concave settings.
- Response: The proposition is restricted to finite two-player zero-sum games, and the caveat remains explicit.

Decision: [ ] accept  [ ] revise  [ ] defer  [ ] reject

## Mixed strategy `mixed-strategy`

- Proposed disposition: `propose-node`
- Proposed node type: `object`
- Proposed edge: `mixed-strategy —REPRESENTED-BY→ optimization` (`theorem`)
- Source: `osborne-rubinstein-1994`, Part I, Chapter 3, pp. 43–78.
- Proposition: A mixed strategy is a probability distribution over a player’s pure actions.
- Mathematical skeleton: Expected utility extends multilinearly from pure action profiles to product distributions.
- Scope: Finite strategic games.
- Validity regime: The stated claim is limited to finite strategic games.
- Assumptions:
  - randomization independently implemented unless correlation is modeled
- Caveats:
  - Mixing can represent deliberate randomization or population frequencies, which are different interpretations.
- Counterexamples:
  - A correlated device produces joint distributions not expressible as independent mixed strategies.
- Adversarial challenge: Boundary test: Mixing can represent deliberate randomization or population frequencies, which are different interpretations.
- Response: The proposition is restricted to finite strategic games, and the caveat remains explicit.

Decision: [ ] accept  [ ] revise  [ ] defer  [ ] reject

## Mixing time `mixing-time`

- Proposed disposition: `propose-node`
- Proposed node type: `principle`
- Proposed edge: `mixing-time —MEASURES-DISTANCE-TO→ markov-chains` (`theorem`)
- Source: `levin-peres-2017`, Chapter 4, §§4.1–4.5, pp. 47–65.
- Proposition: Mixing time quantifies how long a Markov chain takes to approach stationarity in total variation distance.
- Mathematical skeleton: It is the first time after which the worst-start total variation distance falls below a fixed threshold.
- Scope: Finite irreducible aperiodic chains.
- Validity regime: The stated claim is limited to finite irreducible aperiodic chains.
- Assumptions:
  - unique stationary distribution
- Caveats:
  - The numerical value depends on the distance threshold convention.
- Counterexamples:
  - A periodic chain need not converge in total variation.
- Adversarial challenge: Boundary test: The numerical value depends on the distance threshold convention.
- Response: The proposition is restricted to finite irreducible aperiodic chains, and the caveat remains explicit.

Decision: [ ] accept  [ ] revise  [ ] defer  [ ] reject

## Nash equilibrium `nash-equilibrium`

- Proposed disposition: `propose-node`
- Proposed node type: `model`
- Proposed edge: `nash-equilibrium —REPRESENTED-BY→ optimization` (`strong-analogy`)
- Source: `osborne-rubinstein-1994`, Part I, Chapter 2, pp. 11–42.
- Proposition: A Nash equilibrium is a strategy profile in which no player benefits from a unilateral deviation.
- Mathematical skeleton: Each component is a best response to the others, giving a coupled fixed-point condition.
- Scope: Finite strategic games, allowing mixed strategies when stated.
- Validity regime: The stated claim is limited to finite strategic games, allowing mixed strategies when stated.
- Assumptions:
  - common knowledge of the game
- Caveats:
  - Equilibrium may be nonunique and does not imply efficiency.
- Counterexamples:
  - The prisoner dilemma equilibrium is Pareto dominated.
- Adversarial challenge: Boundary test: Equilibrium may be nonunique and does not imply efficiency.
- Response: The proposition is restricted to finite strategic games, allowing mixed strategies when stated, and the caveat remains explicit.

Decision: [ ] accept  [ ] revise  [ ] defer  [ ] reject

## Network centrality `network-centrality`

- Proposed disposition: `propose-node`
- Proposed node type: `principle`
- Proposed edge: `pagerank —IS-A→ network-centrality` (`strong-analogy`)
- Source: `newman-networks-2018`, Chapter 7, measures and metrics.
- Proposition: Network centrality assigns node scores intended to quantify a chosen notion of structural importance.
- Mathematical skeleton: Degree, paths, eigenvectors, or random-walk visitation induce distinct score functionals.
- Scope: Finite networks with a declared centrality definition.
- Validity regime: The stated claim is limited to finite networks with a declared centrality definition.
- Assumptions:
  - chosen graph direction and weighting conventions
- Caveats:
  - Centrality is not a single invariant notion of importance.
- Counterexamples:
  - A bridge node can have high betweenness but low eigenvector centrality.
- Adversarial challenge: Boundary test: Centrality is not a single invariant notion of importance.
- Response: The proposition is restricted to finite networks with a declared centrality definition, and the caveat remains explicit.

Decision: [ ] accept  [ ] revise  [ ] defer  [ ] reject

## Nyquist stability criterion `nyquist-stability-criterion`

- Proposed disposition: `propose-node`
- Proposed node type: `theorem`
- Proposed edge: `nyquist-stability-criterion —GOVERNS→ stability` (`theorem`)
- Source: `astrom-murray-2020`, Chapter 10, §§10.2–10.4.
- Proposition: The Nyquist criterion determines closed-loop stability from encirclements of the critical point by the open-loop frequency response.
- Mathematical skeleton: The argument principle relates winding number to right-half-plane zeros of the closed-loop characteristic function.
- Scope: Proper rational feedback loops with a specified contour convention.
- Validity regime: The stated claim is limited to proper rational feedback loops with a specified contour convention.
- Assumptions:
  - known open-loop unstable poles
  - no unhandled contour singularities
- Caveats:
  - Sign and contour conventions change the reported encirclement direction.
- Counterexamples:
  - Ignoring an imaginary-axis pole invalidates the ordinary contour count.
- Adversarial challenge: Boundary test: Sign and contour conventions change the reported encirclement direction.
- Response: The proposition is restricted to proper rational feedback loops with a specified contour convention, and the caveat remains explicit.

Decision: [ ] accept  [ ] revise  [ ] defer  [ ] reject

## Observability `observability`

- Proposed disposition: `propose-node`
- Proposed node type: `principle`
- Proposed edge: `observability —GOVERNS→ state-space-model` (`theorem`)
- Source: `astrom-murray-2020`, Chapter 6, §§6.4–6.5.
- Proposition: Observability determines whether an initial state is uniquely recoverable from input-output data.
- Mathematical skeleton: Full rank of the observability matrix eliminates indistinguishable state directions.
- Scope: Finite-dimensional continuous-time LTI systems.
- Validity regime: The stated claim is limited to finite-dimensional continuous-time LTI systems.
- Assumptions:
  - known input
  - noise-free finite observation interval
- Caveats:
  - Poor observability can make reconstruction numerically fragile before rank is lost.
- Counterexamples:
  - Nearly collinear output modes produce an ill-conditioned observability matrix.
- Adversarial challenge: Boundary test: Poor observability can make reconstruction numerically fragile before rank is lost.
- Response: The proposition is restricted to finite-dimensional continuous-time LTI systems, and the caveat remains explicit.

Decision: [ ] accept  [ ] revise  [ ] defer  [ ] reject

## Optional stopping theorem `optional-stopping-theorem`

- Proposed disposition: `propose-node`
- Proposed node type: `theorem`
- Proposed edge: `optional-stopping-theorem —APPLIED-IN→ option-pricing` (`theorem`)
- Source: `durrett-probability-2019`, Chapter 5, §5.7, optional stopping.
- Proposition: Optional stopping preserves martingale expectation only under stated boundedness or integrability conditions.
- Mathematical skeleton: Stopped martingales have controlled expectations when the stopping time and increments prevent mass escaping at infinity.
- Scope: Discrete-time martingales under one of the theorem’s standard sufficient conditions.
- Validity regime: The stated claim is limited to discrete-time martingales under one of the theorem’s standard sufficient conditions.
- Assumptions:
  - valid stopping-time condition
  - uniform integrability or boundedness condition
- Caveats:
  - The slogan that fair games remain fair at any stopping time is false without hypotheses.
- Counterexamples:
  - A doubling strategy uses an unbounded stopping time and violates the naive conclusion.
- Adversarial challenge: Boundary test: The slogan that fair games remain fair at any stopping time is false without hypotheses.
- Response: The proposition is restricted to discrete-time martingales under one of the theorem’s standard sufficient conditions, and the caveat remains explicit.

Decision: [ ] accept  [ ] revise  [ ] defer  [ ] reject

## Percolation on networks `percolation-on-networks`

- Proposed disposition: `propose-node`
- Proposed node type: `phenomenon`
- Proposed edge: `percolation-on-networks —SAME-SKELETON→ epidemic-modeling` (`strong-analogy`)
- Source: `newman-networks-2018`, Chapter 15, percolation and network resilience.
- Proposition: Network percolation and epidemic models share threshold behavior governed by connectivity and transmissibility.
- Mathematical skeleton: Occupied edges or successful transmissions generate connected clusters through the same branching structure in suitable SIR limits.
- Scope: Locally tree-like networks and bond-percolation mappings of final outbreak size.
- Validity regime: The stated claim is limited to locally tree-like networks and bond-percolation mappings of final outbreak size.
- Assumptions:
  - independent transmission or occupation in the mapping
- Caveats:
  - Temporal correlations and reinfection break the simple static percolation equivalence.
- Counterexamples:
  - SIS dynamics can persist without corresponding to a one-shot occupied cluster.
- Adversarial challenge: Boundary test: Temporal correlations and reinfection break the simple static percolation equivalence.
- Response: The proposition is restricted to locally tree-like networks and bond-percolation mappings of final outbreak size, and the caveat remains explicit.

Decision: [ ] accept  [ ] revise  [ ] defer  [ ] reject

## PID controller `pid-controller`

- Proposed disposition: `propose-node`
- Proposed node type: `operation`
- Proposed edge: `pid-controller —APPLIED-IN→ process-control` (`strong-analogy`)
- Source: `astrom-murray-2020`, Chapter 11, §§11.1–11.5.
- Proposition: A PID controller combines proportional, integral, and derivative actions on tracking error.
- Mathematical skeleton: The control signal weights present error, accumulated error, and error rate.
- Scope: Single-loop feedback with implementable filtering and anti-windup provisions.
- Validity regime: The stated claim is limited to single-loop feedback with implementable filtering and anti-windup provisions.
- Assumptions:
  - measured tracking error
- Caveats:
  - Derivative action amplifies measurement noise and integral action can wind up.
- Counterexamples:
  - An ideal differentiator driven by white measurement noise has unbounded output variance.
- Adversarial challenge: Boundary test: Derivative action amplifies measurement noise and integral action can wind up.
- Response: The proposition is restricted to single-loop feedback with implementable filtering and anti-windup provisions, and the caveat remains explicit.

Decision: [ ] accept  [ ] revise  [ ] defer  [ ] reject

## Poisson process `poisson-process`

- Proposed disposition: `propose-node`
- Proposed node type: `model`
- Proposed edge: `poisson-process —APPLIED-IN→ epidemic-modeling` (`theorem`)
- Source: `durrett-probability-2019`, Chapter 2, Poisson processes, §§2.5–2.7.
- Proposition: A Poisson process models independent events arriving at a constant rate.
- Mathematical skeleton: Counts have Poisson increments and exponential waiting times with the memoryless property.
- Scope: Homogeneous point processes on the nonnegative time line.
- Validity regime: The stated claim is limited to homogeneous point processes on the nonnegative time line.
- Assumptions:
  - constant rate
  - independent increments
- Caveats:
  - Overdispersion or history dependence violates the homogeneous Poisson model.
- Counterexamples:
  - A self-exciting event stream has clustered arrivals rather than independent increments.
- Adversarial challenge: Boundary test: Overdispersion or history dependence violates the homogeneous Poisson model.
- Response: The proposition is restricted to homogeneous point processes on the nonnegative time line, and the caveat remains explicit.

Decision: [ ] accept  [ ] revise  [ ] defer  [ ] reject

## Policy iteration `policy-iteration`

- Proposed disposition: `propose-node`
- Proposed node type: `operation`
- Proposed edge: `policy-iteration —APPLIED-IN→ markov-chains` (`theorem`)
- Source: `bertsekas-dp-2017`, Volume I, Chapter 2, §§2.5–2.6.
- Proposition: Policy iteration alternates exact policy evaluation with greedy policy improvement.
- Mathematical skeleton: Each improvement weakly lowers cost until a policy is Bellman optimal.
- Scope: Finite discounted MDPs with exact arithmetic.
- Validity regime: The stated claim is limited to finite discounted MDPs with exact arithmetic.
- Assumptions:
  - finite policy set
- Caveats:
  - Approximate evaluation can break monotone improvement without error control.
- Counterexamples:
  - A noisy value estimate can choose a worse greedy action.
- Adversarial challenge: Boundary test: Approximate evaluation can break monotone improvement without error control.
- Response: The proposition is restricted to finite discounted MDPs with exact arithmetic, and the caveat remains explicit.

Decision: [ ] accept  [ ] revise  [ ] defer  [ ] reject

## QR factorization `qr-factorization`

- Proposed disposition: `propose-node`
- Proposed node type: `operation`
- Proposed edge: `qr-factorization —APPLIED-IN→ optimization` (`theorem`)
- Source: `trefethen-bau-1997`, Lectures 7–11, pp. 48–88.
- Proposition: QR factorization reduces a full-rank least-squares problem to a triangular solve.
- Mathematical skeleton: A = QR preserves Euclidean residual norms because Q has orthonormal columns.
- Scope: Overdetermined full-column-rank linear least squares.
- Validity regime: The stated claim is limited to overdetermined full-column-rank linear least squares.
- Assumptions:
  - full column rank
- Caveats:
  - Normal equations and QR have different numerical conditioning.
- Counterexamples:
  - Rank deficiency requires pivoting or a rank-revealing method.
- Adversarial challenge: Boundary test: Normal equations and QR have different numerical conditioning.
- Response: The proposition is restricted to overdetermined full-column-rank linear least squares, and the caveat remains explicit.

Decision: [ ] accept  [ ] revise  [ ] defer  [ ] reject

## Random graph `random-graph`

- Proposed disposition: `propose-node`
- Proposed node type: `model`
- Proposed edge: `random-graph —REPRESENTED-BY→ graph-laplacian` (`special-case`)
- Source: `newman-networks-2018`, Chapter 11, random graphs.
- Proposition: A random graph is a probability distribution over graph-valued outcomes.
- Mathematical skeleton: Edges, degrees, or other structure are sampled according to a specified generative law.
- Scope: Finite random graph ensembles.
- Validity regime: The stated claim is limited to finite random graph ensembles.
- Assumptions:
  - explicit probability model
- Caveats:
  - Different ensembles with similar mean degree can have different higher-order structure.
- Counterexamples:
  - A configuration model and an Erdos-Renyi graph can share mean degree but differ in degree variance.
- Adversarial challenge: Boundary test: Different ensembles with similar mean degree can have different higher-order structure.
- Response: The proposition is restricted to finite random graph ensembles, and the caveat remains explicit.

Decision: [ ] accept  [ ] revise  [ ] defer  [ ] reject

## Regularization `regularization`

- Proposed disposition: `propose-node`
- Proposed node type: `principle`
- Proposed edge: `regularization —GOVERNS→ stability` (`strong-analogy`)
- Source: `hansen-inverse-2010`, Chapter 4, §§4.1–4.7, pp. 53–83.
- Proposition: Regularization trades exact data fit for stability by suppressing poorly determined solution components.
- Mathematical skeleton: A parameterized approximation filters directions that amplify noise.
- Scope: Noisy linear discrete inverse problems.
- Validity regime: The stated claim is limited to noisy linear discrete inverse problems.
- Assumptions:
  - noise or prior scale
- Caveats:
  - Too much regularization erases real structure and too little amplifies noise.
- Counterexamples:
  - Taking the regularization parameter to infinity can collapse the estimate toward a trivial prior.
- Adversarial challenge: Boundary test: Too much regularization erases real structure and too little amplifies noise.
- Response: The proposition is restricted to noisy linear discrete inverse problems, and the caveat remains explicit.

Decision: [ ] accept  [ ] revise  [ ] defer  [ ] reject

## Sampling theorem `sampling-theorem`

- Proposed disposition: `propose-node`
- Proposed node type: `theorem`
- Proposed edge: `sampling-theorem —APPLIED-IN→ digital-communications` (`theorem`)
- Source: `siebert-signals-1986`, Chapter 12, sampling in time and frequency.
- Proposition: A bandlimited signal is determined by uniformly spaced samples taken above twice its highest frequency.
- Mathematical skeleton: Spectral replicas created by sampling remain disjoint above the Nyquist rate and can be ideally filtered.
- Scope: Exactly bandlimited continuous-time signals with ideal uniform sampling.
- Validity regime: The stated claim is limited to exactly bandlimited continuous-time signals with ideal uniform sampling.
- Assumptions:
  - strict bandlimit
  - sampling clock without jitter
- Caveats:
  - Real signals are rarely exactly bandlimited and ideal reconstruction is noncausal.
- Counterexamples:
  - A sinusoid above the Nyquist frequency aliases to a lower sampled frequency.
- Adversarial challenge: Boundary test: Real signals are rarely exactly bandlimited and ideal reconstruction is noncausal.
- Response: The proposition is restricted to exactly bandlimited continuous-time signals with ideal uniform sampling, and the caveat remains explicit.

Decision: [ ] accept  [ ] revise  [ ] defer  [ ] reject

## Singular value decomposition `singular-value-decomposition`

- Proposed disposition: `propose-node`
- Proposed node type: `object`
- Proposed edge: `singular-value-decomposition —APPLIED-IN→ computational-imaging` (`theorem`)
- Source: `trefethen-bau-1997`, Lectures 4–5, pp. 25–38.
- Proposition: The singular value decomposition expresses a matrix as orthogonal input and output directions linked by nonnegative gains.
- Mathematical skeleton: A = UΣV* separates domain directions, amplification factors, and range directions.
- Scope: Finite real or complex matrices.
- Validity regime: The stated claim is limited to finite real or complex matrices.
- Assumptions:
  - finite-dimensional inner-product spaces
- Caveats:
  - Small singular values amplify inverse-problem noise.
- Counterexamples:
  - A rank-deficient matrix has no ordinary inverse despite having an SVD.
- Adversarial challenge: Boundary test: Small singular values amplify inverse-problem noise.
- Response: The proposition is restricted to finite real or complex matrices, and the caveat remains explicit.

Decision: [ ] accept  [ ] revise  [ ] defer  [ ] reject

## Sobolev space `sobolev-space`

- Proposed disposition: `propose-node`
- Proposed node type: `object`
- Proposed edge: `sobolev-space —GOVERNS→ smoothness` (`theorem`)
- Source: `evans-pde-2010`, Chapter 5, §§5.1–5.8, pp. 253–296.
- Proposition: A Sobolev space controls functions through integrability of weak derivatives.
- Mathematical skeleton: The norm combines an Lp size with the Lp sizes of weak derivatives up to a fixed order.
- Scope: Integer-order Sobolev spaces on open Euclidean domains.
- Validity regime: The stated claim is limited to integer-order Sobolev spaces on open Euclidean domains.
- Assumptions:
  - measurable functions modulo equality almost everywhere
- Caveats:
  - Sobolev regularity does not generally imply pointwise differentiability.
- Counterexamples:
  - A W^{1,p} function below the embedding threshold need not be continuous.
- Adversarial challenge: Boundary test: Sobolev regularity does not generally imply pointwise differentiability.
- Response: The proposition is restricted to integer-order Sobolev spaces on open Euclidean domains, and the caveat remains explicit.

Decision: [ ] accept  [ ] revise  [ ] defer  [ ] reject

## Stationary distribution `stationary-distribution`

- Proposed disposition: `propose-node`
- Proposed node type: `object`
- Proposed edge: `stationary-distribution —GOVERNS→ markov-chains` (`theorem`)
- Source: `levin-peres-2017`, Chapter 1, §§1.3–1.7, pp. 4–15.
- Proposition: A stationary distribution is unchanged by one transition of a Markov chain.
- Mathematical skeleton: The probability row vector π satisfies πP = π.
- Scope: Finite-state Markov chains.
- Validity regime: The stated claim is limited to finite-state Markov chains.
- Assumptions:
  - stochastic transition matrix
- Caveats:
  - Stationarity need not be unique without irreducibility.
- Counterexamples:
  - A chain with two closed classes has multiple stationary distributions.
- Adversarial challenge: Boundary test: Stationarity need not be unique without irreducibility.
- Response: The proposition is restricted to finite-state Markov chains, and the caveat remains explicit.

Decision: [ ] accept  [ ] revise  [ ] defer  [ ] reject

## Subgame-perfect equilibrium `subgame-perfect-equilibrium`

- Proposed disposition: `propose-node`
- Proposed node type: `model`
- Proposed edge: `subgame-perfect-equilibrium —REPRESENTED-BY→ optimization` (`special-case`)
- Source: `osborne-rubinstein-1994`, Part II, Chapter 6, pp. 97–124.
- Proposition: A subgame-perfect equilibrium is a Nash equilibrium in every subgame of an extensive-form game.
- Mathematical skeleton: Sequential rationality removes noncredible threats by imposing equilibrium after every history defining a subgame.
- Scope: Finite extensive games with proper subgames.
- Validity regime: The stated claim is limited to finite extensive games with proper subgames.
- Assumptions:
  - well-defined continuation games
- Caveats:
  - Games of imperfect information can have few or no proper subgames, requiring stronger refinements.
- Counterexamples:
  - A Nash profile supported by an incredible off-path threat is not subgame perfect.
- Adversarial challenge: Boundary test: Games of imperfect information can have few or no proper subgames, requiring stronger refinements.
- Response: The proposition is restricted to finite extensive games with proper subgames, and the caveat remains explicit.

Decision: [ ] accept  [ ] revise  [ ] defer  [ ] reject

## Tikhonov regularization `tikhonov-regularization`

- Proposed disposition: `propose-node`
- Proposed node type: `operation`
- Proposed edge: `tikhonov-regularization —IS-A→ optimization` (`special-case`)
- Source: `hansen-inverse-2010`, Chapter 4, §4.4, pp. 65–70.
- Proposition: Tikhonov regularization minimizes data misfit plus a weighted quadratic penalty.
- Mathematical skeleton: The solution balances ||Ax-b||² against λ²||Lx||².
- Scope: Linear inverse problems with a chosen penalty operator.
- Validity regime: The stated claim is limited to linear inverse problems with a chosen penalty operator.
- Assumptions:
  - positive regularization parameter
- Caveats:
  - The result depends materially on the penalty and parameter choice.
- Counterexamples:
  - An identity penalty oversmooths a solution whose meaningful structure lies in a rough component.
- Adversarial challenge: Boundary test: The result depends materially on the penalty and parameter choice.
- Response: The proposition is restricted to linear inverse problems with a chosen penalty operator, and the caveat remains explicit.

Decision: [ ] accept  [ ] revise  [ ] defer  [ ] reject

## Transfer function `transfer-function`

- Proposed disposition: `propose-node`
- Proposed node type: `dialect`
- Proposed edge: `transfer-function —FIELD-DIALECT-OF→ state-space-model` (`strong-analogy`)
- Source: `astrom-murray-2020`, Chapter 9, §§9.1–9.3.
- Proposition: A transfer function is the frequency-domain input-output representation of an LTI state-space model under zero initial conditions.
- Mathematical skeleton: G(s)=C(sI-A)^{-1}B+D maps transformed inputs to outputs.
- Scope: Finite-dimensional linear time-invariant systems.
- Validity regime: The stated claim is limited to finite-dimensional linear time-invariant systems.
- Assumptions:
  - zero initial condition
  - Laplace transform exists
- Caveats:
  - Different state realizations can share the same transfer function.
- Counterexamples:
  - Unobservable internal modes do not appear in the transfer function.
- Adversarial challenge: Boundary test: Different state realizations can share the same transfer function.
- Response: The proposition is restricted to finite-dimensional linear time-invariant systems, and the caveat remains explicit.

Decision: [ ] accept  [ ] revise  [ ] defer  [ ] reject

## Truncated singular value decomposition `truncated-singular-value-decomposition`

- Proposed disposition: `propose-node`
- Proposed node type: `operation`
- Proposed edge: `truncated-singular-value-decomposition —IS-A→ optimization` (`special-case`)
- Source: `hansen-inverse-2010`, Chapter 4, §4.2, pp. 56–61.
- Proposition: Truncated SVD regularizes inversion by discarding components associated with small singular values.
- Mathematical skeleton: Only singular components above a selected index or threshold are inverted.
- Scope: Linear inverse problems with an informative spectral ordering.
- Validity regime: The stated claim is limited to linear inverse problems with an informative spectral ordering.
- Assumptions:
  - available SVD
  - selected truncation level
- Caveats:
  - A hard cutoff can introduce artifacts and is expensive at large scale.
- Counterexamples:
  - Signal aligned with a discarded singular vector is lost completely.
- Adversarial challenge: Boundary test: A hard cutoff can introduce artifacts and is expensive at large scale.
- Response: The proposition is restricted to linear inverse problems with an informative spectral ordering, and the caveat remains explicit.

Decision: [ ] accept  [ ] revise  [ ] defer  [ ] reject

## Value iteration `value-iteration`

- Proposed disposition: `propose-node`
- Proposed node type: `operation`
- Proposed edge: `value-iteration —APPLIED-IN→ markov-chains` (`theorem`)
- Source: `bertsekas-dp-2017`, Volume I, Chapter 2, §§2.2–2.4.
- Proposition: Value iteration repeatedly applies the Bellman optimality operator to approximate an MDP value function.
- Mathematical skeleton: Discounting makes the Bellman operator a contraction with the optimal value as unique fixed point.
- Scope: Finite discounted MDPs.
- Validity regime: The stated claim is limited to finite discounted MDPs.
- Assumptions:
  - discount factor below one
- Caveats:
  - Convergence can be slow when the discount factor is close to one.
- Counterexamples:
  - Undiscounted multichain problems need not satisfy the same contraction proof.
- Adversarial challenge: Boundary test: Convergence can be slow when the discount factor is close to one.
- Response: The proposition is restricted to finite discounted MDPs, and the caveat remains explicit.

Decision: [ ] accept  [ ] revise  [ ] defer  [ ] reject

## Weak solution `weak-solution`

- Proposed disposition: `propose-node`
- Proposed node type: `model`
- Proposed edge: `weak-solution —REPRESENTED-BY→ vector-calculus` (`strong-analogy`)
- Source: `evans-pde-2010`, Chapter 1, §1.3.2, pp. 7–9; Chapter 6, §6.1, pp. 297–310.
- Proposition: A weak solution satisfies an integrated PDE identity without requiring all classical derivatives to exist.
- Mathematical skeleton: Derivatives are transferred to test functions by integration by parts, producing an integral identity.
- Scope: Weak formulations of PDEs on domains with specified boundary data.
- Validity regime: The stated claim is limited to weak formulations of PDEs on domains with specified boundary data.
- Assumptions:
  - locally integrable unknown
  - admissible test functions
- Caveats:
  - Weak solutions may be nonunique without additional estimates or entropy conditions.
- Counterexamples:
  - A distribution satisfying the equation can fail required boundary or energy conditions.
- Adversarial challenge: Boundary test: Weak solutions may be nonunique without additional estimates or entropy conditions.
- Response: The proposition is restricted to weak formulations of PDEs on domains with specified boundary data, and the caveat remains explicit.

Decision: [ ] accept  [ ] revise  [ ] defer  [ ] reject

## Z-transform `z-transform`

- Proposed disposition: `propose-node`
- Proposed node type: `operation`
- Proposed edge: `z-transform —IS-A→ integral-transforms` (`special-case`)
- Source: `siebert-signals-1986`, Chapter 5, unilateral Z-transform and its applications.
- Proposition: The Z-transform represents a discrete sequence as a complex power series.
- Mathematical skeleton: X(z)=Σ x[n]z^{-n} converts shifts and convolution into algebraic factors and products.
- Scope: One- or two-sided discrete-time sequences with a stated region of convergence.
- Validity regime: The stated claim is limited to one- or two-sided discrete-time sequences with a stated region of convergence.
- Assumptions:
  - nonempty region of convergence
- Caveats:
  - The algebraic expression alone does not determine the sequence without its convergence region.
- Counterexamples:
  - The same rational function can encode causal or anticausal sequences.
- Adversarial challenge: Boundary test: The algebraic expression alone does not determine the sequence without its convergence region.
- Response: The proposition is restricted to one- or two-sided discrete-time sequences with a stated region of convergence, and the caveat remains explicit.

Decision: [ ] accept  [ ] revise  [ ] defer  [ ] reject
