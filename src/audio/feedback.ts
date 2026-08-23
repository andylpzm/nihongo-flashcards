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

  /**
   * the gallery card reveal: a music box.
   *
   * timed to the reveal animation - the phrase climbs through the ~0.95s build,
   * the chord lands on the crest, and the pad rings out while the picture comes
   * through. CREST here must match the crest in the reveal keyframes.
   *
   * everything sits on a MAJOR PENTATONIC (C D E G A): no semitones and no
   * tritone, so overlapping notes cannot clash however the tails pile up.
   */
  playReveal(): void {
    this.init();
    const ctx = this.ctx;
    if (!ctx) return;

    const CREST = 0.95;
    const t0 = ctx.currentTime + 0.03;
    const PENT = [523.25, 587.33, 659.25, 783.99, 880.0];
    const pent = (i: number): number =>
      PENT[((i % 5) + 5) % 5]! * Math.pow(2, Math.floor(i / 5));
    const cents = (f: number, c: number): number => f * Math.pow(2, c / 1200);

    // one struck note. the music box character is in the envelope, not the
    // waveform: a fast attack, a drop to about a third, then a long soft tail.
    const ping = (t: number, freq: number, dur: number, vol: number, bright = 0.45): void => {
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.setValueAtTime(5200, t);
      lp.frequency.exponentialRampToValueAtTime(1100, t + dur * 0.7);
      lp.connect(ctx.destination);
      const parts: [number, number, OscillatorType][] = [
        [cents(freq, -3), 1, 'sine'],
        [cents(freq * 2, 5), bright * 0.5, 'sine'],
        [cents(freq * 3.01, -7), bright * 0.18, 'triangle'],
      ];
      for (const [f, amp, type] of parts) {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = type;
        o.frequency.value = f;
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(vol * amp, t + 0.006);
        g.gain.exponentialRampToValueAtTime(vol * amp * 0.33, t + 0.09);
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        o.connect(g).connect(lp);
        o.start(t);
        o.stop(t + dur + 0.05);
      }
    };

    // a breath of air under the climb, so it is not five bare notes
    const n = ctx.createBufferSource();
    const buf = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * (CREST + 0.2)), ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    n.buffer = buf;
    const air = ctx.createBiquadFilter();
    air.type = 'lowpass';
    air.frequency.setValueAtTime(300, t0);
    air.frequency.linearRampToValueAtTime(900, t0 + CREST * 0.7);
    const airGain = ctx.createGain();
    airGain.gain.setValueAtTime(0.0001, t0);
    airGain.gain.linearRampToValueAtTime(0.03, t0 + CREST * 0.55);
    airGain.gain.exponentialRampToValueAtTime(0.0001, t0 + CREST);
    n.connect(air).connect(airGain).connect(ctx.destination);
    n.start(t0);
    n.stop(t0 + CREST + 0.1);

    // the phrase winding up to the crest
    [0, 2, 4, 5, 7].forEach((step, i) => {
      const jitter = (Math.random() - 0.5) * 0.012;
      ping(t0 + i * (CREST / 5.4) + jitter, pent(step), 1.6, 0.11, 0.5);
    });
    // the chord it was heading for, on the crest
    [0, 2, 4, 7].forEach((step, i) => ping(t0 + CREST + i * 0.02, pent(step), 3.2, 0.13, 0.45));

    // and a bed underneath, ringing out while the picture comes through
    for (const [i, f] of [pent(-5), pent(-3), pent(0)].entries()) {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine';
      o.frequency.value = cents(f, i % 2 ? 4 : -4);
      g.gain.setValueAtTime(0.0001, t0 + CREST);
      g.gain.linearRampToValueAtTime(0.03, t0 + CREST + 1.2);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + CREST + 2.6);
      o.connect(g).connect(ctx.destination);
      o.start(t0 + CREST);
      o.stop(t0 + CREST + 2.7);
    }
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

  /** Grading "Forgot". A short descending two-tone buzz - the game-style
   * "missed it" cue. Deliberately distinct from playCorrect()'s rising pair,
   * and low enough not to feel like a scolding: forgetting a card is normal
   * and is exactly the signal the scheduler needs. */
  playMiss(): void {
    this.init();
    if (!this.ctx) return;

    const playNote = (freq: number, time: number, duration: number) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, time);

      gain.gain.setValueAtTime(0.05, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(time);
      osc.stop(time + duration);
    };

    const now = this.ctx.currentTime;
    playNote(233.08, now, 0.1); // Bb3
    playNote(174.61, now + 0.1, 0.22); // F3
  },

  /** chapter finale. longer and fuller than playSuccess - this one is meant
   * to land as an event, not an acknowledgement. */
  playFanfare(): void {
    this.init();
    if (!this.ctx) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;

    const note = (freq: number, time: number, duration: number, gainPeak: number, type: OscillatorType = 'sine') => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, time);
      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.exponentialRampToValueAtTime(gainPeak, time + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(time);
      osc.stop(time + duration);
    };

    // rising figure, then a held major chord underneath it
    const melody = [523.25, 659.25, 783.99, 1046.5, 1318.51];
    melody.forEach((freq, i) => note(freq, now + i * 0.09, 0.45, 0.05));

    const chordAt = now + melody.length * 0.09;
    [261.63, 329.63, 392.0, 523.25].forEach((freq) => note(freq, chordAt, 1.4, 0.035, 'triangle'));

    // a little shimmer on top so it reads as a reveal
    [1567.98, 2093.0].forEach((freq, i) => note(freq, chordAt + 0.12 + i * 0.08, 0.9, 0.015));
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
