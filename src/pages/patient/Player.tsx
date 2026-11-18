
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    Minimize2, Activity, Zap, Waves, Settings, X, Volume2, Wind,
    Play, Pause, MoveHorizontal, Sunrise, ArrowRight, Eye,
    ShieldAlert, Heart, List, CheckCircle
} from 'lucide-react';
import Visualizer from '../../components/Visualizer';
import { useAudio } from '../../contexts/AudioContext';
import { DETERMINE_BAND } from '../../constants';
import { SpatialMode, NoiseType, CarrierMode } from '../../types';
import { audioEngine } from '../../services/audioEngine';

const Player: React.FC = () => {
    const navigate = useNavigate();
    const { sessionId } = useParams();
    const {
        audioState, updateSettings, isPlaying, togglePlay, protocolStatus
    } = useAudio();

    const [visible, setVisible] = useState(false);
    const [showControls, setShowControls] = useState(false);
    const [sedationMode, setSedationMode] = useState(false);
    const [showOutcomeForm, setShowOutcomeForm] = useState(false);
    const [outcomeData, setOutcomeData] = useState({ pre: 5, post: 5, notes: '' });

    useEffect(() => {
        const timer = setTimeout(() => setVisible(true), 100);
        return () => clearTimeout(timer);
    }, []);

    const handleFinish = () => {
        setShowOutcomeForm(true);
    };

    const submitOutcome = () => {
        // In a real app, send to API here
        console.log('Session outcome submitted:', outcomeData);
        navigate('/patient');
    };

    const handleSafetyStop = async () => {
        await audioEngine.fadeOut(0.5);
        if (isPlaying) togglePlay();
    };

    const formatTime = (secs: number) => {
        const m = Math.floor(secs / 60);
        const s = Math.floor(secs % 60);
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    const currentBand = DETERMINE_BAND(audioState.beatFreq);

    if (showOutcomeForm) {
        return (
            <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center p-8 text-white">
                <div className="w-full max-w-md swiss-card bg-white/10 p-10 border-white/20">
                    <h2 className="text-3xl font-display font-light mb-8 text-center text-white/90">Session <span className="font-bold">Complete</span></h2>

                    <div className="space-y-8">
                        <div>
                            <label className="block text-[10px] uppercase tracking-widest text-white/40 mb-4 text-center">How do you feel now? (1-10)</label>
                            <input
                                type="range" min="1" max="10"
                                value={outcomeData.post}
                                onChange={(e) => setOutcomeData({ ...outcomeData, post: parseInt(e.target.value) })}
                                className="w-full accent-white"
                            />
                            <div className="flex justify-between text-[10px] text-white/20 mt-2">
                                <span>Worse</span>
                                <span>Better</span>
                            </div>
                        </div>

                        <div>
                            <label className="block text-[10px] uppercase tracking-widest text-white/40 mb-2">Reflections (Optional)</label>
                            <textarea
                                placeholder="How was the experience?"
                                value={outcomeData.notes}
                                onChange={(e) => setOutcomeData({ ...outcomeData, notes: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-sm p-4 text-sm focus:outline-none focus:border-white/30 h-32 resize-none"
                            />
                        </div>

                        <button
                            onClick={submitOutcome}
                            className="w-full py-4 bg-white text-black text-xs font-bold uppercase tracking-[0.2em] hover:opacity-90 transition-opacity"
                        >
                            Save & Return to Dashboard
                        </button>
                    </div>
                </div>
            </div>
        );
    }

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
                        onClick={() => updateSettings({ masterVolume: Math.max(0, audioState.masterVolume - 0.2), beatFreq: 6, carrierMode: CarrierMode.Soft })}
                        className="group bg-blue-900/20 border border-blue-500/30 rounded-2xl flex flex-col items-center justify-center gap-6 hover:bg-blue-900/40 transition-all active:scale-95"
                    >
                        <Waves size={64} className="text-blue-200 opacity-60 group-hover:opacity-100 transition-opacity" />
                        <span className="text-2xl font-light uppercase tracking-widest">Too Intense</span>
                        <span className="text-sm text-white/40">Soften & Lower Volume</span>
                    </button>

                    <button
                        onClick={() => updateSettings({ noiseType: NoiseType.Brown, noiseVolume: 0.6, carrierMode: CarrierMode.Harmonic })}
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

            {/* --- HUD: Left Side (Frequencies) --- */}
            <div className={`absolute top-12 left-12 flex flex-col gap-10 transition-all duration-1000 transform ${visible && !showControls ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10 pointer-events-none'}`}>
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

            {/* --- PROTOCOL STATUS BAR --- */}
            {protocolStatus && protocolStatus.isActive && (
                <div className="absolute bottom-12 left-12 max-w-[400px] z-20">
                    <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-lg p-4">
                        <div className="flex items-center gap-3 mb-2 text-emerald-400">
                            <List size={16} />
                            <span className="text-xs font-bold uppercase tracking-widest">Protocol Active</span>
                        </div>
                        <div className="mb-2">
                            <h4 className="text-xl font-display font-medium text-white mb-1">{protocolStatus.currentStepName}</h4>
                            <div className="flex justify-between items-center text-xs text-white/60 font-mono">
                                <span>Step {protocolStatus.currentStepIndex + 1} of {protocolStatus.totalSteps}</span>
                                <span>{formatTime(protocolStatus.remainingSeconds)} remaining</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Center Status / Finish Button */}
            <div className="absolute inset-x-0 bottom-32 flex justify-center z-10">
                {isPlaying ? (
                    <button
                        onClick={handleFinish}
                        className="px-12 py-4 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 rounded-full text-xs font-bold uppercase tracking-[0.3em] transition-all"
                    >
                        Finish Session
                    </button>
                ) : (
                    <button
                        onClick={togglePlay}
                        className="px-12 py-6 bg-white text-black rounded-full text-xs font-bold uppercase tracking-[0.4em] hover:scale-105 transition-transform"
                    >
                        Begin Journey
                    </button>
                )}
            </div>

            {/* Action Buttons */}
            <div className="absolute top-8 right-8 flex gap-4 z-50">
                <button onClick={() => setSedationMode(true)} className="p-4 rounded-full bg-white/5 text-white/50 border border-white/10"><Eye size={24} /></button>
                <button onClick={togglePlay} className={`p-4 rounded-full border ${isPlaying ? 'bg-black/20 text-white/50 border-white/10' : 'bg-white text-black border-white'}`}>
                    {isPlaying ? <Pause size={24} /> : <Play size={24} />}
                </button>
                <button onClick={() => navigate('/patient')} className="p-4 bg-white/10 rounded-full text-white/50 border border-white/10"><X size={24} /></button>
            </div>
        </div>
    );
};

export default Player;
