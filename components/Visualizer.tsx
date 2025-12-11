import React from 'react';
import WaveformVisualizer from './WaveformVisualizer';
import ParticleVisualizer from './ParticleVisualizer';

interface VisualizerProps {
  beatFreq: number;
  carrierFreq: number;
  mode: 'waveform' | 'particles';
  isPlaying: boolean;
  className?: string;
}

const Visualizer: React.FC<VisualizerProps> = ({ beatFreq, carrierFreq, mode, isPlaying, className }) => {
  if (mode === 'particles') {
    return <ParticleVisualizer beatFreq={beatFreq} isPlaying={isPlaying} className={className} />;
  }
  
  return <WaveformVisualizer beatFreq={beatFreq} carrierFreq={carrierFreq} isPlaying={isPlaying} className={className} />;
};

export default Visualizer;