
import { useState, useEffect } from 'react';
import { ClinicalProtocol } from '../types';
import { loadPresets, mapJSONToClinicalProtocol, mapJSONToQuickPreset } from '../services/presetLoader';

export const usePresets = () => {
    const [clinicalProtocols, setClinicalProtocols] = useState<ClinicalProtocol[]>([]);
    const [quickPresets, setQuickPresets] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchPresets = async () => {
            try {
                const data = await loadPresets();

                const clinical = data.presets
                    .filter(p => p.type === 'clinical')
                    .map(mapJSONToClinicalProtocol);

                const quick = data.presets
                    .map(mapJSONToQuickPreset);

                setClinicalProtocols(clinical);
                setQuickPresets(quick);
            } catch (err) {
                console.error('Error fetching presets:', err);
                setError('Failed to load presets');
            } finally {
                setIsLoading(false);
            }
        };

        fetchPresets();
    }, []);

    return { clinicalProtocols, quickPresets, isLoading, error };
};
