import React, { memo } from 'react';
import { Handle, Position, type NodeProps, NodeToolbar } from '@xyflow/react';
import { PlayCircle, Activity, TrendingDown, Square, Lock, Unlock } from 'lucide-react';
import { NoiseType } from '../types';

// Node Type Definitions
export interface TherapyNodeData extends Record<string, unknown> {
  duration: number;
  beat: number;
  carrier: number;
  noise: NoiseType;
  onUpdate?: (nodeId: string, data: Partial<TherapyNodeData>) => void;
  locked?: boolean;
  presetName?: string;
}

export interface RampNodeData extends Record<string, unknown> {
  duration: number;
  startFreq: number;
  endFreq: number;
  onUpdate?: (nodeId: string, data: Partial<RampNodeData>) => void;
  locked?: boolean;
}

export interface StartNodeData extends Record<string, unknown> {
  label: string;
}

export interface EndNodeData extends Record<string, unknown> {
  label: string;
}

// Start Node
export const StartNode = memo(({ data }: NodeProps) => {
  return (
    <div className="px-4 py-3 shadow-lg rounded-lg bg-gradient-to-br from-emerald-600 to-emerald-700 border-2 border-emerald-400 min-w-[180px]">
      <Handle type="source" position={Position.Right} className="w-3 h-3 bg-emerald-400" />
      <div className="flex items-center gap-2">
        <PlayCircle className="text-emerald-100" size={20} />
        <div className="text-white">
          <div className="text-sm font-bold">START SESSION</div>
          <div className="text-[10px] text-emerald-200 font-mono">Entry Point</div>
        </div>
      </div>
    </div>
  );
});

// Therapy Block Node
export const TherapyNode = memo(({ data, id, selected }: NodeProps) => {
  const nodeData = data as TherapyNodeData;
  const locked = nodeData.locked ?? false;
  const isPreset = !!nodeData.presetName;
  
  const handleChange = (field: keyof TherapyNodeData, value: any) => {
    if (!locked && nodeData.onUpdate) {
      nodeData.onUpdate(id, { [field]: value });
    }
  };

  const toggleLock = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (nodeData.onUpdate) {
      nodeData.onUpdate(id, { locked: !locked });
    }
  };
  
  // Colors: preset nodes are amber, regular nodes are sky blue
  const bgGradient = isPreset ? 'from-amber-600 to-amber-700' : 'from-sky-600 to-sky-700';
  const borderColor = isPreset ? 'border-amber-400' : 'border-sky-400';
  const handleColor = isPreset ? 'bg-amber-400' : 'bg-sky-400';
  const inputBg = isPreset ? 'bg-amber-800' : 'bg-sky-800';
  const inputBorder = isPreset ? 'border-amber-500' : 'border-sky-500';
  const inputFocus = isPreset ? 'focus:ring-amber-400' : 'focus:ring-sky-400';
  const labelColor = isPreset ? 'text-amber-200' : 'text-sky-200';
  const toolbarBg = isPreset ? 'bg-amber-800' : 'bg-sky-800';
  const buttonBg = isPreset ? 'bg-amber-700 hover:bg-amber-600' : 'bg-sky-700 hover:bg-sky-600';
  
  return (
    <>
      <NodeToolbar 
        isVisible={selected}
        position={Position.Top}
        className={`flex gap-1 ${toolbarBg} rounded p-1 shadow-lg`}
      >
        <button
          onClick={toggleLock}
          className={`px-2 py-1 ${buttonBg} text-white rounded text-xs flex items-center gap-1`}
          title={locked ? "Unlock to edit" : "Lock to prevent edits"}
        >
          {locked ? <Lock size={12} /> : <Unlock size={12} />}
          {locked ? 'Locked' : 'Unlocked'}
        </button>
      </NodeToolbar>
      
      <div className={`px-4 py-3 shadow-lg rounded-lg bg-gradient-to-br ${bgGradient} border-2 ${borderColor} w-full h-full min-w-[240px]`}>
        <Handle type="target" position={Position.Left} className={`w-3 h-3 ${handleColor}`} />
        <Handle type="source" position={Position.Right} className={`w-3 h-3 ${handleColor}`} />
        
        <div className="flex items-center gap-2 mb-3">
          <Activity className={isPreset ? 'text-amber-100' : 'text-sky-100'} size={20} />
          <div className="text-white">
            <div className="text-sm font-bold">{isPreset ? `PRESET: ${nodeData.presetName}` : 'THERAPY BLOCK'}</div>
            <div className={`text-[10px] ${labelColor} font-mono`}>Binaural Stimulation</div>
          </div>
        </div>
        
        <div className="space-y-2 text-xs">
          <div className="flex flex-col gap-1">
            <label className={`${labelColor} font-medium`}>Duration (min)</label>
            <input
              type="number"
              value={nodeData.duration}
              onChange={(e) => handleChange('duration', Number(e.target.value))}
              disabled={locked}
              min="1"
              max="120"
              className={`nodrag w-full px-2 py-1 ${inputBg} text-white rounded border ${inputBorder} focus:outline-none focus:ring-1 ${inputFocus} disabled:opacity-50`}
            />
          </div>
          
          <div className="flex flex-col gap-1">
            <label className={`${labelColor} font-medium`}>Beat Frequency (Hz)</label>
            <input
              type="number"
              value={nodeData.beat}
              onChange={(e) => handleChange('beat', Number(e.target.value))}
              disabled={locked}
              min="0.1"
              max="40"
              step="0.1"
              className={`nodrag w-full px-2 py-1 ${inputBg} text-white rounded border ${inputBorder} focus:outline-none focus:ring-1 ${inputFocus} disabled:opacity-50`}
            />
          </div>
          
          <div className="flex flex-col gap-1">
            <label className={`${labelColor} font-medium`}>Carrier (Hz)</label>
            <input
              type="number"
              value={nodeData.carrier}
              onChange={(e) => handleChange('carrier', Number(e.target.value))}
              disabled={locked}
              min="20"
              max="500"
              className={`nodrag w-full px-2 py-1 ${inputBg} text-white rounded border ${inputBorder} focus:outline-none focus:ring-1 ${inputFocus} disabled:opacity-50`}
            />
          </div>
          
          <div className="flex flex-col gap-1">
            <label className={`${labelColor} font-medium`}>Background Noise</label>
            <select
              value={nodeData.noise}
              onChange={(e) => handleChange('noise', e.target.value as NoiseType)}
              disabled={locked}
              className={`nodrag w-full px-2 py-1 ${inputBg} text-white rounded border ${inputBorder} focus:outline-none focus:ring-1 ${inputFocus} disabled:opacity-50`}
            >
              <option value="none">None</option>
              <option value="white">White</option>
              <option value="pink">Pink</option>
              <option value="brown">Brown</option>
              <option value="rain">Rain</option>
              <option value="wind">Wind</option>
              <option value="stream">Stream</option>
            </select>
          </div>
        </div>
      </div>
    </>
  );
});

