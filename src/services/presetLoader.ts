
import { ClinicalProtocol, NoiseType, CarrierMode } from '../types';

export interface JSONPreset {
    id: string;
    type: 'clinical' | 'entrainment';
    state: string;
    target_band: string;
    carrier_frequency_hz: {
        left: number;
        right?: number;
        right_min?: number;
        right_max?: number;
        right_options?: number[];
    };
    beat_frequency_hz: number | { min: number; max: number } | number[];
    suggested_session_minutes: number;
    summary: string;
    therapeutic_mechanism: string;
    citations: Array<{
        title: string;
        authors: string;
        year: number;
        journal: string;
        url: string;
    }>;
}

export interface PresetsFile {
    presets: JSONPreset[];
    notes: any;
}

export const mapJSONToClinicalProtocol = (json: JSONPreset): ClinicalProtocol => {
    // Extract beat frequency
    let beatFreq = 0;
    if (typeof json.beat_frequency_hz === 'number') {
        beatFreq = json.beat_frequency_hz;
    } else if (Array.isArray(json.beat_frequency_hz)) {
        beatFreq = json.beat_frequency_hz[0];
    } else if (typeof json.beat_frequency_hz === 'object') {
        beatFreq = (json.beat_frequency_hz.min + json.beat_frequency_hz.max) / 2;
    }

    // Extract carrier frequency
    let carrierFreq = json.carrier_frequency_hz.left;

    return {
        id: json.id,
        name: json.state.charAt(0).toUpperCase() + json.state.slice(1),
        tier: json.type === 'clinical' ? 'evidence-supported' : 'theory-grounded',
        therapeutic_outcome: json.target_band,
        beatFreq: beatFreq,
        carrierFreq: carrierFreq,
        durationMinutes: json.suggested_session_minutes,
        research: {
            primary_study: {
                authors: json.citations[0]?.authors || 'Unknown',
                year: json.citations[0]?.year || 0,
                journal: json.citations[0]?.journal || 'Unknown',
                doi: json.citations[0]?.url || '', // Using URL as DOI if not present
                study_design: 'See citation',
                effect_size: 'N/A',
                outcome: json.summary
            },
            strength_of_evidence: 'Variable',
            contraindications: ['Standard binaural contraindications apply'],
            mechanism: json.therapeutic_mechanism
        },
        ui_description: json.summary,
        session_instructions: `Target: ${json.target_band}. Recommended for ${json.suggested_session_minutes} minutes.`
    };
};

export const mapJSONToQuickPreset = (json: JSONPreset) => {
    // Extract beat frequency
    let beatFreq = 0;
    if (typeof json.beat_frequency_hz === 'number') {
        beatFreq = json.beat_frequency_hz;
    } else if (Array.isArray(json.beat_frequency_hz)) {
        beatFreq = json.beat_frequency_hz[0];
    } else if (typeof json.beat_frequency_hz === 'object') {
        beatFreq = (json.beat_frequency_hz.min + json.beat_frequency_hz.max) / 2;
    }

    return {
        name: json.state.split(' ').slice(0, 2).join(' '),
        carrier: json.carrier_frequency_hz.left,
        beat: beatFreq,
        noise: NoiseType.Pink,
        carrierMode: CarrierMode.Pure,
        description: json.summary.slice(0, 50) + '...'
    };
};

export const loadPresets = async (): Promise<PresetsFile> => {
    const response = await fetch('/presets.json');
    if (!response.ok) {
        throw new Error('Failed to load presets.json');
    }
    return response.json();
};
