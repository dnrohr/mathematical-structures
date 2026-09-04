---
canonical_name: Radon transform and tomography
node_type: operation
status: established
summary: >
  Integrate an unknown field along lines or hyperplanes. Tomography is the
  inverse problem whose forward operator is the Radon transform; the Fourier
  slice theorem connects each projection to a radial slice of the object's
  Fourier transform.
fields: [signal-processing, pde]
aliases:
  - name: sinogram / projection data / filtered back-projection
    field: signal-processing
  - name: X-ray transform (line integrals in higher dimensions)
    field: pde
assumptions:
  - a linear forward model (attenuation integrating along straight rays)
  - sufficient angular coverage; limited angles make the inversion ill-posed
canonical_examples:
  - CT reconstruction of a cross-section from X-ray projections
  - The Fourier slice theorem reducing reconstruction to Fourier inversion
sections:
  - notebook-v0#19-integral-transforms-change-the-problem-before-solving-it
---

The Radon transform represents a function by its integrals over lines (or
hyperplanes): each measurement answers "how much total material did this
ray pass through?" It is a genuine member of the [[integral-transforms]]
family — the kernel family being indicators of lines.

The distinction the map keeps sharp: **tomography is not itself an integral
transform.** Classical projection tomography is an *inverse problem* whose
forward operator is the Radon transform — the object is unknown, the
projections are data, and reconstruction means inverting the operator in
the presence of noise and incomplete angles, typically with regularization.

The bridge to [[fourier-analysis]] is the Fourier slice theorem: the
one-dimensional Fourier transform of a projection at angle $\theta$ equals
a radial slice through the object's multidimensional Fourier transform at
that angle. Reconstruction strategies read straight off this identity —
fill Fourier space slice by slice, or apply its real-space equivalent,
filtered back-projection.

> object → line integrals (Radon transform) → Fourier slices → inverse
> reconstruction

The same measurements-are-projections structure recurs wherever sensing
integrates along paths — seismic travel-time inversion, ocean acoustic
tomography, electron microscopy — and the shared symptom ("my measurements
are projections of a hidden interior") is one of the map's
problem-recognition entries, alongside the boundary-probing inverse
problems that lean on [[greens-function|Green's functions]].
