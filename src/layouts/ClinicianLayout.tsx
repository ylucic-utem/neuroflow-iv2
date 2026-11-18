
import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import SidebarControls from '../components/SidebarControls';
import { useAudio } from '../contexts/AudioContext';
import { DETERMINE_BAND } from '../constants';

const SessionCreatorModal = React.lazy(() => import('../components/SessionCreatorModal'));

const ClinicianLayout: React.FC = () => {
    const navigate = useNavigate();
    const [showSessionCreator, setShowSessionCreator] = useState(false);
    const [savedFlowState, setSavedFlowState] = useState<any>(null);

    const {
        isPlaying, audioState, togglePlay, updateSettings, setSessionPlaylist,
        chatHistory, chatInput, isProcessingAI, setChatInput, sendMessage, generateVoice,
        handleApplyRecommendation,
        durationMinutes, setDurationMinutes, remainingTime, isTimerActive,
        isSequencerActive, setIsSequencerActive, sequence, sequenceStepIndex, sequenceRemaining, addStep, removeStep,
        quickPresets
    } = useAudio();

    const currentBand = DETERMINE_BAND(audioState.beatFreq);

    const handleSessionSave = (playlist: any[], flowState: any) => {
        setSavedFlowState(flowState);
        setSessionPlaylist(playlist);
        setIsSequencerActive(false);
        setShowSessionCreator(false);
    };

    return (
        <div className="flex h-screen w-full relative z-10 overflow-hidden">
            {/* Background Orbs (Global styles from index.html) */}
            <div className="gradient-orb orb-1"></div>
            <div className="gradient-orb orb-2"></div>
            <div className="gradient-orb orb-3"></div>

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
                        presets={quickPresets}
                    />
                )}
            </React.Suspense>

            <SidebarControls
                audioState={audioState}
                isPlaying={isPlaying}
                onTogglePlay={togglePlay}
                onUpdate={updateSettings}
                currentBand={currentBand}
                onOpenPatientView={() => navigate('/patient')}
                onOpenSessionCreator={() => setShowSessionCreator(true)}
                chatHistory={chatHistory}
                chatInput={chatInput}
                isProcessingAI={isProcessingAI}
                onChatInputChange={setChatInput}
                onChatSend={() => sendMessage(chatInput)}
                onGenerateVoice={() => generateVoice(audioState.beatFreq)}
                onApplyRecommendation={handleApplyRecommendation}
                timerDuration={durationMinutes}
                onTimerDurationChange={setDurationMinutes}
                remainingTime={remainingTime}
                isTimerActive={isTimerActive}
                isSequencerActive={isSequencerActive}
                setIsSequencerActive={setIsSequencerActive}
                sequence={sequence}
                currentStepIndex={sequenceStepIndex}
                remainingStepSeconds={sequenceRemaining}
                onAddStep={addStep}
                onRemoveStep={removeStep}
            />

            <main className="flex-1 overflow-y-auto relative">
                <Outlet />
            </main>
        </div>
    );
};

export default ClinicianLayout;
