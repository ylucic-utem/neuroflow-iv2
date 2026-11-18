
import React, { useState, useEffect } from 'react';
import { Activity, Wind, Zap, Clock, Timer, ArrowRight, Waves, MoveHorizontal, Info, Infinity, List, Sliders, FileText, PlusCircle, Users, BookOpen, Headphones } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AudioState, NoiseType, BrainwaveBand, ChatMessage, AIRecommendation, CarrierMode, SpatialMode, SequenceStep } from '../types';
import ChatInterface from './ChatInterface';
import Tooltip from './Tooltip';
import AudioMeter from './AudioMeter';
import TimelineEditor from './TimelineEditor';
import { logger } from '../services/logger';

interface SidebarControlsProps {
    audioState: AudioState;
    isPlaying: boolean;
    onTogglePlay: () => void;
    onUpdate: (updates: Partial<AudioState>) => void;
    currentBand: BrainwaveBand;
    onOpenPatientView: () => void;
    onOpenSessionCreator: () => void;

    // Chat Props
    chatHistory: ChatMessage[];
    chatInput: string;
    isProcessingAI: boolean;
    onChatInputChange: (val: string) => void;
    onChatSend: () => void;
    onGenerateVoice: () => void;
    onApplyRecommendation: (rec: AIRecommendation) => void;

    // Timer Props
    timerDuration: number;
    onTimerDurationChange: (val: number) => void;
    remainingTime: string;
    isTimerActive: boolean;

    // Sequencer Props
    isSequencerActive: boolean;
    setIsSequencerActive: (val: boolean) => void;
    sequence: SequenceStep[];
    currentStepIndex: number;
    remainingStepSeconds: number;
    onAddStep: (step: SequenceStep) => void;
    onRemoveStep: (id: string) => void;
}

