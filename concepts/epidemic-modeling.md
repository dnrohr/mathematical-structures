---
canonical_name: Epidemic modeling and forecasting
node_type: application
status: established
summary: >
  Predicting and steering the spread of infection — the domain problem
  where the continuous-time Markov chain, its large-population limit, the
  R₀ = 1 threshold bifurcation, spectral thresholds on networks, and
  Bayesian nowcasting converge on the models public-health decisions lean
  on.
fields: [biology, networks, probability]
aliases:
  - name: compartmental models (SIR/SEIR) / the basic reproduction number R₀
    field: biology
  - name: network epidemiology / epidemic threshold
    field: networks
  - name: stochastic epidemics — branching onset and density-dependent chains
    field: probability
canonical_examples:
  - "Stochastic SIR: infections and recoveries as exponential clocks — a continuous-time Markov chain the deterministic ODE shadows at large population"
  - "The threshold theorem: an epidemic takes off only when R₀ exceeds one"
  - "Weekly reproduction-number estimates from case counts via the renewal equation"
---

Epidemic models are small — a handful of compartments, two or three rates
— and that is exactly why they demonstrate this map so cleanly: each
question public health actually asks ("will it take off?", "how big?",
"what is R now?") is answered by a different structure, and the honest
strengths differ between claims about the equations and claims about an
outbreak.

**The model is a Markov chain.** The stochastic SIR model tracks
susceptible and infected counts as a continuous-time
[[markov-chains|Markov chain]]: infection events at rate
$\beta S I / N$, recoveries at rate $\gamma I$, exponential clocks and
memorylessness doing the bookkeeping. Early spread — a few cases in a
large population — is a branching process, which is where the take-off
versus die-out probabilities come from: even above threshold, an
introduction can go extinct by chance, and the chain computes exactly how
often.

**The famous curves are its large-population limit.** The deterministic
SIR equations are not a separate model: they are the chain's
law-of-large-numbers limit as population grows, by Kurtz's theorem on
density-dependent Markov chains — a [[large-number-limits|large-number
limit]] with a name and hypotheses. The ODE describes typical paths,
fluctuations around it are CLT-scale, and the phases where counts are
small (introduction, near-elimination) stay stochastic no matter how
large the population — the honest reading of when the smooth curve can be
trusted.

**The threshold is a bifurcation.** $R_0 = 1$ is a transcritical
[[bifurcation]]: below it the disease-free equilibrium is stable and
introductions fade; above it, stability passes to an endemic branch and
the disease-free state repels. "Get R below one" — the control target
every intervention is graded against — is a statement about pushing a
bifurcation parameter back across its critical value, and the map records
it at the strength of the threshold theorem it is.

**Structure makes the threshold spectral.** In populations with groups,
ages, or contact structure, $R_0$ is the spectral radius of the
next-generation matrix — the largest [[eigenvalues|eigenvalue]] of
who-infects-whom — and on explicit contact networks the epidemic
threshold reads off the adjacency spectrum (for SIS spreading, the
critical ratio scales as $1/\lambda_1$). Which contacts matter most, and
why hubs matter disproportionately, is eigenstructure rather than
epidemiological detail.

**Situational awareness is inference.** Estimating the time-varying
reproduction number from case counts is [[bayes-rule|Bayesian]] practice:
the renewal equation links today's infections to the recent past, and
posteriors over $R_t$ update as counts arrive. The map grades this layer
strong-analogy rather than theorem, deliberately: reporting delays,
underascertainment, and changing test behavior stand between the model
and the outbreak, and honest nowcasts carry those uncertainties rather
than hiding them.

The recognition pattern is the threshold-crossing shape: a small change
in a parameter — contact rate, transmissibility, vaccination coverage —
flips the system's qualitative behavior. It is one of the map's
symptom-index entries with this page as its worked example, and the same
shape appears in lasers at threshold, chain reactions going critical, and
rumor cascades: different mechanisms, one transcritical story.
