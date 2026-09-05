---
canonical_name: Industrial process control
node_type: application
status: established
summary: >
  Holding distillation columns, reactors, and exchanger networks at spec
  around the clock — the domain problem where layered feedback, the
  state-space model, constrained optimization, and operating-point
  linearization converge on the control stack of every processing plant.
fields: [control, optimization, heat-transfer]
aliases:
  - name: regulatory control (PID, cascade) / model predictive control
    field: control
  - name: real-time optimization / receding-horizon control
    field: optimization
  - name: process dynamics of exchangers, columns, and reactors (first-order-plus-dead-time models)
    field: heat-transfer
canonical_examples:
  - "A distillation column under cascade control: a composition loop commanding a tray-temperature loop commanding reflux and reboil valves"
  - "Linear MPC on a constrained multivariable unit: a quadratic program re-solved every sample over an identified state-space model"
  - "Real-time optimization moving setpoints toward the economic optimum while the regulatory layer holds the plant there"
---

A processing plant runs on a control stack that this atlas can read top to
bottom: feedback loops hold the fast variables, a state-space model
carries the controller's picture of the unit, a constrained program
decides the moves, and every model in sight is a linearization around the
regime the plant currently occupies. The field's own layer names —
regulatory control, advanced control, real-time optimization — are the
structures stacked in order.

**The plant floor is layered feedback.** The base layer is thousands of
single [[feedback-control|loops]]: PID on flows, levels, pressures, and
temperatures, tuned against dead time and holding the plant's fast
degrees of freedom. Cascade control nests a fast inner loop (a valve's
flow) inside a slower outer one (a tray temperature), so inner
disturbances die before the outer loop sees them; ratio and feedforward
act on measured disturbances before feedback must. The architecture is
generic control engineering — what is domain about it is the plant's
timescale spread, from seconds at a valve to hours across a column.

**The controller's substance is a model.** Model predictive control, the
industry's standard advanced layer, is built around an explicit
[[state-space-model]]: identified from plant tests, propagated over a
prediction horizon, corrected against measurements by an observer each
sample, then re-propagated. The model is not an implementation detail —
it is the controller's working substance, and MPC's industrial history is
largely the history of getting usable models cheaply and re-identifying
them as the plant drifts.

**Deciding the moves is a constrained program.** Each sample, MPC solves
an [[optimization]] problem: minimize predicted deviation and move effort
over the horizon, subject to hard limits on valves, temperatures, and
compositions — a quadratic program in the linear case — then applies the
first move and re-solves (the receding horizon). Constraints are the
point: profitable operation sits against limits, and MPC's value is
holding the unit close to several of them at once. Above it, real-time
optimization re-solves a steady-state economic program and hands the
result down as setpoints — the optimize-then-regulate stack.

**Every model is local.** The plant is nonlinear; the models are
[[linearization|linearizations]] around operating points — step tests and
identification produce them, and they are honest only inside the regime
that produced them. Gain scheduling stitches regimes together; a grade
change is a walk through model territory. First-order-plus-dead-time
fits — the field's universal shorthand for exchanger, column, and reactor
dynamics — are the same move at its bluntest, and their parameters are
what the standard tuning rules consume.

**The plants themselves are heat and mass transfer.** What the loops hold
at spec are exchanger outlet temperatures, column compositions, and
reactor conversions: the process dynamics being modeled are lumped
thermal and material balances, which is why the field's models are
first-order lags with dead time in the first place — well-mixed holdups
in series. The heat-transfer membership is not decoration; it names what
the control stack is wrapped around.

The demotions are deliberate: PID, cascade, MPC, and RTO are techniques —
they live in the edge contexts here, not as nodes — and the estimation
machinery inside MPC's observer is the same structure the map types
elsewhere. The recognition pattern is the layered-control shape: fast
loops holding a nonlinear plant near an operating point so a slower,
smarter layer can move the operating point itself — the same architecture
wherever regulation and economics share one system.
