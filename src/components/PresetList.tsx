import React, { useState, useEffect } from 'react';
import { useAudio } from '../contexts/AudioContext';
import { presetManager } from '../services/presetManager';
import { CustomPreset, AudioState, NoiseType, CarrierMode } from '../types';
import { Trash2, Save } from 'lucide-react';
import { logger } from '../services/logger';

interface PresetListProps {
  onApplyPreset: (preset: any) => void;
  currentAudioState?: AudioState; // Optional for saving
}

const PresetList: React.FC<PresetListProps> = ({ onApplyPreset, currentAudioState }) => {
  const { quickPresets, isPresetsLoading } = useAudio();
  const [customPresets, setCustomPresets] = useState<CustomPreset[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [newPresetName, setNewPresetName] = useState("");

  useEffect(() => {
    setCustomPresets(presetManager.getPresets());
  }, []);

  const handleSave = () => {
    if (!currentAudioState || !newPresetName) return;

    const newPreset = presetManager.savePreset({
      name: newPresetName,
      carrier: currentAudioState.carrierFreq,
      beat: currentAudioState.beatFreq,
      noise: currentAudioState.noiseType,
      carrierMode: currentAudioState.carrierMode,
      description: `Custom ${currentAudioState.beatFreq}Hz`
    });

    setCustomPresets(prev => [...prev, newPreset]);
    setNewPresetName("");
    setIsSaving(false);
    logger.log('Presets', `Saved custom preset: ${newPreset.name}`);
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    presetManager.deletePreset(id);
    setCustomPresets(prev => prev.filter(p => p.id !== id));
    logger.log('Presets', 'Deleted preset');
  };

  return (
    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide items-start">
      {/* Default Presets */}
      {isPresetsLoading ? (
        <div className="flex items-center px-4 py-3 min-w-[130px] border border-black/5 rounded animate-pulse text-[10px] uppercase text-swiss-sub font-bold">Loading...</div>
      ) : (
        quickPresets.map((preset, idx) => (
          <button
            key={`def-${idx}`}
            onClick={() => onApplyPreset(preset)}
            className="swiss-button bg-white/40 hover:bg-white/60 border border-white/60 text-swiss-text px-4 py-3 min-w-[130px] text-left group flex-shrink-0"
          >
            <div className="flex flex-col">
              <span className="font-bold mb-1 text-sm">{preset.name}</span>
              <span className="text-[10px] text-swiss-sub group-hover:text-black">{preset.beat}Hz • {preset.description.slice(0, 15)}...</span>
            </div>
          </button>
        ))
      )}

      {/* Custom Presets */}
      {customPresets.map((preset) => (
        <button
          key={preset.id}
          onClick={() => onApplyPreset(preset)}
          className="swiss-button relative bg-indigo-50/40 hover:bg-indigo-50/60 border border-indigo-100 text-swiss-text px-4 py-3 min-w-[130px] text-left group flex-shrink-0"
        >
          <div className="flex flex-col">
            <span className="font-bold mb-1 text-sm text-indigo-900">{preset.name}</span>
            <span className="text-[10px] text-indigo-400 group-hover:text-indigo-700">{preset.beat}Hz • Custom</span>
          </div>
          <div
            onClick={(e) => handleDelete(e, preset.id)}
            className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 p-1 hover:text-red-500 transition-opacity"
          >
            <Trash2 size={12} />
          </div>
        </button>
      ))}

      {/* Save New Button */}
      {currentAudioState && (
        !isSaving ? (
          <button
            onClick={() => setIsSaving(true)}
            className="swiss-button bg-transparent border border-dashed border-black/20 text-swiss-sub hover:border-black/40 hover:text-black px-4 py-3 whitespace-nowrap h-full flex items-center gap-2"
          >
            <Save size={14} /> <span className="text-xs">Save Current</span>
          </button>
        ) : (
          <div className="bg-white border border-black/10 rounded p-2 min-w-[160px] flex flex-col gap-2 shadow-sm">
            <input
              autoFocus
              className="text-xs border-b border-black/10 pb-1 focus:outline-none"
              placeholder="Preset Name..."
              value={newPresetName}
              onChange={e => setNewPresetName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSave()}
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setIsSaving(false)} className="text-[10px] text-gray-400">Cancel</button>
              <button onClick={handleSave} className="text-[10px] font-bold text-black">Save</button>
            </div>
          </div>
        )
      )}
    </div>
  );
};

export default PresetList;
