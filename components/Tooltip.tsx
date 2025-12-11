
import React, { useState } from 'react';
import { Info } from 'lucide-react';
import { ENABLE_TOOLTIPS } from '../constants';

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  side?: 'top' | 'bottom';
}

const Tooltip: React.FC<TooltipProps> = ({ content, children, side = 'top' }) => {
  const [isVisible, setIsVisible] = useState(false);

  if (!ENABLE_TOOLTIPS) {
    return <>{children}</>;
  }

  return (
    <div 
      className="relative flex items-center group cursor-help"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      
      {isVisible && (
        <div className={`absolute z-50 w-48 p-2 bg-gray-900/95 backdrop-blur text-white text-[10px] leading-relaxed rounded border border-white/10 shadow-xl pointer-events-none transition-opacity duration-200 ${side === 'top' ? 'bottom-full mb-2 left-1/2 -translate-x-1/2' : 'top-full mt-2 left-1/2 -translate-x-1/2'}`}>
            {content}
            {/* Arrow */}
            <div className={`absolute left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 border-r border-b border-white/10 transform rotate-45 ${side === 'top' ? '-bottom-1' : '-top-1'}`}></div>
        </div>
      )}
    </div>
  );
};

export default Tooltip;
