

import React, { useEffect, useRef } from 'react';
import { audioEngine } from '../services/audioEngine';
import { DETERMINE_BAND } from '../constants';
import { BAND_COLORS } from '../types';

interface WaveformVisualizerProps {
  isPlaying: boolean;
  beatFreq: number; // Used for color determination
  carrierFreq: number; // Used for wave complexity/peaks
  className?: string;
}

// Increase for smoother liquid lines
const WAVE_RESOLUTION = 100; 

// Helper to convert Hex to RGB object for interpolation
const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 0, g: 0, b: 0 };
};

const WaveformVisualizer: React.FC<WaveformVisualizerProps> = ({ isPlaying, beatFreq, carrierFreq, className }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  
  // State for smooth color transition
  const colorRef = useRef({ r: 0, g: 0, b: 0 });
  const timeRef = useRef(0);
  const beatFreqRef = useRef(beatFreq);
  const carrierFreqRef = useRef(carrierFreq);

  useEffect(() => {
    beatFreqRef.current = beatFreq;
    carrierFreqRef.current = carrierFreq;
  }, [beatFreq, carrierFreq]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // High-DPI handling
    const resize = () => {
        const parent = canvas.parentElement;
        if(parent) {
            canvas.width = parent.clientWidth * window.devicePixelRatio;
            canvas.height = parent.clientHeight * window.devicePixelRatio;
            ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
            canvas.style.width = parent.clientWidth + "px";
            canvas.style.height = parent.clientHeight + "px";
        }
    };
    window.addEventListener('resize', resize);
    resize();

    // Data buffers
    const analyser = audioEngine.getAnalyser();
    const bufferLength = analyser ? analyser.frequencyBinCount : 1024;
    const dataArray = new Uint8Array(bufferLength);

    // Simple pseudo-noise function for liquid effect
    // Composes multiple sine waves to simulate Perlin-like motion
    const liquidNoise = (x: number, t: number, complexity: number) => {
        return (
            Math.sin(x * 2 + t) + 
            0.5 * Math.sin(x * 5 - t * 1.5) + 
            0.25 * Math.sin(x * 12 + t * 2.5 + complexity)
        );
    };

    const render = () => {
      if (!ctx || !canvas) return;
      
      const width = canvas.offsetWidth;
      const height = canvas.offsetHeight;
      const cy = height / 2;
      
      const currentBeat = beatFreqRef.current;
      const currentCarrier = carrierFreqRef.current;

      // Color Logic
      const band = DETERMINE_BAND(currentBeat);
      const targetHex = BAND_COLORS[band];
      const targetRgb = hexToRgb(targetHex);
      
      colorRef.current.r += (targetRgb.r - colorRef.current.r) * 0.05;
      colorRef.current.g += (targetRgb.g - colorRef.current.g) * 0.05;
      colorRef.current.b += (targetRgb.b - colorRef.current.b) * 0.05;
      const { r, g, b } = colorRef.current;

      // Clear Canvas (Preserve Transparency for Light/Dark modes)
      ctx.clearRect(0, 0, width, height);

      // Audio Data
      if (analyser && isPlaying) {
        analyser.getByteFrequencyData(dataArray);
      } else {
        for(let i=0; i<bufferLength; i++) dataArray[i] = 0;
      }
      
      // Calculate overall energy for pulsing
      let energy = 0;
      for(let i=0; i<100; i++) energy += dataArray[i];
      energy /= 100;
      const normalizedEnergy = energy / 255;

      timeRef.current += 0.005 + (normalizedEnergy * 0.01);

      // --- LIQUID WAVE DRAWING ---
      const drawFluidLayer = (opacity: number, scaleOffset: number, timeOffset: number) => {
          ctx.beginPath();
          
          const complexity = currentCarrier / 200; // Higher freq = more jagged

          for (let i = 0; i <= WAVE_RESOLUTION; i++) {
              const normX = i / WAVE_RESOLUTION;
              const x = normX * width;
              
              // Map audio data to curve
              const dataIdx = Math.floor(normX * 100);
              const audioVal = (dataArray[dataIdx] || 0) / 255;

              // Combined Noise Function
              const noise = liquidNoise(normX * (3 + complexity), timeRef.current + timeOffset, complexity);
              
              // Apply Envelope (taper at ends)
              const envelope = Math.sin(normX * Math.PI);
              
              const amplitude = (50 + (audioVal * 200) + (noise * 30)) * envelope * scaleOffset;
              
              const y = cy + (noise * amplitude * 0.5) - (audioVal * 50);

              if (i === 0) ctx.moveTo(x, y);
              else ctx.lineTo(x, y);
          }

          // Close shape for fill
          ctx.lineTo(width, height);
          ctx.lineTo(0, height);
          ctx.closePath();

          // Monochromatic Fill with different opacities
          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${opacity})`;
          // Source-over ensures it looks correct on both White (App) and Black (Fullscreen) backgrounds
          ctx.globalCompositeOperation = 'source-over'; 
          ctx.fill();
          
          // Optional: Add a very subtle stroke for definition
          if (opacity > 0.4) {
            ctx.lineWidth = 1;
            ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, 0.8)`;
            ctx.stroke();
          }
      };

      // BREATHING EFFECT: Pulse scale
      const breath = Math.sin(timeRef.current * 1.5) * 0.02;

      // Draw 3 Layers of the SAME color (No RGB split)
      // 1. Background Layer (Wide, very transparent)
      drawFluidLayer(0.1, 1.1 + breath, 0); 
      
      // 2. Mid Layer (Medium width, medium transparency)
      drawFluidLayer(0.2, 1.0, 0.5); 
      
      // 3. Foreground Layer (Sharp, more opaque)
      drawFluidLayer(0.5, 0.9 - breath, 1.0);

      animationRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [isPlaying]);

  return <canvas ref={canvasRef} className={`block ${className}`} />;
};

export default WaveformVisualizer;
