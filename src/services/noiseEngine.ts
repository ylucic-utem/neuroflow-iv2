
import { NoiseType, SpatialMode } from "../types";

export class NoiseEngine {
  private ctx: AudioContext | null = null;
  private noiseGain: GainNode | null = null;
  private noisePannerL: PannerNode | null = null;
  private noisePannerR: PannerNode | null = null;
  private activeNoiseNodes: AudioNode[] = [];
  private currentNoiseType: NoiseType = NoiseType.None;
  private nextEventTime: number = 0;
  private schedulerInterval: number | null = null;
  private currentSpatialMode: SpatialMode = SpatialMode.None;

  public init(ctx: AudioContext, masterGain: GainNode) {
    this.ctx = ctx;
    this.noiseGain = this.ctx.createGain();

    this.noisePannerL = this.ctx.createPanner();
    this.noisePannerL.panningModel = 'HRTF';
    this.noisePannerL.setPosition(-1, 0, 0);

    this.noisePannerR = this.ctx.createPanner();
    this.noisePannerR.panningModel = 'HRTF';
    this.noisePannerR.setPosition(1, 0, 0);

    this.noiseGain.connect(this.noisePannerL);
    this.noiseGain.connect(this.noisePannerR);

    this.noisePannerL.connect(masterGain);
    this.noisePannerR.connect(masterGain);
  }

  public setNoise(type: NoiseType) {
    this.currentNoiseType = type;
    this.stopNoise();

    if (type === NoiseType.None || !this.ctx || !this.noiseGain) return;

    this.spawnNoiseGenerator(type, -1);
    this.spawnNoiseGenerator(type, 1);

    if (type === NoiseType.Rain) {
      this.nextEventTime = this.ctx.currentTime;
      if (!this.schedulerInterval) {
        this.startScheduler();
      }
    }
  }

  public stopNoise() {
    this.activeNoiseNodes.forEach(node => {
      try {
        if (node instanceof AudioBufferSourceNode || node instanceof OscillatorNode) {
          node.stop();
        }
        node.disconnect();
      } catch (e) { }
    });
    this.activeNoiseNodes = [];
    if (this.schedulerInterval) {
      window.clearInterval(this.schedulerInterval);
      this.schedulerInterval = null;
    }
  }

  public setVolume(value: number, rampTime: number = 0.05) {
    if (!this.ctx || !this.noiseGain) return;
    const now = this.ctx.currentTime;
    // Essential for preventing zipper noise during fast slider movements:
    this.noiseGain.gain.cancelScheduledValues(now);
    this.noiseGain.gain.setTargetAtTime(value, now, rampTime);
  }

  public setSpatialMode(mode: SpatialMode) {
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

  public updateSpatialPositions(time: number) {
    if (!this.ctx || !this.noisePannerL || !this.noisePannerR || this.currentSpatialMode === SpatialMode.None) return;

    if (this.currentSpatialMode === SpatialMode.Circular3D) {
      const x = Math.sin(time * 0.2);
      const z = Math.cos(time * 0.2);
      this.noisePannerL.setPosition(x, 0, z);
      this.noisePannerR.setPosition(-x, 0, -z);
    } else if (this.currentSpatialMode === SpatialMode.Bilateral) {
      const x = Math.sin(time * 2.5);
      this.noisePannerL.setPosition(x, 0, 1);
      this.noisePannerR.setPosition(x, 0, 1);
    } else if (this.currentSpatialMode === SpatialMode.Vortex) {
      const speed = 0.3;
      const x = Math.cos(time * speed) * 2;
      const z = (Math.sin(time * speed * 2) / 2) * 2;
      const y = Math.sin(time * speed * 0.5) * 0.5;

      this.noisePannerL.setPosition(x, y, z);
      this.noisePannerR.setPosition(-x, -y, -z);
    }
  }

  private startScheduler() {
    if (this.schedulerInterval) clearInterval(this.schedulerInterval);
    this.schedulerInterval = window.setInterval(() => {
      this.scheduler();
    }, 500);
  }

  private scheduler() {
    if (!this.ctx) return;
    const scheduleAheadTime = 1.5;
    while (this.nextEventTime < this.ctx.currentTime + scheduleAheadTime) {
      if (this.currentNoiseType === NoiseType.Rain) {
        this.scheduleRainDroplet(this.nextEventTime);
        this.nextEventTime += (0.05 + Math.random() * 0.05);
      } else {
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

  private scheduleRainDroplet(time: number) {
    if (!this.ctx || !this.noisePannerL || !this.noisePannerR) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.frequency.value = 800 + Math.random() * 400;
    osc.type = 'sine';

    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(0.1 + Math.random() * 0.1, time + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);

    osc.connect(gain);
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
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
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
}

export const noiseEngine = new NoiseEngine();
