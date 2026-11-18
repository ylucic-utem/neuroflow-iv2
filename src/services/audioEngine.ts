

import { NoiseType, CarrierMode, SpatialMode } from "../types";
import { noiseEngine } from "./noiseEngine";

// Helper Interface for an Oscillator Bank (Fund, 5th, 8ve)
interface VoiceBank {
    nodes: AudioNode[];
    oscillators: OscillatorNode[];
    filters: BiquadFilterNode[];
    gain: GainNode;
    panner: PannerNode;
    // For Phase Locking
    amGain?: GainNode;
    amLFO?: OscillatorNode;
    amDepth?: GainNode;
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

    // Noise Engine is now external
    // Environmental Engine (Noise)
    private noiseGain: GainNode | null = null;
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
    private activeNodes: AudioNode[] = [];

    // State
    private isBinauralSpatial = false;
    private currentSpatialMode: SpatialMode = SpatialMode.None;
    private spatialAnimationId: number | null = null;
    private currentCarrierMode: CarrierMode = CarrierMode.Pure;
    private safetyMode: boolean = true;

    // Last known values for crossfade reference
    private lastCarrier: number = 200;
    private lastBeat: number = 10;

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

        // Initialize Noise Engine
        noiseEngine.init(this.ctx, this.masterGain);

        // Voice Bus
        this.voiceGain = this.ctx.createGain();
        this.voiceGain.connect(this.masterGain);
        // Add voice reverb
        this.voiceGain.connect(this.convolver);

        // Mobile Background Audio Keeper
        this.silentAudioElement = new Audio("data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA");
        this.silentAudioElement.loop = true;

        this.isInitialized = true;
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

        this.silentAudioElement?.play().catch(() => { });

        // Fade in
        this.fadeIn(1.0);

        // Force restart oscillators to ensure clean state
        this.updateOscillatorBanks(200, 10);

        if (!this.isoLFO && this.ctx) {
            this.isoLFO = this.ctx.createOscillator();
            this.isoLFO.start();
        }
        this.updateIsochronicPulse();
        this.updateBreathingGuide();

