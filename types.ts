

export enum BrainwaveBand {
  Delta = 'Delta',
  Theta = 'Theta',
  Alpha = 'Alpha',
  Beta = 'Beta',
  Gamma = 'Gamma',
}

export enum NoiseType {
  None = 'none',
  White = 'white',
  Pink = 'pink',
  Brown = 'brown',
  Rain = 'rain',
  Wind = 'wind',
  Stream = 'stream',
}

export enum CarrierMode {
  Pure = 'pure',       // Standard Sine
  Soft = 'soft',       // Low-passed Triangle
  Harmonic = 'harmonic', // Chord (Fund + 5th + 8ve)
  Solfeggio = 'solfeggio' // 528Hz/432Hz Pure Tuning
}

export enum SpatialMode {
    None = 'none',
    Circular3D = '3d',      // Rotates around head
    Bilateral = 'bilateral', // EMDR Left-Right Scan
    Vortex = 'vortex'       // Complex Figure-8 Loop (Hemi-Sync style)
}

export interface AudioState {
  isPlaying: boolean;
  masterVolume: number;
  binauralVolume: number;
  noiseVolume: number;
  voiceVolume: number;
  
  // Frequency State
  carrierFreq: number;
  beatFreq: number;
  carrierMode: CarrierMode;
  
  noiseType: NoiseType;
  isMuted: boolean;
  binauralSpatial: boolean;
  
  // Refactored Spatial Audio
  noiseSpatialMode: SpatialMode;
  
  isochronicAmount: number;
  
  // Advanced Features
  phaseLocking: boolean; // Neural Phase Locking (AM Modulation)

  // Protocol / Ramping State
  isRamping: boolean;
  rampStartFreq: number;
  rampEndFreq: number;
  rampDurationMinutes: number;
  
  // Sequence Mode
  isSequencing: boolean;
  
  // Safety / Session
  autoWakeup: boolean; 
  
  // New Safety & UX Features
  safetyMode: boolean; // Limits strobe/pulse depth
  breathingGuide: boolean; // 0.1Hz Amplitude Modulation

  // Phase 3: Active Protocol Playlist
  activeProtocol: ProtocolStep[];
}

export type ProtocolStepType = 'therapy' | 'ramp' | 'instruction';

export interface ProtocolStep {
  type: ProtocolStepType;
  duration?: number; // minutes
  // Therapy Params
  beat?: number;
  carrier?: number;
  noise?: NoiseType | string; // Allow both for compatibility
  // Ramp Params
  start?: number;
  end?: number;
  // Instruction Params
  text?: string;
}

export interface ProtocolStatus {
    isActive: boolean;
    currentStepIndex: number;
    totalSteps: number;
    currentStepName: string;
    remainingSeconds: number;
    nextStepName?: string;
}

export interface SequenceStep {
  id: string;
  name: string;
  durationMinutes: number;
  beatFreq: number;
  carrierFreq: number;
  noiseType: NoiseType;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  action: string;
  details: string;
}

export interface CustomPreset {
  id: string;
  name: string;
  carrier: number;
  beat: number;
  noise: NoiseType;
  carrierMode: CarrierMode;
  description: string;
}

export interface AIRecommendation {
  carrierHz: number;
  beatHz: number;
  noiseType: NoiseType;
  explanation: string;
  recommendedDurationMin: number;
  
  // Advanced Controls
  carrierMode: CarrierMode;
  spatialMode: SpatialMode;
  isochronicAmount: number; // 0 to 1
  phaseLocking?: boolean;
  
  // Protocol / Ramping
  isRamping: boolean;
  rampStartHz?: number;
  rampEndHz?: number;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  type?: 'text' | 'recommendation' | 'error';
  recommendationData?: AIRecommendation;
}

export const BAND_COLORS = {
  [BrainwaveBand.Delta]: '#22d3ee', // Cyan
  [BrainwaveBand.Theta]: '#34d399', // Emerald
  [BrainwaveBand.Alpha]: '#a78bfa', // Violet
  [BrainwaveBand.Beta]: '#fb923c',  // Orange
  [BrainwaveBand.Gamma]: '#f472b6', // Pink
};

declare global {
  interface Window {
    LiteGraph: any;
    LGraph: any;
    LGraphCanvas: any;
  }
}
