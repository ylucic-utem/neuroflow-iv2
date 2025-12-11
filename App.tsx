

import React, { useState } from 'react';
import { DETERMINE_BAND, PRESETS } from './constants';
import { AIRecommendation, SequenceStep, ProtocolStep } from './types';
import Visualizer from './components/Visualizer';
import { Maximize2 } from 'lucide-react';

// Hooks
import { useAudioController } from './hooks/useAudioController';
import { useTherapyAssistant } from './hooks/useTherapyAssistant';
import { useSessionTimer } from './hooks/useSessionTimer';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useSequencer } from './hooks/useSequencer';
import { useProtocolEngine } from './hooks/useProtocolEngine';

// Components
import SidebarControls from './components/SidebarControls';
import PresetList from './components/PresetList';
import PatientOverlay from './components/PatientOverlay';

// Code Splitting for heavy "Session Creator" tool
const SessionCreatorModal = React.lazy(() => import('./components/SessionCreatorModal'));

const App: React.FC = () => {
  const [showPatientView, setShowPatientView] = useState(false);
  const [showSessionCreator, setShowSessionCreator] = useState(false);
  const [savedFlowState, setSavedFlowState] = useState<any>(null);
  
  // Custom Hooks
  const { isPlaying, audioState, togglePlay, updateSettings, setSessionPlaylist } = useAudioController();
  const { 
    chatHistory, 
    chatInput, 
    isProcessingAI, 
    setChatInput, 
    sendMessage, 
    generateVoice,
    generateDeepener 
  } = useTherapyAssistant();

  // Initialize Keyboard Shortcuts
  useKeyboardShortcuts({ isPlaying, togglePlay, updateSettings, audioState });

  // Phase 2: Sequencer (Manual Timeline)
  const { 
    sequence, 
    currentStepIndex: sequenceStepIndex, 
    remainingStepSeconds: sequenceRemaining, 
    isActive: isSequencerActive, 
    setIsActive: setIsSequencerActive,
    addStep, 
    removeStep,
    setSequence 
  } = useSequencer({
    isPlaying,
    updateSettings,
    stopPlayback: togglePlay
  });

  // Phase 3: Protocol Engine (Advanced Graph Playlist)
  // This engine takes over when a playlist is loaded from Session Creator
  const protocolStatus = useProtocolEngine({
      playlist: audioState.activeProtocol,
      isPlaying,
      updateSettings,
      stopPlayback: togglePlay
  });

  // Session Timer (Fallback if no protocol/sequencer running)
  const { 
    durationMinutes, 
    setDurationMinutes, 
    formattedTime: remainingTime, 
    isActive: isTimerActive 
  } = useSessionTimer({
    isPlaying: isPlaying && !isSequencerActive && !protocolStatus.isActive, 
    stopPlayback: togglePlay,
    currentBeatFreq: audioState.beatFreq,
    onIntervention: (type) => {
      if (type === 'deepener') {
        generateDeepener(audioState.beatFreq);
      } else if (type === 'wakeup' && audioState.autoWakeup) {
         updateSettings({
            isRamping: true, 
            rampStartFreq: audioState.beatFreq, 
            rampEndFreq: 15, 
            rampDurationMinutes: 2 
         });
      }
    }
  });

  // Handlers
  const handleApplyRecommendation = (rec: AIRecommendation) => {
    // Apply full scientific configuration from AI
    updateSettings({
      carrierFreq: rec.carrierHz,
      noiseType: rec.noiseType,
      
      // Advanced Params
      carrierMode: rec.carrierMode,
      noiseSpatialMode: rec.spatialMode,
      isochronicAmount: rec.isochronicAmount,
      
      // Ramping Logic
      isRamping: rec.isRamping,
      rampStartFreq: rec.rampStartHz || rec.beatHz,
      rampEndFreq: rec.rampEndHz || rec.beatHz,
      rampDurationMinutes: rec.recommendedDurationMin, // Match ramp to session length usually
      
      // Fallback if not ramping
      beatFreq: rec.beatHz, 
    });
    
    // Also update the session timer to match recommendation
    if (rec.recommendedDurationMin) {
        setDurationMinutes(rec.recommendedDurationMin);
    }
  };

  const handleApplyPreset = (preset: any) => {
    updateSettings({
      carrierFreq: preset.carrier,
      beatFreq: preset.beat,
      noiseType: preset.noise,
      carrierMode: preset.carrierMode || 'pure',
      isRamping: false
    });
  };

  const handleSessionSave = (playlist: any[], flowState: any) => {
      console.log('[App] Session saved with playlist:', playlist);
      
      // Save flow state for next time
      setSavedFlowState(flowState);
      
      // Phase 3 Update: Use Protocol Engine for all session creator outputs
      // Convert 'any' playlist to typed ProtocolStep[]
      const protocolPlaylist: ProtocolStep[] = playlist.map(item => {
          console.log('[App] Converting item:', item);
          return {
              type: item.type,
              duration: item.duration,
              beat: item.beat,
              carrier: item.carrier,
              noise: item.noise,
              start: item.start,
              end: item.end,
              text: item.text
          };
      });
      
      console.log('[App] Final protocol playlist:', protocolPlaylist);
      setSessionPlaylist(protocolPlaylist);
      // Ensure we stop the manual sequencer if it was active
      setIsSequencerActive(false);
      
      // Optionally start playing immediately? 
      // The prompt says "When a playlist loads, it executes the first item immediately"
      // But typically we wait for user to hit Play. 
      // useProtocolEngine watches `isPlaying`. If currently playing, it will start.
      // If not playing, it will ready itself for when play is hit.
  };

  const handleOpenPatientView = async () => {
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
    } catch (e) {
      console.warn("Fullscreen request denied or not supported", e);
    }
    setShowPatientView(true);
  };

  const currentBand = DETERMINE_BAND(audioState.beatFreq);

  return (
    <>
      {/* Background Orbs */}
      <div className="gradient-orb orb-1"></div>
      <div className="gradient-orb orb-2"></div>
      <div className="gradient-orb orb-3"></div>

      <div className="flex h-screen w-full relative z-10">
        
        {/* React.Suspense for Code Splitting */}
        <React.Suspense fallback={
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
             <div className="text-white font-mono text-xs flex items-center gap-2">
                <div className="w-3 h-3 bg-white rounded-full animate-bounce"></div>
                LOADING MODULE...
             </div>
          </div>
        }>
          {showSessionCreator && (
            <SessionCreatorModal 
                onClose={() => setShowSessionCreator(false)} 
                onSave={handleSessionSave}
                savedFlow={savedFlowState}
                presets={PRESETS}
            />
          )}
        </React.Suspense>

        {/* Patient Fullscreen View Overlay */}
        {showPatientView && (
          <PatientOverlay 
            audioState={audioState}
            onUpdate={updateSettings}
            currentBand={currentBand}
            isPlaying={isPlaying}
            onTogglePlay={togglePlay}
            onClose={() => setShowPatientView(false)} 
            protocolStatus={protocolStatus}
          />
        )}

        {/* Left Sidebar: Controls & AI */}
        <SidebarControls 
          audioState={audioState} 
          isPlaying={isPlaying}
          onTogglePlay={togglePlay}
          onUpdate={updateSettings} 
          currentBand={currentBand}
          onOpenPatientView={handleOpenPatientView}
          onOpenSessionCreator={() => setShowSessionCreator(true)}
          // Chat Props
          chatHistory={chatHistory}
          chatInput={chatInput}
          isProcessingAI={isProcessingAI}
          onChatInputChange={setChatInput}
          onChatSend={() => sendMessage(chatInput)}
          onGenerateVoice={() => generateVoice(audioState.beatFreq)}
          onApplyRecommendation={handleApplyRecommendation}
          // Timer Props
          timerDuration={durationMinutes}
          onTimerDurationChange={setDurationMinutes}
          remainingTime={remainingTime}
          isTimerActive={isTimerActive}
          // Sequencer Props
          isSequencerActive={isSequencerActive}
          setIsSequencerActive={setIsSequencerActive}
          sequence={sequence}
          currentStepIndex={sequenceStepIndex}
          remainingStepSeconds={sequenceRemaining}
          onAddStep={addStep}
          onRemoveStep={removeStep}
        />

        {/* Main Content: Visuals & Status */}
        <div className="flex-1 flex flex-col p-10 gap-6 min-w-0">
          
          {/* Status Grid */}
          <div className="grid grid-cols-3 gap-4">
            <div className="swiss-card p-5 text-center">
              <div className="text-xs uppercase tracking-widest text-swiss-sub mb-2">Carrier</div>
              <div className="text-3xl font-light font-display">{Math.round(audioState.carrierFreq)}</div>
              <div className="text-xs text-swiss-sub mt-1">Hz</div>
            </div>
            <div className="swiss-card p-5 text-center">
              <div className="text-xs uppercase tracking-widest text-swiss-sub mb-2">Beat</div>
              <div className="text-3xl font-light font-display">{audioState.beatFreq.toFixed(1)}</div>
              <div className="text-xs text-swiss-sub mt-1">Hz</div>
            </div>
            <div className="swiss-card p-5 text-center">
              <div className="text-xs uppercase tracking-widest text-swiss-sub mb-2">State</div>
              <div className="text-2xl font-medium font-display text-black">{currentBand}</div>
              <div className="text-xs text-swiss-sub mt-1">Entrainment</div>
            </div>
          </div>

          {/* Visualization Area */}
          <div className="swiss-card flex-1 flex flex-col p-8 min-h-0 relative overflow-hidden group">
            <div className="flex-1 relative border border-gray-100/50 bg-gradient-to-br from-red-100/20 to-indigo-100/20 rounded overflow-hidden">
              <Visualizer 
                beatFreq={audioState.beatFreq}
                carrierFreq={audioState.carrierFreq}
                mode="waveform" 
                isPlaying={isPlaying}
                className="w-full h-full" 
              />
              
              {/* Maximize Button Overlay */}
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <button 
                  onClick={handleOpenPatientView}
                  className="p-2.5 bg-white/20 hover:bg-white/40 backdrop-blur-md rounded-full text-swiss-text shadow-sm border border-white/40 transition-all hover:scale-105"
                  title="Fullscreen Mode"
                >
                  <Maximize2 size={18} />
                </button>
              </div>

               {/* Protocol Active Overlay in Dashboard */}
               {protocolStatus.isActive && (
                   <div className="absolute bottom-4 left-4 bg-black/80 text-white px-4 py-2 rounded backdrop-blur-md flex items-center gap-4 border border-white/10 animate-in slide-in-from-bottom-2">
                       <div className="flex flex-col">
                           <span className="text-[9px] uppercase tracking-widest opacity-60">Protocol Running</span>
                           <span className="text-sm font-bold">{protocolStatus.currentStepName}</span>
                       </div>
                       <div className="h-6 w-[1px] bg-white/20"></div>
                       <div className="font-mono text-xl">{Math.floor(protocolStatus.remainingSeconds / 60)}:{(protocolStatus.remainingSeconds % 60).toString().padStart(2, '0')}</div>
                   </div>
               )}
            </div>
          </div>

          {/* Presets */}
          <div>
            <div className="flex justify-between items-center mb-3">
                 <h3 className="text-xs font-medium uppercase tracking-widest text-swiss-sub">Therapy Presets</h3>
                 <div className="text-[10px] text-swiss-sub font-mono">Hotkeys: 1-5</div>
            </div>
            <PresetList onApplyPreset={handleApplyPreset} currentAudioState={audioState} />
          </div>

        </div>

      </div>
    </>
  );
};

export default App;