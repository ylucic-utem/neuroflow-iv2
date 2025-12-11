import React from 'react';
import { Activity, Play, Pause, Maximize2 } from 'lucide-react';

interface HeaderProps {
  isPlaying: boolean;
  onTogglePlay: () => void;
  onOpenPatientView: () => void;
}

const Header: React.FC<HeaderProps> = ({ isPlaying, onTogglePlay, onOpenPatientView }) => {
  return (
    <header className="flex-none h-16 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-6 z-10">
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center">
          <Activity className="text-white w-5 h-5" />
        </div>
        <div>
          <h1 className="text-lg font-bold tracking-tight text-white">NeuroFlow IV</h1>
          <span className="text-xs text-gray-500 font-mono">CLINICIAN CONTROL INTERFACE</span>
        </div>
      </div>

      <div className="flex items-center space-x-6">
         <button 
            onClick={onTogglePlay}
            className={`flex items-center space-x-2 px-6 py-2 rounded-full font-medium transition-all transform hover:scale-105 active:scale-95 ${isPlaying ? 'bg-red-500/10 text-red-400 border border-red-500/50' : 'bg-green-500/10 text-green-400 border border-green-500/50'}`}
         >
            {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
            <span>{isPlaying ? "STOP THERAPY" : "START THERAPY"}</span>
         </button>

         <div className="h-8 w-[1px] bg-gray-800"></div>

         <button 
           onClick={onOpenPatientView}
           className="text-gray-400 hover:text-white transition-colors flex items-center space-x-2"
           title="Open Patient View"
         >
           <Maximize2 size={20} />
           <span className="text-sm">Patient View</span>
         </button>
      </div>
    </header>
  );
};

export default Header;