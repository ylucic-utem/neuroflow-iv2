import React, { useEffect, useRef } from 'react';
import { Mic, ArrowUp, Activity } from 'lucide-react';
import { ChatMessage, AIRecommendation } from '../types';

interface ChatInterfaceProps {
  chatHistory: ChatMessage[];
  chatInput: string;
  isProcessing: boolean;
  onInputChange: (val: string) => void;
  onSend: () => void;
  onGenerateVoice: () => void;
  onApplyRecommendation: (rec: AIRecommendation) => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  chatHistory,
  chatInput,
  isProcessing,
  onInputChange,
  onSend,
  onGenerateVoice,
  onApplyRecommendation
}) => {
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className="swiss-card p-4 flex flex-col gap-3 h-[300px]">
      
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
        {chatHistory.filter(m => m.role !== 'system').length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                <Activity size={24} className="mb-2"/>
                <p className="text-xs">Describe patient state to generate settings...</p>
            </div>
        )}

        {chatHistory.map((msg, i) => {
             if (msg.role === 'system') return null; // Skip system messages for cleaner UI
             return (
              <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`max-w-[90%] rounded-sm p-3 text-xs leading-relaxed ${
                  msg.role === 'user' 
                  ? 'bg-black text-white' 
                  : 'bg-white/50 border border-white text-black'
                }`}>
                  <p>{msg.content}</p>
                  
                  {/* AI Actions */}
                  {msg.type === 'recommendation' && msg.recommendationData && (
                    <div className="mt-2 pt-2 border-t border-black/5">
                      <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[10px] opacity-70 mb-2">
                          <div>Freq: {msg.recommendationData.carrierHz}Hz</div>
                          <div>Beat: {msg.recommendationData.beatHz}Hz</div>
                      </div>
                      <button 
                        onClick={() => msg.recommendationData && onApplyRecommendation(msg.recommendationData)}
                        className="w-full py-1 bg-black/5 hover:bg-black/10 text-black text-[10px] font-medium uppercase tracking-wide rounded-sm transition-colors"
                      >
                        Apply
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
        })}
        <div ref={chatEndRef} />
      </div>

      {/* Input Area */}
      <div className="relative">
        <textarea 
          value={chatInput}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Describe patient condition..."
          className="w-full bg-white/50 border border-black/10 rounded-sm p-3 pr-10 text-sm focus:outline-none focus:border-black/30 focus:bg-white/80 resize-none h-20"
          disabled={isProcessing}
        />
        <div className="absolute bottom-2 right-2 flex gap-1">
             <button 
                onClick={onGenerateVoice}
                disabled={isProcessing}
                className="p-1.5 text-black/40 hover:text-black transition-colors rounded-sm hover:bg-black/5"
                title="Generate Voice Script"
            >
                <Mic size={14} />
            </button>
            <button 
                onClick={onSend}
                disabled={isProcessing}
                className="p-1.5 bg-black text-white rounded-sm hover:bg-black/80 transition-colors disabled:opacity-50"
            >
                {isProcessing ? <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <ArrowUp size={14} />}
            </button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;