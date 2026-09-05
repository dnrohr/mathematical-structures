---
canonical_name: Power grid dynamics and frequency control
node_type: application
status: established
summary: >
  Keeping thousands of spinning machines in lockstep at 50/60 Hz — the
  domain problem where the driven oscillator, modal analysis, layered
  feedback, the network Laplacian, and energy conservation converge on one
  continental-scale control system that may never stop running.
fields: [control, networks, electromagnetics]
aliases:
  - name: frequency regulation / droop and AGC
    field: control
  - name: synchronization on the grid graph / swing dynamics
    field: networks
  - name: power system stability / rotor-angle dynamics
    field: electromagnetics
canonical_examples:
  - "The swing equation: a synchronous machine as a driven pendulum in rotor angle against the rest of the grid"
  - "An inter-area oscillation: two coherent groups of machines swinging against each other at a few tenths of a hertz, read as one lightly damped eigenmode"
  - "Primary droop then secondary AGC restoring frequency after a plant trip — proportional then integral control at continental scale"
---

A power grid is the largest machine engineering runs continuously, and its
dynamics are a structure this atlas already names several times over: the
rotating masses are oscillators, their interactions are a graph, the
verdict on disturbances is spectral, and the operating discipline is
layered feedback around one conserved quantity. The grid's own vocabulary
— swing curves, droop, inertia — is these structures in utility dress.

**Each machine is a driven pendulum.** The swing equation reads a
synchronous generator's rotor angle $\delta$ against the grid:
$M\ddot{\delta} + D\dot{\delta} = P_m - P_{\max}\sin\delta$ — a driven,
damped rotational [[harmonic-oscillator|oscillator]], with mechanical
power in, electrical power out through the sine of the angle. Small
disturbances swing the rotor about its operating angle exactly like a
mass on a stiffness; the electrical "stiffness" is the synchronizing
torque coefficient. The model is a deliberate reduction — constant
voltage behind a reactance, saturation and controller dynamics set aside
— and everything downstream inherits its scope.

**Swings between machines are normal modes.** Linearize the coupled swing
equations about a power-flow solution and the electromechanical modes
appear as the [[eigenvalues]] of the network's state matrix: local modes
where one plant swings against its neighbors, and inter-area modes where
coherent groups of machines hundreds of kilometers apart swing against
each other through weak tie lines. Small-signal stability *is* modal
analysis: damping ratios grade each mode, participation factors say which
machines carry it, and stabilizer tuning is the business of moving a
poorly damped eigenvalue leftward.

**The network enters as a Laplacian.** Under the DC power flow
approximation — small angle differences, near-nominal voltages — active
power flows are a linear system in bus angles whose matrix is the
susceptance-weighted [[graph-laplacian]] of the grid graph: $B\theta = P$.
Kron reduction, the power engineer's standard elimination of passive
buses, is the Schur complement on that Laplacian, and the reduced
network's spectrum is what synchronization conditions and coherency
analyses read. Which lines are bridges and where the spectral gap sits is
not network garnish; it is why inter-area modes exist at all.

**Frequency is a conservation ledger.** System frequency moves only
because active power is momentarily out of balance: aggregate swing
dynamics integrate generation minus load, with total rotating inertia
setting how fast the integral runs. That is [[conservation-laws|energy
conservation]] read per unit time, and it makes frequency the one
system-wide measurement that meters the whole budget — every operator
watches it because physics guarantees it cannot lie about the balance.

**Control is layered feedback on that ledger.** Primary control is droop:
each governor bleeds off speed error into a proportional power response,
decentralized and immediate, arresting the frequency fall. Secondary
control (AGC) is the integral layer, restoring nominal frequency and
scheduled tie-line interchange over minutes; tertiary control redispatches
economically above it. The stack is textbook [[feedback-control]] — 
proportional action shares the burden, integral action removes the offset
— deployed as the regulation architecture of an entire continent.

**Faults ask the stability question in the large.** A short circuit
accelerates rotors away from equilibrium; whether the system recovers
synchronism after clearing is transient [[stability]] — a basin question,
not an eigenvalue one. The equal-area criterion answers it graphically for
one machine, energy (Lyapunov) functions generalize it to networks, and
"critical clearing time" is the engineering unit of distance to the
boundary: how many milliseconds of fault the protection may spend before
the basin is left.

The seam with [[motor-efficiency]] is deliberate: that page owns the
individual machine — its coordinates, losses, and drive loops — while
this one starts where machines meet a network and the collective dynamics
begin. The recognition pattern here is the coupled-oscillator shape:
many locally simple units, coupling through a graph, collective modes
that no single unit explains — the same shape the map records wherever
synchronization or consensus runs on a network.
