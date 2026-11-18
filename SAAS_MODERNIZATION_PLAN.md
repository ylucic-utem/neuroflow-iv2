# NeuroFlow IV2 SaaS Modernization Plan

Last updated: 2026-08-12

## Current App Snapshot

NeuroFlow IV2 is currently a Vite + React + TypeScript single-page app with a client-side Web Audio engine, React Router role-based routes, React Flow protocol design, static JSON presets, localStorage persistence, and a browser-executed Gemini integration.

The current build succeeds with `npm run build`, but the app is still prototype-grade for SaaS:

- No real authentication or tenant isolation; role selection is stored in `localStorage`.
- Gemini API access is bundled through `process.env.API_KEY`, which exposes privileged AI capability to the browser.
- Clinical presets and custom presets are static or local-only instead of database-backed.
- Patient notes and outcomes are not persisted to a backend.
- Deployment docs target Render, while the desired target is GitHub + Cloudflare + D1.
- `index.html` still uses Tailwind CDN, import maps, remote fonts, and a `/index.css` reference that does not exist at build output.
- Main JavaScript bundle is large: about `1,027.75 kB` before gzip, `260.99 kB` gzip.
- Audio claims and protocol labels are stronger than the current evidence supports for a medical-adjacent SaaS.

## Product Direction

Position NeuroFlow as a clinician-supervised audio session platform and research-backed wellness/adjunctive therapy tool, not as a standalone medical treatment unless the company pursues the necessary clinical, regulatory, legal, and quality-system work.

The safest production framing is:

- Clinicians can design, assign, and review structured audio sessions.
- Patients can play assigned sessions, submit subjective outcomes, and report adverse effects.
- Protocols carry evidence tiers, contraindications, and human-readable rationale.
- The system records what was delivered: frequencies, duration, volume, device context, user feedback, and protocol version.
- AI suggests draft protocols and explanatory copy, but clinical users approve before patient assignment.

## Part 1: Technical SaaS Plan

### Phase 0: Repository And Build Hygiene

Goal: make the repo clean, predictable, and GitHub-ready.

- Move fully to a conventional `src/` app layout and remove duplicated deleted root-level source paths from Git history intentionally.
- Replace Tailwind CDN with local Tailwind, PostCSS, and checked-in config.
- Remove import maps from `index.html`; let Vite bundle all app dependencies.
- Fix CSS entry by importing `src/index.css` from `src/index.tsx` and removing the stale `/index.css` link.
- Add `.env.example`, `.editorconfig`, GitHub issue/PR templates, LICENSE decision, and security contact policy.
- Ensure `.env.local`, generated audio, local databases, and Cloudflare secrets are ignored.
- Add scripts: `typecheck`, `lint`, `test`, `test:audio`, `check`, `deploy`, `db:migrate:local`, `db:migrate:remote`.
- Pin Node to a current LTS-compatible version for Cloudflare/Vite, preferably Node 22.

Deliverables:

- Clean GitHub repository.
- Reproducible install/build/check commands.
- No client-side secret exposure.
- Build warnings tracked as issues.

### Phase 1: Cloudflare Runtime Migration

Goal: convert from static-only SPA to full-stack Cloudflare app.

Recommended stack:

- Frontend: React 19, TypeScript, Vite, React Router.
- Runtime: Cloudflare Workers with `@cloudflare/vite-plugin`.
- API: Hono or a small typed Worker router.
- Database: Cloudflare D1 for relational SaaS data.
- Object storage: Cloudflare R2 for rendered audio files, exports, optional waveform previews, and audit attachments.
- Cache/config: Cloudflare KV for low-risk public preset metadata and feature flags.
- Background work: Cloudflare Queues or Workflows for long-running TTS/audio generation jobs.
- Rate limiting: Cloudflare Rate Limiting binding or application-level limits by tenant/user.
- Observability: Workers Logs, source maps, request IDs, structured JSON logs, and Sentry/PostHog if needed.

Cloudflare notes:

- Cloudflare now recommends the Vite plugin for React + Workers apps, with static assets and Worker API deployed together.
- React SPA routing should use `assets.not_found_handling = "single-page-application"`.
- D1 must be accessed through Worker bindings, not directly from browser code.
- D1 migrations are versioned SQL files and should be committed.

Deliverables:

- `wrangler.jsonc` with `main`, `compatibility_date`, static assets handling, D1 binding, and environment-specific config.
- `worker/index.ts` or `api/index.ts` exposing `/api/*` routes.
- Local development through Cloudflare workerd, not only Vite's browser dev server.
- GitHub Actions workflow for install, typecheck, tests, build, and deploy.

References:

