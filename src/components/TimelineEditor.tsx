
import React, { useState } from 'react';
import { SequenceStep, NoiseType } from '../types';
import { Plus, X, ArrowRight, Clock } from 'lucide-react';

interface TimelineEditorProps {
    sequence: SequenceStep[];
    currentStepIndex: number;
    isActive: boolean;
    remainingSeconds: number;
    onAddStep: (step: SequenceStep) => void;
    onRemoveStep: (id: string) => void;
}

const TimelineEditor: React.FC<TimelineEditorProps> = ({ 
    sequence, 
    currentStepIndex, 
    isActive,
    remainingSeconds, 
    onAddStep, 
    onRemoveStep 
}) => {
    const [isAdding, setIsAdding] = useState(false);
    const [newStep, setNewStep] = useState<Partial<SequenceStep>>({
        name: 'New Phase',
        durationMinutes: 5,
        beatFreq: 10,
        carrierFreq: 200,
        noiseType: NoiseType.Pink
    });

    const handleAdd = () => {
        onAddStep({
            id: Math.random().toString(36).substr(2, 9),
            name: newStep.name || 'Phase',
            durationMinutes: newStep.durationMinutes || 5,
            beatFreq: newStep.beatFreq || 10,
            carrierFreq: newStep.carrierFreq || 200,
            noiseType: newStep.noiseType || NoiseType.Pink
        });
        setIsAdding(false);
    };

    const formatTime = (sec: number) => {
        const m = Math.floor(sec / 60);
        const s = sec % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    return (
        <div className="space-y-3">
            {/* Timeline Visualization */}
            <div className="relative pl-4 space-y-4 before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-[2px] before:bg-black/5">
                {sequence.map((step, idx) => {
                    const isCurrent = isActive && idx === currentStepIndex;
                    return (
                        <div key={step.id} className={`relative flex items-center gap-3 group`}>
                            {/* Dot */}
                            <div className={`w-2.5 h-2.5 rounded-full z-10 flex-shrink-0 transition-colors ${isCurrent ? 'bg-green-500 ring-4 ring-green-100' : 'bg-gray-300'}`} />
                            
                            {/* Card */}
                            <div className={`flex-1 p-3 rounded border transition-all ${isCurrent ? 'bg-green-50/50 border-green-200' : 'bg-white/40 border-black/5'}`}>
                                <div className="flex justify-between items-start mb-1">
                                    <span className="text-xs font-bold text-black">{step.name}</span>
                                    {!isActive && (
                                        <button onClick={() => onRemoveStep(step.id)} className="text-black/20 hover:text-red-500">
                                            <X size={12} />
                                        </button>
                                    )}
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-[10px] text-swiss-sub font-mono">
                                    <div>
                                        <span className="block opacity-50">TARGET</span>
                                        {step.beatFreq}Hz / {step.carrierFreq}Hz
                                    </div>
                                    <div className="text-right">
                                        <span className="block opacity-50">DURATION</span>
                                        {isCurrent ? (
                                            <span className="text-green-600 font-bold">{formatTime(remainingSeconds)}</span>
                                        ) : (
                                            <span>{step.durationMinutes}m</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Add Button */}
            {!isActive && (
                !isAdding ? (
                    <button 
                        onClick={() => setIsAdding(true)}
                        className="w-full py-2 border border-dashed border-black/20 rounded text-xs text-swiss-sub hover:text-black hover:border-black/40 hover:bg-white/20 transition-all flex items-center justify-center gap-2"
                    >
                        <Plus size={14} /> Add Phase
                    </button>
                ) : (
                    <div className="p-3 bg-white border border-black/10 rounded shadow-sm space-y-3 animate-in fade-in slide-in-from-top-2">
                        <input 
                            className="w-full text-xs font-bold border-b border-black/10 pb-1 focus:outline-none"
                            placeholder="Phase Name (e.g. Induction)"
                            value={newStep.name}
                            onChange={e => setNewStep({...newStep, name: e.target.value})}
                        />
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="text-[9px] uppercase text-swiss-sub">Duration (m)</label>
                                <input type="number" className="w-full text-xs p-1 bg-black/5 rounded" value={newStep.durationMinutes} onChange={e => setNewStep({...newStep, durationMinutes: parseInt(e.target.value)})} />
                            </div>
                            <div>
                                <label className="text-[9px] uppercase text-swiss-sub">Beat (Hz)</label>
                                <input type="number" className="w-full text-xs p-1 bg-black/5 rounded" value={newStep.beatFreq} onChange={e => setNewStep({...newStep, beatFreq: parseFloat(e.target.value)})} />
                            </div>
                        </div>
                        <div className="flex gap-2 justify-end">
                            <button onClick={() => setIsAdding(false)} className="text-[10px] text-swiss-sub px-2 py-1">Cancel</button>
                            <button onClick={handleAdd} className="text-[10px] bg-black text-white px-3 py-1 rounded-sm">Add Step</button>
                        </div>
                    </div>
                )
            )}
        </div>
    );
};

export default TimelineEditor;
