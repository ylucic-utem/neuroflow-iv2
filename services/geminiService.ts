

import { GoogleGenAI, Type, Modality } from "@google/genai";
import { KNOWLEDGE_BASE_SUMMARY } from "../constants";
import { AIRecommendation, NoiseType, CarrierMode, SpatialMode } from "../types";

// NOTE: process.env.API_KEY is assumed to be available
const getAIClient = () => {
    if (!process.env.API_KEY) {
        console.error("API Key missing");
        throw new Error("API Key missing");
    }
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const getTherapyRecommendation = async (userInput: string): Promise<AIRecommendation> => {
  const ai = getAIClient();
  const timeContext = new Date().toLocaleTimeString();
  const hour = new Date().getHours();

  const prompt = `
    You are an expert Neuro-Acoustic Clinician for NeuroFlow IV.
    Analyze the patient's condition described by the user and configure the audio engine using the Knowledge Base.
    
    Current Time: ${timeContext} (${hour}:00).
    
    CIRCADIAN RULES (CRITICAL):
    1. Morning (06:00 - 12:00): Bias towards Beta (Alertness) or Low Gamma.
    2. Afternoon (12:00 - 17:00): Bias towards Alpha/Theta (Restorative Focus).
    3. Evening/Night (17:00+): Bias towards Delta/Theta (Sleep & Deep Relax).
    4. SAFETY: NEVER recommend Beta/Gamma after 18:00 (6 PM) unless explicitly requested for "Night Shift" work.

    KNOWLEDGE_BASE:
    ${KNOWLEDGE_BASE_SUMMARY}
    
    CLINICAL RULES:
    1. Carrier Frequency: BIAS towards 400Hz - 450Hz (Auditory Brainstem Response), unless 'Solfeggio' frequencies (e.g. 528Hz) are specifically requested for "healing".
    2. Noise: Prefer 'Pink' or 'Brown' noise for pain/anxiety over 'White' (which can raise cortisol).
    3. Safety: 
       - If trauma/PTSD/anxiety: Suggest spatialMode: 'bilateral' (Gentle Panning), but ONLY if safe.
       - If user needs deep disassociation: Suggest spatialMode: 'vortex' (Figure-8 Infinity Loop).
       - If user mentions "seizures" or "epilepsy": isochronicAmount MUST be 0.
    4. Headphones:
       - If user implies NO headphones (e.g. "I'm lying on a pillow"): Use isochronicAmount > 0.5 to create monaural beats.
    5. Protocol:
       - Sleep/Insomnia: Enable ramping (Start: User State -> End: Delta).
       - Meditation: Use carrierMode: 'harmonic'.
       - Deep Focus: Enable phaseLocking (Amplitude Modulation) for stronger entrainment.

    User Input: "${userInput}"

    Return a JSON object matching the schema.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          carrierHz: { type: Type.NUMBER },
          beatHz: { type: Type.NUMBER },
          noiseType: { type: Type.STRING },
          explanation: { type: Type.STRING },
          recommendedDurationMin: { type: Type.NUMBER },
          // Advanced Params
          carrierMode: { type: Type.STRING, enum: ['pure', 'soft', 'harmonic', 'solfeggio'] },
          spatialMode: { type: Type.STRING, enum: ['none', '3d', 'bilateral', 'vortex'] },
          isochronicAmount: { type: Type.NUMBER, description: "0.0 to 1.0" },
          phaseLocking: { type: Type.BOOLEAN },
          isRamping: { type: Type.BOOLEAN },
          rampStartHz: { type: Type.NUMBER },
          rampEndHz: { type: Type.NUMBER }
        },
        required: ['carrierHz', 'beatHz', 'noiseType', 'explanation', 'carrierMode', 'spatialMode'],
      }
    }
  });

  const text = response.text;
  if (!text) throw new Error("No response from AI");
  
  const data = JSON.parse(text);
  
  // Normalize Enums safely
  let noise = NoiseType.None;
  if (data.noiseType?.toLowerCase().includes('white')) noise = NoiseType.White;
  if (data.noiseType?.toLowerCase().includes('pink')) noise = NoiseType.Pink;
  if (data.noiseType?.toLowerCase().includes('brown')) noise = NoiseType.Brown;
  if (data.noiseType?.toLowerCase().includes('rain')) noise = NoiseType.Rain;
  if (data.noiseType?.toLowerCase().includes('wind')) noise = NoiseType.Wind;
  if (data.noiseType?.toLowerCase().includes('stream')) noise = NoiseType.Stream;

  return {
    carrierHz: data.carrierHz,
    beatHz: data.beatHz,
    noiseType: noise,
    explanation: data.explanation,
    recommendedDurationMin: data.recommendedDurationMin || 20,
    
    // New Advanced Fields
    carrierMode: data.carrierMode as CarrierMode || CarrierMode.Pure,
    spatialMode: data.spatialMode as SpatialMode || SpatialMode.None,
    isochronicAmount: data.isochronicAmount || 0,
    phaseLocking: data.phaseLocking || false,
    isRamping: data.isRamping || false,
    rampStartHz: data.rampStartHz || data.beatHz,
    rampEndHz: data.rampEndHz || data.beatHz,
  };
};

export const generateTherapeuticVoice = async (context: string, targetState: string): Promise<ArrayBuffer> => {
    const ai = getAIClient();
    
    const scriptPrompt = `
      Write a very short, soothing, hypnotic induction script (2-3 sentences max) for a patient.
      Context: ${context}
      Target State: ${targetState}
      Language: English.
      Tone: Calm, reassuring, slow.
    `;

    const scriptResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: scriptPrompt,
    });
    
    const scriptText = scriptResponse.text;
    if (!scriptText) throw new Error("Could not generate script");

    const ttsResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-preview-tts',
        contents: {
            parts: [{ text: scriptText }]
        },
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
                voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: 'Kore' }
                }
            }
        }
    });

    const base64Audio = ttsResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) throw new Error("No audio generated");

    const binaryString = atob(base64Audio);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
};