- Cloudflare React + Vite guide: https://developers.cloudflare.com/workers/framework-guides/web-apps/react/
- Cloudflare Vite plugin: https://developers.cloudflare.com/workers/vite-plugin/
- Cloudflare D1 migrations: https://developers.cloudflare.com/d1/reference/migrations/
- Cloudflare Workers bindings: https://developers.cloudflare.com/workers/runtime-apis/bindings/

### Phase 2: D1 Data Model

Goal: replace static/localStorage state with tenant-safe persisted SaaS records.

Core tables:

- `organizations`: clinics, labs, wellness providers.
- `users`: identity profile, role, status, timestamps.
- `organization_memberships`: user-to-org role mapping.
- `patients`: patient profile scoped to organization.
- `protocols`: protocol metadata, evidence tier, clinical status, version pointer.
- `protocol_versions`: immutable JSON graph, frequency steps, safety metadata, citations.
- `session_assignments`: protocol assigned to patient by clinician.
- `session_runs`: playback start/end, completion status, client device metadata.
- `session_events`: play, pause, safety stop, ramp changes, volume changes.
- `outcome_reports`: pre/post scores, notes, adverse effects, consent confirmation.
- `audio_assets`: R2 keys, durations, sample rate, loudness stats, checksum.
- `ai_requests`: prompts, model, user, org, approval state, cost metadata.
- `audit_log`: security-sensitive actions and clinical approvals.

D1 design rules:

- Store clinical protocol versions immutably.
- Use foreign keys and indexes on `organization_id`, `patient_id`, `protocol_id`, and `created_at`.
- Store PHI-minimal records unless legal/compliance requirements are fully designed.
- Keep generated audio binaries out of D1; use R2 and store metadata in D1.
- Add idempotency keys for session logging and AI/audio generation jobs.

Deliverables:

- Initial SQL migrations.
- Seed data from `public/presets.json`.
- Typed repository layer with input validation.
- Backup/export policy.

### Phase 3: Auth, Authorization, And Security

Goal: make the product safe for real users.

- Add real auth via a hosted identity provider compatible with Workers, such as Clerk, Auth0, WorkOS, or Cloudflare Access for early internal deployments.
- Enforce server-side authorization on every API request.
- Introduce organization-level tenancy and row access checks.
- Move Gemini/OpenAI/other AI calls to the Worker API.
- Store AI keys as Worker secrets.
- Add CSRF-aware session strategy or bearer-token validation.
- Add audit logging for protocol creation, assignment, patient access, note creation, and safety stop.
- Add consent flows and disclaimers before first patient playback.
- Add content security policy and remove unsafe remote scripts.

Deliverables:

- Login/logout with real identity.
- Role-based permissions: owner, clinician, assistant, patient, admin.
- No privileged client-side secrets.
- Audit log available to admins.

### Phase 4: Audio Engine Modernization

Goal: produce clean, comfortable, measurable audio with predictable behavior across devices.

Current engine strengths:

- Uses Web Audio API directly.
- Supports binaural beats, isochronic pulse, noise layers, reverb, spatial modes, ramping, and protocol sequencing.

Risks to fix:

- Oscillator recreation during frequency changes can create clicks or phase discontinuities.
- Synthetic reverb uses random impulse generation and is not deterministic.
- No calibrated loudness, limiter, DC blocking, or clipping guard.
- No automated audio quality tests.
- Binaural/spatial routing should use explicit stereo panning/channel splitting rather than relying on 3D panner assumptions.
- Mobile background audio workaround needs review against iOS/Android autoplay and battery behavior.

Implementation plan:

- Introduce an `AudioWorklet` for sample-accurate binaural, monaural, isochronic, and ramp generation.
- Use param automation with smoothing for frequency, gain, pan, and pulse-depth changes.
- Add master safety chain: high-pass/DC blocker, soft limiter, true peak estimate, and max session volume.
- Add LUFS/RMS-style metering for rendered or generated assets.
- Validate headphones for binaural mode and fall back to monaural/isochronic mode for speakers.
- Add audio snapshots/tests with `OfflineAudioContext` to verify frequency accuracy, channel separation, click-free ramps, no clipping, and expected noise spectra.
- Add a safety stop that always fades down and tears down active sources cleanly.
- Support offline prerendering of long protocol audio to R2 for patients with unstable devices.
- Keep live synthesis for interactive clinician preview.

Deliverables:

- `AudioEngine` split into deterministic DSP core, React controller, and UI state.
- Audio QA test suite.
- Protocol preview renderer.
- R2-backed generated session audio option.

### Phase 5: Performance And UX

Goal: fast clinician workflows and reliable patient playback.

- Code split clinician designer, patient player, AI chat, React Flow, and Three.js visualizers.
- Lazy-load expensive visualizers only on routes that use them.
- Replace CDN fonts with self-hosted or system font stack.
- Preload critical patient player assets.
- Add route-level loading and error boundaries.
- Optimize React context so audio meter updates do not rerender the whole app.
- Add PWA support only after session safety, update handling, and offline cache rules are explicit.
- Make the first screen the actual app for authenticated users, with the landing page only for public marketing.

