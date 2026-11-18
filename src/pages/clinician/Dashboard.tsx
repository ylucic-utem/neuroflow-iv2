
import React from 'react';
import { useAudio } from '../../contexts/AudioContext';
import { DETERMINE_BAND } from '../../constants';
import Visualizer from '../../components/Visualizer';
import PresetList from '../../components/PresetList';
import { Maximize2, Activity, Users, BookOpen, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ClinicianDashboard: React.FC = () => {
    const navigate = useNavigate();
    const {
        audioState, isPlaying, updateSettings, handleApplyPreset, protocolStatus
    } = useAudio();

    const currentBand = DETERMINE_BAND(audioState.beatFreq);

    return (
        <div className="flex flex-col p-10 gap-6 min-w-0 h-full">
            <header className="flex justify-between items-end mb-4">
                <div>
                    <h1 className="text-3xl font-display font-light">Clinician <span className="font-bold">Dashboard</span></h1>
                    <p className="text-swiss-sub text-xs uppercase tracking-widest mt-1">Patient Monitoring & Protocol Management</p>
                </div>
                <div className="flex gap-4">
                    <div className="flex items-center gap-2 px-4 py-2 bg-white/40 rounded-sm border border-white/60">
                        <Users size={16} className="text-swiss-sub" />
                        <span className="text-xs font-medium">12 ACTIVE PATIENTS</span>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 text-emerald-700 rounded-sm border border-emerald-500/20">
                        <Activity size={16} />
                        <span className="text-xs font-medium uppercase tracking-widest">System Online</span>
                    </div>
                </div>
            </header>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                    { label: 'Carrier', value: Math.round(audioState.carrierFreq), unit: 'Hz', icon: Activity },
                    { label: 'Beat', value: audioState.beatFreq.toFixed(1), unit: 'Hz', icon: Activity },
                    { label: 'State', value: currentBand, unit: 'Band', icon: BrainCircle },
                    { label: 'Remaining', value: protocolStatus.isActive ? Math.floor(protocolStatus.remainingSeconds / 60) + ':' + (protocolStatus.remainingSeconds % 60).toString().padStart(2, '0') : '00:00', unit: 'Time', icon: Clock },
                ].map((stat, i) => (
                    <div key={i} className="swiss-card p-5 text-center group hover:bg-white/80 transition-colors">
                        <div className="text-[10px] uppercase tracking-widest text-swiss-sub mb-2">{stat.label}</div>
                        <div className="text-3xl font-light font-display">{stat.value}</div>
                        <div className="text-[10px] text-swiss-sub mt-1 uppercase">{stat.unit}</div>
                    </div>
                ))}
            </div>

            {/* Main Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">

                {/* Visualizer Block */}
                <div className="lg:col-span-2 swiss-card flex flex-col p-8 min-h-0 relative overflow-hidden group">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xs font-medium uppercase tracking-widest text-swiss-sub">Real-time Entrainment Visualizer</h3>
                        <button
                            onClick={() => navigate('/patient')}
                            className="flex items-center gap-2 text-[10px] px-3 py-1 bg-black text-white rounded-full uppercase tracking-tighter hover:scale-105 transition-transform"
                        >
                            <Maximize2 size={12} /> Fullscreen Patient View
                        </button>
                    </div>

                    <div className="flex-1 relative border border-gray-100/50 bg-gradient-to-br from-red-100/10 to-indigo-100/10 rounded overflow-hidden">
                        <Visualizer
                            beatFreq={audioState.beatFreq}
                            carrierFreq={audioState.carrierFreq}
                            mode="waveform"
                            isPlaying={isPlaying}
                            className="w-full h-full"
                        />

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

                {/* Sidebar Mini-Tools */}
                <div className="flex flex-col gap-6">
                    <div className="swiss-card p-6 flex-1">
                        <div className="flex items-center gap-2 mb-4">
                            <BookOpen size={16} className="text-swiss-sub" />
                            <h3 className="text-xs font-medium uppercase tracking-widest text-swiss-sub">Quick Presets</h3>
                        </div>
                        <PresetList onApplyPreset={handleApplyPreset} currentAudioState={audioState} />
                    </div>

                    <div className="swiss-card p-6">
                        <h3 className="text-xs font-medium uppercase tracking-widest text-swiss-sub mb-4">Clinical Note</h3>
                        <textarea
                            placeholder="Session observations..."
                            className="w-full h-32 bg-white/30 border border-white/60 rounded-sm p-3 text-sm font-sans focus:outline-none focus:border-black/20 resize-none"
                        />
                        <button className="w-full mt-3 py-2 bg-black text-white text-[10px] uppercase tracking-widest rounded-sm hover:opacity-90 transition-opacity">
                            Save Note
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
};

const BrainCircle = ({ size, className }: { size: number, className?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z" />
        <path d="M12 8v8" />
        <path d="M8 12h8" />
    </svg>
);

export default ClinicianDashboard;
