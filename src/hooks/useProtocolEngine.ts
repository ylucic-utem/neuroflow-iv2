
import { useState, useEffect, useRef } from 'react';
import { ProtocolStep, AudioState, NoiseType, ProtocolStatus } from '../types';
import { logger } from '../services/logger';

interface ProtocolEngineProps {
    playlist: ProtocolStep[];
    isPlaying: boolean;
    updateSettings: (updates: Partial<AudioState>) => void;
    stopPlayback: () => void;
}

export const useProtocolEngine = ({ playlist, isPlaying, updateSettings, stopPlayback }: ProtocolEngineProps) => {
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [remainingSeconds, setRemainingSeconds] = useState(0);
    const [isActive, setIsActive] = useState(false);
    
    // Internal refs to avoid stale closures in interval
    const indexRef = useRef(0);
    const playlistRef = useRef(playlist);
    const endTimeRef = useRef(0);

    // Sync refs
    useEffect(() => {
        playlistRef.current = playlist;
    }, [playlist]);

    // Initialize when playlist loads or play starts
    useEffect(() => {
        if (isPlaying && playlist.length > 0 && !isActive) {
            setIsActive(true);
            executeStep(0);
        } else if (!isPlaying) {
            setIsActive(false);
            setCurrentStepIndex(0);
            indexRef.current = 0;
            setRemainingSeconds(0);
        }
    }, [isPlaying, playlist]);

    const executeStep = (index: number) => {
        const steps = playlistRef.current;
        if (index >= steps.length) {
            logger.log('Protocol', 'Session Complete');
            stopPlayback();
            setIsActive(false);
            return;
        }

        const step = steps[index];
        setCurrentStepIndex(index);
        indexRef.current = index;

        logger.log('Protocol', `Executing Step ${index + 1}: ${step.type}`);

        // Default to 10 seconds for instructions if no duration provided
        const durationMin = step.duration || (step.type === 'instruction' ? 0.2 : 5);
        const durationSec = durationMin * 60;
        
        endTimeRef.current = Date.now() + (durationSec * 1000);
        setRemainingSeconds(durationSec);

        // --- EXECUTION LOGIC ---
        if (step.type === 'therapy') {
            const noiseValue = step.noise || 'pink';
            const noiseType = (typeof noiseValue === 'string' ? noiseValue : noiseValue) as NoiseType;
            
            console.log('[ProtocolEngine] Therapy step settings:', {
                beat: step.beat,
                carrier: step.carrier,
                noise: step.noise,
                noiseType: noiseType
            });
            
            updateSettings({
                isRamping: false,
                beatFreq: step.beat || 10,
                carrierFreq: step.carrier || 200,
                noiseType: noiseType
            });
        } else if (step.type === 'ramp') {
            updateSettings({
                isRamping: true,
                rampStartFreq: step.start || 15,
                rampEndFreq: step.end || 5,
                rampDurationMinutes: durationMin,
                // Ensure we start at the right beat freq for UI
                beatFreq: step.start || 15
            });
        } else if (step.type === 'instruction') {
            // Instructions don't change audio, but we might want to ensure user is aware.
            // For now, it just runs down the timer while displaying the instruction in the UI.
            // Optionally could trigger TTS here if we wanted.
            logger.log('Instruction', step.text || 'Alert');
        }
    };

    // Timer Loop
    useEffect(() => {
        if (!isActive || !isPlaying) return;

        const interval = setInterval(() => {
            const now = Date.now();
            const msRemaining = endTimeRef.current - now;
            const secRemaining = Math.ceil(msRemaining / 1000);

            if (secRemaining <= 0) {
                // Move to next step
                executeStep(indexRef.current + 1);
            } else {
                setRemainingSeconds(secRemaining);
            }
        }, 500); // Check twice a second for smoother updates

        return () => clearInterval(interval);
    }, [isActive, isPlaying]);

    // Construct Status Object for UI
    const status: ProtocolStatus = {
        isActive,
        currentStepIndex,
        totalSteps: playlist.length,
        currentStepName: getStepName(playlist[currentStepIndex]),
        remainingSeconds,
        nextStepName: playlist[currentStepIndex + 1] ? getStepName(playlist[currentStepIndex + 1]) : undefined
    };

    return status;
};

// Helper for UI names
const getStepName = (step: ProtocolStep | undefined): string => {
    if (!step) return 'End';
    if (step.type === 'therapy') return `Therapy (${step.beat}Hz)`;
    if (step.type === 'ramp') return `Ramp (${step.start}Hz -> ${step.end}Hz)`;
    if (step.type === 'instruction') return `Alert: ${step.text}`;
    return 'Unknown Step';
};
