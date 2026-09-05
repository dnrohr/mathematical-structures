---
canonical_name: Electric motor efficiency and drive control
node_type: application
status: established
summary: >
  Converting electrical power to shaft power well — the electromechanical
  problem where feedback control of the torque loop and conservation
  accounting of the losses converge, with the force–voltage analogy
  reading both sides of the airgap as one family of equations.
fields: [electromagnetics, control, mechanics]
aliases:
  - name: machine design / loss budgeting (copper, iron, stray)
    field: electromagnetics
  - name: field-oriented control / vector control / servo drives
    field: control
  - name: drivetrain dynamics / torsional resonance
    field: mechanics
canonical_examples:
  - "A field-oriented drive holding commanded torque through the dq transform while the rotor spins beneath it"
  - "An efficiency map: measured loss contours over the torque–speed plane deciding where a vehicle's operating line should live"
  - "The two-inertia drivetrain: torsional resonance capping how hard the speed loop may push"
---

A motor drive is two textbooks bolted together — electromagnetics on one
side of the airgap, mechanics on the other, control theory wrapped
around both — and its engineering questions sort cleanly onto the map's
structures.

**Drive control as feedback.** Field-oriented control rewrites the
machine in coordinates that rotate with its magnetic field: in the dq
frame the torque-producing and flux-producing currents separate, torque
control becomes linear, and the drive closes cascaded
[[feedback-control|feedback loops]] — a fast current loop inside a speed
loop inside a position loop, each tuned against the one it contains. The
industrial servo drive is this architecture, and its bandwidth budget is
classical loop-shaping: the current loop's electrical time constant and
the drivetrain's mechanical resonances set what the outer loops may
attempt. The coordinate move itself is the map's
[[change-of-representation|standard opening]] — pick the frame in which
the coupled problem decouples.

**Efficiency as accounting.** Motor efficiency is
[[conservation-laws|conservation of energy]] read as a budget: electrical
input balances shaft output plus losses — copper (resistive, load-shaped),
iron (hysteresis and eddy currents, speed-shaped), and mechanical
(friction and windage). The airgap power flow is where the budget is
audited: what crosses it, minus rotor losses, is what the shaft
delivers, and an efficiency map over the torque–speed plane is that
audit drawn as contours. The balance is exact; only the loss models
approximate.

**One family of equations.** The armature circuit (inductance,
resistance, back-EMF) and the mechanical drivetrain (inertia, damping,
compliance) are the same second-order form under the force–voltage
electromechanical analogy — L ↔ m, R ↔ b, 1/C ↔ k — the
[[harmonic-oscillator]]'s two industrial costumes. The analogy is what
lets a drive engineer reflect the load inertia into the electrical
domain, read a two-inertia drivetrain as a resonant circuit, and reuse
one intuition across the airgap. It is exact for ideal lumped elements
and an analogy with scope for real machines, where saturation, friction,
and distributed compliance break the correspondence — which is how the
map records it.

Efficiency regulation, traction drives, and servo design differ in
constraints, not structure: the same three claims, weighted differently.
