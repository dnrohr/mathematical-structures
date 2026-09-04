# Mission: a field guide to mathematical structure

(The project's founding intent, moved out of `README.md` when the README
became a working front door. This document says *why the atlas exists*;
scope and success criteria are fixed by
[SPECIFICATION.md](../SPECIFICATION.md), and design by
[ARCHITECTURE.md](../ARCHITECTURE.md).)

A small set of mathematical structures, canonical models, and reusable
intellectual moves recurs across physics, engineering, biology, computation,
and statistics — and recognizing the *abstract form* of a problem is a
transferable skill. The same object answers to "poles" in control theory,
"natural frequencies" in mechanics, and "spectral gap" in probability; a
statistician's principal components and a physicist's normal modes are one
move. The barrier between fields is usually not the mathematics but the
vocabulary, so what a working scientist needs is not another textbook: it is
a translation layer, indexed by what a problem *looks like*.

The Structure Atlas is that guide — graph-oriented, built for recognizing
the form of a problem, not for taxonomizing disciplines. Fields appear as
metadata and dialect labels, never as the primary hierarchy.

## Knowledge about structure is graph-shaped

The product thesis (SPECIFICATION.md §1):

> Knowledge about cross-disciplinary structure is graph-shaped, and it
> should be stored, browsed, and analyzed as a typed graph — never as a
> linear document.

The unit of value is the typed relationship: *is a special case of*, *same
skeleton as*, *migrated to*, *fails when*. Each one is a single reviewable
line of data in `graph/edges.yaml`, which is what lets the atlas be curated
claim by claim, analyzed mechanically, and consumed by external tools as
easily as by readers. The linear-document alternative was tried first and
produced the drift this repository is designed against — see Provenance
below.

## Epistemic commitments

Three disciplines shape every file here, and the validator enforces the
first two:

- **Every claim carries its strength.** Edge strengths run from `identity`
  and `theorem` down to `heuristic-analogy` and `speculative`, and no view
  of the data may hide them. The central discipline is refusing to let
  attractive analogies masquerade as identities: Shannon entropy ↔ Gibbs
  entropy is a near-identity, while thermodynamic entropy ↔ Kolmogorov–Sinai
  entropy is a family resemblance, and the data must keep saying so.
- **Research gaps are questions, never findings.** A
  `POSSIBLE-MISSING-MIGRATION` edge ("field A has this machinery; field B
  seems to lack it") is a hypothesis with a verification workflow
  ([research-gap-workflow.md](research-gap-workflow.md)) and a status, never
  a claimed discovery.
- **Assumptions travel with tools.** A technique presented without the
  conditions that license it (linearity, smoothness, stationarity, …) is a
  bug; ASSUMES / FAILS-WHEN / REPLACED-BY edges are what make the atlas a
  field guide rather than a map of slogans.

## What the atlas is not

- **Not an encyclopedia.** Wikipedia and textbooks explain concepts in
  depth; the atlas explains the *relationships between* concepts and links
  outward for depth.
- **Not a taxonomy of disciplines.** Disciplines are where structures wear
  different names, not how knowledge is organized.
- **Not a claims engine.** Nothing speculative is ever blended in with
  theorem-grade content.

## Provenance

This project began as a single working notebook, preserved intact at
[notebook-v0.md](notebook-v0.md). Every concept file's `sections:`
front-matter points back to the notebook sections it was extracted from, so
no claim loses its paper trail. Documents elsewhere in the repository cite
those sections as "README §n": the notebook was this repository's README
before the graph existed, and the section numbering is unchanged.