        // Start Loops
        this.startSpatialLoop();
    }

    public stop() {
        this.fadeOut(0.5).then(() => {
            this.stopBanks();
            noiseEngine.stopNoise();

            this.activeNodes.forEach(node => {
                try { node.disconnect(); } catch (e) { }
            });
            this.activeNodes = [];

            if (this.ctx) this.ctx.suspend();
            this.silentAudioElement?.pause();
        });
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
            if (this.leftBank) {
                // Crossfade to new mode
                this.crossfadeOscillatorBanks(this.lastCarrier, this.lastBeat, 1.5);
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
            if (this.leftBank) {
                this.crossfadeOscillatorBanks(this.lastCarrier, this.lastBeat, 1.0);
            }
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
                try { this.breathingLFO.stop(); } catch (e) { }
                this.breathingLFO.disconnect();
                this.breathingLFO = null;
            }
            this.breathingGain.gain.setTargetAtTime(1.0, this.ctx.currentTime, 0.5);
        }
    }

    public async fadeIn(duration: number = 2) {
        if (!this.ctx || !this.masterGain) return;
        const now = this.ctx.currentTime;
        this.masterGain.gain.cancelScheduledValues(now);
        this.masterGain.gain.setValueAtTime(0, now);
        this.masterGain.gain.linearRampToValueAtTime(0.8, now + duration);
    }

    private registerNode(node: AudioNode) {
        this.activeNodes.push(node);
        return node;
    }

    // #3A: Enhanced Drone Synthesis
    private createVoiceBank(channel: 'left' | 'right', fundFreq: number, beat: number): VoiceBank | null {
        if (!this.ctx || !this.isoGateGain) return null;

        const bankGain = this.ctx.createGain();
        bankGain.gain.value = this.currentCarrierMode === CarrierMode.Harmonic ? 0.2 : 0.6;

        let amGain: GainNode | undefined;
        let amLFO: OscillatorNode | undefined;
        let amDepth: GainNode | undefined;

        if (this.isPhaseLocking) {
            amGain = this.ctx.createGain();
            amGain.gain.value = 0.9;
            amLFO = this.ctx.createOscillator();
            amLFO.frequency.value = beat;
            amLFO.type = 'sine';
            amDepth = this.ctx.createGain();
            amDepth.gain.value = 0.1;
            amLFO.connect(amDepth);
            amDepth.connect(amGain.gain);
            amLFO.start();
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
        const filters: BiquadFilterNode[] = [];

        const addOsc = (freqMultiplier: number, type: OscillatorType = 'sine', detuneCents: number = 0) => {
            if (!this.ctx) return;
            const osc = this.ctx.createOscillator();
            osc.type = type;
            const targetFreq = channel === 'left' ? (fundFreq * freqMultiplier) : (fundFreq * freqMultiplier) + beat;
            osc.frequency.value = targetFreq;
            osc.detune.value = detuneCents;

            if (this.currentCarrierMode === CarrierMode.Soft) {
                const filter = this.ctx.createBiquadFilter();
                filter.type = 'lowpass';
                filter.frequency.value = targetFreq * 2.5;
                filter.Q.value = 0.7; // Standard clinical-grade damping
                osc.connect(filter);
                filter.connect(bankGain);
                filters.push(filter);
                nodes.push(filter);
            } else {
                osc.connect(bankGain);
            }

            osc.start();
            oscillators.push(osc);
            nodes.push(osc);
        };

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

        return { nodes, oscillators, filters, gain: bankGain, panner, amGain, amLFO, amDepth };
    }

    private getClosestSolfeggio(freq: number): number {
        return SOLFEGGIO_FREQS.reduce((prev, curr) =>
            Math.abs(curr - freq) < Math.abs(prev - freq) ? curr : prev
        );
    }

    private updateOscillatorBanks(carrier: number, beat: number, rampDuration: number = 0.1) {
        // Therapeutic Range Clamping
        const safeCarrier = Math.max(20, Math.min(20000, carrier));
        const safeBeat = Math.max(0.5, Math.min(40, beat));

        this.lastCarrier = safeCarrier;
        this.lastBeat = safeBeat;

        if (!this.leftBank || !this.rightBank) {
            const effectiveCarrier = this.currentCarrierMode === CarrierMode.Solfeggio ? this.getClosestSolfeggio(safeCarrier) : safeCarrier;
            this.leftBank = this.createVoiceBank('left', effectiveCarrier, safeBeat);
            this.rightBank = this.createVoiceBank('right', effectiveCarrier, safeBeat);
            return;
        }

        const now = this.ctx!.currentTime;
        const endTime = now + rampDuration;
        const effectiveCarrier = this.currentCarrierMode === CarrierMode.Solfeggio ? this.getClosestSolfeggio(safeCarrier) : safeCarrier;

        const updateBank = (bank: VoiceBank, isRight: boolean) => {
            bank.oscillators.forEach((osc, idx) => {
                let mult = 1.0;
                if (this.currentCarrierMode === CarrierMode.Harmonic) {
                    if (idx === 2) mult = 1.5;
                    if (idx === 3) mult = 2.0;
                }
                if (this.currentCarrierMode === CarrierMode.Solfeggio && idx === 1) mult = 0.5;

                const targetFreq = isRight ? (effectiveCarrier * mult) + safeBeat : (effectiveCarrier * mult);
                osc.frequency.linearRampToValueAtTime(targetFreq, endTime);

                // Synchronized Filter & Q Ramping
                if (bank.filters[idx]) {
                    bank.filters[idx].frequency.linearRampToValueAtTime(targetFreq * 2.5, endTime);
                    bank.filters[idx].Q.setTargetAtTime(0.7, now, 0.1);
                }
            });

            if (bank.amLFO) bank.amLFO.frequency.linearRampToValueAtTime(safeBeat, endTime);
        };

        updateBank(this.leftBank, false);
        updateBank(this.rightBank, true);
        if (this.isoLFO) this.isoLFO.frequency.linearRampToValueAtTime(beat, endTime);
    }

    public async crossfadeOscillatorBanks(carrier: number, beat: number, fadeDuration: number = 2) {
        if (!this.ctx || !this.isInitialized) return;

        const oldLeft = this.leftBank;
        const oldRight = this.rightBank;
        this.lastCarrier = carrier;
        this.lastBeat = beat;

        const effectiveCarrier = this.currentCarrierMode === CarrierMode.Solfeggio ? this.getClosestSolfeggio(carrier) : carrier;
        const newLeft = this.createVoiceBank('left', effectiveCarrier, beat);
        const newRight = this.createVoiceBank('right', effectiveCarrier, beat);

        if (!newLeft || !newRight) return;

        const now = this.ctx.currentTime;
        const endTime = now + fadeDuration;

        if (oldLeft) {
            oldLeft.gain.gain.cancelScheduledValues(now);
            oldLeft.gain.gain.setValueAtTime(oldLeft.gain.gain.value, now);
            oldLeft.gain.gain.exponentialRampToValueAtTime(0.001, endTime);
        }
        if (oldRight) {
            oldRight.gain.gain.cancelScheduledValues(now);
            oldRight.gain.gain.setValueAtTime(oldRight.gain.gain.value, now);
            oldRight.gain.gain.exponentialRampToValueAtTime(0.001, endTime);
        }

        const targetGain = this.currentCarrierMode === CarrierMode.Harmonic ? 0.2 : 0.6;
        newLeft.gain.gain.setValueAtTime(0, now);
        newLeft.gain.gain.linearRampToValueAtTime(targetGain, endTime);
        newRight.gain.gain.setValueAtTime(0, now);
        newRight.gain.gain.linearRampToValueAtTime(targetGain, endTime);

        this.leftBank = newLeft;
        this.rightBank = newRight;

        setTimeout(() => {
            this.destroyBank(oldLeft);
            this.destroyBank(oldRight);
        }, (fadeDuration * 1000) + 100);
    }

    private destroyBank(bank: VoiceBank | null) {
        if (!bank) return;
        bank.oscillators.forEach(osc => { try { osc.stop(); } catch (e) { } osc.disconnect(); });
        bank.nodes.forEach(node => { try { node.disconnect(); } catch (e) { } });
        if (bank.amLFO) { try { bank.amLFO.stop(); } catch (e) { } bank.amLFO.disconnect(); }
        if (bank.amGain) bank.amGain.disconnect();
        bank.panner.disconnect();
        bank.gain.disconnect();
    }

    private stopBanks(fadeDuration: number = 0.5) {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const endTime = now + fadeDuration;

        const fadeAndStop = (bank: VoiceBank | null) => {
            if (!bank) return;
            bank.gain.gain.cancelScheduledValues(now);
            bank.gain.gain.exponentialRampToValueAtTime(0.001, endTime);
            setTimeout(() => this.destroyBank(bank), fadeDuration * 1000 + 50);
        };

        fadeAndStop(this.leftBank);
        fadeAndStop(this.rightBank);
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
        // Optimization: Use crossfading instead of immediate switch to prevent zipper noise
        this.crossfadeOscillatorBanks(carrier, beat, 0.05);
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

        try { this.isoLFO.disconnect(); } catch (e) { }

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

    public setVolume(type: 'master' | 'binaural' | 'noise' | 'voice', value: number, rampTime: number = 0.05) {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;

        const applyRamp = (node: GainNode | null | undefined) => {
            if (!node) return;
            node.gain.cancelScheduledValues(now);
            node.gain.setTargetAtTime(value, now, rampTime);
        };

        switch (type) {
            case 'master': applyRamp(this.masterGain); break;
            case 'binaural': applyRamp(this.binauralGain); break;
            case 'noise': noiseEngine.setVolume(value, rampTime); break;
            case 'voice': applyRamp(this.voiceGain); break;
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
        noiseEngine.setSpatialMode(mode);
    }

    private startSpatialLoop() {
        const animate = () => {
            if (this.ctx && this.currentSpatialMode !== SpatialMode.None) {
                const time = this.ctx.currentTime;
                noiseEngine.updateSpatialPositions(time);
            }
            this.spatialAnimationId = requestAnimationFrame(animate);
        };
        this.spatialAnimationId = requestAnimationFrame(animate);
    }

    public setNoise(type: NoiseType) {
        this.currentNoiseType = type;
        noiseEngine.setNoise(type);
    }

    public async playVoice(audioBuffer: ArrayBuffer) {
        if (!this.ctx || !this.voiceGain) return;
        if (this.activeVoiceSource) {
            try { this.activeVoiceSource.stop(); } catch (e) { }
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