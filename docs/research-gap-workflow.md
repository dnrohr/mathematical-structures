# Research-gap workflow

(Moved from the original notebook, §35.)

Potential missing migrations — `POSSIBLE-MISSING-MIGRATION` edges — are treated
as questions to investigate, never as claims of novelty. This workflow prevents
the map from manufacturing research gaps out of vocabulary differences. Every
gap edge carries a `status` from `gap_statuses` in `graph/schema.yaml`
recording where it sits in this process.

## The workflow

1. **Identify a structural analogy, not merely a shared metaphor.** The two
   settings should share operators, loop structure, conditional-independence
   structure, or another checkable skeleton.
2. **Search the target field under both source-field terminology and likely
   local dialects.** The dialect tables in the atlas are the checklist of
   alternative vocabularies to search under.
3. **Determine whether the machinery is absent, renamed, technically
   inappropriate, or already standard.**
4. **If rare, identify which assumptions fail** in the target system:
   linearity, stationarity, observability, timescale separation, known model
   structure, etc. (These are ASSUMES edges on the source technique.)
5. **Ask whether a generalized version of the method survives those
   failures.**
6. **Record the result** by updating the edge's status:
   - `established-transfer` — it exists and is documented; convert the edge to
     `MIGRATED-TO`.
   - `renamed-transfer` — it exists under another name; record the alias and
     convert to `FIELD-DIALECT-OF`/`MIGRATED-TO` as appropriate.
   - `failed-transfer` — an assumption genuinely fails; say which, in the edge
     notes. This is a valuable result, not a dead end: it often points at the
     generalized method (step 5).
   - `open-candidate` / `literature-checked` — intermediate states.

## Worked example: phase/gain margins in biological networks

The useful question is not simply whether papers use the terms "phase margin"
and "gain margin". First identify the biological loop, delays, operating
point, linearization regime, input/output definition, and uncertainty model.
Then ask whether classical loop margins are meaningful; if not, identify the
biological or nonlinear-control quantity serving the same functional role.
This transforms a terminology search into a structural comparison.
