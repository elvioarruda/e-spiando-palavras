/**
 * Procedural Audio Synthesizer utilizing the Web Audio API. This ensures 100% offline functionality
 * without requiring any external MP3 or WAV files.
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioCtx;
}

/**
 * Procedural synth player
 */
export const AudioSynthesizer = {
  volume: 0.5, // Default volume (0.0 to 1.0)

  setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
  },

  playTone(frequency: number, type: OscillatorType, duration: number, delay = 0) {
    if (this.volume <= 0) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    if (ctx.state === "suspended") {
      ctx.resume();
    }

    setTimeout(() => {
      try {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();

        osc.connect(gainNode);
        gainNode.connect(ctx.destination);

        osc.type = type;
        osc.frequency.setValueAtTime(frequency, ctx.currentTime);

        // Standard logarithmic volume envelope to prevent clicking
        gainNode.gain.setValueAtTime(this.volume * 0.15, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + duration);

        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + duration);
      } catch (err) {
        console.warn("Failed to play audio tone:", err);
      }
    }, delay * 1000);
  },

  playSelect() {
    // Soft high pop
    this.playTone(880, "sine", 0.08);
  },

  playError() {
    // Low double buzz
    this.playTone(150, "sawtooth", 0.15);
    this.playTone(140, "sawtooth", 0.15, 0.08);
  },

  playSuccess() {
    // Joyful major arpeggio
    const baseFreq = 523.25; // C5
    this.playTone(baseFreq, "triangle", 0.25);
    this.playTone(baseFreq * 1.25, "triangle", 0.25, 0.06); // E5
    this.playTone(baseFreq * 1.5, "triangle", 0.25, 0.12); // G5
    this.playTone(baseFreq * 2.0, "triangle", 0.35, 0.18); // C6
  },

  playHint() {
    // Sweet thin bell
    this.playTone(1200, "sine", 0.3);
    this.playTone(1800, "sine", 0.2, 0.05);
  },

  playWin() {
    // Jubilant fanfarre arpeggio
    const base = 261.63; // C4
    const notes = [1, 1.25, 1.5, 2, 2.5, 3]; // ascending harmonic sequence
    notes.forEach((ratio, index) => {
      this.playTone(base * ratio * 2, "sine", 0.4, index * 0.08);
    });
    // Final sparkling sine chord
    setTimeout(() => {
      this.playTone(base * 4, "sine", 0.8, 0);
      this.playTone(base * 5, "sine", 0.8, 0.02);
      this.playTone(base * 6, "sine", 0.8, 0.04);
    }, 450);
  }
};
