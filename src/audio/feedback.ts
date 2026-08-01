// ==================== PROGRAMMATIC FEEDBACK SOUNDS (WEB AUDIO API) ====================
export const FeedbackAudio = {
  ctx: null as AudioContext | null,

  init(): void {
    try {
      if (!this.ctx) {
        const AudioContextCtor =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        this.ctx = new AudioContextCtor();
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    } catch (e) {
      console.warn('Web Audio API is not supported or was blocked:', e);
    }
  },

  playFlip(): void {
    this.init();
    if (!this.ctx) return;

    const duration = 0.15; // 150ms
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    // Fill buffer with white noise friction source
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noiseNode = this.ctx.createBufferSource();
    noiseNode.buffer = buffer;

    // Bandpass filter to sculpt white noise into a paper "swish"
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.setValueAtTime(3.0, this.ctx.currentTime); // resonance Q
    filter.frequency.setValueAtTime(800, this.ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(1600, this.ctx.currentTime + duration);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

    noiseNode.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noiseNode.start(this.ctx.currentTime);
    noiseNode.stop(this.ctx.currentTime + duration);
  },

  playCorrect(): void {
    this.init();
    if (!this.ctx) return;

    const playNote = (freq: number, time: number, duration: number) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, time);

      gain.gain.setValueAtTime(0.05, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(time);
      osc.stop(time + duration);
    };

    const now = this.ctx.currentTime;
    playNote(659.25, now, 0.08); // E5
    playNote(880, now + 0.08, 0.25); // A5
  },

  playSuccess(): void {
    this.init();
    if (!this.ctx) return;

    const playNote = (freq: number, time: number, duration: number) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, time);

      gain.gain.setValueAtTime(0.04, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(time);
      osc.stop(time + duration);
    };

    const now = this.ctx.currentTime;
    playNote(523.25, now, 0.12); // C5
    playNote(659.25, now + 0.08, 0.12); // E5
    playNote(783.99, now + 0.16, 0.12); // G5
    playNote(1046.5, now + 0.24, 0.35); // C6
  },
};
