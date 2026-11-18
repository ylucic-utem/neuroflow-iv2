
import React, { createContext, useContext, ReactNode } from 'react';
import { useAudioController } from '../hooks/useAudioController';
import { useTherapyAssistant } from '../hooks/useTherapyAssistant';
import { useSessionTimer } from '../hooks/useSessionTimer';
import { useSequencer } from '../hooks/useSequencer';
import { useProtocolEngine } from '../hooks/useProtocolEngine';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { usePresets } from '../hooks/usePresets';
import { AIRecommendation, ProtocolStep, ClinicalProtocol } from '../types';

interface AudioContextType {
    isPlaying: boolean;
    audioState: any;
    togglePlay: () => void;
    updateSettings: (updates: any) => void;
    setSessionPlaylist: (playlist: ProtocolStep[]) => void;

    // Assistant
    chatHistory: any[];
    chatInput: string;
    isProcessingAI: boolean;
    setChatInput: (input: string) => void;
    sendMessage: (input: string) => void;
    generateVoice: (freq: number) => void;
    generateDeepener: (freq: number) => void;

    // Timer
    durationMinutes: number;
    setDurationMinutes: (min: number) => void;
    remainingTime: string;
    isTimerActive: boolean;

    // Sequencer
    sequence: any[];
    sequenceStepIndex: number;
    sequenceRemaining: number;
    isSequencerActive: boolean;
    setIsSequencerActive: (active: boolean) => void;
    addStep: (step: any) => void;
    removeStep: (id: string) => void;
    setSequence: (seq: any[]) => void;

    // Protocol
    protocolStatus: any;

    // Handlers
    handleApplyRecommendation: (rec: AIRecommendation) => void;
    handleApplyPreset: (preset: any) => void;

    // Dynamic Data
    clinicalProtocols: ClinicalProtocol[];
    quickPresets: any[];
    isPresetsLoading: boolean;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export const AudioProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
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

    // Phase 2: Sequencer
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

    // Phase 3: Protocol Engine
    const protocolStatus = useProtocolEngine({
        playlist: audioState.activeProtocol,
        isPlaying,
        updateSettings,
        stopPlayback: togglePlay
    });

    // Session Timer
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

    // Keyboard Shortcuts
    useKeyboardShortcuts({ isPlaying, togglePlay, updateSettings, audioState });

    // Dynamic Presets
    const { clinicalProtocols, quickPresets, isLoading: isPresetsLoading } = usePresets();

    const handleApplyRecommendation = (rec: AIRecommendation) => {
        updateSettings({
            carrierFreq: rec.carrierHz,
            noiseType: rec.noiseType,
            carrierMode: rec.carrierMode,
            noiseSpatialMode: rec.spatialMode,
            isochronicAmount: rec.isochronicAmount,
            isRamping: rec.isRamping,
            rampStartFreq: rec.rampStartHz || rec.beatHz,
            rampEndFreq: rec.rampEndHz || rec.beatHz,
            rampDurationMinutes: rec.recommendedDurationMin,
            beatFreq: rec.beatHz,
        });
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

    return (
        <AudioContext.Provider value={{
            isPlaying, audioState, togglePlay, updateSettings, setSessionPlaylist,
            chatHistory, chatInput, isProcessingAI, setChatInput, sendMessage, generateVoice, generateDeepener,
            durationMinutes, setDurationMinutes, remainingTime, isTimerActive,
            sequence, sequenceStepIndex, sequenceRemaining, isSequencerActive, setIsSequencerActive, addStep, removeStep, setSequence,
            protocolStatus,
            handleApplyRecommendation, handleApplyPreset,
            clinicalProtocols, quickPresets, isPresetsLoading
        }}>
            {children}
        </AudioContext.Provider>
    );
};

export const useAudio = () => {
    const context = useContext(AudioContext);
    if (context === undefined) {
        throw new Error('useAudio must be used within an AudioProvider');
    }
    return context;
};
