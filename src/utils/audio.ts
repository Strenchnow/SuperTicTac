import { useState, useEffect } from 'react';

// Audio Synthesizer for 3D Ultimate Tic-Tac-Toe
// Synthesizes procedural sci-fi audio using the Web Audio API

class SoundManager {
  private ctx: AudioContext | null = null;
  private muted: boolean = false;
  private listeners: Set<(muted: boolean) => void> = new Set();
  private storageKey = 'super_ttt_muted';

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(this.storageKey);
        this.muted = saved === 'true';
      } catch {
        this.muted = false;
      }

      // Pre-bind gesture listener to unlock AudioContext
      const unlock = () => {
        this.ensureContext();
        window.removeEventListener('pointerdown', unlock);
        window.removeEventListener('keydown', unlock);
      };
      window.addEventListener('pointerdown', unlock, { once: true });
      window.addEventListener('keydown', unlock, { once: true });
    }
  }

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;

    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }

    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    return this.ctx;
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public setMuted(mute: boolean): void {
    this.muted = mute;
    try {
      localStorage.setItem(this.storageKey, String(mute));
    } catch {
      // Ignore storage errors
    }
    this.listeners.forEach((listener) => listener(this.muted));
  }

  public toggleMute(): boolean {
    this.setMuted(!this.muted);
    if (!this.muted) {
      // Play a quick confirmation click when unmuting
      this.playClick();
    }
    return this.muted;
  }

  public subscribe(listener: (muted: boolean) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // --- Sound Synthesizers ---

  /** Subtle soft sci-fi chime/tick for hovering cells */
  public playHover(): void {
    if (this.muted) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(1320, now + 0.04);

      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.05);
    } catch {
      // Ignore audio synthesis errors
    }
  }

  /** Punchy cybernetic placement sound */
  public playMove(player: 'X' | 'O'): void {
    if (this.muted) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      if (player === 'X') {
        // Player X: bright crystalline pulse at ~587Hz (D5) with harmonic sparkle
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        osc1.type = 'triangle';
        osc1.frequency.setValueAtTime(587.33, now); // D5
        osc1.frequency.exponentialRampToValueAtTime(880, now + 0.08);

        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(1174.66, now); // D6 harmonic sparkle
        osc2.frequency.exponentialRampToValueAtTime(1760, now + 0.06);

        filter.type = 'highpass';
        filter.frequency.setValueAtTime(300, now);

        gain.gain.setValueAtTime(0.22, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);

        osc1.connect(filter);
        osc2.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 0.22);
        osc2.stop(now + 0.22);
      } else {
        // Player O: warm resonant bassy chord at ~392Hz (G4) + low sub ~196Hz (G3)
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(392.0, now); // G4
        osc1.frequency.exponentialRampToValueAtTime(329.63, now + 0.25); // E4 slide down

        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(196.0, now); // G3 sub
        osc2.frequency.exponentialRampToValueAtTime(164.81, now + 0.28);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(900, now);

        gain.gain.setValueAtTime(0.26, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);

        osc1.connect(filter);
        osc2.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 0.28);
        osc2.stop(now + 0.28);
      }
    } catch {
      // Ignore audio synthesis errors
    }
  }

  /** Uplifting harmonic cyber arpeggio when a 3x3 sector is claimed */
  public playSectorWin(): void {
    if (this.muted) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      const noteDuration = 0.08;

      notes.forEach((freq, idx) => {
        const noteTime = now + idx * noteDuration;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, noteTime);

        gain.gain.setValueAtTime(0.18, noteTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, noteTime + 0.25);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(noteTime);
        osc.stop(noteTime + 0.25);
      });
    } catch {
      // Ignore audio synthesis errors
    }
  }

  /** Victorious fanfare cascade with delay/reverb emulation when full game is won */
  public playGameWin(): void {
    if (this.muted) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      // Echo / delay effect
      const delay = ctx.createDelay();
      delay.delayTime.setValueAtTime(0.18, now);

      const feedback = ctx.createGain();
      feedback.gain.setValueAtTime(0.35, now);

      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.25, now);

      delay.connect(feedback);
      feedback.connect(delay);
      delay.connect(masterGain);
      masterGain.connect(ctx.destination);

      // Heroic triumphant arpeggio sequence
      const melody = [
        { freq: 523.25, time: 0.0, dur: 0.15 }, // C5
        { freq: 659.25, time: 0.12, dur: 0.15 }, // E5
        { freq: 783.99, time: 0.24, dur: 0.15 }, // G5
        { freq: 1046.5, time: 0.36, dur: 0.22 }, // C6
        { freq: 880.0, time: 0.52, dur: 0.16 }, // A5
        { freq: 1046.5, time: 0.66, dur: 0.18 }, // C6
        { freq: 1318.51, time: 0.82, dur: 0.6 }, // E6 final glorious chord
        { freq: 1567.98, time: 0.82, dur: 0.6 }, // G6 harmony
      ];

      melody.forEach(({ freq, time, dur }) => {
        const noteStart = now + time;
        const osc = ctx.createOscillator();
        const noteGain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, noteStart);

        noteGain.gain.setValueAtTime(0.2, noteStart);
        noteGain.gain.exponentialRampToValueAtTime(0.0001, noteStart + dur);

        osc.connect(noteGain);
        noteGain.connect(masterGain);
        noteGain.connect(delay);

        osc.start(noteStart);
        osc.stop(noteStart + dur);
      });
    } catch {
      // Ignore audio synthesis errors
    }
  }

  /** Crisp UI button click */
  public playClick(): void {
    if (this.muted) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1400, now);
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.035);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.035);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.035);
    } catch {
      // Ignore audio synthesis errors
    }
  }

  /** Subtle low double-buzz for invalid/disallowed moves */
  public playInvalid(): void {
    if (this.muted) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const beeps = [now, now + 0.09];

      beeps.forEach((t) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(130, t);
        osc.frequency.exponentialRampToValueAtTime(95, t + 0.06);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(400, t);

        gain.gain.setValueAtTime(0.16, t);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        osc.start(t);
        osc.stop(t + 0.06);
      });
    } catch {
      // Ignore audio synthesis errors
    }
  }
}

export const soundManager = new SoundManager();

// Convenience helper exports
export const playHover = () => soundManager.playHover();
export const playMove = (player: 'X' | 'O') => soundManager.playMove(player);
export const playSectorWin = () => soundManager.playSectorWin();
export const playGameWin = () => soundManager.playGameWin();
export const playClick = () => soundManager.playClick();
export const playInvalid = () => soundManager.playInvalid();
export const toggleMute = () => soundManager.toggleMute();
export const isMuted = () => soundManager.isMuted();
export const setMuted = (muted: boolean) => soundManager.setMuted(muted);
export const subscribeAudioMute = (listener: (muted: boolean) => void) => soundManager.subscribe(listener);

/** React hook for tracking and toggling audio mute state */
export function useAudioState() {
  const [muted, setMutedState] = useState(() => soundManager.isMuted());

  useEffect(() => {
    return soundManager.subscribe((isMuted) => {
      setMutedState(isMuted);
    });
  }, []);

  const toggle = () => soundManager.toggleMute();

  return { muted, toggle, setMuted: (val: boolean) => soundManager.setMuted(val) };
}
