
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Clock, Calendar, CheckCircle2 } from 'lucide-react';

const SessionList: React.FC = () => {
    const navigate = useNavigate();

    const mockSessions = [
        { id: '1', name: 'Morning Focus Priming', protocol: 'Analytical Focus (Beta)', duration: 45, date: 'Today', status: 'pending' },
        { id: '2', name: 'Deep Stress Recovery', protocol: 'Deep Sleep (Delta)', duration: 60, date: 'Yesterday', status: 'completed' },
    ];

    return (
        <div className="min-h-screen bg-black text-white p-8 md:p-16 flex flex-col items-center">
            <header className="w-full max-w-4xl mb-16 text-center">
                <h1 className="text-4xl font-display font-light mb-4 text-white/90">Your <span className="font-bold">Sessions</span></h1>
                <p className="text-white/40 uppercase tracking-[0.3em] text-[10px]">Guided Neuro-Acoustic Journey</p>
            </header>

            <div className="w-full max-w-2xl flex flex-col gap-6">
                {mockSessions.map((session) => (
                    <div
                        key={session.id}
                        className={`p-8 border ${session.status === 'completed' ? 'border-white/10 opacity-60' : 'border-white/20 bg-white/5'} flex flex-col md:flex-row justify-between items-start md:items-center gap-6 group transition-all hover:bg-white/10 cursor-pointer`}
                        onClick={() => session.status === 'pending' && navigate(`play/${session.id}`)}
                    >
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                                <span className="text-[10px] py-1 px-3 bg-white/10 rounded-full font-mono uppercase tracking-widest">
                                    {session.protocol}
                                </span>
                                {session.status === 'completed' && <CheckCircle2 size={14} className="text-emerald-500" />}
                            </div>
                            <h2 className="text-2xl font-display font-medium group-hover:text-white transition-colors">{session.name}</h2>

                            <div className="flex items-center gap-6 mt-4 opacity-40">
                                <div className="flex items-center gap-2">
                                    <Clock size={12} />
                                    <span className="text-xs uppercase tracking-widest">{session.duration} MIN</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Calendar size={12} />
                                    <span className="text-xs uppercase tracking-widest">{session.date}</span>
                                </div>
                            </div>
                        </div>

                        {session.status === 'pending' ? (
                            <button
                                className="w-full md:w-auto px-10 py-4 bg-white text-black text-xs font-bold uppercase tracking-[0.2em] transform transition-transform active:scale-95 group-hover:scale-105"
                            >
                                Start Session
                            </button>
                        ) : (
                            <div className="text-[10px] uppercase tracking-widest text-white/40">Reviewed by Clinician</div>
                        )}
                    </div>
                ))}

                {!mockSessions.length && (
                    <div className="p-20 text-center border border-dashed border-white/20">
                        <p className="text-white/30 uppercase tracking-widest text-xs">No sessions assigned yet.</p>
                    </div>
                )}
            </div>

            <footer className="mt-auto pt-20 text-[10px] text-white/20 uppercase tracking-[0.4em]">
                End-to-End Encryption Enabled • HIPAA Compliant Data Sync
            </footer>
        </div>
    );
};

export default SessionList;
