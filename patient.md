# Multi-Tenant SaaS Implementation Plan: Clinician & Patient Portals

This document outlines the architectural transition of **NeuroFlow-IV2** from a single-page configuration tool to a multi-tenant SaaS platform with dedicated experiences for clinicians and patients.

## 1. Context & Objectives

### 1.1 The Need for Separation
Currently, the application conflates clinician-level configuration (AI assistants, frequency sliders, session design) with the patient-level experience (therapy delivery, visualizers). To scale as a professional B2B healthcare platform, we must provide (as identified in [neuroflow-research-backed-review.md](neuroflow-research-backed-review.md#L15) and [neuroflow-research-backed-review.md](neuroflow-research-backed-review.md#L210-L250)):
- **Clinicians:** A robust dashboard for patient management, protocol prescription, and research-backed session design.
- **Patients:** A distraction-free, simplified environment focused entirely on the therapeutic audio and visual experience.

### 1.2 Design Philosophy & Style Consistency
All new pages, layouts, and components must strictly adhere to the existing **NeuroFlow-IV2** aesthetic:
- **Glassmorphism:** Use of `backdrop-blur`, semi-transparent backgrounds (`bg-white/10`), and subtle borders.
- **Color Palette:** Deep indigo/violet gradients, neon accents for active states, and high-contrast typography.
- **Animations:** Smooth transitions using Framer Motion (if applicable) or CSS transitions to maintain the "flow" state.
- **Typography:** Clean, mono-spaced fonts for technical data and sans-serif for general UI.

## 2. Objective
Separate the clinician's "Prescription & Configuration" environment from the patient's "Therapy & Listening" environment, ensuring a professional, role-based user experience.

## 3. Architectural Overview

### 3.1 Role-Based Routing
We will implement `react-router-dom` to handle distinct entry points (as proposed in [neuroflow-research-backed-review.md](neuroflow-research-backed-review.md#L850-L950)):
- `/` or `/login`: Role selection and authentication.
- `/clinician/*`: Dashboard, Patient Management, and Protocol Library.
- `/patient/*`: Simplified player interface and session history.

### 3.2 State Separation
- **Clinician State:** Focuses on patient lists, protocol definitions, and session assignment.
- **Patient State:** Focuses on the active session, playback controls, and outcome reporting.
- **Shared State:** Audio engine configuration (via `useAudioController`) will be used by both but initialized with different parameters based on the role.

## 4. New Directory Structure
This structure supports the multi-tenant data isolation strategy described in [neuroflow-research-backed-review.md](neuroflow-research-backed-review.md#L550-L600).
```
src/
├── pages/
│   ├── auth/
│   │   └── LoginPage.tsx          # Role selection / Login
│   ├── clinician/
│   │   ├── Dashboard.tsx          # Patient list & overview
│   │   ├── ProtocolLibrary.tsx    # Evidence-based protocols
│   │   └── SessionDesigner.tsx    # Refactored SessionCreator
│   └── patient/
│       ├── SessionList.tsx        # Assigned sessions for patient
│       └── Player.tsx             # Simplified distraction-free player
├── layouts/
│   ├── ClinicianLayout.tsx        # Sidebar + Header for clinicians
│   └── PatientLayout.tsx          # Minimalist layout for patients
└── App.tsx                        # Main Router configuration
```

## 4. Implementation Steps

### Step 1: Routing & Layouts
1.  Install `react-router-dom`.
2.  Refactor `App.tsx` to act as a Router.
3.  Create `ClinicianLayout` and `PatientLayout` to wrap role-specific pages.

### Step 2: Clinician Portal Refactoring
1.  **Dashboard:** Move the patient management logic (currently non-existent in UI) to a new `Dashboard.tsx`.
2.  **Protocol Library:** Create a view to browse `CLINICAL_PROTOCOLS` (from `constants.ts`).
3.  **Session Designer:** Move `SessionCreatorModal` logic into a dedicated page or keep as a modal accessible from the dashboard.
4.  **Sidebar:** Refactor `SidebarControls.tsx` to remove patient-facing elements (like the "Patient View" toggle) and focus on clinician tools.

### Step 3: Patient Portal Implementation
1.  **Player Page:** Create `Player.tsx` by extracting the core visualizer and playback logic from `PatientOverlay.tsx`.
2.  **Outcome Form:** Add a post-session feedback component to collect pre/post symptom scores.
3.  **Distraction-Free UI:** Ensure the patient portal has no access to frequency sliders or advanced audio settings unless explicitly allowed by the clinician.

### Step 4: Component Migration & Protocol Library
- **Move to Clinician:** `PresetList.tsx`, `NodeEditorPanel.tsx`, `TimelineEditor.tsx`, `ChatInterface.tsx`.
- **Move to Patient:** `WaveformVisualizer.tsx`, `ParticleVisualizer.tsx`, `AudioMeter.tsx`.
- **Shared:** `Header.tsx`, `Visualizer.tsx`, `Tooltip.tsx`.
- **Protocol Library:** Implement the `CLINICAL_PROTOCOLS` constant and `ProtocolCard.tsx` component to display evidence-based research citations and contraindications (as detailed in [neuroflow-research-backed-review.md](neuroflow-research-backed-review.md#L100-L200)).

### Step 5: Validation & Quality Assurance
1.  **Role Isolation Test:** Verify that a user logged in as a "Patient" cannot access clinician-only routes or components.
2.  **E2E Workflow Testing:** Implement end-to-end tests for the core clinician workflow: Login -> Create/Select Protocol -> Assign to Patient -> Verify Patient Access (as suggested in [neuroflow-research-backed-review.md](neuroflow-research-backed-review.md#L1185)).
3.  **Design Audit:** Ensure all new pages (Dashboard, Protocol Library, Player) match the glassmorphism style and color palette of the original app.

## 6. Specific File Changes

### 6.1 App.tsx (The Router)
```tsx
// New App.tsx structure
<BrowserRouter>
  <Routes>
    <Route path="/login" element={<LoginPage />} />
    
    <Route path="/clinician" element={<ClinicianLayout />}>
      <Route index element={<ClinicianDashboard />} />
      <Route path="protocols" element={<ProtocolLibrary />} />
      <Route path="designer" element={<SessionDesigner />} />
    </Route>

    <Route path="/patient" element={<PatientLayout />}>
      <Route index element={<SessionList />} />
      <Route path="play/:sessionId" element={<Player />} />
    </Route>

    <Route path="*" element={<Navigate to="/login" />} />
  </Routes>
</BrowserRouter>
```

### 6.2 SidebarControls.tsx (Clinician Version)
- Remove `onOpenPatientView`.
- Add navigation links to "Patients", "Protocols", and "Reports".
- Keep AI Assistant for clinician use.

### 6.3 PatientOverlay.tsx -> Player.tsx
- Convert from an overlay to a full-page component.
- Remove the "Close" button (replaced by navigation).
- Add a "Finish Session" button that triggers the outcome form.

## 7. Success Metrics
- **Role Isolation:** A patient cannot access the AI Assistant or frequency sliders.
- **Navigation:** Clinicians can switch between designing sessions and managing patients seamlessly.
- **UX Clarity:** The patient interface is significantly simpler than the clinician interface.
- **Design Fidelity:** All new UI elements are indistinguishable from the original application style.
