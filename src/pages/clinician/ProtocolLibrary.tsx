
import React from 'react';
import { useAudio } from '../../contexts/AudioContext';
import ProtocolCard from '../../components/ProtocolCard';

const ProtocolLibrary: React.FC = () => {
    const { updateSettings, setDurationMinutes, clinicalProtocols, isPresetsLoading } = useAudio();

    const handleApply = (protocol: any) => {
        updateSettings({
            carrierFreq: protocol.carrierFreq,
            beatFreq: protocol.beatFreq,
            isRamping: false,
        });
        setDurationMinutes(protocol.durationMinutes || 20);
        alert(`Protocol "${protocol.name}" applied successfully.`);
    };

    if (isPresetsLoading) {
        return (
            <div className="p-10 flex items-center justify-center h-full">
                <div className="animate-pulse text-swiss-sub tracking-widest uppercase text-xs">Loading Protocol Library...</div>
            </div>
        );
    }

    return (
        <div className="p-10 flex flex-col gap-8 h-full">
            <header>
                <h1 className="text-3xl font-display font-light">Clinical <span className="font-bold">Protocols</span></h1>
                <p className="text-swiss-sub text-xs uppercase tracking-widest mt-1">Evidence-Based Neuro-Acoustic Interventions</p>
            </header>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 overflow-y-auto pr-4">
                {clinicalProtocols.map((protocol) => (
                    <ProtocolCard key={protocol.id} protocol={protocol} onApply={handleApply} />
                ))}
            </div>
        </div>
    );
};

export default ProtocolLibrary;
