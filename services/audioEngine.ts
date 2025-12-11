

import { NoiseType, CarrierMode, SpatialMode } from "../types";

// Helper Interface for an Oscillator Bank (Fund, 5th, 8ve)
interface VoiceBank {
    nodes: AudioNode[];
    oscillators: OscillatorNode[];
    gain: GainNode;
    panner: PannerNode;
    // For Phase Locking
    amGain?: GainNode;
    amLFO?: OscillatorNode;
}

const SOLFEGGIO_FREQS = [174, 285, 396, 417, 528, 639, 741, 852, 963];

class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private analyser: AnalyserNode | null = null;
  
  // Reverb
  private convolver: ConvolverNode | null = null;
  private reverbGain: GainNode | null = null;

  // Binaural & Isochronic Nodes
  private leftBank: VoiceBank | null = null;
  private rightBank: VoiceBank | null = null;
  private binauralGain: GainNode | null = null;
  
  // Isochronic Pulse Engine
  private isoGateGain: GainNode | null = null; 
  private isoLFO: OscillatorNode | null = null;
  private isoAmount: number = 0; 
  
  // Neural Phase Locking
  private isPhaseLocking: boolean = false;

  // Environmental Engine (Noise)
  private noiseGain: GainNode | null = null;
  // We now use two panners for decorrelated stereo noise (Left/Right)
  private noisePannerL: PannerNode | null = null; 
  private noisePannerR: PannerNode | null = null;
  private activeNoiseNodes: AudioNode[] = []; 
  
  // Scheduler for procedural audio (Rain/Wind)
  private nextEventTime: number = 0;
  private schedulerInterval: number | null = null;
  private currentNoiseType: NoiseType = NoiseType.None;

  // Breathing Guide Engine
  private breathingGain: GainNode | null = null;
  private breathingLFO: OscillatorNode | null = null;
  private breathingGuideActive: boolean = false;

  // Voice/TTS Nodes
  private voiceGain: GainNode | null = null;
  private activeVoiceSource: AudioBufferSourceNode | null = null;

  // Mobile Background Audio Keeper
  private silentAudioElement: HTMLAudioElement | null = null;

  private isInitialized = false;
  
  // State
  private isBinauralSpatial = false;
  private currentSpatialMode: SpatialMode = SpatialMode.None;
  private spatialAnimationId: number | null = null;
  private currentCarrierMode: CarrierMode = CarrierMode.Pure;
  private safetyMode: boolean = true;

  constructor() {
    // Lazy init in start()
  }

  public async init() {
    if (this.isInitialized) return;
    
    this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Master Chain
    this.masterGain = this.ctx.createGain();
    
    // Breathing Guide Insertion
    this.breathingGain = this.ctx.createGain();
    this.masterGain.connect(this.breathingGain);

    this.analyser = this.ctx.createAnalyser();
    this.analyser.smoothingTimeConstant = 0.8;
    this.analyser.fftSize = 2048;
    
    this.breathingGain.connect(this.analyser);
    this.analyser.connect(this.ctx.destination);

    // #3A: Convolution Reverb Setup (Atmospheric Drone Layer)
    this.convolver = this.ctx.createConvolver();
    this.reverbGain = this.ctx.createGain();
    this.reverbGain.gain.value = 0.3; // 30% Wet
    this.convolver.buffer = this.createImpulseResponse(2.5, 2.0); // 2.5s tail
    this.convolver.connect(this.reverbGain);
    this.reverbGain.connect(this.masterGain);

    // Binaural Bus
    this.binauralGain = this.ctx.createGain();
    
    // Isochronic Gate (The "Pulse" effect)
    this.isoGateGain = this.ctx.createGain(); 
    this.isoGateGain.gain.value = 1; 
    this.isoGateGain.connect(this.binauralGain);
    this.binauralGain.connect(this.masterGain);
    
    // Send Binaural to Reverb for "Drone" texture
    this.binauralGain.connect(this.convolver);

    // Initialize Pulse LFO
    this.isoLFO = this.ctx.createOscillator();
    this.isoLFO.type = 'sine';
    this.isoLFO.start();

    // Noise Bus
    this.noiseGain = this.ctx.createGain();
    
    // #1B: Stereo Decorrelated Panners
    this.noisePannerL = this.ctx.createPanner();
    this.noisePannerL.panningModel = 'HRTF';
    this.noisePannerL.setPosition(-1, 0, 0); // Hard Left
    
    this.noisePannerR = this.ctx.createPanner();
    this.noisePannerR.panningModel = 'HRTF';
    this.noisePannerR.setPosition(1, 0, 0); // Hard Right

    this.noiseGain.connect(this.noisePannerL);
    this.noiseGain.connect(this.noisePannerR);
    
    this.noisePannerL.connect(this.masterGain);
    this.noisePannerR.connect(this.masterGain);

    // Voice Bus
    this.voiceGain = this.ctx.createGain();
    this.voiceGain.connect(this.masterGain);
    // Add voice reverb
    this.voiceGain.connect(this.convolver);

    // Mobile Background Audio Keeper
    this.silentAudioElement = new Audio("data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA");
    this.silentAudioElement.loop = true;

    this.isInitialized = true;
    this.startSpatialLoop();
  }

  // #3A: Synthetic Impulse Response for Reverb
  private createImpulseResponse(duration: number, decay: number): AudioBuffer {
    const rate = this.ctx!.sampleRate;
    const length = rate * duration;
    const impulse = this.ctx!.createBuffer(2, length, rate);
    const left = impulse.getChannelData(0);
    const right = impulse.getChannelData(1);

    for (let i = 0; i < length; i++) {
        const n = i / length;
        // Exponential decay
        const e = Math.pow(1 - n, decay);
        left[i] = (Math.random() * 2 - 1) * e;
        right[i] = (Math.random() * 2 - 1) * e;
    }
    return impulse;
  }

  public async start() {
    if (!this.isInitialized) await this.init();
    if (this.ctx?.state === 'suspended') {
      await this.ctx.resume();
    }
    
    this.silentAudioElement?.play().catch(() => {});

    // Fade in
    if (this.masterGain && this.ctx) {
        this.masterGain.gain.cancelScheduledValues(this.ctx.currentTime);
        this.masterGain.gain.setValueAtTime(0, this.ctx.currentTime);
    }

    // Force restart oscillators to ensure clean state
    this.updateOscillatorBanks(200, 10); 
    
    if (!this.isoLFO && this.ctx) {
        this.isoLFO = this.ctx.createOscillator();
        this.isoLFO.start();
    }
    this.updateIsochronicPulse();
    this.updateBreathingGuide();

    // Start Scheduler
    this.nextEventTime = this.ctx!.currentTime + 0.1;
    this.startScheduler();
  }

  public stop() {
    this.stopBanks();
    this.stopNoise();
    if (this.ctx) this.ctx.suspend();
    this.silentAudioElement?.pause();
    
    if (this.schedulerInterval) {
        window.clearInterval(this.schedulerInterval);
        this.schedulerInterval = null;
    }
  }

  public async fadeOut(duration: number = 2) {
      if (!this.ctx || !this.masterGain) return;
      const now = this.ctx.currentTime;
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
      this.masterGain.gain.linearRampToValueAtTime(0, now + duration);
      return new Promise<void>(resolve => setTimeout(resolve, duration * 1000));
  }

  public setCarrierMode(mode: CarrierMode) {
      if (this.currentCarrierMode !== mode) {
          this.currentCarrierMode = mode;
          if (this.leftBank && this.leftBank.oscillators.length > 0) {
             this.stopBanks(); 
          }
      }
  }

  public setSafetyMode(enabled: boolean) {
      this.safetyMode = enabled;
      this.updateIsochronicPulse(); // Re-calc depths
  }

  public setPhaseLocking(enabled: boolean) {
      if (this.isPhaseLocking !== enabled) {
          this.isPhaseLocking = enabled;
          // Re-create banks to insert/remove AM nodes
          if (this.leftBank) this.stopBanks();
      }
  }

  public setBreathingGuide(enabled: boolean) {
      this.breathingGuideActive = enabled;
      this.updateBreathingGuide();
  }

  private updateBreathingGuide() {
      if (!this.ctx || !this.breathingGain) return;

      if (this.breathingGuideActive) {
          if (!this.breathingLFO) {
              this.breathingLFO = this.ctx.createOscillator();
              this.breathingLFO.type = 'sine';
              this.breathingLFO.frequency.value = 0.1; // 6 breaths per minute (10s cycle)
              
              const lfoGain = this.ctx.createGain();
              lfoGain.gain.value = 0.15; // Modulate volume by +/- 15%
              
              this.breathingLFO.connect(lfoGain);
              lfoGain.connect(this.breathingGain.gain);
              this.breathingLFO.start();
              
              this.registerNode(this.breathingLFO);
              this.registerNode(lfoGain);
              
              // Set base gain slightly lower so modulation doesn't clip
              this.breathingGain.gain.setTargetAtTime(0.85, this.ctx.currentTime, 0.5);
          }
      } else {
          if (this.breathingLFO) {
              try { this.breathingLFO.stop(); } catch(e){}
              this.breathingLFO.disconnect();
              this.breathingLFO = null;
          }
          this.breathingGain.gain.setTargetAtTime(1.0, this.ctx.currentTime, 0.5);
      }
  }

  // #3A: Enhanced Drone Synthesis
  private createVoiceBank(channel: 'left' | 'right', fundFreq: number, beat: number): VoiceBank | null {
    if (!this.ctx || !this.isoGateGain) return null;

    const bankGain = this.ctx.createGain();
    // Adjust gain based on density
    bankGain.gain.value = this.currentCarrierMode === CarrierMode.Harmonic ? 0.2 : 0.6;

    // --- NEURAL PHASE LOCKING (AM Modulation) ---
    // Instead of connecting nodes directly to bankGain, we might go through an AM node first if enabled.
    // However, to keep it simple, we can modulate bankGain directly if we want the whole bank to pulse.
    // BUT, for phase locking, we want the pulse to match the beat frequency.
    let amGain: GainNode | undefined;
    let amLFO: OscillatorNode | undefined;
    
    if (this.isPhaseLocking) {
        // Create a wrapper gain for AM
        amGain = this.ctx.createGain();
        amGain.gain.value = 0.9; // Base volume
        
        // Create LFO
        amLFO = this.ctx.createOscillator();
        amLFO.frequency.value = beat; // Lock to beat freq
        amLFO.type = 'sine';
        
        const amDepth = this.ctx.createGain();
        amDepth.gain.value = 0.1; // 10% depth
        
        amLFO.connect(amDepth);
        amDepth.connect(amGain.gain);
        amLFO.start();

        // Connect chain: Nodes -> bankGain -> amGain -> Panner
        bankGain.connect(amGain);
    } 

    const panner = this.ctx.createPanner();
    this.setupPanner(panner, channel === 'left' ? -1 : 1);

    if (amGain) {
        amGain.connect(panner);
    } else {
        bankGain.connect(panner);
    }
    panner.connect(this.isoGateGain);

    const nodes: AudioNode[] = [];
    const oscillators: OscillatorNode[] = [];

    // Helper: Add oscillator with detune
    const addOsc = (freqMultiplier: number, type: OscillatorType = 'sine', detuneCents: number = 0) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        osc.type = type;
        
        const targetFreq = channel === 'left' 
            ? (fundFreq * freqMultiplier) 
            : (fundFreq * freqMultiplier) + beat;

        osc.frequency.value = targetFreq;
        osc.detune.value = detuneCents;

        // Filter for Soft Mode
        if (this.currentCarrierMode === CarrierMode.Soft) {
            const filter = this.ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.value = targetFreq * 2.5; 
            osc.connect(filter);
            filter.connect(bankGain);
            nodes.push(filter);
        } else {
            osc.connect(bankGain);
        }
        
        osc.start();
        oscillators.push(osc);
        nodes.push(osc);
    };

    // --- SYNTHESIS STRATEGIES ---
    if (this.currentCarrierMode === CarrierMode.Harmonic) {
        addOsc(1.0, 'sawtooth', -5);
        addOsc(1.0, 'sawtooth', 5);
        addOsc(1.5, 'sine', 0);
        addOsc(2.0, 'triangle', 0);
    } else if (this.currentCarrierMode === CarrierMode.Soft) {
        addOsc(1.0, 'triangle', -8);
        addOsc(1.0, 'triangle', 0);
        addOsc(1.0, 'triangle', 8);
    } else if (this.currentCarrierMode === CarrierMode.Solfeggio) {
        addOsc(1.0, 'sine', 0);
        const subOsc = this.ctx.createOscillator();
        const subGain = this.ctx.createGain();
        subOsc.frequency.value = (channel === 'left' ? fundFreq : fundFreq + beat) * 0.5; 
        subGain.gain.value = 0.1;
        subOsc.connect(subGain);
        subGain.connect(bankGain);
        subOsc.start();
        oscillators.push(subOsc);
        nodes.push(subGain);
    } else {
        addOsc(1.0, 'sine');
    }

    return { nodes, oscillators, gain: bankGain, panner, amGain, amLFO };
  }

  private getClosestSolfeggio(freq: number): number {
      return SOLFEGGIO_FREQS.reduce((prev, curr) => 
        Math.abs(curr - freq) < Math.abs(prev - freq) ? curr : prev
      );
  }

  private updateOscillatorBanks(carrier: number, beat: number, rampDuration: number = 0.1) {
      if (!this.leftBank || !this.rightBank) {
          this.stopBanks();
          const effectiveCarrier = this.currentCarrierMode === CarrierMode.Solfeggio 
             ? this.getClosestSolfeggio(carrier) 
             : carrier;

          this.leftBank = this.createVoiceBank('left', effectiveCarrier, beat);
          this.rightBank = this.createVoiceBank('right', effectiveCarrier, beat);
          return;
      }

      const now = this.ctx!.currentTime;
      const endTime = now + rampDuration;

      const effectiveCarrier = this.currentCarrierMode === CarrierMode.Solfeggio 
          ? this.getClosestSolfeggio(carrier) 
          : carrier;

      // Helper to update a bank
      const updateBank = (bank: VoiceBank, isRight: boolean) => {
          bank.oscillators.forEach((osc, idx) => {
             let mult = 1.0;
             if (this.currentCarrierMode === CarrierMode.Harmonic) {
                if (idx >= 2) mult = 1.5; 
                if (idx >= 3) mult = 2.0; 
                if (idx === 2) mult = 1.5;
                if (idx === 3) mult = 2.0;
             }
             if (this.currentCarrierMode === CarrierMode.Solfeggio) {
                 if (idx === 1) mult = 0.5; // Sub osc
             }
             
             const targetBase = effectiveCarrier * mult;
             const targetFreq = isRight ? targetBase + beat : targetBase;
             
             osc.frequency.linearRampToValueAtTime(targetFreq, endTime);

             if (this.currentCarrierMode === CarrierMode.Soft && bank.nodes[idx] instanceof BiquadFilterNode) {
                 (bank.nodes[idx] as BiquadFilterNode).frequency.linearRampToValueAtTime(targetFreq * 2.5, endTime);
             }
          });
          
          // Update Phase Locking AM
          if (bank.amLFO) {
              bank.amLFO.frequency.linearRampToValueAtTime(beat, endTime);
          }
      };

      if (this.leftBank) updateBank(this.leftBank, false);
      if (this.rightBank) updateBank(this.rightBank, true);

      if (this.isoLFO) {
          this.isoLFO.frequency.linearRampToValueAtTime(beat, endTime);
      }
  }

  private stopBanks() {
      const stopBank = (bank: VoiceBank | null) => {
          if (!bank) return;
          bank.oscillators.forEach(osc => {
              try { osc.stop(); } catch(e){}
              osc.disconnect();
          });
          bank.nodes.forEach(node => {
            try { node.disconnect(); } catch(e){}
          });
          if (bank.amLFO) {
              try { bank.amLFO.stop(); } catch(e){}
              bank.amLFO.disconnect();
          }
          if (bank.amGain) bank.amGain.disconnect();
          
          bank.panner.disconnect();
          bank.gain.disconnect();
      };
      stopBank(this.leftBank);
      stopBank(this.rightBank);
      this.leftBank = null;
      this.rightBank = null;
  }

  private setupPanner(panner: PannerNode, xDir: number) {
      if (this.isBinauralSpatial) {
          panner.panningModel = 'HRTF';
          panner.distanceModel = 'inverse';
          panner.refDistance = 1;
          panner.maxDistance = 10000;
          panner.setPosition(xDir, 0, 0); 
      } else {
          panner.panningModel = 'equalpower';
          panner.setPosition(xDir, 0, 0); 
      }
  }

  public setFrequencies(carrier: number, beat: number) {
    if (!this.ctx) return;
    this.updateOscillatorBanks(carrier, beat, 0.1);
  }

  public scheduleRamp(startCarrier: number, startBeat: number, endCarrier: number, endBeat: number, duration: number) {
      if (!this.ctx) return;
      this.updateOscillatorBanks(startCarrier, startBeat, 0); 
      this.updateOscillatorBanks(endCarrier, endBeat, duration); 
  }

  public setIsochronicPulse(amount: number) {
      this.isoAmount = amount;
      this.updateIsochronicPulse();
  }

  private updateIsochronicPulse() {
    if (!this.ctx || !this.isoGateGain || !this.isoLFO) return;
    
    try { this.isoLFO.disconnect(); } catch(e) {}
    
    if (this.isoAmount <= 0.01) {
        this.isoGateGain.gain.setTargetAtTime(1, this.ctx.currentTime, 0.1);
        return;
    }

    const effectiveAmount = this.safetyMode ? Math.min(this.isoAmount, 0.5) : this.isoAmount;
    const baseGain = 1 - (effectiveAmount * 0.5);
    this.isoGateGain.gain.setTargetAtTime(baseGain, this.ctx.currentTime, 0.1);
    
    const modGain = this.ctx.createGain();
    modGain.gain.value = effectiveAmount * 0.5; 
    
    this.isoLFO.connect(modGain);
    modGain.connect(this.isoGateGain.gain);
  }

  public setVolume(type: 'master' | 'binaural' | 'noise' | 'voice', value: number, rampTime: number = 0.1) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    switch(type) {
      case 'master': this.masterGain?.gain.setTargetAtTime(value, now, rampTime); break;
      case 'binaural': this.binauralGain?.gain.setTargetAtTime(value, now, rampTime); break;
      case 'noise': this.noiseGain?.gain.setTargetAtTime(value, now, rampTime); break;
      case 'voice': this.voiceGain?.gain.setTargetAtTime(value, now, rampTime); break;
    }
  }

  public setBinauralSpatial(isEnabled: boolean) {
      this.isBinauralSpatial = isEnabled;
      if (this.leftBank && this.rightBank) {
          this.setupPanner(this.leftBank.panner, -1);
          this.setupPanner(this.rightBank.panner, 1);
      }
  }

  public setNoiseSpatialMode(mode: SpatialMode) {
      this.currentSpatialMode = mode;
      
      if (!this.noisePannerL || !this.noisePannerR) return;

      if (mode === SpatialMode.None) {
          this.noisePannerL.panningModel = 'equalpower';
          this.noisePannerR.panningModel = 'equalpower';
          this.noisePannerL.setPosition(-1, 0, 0); 
          this.noisePannerR.setPosition(1, 0, 0);
      } else {
          this.noisePannerL.panningModel = 'HRTF';
          this.noisePannerR.panningModel = 'HRTF';
      }
  }

  private startSpatialLoop() {
      const animate = () => {
          if (this.ctx && this.noisePannerL && this.noisePannerR && this.currentSpatialMode !== SpatialMode.None) {
              const time = this.ctx.currentTime;
              
              if (this.currentSpatialMode === SpatialMode.Circular3D) {
                  const x = Math.sin(time * 0.2); 
                  const z = Math.cos(time * 0.2);
                  this.noisePannerL.setPosition(x, 0, z);
                  this.noisePannerR.setPosition(-x, 0, -z); 
              } else if (this.currentSpatialMode === SpatialMode.Bilateral) {
                  // Gentle EMDR Scanning
                  const x = Math.sin(time * 2.5); 
                  this.noisePannerL.setPosition(x, 0, 1);
                  this.noisePannerR.setPosition(x, 0, 1); 
              } else if (this.currentSpatialMode === SpatialMode.Vortex) {
                  // Figure-8 Infinity Loop for Disengagement (Vortex Mode)
                  // x = cos(t), z = sin(2t) / 2
                  const speed = 0.3;
                  const x = Math.cos(time * speed) * 2;
                  const z = (Math.sin(time * speed * 2) / 2) * 2;
                  // Add subtle vertical movement (y) for full 3D feel
                  const y = Math.sin(time * speed * 0.5) * 0.5;

                  this.noisePannerL.setPosition(x, y, z);
                  this.noisePannerR.setPosition(-x, -y, -z);
              }
          }
          this.spatialAnimationId = requestAnimationFrame(animate);
      };
      this.spatialAnimationId = requestAnimationFrame(animate);
  }

  // --- PROCEDURAL ENVIRONMENTAL ENGINE ---
  // Re-written to use Lookahead Scheduling to prevent background throttling
  
  public setNoise(type: NoiseType) {
    this.currentNoiseType = type;
    this.stopNoise(); // Stop existing loops
    
    if (type === NoiseType.None || !this.ctx || !this.noiseGain) return;

    // Start Loops immediately
    this.spawnNoiseGenerator(type, -1);
    this.spawnNoiseGenerator(type, 1);

    // If Scheduler is needed (Rain/Wind bursts), ensure it is running
    if (type === NoiseType.Rain) {
        this.nextEventTime = this.ctx.currentTime;
        if (!this.schedulerInterval) {
            this.startScheduler();
        }
    }
  }

  // Uses setInterval only to check if we need to schedule audio events in the AudioContext timeline.
  // This is safe for background tabs because we schedule ~1.5s ahead.
  private startScheduler() {
      if (this.schedulerInterval) clearInterval(this.schedulerInterval);
      this.schedulerInterval = window.setInterval(() => {
          this.scheduler();
      }, 500); // Check every 500ms
  }

  private scheduler() {
      if (!this.ctx) return;
      // Schedule events up to 1.5 seconds ahead
      const scheduleAheadTime = 1.5;
      while (this.nextEventTime < this.ctx.currentTime + scheduleAheadTime) {
          if (this.currentNoiseType === NoiseType.Rain) {
              this.scheduleRainDroplet(this.nextEventTime);
              // Random interval between droplets
              this.nextEventTime += (0.05 + Math.random() * 0.05);
          } else {
              // Other types just advance time to avoid infinite loop if logic fails
              this.nextEventTime += 1.0; 
          }
      }
  }
  
  private spawnNoiseGenerator(type: NoiseType, panSign: number) {
      if (!this.ctx || !this.noiseGain) return;
      const destination = panSign === -1 ? this.noisePannerL : this.noisePannerR;
      if (!destination) return;

      if (type === NoiseType.Rain) {
           this.createRainLoop(destination);
      } else if (type === NoiseType.Wind) {
           this.createWindEnvironment(destination);
      } else if (type === NoiseType.Stream) {
           this.createStreamEnvironment(destination);
      } else {
           this.createStaticNoise(type, destination);
      }
  }

  private stopNoise() {
    this.activeNoiseNodes.forEach(node => {
        try { 
            if (node instanceof AudioBufferSourceNode || node instanceof OscillatorNode) {
                node.stop();
            }
            node.disconnect(); 
        } catch(e) {}
    });
    this.activeNoiseNodes = [];
  }

  private registerNode(node: AudioNode) {
      this.activeNoiseNodes.push(node);
      return node;
  }

  private createWindEnvironment(destination: AudioNode) {
      if (!this.ctx) return;
      const buffer = this.createNoiseBuffer(NoiseType.Pink);
      const source = this.ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.Q.value = 1;
      filter.frequency.value = 400; 
      const lfo = this.ctx.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.value = 0.15 + (Math.random() * 0.05); 
      const lfoGain = this.ctx.createGain();
      lfoGain.gain.value = 300; 
      lfo.connect(lfoGain);
      lfoGain.connect(filter.frequency);
      source.connect(filter);
      filter.connect(destination);
      source.start();
      lfo.start();
      this.registerNode(source); this.registerNode(filter); this.registerNode(lfo); this.registerNode(lfoGain);
  }

  private createStreamEnvironment(destination: AudioNode) {
      if (!this.ctx) return;
      const buffer = this.createNoiseBuffer(NoiseType.Brown);
      const source = this.ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
      const hpFilter = this.ctx.createBiquadFilter();
      hpFilter.type = 'highpass';
      hpFilter.frequency.value = 400; 
      const lpFilter = this.ctx.createBiquadFilter();
      lpFilter.type = 'lowpass';
      lpFilter.frequency.value = 1200; 
      const modLfo = this.ctx.createOscillator();
      modLfo.type = 'sine';
      modLfo.frequency.value = 3 + (Math.random()); 
      const modGain = this.ctx.createGain();
      modGain.gain.value = 0.3; 
      const streamGain = this.ctx.createGain();
      streamGain.gain.value = 0.7;
      source.connect(hpFilter); hpFilter.connect(lpFilter); lpFilter.connect(streamGain);
      modLfo.connect(modGain); modGain.connect(streamGain.gain);
      streamGain.connect(destination);
      source.start(); modLfo.start();
      this.registerNode(source); this.registerNode(hpFilter); this.registerNode(lpFilter); this.registerNode(modLfo); this.registerNode(modGain); this.registerNode(streamGain);
  }

  // Background rain layer (consistent noise)
  private createRainLoop(destination: AudioNode) {
      if (!this.ctx) return;
      const bgBuffer = this.createNoiseBuffer(NoiseType.Pink);
      const bgSource = this.ctx.createBufferSource();
      bgSource.buffer = bgBuffer;
      bgSource.loop = true;
      const bgGain = this.ctx.createGain();
      bgGain.gain.value = 0.4;
      bgSource.connect(bgGain);
      bgGain.connect(destination);
      bgSource.start();
      this.registerNode(bgSource); this.registerNode(bgGain);
  }

  // Individual Droplet Scheduler
  private scheduleRainDroplet(time: number) {
      if (!this.ctx || !this.noisePannerL || !this.noisePannerR) return;
      
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.frequency.value = 800 + Math.random() * 400; 
      osc.type = 'sine';
      
      // Envelope
      gain.gain.setValueAtTime(0, time);
      gain.gain.linearRampToValueAtTime(0.1 + Math.random() * 0.1, time + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);
      
      osc.connect(gain);
      
      // Randomly assign to left or right panner for spatial spread
      const dest = Math.random() > 0.5 ? this.noisePannerL : this.noisePannerR;
      gain.connect(dest);
      
      osc.start(time);
      osc.stop(time + 0.2);
  }

  private createStaticNoise(type: NoiseType, destination: AudioNode) {
      if (!this.ctx) return;
      const buffer = this.createNoiseBuffer(type);
      const source = this.ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;

      if (type === NoiseType.Pink || type === NoiseType.Brown) {
          const filter = this.ctx.createBiquadFilter();
          filter.type = 'lowpass';
          filter.frequency.value = type === NoiseType.Pink ? 800 : 400;
          
          const lfo = this.ctx.createOscillator();
          lfo.type = 'sine';
          lfo.frequency.value = 0.05 + Math.random() * 0.05; 
          const lfoGain = this.ctx.createGain();
          lfoGain.gain.value = 200; 
          
          lfo.connect(lfoGain);
          lfoGain.connect(filter.frequency);
          lfo.start();
          this.registerNode(lfo); this.registerNode(lfoGain); this.registerNode(filter);

          source.connect(filter);
          filter.connect(destination);
      } else {
          source.connect(destination);
      }
      
      source.start();
      this.registerNode(source);
  }

  private createNoiseBuffer(type: NoiseType): AudioBuffer {
      const bufferSize = 2 * (this.ctx?.sampleRate || 44100);
      const buffer = this.ctx!.createBuffer(1, bufferSize, this.ctx!.sampleRate);
      const output = buffer.getChannelData(0);

      if (type === NoiseType.Pink) {
          let b0=0, b1=0, b2=0, b3=0, b4=0, b5=0, b6=0;
          for (let i = 0; i < bufferSize; i++) {
              const white = Math.random() * 2 - 1;
              b0 = 0.99886 * b0 + white * 0.0555179;
              b1 = 0.99332 * b1 + white * 0.0750759;
              b2 = 0.96900 * b2 + white * 0.1538520;
              b3 = 0.86650 * b3 + white * 0.3104856;
              b4 = 0.55000 * b4 + white * 0.5329522;
              b5 = -0.7616 * b5 - white * 0.0168980;
              output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
              output[i] *= 0.11;
              b6 = white * 0.115926;
          }
      } else if (type === NoiseType.Brown || type === NoiseType.Stream) { 
          let lastOut = 0;
          for (let i = 0; i < bufferSize; i++) {
              const white = Math.random() * 2 - 1;
              output[i] = (lastOut + (0.02 * white)) / 1.02;
              lastOut = output[i];
              output[i] *= 3.5;
          }
      } else {
          for (let i = 0; i < bufferSize; i++) {
              output[i] = Math.random() * 2 - 1;
          }
      }
      return buffer;
  }

  public async playVoice(audioBuffer: ArrayBuffer) {
    if (!this.ctx || !this.voiceGain) return;
    if (this.activeVoiceSource) {
      try { this.activeVoiceSource.stop(); } catch(e){}
      this.activeVoiceSource.disconnect();
    }
    try {
        const decoded = await this.ctx.decodeAudioData(audioBuffer);
        const source = this.ctx.createBufferSource();
        source.buffer = decoded;
        source.connect(this.voiceGain);
        source.start();
        this.activeVoiceSource = source;
    } catch (e) {
        console.error("Error playing voice:", e);
    }
  }

  public getAnalyser() {
    return this.analyser;
  }
}

export const audioEngine = new AudioEngine();