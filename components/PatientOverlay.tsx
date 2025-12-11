

import React, { useEffect, useState } from 'react';
import { Minimize2, Activity, Zap, Waves, Settings, X, Volume2, Wind, Headphones, Play, Pause, MoveHorizontal, Sunrise, ArrowRight, Eye, ShieldAlert, Heart, List } from 'lucide-react';
import Visualizer from './Visualizer';
import { BrainwaveBand, AudioState, NoiseType, CarrierMode, SpatialMode, ProtocolStatus } from '../types';
import { audioEngine } from '../services/audioEngine';

interface PatientOverlayProps {
  audioState: AudioState;
  onUpdate: (updates: Partial<AudioState>) => void;
  currentBand: BrainwaveBand;
  isPlaying: boolean;
  onClose: () => void;
  onTogglePlay: () => void;
  protocolStatus?: ProtocolStatus;
}

const PatientOverlay: React.FC<PatientOverlayProps> = ({ 
  audioState, 
  onUpdate,
  currentBand, 
  isPlaying, 
  onClose,
  onTogglePlay,
  protocolStatus
}) => {
  const [visible, setVisible] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [sedationMode, setSedationMode] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(err => console.log("Exit fullscreen failed", err));
    }
    onClose();
  };

  const handleSafetyStop = async () => {
      await audioEngine.fadeOut(0.5); // Fast fade out
      if (isPlaying) onTogglePlay();
  };

  const formatTime = (secs: number) => {
      const m = Math.floor(secs / 60);
      const s = Math.floor(secs % 60);
      return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Simplified Sedation View
  if (sedationMode) {
      return (
          <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center p-8 text-white font-sans">
              <div className="absolute top-8 right-8">
                  <button onClick={() => setSedationMode(false)} className="px-6 py-2 border border-white/20 rounded-full text-sm uppercase tracking-widest text-white/50 hover:bg-white/10 hover:text-white transition-all">
                      Exit Sedation View
                  </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-6xl h-3/4">
                  <button 
                    onClick={() => onUpdate({ masterVolume: Math.max(0, audioState.masterVolume - 0.2), beatFreq: 6, carrierMode: CarrierMode.Soft })}
                    className="group bg-blue-900/20 border border-blue-500/30 rounded-2xl flex flex-col items-center justify-center gap-6 hover:bg-blue-900/40 transition-all active:scale-95"
                  >
                      <Waves size={64} className="text-blue-200 opacity-60 group-hover:opacity-100 transition-opacity" />
                      <span className="text-2xl font-light uppercase tracking-widest">Too Intense</span>
                      <span className="text-sm text-white/40">Soften & Lower Volume</span>
                  </button>

                  <button 
                    onClick={() => onUpdate({ noiseType: NoiseType.Brown, noiseVolume: 0.6, carrierMode: CarrierMode.Harmonic })}
                    className="group bg-amber-900/20 border border-amber-500/30 rounded-2xl flex flex-col items-center justify-center gap-6 hover:bg-amber-900/40 transition-all active:scale-95"
                  >
                      <Heart size={64} className="text-amber-200 opacity-60 group-hover:opacity-100 transition-opacity" />
                      <span className="text-2xl font-light uppercase tracking-widest">Anxious / Cold</span>
                      <span className="text-sm text-white/40">Warmth & Comfort</span>
                  </button>

                  <button 
                    onClick={handleSafetyStop}
                    className="group bg-red-900/20 border border-red-500/30 rounded-2xl flex flex-col items-center justify-center gap-6 hover:bg-red-900/40 transition-all active:scale-95"
                  >
                      <ShieldAlert size={64} className="text-red-200 opacity-60 group-hover:opacity-100 transition-opacity" />
                      <span className="text-2xl font-light uppercase tracking-widest">STOP ALL</span>
                      <span className="text-sm text-white/40">Emergency Fade Out</span>
                  </button>
              </div>
          </div>
      );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center overflow-hidden font-sans text-white">
      {/* Background Visualizer */}
      <Visualizer 
        beatFreq={audioState.beatFreq} 
        carrierFreq={audioState.carrierFreq}
        mode="waveform" 
        isPlaying={isPlaying}
        className={`absolute inset-0 w-full h-full transition-opacity duration-500 ${audioState.safetyMode ? 'opacity-50' : 'opacity-80'}`} 
      />

      {/* Breathing Guide Visual (Overlay) */}
      {audioState.breathingGuide && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
             <div className="w-[300px] h-[300px] rounded-full border-4 border-white/10 opacity-30 animate-breath"></div>
             <style>{`
                @keyframes breath {
                    0% { transform: scale(0.8); opacity: 0.2; }
                    40% { transform: scale(1.2); opacity: 0.5; } /* 4s Inhale */
                    100% { transform: scale(0.8); opacity: 0.2; } /* 6s Exhale */
                }
                .animate-breath {
                    animation: breath 10s infinite ease-in-out;
                }
             `}</style>
          </div>
      )}

      {/* Bilateral Warning */}
      {audioState.noiseSpatialMode === SpatialMode.Bilateral && (
          <div className="absolute top-24 left-1/2 -translate-x-1/2 bg-black/40 backdrop-blur px-4 py-2 rounded border border-white/10 flex items-center gap-2 text-white/60 animate-pulse">
              <MoveHorizontal size={14} />
              <span className="text-[10px] uppercase tracking-widest">Bilateral Stimulation Active</span>
          </div>
      )}

      {/* --- HUD: Left Side (Frequencies) --- */}
      <div className={`absolute top-12 left-12 flex flex-col gap-10 transition-all duration-1000 transform ${visible && !showControls ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10 pointer-events-none'}`}>
        
        {/* Carrier Info */}
        <div className="group">
          <div className="flex items-center gap-3 mb-2 text-white/40 group-hover:text-white/60 transition-colors">
            <Waves size={18} />
            <span className="text-xs uppercase tracking-[0.2em] font-medium">Carrier Tone</span>
          </div>
          <div className="flex items-baseline gap-2 text-white/90">
             <span className="text-7xl font-light font-display tracking-tighter">{Math.round(audioState.carrierFreq)}</span>
             <span className="text-2xl font-light text-white/50">Hz</span>
          </div>
        </div>

        {/* Beat Info */}
        <div className="group">
          <div className="flex items-center gap-3 mb-2 text-white/40 group-hover:text-white/60 transition-colors">
            <Activity size={18} />
            <span className="text-xs uppercase tracking-[0.2em] font-medium">Binaural Beat</span>
          </div>
          <div className="flex items-baseline gap-2 text-white/90">
             <span className="text-7xl font-light font-display tracking-tighter">{audioState.beatFreq.toFixed(1)}</span>
             <span className="text-2xl font-light text-white/50">Hz</span>
          </div>
        </div>
      </div>

      {/* --- HUD: Right Side (State) --- */}
      <div className={`absolute bottom-12 right-12 text-right transition-all duration-1000 delay-300 transform ${visible && !showControls ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`}>
         <div className="flex items-center justify-end gap-3 mb-2 text-white/40">
            <span className="text-xs uppercase tracking-[0.2em] font-medium">Target State</span>
            <Zap size={18} />
          </div>
          <div className="text-[120px] leading-none font-light font-display text-white tracking-tighter mix-blend-overlay opacity-90">
            {currentBand}
          </div>
      </div>

      {/* --- PROTOCOL STATUS BAR (Phase 3) --- */}
      {protocolStatus && protocolStatus.isActive && (
          <div className="absolute bottom-12 left-12 max-w-[400px] z-20">
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-lg p-4 animate-in slide-in-from-left-4 fade-in duration-700">
                  <div className="flex items-center gap-3 mb-2 text-emerald-400">
                      <List size={16} className="animate-pulse" />
                      <span className="text-xs font-bold uppercase tracking-widest">Protocol Active</span>
                  </div>
                  
                  <div className="mb-2">
                      <h4 className="text-xl font-display font-medium text-white mb-1">
                          {protocolStatus.currentStepName}
                      </h4>
                      <div className="flex justify-between items-center text-xs text-white/60 font-mono">
                          <span>Step {protocolStatus.currentStepIndex + 1} of {protocolStatus.totalSteps}</span>
                          <span>{formatTime(protocolStatus.remainingSeconds)} remaining</span>
                      </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden mb-2">
                       <div className="h-full bg-emerald-500 animate-pulse" style={{ width: '100%' }}></div> 
                       {/* Note: Accurate progress % requires knowing total step duration which isn't passed in Status currently, 
                           so we just show active bar or could calc if needed. For now static pulse is good feedback. */}
                  </div>

                  {protocolStatus.nextStepName && (
                      <div className="text-[10px] text-white/40 uppercase tracking-wider flex items-center gap-1">
                          Next: <span className="text-white/60">{protocolStatus.nextStepName}</span>
                      </div>
                  )}
              </div>
          </div>
      )}


      {/* --- HUD: Center Status (Start/Stop) --- */}
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <button 
            onClick={onTogglePlay}
            className="group flex flex-col items-center justify-center gap-6 transition-transform hover:scale-105"
          >
            <div className="w-24 h-24 rounded-full border border-white/20 bg-white/5 backdrop-blur-md flex items-center justify-center group-hover:bg-white/10 group-hover:border-white/40 transition-all shadow-[0_0_50px_rgba(255,255,255,0.05)]">
                <Play size={40} fill="currentColor" className="ml-1 text-white/80 group-hover:text-white" />
            </div>
            <div className="text-white/40 text-sm font-display uppercase tracking-[0.5em] group-hover:text-white/80 transition-colors">
              Resume Therapy
            </div>
          </button>
        </div>
      )}

      {/* --- ACTION BUTTONS (Top Right) --- */}
      <div className="absolute top-8 right-8 flex gap-4 z-50">
        
        {/* Toggle Sedation Mode */}
        <button 
          onClick={() => setSedationMode(true)}
          className="p-4 rounded-full bg-white/5 text-white/50 hover:bg-white/10 hover:text-white backdrop-blur-md border border-white/10 hover:border-white/30 transition-all"
          title="Enter Sedation View"
        >
            <Eye size={24} />
        </button>

        {/* Play/Pause Toggle */}
        <button 
          onClick={onTogglePlay}
          className={`p-4 rounded-full transition-all duration-300 backdrop-blur-md border ${
            isPlaying 
            ? 'bg-black/20 text-white/50 border-white/10 hover:bg-red-500/10 hover:text-red-200 hover:border-red-500/30' 
            : 'bg-white text-black border-white hover:scale-105'
          }`}
        >
          {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" />}
        </button>

        {/* Settings Toggle */}
        <button 
          onClick={() => setShowControls(!showControls)}
          className={`p-4 rounded-full transition-all duration-300 backdrop-blur-md border ${
            showControls 
            ? 'bg-white text-black border-white' 
            : 'bg-black/20 text-white/50 border-white/10 hover:bg-white/10 hover:text-white hover:border-white/30'
          }`}
        >
          {showControls ? <X size={24} /> : <Settings size={24} />}
        </button>

        {/* Close/Minimize */}
        {!showControls && (
          <button 
            onClick={handleClose}
            className="p-4 bg-black/20 text-white/50 hover:text-white hover:bg-white/10 backdrop-blur-md border border-white/10 hover:border-white/30 rounded-full transition-all duration-300"
          >
            <Minimize2 size={24} />
          </button>
        )}
      </div>

      {/* --- EXPANDED CONTROLS MENU --- */}
      <div className={`absolute top-0 right-0 h-full w-[400px] bg-black/80 backdrop-blur-2xl border-l border-white/10 p-8 pt-32 shadow-2xl transition-transform duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] z-40 ${showControls ? 'translate-x-0' : 'translate-x-full'}`}>
        
        <div className="space-y-10 overflow-y-auto h-full pb-10 custom-scrollbar pr-2">
            
            {/* 1. Frequency Engine */}
            <div className="space-y-6">
                <div className="flex items-center gap-3 text-white/90 border-b border-white/10 pb-2">
                    <Activity size={18} />
                    <h3 className="text-sm font-medium uppercase tracking-widest">Frequency Engine</h3>
                </div>
                
                {/* Carrier */}
                <div className="space-y-3">
                    <div className="flex justify-between items-baseline">
                        <label className="text-xs uppercase tracking-widest text-white/50">Carrier Frequency</label>
                        <span className="font-mono text-white">{audioState.carrierFreq} Hz</span>
                    </div>
                    <input 
                        type="range" min="10" max="600" step="5"
                        value={audioState.carrierFreq}
                        onChange={(e) => onUpdate({ carrierFreq: parseFloat(e.target.value) })}
                        className="w-full accent-white h-1 bg-white/20 rounded-lg appearance-none cursor-pointer hover:bg-white/30"
                    />
                    
                     {/* Texture Mode */}
                     <div className="grid grid-cols-2 gap-2 pt-1">
                        {[CarrierMode.Pure, CarrierMode.Soft, CarrierMode.Harmonic, CarrierMode.Solfeggio].map(mode => (
                             <button
                                key={mode}
                                onClick={() => onUpdate({ carrierMode: mode })}
                                className={`px-2 py-1.5 text-[10px] uppercase rounded border transition-all ${
                                    audioState.carrierMode === mode 
                                    ? 'bg-white text-black border-white font-bold' 
                                    : 'bg-transparent text-white/40 border-white/10 hover:border-white/30 hover:text-white'
                                }`}
                             >
                                {mode}
                             </button>
                        ))}
                    </div>
                </div>

                {/* Beat / Protocol */}
                <div className="space-y-3 pt-2 border-t border-white/5">
                     <div className="flex items-center justify-between mb-2">
                         <label className="text-xs uppercase tracking-widest text-white/50">Binaural Beat</label>
                         {/* Manual/Protocol Switch */}
                         <div className="flex bg-white/10 rounded-sm p-0.5">
                            <button 
                                onClick={() => onUpdate({ isRamping: false })}
                                className={`px-2 py-1 text-[9px] uppercase font-bold rounded-sm transition-all ${!audioState.isRamping ? 'bg-white text-black' : 'text-white/40'}`}
                            >
                                Manual
                            </button>
                            <button 
                                onClick={() => onUpdate({ isRamping: true })}
                                className={`px-2 py-1 text-[9px] uppercase font-bold rounded-sm transition-all ${audioState.isRamping ? 'bg-white text-black' : 'text-white/40'}`}
                            >
                                Protocol
                            </button>
                        </div>
                     </div>

                    {!audioState.isRamping ? (
                        <>
                             <div className="flex justify-between items-baseline">
                                <span className="text-[10px] text-white/30">Static Frequency</span>
                                <span className="font-mono text-white">{audioState.beatFreq.toFixed(1)} Hz</span>
                             </div>
                             <input 
                                type="range" min="0.5" max="40" step="0.1"
                                value={audioState.beatFreq}
                                onChange={(e) => onUpdate({ beatFreq: parseFloat(e.target.value) })}
                                className="w-full accent-white h-1 bg-white/20 rounded-lg appearance-none cursor-pointer hover:bg-white/30"
                            />
                        </>
                    ) : (
                        <div className="bg-white/5 rounded p-3 space-y-3 border border-white/10">
                             <div className="grid grid-cols-[1fr,auto,1fr] gap-2 items-center">
                                 <div>
                                     <label className="text-[9px] uppercase tracking-wider text-white/40 block mb-1">Start</label>
                                     <input 
                                        className="w-full h-1 accent-white bg-white/10 rounded-lg appearance-none cursor-pointer" 
                                        type="range" min="0.5" max="40" step="0.5"
                                        value={audioState.rampStartFreq}
                                        onChange={(e) => onUpdate({ rampStartFreq: parseFloat(e.target.value) })}
                                     />
                                     <div className="text-center font-mono text-xs text-white mt-1">{audioState.rampStartFreq}Hz</div>
                                 </div>
                                 <ArrowRight size={12} className="text-white/30" />
                                 <div>
                                     <label className="text-[9px] uppercase tracking-wider text-white/40 block mb-1">End</label>
                                     <input 
                                        className="w-full h-1 accent-white bg-white/10 rounded-lg appearance-none cursor-pointer" 
                                        type="range" min="0.5" max="40" step="0.5"
                                        value={audioState.rampEndFreq}
                                        onChange={(e) => onUpdate({ rampEndFreq: parseFloat(e.target.value) })}
                                     />
                                     <div className="text-center font-mono text-xs text-white mt-1">{audioState.rampEndFreq}Hz</div>
                                 </div>
                             </div>
                        </div>
                    )}
                </div>

                {/* Pulse */}
                <div className="space-y-3 pt-2 border-t border-white/5">
                    <div className="flex justify-between items-baseline">
                        <label className="text-xs uppercase tracking-widest text-white/50">Isochronic Pulse</label>
                        <span className="font-mono text-white">{Math.round(audioState.isochronicAmount * 100)}%</span>
                    </div>
                    <input 
                        type="range" min="0" max="1" step="0.05"
                        value={audioState.isochronicAmount}
                        onChange={(e) => onUpdate({ isochronicAmount: parseFloat(e.target.value) })}
                        className="w-full accent-white h-1 bg-white/20 rounded-lg appearance-none cursor-pointer hover:bg-white/30"
                    />
                </div>
            </div>

            {/* 3. Atmosphere */}
            <div className="space-y-6">
                <div className="flex items-center gap-3 text-white/90 border-b border-white/10 pb-2">
                    <Wind size={18} />
                    <h3 className="text-sm font-medium uppercase tracking-widest">Nature Elements</h3>
                </div>
                
                <div className="grid grid-cols-3 gap-2">
                    {[NoiseType.Rain, NoiseType.Wind, NoiseType.Stream, NoiseType.Pink, NoiseType.Brown, NoiseType.White, NoiseType.None].map(type => (
                         <button
                            key={type}
                            onClick={() => onUpdate({ noiseType: type })}
                            className={`px-2 py-2 text-[10px] uppercase rounded border transition-all ${
                                audioState.noiseType === type 
                                ? 'bg-white text-black border-white font-bold' 
                                : 'bg-transparent text-white/40 border-white/10 hover:border-white/30 hover:text-white'
                            }`}
                         >
                            {type === 'none' ? 'OFF' : type}
                         </button>
                    ))}
                </div>

                 {/* Noise Spatial Mode Toggle */}
                 {audioState.noiseType !== NoiseType.None && (
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5">
                        <button 
                            onClick={() => onUpdate({ noiseSpatialMode: audioState.noiseSpatialMode === SpatialMode.Circular3D ? SpatialMode.None : SpatialMode.Circular3D })}
                            className={`flex items-center justify-center px-2 py-3 rounded border transition-all gap-2 w-full ${
                                audioState.noiseSpatialMode === SpatialMode.Circular3D
                                ? 'bg-white text-black border-white' 
                                : 'bg-transparent text-white/40 border-white/10 hover:border-white/30 hover:text-white'
                            }`}
                        >
                            <Wind size={14} />
                            <span className="text-[10px] uppercase font-bold">3D Orbit</span>
                        </button>
                        
                         <button 
                            onClick={() => onUpdate({ noiseSpatialMode: audioState.noiseSpatialMode === SpatialMode.Bilateral ? SpatialMode.None : SpatialMode.Bilateral })}
                            className={`flex items-center justify-center px-2 py-3 rounded border transition-all gap-2 w-full ${
                                audioState.noiseSpatialMode === SpatialMode.Bilateral
                                ? 'bg-white text-black border-white' 
                                : 'bg-transparent text-white/40 border-white/10 hover:border-white/30 hover:text-white'
                            }`}
                        >
                            <MoveHorizontal size={14} />
                            <span className="text-[10px] uppercase font-bold">EMDR Scan</span>
                        </button>
                    </div>
                )}
            </div>

            {/* 4. Safety & UX Features */}
            <div className="pt-4 border-t border-white/10 space-y-4">
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-white/60">
                         <Sunrise size={16} />
                         <span className="text-xs uppercase tracking-widest">Auto-Wakeup</span>
                    </div>
                    <button 
                        onClick={() => onUpdate({ autoWakeup: !audioState.autoWakeup })}
                        className={`w-8 h-4 rounded-full p-0.5 transition-colors ${audioState.autoWakeup ? 'bg-white' : 'bg-white/20'}`}
                    >
                        <div className={`w-3 h-3 bg-black rounded-full shadow-sm transition-transform ${audioState.autoWakeup ? 'translate-x-4' : 'translate-x-0'}`} />
                    </button>
                 </div>
                 
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-white/60">
                         <Heart size={16} />
                         <span className="text-xs uppercase tracking-widest">Breath Pacer</span>
                    </div>
                    <button 
                        onClick={() => onUpdate({ breathingGuide: !audioState.breathingGuide })}
                        className={`w-8 h-4 rounded-full p-0.5 transition-colors ${audioState.breathingGuide ? 'bg-white' : 'bg-white/20'}`}
                    >
                        <div className={`w-3 h-3 bg-black rounded-full shadow-sm transition-transform ${audioState.breathingGuide ? 'translate-x-4' : 'translate-x-0'}`} />
                    </button>
                 </div>

                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-white/60">
                         <ShieldAlert size={16} />
                         <span className="text-xs uppercase tracking-widest">Safety Mode</span>
                    </div>
                    <button 
                        onClick={() => onUpdate({ safetyMode: !audioState.safetyMode })}
                        className={`w-8 h-4 rounded-full p-0.5 transition-colors ${audioState.safetyMode ? 'bg-white' : 'bg-white/20'}`}
                    >
                        <div className={`w-3 h-3 bg-black rounded-full shadow-sm transition-transform ${audioState.safetyMode ? 'translate-x-4' : 'translate-x-0'}`} />
                    </button>
                 </div>
            </div>

        </div>
      </div>

    </div>
  );
};

export default PatientOverlay;