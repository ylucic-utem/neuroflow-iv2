
import { CustomPreset, NoiseType, CarrierMode } from '../types';

const STORAGE_KEY = 'neuroflow_presets';

export const presetManager = {
  getPresets(): CustomPreset[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.error("Failed to load presets", e);
      return [];
    }
  },

  savePreset(preset: Omit<CustomPreset, 'id'>) {
    const presets = this.getPresets();
    const newPreset: CustomPreset = {
      ...preset,
      id: Math.random().toString(36).substr(2, 9)
    };
    presets.push(newPreset);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
    return newPreset;
  },

  deletePreset(id: string) {
    const presets = this.getPresets().filter(p => p.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
  }
};
