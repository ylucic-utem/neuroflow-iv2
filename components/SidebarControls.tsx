

import React, { useState, useEffect } from 'react';
import { Activity, Maximize2, Headphones, Wind, Zap, Clock, Timer, ArrowRight, Waves, MoveHorizontal, Sunrise, Info, Infinity, List, Sliders, FileText, PlusCircle } from 'lucide-react';
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
  onOpenPatientView,
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
  const [controlMode, setControlMode] = useState<'manual' | 'sequence' | 'log'>('manual');
  const [logs, setLogs] = useState(logger.getLogs());

  // Subscribe to logs
  useEffect(() => {
    if (controlMode === 'log') {
        const unsub = logger.subscribe((newLogs) => setLogs([...newLogs]));
        return unsub;
    }
  }, [controlMode]);

  return (
    <div className="w-96 flex flex-col gap-6 p-8 overflow-y-auto bg-white/40 backdrop-blur-xl border-r border-black/5 z-20">
      
      {/* Header / Logo */}
      <header className="pb-6 border-b border-black/10 flex justify-between items-start">
        <div>
            <div className="flex items-center gap-3 mb-2">
            <Activity className="w-5 h-5 text-black" strokeWidth={2.5} />
            <h1 className="text-2xl font-display font-medium text-black">NeuroFlow</h1>
            </div>
            <p className="text-xs uppercase tracking-widest text-swiss-sub font-medium">Neuro-Acoustic Therapy System</p>
        </div>
        
        {/* Control Mode Tabs */}
        <div className="flex bg-black/5 rounded p-0.5">
            <button 
                onClick={() => { setControlMode('manual'); setIsSequencerActive(false); }}
                className={`p-1.5 rounded transition-all ${controlMode === 'manual' ? 'bg-white shadow text-black' : 'text-swiss-sub hover:text-black'}`}
                title="Manual Control"
            >
                <Sliders size={14} />
            </button>
            <button 
                onClick={() => { setControlMode('sequence'); setIsSequencerActive(true); }}
                className={`p-1.5 rounded transition-all ${controlMode === 'sequence' ? 'bg-white shadow text-black' : 'text-swiss-sub hover:text-black'}`}
                title="Timeline Sequence"
            >
                <List size={14} />
            </button>
            <button 
                onClick={() => setControlMode('log')}
                className={`p-1.5 rounded transition-all ${controlMode === 'log' ? 'bg-white shadow text-black' : 'text-swiss-sub hover:text-black'}`}
                title="Session Logs"
            >
                <FileText size={14} />
            </button>
        </div>
      </header>

      {/* Start & Timer */}
      <div className="swiss-card p-5">
        <button 
          onClick={onTogglePlay}
          className={`swiss-button w-full py-3.5 text-white mb-4 transition-all duration-300 ${isPlaying ? 'bg-black/80 hover:bg-black' : 'bg-black hover:bg-black/90'}`}
        >
          {isPlaying ? "Stop Therapy Session" : "Start Therapy Session"}
        </button>

        {/* Global Timer (Hidden if Sequencer Active) */}
        {!isSequencerActive && (
             <div className="flex items-center justify-between border-t border-black/5 pt-4">
                <Tooltip content="Sets the duration of the therapy session. Audio fades out automatically when complete.">
                    <div className="flex items-center gap-2 text-swiss-sub">
                        {isTimerActive ? <Timer size={14} className="text-black animate-pulse"/> : <Clock size={14} />}
                        <span className="text-xs uppercase tracking-widest font-medium">
                            {isTimerActive ? 'Time Remaining' : 'Session Length'}
                        </span>
                    </div>
                </Tooltip>
                
                {isTimerActive ? (
                    <span className="text-xl font-display font-bold text-black">{remainingTime}</span>
                ) : (
                    <div className="flex items-center gap-2">
                        <input 
                            type="range" min="5" max="60" step="5"
                            value={timerDuration}
                            onChange={(e) => {
                                const val = parseInt(e.target.value);
                                onTimerDurationChange(val);
                                onUpdate({ rampDurationMinutes: val });
                            }}
                            className="w-20"
                        />
                        <span className="text-sm font-mono w-12 text-right">{timerDuration}m</span>
                    </div>
                )}
            </div>
        )}
        
        {/* Sequence Active Indicator */}
        {isSequencerActive && (
            <div className="flex items-center justify-between border-t border-black/5 pt-4">
                 <div className="flex items-center gap-2 text-green-600">
                    <List size={14} className="animate-pulse"/>
                    <span className="text-xs uppercase tracking-widest font-bold">Timeline Active</span>
                </div>
            </div>
        )}

        <div className="mt-3 pt-3 border-t border-black/5 space-y-2">
            <div className="text-xs text-swiss-sub uppercase tracking-widest">Controls</div>
            <button 
                onClick={onOpenPatientView}
                className="w-full py-2 bg-white/50 hover:bg-white text-xs text-black border border-black/5 hover:border-black/20 font-medium rounded-sm flex items-center justify-center gap-2 transition-all"
            >
                <Maximize2 size={12} />
                PATIENT VIEW
            </button>
            <button 
                onClick={onOpenSessionCreator}
                className="w-full py-2 bg-indigo-50 hover:bg-indigo-100 text-xs text-indigo-700 border border-indigo-100 hover:border-indigo-200 font-medium rounded-sm flex items-center justify-center gap-2 transition-all"
            >
                <PlusCircle size={12} />
                OPEN SESSION CREATOR
            </button>
        </div>
      </div>
      
      {/* --- CONDITIONAL VIEWS --- */}
      
      {/* 1. LOG VIEW */}
      {controlMode === 'log' && (
          <div className="flex-1 overflow-hidden flex flex-col">
              <div className="flex justify-between items-center mb-2">
                  <h3 className="text-xs font-medium uppercase tracking-widest text-swiss-sub">Session Audit Log</h3>
                  <button onClick={() => logger.downloadLogs()} className="text-[10px] underline text-blue-600">Export</button>
              </div>
              <div className="swiss-card p-3 flex-1 overflow-y-auto custom-scrollbar text-[10px] font-mono space-y-2 max-h-[400px]">
                  {logs.map((log) => (
                      <div key={log.id} className="border-b border-black/5 pb-1">
                          <span className="text-swiss-sub mr-2">[{log.timestamp}]</span>
                          <span className="font-bold mr-1">{log.action}:</span>
                          <span>{log.details}</span>
                      </div>
                  ))}
                  {logs.length === 0 && <div className="text-center opacity-40 py-10">No logs yet</div>}
              </div>
          </div>
      )}

      {/* 2. SEQUENCER VIEW */}
      {controlMode === 'sequence' && (
           <div className="space-y-4">
               <div className="flex items-center justify-between">
                    <Tooltip content="Define a timeline of treatment phases.">
                        <h3 className="text-xs font-medium uppercase tracking-widest text-swiss-sub">Treatment Timeline</h3>
                    </Tooltip>
               </div>
               <TimelineEditor 
                  sequence={sequence}
                  currentStepIndex={currentStepIndex}
                  isActive={isPlaying && isSequencerActive}
                  remainingSeconds={remainingStepSeconds}
                  onAddStep={onAddStep}
                  onRemoveStep={onRemoveStep}
               />
           </div>
      )}

      {/* 3. MANUAL CONTROL VIEW */}
      {controlMode === 'manual' && (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
            <Tooltip content="The core generator settings.">
                <h3 className="text-xs font-medium uppercase tracking-widest text-swiss-sub">Entrainment Engine</h3>
            </Tooltip>
            
            {/* Protocol Toggle */}
            <div className="flex bg-black/5 rounded-sm p-0.5">
                <Tooltip content="Fixed Frequency Mode: Stays at one beat frequency.">
                    <button 
                        onClick={() => onUpdate({ isRamping: false })}
                        className={`px-2 py-1 text-[9px] uppercase font-bold rounded-sm transition-all ${!audioState.isRamping ? 'bg-white shadow-sm text-black' : 'text-swiss-sub'}`}
                    >
                        Manual
                    </button>
                </Tooltip>
                <Tooltip content="Iso-Chronic Ramping: Moves from Start Hz to End Hz over the session duration to guide brain state.">
                    <button 
                        onClick={() => onUpdate({ isRamping: true })}
                        className={`px-2 py-1 text-[9px] uppercase font-bold rounded-sm transition-all ${audioState.isRamping ? 'bg-white shadow-sm text-black' : 'text-swiss-sub'}`}
                    >
                        Protocol
                    </button>
                </Tooltip>
            </div>
        </div>

        <div className="swiss-card p-5 space-y-4">
            
            {/* Carrier */}
            <div className="mb-2">
                <div className="flex justify-between items-baseline mb-2">
                    <Tooltip content="The base pitch tone. Lower (100Hz) is better for sleep/trance. Higher (400Hz) is better for focus. Solfeggio uses fixed frequencies.">
                        <label className="text-xs uppercase tracking-widest text-swiss-sub border-b border-dotted border-black/20 pb-0.5">Carrier Frequency</label>
                    </Tooltip>
                    <span className="text-sm font-mono font-medium text-black">{audioState.carrierFreq} Hz</span>
                </div>
                <input 
                    type="range" 
                    min="10" max="600" step="5"
                    value={audioState.carrierFreq}
                    onChange={(e) => onUpdate({ carrierFreq: parseFloat(e.target.value) })}
                />
            </div>

            {/* Manual Beat OR Protocol Ramping */}
            {!audioState.isRamping ? (
                <div>
                    <div className="flex justify-between items-baseline mb-2">
                        <Tooltip content="The difference between Left and Right ears. The brain creates this 'phantom' frequency.">
                            <label className="text-xs uppercase tracking-widest text-swiss-sub border-b border-dotted border-black/20 pb-0.5">Beat Frequency</label>
                        </Tooltip>
                        <span className="text-sm font-mono font-medium text-black">{audioState.beatFreq.toFixed(1)} Hz</span>
                    </div>
                    <input 
                        type="range" 
                        min="0.5" max="40" step="0.1"
                        value={audioState.beatFreq}
                        onChange={(e) => onUpdate({ beatFreq: parseFloat(e.target.value) })}
                    />
                </div>
            ) : (
                <div className="bg-black/5 rounded p-3 space-y-3">
                     <div className="flex items-center gap-2 text-[10px] uppercase font-bold text-black opacity-60">
                         <Activity size={10} /> Iso-Chronic Ramping
                     </div>
                     
                     <div className="grid grid-cols-[1fr,auto,1fr] gap-2 items-center">
                         <div>
                             <label className="text-[9px] uppercase tracking-wider text-swiss-sub block mb-1">Start</label>
                             <input 
                                className="w-full h-1" type="range" min="0.5" max="40" step="0.5"
                                value={audioState.rampStartFreq}
                                onChange={(e) => onUpdate({ rampStartFreq: parseFloat(e.target.value) })}
                             />
                             <div className="text-center font-mono text-xs font-bold mt-1">{audioState.rampStartFreq}Hz</div>
                         </div>
                         <ArrowRight size={12} className="text-swiss-sub" />
                         <div>
                             <label className="text-[9px] uppercase tracking-wider text-swiss-sub block mb-1">End</label>
                             <input 
                                className="w-full h-1" type="range" min="0.5" max="40" step="0.5"
                                value={audioState.rampEndFreq}
                                onChange={(e) => onUpdate({ rampEndFreq: parseFloat(e.target.value) })}
                             />
                             <div className="text-center font-mono text-xs font-bold mt-1">{audioState.rampEndFreq}Hz</div>
                         </div>
                     </div>
                     <div className="text-[9px] text-center text-swiss-sub">
                         Duration: {audioState.rampDurationMinutes} mins
                     </div>
                </div>
            )}

            {/* Carrier Texture Mode */}
            <div className="pt-2 border-t border-black/5">
                <Tooltip content="Pure: Sine. Soft: Triangle. Harmonic: Chord. Solfeggio: 528Hz Healing Tuning.">
                    <div className="text-xs uppercase tracking-widest text-swiss-sub mb-2 flex items-center gap-1 w-fit border-b border-dotted border-black/20 pb-0.5">
                        <Waves size={10} /> Texture / Tuning
                    </div>
                </Tooltip>
                <div className="grid grid-cols-2 gap-1">
                    {[CarrierMode.Pure, CarrierMode.Soft, CarrierMode.Harmonic, CarrierMode.Solfeggio].map(mode => (
                        <button
                            key={mode}
                            onClick={() => onUpdate({ carrierMode: mode })}
                            className={`px-1 py-1.5 text-[9px] uppercase rounded-sm border transition-all ${
                                audioState.carrierMode === mode 
                                ? 'bg-black text-white border-black' 
                                : 'bg-transparent text-swiss-sub border-black/10 hover:border-black/30'
                            }`}
                        >
                            {mode}
                        </button>
                    ))}
                </div>
            </div>

            {/* Neural Phase Locking */}
            <div className="pt-2 border-t border-black/5">
                 <div className="flex justify-between items-center">
                    <Tooltip content="Amplitude Modulates the carrier tone at the exact beat frequency. Creates a physical pulse that reinforces the binaural illusion.">
                        <label className="text-xs uppercase tracking-widest text-swiss-sub flex items-center gap-1 border-b border-dotted border-black/20 pb-0.5">
                            <Zap size={10} /> Neural Phase Locking
                        </label>
                    </Tooltip>
                    <button 
                        onClick={() => onUpdate({ phaseLocking: !audioState.phaseLocking })}
                        className={`w-8 h-4 rounded-full p-0.5 transition-colors ${audioState.phaseLocking ? 'bg-black' : 'bg-black/10'}`}
                    >
                        <div className={`w-3 h-3 bg-white rounded-full shadow-sm transition-transform ${audioState.phaseLocking ? 'translate-x-4' : 'translate-x-0'}`} />
                    </button>
                 </div>
            </div>

            {/* Isochronic Pulse */}
            <div className="pt-2 border-t border-black/5">
                 <div className="flex justify-between items-baseline mb-2 pt-2">
                    <Tooltip content="Adds a rhythmic volume pulse. Higher % = stronger focus.">
                        <label className="text-xs uppercase tracking-widest text-swiss-sub flex items-center gap-1 border-b border-dotted border-black/20 pb-0.5">
                            <Activity size={10} /> Pulse Intensity
                        </label>
                    </Tooltip>
                    <span className="text-sm font-mono font-medium text-black">{Math.round(audioState.isochronicAmount * 100)}%</span>
                </div>
                <input 
                    type="range" 
                    min="0" max="1" step="0.05"
                    value={audioState.isochronicAmount}
                    onChange={(e) => onUpdate({ isochronicAmount: parseFloat(e.target.value) })}
                />
            </div>

            {/* Spatial Binaural Toggle */}
            <div className="pt-2 border-t border-black/5">
                <button 
                    onClick={() => onUpdate({ binauralSpatial: !audioState.binauralSpatial })}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-sm border transition-all ${
                        audioState.binauralSpatial 
                        ? 'bg-black text-white border-black' 
                        : 'bg-transparent text-swiss-sub border-black/10'
                    }`}
                >
                    <div className="flex items-center gap-2">
                        <Headphones size={14} />
                        <Tooltip content="Places the tones in 3D space (HRTF) instead of flat stereo. Enhances immersion.">
                            <span className="text-[10px] uppercase font-medium">Spatial Immersion</span>
                        </Tooltip>
                    </div>
                    <span className="text-[10px]">{audioState.binauralSpatial ? 'ON' : 'OFF'}</span>
                </button>
            </div>
        </div>
      </div>
      )}

      {/* AI Assistant - Visible in Manual Mode */}
      {controlMode === 'manual' && (
      <div className="space-y-3">
        <h3 className="text-xs font-medium uppercase tracking-widest text-swiss-sub">AI Assistant</h3>
        <ChatInterface 
           chatHistory={chatHistory}
           chatInput={chatInput}
           isProcessing={isProcessingAI}
           onInputChange={onChatInputChange}
           onSend={onChatSend}
           onGenerateVoice={onGenerateVoice}
           onApplyRecommendation={onApplyRecommendation}
        />
      </div>
      )}

      {/* Audio Mixer */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
            <h3 className="text-xs font-medium uppercase tracking-widest text-swiss-sub">Environmental Mix</h3>
            {/* Audio Confidence Meter */}
            <Tooltip content="Audio Confidence Meter (RMS). Visual proof that sound is playing.">
                <div className="mr-1">
                    <AudioMeter />
                </div>
            </Tooltip>
        </div>

        <div className="swiss-card p-5 space-y-4">
             {/* Master */}
             <div className="pb-4 border-b border-black/5">
                <div className="flex justify-between items-baseline mb-2">
                    <label className="text-xs uppercase tracking-widest text-black font-bold">Master Volume</label>
                    <div className="flex items-center gap-2">
                        {audioState.isMuted && <span className="text-[9px] font-bold text-red-500 uppercase px-1 border border-red-500 rounded">MUTED</span>}
                        <span className="text-sm font-mono font-medium text-black">{Math.round(audioState.masterVolume * 100)}%</span>
                    </div>
                </div>
                <input 
                    type="range" 
                    min="0" max="1" step="0.01"
                    value={audioState.masterVolume}
                    onChange={(e) => onUpdate({ masterVolume: parseFloat(e.target.value) })}
                />
            </div>

            {/* Sub Mixers */}
            <div className="space-y-3">
                <div>
                     <div className="flex justify-between text-[10px] uppercase text-swiss-sub mb-1">
                        <span>Binaural / Pulse</span>
                        <span>{Math.round(audioState.binauralVolume * 100)}%</span>
                     </div>
                     <input type="range" min="0" max="1" step="0.01" value={audioState.binauralVolume} onChange={(e) => onUpdate({ binauralVolume: parseFloat(e.target.value) })} className="opacity-70 scale-90 origin-left w-[110%]" />
                </div>
                <div>
                     <div className="flex justify-between text-[10px] uppercase text-swiss-sub mb-1">
                        <span>Atmosphere</span>
                        <span>{Math.round(audioState.noiseVolume * 100)}%</span>
                     </div>
                     <input type="range" min="0" max="1" step="0.01" value={audioState.noiseVolume} onChange={(e) => onUpdate({ noiseVolume: parseFloat(e.target.value) })} className="opacity-70 scale-90 origin-left w-[110%]" />
                </div>
                 <div>
                     <div className="flex justify-between text-[10px] uppercase text-swiss-sub mb-1">
                        <span>Voice Guide</span>
                        <span>{Math.round(audioState.voiceVolume * 100)}%</span>
                     </div>
                     <input type="range" min="0" max="1" step="0.01" value={audioState.voiceVolume} onChange={(e) => onUpdate({ voiceVolume: parseFloat(e.target.value) })} className="opacity-70 scale-90 origin-left w-[110%]" />
                </div>
            </div>

             {/* Atmosphere Selector */}
             <div className="pt-2 border-t border-black/5 space-y-2">
                 <div className="text-[10px] uppercase text-swiss-sub">Nature Elements</div>
                 <div className="grid grid-cols-3 gap-1">
                    {[NoiseType.Pink, NoiseType.Brown, NoiseType.White, NoiseType.Rain, NoiseType.Wind, NoiseType.Stream, NoiseType.None].map(type => (
                         <button
                            key={type}
                            onClick={() => onUpdate({ noiseType: type })}
                            className={`px-1 py-1.5 text-[9px] uppercase rounded-sm border transition-all ${
                                audioState.noiseType === type 
                                ? 'bg-black text-white border-black' 
                                : 'bg-transparent text-swiss-sub border-black/10 hover:border-black/30'
                            }`}
                         >
                            {type === 'none' ? 'OFF' : type}
                         </button>
                    ))}
                </div>
                 
                 {/* Feature #5: Spatial Mode Select (3D vs EMDR vs Vortex) */}
                 <div className="grid grid-cols-3 gap-1 mt-2">
                    <Tooltip content="Rotates noise around the head in a circle. Good for dissociation.">
                        <button 
                            onClick={() => onUpdate({ noiseSpatialMode: audioState.noiseSpatialMode === SpatialMode.Circular3D ? SpatialMode.None : SpatialMode.Circular3D })}
                            className={`flex flex-col items-center justify-center px-1 py-2 rounded-sm border transition-all gap-1 w-full ${
                                audioState.noiseSpatialMode === SpatialMode.Circular3D
                                ? 'bg-black text-white border-black' 
                                : 'bg-transparent text-swiss-sub border-black/10'
                            }`}
                        >
                            <Wind size={10} />
                            <span className="text-[8px] uppercase font-bold text-center">Orbit</span>
                        </button>
                    </Tooltip>
                    
                    <Tooltip content="Gentle Left-Right soothing. Best for Trauma/Anxiety processing.">
                            <button 
                            onClick={() => onUpdate({ noiseSpatialMode: audioState.noiseSpatialMode === SpatialMode.Bilateral ? SpatialMode.None : SpatialMode.Bilateral })}
                            className={`flex flex-col items-center justify-center px-1 py-2 rounded-sm border transition-all gap-1 w-full ${
                                audioState.noiseSpatialMode === SpatialMode.Bilateral
                                ? 'bg-black text-white border-black' 
                                : 'bg-transparent text-swiss-sub border-black/10'
                            }`}
                        >
                            <MoveHorizontal size={10} />
                            <span className="text-[8px] uppercase font-bold text-center">Scan</span>
                        </button>
                    </Tooltip>

                    <Tooltip content="Complex Figure-8 spatial loop. Disengages conscious mind (Hemi-Sync style).">
                            <button 
                            onClick={() => onUpdate({ noiseSpatialMode: audioState.noiseSpatialMode === SpatialMode.Vortex ? SpatialMode.None : SpatialMode.Vortex })}
                            className={`flex flex-col items-center justify-center px-1 py-2 rounded-sm border transition-all gap-1 w-full ${
                                audioState.noiseSpatialMode === SpatialMode.Vortex
                                ? 'bg-black text-white border-black' 
                                : 'bg-transparent text-swiss-sub border-black/10'
                            }`}
                        >
                            <Infinity size={10} />
                            <span className="text-[8px] uppercase font-bold text-center">Vortex</span>
                        </button>
                    </Tooltip>
                 </div>
             </div>
        </div>
      </div>

    </div>
  );
};

export default SidebarControls;
