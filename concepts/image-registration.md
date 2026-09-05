---
canonical_name: Image registration and feature matching
node_type: application
status: established
summary: >
  Aligning two views of the same thing — the computer-vision and medical
  problem where diffusion-generated scale space, structure-tensor
  eigenvalues, and energy-minimizing alignment converge on one
  correspondence pipeline.
fields: [signal-processing, ml]
aliases:
  - name: image alignment / phase correlation / medical image registration
    field: signal-processing
  - name: feature detection and matching (SIFT, SURF, ORB)
    field: ml
canonical_examples:
  - "SIFT keypoints matched across viewpoints: extrema of a difference-of-Gaussians scale space, oriented by local gradient histograms"
  - "Lucas–Kanade tracking: linearized brightness constancy solved as least squares on good-to-track features"
  - "CT-to-MRI registration by maximizing mutual information — alignment without comparable intensities"
---

Registration begins where [[computational-imaging|image formation]] ends:
two images of one object exist, in different positions, times, or
modalities, and the task is the transform that maps one onto the other.
The production pipeline — detect features, match them, fit the
transform, refine densely — walks three structures in order.

**Scale space is diffusion.** To find features at unknown size, vision
runs the [[diffusion]] equation on the image: Gaussian smoothing is its
solution with scale as time, and the axiomatics run deep — causality
(no new detail may appear as scale coarsens) singles out the Gaussian
family as *the* linear scale space. SIFT's difference-of-Gaussians
pyramid samples that family, approximating the scale-normalized
Laplacian, and its keypoints are the blobs that survive across scale —
which is what makes them re-detectable when the camera moves.

**Features are eigenvalues.** Whether a neighborhood can anchor a match
is a spectral question: the structure tensor — the local average of the
gradient outer product — has two [[eigenvalues]], and their pattern
classifies the patch. Two large: a corner, localizable in both
directions; one large: an edge, sliding along itself (the aperture
problem read as a rank deficiency); both small: flat, useless. Harris's
detector scores that spectrum, and Shi–Tomasi's "good features to track"
is literally a minimum-eigenvalue threshold — the same matrix that then
conditions the tracker's normal equations.

**Alignment is optimization.** The transform itself comes from
[[optimization|energy minimization]]. Lucas–Kanade
[[linearization|linearizes]] brightness constancy and solves the
resulting least squares by Gauss–Newton, coarse-to-fine across the same
scale pyramid the detector used. Where intensities are not comparable —
CT against MRI — the objective changes to mutual information over
transform parameters, and alignment proceeds without any assumption
that matching points look alike. Robust estimation (RANSAC over matched
features) guards the whole pipeline against the correspondences that
lie.

The recognition pattern — *two views of the same thing, misaligned* — is
a symptom-index entry with this page as its worked example; the same
shape covers point-cloud alignment, sensor calibration, and time-series
alignment, where the "image" is any measured field.