const SidebarControls: React.FC<SidebarControlsProps> = ({
    audioState,
    isPlaying,
    onTogglePlay,
    onUpdate,
    onOpenSessionCreator,
    chatHistory,
    chatInput,
    isProcessingAI,
    onChatInputChange,
    onChatSend,
    onGenerateVoice,
    onApplyRecommendation,
    timerDuration,
    onTimerDurationChange,
    remainingTime,
    isTimerActive,
    isSequencerActive,
    setIsSequencerActive,
    sequence,
    currentStepIndex,
    remainingStepSeconds,
    onAddStep,
    onRemoveStep
}) => {
    const navigate = useNavigate();
    const [controlMode, setControlMode] = useState<'manual' | 'sequence' | 'log'>('manual');
    const [advancedMode, setAdvancedMode] = useState(false);
    const [logs, setLogs] = useState(logger.getLogs());

    useEffect(() => {
        if (controlMode === 'log') {
            const unsub = logger.subscribe((newLogs) => setLogs([...newLogs]));
            return unsub;
        }
    }, [controlMode]);

    return (
        <div className="w-96 flex flex-col gap-6 p-8 overflow-y-auto bg-white/40 backdrop-blur-xl border-r border-black/5 z-20 custom-scrollbar">

            {/* Header */}
            <header className="pb-6 border-b border-black/10 flex justify-between items-start">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <Activity className="w-5 h-5 text-black" strokeWidth={2.5} />
                        <h1 className="text-2xl font-display font-medium text-black">NeuroFlow</h1>
                    </div>
                    <p className="text-xs uppercase tracking-widest text-swiss-sub font-medium">Neuro-Acoustic Therapy System</p>
                </div>
                <div className="flex bg-black/5 rounded p-0.5">
                    <button onClick={() => { setControlMode('manual'); setIsSequencerActive(false); }} className={`p-1.5 rounded transition-all ${controlMode === 'manual' ? 'bg-white shadow text-black' : 'text-swiss-sub hover:text-black'}`} title="Manual Control"><Sliders size={14} /></button>
                    <button onClick={() => { setControlMode('sequence'); setIsSequencerActive(true); }} className={`p-1.5 rounded transition-all ${controlMode === 'sequence' ? 'bg-white shadow text-black' : 'text-swiss-sub hover:text-black'}`} title="Timeline Sequence"><List size={14} /></button>
                    <button onClick={() => setControlMode('log')} className={`p-1.5 rounded transition-all ${controlMode === 'log' ? 'bg-white shadow text-black' : 'text-swiss-sub hover:text-black'}`} title="Session Logs"><FileText size={14} /></button>
                </div>
            </header>

            {/* Nav */}
            <nav className="space-y-1">
                {[
                    { icon: Activity, label: 'Dashboard', path: '/clinician' },
                    { icon: Users, label: 'Patient Management', path: '/clinician/patients' },
                    { icon: BookOpen, label: 'Protocol Library', path: '/clinician/protocols' },
                    { icon: FileText, label: 'Clinical Reports', path: '/clinician/reports' },
                    { icon: Sliders, label: 'Session Designer', path: '/clinician/designer' },
                ].map((link) => (
                    <button
                        key={link.path}
                        onClick={() => navigate(link.path)}
                        className={`w-full flex items-center gap-3 px-4 py-2 text-xs uppercase tracking-widest font-medium rounded-sm transition-all ${window.location.pathname === link.path ? 'bg-black text-white' : 'text-swiss-sub hover:bg-black/5 hover:text-black'}`}
                    >
                        <link.icon size={14} />
                        {link.label}
                    </button>
                ))}
            </nav>

            {/* Primary Action */}
            <div className="swiss-card p-5">
                <button
                    onClick={onTogglePlay}
                    className={`swiss-button w-full py-3.5 text-white mb-4 transition-all duration-300 ${isPlaying ? 'bg-black/80 hover:bg-black' : 'bg-black hover:bg-black/90'}`}
                >
                    {isPlaying ? "Stop Therapy Session" : "Start Therapy Session"}
                </button>

                {!isSequencerActive && (
                    <div className="flex items-center justify-between border-t border-black/5 pt-4">
                        <div className="flex items-center gap-2 text-swiss-sub">
                            {isTimerActive ? <Timer size={14} className="text-black animate-pulse" /> : <Clock size={14} />}
                            <span className="text-xs uppercase tracking-widest font-medium">{isTimerActive ? 'Time Remaining' : 'Session Length'}</span>
                        </div>
                        {isTimerActive ? (
                            <span className="text-xl font-display font-bold text-black">{remainingTime}</span>
                        ) : (
                            <div className="flex items-center gap-2">
                                <input type="range" min="5" max="60" step="5" value={timerDuration} onChange={(e) => { const val = parseInt(e.target.value); onTimerDurationChange(val); onUpdate({ rampDurationMinutes: val }); }} className="w-20" />
                                <span className="text-sm font-mono w-12 text-right">{timerDuration}m</span>
                            </div>
                        )}
                    </div>
                )}

                <div className="mt-3 pt-3 border-t border-black/5">
                    <button onClick={onOpenSessionCreator} className="w-full py-2 bg-indigo-50 hover:bg-indigo-100 text-xs text-indigo-700 border border-indigo-100 hover:border-indigo-200 font-medium rounded-sm flex items-center justify-center gap-2 transition-all">
                        <PlusCircle size={12} /> NEW CUSTOM FLOW
                    </button>
                </div>
            </div>

            {/* Mode Selector */}
            {controlMode === 'manual' && (
                <div className="flex bg-black/5 rounded p-0.5">
                    <button onClick={() => setAdvancedMode(false)} className={`flex-1 py-1.5 text-[10px] uppercase font-bold rounded transition-all ${!advancedMode ? 'bg-white shadow text-black' : 'text-swiss-sub'}`}>Prescription</button>
                    <button onClick={() => setAdvancedMode(true)} className={`flex-1 py-1.5 text-[10px] uppercase font-bold rounded transition-all ${advancedMode ? 'bg-white shadow text-black' : 'text-swiss-sub'}`}>Advanced</button>
                </div>
            )}

            {/* Conditional Views */}
            <div className="flex-1 space-y-6">

                {controlMode === 'log' && (
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <h3 className="text-xs font-medium uppercase tracking-widest text-swiss-sub">Audit Log</h3>
                            <button onClick={() => logger.downloadLogs()} className="text-[10px] underline text-blue-600">Export</button>
                        </div>
                        <div className="swiss-card p-3 text-[10px] font-mono space-y-2 max-h-[400px] overflow-y-auto">
                            {logs.map((log) => (
                                <div key={log.id} className="border-b border-black/5 pb-1">
                                    <span className="text-swiss-sub mr-2">[{log.timestamp}]</span>
                                    <span className="font-bold mr-1">{log.action}:</span>
                                    <span>{log.details}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {controlMode === 'sequence' && (
                    <div className="space-y-4">
                        <h3 className="text-xs font-medium uppercase tracking-widest text-swiss-sub">Treatment Timeline</h3>
                        <TimelineEditor sequence={sequence} currentStepIndex={currentStepIndex} isActive={isPlaying && isSequencerActive} remainingSeconds={remainingStepSeconds} onAddStep={onAddStep} onRemoveStep={onRemoveStep} />
                    </div>
                )}

                {controlMode === 'manual' && (
                    <div className="space-y-6">
                        {!advancedMode ? (
                            /* Prescription View */
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xs font-medium uppercase tracking-widest text-swiss-sub">Active Prescription</h3>
                                    <button onClick={() => navigate('/clinician/protocols')} className="text-[10px] text-blue-600 font-bold hover:underline uppercase">Library</button>
                                </div>
                                <div className="swiss-card p-5 bg-white/60">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-10 h-10 rounded bg-black/5 flex items-center justify-center"><BookOpen size={20} className="text-black/40" /></div>
                                        <div><h4 className="text-sm font-bold">Clinical Protocol</h4><p className="text-[10px] text-swiss-sub uppercase tracking-wider">Evidence-Based</p></div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-3 bg-black/5 rounded"><div className="text-[9px] uppercase text-swiss-sub mb-1">Target</div><div className="text-xs font-bold font-mono">{audioState.beatFreq.toFixed(1)}Hz</div></div>
                                        <div className="p-3 bg-black/5 rounded"><div className="text-[9px] uppercase text-swiss-sub mb-1">Carrier</div><div className="text-xs font-bold font-mono">{audioState.carrierFreq}Hz</div></div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            /* Advanced View */
                            <div className="space-y-6">
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-xs font-medium uppercase tracking-widest text-swiss-sub">Entrainment Engine</h3>
                                        <div className="flex bg-black/5 rounded-sm p-0.5">
                                            <button onClick={() => onUpdate({ isRamping: false })} className={`px-2 py-1 text-[9px] uppercase font-bold rounded-sm transition-all ${!audioState.isRamping ? 'bg-white shadow-sm text-black' : 'text-swiss-sub'}`}>Manual</button>
                                            <button onClick={() => onUpdate({ isRamping: true })} className={`px-2 py-1 text-[9px] uppercase font-bold rounded-sm transition-all ${audioState.isRamping ? 'bg-white shadow-sm text-black' : 'text-swiss-sub'}`}>Protocol</button>
                                        </div>
                                    </div>

                                    <div className="swiss-card p-5 space-y-4">
                                        {/* Carrier */}
                                        <div>
                                            <div className="flex justify-between items-baseline mb-2">
                                                <label className="text-xs uppercase tracking-widest text-swiss-sub">Carrier</label>
                                                <span className="text-sm font-mono font-medium">{audioState.carrierFreq}Hz</span>
                                            </div>
                                            <input type="range" min="10" max="600" step="5" value={audioState.carrierFreq} onChange={(e) => onUpdate({ carrierFreq: parseFloat(e.target.value) })} />
                                        </div>

                                        {/* Beat */}
                                        {!audioState.isRamping ? (
                                            <div>
                                                <div className="flex justify-between items-baseline mb-2">
                                                    <label className="text-xs uppercase tracking-widest text-swiss-sub">Beat</label>
                                                    <span className="text-sm font-mono font-medium">{audioState.beatFreq.toFixed(1)}Hz</span>
                                                </div>
                                                <input type="range" min="0.5" max="40" step="0.1" value={audioState.beatFreq} onChange={(e) => onUpdate({ beatFreq: parseFloat(e.target.value) })} />
                                            </div>
                                        ) : (
                                            <div className="bg-black/5 rounded p-3 space-y-3">
                                                <div className="grid grid-cols-[1fr,auto,1fr] gap-2 items-center text-center">
                                                    <div><input className="w-full" type="range" min="0.5" max="40" step="0.5" value={audioState.rampStartFreq} onChange={(e) => onUpdate({ rampStartFreq: parseFloat(e.target.value) })} /><div className="font-mono text-[10px] mt-1">{audioState.rampStartFreq}Hz</div></div>
                                                    <ArrowRight size={12} className="text-swiss-sub" />
                                                    <div><input className="w-full" type="range" min="0.5" max="40" step="0.5" value={audioState.rampEndFreq} onChange={(e) => onUpdate({ rampEndFreq: parseFloat(e.target.value) })} /><div className="font-mono text-[10px] mt-1">{audioState.rampEndFreq}Hz</div></div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Modes */}
                                        <div className="pt-2 border-t border-black/5 grid grid-cols-2 gap-1">
                                            {[CarrierMode.Pure, CarrierMode.Soft, CarrierMode.Harmonic, CarrierMode.Solfeggio].map(mode => (
                                                <button key={mode} onClick={() => onUpdate({ carrierMode: mode })} className={`px-1 py-1.5 text-[9px] uppercase rounded-sm border transition-all ${audioState.carrierMode === mode ? 'bg-black text-white border-black' : 'bg-transparent text-swiss-sub border-black/10'}`}>{mode}</button>
                                            ))}
                                        </div>

                                        {/* Advanced Toggles */}
                                        <div className="pt-2 border-t border-black/5 space-y-3">
                                            <div className="flex justify-between items-center">
                                                <label className="text-[10px] uppercase tracking-widest text-swiss-sub">Phase Locking</label>
                                                <button onClick={() => onUpdate({ phaseLocking: !audioState.phaseLocking })} className={`w-8 h-4 rounded-full p-0.5 transition-colors ${audioState.phaseLocking ? 'bg-black' : 'bg-black/10'}`}><div className={`w-3 h-3 bg-white rounded-full transition-transform ${audioState.phaseLocking ? 'translate-x-4' : 'translate-x-0'}`} /></button>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <label className="text-[10px] uppercase tracking-widest text-swiss-sub">Spatial Immersion</label>
                                                <button onClick={() => onUpdate({ binauralSpatial: !audioState.binauralSpatial })} className={`w-8 h-4 rounded-full p-0.5 transition-colors ${audioState.binauralSpatial ? 'bg-black' : 'bg-black/10'}`}><div className={`w-3 h-3 bg-white rounded-full transition-transform ${audioState.binauralSpatial ? 'translate-x-4' : 'translate-x-0'}`} /></button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Common Controls (AI & Mixer) */}
                        <div className="space-y-6">
                            <div className="space-y-3">
                                <h3 className="text-xs font-medium uppercase tracking-widest text-swiss-sub">AI Assistant</h3>
                                <ChatInterface chatHistory={chatHistory} chatInput={chatInput} isProcessing={isProcessingAI} onInputChange={onChatInputChange} onChatSend={onChatSend} onGenerateVoice={onGenerateVoice} onApplyRecommendation={onApplyRecommendation} />
                            </div>

                            <div className="space-y-3">
                                <div className="flex justify-between items-center text-xs uppercase tracking-widest text-swiss-sub"><span>Environment Mix</span><AudioMeter /></div>
                                <div className="swiss-card p-5 space-y-4">
                                    <div className="pb-4 border-b border-black/5">
                                        <div className="flex justify-between text-[10px] uppercase font-bold mb-2"><span>Master</span><span>{Math.round(audioState.masterVolume * 100)}%</span></div>
                                        <input type="range" min="0" max="1" step="0.01" value={audioState.masterVolume} onChange={(e) => onUpdate({ masterVolume: parseFloat(e.target.value) })} />
                                    </div>
                                    <div className="grid grid-cols-3 gap-1">
                                        {[NoiseType.Pink, NoiseType.Brown, NoiseType.White, NoiseType.Rain, NoiseType.Wind, NoiseType.Stream, NoiseType.None].map(type => (
                                            <button key={type} onClick={() => onUpdate({ noiseType: type })} className={`px-1 py-1 text-[9px] uppercase rounded-sm border transition-all ${audioState.noiseType === type ? 'bg-black text-white border-black' : 'bg-transparent text-swiss-sub border-black/10'}`}>{type === 'none' ? 'OFF' : type}</button>
                                        ))}
                                    </div>
                                    <div className="grid grid-cols-3 gap-1 mt-2">
                                        <button onClick={() => onUpdate({ noiseSpatialMode: audioState.noiseSpatialMode === SpatialMode.Circular3D ? SpatialMode.None : SpatialMode.Circular3D })} className={`px-2 py-2 rounded border flex flex-col items-center gap-1 ${audioState.noiseSpatialMode === SpatialMode.Circular3D ? 'bg-black text-white border-black' : 'bg-transparent text-swiss-sub border-black/10'}`}><Wind size={10} /><span className="text-[8px] font-bold">ORBIT</span></button>
                                        <button onClick={() => onUpdate({ noiseSpatialMode: audioState.noiseSpatialMode === SpatialMode.Bilateral ? SpatialMode.None : SpatialMode.Bilateral })} className={`px-2 py-2 rounded border flex flex-col items-center gap-1 ${audioState.noiseSpatialMode === SpatialMode.Bilateral ? 'bg-black text-white border-black' : 'bg-transparent text-swiss-sub border-black/10'}`}><MoveHorizontal size={10} /><span className="text-[8px] font-bold">SCAN</span></button>
                                        <button onClick={() => onUpdate({ noiseSpatialMode: audioState.noiseSpatialMode === SpatialMode.Vortex ? SpatialMode.None : SpatialMode.Vortex })} className={`px-2 py-2 rounded border flex flex-col items-center gap-1 ${audioState.noiseSpatialMode === SpatialMode.Vortex ? 'bg-black text-white border-black' : 'bg-transparent text-swiss-sub border-black/10'}`}><Infinity size={10} /><span className="text-[8px] font-bold">VORTEX</span></button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SidebarControls;
