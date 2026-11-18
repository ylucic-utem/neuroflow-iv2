
import React from 'react';
import { Info, ExternalLink, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { ClinicalProtocol } from '../types';

interface ProtocolCardProps {
    protocol: ClinicalProtocol;
    onApply: (protocol: ClinicalProtocol) => void;
}

const ProtocolCard: React.FC<ProtocolCardProps> = ({ protocol, onApply }) => {
    return (
        <div className="swiss-card p-0 flex flex-col overflow-hidden group">
            <div className="p-6 border-b border-black/5 bg-white/20">
                <div className="flex justify-between items-start mb-2">
                    <span className={`text-[9px] px-2 py-0.5 rounded-full uppercase tracking-tighter ${protocol.tier === 'evidence-supported' ? 'bg-emerald-500/10 text-emerald-700' : 'bg-amber-500/10 text-amber-700'
                        }`}>
                        {protocol.tier.replace('-', ' ')}
                    </span>
                    <span className="text-[10px] font-mono text-swiss-sub">{protocol.durationMinutes} MIN SESSION</span>
                </div>
                <h2 className="text-xl font-display font-bold mb-1">{protocol.name}</h2>
                <p className="text-sm text-swiss-sub mb-4">{protocol.ui_description}</p>

                <div className="flex flex-wrap gap-2 mb-4">
                    <div className="flex items-center gap-1 px-2 py-1 bg-black/5 rounded text-[10px] font-medium uppercase tracking-widest">
                        Carrier: {protocol.carrierFreq}Hz
                    </div>
                    <div className="flex items-center gap-1 px-2 py-1 bg-black/5 rounded text-[10px] font-medium uppercase tracking-widest">
                        Target: {protocol.beatFreq}Hz
                    </div>
                </div>

                <button
                    onClick={() => onApply(protocol)}
                    className="w-full py-3 bg-black text-white text-[10px] uppercase font-bold tracking-[0.2em] hover:bg-neutral-800 transition-colors"
                >
                    Apply Protocol Configuration
                </button>
            </div>

            <div className="p-6 flex-1 flex flex-col gap-6 bg-white/10">
                <section>
                    <div className="flex items-center gap-2 mb-3 text-swiss-sub">
                        <Info size={14} />
                        <h3 className="text-[10px] font-bold uppercase tracking-widest">Research Context</h3>
                    </div>
                    <div className="text-xs space-y-2">
                        <p><strong>Primary Study:</strong> {protocol.research.primary_study.authors} ({protocol.research.primary_study.year}), {protocol.research.primary_study.journal}</p>
                        <p><strong>Design:</strong> {protocol.research.primary_study.study_design}</p>
                        <p className="p-2 bg-emerald-500/5 rounded italic text-emerald-900 leading-relaxed border border-emerald-500/10">
                            " {protocol.research.primary_study.outcome} "
                        </p>
                        <div className="flex items-center gap-1 text-blue-500 hover:underline cursor-pointer">
                            <ExternalLink size={10} />
                            <a href={`https://doi.org/${protocol.research.primary_study.doi}`} target="_blank" rel="noreferrer">View on PubMed</a>
                        </div>
                    </div>
                </section>

                <div className="h-[1px] bg-black/5 w-full"></div>

                <section>
                    <div className="flex items-center gap-2 mb-3 text-swiss-sub">
                        <ShieldAlert size={14} className="text-amber-600" />
                        <h3 className="text-[10px] font-bold uppercase tracking-widest">Contraindications</h3>
                    </div>
                    <ul className="text-[11px] list-disc list-inside space-y-1 text-swiss-sub">
                        {protocol.research.contraindications.map((c: string, i: number) => (
                            <li key={i}>{c}</li>
                        ))}
                    </ul>
                </section>

                <div className="h-[1px] bg-black/5 w-full"></div>

                <section>
                    <div className="flex items-center gap-2 mb-2 text-swiss-sub">
                        <CheckCircle2 size={14} className="text-emerald-600" />
                        <h3 className="text-[10px] font-bold uppercase tracking-widest">Therapeutic Mechanism</h3>
                    </div>
                    <p className="text-[11px] leading-relaxed text-swiss-sub">
                        {protocol.research.mechanism}
                    </p>
                </section>
            </div>
        </div>
    );
};

export default ProtocolCard;
