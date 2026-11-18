
import { useState, useEffect, useRef } from 'react';
import { SequenceStep, AudioState } from '../types';
import { logger } from '../services/logger';

interface SequencerProps {
    isPlaying: boolean;
    updateSettings: (updates: Partial<AudioState>) => void;
    stopPlayback: () => void;
}

export const useSequencer = ({ isPlaying, updateSettings, stopPlayback }: SequencerProps) => {
    const [sequence, setSequence] = useState<SequenceStep[]>([]);
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [isActive, setIsActive] = useState(false);
    
    // Timer state
    const [remainingStepSeconds, setRemainingStepSeconds] = useState(0);

    // Refs for timer loop
    const sequenceRef = useRef(sequence);
    const stepIndexRef = useRef(currentStepIndex);
    const endTimeRef = useRef(0);

    useEffect(() => {
        sequenceRef.current = sequence;
    }, [sequence]);

    // Handle Play/Stop
    useEffect(() => {
        if (isPlaying && sequence.length > 0 && isActive) {
            // Start the sequencer
            startStep(0);
        } else if (!isPlaying) {
            // Reset but keep isActive true if we want to resume? 
            // For now, reset to start.
            setCurrentStepIndex(0);
            stepIndexRef.current = 0;
            setRemainingStepSeconds(0);
        }
    }, [isPlaying]);

    const startStep = (index: number) => {
        const steps = sequenceRef.current;
        if (index >= steps.length) {
            // End of sequence
            logger.log('Sequence', 'Completed');
            stopPlayback();
            setIsActive(false);
            return;
        }

        const step = steps[index];
        setCurrentStepIndex(index);
        stepIndexRef.current = index;
        
        // Apply Settings
        updateSettings({
            beatFreq: step.beatFreq,
            carrierFreq: step.carrierFreq,
            noiseType: step.noiseType,
            isRamping: false // Disable ramping, let sequencer handle steps
        });
        
        logger.log('Sequence', `Started Phase: ${step.name}`);

        // Set Timer
        const durationSec = step.durationMinutes * 60;
        endTimeRef.current = Date.now() + (durationSec * 1000);
        setRemainingStepSeconds(durationSec);
    };

    // Timer Loop
    useEffect(() => {
        if (!isPlaying || !isActive || sequence.length === 0) return;

        const interval = setInterval(() => {
            const now = Date.now();
            const msRemaining = endTimeRef.current - now;
            const secRemaining = Math.ceil(msRemaining / 1000);

            if (secRemaining <= 0) {
                // Next step
                startStep(stepIndexRef.current + 1);
            } else {
                setRemainingStepSeconds(secRemaining);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [isPlaying, isActive]);

    const addStep = (step: SequenceStep) => {
        setSequence(prev => [...prev, step]);
    };

    const removeStep = (id: string) => {
        setSequence(prev => prev.filter(s => s.id !== id));
    };
    
    const reorderStep = (dragIndex: number, hoverIndex: number) => {
        const newSeq = [...sequence];
        const [removed] = newSeq.splice(dragIndex, 1);
        newSeq.splice(hoverIndex, 0, removed);
        setSequence(newSeq);
    };

    return {
        sequence,
        setSequence,
        currentStepIndex,
        remainingStepSeconds,
        isActive,
        setIsActive,
        addStep,
        removeStep,
        reorderStep
    };
};
