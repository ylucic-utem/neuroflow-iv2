

import { useState, useEffect, useRef } from 'react';
import { audioEngine } from '../services/audioEngine';

interface SessionTimerProps {
    isPlaying: boolean;
    stopPlayback: () => void;
    currentBeatFreq: number;
    onIntervention: (type: 'deepener' | 'wakeup') => void;
}

export const useSessionTimer = ({ isPlaying, stopPlayback, currentBeatFreq, onIntervention }: SessionTimerProps) => {
    const [durationMinutes, setDurationMinutes] = useState(20);
    const [remainingSeconds, setRemainingSeconds] = useState(20 * 60);
    const [isActive, setIsActive] = useState(false);
    
    // Timer Refs for accurate drift-less timing
    const endTimeRef = useRef<number>(0);
    
    // Use refs for callbacks and flags to prevent the interval from being 
    // torn down and recreated when parent component re-renders.
    const onInterventionRef = useRef(onIntervention);
    const durationRef = useRef(durationMinutes);
    const hasTriggeredDeepener = useRef(false);
    const hasTriggeredWakeup = useRef(false);

    // Keep refs updated
    useEffect(() => {
        onInterventionRef.current = onIntervention;
    }, [onIntervention]);

    useEffect(() => {
        durationRef.current = durationMinutes;
        if (!isActive) {
            setRemainingSeconds(durationMinutes * 60);
        }
    }, [durationMinutes, isActive]);

    // Start/Stop Logic
    useEffect(() => {
        if (isPlaying) {
            setIsActive(true);
            hasTriggeredDeepener.current = false;
            hasTriggeredWakeup.current = false;
            // Set end time target
            endTimeRef.current = Date.now() + (durationRef.current * 60 * 1000);
        } else {
            setIsActive(false);
        }
    }, [isPlaying]);

    // Robust Timer Interval
    // Dependent ONLY on isActive. Callbacks and data are accessed via refs.
    useEffect(() => {
        if (!isActive) return;

        const interval = window.setInterval(() => {
            const now = Date.now();
            const msRemaining = endTimeRef.current - now;
            const next = Math.ceil(msRemaining / 1000);

            if (next <= 0) {
                // We must clear interval immediately to stop double calling
                clearInterval(interval);
                setRemainingSeconds(0);
                setTimeout(() => handleSessionEnd(), 0);
                return;
            }

            setRemainingSeconds(next);
            
            const totalSeconds = durationRef.current * 60;
            
            // --- DEEPENER LOGIC (50% mark) ---
            if (durationRef.current >= 10 && !hasTriggeredDeepener.current) {
                if (next <= totalSeconds * 0.5) {
                    hasTriggeredDeepener.current = true;
                    onInterventionRef.current('deepener');
                }
            }

            // --- WAKEUP LOGIC (Last 2 mins) ---
            // We check if we are around 2 mins (120s)
            // Use range check in case of drift skipping exact second
            if (next <= 120 && next > 115 && !hasTriggeredWakeup.current) {
                hasTriggeredWakeup.current = true;
                onInterventionRef.current('wakeup');
            }

        }, 1000);

        return () => clearInterval(interval);
    }, [isActive]); 

    const handleSessionEnd = async () => {
        setIsActive(false);
        await audioEngine.fadeOut(3); 
        stopPlayback();
        setRemainingSeconds(durationRef.current * 60);
    };

    const formatTime = (secs: number) => {
        if (secs < 0) secs = 0;
        const m = Math.floor(secs / 60);
        const s = secs % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    return {
        durationMinutes,
        setDurationMinutes,
        remainingSeconds,
        formattedTime: formatTime(remainingSeconds),
        isActive
    };
};