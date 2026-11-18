
import { BrainwaveBand, NoiseType, CarrierMode } from "./types";

// --- DEVELOPER CONFIG ---
export const ENABLE_TOOLTIPS = true; // Set to false to disable all hover explanations
// ------------------------

export const DEFAULT_CARRIER = 200;
export const DEFAULT_BEAT = 10;
export const MAX_VOLUME = 1.0;

export const PRESETS: any[] = [];

export const CLINICAL_PROTOCOLS: any[] = [];

export const KNOWLEDGE_BASE_SUMMARY = `
{
  "meta": { "version": "3.0", "sourceType": "neuro_acoustic_clinical_guidelines" },
  "guidelines": {
    "carrier_synthesis": {
      "pure": "Use for high-precision clinical focus (Beta/Gamma) or ADHD tasks where clarity is paramount.",
      "soft": "Use for sleep induction (Delta) or sensitive patients prone to sensory overload. Triangle waves reduce harshness.",
      "harmonic": "Use for deep meditation (Theta) or creative flow (Alpha). Richer textures prevent 'auditory habituation' (brain ignoring the signal)."
    },
    "isochronic_pulses": {
      "usage": "Use high intensity (0.5 - 1.0) for 'Cortical Driving' in fatigue, ADHD, or peak performance. Use low intensity (0.0 - 0.2) for sleep/anxiety to avoid over-stimulation.",
      "mechanism": "Sharp onset pulses create stronger Evoked Potentials than continuous binaural sine waves."
    },
    "spatial_processing": {
      "bilateral": "CRITICAL for Trauma, PTSD, High Anxiety, or emotional processing. Mimics EMDR (Eye Movement Desensitization). Scans Left-Right at ~0.5Hz.",
      "3d_circular": "Use for immersion, dissociation from pain, or deep meditative trance.",
      "none": "Use for standard study/focus tasks to minimize distraction."
    },
    "protocols_and_ramping": {
      "sleep_induction": "ALWAYS Ramp. Start at user's likely current state (e.g. 15Hz Beta) and ramp down to target (e.g. 2Hz Delta) over 15-20 mins.",
      "focus_priming": "Static frequency is usually fine, or ramp UP from Alpha (10Hz) to Beta (20Hz)."
    }
  },
  "bands": {
    "delta": {
      "range": [0.5, 4],
      "function": "Deep Sleep, Immune Recovery, Pain Relief.",
      "carrier_rec": "100Hz - 150Hz (Soft Mode)"
    },
    "theta": {
      "range": [4, 8],
      "function": "Deep Meditation, REM Sleep, Creativity, Emotional Healing.",
      "carrier_rec": "150Hz - 250Hz (Harmonic Mode)"
    },
    "alpha": {
      "range": [8, 12],
      "function": "Relaxed Focus, Flow State, Stress Reduction.",
      "carrier_rec": "250Hz - 350Hz (Pure or Harmonic)"
    },
    "beta": {
      "range": [13, 30],
      "function": "Active Focus, Analytical Thinking, Energy.",
      "carrier_rec": "350Hz - 450Hz (Pure Mode + Isochronic Pulse)"
    },
    "gamma": {
      "range": [30, 70],
      "function": "Peak Cognition, Memory Binding.",
      "carrier_rec": "500Hz+ (Harmonic Mode + Strong Pulse)"
    }
  }
}
`;

export const DETERMINE_BAND = (beatFreq: number): BrainwaveBand => {
  if (beatFreq <= 4) return BrainwaveBand.Delta;
  if (beatFreq <= 8) return BrainwaveBand.Theta;
  if (beatFreq <= 12) return BrainwaveBand.Alpha;
  if (beatFreq <= 30) return BrainwaveBand.Beta;
  return BrainwaveBand.Gamma;
}

