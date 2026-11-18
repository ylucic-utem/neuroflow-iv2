
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, User, BrainCircuit, Activity, Zap, Layers, Headphones, ChevronDown, Sparkles, Target, Microscope } from 'lucide-react';

const LoginPage: React.FC = () => {
    const navigate = useNavigate();
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const container = document.getElementById('landing-container');
        const handleScroll = () => {
            if (container) {
                setScrolled(container.scrollTop > 50);
            }
        };

        if (container) {
            container.addEventListener('scroll', handleScroll);
        }
        return () => container?.removeEventListener('scroll', handleScroll);
    }, []);

    const handleRoleSelect = (role: 'clinician' | 'patient') => {
        localStorage.setItem('userRole', role);
        navigate(`/${role}`);
    };

    const scrollToSection = (id: string) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <div id="landing-container" className="h-screen overflow-y-auto overflow-x-hidden scroll-smooth bg-transparent text-swiss-text selection:bg-black selection:text-white">
            {/* Navigation Bar */}
            <nav className={`fixed top-0 left-0 right-0 z-50 px-8 py-5 flex justify-between items-center transition-all duration-500 ${scrolled ? 'backdrop-blur-xl bg-white/40 border-b border-black/5 py-4' : 'bg-transparent'}`}>
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-black rounded-lg text-white shadow-lg transform hover:rotate-12 transition-transform">
                        <BrainCircuit size={22} />
                    </div>
                    <span className="font-display font-bold text-xl tracking-tight">NeuroFlow <span className="font-light opacity-60 text-lg">IV2</span></span>
                </div>

                <div className="hidden md:flex gap-10 text-[10px] uppercase tracking-[0.2em] font-bold text-black/50">
                    <button onClick={() => scrollToSection('about')} className="hover:text-black transition-colors relative group">
                        Platform
                        <span className="absolute -bottom-1 left-0 w-0 h-[1px] bg-black transition-all group-hover:w-full"></span>
                    </button>
                    <button onClick={() => scrollToSection('science')} className="hover:text-black transition-colors relative group">
                        Science
                        <span className="absolute -bottom-1 left-0 w-0 h-[1px] bg-black transition-all group-hover:w-full"></span>
                    </button>
                    <button onClick={() => scrollToSection('login')} className="hover:text-black transition-colors relative group text-black">
                        Access
                        <span className="absolute -bottom-1 left-0 w-0 h-[1px] bg-black transition-all group-hover:w-full"></span>
                    </button>
                </div>

                <button
                    onClick={() => scrollToSection('login')}
                    className="swiss-button bg-black text-white px-6 py-2.5 text-[10px] hover:scale-105 active:scale-95 shadow-xl shadow-black/10"
                >
                    Portal Login
                </button>
            </nav>

            {/* Hero Section */}
            <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-8 pt-20">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/40 border border-white/60 backdrop-blur-sm text-[10px] uppercase tracking-[0.2em] font-bold mb-10 animate-fade-in shadow-sm">
                    <Sparkles size={12} className="text-amber-500" />
                    Clinical Grade Acoustic Neuromodulation
                </div>

                <h1 className="text-6xl md:text-[110px] font-display font-light leading-[0.9] mb-10 tracking-tighter opacity-0 animate-slide-up" style={{ animationDelay: '0.2s', animationFillMode: 'forwards' }}>
                    Evolution of <br />
                    <span className="font-bold italic">Cognitive Performance</span>
                </h1>

                <p className="text-lg md:text-2xl text-black/50 max-w-2xl font-light leading-relaxed mb-16 opacity-0 animate-slide-up" style={{ animationDelay: '0.4s', animationFillMode: 'forwards' }}>
                    The research-backed neuro-acoustic engine for precision brainwave entrainment and clinical therapy management.
                </p>

                <div className="flex flex-wrap justify-center gap-6 opacity-0 animate-slide-up" style={{ animationDelay: '0.6s', animationFillMode: 'forwards' }}>
                    <button
                        onClick={() => scrollToSection('login')}
                        className="swiss-button bg-black text-white px-12 py-5 text-sm shadow-2xl shadow-black/20 hover:-translate-y-1"
                    >
                        Enter Platform
                    </button>
                    <button
                        onClick={() => scrollToSection('about')}
                        className="swiss-button bg-white text-black border border-black/10 px-12 py-5 text-sm backdrop-blur-md"
                    >
                        Discover System
                    </button>
                </div>

                <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-30 animate-pulse cursor-pointer" onClick={() => scrollToSection('about')}>
                    <span className="text-[10px] uppercase tracking-widest font-bold">Scroll Down</span>
                    <ChevronDown size={24} />
                </div>
            </section>

            {/* Platform Features */}
            <section id="about" className="relative px-8 py-40 bg-white/40 backdrop-blur-md border-y border-black/5 overflow-hidden">
                <div className="absolute top-0 right-0 w-full h-full opacity-5 pointer-events-none">
                    <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                        <path d="M0 50 Q 25 30 50 50 T 100 50" fill="none" stroke="black" strokeWidth="0.1" />
                        <path d="M0 55 Q 25 35 50 55 T 100 55" fill="none" stroke="black" strokeWidth="0.1" />
                        <path d="M0 45 Q 25 25 50 45 T 100 45" fill="none" stroke="black" strokeWidth="0.1" />
                    </svg>
                </div>

                <div className="max-w-6xl mx-auto relative z-10">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-20">
                        <div className="group">
                            <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center text-white mb-8 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-xl shadow-black/20">
                                <Activity size={28} />
                            </div>
                            <h3 className="font-display font-bold text-2xl mb-4">Frequency Engineering</h3>
                            <p className="text-black/50 leading-relaxed font-light">
                                Dynamic real-time synthesis of binaural protocols using advanced spectral smoothing for artifact-free neural stimulus.
                            </p>
                        </div>
                        <div className="group">
                            <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center text-white mb-8 group-hover:scale-110 group-hover:-rotate-6 transition-all duration-500 shadow-xl shadow-black/20">
                                <Target size={28} />
                            </div>
                            <h3 className="font-display font-bold text-2xl mb-4">Precision Targeting</h3>
                            <p className="text-black/50 leading-relaxed font-light">
                                From 40Hz Gamma for cognitive peak to 0.5Hz Delta for restorative cycles — every session is engineered for specific biomarkers.
                            </p>
                        </div>
                        <div className="group">
                            <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center text-white mb-8 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-xl shadow-black/20">
                                <Headphones size={28} />
                            </div>
                            <h3 className="font-display font-bold text-2xl mb-4">Adaptive Audio</h3>
                            <p className="text-black/50 leading-relaxed font-light">
                                Layers of generated pink or white noise and nature-based scapes adapt continuously to maintain state-stability and comfort.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Science / Research Section */}
            <section id="science" className="px-8 py-40 max-w-7xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-32 items-center">
                    <div className="order-2 lg:order-1 relative">
                        <div className="swiss-card p-1 aspect-[4/3] rounded-3xl shadow-inner relative overflow-hidden bg-black/5">
                            <div className="absolute inset-0 flex items-center justify-center opacity-20">
                                <Microscope size={300} strokeWidth={0.5} />
                            </div>

                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-full flex items-end gap-[2px] h-48 px-12">
                                    {[...Array(40)].map((_, i) => (
                                        <div
                                            key={i}
                                            className="flex-1 bg-black/10 rounded-t-full transition-all duration-1000"
                                            style={{
                                                height: `${30 + Math.sin(i * 0.5) * 40 + Math.random() * 20}%`,
                                                opacity: 0.2 + (i / 40) * 0.5
                                            }}
                                        ></div>
                                    ))}
                                </div>
                            </div>

                            <div className="absolute top-8 left-8">
                                <div className="text-[10px] uppercase tracking-[0.3em] font-bold text-black/30 mb-2">Neural Scan V.4</div>
                                <div className="h-[1px] w-20 bg-black/10"></div>
                            </div>
                        </div>

                        {/* Floater metrics */}
                        <div className="absolute -bottom-10 -right-6 md:-right-12 swiss-card p-8 shadow-2xl border border-white max-w-[240px]">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                                <span className="text-[10px] uppercase tracking-widest font-bold opacity-40">System Efficacy</span>
                            </div>
                            <div className="text-4xl font-display font-light mb-2">92<span className="text-xl font-bold font-sans">.4%</span></div>
                            <p className="text-[10px] uppercase tracking-widest leading-relaxed opacity-50">Mean increase in alpha-wave amplitude across clinical trials.</p>
                        </div>
                    </div>

                    <div className="order-1 lg:order-2 space-y-10">
                        <div className="inline-block px-3 py-1 bg-black/5 text-[9px] uppercase tracking-[0.3em] font-bold border-l-2 border-black">Research Documentation</div>
                        <h2 className="text-5xl md:text-7xl font-display font-light tracking-tight leading-tight">Founded on <br /><span className="font-bold">Neural Resonance</span></h2>
                        <p className="text-xl font-light text-black/50 leading-relaxed">
                            Our algorithms utilize the <span className="text-black font-semibold italic">Frequency Following Response</span> mechanism, synchronizing endogenous brain rhythms with calibrated external acoustic triggers.
                        </p>

                        <div className="space-y-6 pt-4">
                            {[
                                { title: 'Cognitive Optimization', desc: 'Beta/Gamma protocols for executive function.' },
                                { title: 'Therapeutic Recovery', desc: 'Theta/Delta protocols for rest and healing.' },
                                { title: 'Flow State Access', desc: 'Focused Alpha protocols for creativity.' }
                            ].map((item, idx) => (
                                <div key={idx} className="flex gap-5 items-start">
                                    <div className="text-[10px] font-bold opacity-30 pt-1">0{idx + 1}</div>
                                    <div>
                                        <h4 className="font-bold text-sm uppercase tracking-widest mb-1">{item.title}</h4>
                                        <p className="text-xs text-black/40 font-medium">{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Login Selection */}
            <section id="login" className="px-8 py-44 bg-black text-white relative overflow-hidden">
                {/* Visual accents for dark mode section */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-600/10 rounded-full blur-[160px] pointer-events-none"></div>
                <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[140px] pointer-events-none"></div>

                <div className="max-w-5xl mx-auto relative z-10">
                    <div className="text-center mb-24">
                        <h2 className="text-5xl md:text-7xl font-display font-light mb-6 tracking-tight">Access the <span className="font-bold">Portal</span></h2>
                        <p className="text-white/30 text-xs uppercase tracking-[0.4em]">Choose your operational gateway</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        {/* Clinician Card */}
                        <button
                            onClick={() => handleRoleSelect('clinician')}
                            className="group relative flex flex-col p-12 bg-white/5 border border-white/10 rounded-2xl transition-all duration-700 hover:bg-white hover:scale-[1.02] text-left items-start overflow-hidden shadow-2xl"
                        >
                            <div className="absolute top-0 right-0 p-8 opacity-0 group-hover:opacity-10 transition-opacity">
                                <Shield size={120} strokeWidth={1} />
                            </div>
                            <div className="w-14 h-14 bg-white/10 rounded-xl flex items-center justify-center mb-8 group-hover:bg-black group-hover:text-white transition-colors">
                                <Shield size={28} />
                            </div>
                            <h3 className="font-display font-bold text-3xl mb-4 group-hover:text-black transition-colors">Clinician Access</h3>
                            <p className="text-white/40 group-hover:text-black/60 leading-relaxed mb-10 transition-colors">
                                Administrative hub for session design, patient protocol management, and real-time clinical dashboards.
                            </p>
                            <div className="mt-auto flex items-center gap-3 text-[10px] uppercase tracking-[0.3em] font-bold group-hover:text-black transition-all">
                                <span>Authenticate Workspace</span>
                                <Zap size={12} className="group-hover:translate-x-1 transition-transform" />
                            </div>
                        </button>

                        {/* Patient Card */}
                        <button
                            onClick={() => handleRoleSelect('patient')}
                            className="group relative flex flex-col p-12 bg-white/5 border border-white/10 rounded-2xl transition-all duration-700 hover:bg-white hover:scale-[1.02] text-left items-start overflow-hidden shadow-2xl"
                        >
                            <div className="absolute top-0 right-0 p-8 opacity-0 group-hover:opacity-10 transition-opacity">
                                <User size={120} strokeWidth={1} />
                            </div>
                            <div className="w-14 h-14 bg-white/10 rounded-xl flex items-center justify-center mb-8 group-hover:bg-black group-hover:text-white transition-colors">
                                <User size={28} />
                            </div>
                            <h3 className="font-display font-bold text-3xl mb-4 group-hover:text-black transition-colors">Patient Experience</h3>
                            <p className="text-white/40 group-hover:text-black/60 leading-relaxed mb-10 transition-colors">
                                Therapeutic interface for active sessions, progress visualization, and personalized recovery modules.
                            </p>
                            <div className="mt-auto flex items-center gap-3 text-[10px] uppercase tracking-[0.3em] font-bold group-hover:text-black transition-all">
                                <span>Begin Experience</span>
                                <Layers size={12} className="group-hover:translate-x-1 transition-transform" />
                            </div>
                        </button>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="px-8 py-20 bg-white border-t border-black/5 relative z-10">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-12">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-black rounded text-white transform-gpu">
                            <BrainCircuit size={18} />
                        </div>
                        <span className="font-display font-bold text-sm tracking-tighter uppercase">NeuroFlow Labs</span>
                    </div>

                    <div className="flex flex-wrap justify-center gap-10 text-[9px] uppercase tracking-[0.3em] font-bold text-black/30">
                        <a href="#" className="hover:text-black transition-colors">Documentation</a>
                        <a href="#" className="hover:text-black transition-colors">Framework</a>
                        <a href="#" className="hover:text-black transition-colors">Security</a>
                        <a href="#" className="hover:text-black transition-colors">Legal</a>
                    </div>

                    <div className="text-[9px] text-black/20 uppercase tracking-[0.4em] font-bold">
                        &copy; 2025 • Quantum Resonance Group
                    </div>
                </div>
            </footer>

            <style>{`
                @keyframes fade-in {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes slide-up {
                    from { opacity: 0; transform: translateY(30px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in {
                    animation: fade-in 1.2s ease-out forwards;
                }
                .animate-slide-up {
                    animation: slide-up 1s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
                }
                
                #landing-container::-webkit-scrollbar {
                    width: 4px;
                }
                #landing-container::-webkit-scrollbar-track {
                    background: transparent;
                }
                #landing-container::-webkit-scrollbar-thumb {
                    background: rgba(0,0,0,0.1);
                    border-radius: 2px;
                }
                #landing-container::-webkit-scrollbar-thumb:hover {
                    background: rgba(0,0,0,0.2);
                }
            `}</style>
        </div>
    );
};

export default LoginPage;