// Ramp Node
export const RampNode = memo(({ data, id, selected }: NodeProps) => {
  const nodeData = data as RampNodeData;
  const locked = nodeData.locked ?? false;
  
  const handleChange = (field: keyof RampNodeData, value: any) => {
    if (!locked && nodeData.onUpdate) {
      nodeData.onUpdate(id, { [field]: value });
    }
  };

  const toggleLock = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (nodeData.onUpdate) {
      nodeData.onUpdate(id, { locked: !locked });
    }
  };
  
  return (
    <>
      <NodeToolbar 
        isVisible={selected}
        position={Position.Top}
        className="flex gap-1 bg-violet-800 rounded p-1 shadow-lg"
      >
        <button
          onClick={toggleLock}
          className="px-2 py-1 bg-violet-700 hover:bg-violet-600 text-white rounded text-xs flex items-center gap-1"
          title={locked ? "Unlock to edit" : "Lock to prevent edits"}
        >
          {locked ? <Lock size={12} /> : <Unlock size={12} />}
          {locked ? 'Locked' : 'Unlocked'}
        </button>
      </NodeToolbar>
      
      <div className="px-4 py-3 shadow-lg rounded-lg bg-gradient-to-br from-violet-600 to-violet-700 border-2 border-violet-400 w-full h-full min-w-[240px]">
        <Handle type="target" position={Position.Left} className="w-3 h-3 bg-violet-400" />
        <Handle type="source" position={Position.Right} className="w-3 h-3 bg-violet-400" />
        
        <div className="flex items-center gap-2 mb-3">
          <TrendingDown className="text-violet-100" size={20} />
          <div className="text-white">
            <div className="text-sm font-bold">ISO-RAMP</div>
            <div className="text-[10px] text-violet-200 font-mono">Dynamic Transition</div>
          </div>
        </div>
        
        <div className="space-y-2 text-xs">
          <div className="flex flex-col gap-1">
            <label className="text-violet-200 font-medium">Duration (min)</label>
            <input
              type="number"
              value={nodeData.duration}
              onChange={(e) => handleChange('duration', Number(e.target.value))}
              disabled={locked}
              min="1"
              max="60"
              className="nodrag w-full px-2 py-1 bg-violet-800 text-white rounded border border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-400 disabled:opacity-50"
            />
          </div>
          
          <div className="flex flex-col gap-1">
            <label className="text-violet-200 font-medium">Start Frequency (Hz)</label>
            <input
              type="number"
              value={nodeData.startFreq}
              onChange={(e) => handleChange('startFreq', Number(e.target.value))}
              disabled={locked}
              min="0.1"
              max="40"
              step="0.1"
              className="nodrag w-full px-2 py-1 bg-violet-800 text-white rounded border border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-400 disabled:opacity-50"
            />
          </div>
          
          <div className="flex flex-col gap-1">
            <label className="text-violet-200 font-medium">End Frequency (Hz)</label>
            <input
              type="number"
              value={nodeData.endFreq}
              onChange={(e) => handleChange('endFreq', Number(e.target.value))}
              disabled={locked}
              min="0.1"
              max="40"
              step="0.1"
              className="nodrag w-full px-2 py-1 bg-violet-800 text-white rounded border border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-400 disabled:opacity-50"
            />
          </div>
        </div>
      </div>
    </>
  );
});

// End Node
export const EndNode = memo(({ data }: NodeProps) => {
  return (
    <div className="px-4 py-3 shadow-lg rounded-lg bg-gradient-to-br from-rose-600 to-rose-700 border-2 border-rose-400 min-w-[180px]">
      <Handle type="target" position={Position.Left} className="w-3 h-3 bg-rose-400" />
      <div className="flex items-center gap-2">
        <Square className="text-rose-100" size={20} />
        <div className="text-white">
          <div className="text-sm font-bold">END SESSION</div>
          <div className="text-[10px] text-rose-200 font-mono">Termination</div>
        </div>
      </div>
    </div>
  );
});

StartNode.displayName = 'StartNode';
TherapyNode.displayName = 'TherapyNode';
RampNode.displayName = 'RampNode';
EndNode.displayName = 'EndNode';