Deliverables:

- Main initial bundle under 250 kB gzip target.
- Patient player interaction ready in under 2 seconds on mid-range mobile.
- Lighthouse/performance budgets in CI.

### Phase 6: Clinical Workflow Productization

Goal: make it usable by real clinics or professional users.

- Clinician dashboard: real patient list, assigned sessions, adherence, adverse effects, outcome trends.
- Protocol library: evidence tiers, contraindications, approval status, version history.
- Protocol designer: graph editing, validation, preview, save draft, publish version.
- Patient app: assigned sessions, safety instructions, playback, safety stop, outcome report.
- Admin: organizations, users, billing, compliance exports.
- AI assistant: evidence-grounded drafting only, with citations and approval workflow.

Deliverables:

- Multi-tenant SaaS MVP.
- Clinician-approved protocol assignment.
- Patient outcome tracking.
- Evidence-aware protocol lifecycle.

### Phase 7: Production Operations

Goal: operate like a serious SaaS.

- Environments: local, preview, staging, production.
- GitHub branch protections and required checks.
- Cloudflare deploy previews for pull requests.
- Database migration policy with rollback notes.
- Structured logging and alerting for Worker errors, D1 errors, AI failures, and audio generation failures.
- Cost controls for AI/TTS/audio rendering.
- Privacy/compliance review before storing PHI.
- Incident response process and data export/deletion flows.

Deliverables:

- Operational runbook.
- Backup and restore drills.
- Security checklist.
- Launch readiness checklist.

## Part 2: Audio, Binaural, And Therapeutic Fundamentals

### Evidence Stance

Binaural beats and related auditory beat stimulation should be treated as promising but heterogeneous. The strongest product strategy is to separate:

- Evidence-supported adjunctive use: anxiety reduction, relaxation, perioperative/procedural anxiety, sleep support in some contexts.
- Experimental cognitive support: focus, attention, working memory, studying.
- Speculative or marketing-only claims: broad healing, disease treatment, biomarker-specific guarantees, replacement for medical care.

Recent research is mixed:

- A 2023 PLOS ONE systematic review found that EEG entrainment evidence is inconsistent across studies, with substantial heterogeneity in protocols and analysis.
- A 2022 randomized clinical trial found theta-range auditory beat stimulation plus music reduced anxiety in a medicated anxiety sample.
- A 2025 perioperative systematic review/meta-analysis reported reductions in anxiety and postoperative pain, but with high heterogeneity.
- A 2024 Scientific Reports ERP study suggested daily 6 Hz exposure may improve attention-related ERP markers and reaction time in healthy subjects.
- A 2024 Scientific Reports sleep study reported that 0.25 Hz binaural beats shortened latency to slow-wave sleep during daytime naps.
- Some studies report neutral or adverse cognitive effects, so the product should avoid universal focus/performance claims.

References:

- Ingendoh et al., 2023, PLOS ONE systematic review: https://pubmed.ncbi.nlm.nih.gov/37205669/
- Mallik and Russo, 2022, PLOS ONE randomized trial: https://pubmed.ncbi.nlm.nih.gov/35263341/
- Perioperative anxiety and pain meta-analysis, 2025: https://pubmed.ncbi.nlm.nih.gov/41176178/
- Chockboondee et al., 2024, 6 Hz ERP study: https://www.nature.com/articles/s41598-024-68628-9
- Fan et al., 2024, 0.25 Hz sleep study: https://doaj.org/article/43e2adb9b00941e0948757fe24a8e80b
- Klichowski et al., 2023, reverse home-use cognitive effect: https://www.nature.com/articles/s41598-023-38313-4
- 2026 young-adult systematic review: https://pmc.ncbi.nlm.nih.gov/articles/PMC13130302/

### Protocol Taxonomy

Use three protocol categories in the app:

1. Evidence-supported adjunct

   Intended for anxiety, relaxation, sleep support, and procedural comfort where literature is strongest. Requires conservative claims and clear limits.

2. Performance and studying

   Intended for focus, relaxed attention, pomodoro-style study, and post-study wind-down. Requires A/B testing and subjective tracking because evidence is inconsistent.

3. Research / experimental

   Intended for clinician/researcher exploration. Hidden from patients unless explicitly assigned. Must include stronger disclaimers and adverse-event tracking.

### Frequency Guidance

These ranges should be configurable but not marketed as deterministic medical outcomes:

- Delta / slow oscillation: about `0.25-4 Hz`; sleep onset, deep rest, downshifting.
- Theta: about `4-7 Hz`; relaxation, anxiety reduction, meditative states, some attention experiments.
- Alpha: about `8-12 Hz`; relaxed wakefulness, stress reduction, preoperative/procedural calm.
- Low beta / SMR: about `12-18 Hz`; alert focus, study support, experimental attention use.
- Gamma: about `30-40 Hz`; cognition/memory experiments, use cautiously because benefits are inconsistent and may be stimulating.

