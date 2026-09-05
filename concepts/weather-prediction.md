---
canonical_name: Weather prediction and data assimilation
node_type: application
status: established
summary: >
  Forecasting a chaotic fluid from imperfect observations — the domain
  problem where recursive estimation, linearization at planetary scale,
  spectral dynamics, and diffusion closures converge on one production
  pipeline that runs to a deadline every six hours.
fields: [fluids, statistics, control]
aliases:
  - name: numerical weather prediction (NWP) / the dynamical core
    field: fluids
  - name: data assimilation / the analysis (3D-Var, 4D-Var, EnKF)
    field: statistics
  - name: state estimation at geophysical scale / observer design
    field: control
canonical_examples:
  - "An operational analysis cycle: millions of observations blended into a billion-variable model state every few hours, forecast and data weighted by their error covariances"
  - "Lorenz's three-variable convection model: sensitive dependence discovered in a weather model, ending the dream of indefinite deterministic forecasts"
  - "A spectral dynamical core integrating the primitive equations in spherical-harmonic space with semi-implicit timesteps"
---

Weather prediction is the map's largest single demonstration that
structures, not vocabulary, run a field: an operational forecast system is
a state estimator wrapped around a discretized fluid model, and every
layer of it is machinery this atlas already names. The field's own
term — *data assimilation* — is the statistics dialect for keeping a
running simulation honest against measurements.

**The estimation layer.** The analysis step — blending the previous
forecast with new observations — is the [[kalman-filter|Kalman filter]]'s
update, weighting each by its error covariance. Operational systems are
its two descendants: ensemble methods (EnKF) estimate the flow-dependent
forecast covariance from a Monte-Carlo sample of model runs, and
variational methods (4D-Var) solve the equivalent least-squares problem
over a time window. Both are [[bayes-rule|Bayesian estimation]] on a
[[state-space-model|state-space model]] too large to hold a covariance
matrix for — which is why the approximations, not the update formula, are
where the field's research lives.

**Linearization at planetary scale.** Incremental 4D-Var — the form that
made variational assimilation operational — is iterated
[[linearization]]: each outer loop builds a quadratic cost from the
tangent-linear model and its adjoint around the latest trajectory and
minimizes it, Gauss–Newton with a million-core inner loop. The tangent
model's validity horizon, not computing budget, is what limits the
assimilation window.

**The dynamical core.** Global spectral models integrate the primitive
equations in spherical-harmonic space — the sphere's
[[fourier-analysis|Fourier analysis]], eigenfunctions of the Laplacian —
where derivatives are algebraic and the semi-implicit timestep is a
Helmholtz solve per mode, with fast transforms shuttling to grid space
for the physics. The representation is chosen exactly the way this map
says representations get chosen: to make the governing operator diagonal.

**Why forecasts are ensembles.** [[chaos|Sensitive dependence]] bounds
deterministic predictability — errors that double every couple of days
swamp the synoptic scales within about two weeks — so operations run
perturbed ensembles to sample the flow-dependent error growth Lorenz
identified. The ensemble is not decoration on the forecast; it *is* the
honest forecast, and it doubles as the covariance the EnKF assimilates
with.

**The closure layer.** What the grid cannot resolve enters as
[[diffusion]]: boundary-layer turbulence closed as eddy diffusion
(K-theory) mixing heat, moisture, and momentum down local gradients, and
horizontal hyperdiffusion absorbing the enstrophy cascade at the
truncation scale. These are closures with known failure modes —
counter-gradient fluxes in the convective boundary layer are the standard
one — and the map records them at analogy strength for exactly that
reason.

The recognition pattern — *a running model drifting away from incoming
measurements* — is one of the symptom index's entries, with this page as
its worked example; the same shape appears wherever a simulation must
track a live system, from orbit determination to glucose monitoring.
