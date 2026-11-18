
import { useEffect } from 'react';
import { AudioState, NoiseType, CarrierMode } from '../types';
import { logger } from '../services/logger';

interface UseKeyboardShortcutsProps {
  isPlaying: boolean;
  togglePlay: () => void;
  updateSettings: (updates: Partial<AudioState>) => void;
  audioState: AudioState;
}

export const useKeyboardShortcuts = ({ isPlaying, togglePlay, updateSettings, audioState }: UseKeyboardShortcutsProps) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      switch(e.code) {
        case 'Space':
          e.preventDefault();
          togglePlay();
          logger.log('Hotkey', isPlaying ? 'Pause' : 'Play');
          break;
        case 'KeyM':
          const newMuteState = !audioState.isMuted;
          updateSettings({ isMuted: newMuteState });
          logger.log('Hotkey', newMuteState ? 'Muted' : 'Unmuted');
          break;
        case 'Escape':
          if (isPlaying) {
            togglePlay();
            logger.log('Hotkey', 'Emergency Stop');
          }
          break;
        
        // Quick Presets
        case 'Digit1': // Delta
          updateSettings({ beatFreq: 2, carrierFreq: 100, noiseType: NoiseType.Brown, carrierMode: CarrierMode.Soft });
          logger.log('Hotkey', 'Preset: Delta (Sleep)');
          break;
        case 'Digit2': // Theta
          updateSettings({ beatFreq: 6, carrierFreq: 180, noiseType: NoiseType.Pink, carrierMode: CarrierMode.Harmonic });
          logger.log('Hotkey', 'Preset: Theta (Meditate)');
          break;
        case 'Digit3': // Alpha
          updateSettings({ beatFreq: 10, carrierFreq: 300, noiseType: NoiseType.Pink, carrierMode: CarrierMode.Pure });
          logger.log('Hotkey', 'Preset: Alpha (Relax)');
          break;
        case 'Digit4': // Beta
          updateSettings({ beatFreq: 20, carrierFreq: 400, noiseType: NoiseType.White, carrierMode: CarrierMode.Pure });
          logger.log('Hotkey', 'Preset: Beta (Focus)');
          break;
        case 'Digit5': // Gamma
          updateSettings({ beatFreq: 40, carrierFreq: 500, noiseType: NoiseType.White, carrierMode: CarrierMode.Harmonic });
          logger.log('Hotkey', 'Preset: Gamma (Peak)');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, togglePlay, updateSettings, audioState.isMuted]);
};