Technical audio defaults:

- Use headphones for true binaural beats.
- Keep beat frequency within `0.5-40 Hz` for the current engine.
- Use carrier frequencies that are comfortable and audible, commonly around `100-500 Hz`.
- Keep default listening levels moderate, with product copy recommending comfortable volume rather than high volume.
- Offer pink or brown noise for comfort, but avoid unsupported claims such as white noise raising cortisol unless backed by a maintained evidence note.

### Safety And Contraindications

The product should include a safety screen and protocol-level contraindication metadata.

Potential safety flags:

- Epilepsy or seizure history.
- Sound-triggered migraine, tinnitus, hyperacusis, vestibular sensitivity, recent ear injury, or hearing impairment.
- Acute psychosis, mania, severe dissociation, panic escalation, or trauma-trigger sensitivity.
- Use while driving, operating equipment, or doing tasks requiring full environmental awareness.
- Children, pregnancy, perioperative, psychiatric, neurological, or medically complex use without appropriate supervision.

Required safety features:

- Patient-facing stop button always visible during playback.
- Conservative defaults for isochronic intensity and spatial motion.
- Ramp-down on stop instead of abrupt cutoff.
- Adverse effect report after session.
- Clinician review for high-intensity or experimental protocols.
- Clear distinction between wellness support and medical treatment.

### Evidence Engine

Build an internal evidence layer rather than hardcoding claims in prompts.

Each protocol should include:

- Target outcome.
- Intended population.
- Frequency and carrier settings.
- Session duration and repetition schedule.
- Evidence tier.
- Study citations.
- Known limitations.
- Contraindications.
- User-facing description.
- Clinician-facing rationale.
- Version history.

AI should retrieve from this evidence layer and must return:

- Suggested protocol parameters.
- Evidence tier.
- Explanation of uncertainty.
- Safety flags.
- Citations used.
- Whether clinician approval is required.

### Research And Validation Roadmap

Phase A: Literature normalization

- Review every citation in `public/presets.json`.
- Remove or downgrade unsupported protocols.
- Normalize citation fields with DOI/PMID/PMCID.
- Add evidence grading rubric.

Phase B: Internal usability and signal tracking

- Track completion, comfort, adverse effects, pre/post subjective scores, and repeat use.
- Compare protocol versions by target outcome.
- Do not infer medical efficacy from app telemetry alone.

Phase C: Pilot studies

- Partner with clinicians or researchers.
- Pre-register protocols when making efficacy claims.
- Use validated scales where appropriate, such as STAI for anxiety, PSQI/ISI for sleep, VAS/NRS for pain, and attention tasks for studying/focus.

Phase D: Regulatory decision

- Decide whether the company remains wellness/clinical support software or pursues medical device claims.
- If pursuing medical claims, begin quality management, risk management, clinical evaluation, cybersecurity, privacy, and regulatory strategy early.

## Suggested Milestone Order

### Milestone 1: GitHub And Cloudflare Foundation

- Clean repo and dependency setup.
- Add Cloudflare Vite plugin and Worker API.
- Add D1 local database and migrations.
- Move secrets server-side.
- Deploy staging from GitHub.

### Milestone 2: SaaS Core

- Real auth.
- Organizations, users, patients.
- Protocol CRUD and versioning.
- Patient session assignment and outcome storage.

### Milestone 3: Audio Reliability

- Refactor audio engine.
- Add audio QA tests.
- Add safety limiter and stop flow.
- Add protocol preview and optional prerendering.

### Milestone 4: Evidence-Safe Product

- Evidence taxonomy.
- Citation-backed protocol library.
- Safety contraindications.
- AI recommendation guardrails.
- Clinician approval workflow.

### Milestone 5: Production Beta

- Observability.
- Rate limits.
- Billing-ready tenant model.
- Admin tools.
- Security review.
- Pilot launch with measured outcomes.

## Immediate Next Implementation Tasks

1. Replace Render docs with Cloudflare deployment docs.
2. Add `wrangler.jsonc`, Cloudflare Vite plugin, and Worker API scaffold.
3. Add D1 schema migrations for organizations, users, protocols, assignments, session runs, outcomes, and audit logs.
4. Move Gemini calls behind `/api/ai/*`.
5. Replace localStorage presets with D1-backed protocol endpoints.
6. Remove Tailwind CDN/import maps and fix CSS bundling.
7. Add code splitting for clinician designer, patient player, React Flow, and Three.js.
8. Add audio safety/quality tests with `OfflineAudioContext`.
9. Rewrite patient-facing copy to avoid unsupported medical claims.
10. Convert `public/presets.json` into evidence-tiered seed data.

