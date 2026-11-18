import { useState, useRef } from 'react';
import { ChatMessage, AIRecommendation } from '../types';
import { getTherapyRecommendation, generateTherapeuticVoice } from '../services/geminiService';
import { audioEngine } from '../services/audioEngine';
import { DETERMINE_BAND } from '../constants';

export const useTherapyAssistant = () => {
  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    { role: 'system', content: "Welcome to NeuroFlow IV. I can help you configure the optimal settings based on your patient's condition.", timestamp: Date.now() }
  ]);
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  
  const sendMessage = async (userContent: string) => {
    if (!userContent.trim()) return;

    const userMsg: ChatMessage = { role: 'user', content: userContent, timestamp: Date.now() };
    setChatHistory(prev => [...prev, userMsg]);
    setChatInput("");
    setIsProcessingAI(true);

    try {
      const rec = await getTherapyRecommendation(userMsg.content);
      
      const aiMsg: ChatMessage = {
        role: 'assistant',
        content: `I recommend a ${rec.beatHz}Hz beat (${DETERMINE_BAND(rec.beatHz)}) with ${rec.carrierHz}Hz carrier. ${rec.explanation}`,
        timestamp: Date.now(),
        type: 'recommendation',
        recommendationData: rec
      };
      setChatHistory(prev => [...prev, aiMsg]);

    } catch (e) {
      const errorMsg: ChatMessage = { role: 'system', content: "Unable to connect to AI. Please check API settings.", type: 'error', timestamp: Date.now() };
      setChatHistory(prev => [...prev, errorMsg]);
    } finally {
      setIsProcessingAI(false);
    }
  };

  const generateVoice = async (currentBeatFreq: number) => {
    setIsProcessingAI(true);
    try {
      const band = DETERMINE_BAND(currentBeatFreq);
      const audioBuffer = await generateTherapeuticVoice(
        `Patient undergoing therapy. Current Brainwave Target: ${band}.`, 
        `Relaxation and ${band} state entrainment.`
      );
      
      await audioEngine.playVoice(audioBuffer);
      setChatHistory(prev => [...prev, { role: 'assistant', content: "Voice guidance generated and playing.", timestamp: Date.now() }]);
    } catch (e) {
      console.error(e);
      setChatHistory(prev => [...prev, { role: 'system', content: "Failed to generate voice guidance.", type: 'error', timestamp: Date.now() }]);
    } finally {
      setIsProcessingAI(false);
    }
  };

  const generateDeepener = async (currentBeatFreq: number) => {
      // Background process, don't block UI much
      try {
          const band = DETERMINE_BAND(currentBeatFreq);
          const audioBuffer = await generateTherapeuticVoice(
              `Patient is halfway through the session. They are in a ${band} state.`,
              `Deepening the state. Encourage them to go deeper into relaxation and trust the process. Very slow pace.`
          );
          await audioEngine.playVoice(audioBuffer);
      } catch (e) {
          console.error("Deepener failed", e);
      }
  };

  return {
    chatInput,
    setChatInput,
    chatHistory,
    isProcessingAI,
    sendMessage,
    generateVoice,
    generateDeepener
  };
};