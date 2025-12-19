# Audio Engine Implementation Plan: Science-Backed Professionalization

This document outlines the technical steps to upgrade the **NeuroFlow-IV2** audio engine to professional clinical standards, specifically addressing artifact mitigation (zipper noise) and evidence-based synthesis refinements.

## 1. Objective
Eliminate audible artifacts (clicks, pops, zipper noise) during parameter changes and ensure the audio synthesis aligns with Web Audio API best practices for therapeutic applications.

## 2. Context & Rationale (Research-Backed)

### 2.1 The "Zipper Noise" Problem
Clinical research and technical audits of the current engine identified significant "zipper noise" and audible clicks when dragging frequency sliders or switching synthesis modes (as detailed in [neuroflow-research-backed-review.md](neuroflow-research-backed-review.md#L380-L405)). In a therapeutic context, these artifacts are not just aesthetic issues; they can disrupt the patient's state of relaxation and break the "immersion" required for effective brainwave entrainment.

### 2.2 Root Cause: Discontinuous Transitions
The audit of `audioEngine.ts` revealed that when parameters like `CarrierMode` or `PhaseLocking` are changed, the engine immediately destroys the existing oscillator banks and creates new ones (see [neuroflow-research-backed-review.md](neuroflow-research-backed-review.md#L407-L430)). 
- **Amplitude Discontinuity:** Old oscillators stop abruptly (often not at a zero-crossing), and new ones start at full gain.
- **Buffer Gaps:** The time taken to destroy and recreate nodes creates a micro-gap in the audio buffer.
- **Result:** The human ear perceives these discontinuities as "pops" or "scratches."

### 2.3 The Solution: Crossfading & Ramping
To achieve "Clinical Grade" audio, we must move from a **Switching** model to a **Morphing** model. By using simultaneous gain ramping (fading out the old while fading in the new), we maintain a continuous amplitude envelope (as recommended in [neuroflow-research-backed-review.md](neuroflow-research-backed-review.md#L432-L530)). This aligns with Web Audio API best practices (2022–2025) which state: *"To reduce 'ugly clicks,' we must ramp oscillators up and down rather than starting/stopping them abruptly."*

## 3. Core Improvements

### 3.1 Crossfading Oscillator Banks
**Problem:** Currently, changing `CarrierMode` or toggling `PhaseLocking` triggers `stopBanks()`, which immediately destroys nodes, causing audible pops.
**Solution:** Implement a crossfade mechanism that ramps down the old bank while simultaneously ramping up the new bank.

- **File:** [services/audioEngine.ts](services/audioEngine.ts)
- **Action:** Add `crossfadeOscillatorBanks(newCarrier, newBeat, fadeDuration)` method.
- **Logic:**
    1. Create new `VoiceBank` with gain at 0.
    2. Ramp current `VoiceBank` gain to 0 over `fadeDuration`.
    3. Ramp new `VoiceBank` gain to target (0.6 or 0.2) over `fadeDuration`.
    4. Schedule `stop()` and `disconnect()` for the old bank nodes after the fade completes.

### 3.2 Smooth Node Cleanup
**Problem:** `stopBanks()` and `stop()` methods disconnect nodes abruptly.
**Solution:** Ensure all disconnections are preceded by a gain ramp to zero.

- **File:** [services/audioEngine.ts](services/audioEngine.ts)
- **Action:** Refactor `stopBanks()` to accept an optional `fadeDuration`.
- **Logic:** Use `exponentialRampToValueAtTime` or `linearRampToValueAtTime` on the bank's `GainNode` before calling `osc.stop()`.

### 3.3 Synchronized Filter & Q Ramping
**Problem:** In `Soft` mode, the `BiquadFilterNode` frequency is updated but not always ramped in perfect sync with the oscillator, and the `Q` factor is static.
**Solution:** Synchronize all filter parameters with frequency changes.

- **File:** [services/audioEngine.ts](services/audioEngine.ts)
- **Action:** Update `updateOscillatorBanks` and `createVoiceBank`.
- **Logic:**
    - Ramp `filter.frequency` using the same `endTime` as the oscillator.
    - Implement a slight ramp for `filter.Q` to avoid resonance transients during fast sweeps.

### 3.4 Neural Phase Locking Refinement
**Problem:** Phase locking (AM modulation) is currently a binary toggle that recreates the bank.
**Solution:** Allow smooth transition of AM depth.

- **File:** [services/audioEngine.ts](services/audioEngine.ts)
- **Action:** Update `setPhaseLocking` to ramp the `amDepth` gain node instead of recreating the entire bank if possible, or use the new crossfade method.

## 4. Hook Integration

### 4.1 useAudioController.ts Updates
**Action:** Update the `useEffect` sync loop to handle state changes more gracefully.

- **Logic:**
    - Detect if `carrierMode` or `phaseLocking` changed.
    - Call `audioEngine.crossfadeOscillatorBanks` instead of letting the `useEffect` trigger a hard restart.
    - Ensure `isPlaying` transitions use the engine's `fadeOut` and a new `fadeIn` method.

## 5. Implementation Roadmap

### Step 1: Foundation (The "Anti-Click" Patch)
1.  Modify `VoiceBank` interface to support better tracking of internal nodes.
2.  Implement `crossfadeOscillatorBanks` in `audioEngine.ts`.
3.  Update `setCarrierMode` and `setPhaseLocking` to use crossfading.

### Step 2: Refinement (The "Smooth Sweep" Patch)
1.  Update `updateOscillatorBanks` to ensure filter parameters ramp in sync.
2.  Add `fadeIn(duration)` method to `audioEngine.ts` to match `fadeOut`.
3.  **Extract Noise Engine:** Refactor `audioEngine.ts` to move procedural noise generation (Rain, Wind, Pink/White noise) into a dedicated `services/noiseEngine.ts` for better modularity (as suggested in [neuroflow-research-backed-review.md](neuroflow-research-backed-review.md#L1180)).

### Step 3: Validation & Testing
1.  **Manual Sweep Test:** Drag the frequency slider rapidly; verify zero clicks.
2.  **Mode Toggle Test:** Switch between 'Pure', 'Soft', and 'Harmonic' during playback; verify smooth transition.
3.  **Unit Tests:** Implement tests for audio parameter validation to ensure frequencies remain within safe, therapeutic ranges (20Hz - 20kHz for carrier, 0.5Hz - 40Hz for beats).
4.  **Oscilloscope Check:** (Optional) Use browser dev tools to verify smooth amplitude envelopes during transitions.

## 6. Success Metrics
- **Zero Pops:** No audible discontinuities during any parameter change.
- **Seamless Transitions:** Mode changes feel like a "morph" rather than a "switch".
- **Clinical Grade:** Audio quality matches professional hardware entrainment devices.
