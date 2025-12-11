

import { useState, useEffect, useCallback, useRef } from 'react';
import { audioEngine } from '../services/audioEngine';
import { AudioState, NoiseType, CarrierMode, SpatialMode, ProtocolStep } from '../types';
import { DEFAULT_CARRIER, DEFAULT_BEAT } from '../constants';

export const useAudioController = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const wasPlayingRef = useRef(false);
  const intervalRef = useRef<number | null>(null);
  
  // Ramping Timestamps
  const rampStartTimeRef = useRef<number>(0);
  
  const [audioState, setAudioState] = useState<AudioState>({
    isPlaying: false,
    masterVolume: 0.8,
    binauralVolume: 0.7,
    noiseVolume: 0.3,
    voiceVolume: 0.6,
    carrierFreq: DEFAULT_CARRIER,
    beatFreq: DEFAULT_BEAT,
    noiseType: NoiseType.Pink,
    isMuted: false,
    binauralSpatial: false,
    
    // New Feature Defaults
    noiseSpatialMode: SpatialMode.None,
    autoWakeup: true,
    safetyMode: true, // Epilepsy protection on by default
    breathingGuide: false,
    
    isochronicAmount: 0,
    carrierMode: CarrierMode.Pure,
    phaseLocking: false,
    
    // Ramping Defaults
    isRamping: false,
    rampStartFreq: 15,
    rampEndFreq: 4,
    rampDurationMinutes: 10,

    // Sequence Mode
    isSequencing: false,
    
    // Phase 3: Active Protocol
    activeProtocol: [],
  });

  // Main Sync Loop
  useEffect(() => {
    // Sync immediate audio properties
    audioEngine.setCarrierMode(audioState.carrierMode);
    
    // Volume & Spatial
    const isStarting = isPlaying && !wasPlayingRef.current;
    const rampTime = isStarting ? 0.8 : 0.1;
    
    audioEngine.setVolume('master', audioState.isMuted ? 0 : audioState.masterVolume, rampTime);
    audioEngine.setVolume('binaural', audioState.binauralVolume);
    audioEngine.setVolume('noise', audioState.noiseVolume);
    audioEngine.setVolume('voice', audioState.voiceVolume);
    
    audioEngine.setBinauralSpatial(audioState.binauralSpatial);
    audioEngine.setNoiseSpatialMode(audioState.noiseSpatialMode);
    
    // Safety & Features
    audioEngine.setSafetyMode(audioState.safetyMode);
    audioEngine.setBreathingGuide(audioState.breathingGuide);
    audioEngine.setIsochronicPulse(audioState.isochronicAmount);
    audioEngine.setPhaseLocking(audioState.phaseLocking);

    if (isPlaying) {
      audioEngine.setNoise(audioState.noiseType);
      
      // #4A: Schedule High-Precision Ramp on Audio Thread
      // If ramping is enabled, we tell the engine to handle the frequency curve.
      if (audioState.isRamping) {
          const durationSecs = audioState.rampDurationMinutes * 60;
          audioEngine.scheduleRamp(
              audioState.carrierFreq, 
              audioState.rampStartFreq, 
              audioState.carrierFreq, 
              audioState.rampEndFreq, 
              durationSecs
          );
      } else {
          // Fixed Mode
          audioEngine.setFrequencies(audioState.carrierFreq, audioState.beatFreq);
      }
    }

    wasPlayingRef.current = isPlaying;
  }, [audioState, isPlaying]);

  // UI Visualization Interpolation Loop
  // OPTIMIZATION: Throttled to 100ms (10fps) instead of 60fps raf to save Main Thread for Visualizer/Audio
  useEffect(() => {
    if (isPlaying && audioState.isRamping) {
        if (!rampStartTimeRef.current) {
            rampStartTimeRef.current = Date.now();
        }

        if (intervalRef.current) clearInterval(intervalRef.current);
        
        intervalRef.current = window.setInterval(() => {
            const now = Date.now();
            const elapsedSec = (now - rampStartTimeRef.current) / 1000;
            const totalSec = audioState.rampDurationMinutes * 60;
            
            // Calculate Progress (0 to 1) for UI Display
            let progress = elapsedSec / totalSec;
            if (progress > 1) {
                progress = 1;
                if (intervalRef.current) clearInterval(intervalRef.current);
            }

            // Lerp Frequency for Visualizer
            const start = audioState.rampStartFreq;
            const end = audioState.rampEndFreq;
            const current = start + (end - start) * progress;

            // Update State for UI only
            setAudioState(prev => ({ ...prev, beatFreq: current }));

        }, 100); // 100ms throttle
    } else {
        rampStartTimeRef.current = 0;
        if (intervalRef.current) clearInterval(intervalRef.current);
    }

    return () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying, audioState.isRamping, audioState.rampStartFreq, audioState.rampEndFreq, audioState.rampDurationMinutes]);

  const togglePlay = useCallback(async () => {
    if (!isPlaying) {
      await audioEngine.start();
      if (audioState.isRamping) {
          rampStartTimeRef.current = Date.now();
      }
      audioEngine.setNoise(audioState.noiseType);
      setIsPlaying(true);
    } else {
      audioEngine.stop();
      setIsPlaying(false);
      rampStartTimeRef.current = 0;
    }
  }, [isPlaying, audioState.noiseType, audioState.isRamping]);

  const updateSettings = useCallback((updates: Partial<AudioState>) => {
    setAudioState(prev => {
        // If switching into ramping mode, start visualization from the start freq
        if (updates.isRamping === true && !prev.isRamping) {
            rampStartTimeRef.current = Date.now(); // Reset timer
            return { ...prev, ...updates, beatFreq: prev.rampStartFreq };
        }
        return { ...prev, ...updates };
    });
  }, []);

  const setSessionPlaylist = useCallback((playlist: ProtocolStep[]) => {
      setAudioState(prev => ({ ...prev, activeProtocol: playlist }));
  }, []);

  return { 
    isPlaying, 
    audioState, 
    togglePlay, 
    updateSettings,
    setSessionPlaylist
  };
};