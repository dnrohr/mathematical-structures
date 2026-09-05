---
canonical_name: Computational imaging (CT, SAR, MRI)
node_type: application
status: established
summary: >
  Reconstructing a hidden interior from indirect measurements — X-ray
  projections, radar echoes, magnetic-resonance signals. The domain problem
  where integral-transform inversion, point-source responses, and
  complex-analytic signal structure converge on one inverse problem.
fields: [signal-processing, pde, statistics]
aliases:
  - name: image reconstruction / SAR image formation (range–Doppler, backprojection)
    field: signal-processing
  - name: inverse problems / inverse scattering / seismic migration
    field: pde
  - name: statistical image reconstruction (penalized likelihood, Bayesian inversion)
    field: statistics
canonical_examples:
  - "CT: filtered back-projection recovering a cross-section from X-ray projections — the inverse Radon transform in production"
  - "SAR: matched filtering against the point-target response focusing raw echoes into a terrain image"
  - "MRI: k-space samples are Fourier coefficients of the object, so reconstruction is (regularized) Fourier inversion"
sections:
  - notebook-v0#19-integral-transforms-change-the-problem-before-solving-it
---

Computational imaging recovers what cannot be observed directly — a tissue
cross-section, terrain under cloud, the interior of the body — from
measurements that physics makes indirect. It is the map's cleanest
demonstration that several structures converging on one real system is a
story rather than a coincidence: the same image is reached by inverting an
integral transform, focusing against a point response, and filling in a
Fourier picture, and production scanners do all three at once.

**CT: inverting a transform.** X-ray attenuation integrates along rays, so
projection data are samples of the [[radon-transform]] of the attenuation
map, and reconstruction is the inverse transform. The route runs through
[[fourier-analysis]]: the slice theorem converts each projection into a
radial slice of the object's transform, and filtered back-projection is
that identity read back in real space — exact in the full-angle, noiseless
idealization, regularized everywhere else.

**SAR: focusing against a point response.** A synthetic-aperture radar
illuminates the scene with its own pulse and records the echoes. Under the
linearized (Born) single-scattering model, the raw data are the scene
integrated against the propagation kernel — a
[[greens-function|point-target response]] — and image formation is matched
filtering against that response: backprojection and range–Doppler
algorithms are implementations of the same adjoint integration. Seismic
migration and ocean acoustic tomography are the identical move at other
wavelengths, which is why they live on this page as examples rather than
as separate nodes.

**MRI: measuring the transform directly.** Gradient coils make the
resonance frequency a linear function of position, so the received signal
*is* the object's Fourier transform sampled along k-space trajectories.
No transform inversion problem needs to be discovered — acquisition
happens in the transformed coordinates, and reconstruction is Fourier
inversion plus whatever regularization the sampling pattern demands.

**The coherent layer.** These are complex-valued, phase-coherent
measurements, and [[complex-analysis]] does specific work: the analytic
signal (a one-sided spectrum is the boundary value of a function analytic
in a half-plane) is what licenses quadrature demodulation to complex
baseband, and Paley–Wiener rigidity explains the field's central
frustration — limited-angle data determine the image in principle
(analytic continuation) while making its recovery violently ill-posed in
practice.

Real reconstruction is statistical. Noise, incomplete coverage, and model
error make every inversion above ill-posed, so modern systems solve
penalized-likelihood or Bayesian problems instead of applying inverse
formulas — [[optimization]] and [[bayes-rule|Bayesian inversion]] entering
not as garnish but as the production algorithm. The recognition pattern —
"my measurements are projections of the thing I want" — is one of the
map's symptom-index entries, with this page as its worked example.
