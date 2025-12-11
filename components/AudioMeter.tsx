import React, { useEffect, useRef } from 'react';
import { audioEngine } from '../services/audioEngine';

const AudioMeter: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Initialize data array with expected size (1024 bins for 2048 FFT)
    // We allocate this once to avoid garbage collection in the loop
    const dataArray = new Uint8Array(1024);

    const draw = () => {
      rafRef.current = requestAnimationFrame(draw);
      
      const width = canvas.width;
      const height = canvas.height;
      
      // Dynamic poll for analyser availability
      // This is crucial because AudioEngine initializes lazily on first user interaction
      const analyser = audioEngine.getAnalyser();
      
      let rms = 0;
      if (analyser) {
        analyser.getByteTimeDomainData(dataArray);
        
        // Calculate RMS (Root Mean Square) for volume level
        let sum = 0;
        // Optimization: sampling step to reduce loop overhead if array is huge, 
        // though 1024 is small enough for modern devices.
        for (let i = 0; i < dataArray.length; i++) {
          const val = (dataArray[i] - 128) / 128; // Normalize -1 to 1
          sum += val * val;
        }
        rms = Math.sqrt(sum / dataArray.length);
      }

      // Clear Canvas
      ctx.clearRect(0, 0, width, height);

      // Draw Background Track
      ctx.fillStyle = 'rgba(0,0,0,0.1)';
      ctx.fillRect(0, 0, width, height);

      if (rms > 0.01) {
          // Boost sensitivity for visual feedback since raw audio RMS is often low
          const displayRMS = Math.min(rms * 4, 1); 
          const barHeight = displayRMS * height; 
          
          // Color coding (Green -> Yellow -> Red)
          let color = '#22c55e'; // Green
          if (displayRMS > 0.6) color = '#eab308'; // Yellow
          if (displayRMS > 0.85) color = '#ef4444'; // Red

          // Draw Active Level (Bottom Up)
          ctx.fillStyle = color;
          ctx.fillRect(0, height - barHeight, width, barHeight);
      }
    };

    draw();

    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  return (
    <div className="flex flex-col items-center gap-1 w-full" title="Audio Confidence Meter">
        <canvas ref={canvasRef} width={8} height={40} className="rounded-sm bg-black/5" />
        <span className="text-[8px] font-mono text-swiss-sub uppercase">Lvl</span>
    </div>
  );
};

export default AudioMeter;